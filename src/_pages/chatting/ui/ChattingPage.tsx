'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import {
  ChatLeaveDialog,
  ChatReportDialog,
  ChatRoomWebSocketConnection,
  ChatSatisfactionDialog,
  type ChatReportDialogSubmitPayload,
  type SubmitChatReportPayload,
  type ChatSatisfactionDialogSubmitPayload,
  type ChatSatisfactionParticipant,
  type ChatRoomWebSocketConnectionValue,
  useChatRatingMutation,
  useChatReportMutation,
} from '@/features/chatting';
import type { ChatWebSocketMessage, SettlementAnalysisFinishedMessage } from '@/entities/chat';
import { useLeaveCarpoolMutation } from '@/features/leave-carpool';
import { useLeaveCompanionMutation } from '@/features/leave-companion';
import {
  submitTransferProof,
  submitMeterImage,
  settlementQueries,
  SettlementTransferProofDialog,
  SettlementMeterImageDialog,
  TaxiMeterAnalysisDialog,
  TaxiMeterAmountDialog,
  TransferConfirmationAnalysisDialog,
  TransferConfirmationRecognitionFailedDialog,
  uploadSettlementImage,
  updateSettlementAmount,
  useCompleteSettlementMutation,
} from '@/features/taxi-pot-settlement';
import { getAccessToken } from '@/entities/auth';
import {
  createTaxiPotChatEntryMessages,
  getLatestTaxiPotRideAction,
  isTaxiPotRideActionMessage,
  TaxiPotAnnouncement,
  TaxiPotRideActionNotice,
  taxiPotQueries,
  type TaxiPotChatEntryMessage,
  type TaxiPotDetailData,
  type TaxiPotRideAction,
  type TaxiPotStatus,
  useLeaveTaxiPotMutation,
  useTaxiPotChatFlow,
} from '@/features/taxi-pot-chat';
import { useCurrentUserQuery } from '@/features/user-profile';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';

import {
  useChatRoomQueries,
  useChatRoomReadMarkerMutation,
  type ChatRoomDetailData,
  type ChatRoomMessageData,
} from '@/_pages/chatting/api/chat-room';
import {
  createChatRoomFromApi,
  createChatRoomMessageFromApi,
  type ChatRoom,
  type ChatRoomMessage,
} from '@/_pages/chatting/model/chat-room';

import { ChatRoomContent } from './chat-room-content';
import { ChatRoomLayout } from './chat-room-layout';
import { ChatRoomState } from './chat-room-state';
import type { ChatReportTarget } from './chat-message-menu';

export type ChattingPageProps = {
  roomId: string;
};

type LiveMessagesState = {
  roomId: string;
  messages: ChatRoomMessage[];
};

type NewMessagesState = {
  roomId: string;
  cursor: string | null;
  hasNewMessages: boolean;
};

type LiveMemberCountState = {
  roomId: string;
  baseCount: number | null;
  count: number | null;
  processedMessageIds: Set<number>;
};

type TransferProofTarget = {
  settlementId: number;
  userId: number;
} | null;

type MeterImageTarget = number | null;

type MeterAmountTarget = {
  settlementId: number;
  recognitionFailed: boolean;
} | null;

function toChatRoomMessage(message: TaxiPotChatEntryMessage): ChatRoomMessage {
  return {
    id: message.id,
    kind: 'bubble',
    content: message.content,
    variant: message.variant,
    layout: message.layout === 'guide' ? 'large' : 'default',
    loading: message.loading,
  };
}

function formatDepartureTime(departureAt: string) {
  const departure = new Date(departureAt);

  if (Number.isNaN(departure.getTime())) {
    return '-';
  }

  return departure.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function createEvaluationParticipants(
  detail: ChatRoomDetailData | undefined,
  messages: readonly ChatRoomMessageData[] | undefined,
  currentUserId: number | undefined,
): readonly ChatSatisfactionParticipant[] | undefined {
  if (!detail) {
    return undefined;
  }

  const participantMap = new Map<number, string>();

  if (detail.participants) {
    for (const participant of detail.participants) {
      participantMap.set(participant.id, participant.nickname);
    }
  } else {
    for (const message of messages ?? []) {
      if (message.sender) {
        const senderName = message.sender.nickname ?? message.sender.name;

        if (senderName) {
          participantMap.set(message.sender.id, senderName);
        }
      }

      if (message.joiner) {
        participantMap.set(message.joiner.id, message.joiner.name);
      }

      if (message.leaver) {
        participantMap.set(message.leaver.id, message.leaver.name);
      }
    }
  }

  return [...participantMap.entries()]
    .filter(([participantId]) => participantId !== currentUserId)
    .map(([id, name]) => ({ id, name }));
}

const reportReasonMap = {
  abuse: 'ABUSE',
  noShow: 'NO_SHOW',
  other: 'ETC',
  unpaid: 'UNSETTLED',
} as const;

function getLastPersistedMessageId(messages: readonly { id: string | number }[]) {
  let latestMessage: { id: string; numericId: number } | undefined;

  for (const message of messages) {
    const numericId = Number(message.id);

    if (!Number.isSafeInteger(numericId)) {
      continue;
    }

    if (!latestMessage || numericId > latestMessage.numericId) {
      latestMessage = { id: String(message.id), numericId };
    }
  }

  return latestMessage?.id;
}

export function ChattingPage({ roomId }: ChattingPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [liveMessagesState, setLiveMessagesState] = useState<LiveMessagesState>({
    roomId,
    messages: [],
  });
  const {
    detailQuery,
    afterCursor,
    fetchNewerMessages,
    fetchPreviousMessages,
    hasNewerMessages,
    hasPreviousMessages,
    isFetchNewerMessagesError,
    isFetchPreviousMessagesError,
    isFetchingNewerMessages,
    isFetchingPreviousMessages,
    messagesQuery,
  } = useChatRoomQueries(roomId);
  const currentUserQuery = useCurrentUserQuery();
  const chatRoomDetail = detailQuery.data?.data;
  const companionId = chatRoomDetail?.companion_id;
  const currentUserId = currentUserQuery.data?.data.id;
  const isCarpool = chatRoomDetail?.kind === 'CARPOOL';
  const taxiPotId =
    chatRoomDetail?.kind === 'TAXI_POT' ? String(chatRoomDetail.companion_id) : undefined;
  const isTaxiPot = taxiPotId !== undefined;
  const taxiPotQuery = useQuery({
    ...taxiPotQueries.detail(taxiPotId ?? ''),
    enabled: isTaxiPot,
  });
  const taxiPotDetail = taxiPotQuery.data?.data;
  const settlementId = taxiPotDetail?.settlement_id;
  const ratingMutation = useChatRatingMutation();
  const reportMutation = useChatReportMutation();
  const leaveCarpoolMutation = useLeaveCarpoolMutation();
  const leaveCompanionMutation = useLeaveCompanionMutation();
  const leaveTaxiPotMutation = useLeaveTaxiPotMutation();
  const readMarkerMutation = useChatRoomReadMarkerMutation();
  const completeSettlementMutation = useCompleteSettlementMutation();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ChatReportTarget | null>(null);
  const [uploadingSettlementPhoto, setUploadingSettlementPhoto] = useState(false);
  const [transferProofTarget, setTransferProofTarget] = useState<TransferProofTarget>(null);
  const [meterImageTarget, setMeterImageTarget] = useState<MeterImageTarget>(null);
  const [meterAnalysisSettlementId, setMeterAnalysisSettlementId] = useState<number | null>(null);
  const [meterAnalysisFinishedMessage, setMeterAnalysisFinishedMessage] =
    useState<SettlementAnalysisFinishedMessage | null>(null);
  const meterAnalysisFinishedMessageRef = useRef<SettlementAnalysisFinishedMessage | null>(null);
  const [isMeterAnalysisDelayed, setIsMeterAnalysisDelayed] = useState(false);
  const [meterAmountTarget, setMeterAmountTarget] = useState<MeterAmountTarget>(null);
  const [meterAmount, setMeterAmount] = useState('');
  const [savingSettlementAmount, setSavingSettlementAmount] = useState(false);
  const [transferAnalysisSettlementId, setTransferAnalysisSettlementId] = useState<number | null>(
    null,
  );
  const meterPhotoPickerRef = useRef<(() => void) | null>(null);
  const transferPhotoPickerRefs = useRef(new Map<number, () => void>());
  const meterAnalysisQuery = useQuery(
    settlementQueries.analysisStatus(settlementId, settlementId !== undefined),
  );
  const transferAnalysisQuery = useQuery(
    settlementQueries.myParticipant(
      transferAnalysisSettlementId ?? undefined,
      transferAnalysisSettlementId !== null,
    ),
  );
  const meterAnalysisFinished =
    meterAnalysisFinishedMessage?.settlement_id === settlementId
      ? meterAnalysisFinishedMessage
      : null;
  const meterAnalysisStatus =
    meterAnalysisFinished?.meter_analysis_status ??
    meterAnalysisQuery.data?.data.meter_analysis_status;
  const remainingMeterAttempts =
    meterAnalysisFinished?.remaining_meter_attempts ??
    meterAnalysisQuery.data?.data.remaining_meter_attempts;
  const transferParticipantData = transferAnalysisQuery.data?.data;
  const transferAnalysisStatus =
    transferParticipantData && 'member_analysis_status' in transferParticipantData
      ? transferParticipantData.member_analysis_status
      : undefined;
  const isMeterAnalysisOpen =
    meterAnalysisSettlementId !== null &&
    !meterAnalysisQuery.isError &&
    (meterAnalysisStatus === undefined ||
      meterAnalysisStatus === 'PENDING' ||
      meterAnalysisStatus === 'ANALYZING');
  const activeMeterAmountTarget = useMemo<MeterAmountTarget>(
    () =>
      meterAmountTarget ??
      (meterAnalysisStatus === 'FAILED' && meterAnalysisSettlementId !== null
        ? { settlementId: meterAnalysisSettlementId, recognitionFailed: true }
        : null),
    [meterAnalysisSettlementId, meterAnalysisStatus, meterAmountTarget],
  );
  const activeTransferFailedSettlementId =
    transferAnalysisStatus === 'FAILED' ? transferAnalysisSettlementId : null;
  useEffect(() => {
    if (
      meterAnalysisSettlementId === null ||
      meterAnalysisStatus === 'PASSED' ||
      meterAnalysisStatus === 'FAILED'
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsMeterAnalysisDelayed(true), 10_000);
    return () => window.clearTimeout(timeoutId);
  }, [meterAnalysisSettlementId, meterAnalysisStatus]);
  useEffect(() => {
    if (meterAnalysisSettlementId === null) {
      return;
    }
    if (meterAnalysisQuery.isError) {
      useSnackbarStore
        .getState()
        .showSnackbar(
          meterAnalysisQuery.error instanceof Error
            ? meterAnalysisQuery.error.message
            : '미터기 사진 분석 상태를 확인하지 못했어요',
          'critical',
        );
      return;
    }
  }, [meterAnalysisQuery.error, meterAnalysisQuery.isError, meterAnalysisSettlementId]);

  useEffect(() => {
    if (transferAnalysisSettlementId === null) {
      return;
    }
    if (transferAnalysisQuery.isError) {
      useSnackbarStore
        .getState()
        .showSnackbar(
          transferAnalysisQuery.error instanceof Error
            ? transferAnalysisQuery.error.message
            : '송금 사진 분석 상태를 확인하지 못했어요',
          'critical',
        );
      return;
    }
  }, [transferAnalysisQuery.error, transferAnalysisQuery.isError, transferAnalysisSettlementId]);
  const [newMessagesState, setNewMessagesState] = useState<NewMessagesState>({
    roomId,
    cursor: null,
    hasNewMessages: false,
  });
  const [liveMemberCountState, setLiveMemberCountState] = useState<LiveMemberCountState>({
    roomId,
    baseCount: null,
    count: null,
    processedMessageIds: new Set(),
  });
  const hasDeferredAfterCursor =
    afterCursor !== undefined &&
    afterCursor !== null &&
    !(
      newMessagesState.roomId === roomId &&
      newMessagesState.cursor === afterCursor &&
      !newMessagesState.hasNewMessages
    );
  const hasNewMessages =
    (newMessagesState.roomId === roomId && newMessagesState.hasNewMessages) ||
    hasDeferredAfterCursor;
  const baseMemberCount = taxiPotDetail?.current_count ?? chatRoomDetail?.current_count;
  const chatRoomMessages = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [messagesQuery.data?.pages],
  );
  const initialRideAction = isTaxiPot ? getLatestTaxiPotRideAction(chatRoomMessages) : undefined;
  const chatRoomMessagesForDisplay = useMemo(
    () =>
      isTaxiPot
        ? chatRoomMessages.filter((message) => !isTaxiPotRideActionMessage(message))
        : chatRoomMessages,
    [chatRoomMessages, isTaxiPot],
  );
  const evaluationParticipants = useMemo(
    () =>
      createEvaluationParticipants(
        chatRoomDetail,
        chatRoomMessages,
        currentUserQuery.data?.data.id,
      ),
    [chatRoomDetail, chatRoomMessages, currentUserQuery.data?.data.id],
  );

  const appendLiveMessage = useCallback(
    (nextMessage: ChatRoomMessage) => {
      setLiveMessagesState((currentState) => {
        const currentMessages = currentState.roomId === roomId ? currentState.messages : [];

        if (currentMessages.some((currentMessage) => currentMessage.id === nextMessage.id)) {
          return currentState.roomId === roomId
            ? currentState
            : { roomId, messages: currentMessages };
        }

        return { roomId, messages: [...currentMessages, nextMessage] };
      });
    },
    [roomId],
  );

  const taxiPotFlow = useTaxiPotChatFlow({
    currentUserId,
    initialRideAction,
    taxiPotDetail,
    taxiPotId,
  });

  const handleViewTransferProof = useCallback(
    async (settlementId: number, nickname: string) => {
      if (!taxiPotFlow.isHost) {
        return;
      }

      try {
        const response = await queryClient.fetchQuery(settlementQueries.status(settlementId));
        const matchingParticipants = response.data.participants.filter(
          (participant) => participant.name === nickname,
        );

        if (matchingParticipants.length !== 1) {
          useSnackbarStore
            .getState()
            .showSnackbar('송금자를 확인할 수 없어 인증 사진을 열지 못했어요', 'critical');
          return;
        }

        setTransferProofTarget({
          settlementId,
          userId: matchingParticipants[0].user_id,
        });
      } catch (error) {
        useSnackbarStore
          .getState()
          .showSnackbar(
            error instanceof Error ? error.message : '송금 내역을 불러오지 못했어요',
            'critical',
          );
      }
    },
    [queryClient, taxiPotFlow.isHost],
  );

  const handleViewMeterImage = useCallback((settlementId: number) => {
    setMeterImageTarget(settlementId);
  }, []);

  const handleRegisterMeterPhotoPicker = useCallback((openPicker: (() => void) | null) => {
    meterPhotoPickerRef.current = openPicker;
  }, []);

  const handleMeterAnalysisFinished = useCallback(
    (message: SettlementAnalysisFinishedMessage) => {
      meterAnalysisFinishedMessageRef.current = message;
      setMeterAnalysisFinishedMessage(message);
      if (message.meter_analysis_status === 'FAILED') {
        setMeterAnalysisSettlementId(message.settlement_id);
        setIsMeterAnalysisDelayed(false);
      } else if (message.settlement_id === meterAnalysisSettlementId) {
        setMeterAnalysisSettlementId(null);
      }
      queryClient.setQueryData(
        settlementQueries.analysisStatus(message.settlement_id).queryKey,
        (current) =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  meter_analysis_status: message.meter_analysis_status,
                  remaining_meter_attempts: message.remaining_meter_attempts,
                },
              }
            : current,
      );
    },
    [meterAnalysisSettlementId, queryClient],
  );

  const handleRefreshSettlementStatus = useCallback(() => {
    if (!settlementId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: settlementQueries.analysisStatus(settlementId).queryKey,
    });
  }, [queryClient, settlementId]);

  const handleRegisterTransferPhotoPicker = useCallback(
    (settlementId: number, openPicker: (() => void) | null) => {
      if (openPicker) {
        transferPhotoPickerRefs.current.set(settlementId, openPicker);
      } else {
        transferPhotoPickerRefs.current.delete(settlementId);
      }
    },
    [],
  );

  const handleManualMeterEntry = useCallback(
    (targetSettlementId?: number) => {
      const targetId = targetSettlementId ?? meterAnalysisSettlementId ?? settlementId;
      if (targetId === undefined || targetId === null) {
        return;
      }

      setMeterAnalysisSettlementId(null);
      setIsMeterAnalysisDelayed(false);
      setMeterAmount('');
      setMeterAmountTarget({
        settlementId: targetId,
        recognitionFailed: false,
      });
    },
    [meterAnalysisSettlementId, settlementId],
  );

  const handleRetakeMeterPhoto = useCallback(() => {
    setMeterAnalysisSettlementId(null);
    setMeterAmountTarget(null);
    meterPhotoPickerRef.current?.();
  }, []);

  const handleReselectTransferPhoto = useCallback(() => {
    if (activeTransferFailedSettlementId === null) {
      return;
    }

    const openPicker = transferPhotoPickerRefs.current.get(activeTransferFailedSettlementId);
    setTransferAnalysisSettlementId(null);
    openPicker?.();
  }, [activeTransferFailedSettlementId]);

  const handleSettleMeterAmount = useCallback(async () => {
    if (activeMeterAmountTarget === null) {
      return;
    }

    const totalAmount = Number(meterAmount);
    if (!Number.isSafeInteger(totalAmount) || totalAmount < 1 || totalAmount > 999_999) {
      useSnackbarStore
        .getState()
        .showSnackbar('1원 이상 999,999원 이하로 입력해주세요', 'critical');
      return;
    }

    setSavingSettlementAmount(true);
    try {
      await updateSettlementAmount(await getAccessToken(), activeMeterAmountTarget.settlementId, {
        total_amount: totalAmount,
      });
      queryClient.setQueryData(
        settlementQueries.analysisStatus(activeMeterAmountTarget.settlementId).queryKey,
        (current) =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  meter_analysis_status: 'MANUAL' as const,
                  group_settlement_status: 'REQUESTED' as const,
                  total_amount: totalAmount,
                },
              }
            : current,
      );
      meterAnalysisFinishedMessageRef.current = null;
      setMeterAnalysisFinishedMessage(null);
      setMeterAnalysisSettlementId(null);
      setMeterAmountTarget(null);
      setMeterAmount('');
    } catch (error) {
      useSnackbarStore
        .getState()
        .showSnackbar(
          error instanceof Error ? error.message : '정산 금액을 저장하지 못했어요',
          'critical',
        );
    } finally {
      setSavingSettlementAmount(false);
    }
  }, [activeMeterAmountTarget, meterAmount, queryClient]);

  const syncLiveMemberCount = useCallback(
    (message: ChatWebSocketMessage) => {
      let delta = 0;

      if (message.type === 'SYSTEM_JOIN') {
        delta = 1;
      } else if (message.type === 'SYSTEM_LEAVE') {
        delta = -1;
      }

      if (delta === 0 || baseMemberCount === undefined) {
        return;
      }

      setLiveMemberCountState((currentState) => {
        const isSameRoom = currentState.roomId === roomId;

        if (isSameRoom && currentState.processedMessageIds.has(message.id)) {
          return currentState;
        }

        const isSameBase = isSameRoom && currentState.baseCount === baseMemberCount;
        const currentCount = isSameBase ? currentState.count : baseMemberCount;

        if (currentCount === undefined || currentCount === null) {
          return currentState;
        }

        const processedMessageIds = isSameRoom
          ? new Set(currentState.processedMessageIds)
          : new Set<number>();
        processedMessageIds.add(message.id);

        return {
          baseCount: baseMemberCount,
          count: Math.max(0, currentCount + delta),
          processedMessageIds,
          roomId,
        };
      });
    },
    [baseMemberCount, roomId],
  );

  const handleReportRequest = useCallback(
    (target: ChatReportTarget) => {
      setReportTarget(target);
      setIsReportDialogOpen(true);

      if (taxiPotFlow.isEvaluationOpen) {
        taxiPotFlow.onEvaluationOpenChange(false);
      }
    },
    [taxiPotFlow],
  );

  const handleEvaluationReport = useCallback(
    (participant: ChatSatisfactionParticipant) => {
      const reportedUserId = Number(participant.id);

      if (!Number.isSafeInteger(reportedUserId)) {
        useSnackbarStore.getState().showSnackbar('신고 대상 정보를 불러오지 못했어요', 'critical');
        return;
      }

      handleReportRequest({ type: 'user', reportedUserId });
    },
    [handleReportRequest],
  );

  const handleEvaluationSubmit = useCallback(
    ({ ratings }: ChatSatisfactionDialogSubmitPayload) => {
      if (!taxiPotId) {
        return;
      }

      const apiRatings = Object.entries(ratings).map(([targetUserId, score]) => ({
        score,
        target_user_id: Number(targetUserId),
      }));

      if (
        apiRatings.some(({ target_user_id: targetUserId }) => !Number.isSafeInteger(targetUserId))
      ) {
        useSnackbarStore.getState().showSnackbar('평가 대상 정보를 불러오지 못했어요', 'critical');
        return;
      }

      ratingMutation.mutate(
        {
          companionId: Number(taxiPotId),
          payload: { ratings: apiRatings },
        },
        {
          onError: (error) => {
            useSnackbarStore
              .getState()
              .showSnackbar(error.message || '평가를 제출하지 못했어요', 'critical');
          },
          onSuccess: () => taxiPotFlow.onEvaluationOpenChange(false),
        },
      );
    },
    [ratingMutation, taxiPotFlow, taxiPotId],
  );

  const handleReportSubmit = useCallback(
    ({ description, reason }: ChatReportDialogSubmitPayload) => {
      if (!reportTarget) {
        return;
      }

      let payload: SubmitChatReportPayload;

      if (reportTarget.type === 'message') {
        payload = {
          reason: reportReasonMap[reason],
          reason_text: reason === 'other' ? description.trim() : null,
          reported_message_id: reportTarget.reportedMessageId,
          reported_user_id: reportTarget.reportedUserId,
        };
      } else if (companionId !== undefined && Number.isSafeInteger(companionId)) {
        payload = {
          companion_id: companionId,
          reason: reportReasonMap[reason],
          reason_text: reason === 'other' ? description.trim() : null,
          reported_user_id: reportTarget.reportedUserId,
        };
      } else {
        useSnackbarStore.getState().showSnackbar('신고 대상 정보를 불러오지 못했어요', 'critical');
        return;
      }

      reportMutation.mutate(payload, {
        onError: (error) => {
          useSnackbarStore
            .getState()
            .showSnackbar(error.message || '신고를 접수하지 못했어요', 'critical');
        },
        onSuccess: () => {
          setIsReportDialogOpen(false);
          setReportTarget(null);
        },
      });
    },
    [companionId, reportMutation, reportTarget],
  );

  const handleLeave = useCallback(() => setIsLeaveDialogOpen(true), []);
  const handleSettlementAcknowledge = useCallback(
    async (settlementId: number) => {
      try {
        await completeSettlementMutation.mutateAsync(settlementId);
      } catch (error) {
        useSnackbarStore
          .getState()
          .showSnackbar(
            error instanceof Error ? error.message : '정산을 완료하지 못했어요',
            'critical',
          );
      }
    },
    [completeSettlementMutation],
  );
  const handleSendMeterPhoto = useCallback(
    async (targetSettlementId: number, file: File) => {
      if (remainingMeterAttempts === 0) {
        handleManualMeterEntry(targetSettlementId);
        return;
      }
      setUploadingSettlementPhoto(true);
      meterAnalysisFinishedMessageRef.current = null;
      setMeterAnalysisFinishedMessage(null);
      try {
        const token = await getAccessToken();
        const imageKey = await uploadSettlementImage(token, 'METER', file);
        const response = await submitMeterImage(token, targetSettlementId, {
          meter_image_key: imageKey,
        });
        setIsMeterAnalysisDelayed(false);
        setMeterAmount('');
        const finishedMessage =
          meterAnalysisFinishedMessageRef.current as SettlementAnalysisFinishedMessage | null;
        if (finishedMessage?.settlement_id !== targetSettlementId) {
          queryClient.setQueryData(settlementQueries.analysisStatus(targetSettlementId).queryKey, {
            message: response.message,
            data: {
              ...response.data,
              total_amount: null,
            },
          });
          setMeterAnalysisSettlementId(targetSettlementId);
        }
      } catch (error) {
        useSnackbarStore
          .getState()
          .showSnackbar(
            error instanceof Error ? error.message : '미터기 사진을 보내지 못했어요',
            'critical',
          );
      } finally {
        setUploadingSettlementPhoto(false);
      }
    },
    [handleManualMeterEntry, queryClient, remainingMeterAttempts],
  );
  const handleSendTransferPhoto = useCallback(
    async (settlementId: number, file: File) => {
      setUploadingSettlementPhoto(true);
      try {
        const token = await getAccessToken();
        const imageKey = await uploadSettlementImage(token, 'TRANSFER', file);
        await submitTransferProof(token, settlementId, { transfer_image_key: imageKey });
        await queryClient.removeQueries({
          queryKey: settlementQueries.myParticipant(settlementId).queryKey,
          exact: true,
        });
        setTransferAnalysisSettlementId(settlementId);
      } catch (error) {
        useSnackbarStore
          .getState()
          .showSnackbar(
            error instanceof Error ? error.message : '송금 사진을 보내지 못했어요',
            'critical',
          );
      } finally {
        setUploadingSettlementPhoto(false);
      }
    },
    [queryClient],
  );
  const handleWebSocketMessage = useCallback(
    (message: ChatWebSocketMessage) => {
      syncLiveMemberCount(message);

      if (message.type === 'SYSTEM_RIDE_ENDED' && taxiPotId) {
        void queryClient.invalidateQueries({
          queryKey: taxiPotQueries.detail(taxiPotId).queryKey,
        });
      }

      if (taxiPotFlow.handleWebSocketMessage(message)) {
        return;
      }

      if (hasNewMessages) {
        setNewMessagesState({
          cursor: afterCursor ?? newMessagesState.cursor,
          hasNewMessages: true,
          roomId,
        });
        return;
      }

      appendLiveMessage(createChatRoomMessageFromApi(message, currentUserId));
    },
    [
      afterCursor,
      appendLiveMessage,
      currentUserId,
      hasNewMessages,
      newMessagesState.cursor,
      roomId,
      queryClient,
      syncLiveMemberCount,
      taxiPotId,
      taxiPotFlow,
    ],
  );

  const handleLoadNewerMessages = useCallback(async () => {
    const requestedCursor = afterCursor ?? null;

    await fetchNewerMessages();
    setNewMessagesState((currentState) => ({
      ...currentState,
      cursor: requestedCursor,
      hasNewMessages: false,
    }));
  }, [afterCursor, fetchNewerMessages]);

  const baseRoom =
    chatRoomDetail && messagesQuery.data
      ? createChatRoomFromApi(chatRoomDetail, chatRoomMessagesForDisplay, currentUserId)
      : undefined;
  const taxiPotEntryMessages = taxiPotDetail
    ? createTaxiPotChatEntryMessages(taxiPotDetail).map(toChatRoomMessage)
    : [];
  const room: ChatRoom | undefined = baseRoom
    ? {
        ...baseRoom,
        memberCount:
          liveMemberCountState.roomId === roomId &&
          liveMemberCountState.baseCount === baseMemberCount &&
          liveMemberCountState.count !== null
            ? liveMemberCountState.count
            : baseRoom.memberCount,
        memberLimit: taxiPotDetail?.capacity ?? baseRoom.memberLimit,
        messages: [...taxiPotEntryMessages, ...baseRoom.messages],
      }
    : undefined;
  const liveMessages = useMemo(() => {
    if (liveMessagesState.roomId !== roomId) {
      return [];
    }

    return liveMessagesState.messages.map((message) => {
      if (message.kind !== 'bubble' || message.senderId === undefined) {
        return message;
      }

      return {
        ...message,
        variant: message.senderId === currentUserId ? ('me' as const) : ('other' as const),
      };
    });
  }, [currentUserId, liveMessagesState, roomId]);
  const lastMessageId = useMemo(
    () =>
      getLastPersistedMessageId([...chatRoomMessages, ...(room?.messages ?? []), ...liveMessages]),
    [chatRoomMessages, liveMessages, room?.messages],
  );
  const handleBack = useCallback(async () => {
    if (lastMessageId) {
      try {
        await readMarkerMutation.mutateAsync({
          lastReadMessageId: lastMessageId,
          roomId,
        });
      } catch {
        // 읽음 처리가 실패해도 채팅방에서 나가는 동작은 계속 진행한다.
      }
    }

    router.push('/');
  }, [lastMessageId, readMarkerMutation, roomId, router]);
  const handleLeaveConfirm = useCallback(async () => {
    if (companionId === undefined) {
      return;
    }

    try {
      if (isCarpool) {
        await leaveCarpoolMutation.mutateAsync(companionId);
      } else if (isTaxiPot) {
        await leaveTaxiPotMutation.mutateAsync(Number(taxiPotId));
      } else {
        await leaveCompanionMutation.mutateAsync(companionId);
      }

      setIsLeaveDialogOpen(false);
      useSnackbarStore.getState().showSnackbar('채팅방을 나갔어요', 'positive');
      router.push('/');
    } catch (error) {
      useSnackbarStore
        .getState()
        .showSnackbar(
          error instanceof Error ? error.message : '채팅방을 나가지 못했어요',
          'critical',
        );
    }
  }, [
    companionId,
    isCarpool,
    isTaxiPot,
    leaveCarpoolMutation,
    leaveCompanionMutation,
    leaveTaxiPotMutation,
    router,
    taxiPotId,
  ]);
  const leaveLoading =
    leaveCarpoolMutation.isPending ||
    leaveCompanionMutation.isPending ||
    leaveTaxiPotMutation.isPending;

  return (
    <ChatRoomWebSocketConnection
      enabled={Boolean(room)}
      roomId={roomId}
      onMessage={handleWebSocketMessage}
      onSettlementAnalysisFinished={handleMeterAnalysisFinished}
    >
      {(connection) => (
        <>
          <ChattingPageContent
            connection={connection}
            detailQuery={detailQuery}
            evaluationParticipants={evaluationParticipants}
            hasNewerMessages={hasNewerMessages}
            hasNewMessages={hasNewMessages}
            hasPreviousMessages={hasPreviousMessages}
            isEvaluationOpen={taxiPotFlow.isEvaluationOpen}
            isFetchNewerMessagesError={isFetchNewerMessagesError}
            isFetchPreviousMessagesError={isFetchPreviousMessagesError}
            isFetchingNewerMessages={isFetchingNewerMessages}
            isFetchingPreviousMessages={isFetchingPreviousMessages}
            isLeaveDialogOpen={isLeaveDialogOpen}
            isReportDialogOpen={isReportDialogOpen}
            isTaxiPot={isTaxiPot}
            isTaxiPotHost={taxiPotFlow.isHost}
            currentUserId={currentUserId}
            messagesQuery={messagesQuery}
            onBack={handleBack}
            onAcknowledgeSettlement={handleSettlementAcknowledge}
            onWebSocketOpen={handleRefreshSettlementStatus}
            onSendMeterPhoto={handleSendMeterPhoto}
            onManualMeterEntry={handleManualMeterEntry}
            meterSettlementId={settlementId}
            hideMeterRequestMessage={meterAnalysisStatus === 'PASSED'}
            remainingMeterAttempts={remainingMeterAttempts}
            onSendTransferPhoto={handleSendTransferPhoto}
            onRegisterMeterPhotoPicker={handleRegisterMeterPhotoPicker}
            onRegisterTransferPhotoPicker={handleRegisterTransferPhotoPicker}
            onViewTransferProof={handleViewTransferProof}
            onViewMeterImage={handleViewMeterImage}
            onEvaluationReport={handleEvaluationReport}
            onEvaluationSubmit={handleEvaluationSubmit}
            onEvaluationOpenChange={taxiPotFlow.onEvaluationOpenChange}
            onLeave={handleLeave}
            onLeaveConfirm={handleLeaveConfirm}
            onLeaveDialogChange={setIsLeaveDialogOpen}
            onLoadNewerMessages={handleLoadNewerMessages}
            onLoadPreviousMessages={fetchPreviousMessages}
            onReport={handleReportRequest}
            onReportDialogChange={(open) => {
              setIsReportDialogOpen(open);
              if (!open) {
                setReportTarget(null);
              }
            }}
            onReportSubmit={handleReportSubmit}
            onRideActionConfirm={taxiPotFlow.confirmRideAction}
            rideAction={taxiPotFlow.rideAction}
            rideActionLoading={taxiPotFlow.isPending}
            reportLoading={reportMutation.isPending}
            leaveLoading={leaveLoading}
            ratingLoading={ratingMutation.isPending}
            completingSettlement={completeSettlementMutation.isPending}
            uploadingSettlementPhoto={uploadingSettlementPhoto}
            room={room}
            transferProofTarget={transferProofTarget}
            meterImageTarget={meterImageTarget}
            onMeterImageOpenChange={(open) => {
              if (!open) {
                setMeterImageTarget(null);
              }
            }}
            onTransferProofOpenChange={(open) => {
              if (!open) {
                setTransferProofTarget(null);
              }
            }}
            taxiPotDetail={taxiPotDetail}
            taxiPotQuery={taxiPotQuery}
            taxiPotStatus={taxiPotFlow.status}
            liveMessages={liveMessages}
          />
          <TaxiMeterAnalysisDialog
            delayed={isMeterAnalysisDelayed}
            onManualEntry={handleManualMeterEntry}
            open={isMeterAnalysisOpen}
          />
          <TaxiMeterAmountDialog
            onOpenChange={(open) => {
              if (!open) {
                setMeterAmountTarget(null);
              }
            }}
            onRetakePhoto={handleRetakeMeterPhoto}
            onSettle={handleSettleMeterAmount}
            onValueChange={setMeterAmount}
            open={activeMeterAmountTarget !== null}
            allowRetakePhoto={remainingMeterAttempts !== 0}
            recognitionFailed={activeMeterAmountTarget?.recognitionFailed}
            submitting={savingSettlementAmount}
            value={meterAmount}
          />
          <TransferConfirmationAnalysisDialog
            open={
              transferAnalysisSettlementId !== null &&
              !transferAnalysisQuery.isError &&
              (transferAnalysisStatus === undefined ||
                transferAnalysisStatus === 'PENDING' ||
                transferAnalysisStatus === 'ANALYZING')
            }
          />
          <TransferConfirmationRecognitionFailedDialog
            onReselectPhoto={handleReselectTransferPhoto}
            open={activeTransferFailedSettlementId !== null}
          />
        </>
      )}
    </ChatRoomWebSocketConnection>
  );
}

type ChattingPageContentProps = {
  connection: ChatRoomWebSocketConnectionValue;
  detailQuery: ReturnType<typeof useChatRoomQueries>['detailQuery'];
  evaluationParticipants?: readonly ChatSatisfactionParticipant[];
  hasPreviousMessages: boolean;
  hasNewerMessages: boolean;
  hasNewMessages: boolean;
  isEvaluationOpen: boolean;
  isFetchingPreviousMessages: boolean;
  isFetchingNewerMessages: boolean;
  isFetchPreviousMessagesError: boolean;
  isFetchNewerMessagesError: boolean;
  isLeaveDialogOpen: boolean;
  isReportDialogOpen: boolean;
  isTaxiPot: boolean;
  isTaxiPotHost: boolean;
  messagesQuery: ReturnType<typeof useChatRoomQueries>['messagesQuery'];
  onBack: () => void;
  onAcknowledgeSettlement: (settlementId: number) => void;
  onWebSocketOpen: () => void;
  taxiPotQuery: { isError: boolean; isPending: boolean };
  room?: ChatRoom;
  taxiPotDetail?: TaxiPotDetailData;
  taxiPotStatus?: TaxiPotStatus;
  rideAction?: TaxiPotRideAction;
  rideActionLoading: boolean;
  liveMessages: readonly ChatRoomMessage[];
  leaveLoading: boolean;
  onEvaluationReport: (participant: ChatSatisfactionParticipant) => void;
  onEvaluationSubmit: (payload: ChatSatisfactionDialogSubmitPayload) => void;
  onEvaluationOpenChange: (open: boolean) => void;
  onLeave: () => void;
  onLeaveConfirm: () => void;
  onLeaveDialogChange: (open: boolean) => void;
  onLoadPreviousMessages: () => Promise<unknown>;
  onLoadNewerMessages: () => Promise<unknown>;
  onReport: (target: ChatReportTarget) => void;
  onReportDialogChange: (open: boolean) => void;
  onReportSubmit: (payload: ChatReportDialogSubmitPayload) => void;
  onRideActionConfirm: () => void;
  ratingLoading: boolean;
  reportLoading: boolean;
  completingSettlement: boolean;
  onSendMeterPhoto: (settlementId: number, file: File) => void;
  onManualMeterEntry: (settlementId?: number) => void;
  meterSettlementId?: number;
  remainingMeterAttempts?: number;
  onSendTransferPhoto: (settlementId: number, file: File) => void;
  onRegisterMeterPhotoPicker: (openPicker: (() => void) | null) => void;
  onRegisterTransferPhotoPicker: (settlementId: number, openPicker: (() => void) | null) => void;
  onViewTransferProof: (settlementId: number, nickname: string) => void;
  onViewMeterImage: (settlementId: number) => void;
  transferProofTarget: TransferProofTarget;
  meterImageTarget: MeterImageTarget;
  onMeterImageOpenChange: (open: boolean) => void;
  onTransferProofOpenChange: (open: boolean) => void;
  uploadingSettlementPhoto: boolean;
  currentUserId?: number;
  hideMeterRequestMessage: boolean;
};

function ChattingPageContent({
  connection,
  detailQuery,
  evaluationParticipants,
  hasPreviousMessages,
  hasNewerMessages,
  hasNewMessages,
  isEvaluationOpen,
  isLeaveDialogOpen,
  isFetchingPreviousMessages,
  isFetchingNewerMessages,
  isFetchPreviousMessagesError,
  isFetchNewerMessagesError,
  isReportDialogOpen,
  isTaxiPot,
  isTaxiPotHost,
  messagesQuery,
  onBack,
  onAcknowledgeSettlement,
  onWebSocketOpen,
  onEvaluationReport,
  onEvaluationSubmit,
  onEvaluationOpenChange,
  onLeave,
  onLeaveConfirm,
  onLeaveDialogChange,
  onLoadPreviousMessages,
  onLoadNewerMessages,
  onReport,
  onReportDialogChange,
  onReportSubmit,
  onRideActionConfirm,
  rideAction,
  rideActionLoading,
  ratingLoading,
  reportLoading,
  completingSettlement,
  onSendMeterPhoto,
  onManualMeterEntry,
  meterSettlementId,
  remainingMeterAttempts,
  onSendTransferPhoto,
  onRegisterMeterPhotoPicker,
  onRegisterTransferPhotoPicker,
  onViewTransferProof,
  onViewMeterImage,
  transferProofTarget,
  meterImageTarget,
  onMeterImageOpenChange,
  onTransferProofOpenChange,
  uploadingSettlementPhoto,
  currentUserId,
  hideMeterRequestMessage,
  leaveLoading,
  room,
  taxiPotDetail,
  taxiPotQuery,
  taxiPotStatus,
  liveMessages,
}: ChattingPageContentProps) {
  useEffect(() => {
    if (connection.status === 'open') {
      onWebSocketOpen();
    }
  }, [connection.status, onWebSocketOpen]);

  if (detailQuery.isPending || messagesQuery.isPending || (isTaxiPot && taxiPotQuery.isPending)) {
    return (
      <ChatRoomLayout>
        <ChatRoomState label="채팅방을 불러오는 중">채팅방을 불러오는 중이에요.</ChatRoomState>
      </ChatRoomLayout>
    );
  }

  if (detailQuery.isError || messagesQuery.isError || taxiPotQuery.isError || !room) {
    return (
      <ChatRoomLayout>
        <ChatRoomState label="채팅방을 불러오지 못함">채팅방을 불러오지 못했어요.</ChatRoomState>
      </ChatRoomLayout>
    );
  }

  const topContent = taxiPotDetail ? (
    <TaxiPotAnnouncement
      className="absolute inset-x-3 top-1.5 z-10"
      departureTime={formatDepartureTime(taxiPotDetail.departure_at)}
    />
  ) : null;
  const rideActionContent =
    isTaxiPotHost && rideAction ? (
      <TaxiPotRideActionNotice
        action={rideAction}
        loading={rideActionLoading}
        onConfirm={onRideActionConfirm}
      />
    ) : null;
  const showLeaveButton =
    !isTaxiPot || taxiPotStatus === undefined || taxiPotStatus === 'RECRUITING';

  return (
    <>
      <ChatRoomLayout
        onBack={onBack}
        onLeave={onLeave}
        room={room}
        showLeaveButton={showLeaveButton}
      >
        <ChatRoomContent
          bottomContent={rideActionContent}
          connection={connection}
          hasPreviousMessages={hasPreviousMessages}
          hasNewerMessages={hasNewerMessages}
          isFetchPreviousMessagesError={isFetchPreviousMessagesError}
          isFetchNewerMessagesError={isFetchNewerMessagesError}
          isFetchingPreviousMessages={isFetchingPreviousMessages}
          isFetchingNewerMessages={isFetchingNewerMessages}
          hasNewMessages={hasNewMessages}
          liveMessages={liveMessages}
          onLoadPreviousMessages={onLoadPreviousMessages}
          onLoadNewerMessages={onLoadNewerMessages}
          onReport={onReport}
          onAcknowledgeSettlement={isTaxiPotHost ? onAcknowledgeSettlement : undefined}
          completingSettlement={completingSettlement}
          isTaxiPotHost={isTaxiPotHost}
          currentUserId={currentUserId}
          onSendMeterPhoto={onSendMeterPhoto}
          onManualMeterEntry={onManualMeterEntry}
          meterSettlementId={meterSettlementId}
          remainingMeterAttempts={remainingMeterAttempts}
          onSendTransferPhoto={onSendTransferPhoto}
          onRegisterMeterPhotoPicker={onRegisterMeterPhotoPicker}
          onRegisterTransferPhotoPicker={onRegisterTransferPhotoPicker}
          onViewTransferProof={onViewTransferProof}
          onViewMeterImage={onViewMeterImage}
          uploadingSettlementPhoto={uploadingSettlementPhoto}
          room={room}
          hideMeterRequestMessage={hideMeterRequestMessage}
          topContent={topContent}
        />
      </ChatRoomLayout>
      <SnackbarViewport className="fixed inset-x-0 bottom-[calc(98px+env(safe-area-inset-bottom,0px)+16px)] z-[2147483647] mx-auto max-w-[393px] px-5" />
      <ChatLeaveDialog
        confirmButtonProps={{
          disabled: leaveLoading,
          loading: leaveLoading,
          onClick: (event) => event.preventDefault(),
        }}
        onConfirm={onLeaveConfirm}
        onOpenChange={onLeaveDialogChange}
        open={isLeaveDialogOpen}
      />
      <ChatReportDialog
        onOpenChange={onReportDialogChange}
        open={isReportDialogOpen}
        onSubmit={onReportSubmit}
        submitButtonProps={{
          disabled: reportLoading,
          loading: reportLoading,
          onClick: (event) => event.preventDefault(),
        }}
      />
      <ChatSatisfactionDialog
        disablePointerDismissal
        onReport={onEvaluationReport}
        onOpenChange={onEvaluationOpenChange}
        open={isEvaluationOpen}
        onSubmit={onEvaluationSubmit}
        participants={evaluationParticipants}
        submitButtonProps={{
          disabled: ratingLoading,
          loading: ratingLoading,
          onClick: (event) => event.preventDefault(),
        }}
      />
      <SettlementTransferProofDialog
        onOpenChange={onTransferProofOpenChange}
        open={transferProofTarget !== null}
        settlementId={transferProofTarget?.settlementId}
        userId={transferProofTarget?.userId}
      />
      <SettlementMeterImageDialog
        onOpenChange={onMeterImageOpenChange}
        open={meterImageTarget !== null}
        settlementId={meterImageTarget ?? undefined}
      />
    </>
  );
}
