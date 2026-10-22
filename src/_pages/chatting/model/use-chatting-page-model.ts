'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import type { SettlementAnalysisFinishedMessage } from '@/entities/chat';
import { useCarpoolChatFlow } from '@/features/carpool-chat';
import {
  createTaxiPotChatEntryMessages,
  getLatestTaxiPotRideAction,
  isTaxiPotRideActionMessage,
  taxiPotQueries,
  type TaxiPotChatEntryMessage,
  useTaxiPotChatFlow,
} from '@/features/taxi-pot-chat';
import { useCurrentUserQuery } from '@/features/user-profile';

import { useChatRoomQueries, useChatRoomReadMarkerMutation } from '@/_pages/chatting/api/chat-room';
import { createChatRoomFromApi, type ChatRoom, type ChatRoomMessage } from './chat-room';
import { useChatRoomActionsModel } from './use-chat-room-actions-model';
import { useChatRoomLiveMessagesModel } from './use-chat-room-live-messages-model';
import { useChatRoomMeterSettlementModel } from './use-chat-room-meter-settlement-model';
import { useChatRoomTransferSettlementModel } from './use-chat-room-transfer-settlement-model';

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

export function useChattingPageModel(roomId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const carpoolId = isCarpool && companionId !== undefined ? String(companionId) : undefined;
  const taxiPotId =
    chatRoomDetail?.kind === 'TAXI_POT' ? String(chatRoomDetail.companion_id) : undefined;
  const isTaxiPot = taxiPotId !== undefined;
  const isRideActionChat = isTaxiPot || isCarpool;
  const evaluationCompanionId = isRideActionChat ? companionId : undefined;
  const taxiPotQuery = useQuery({
    ...taxiPotQueries.detail(taxiPotId ?? ''),
    enabled: isTaxiPot,
  });
  const taxiPotDetail = taxiPotQuery.data?.data;
  const settlementId = taxiPotDetail?.settlement_id;
  const readMarkerMutation = useChatRoomReadMarkerMutation();
  const chatRoomMessages = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [messagesQuery.data?.pages],
  );
  const initialRideAction = isRideActionChat
    ? getLatestTaxiPotRideAction(chatRoomMessages)
    : undefined;
  const chatRoomMessagesForDisplay = useMemo(
    () =>
      isRideActionChat
        ? chatRoomMessages.filter((message) => !isTaxiPotRideActionMessage(message))
        : chatRoomMessages,
    [chatRoomMessages, isRideActionChat],
  );
  const carpoolFlow = useCarpoolChatFlow({
    carpoolId,
    currentUserId,
    hostId: isCarpool ? chatRoomDetail?.host_id : undefined,
    initialRideAction: isCarpool ? initialRideAction : undefined,
    status: isCarpool ? chatRoomDetail?.companion_status : undefined,
  });
  const taxiPotFlow = useTaxiPotChatFlow({
    currentUserId,
    initialRideAction: isTaxiPot ? initialRideAction : undefined,
    taxiPotDetail,
    taxiPotId,
  });
  const rideActionFlow = isCarpool ? carpoolFlow : taxiPotFlow;
  const isTaxiPotHost = isTaxiPot && taxiPotFlow.isHost;
  const isRideActionHost = isRideActionChat && rideActionFlow.isHost;
  const handleRideEnded = useCallback(() => {
    if (!taxiPotId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: taxiPotQueries.detail(taxiPotId).queryKey,
    });
  }, [queryClient, taxiPotId]);
  const baseMemberCount = taxiPotDetail?.current_count ?? chatRoomDetail?.current_count;
  const liveMessagesModel = useChatRoomLiveMessagesModel({
    afterCursor,
    baseMemberCount,
    currentUserId,
    fetchNewerMessages,
    onRideActionMessage: rideActionFlow.handleWebSocketMessage,
    onRideEnded: isTaxiPot ? handleRideEnded : undefined,
    roomId,
  });
  const actions = useChatRoomActionsModel({
    chatRoomDetail,
    chatRoomMessages,
    companionId,
    currentUserId,
    evaluationCompanionId,
    isCarpool,
    isEvaluationOpen: rideActionFlow.isEvaluationOpen,
    isTaxiPot,
    onEvaluationOpenChange: rideActionFlow.onEvaluationOpenChange,
    taxiPotId,
  });
  const meterSettlement = useChatRoomMeterSettlementModel({ settlementId });
  const transferSettlement = useChatRoomTransferSettlementModel({
    isTaxiPotHost,
    settlementId,
  });
  const {
    handleRefreshSettlementStatus,
    handleSettlementAnalysisFinished: handleMeterAnalysisFinished,
  } = meterSettlement;
  const { handleSettlementAnalysisFinished: handleTransferAnalysisFinished } = transferSettlement;
  const handleSettlementAnalysisFinished = useCallback(
    (message: SettlementAnalysisFinishedMessage) => {
      if (message.type === 'METER_ANALYSIS_FINISHED') {
        handleMeterAnalysisFinished(message);
        return;
      }

      handleTransferAnalysisFinished(message);
    },
    [handleMeterAnalysisFinished, handleTransferAnalysisFinished],
  );
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
        memberCount: liveMessagesModel.liveMemberCount ?? baseRoom.memberCount,
        memberLimit: taxiPotDetail?.capacity ?? baseRoom.memberLimit,
        messages: [...taxiPotEntryMessages, ...baseRoom.messages],
      }
    : undefined;
  const lastMessageId = useMemo(
    () =>
      getLastPersistedMessageId([
        ...chatRoomMessages,
        ...(room?.messages ?? []),
        ...liveMessagesModel.liveMessages,
      ]),
    [chatRoomMessages, liveMessagesModel.liveMessages, room?.messages],
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

  return {
    actionDialogs: {
      evaluation: {
        loading: actions.ratingLoading,
        onOpenChange: rideActionFlow.onEvaluationOpenChange,
        onReport: actions.handleEvaluationReport,
        onSubmit: actions.handleEvaluationSubmit,
        open: rideActionFlow.isEvaluationOpen,
        participants: actions.evaluationParticipants,
      },
      leave: {
        loading: actions.leaveLoading,
        onConfirm: actions.handleLeaveConfirm,
        onOpenChange: actions.setIsLeaveDialogOpen,
        open: actions.isLeaveDialogOpen,
      },
      report: {
        loading: actions.reportLoading,
        onOpenChange: actions.handleReportDialogChange,
        onSubmit: actions.handleReportSubmit,
        open: actions.isReportDialogOpen,
      },
    },
    screen: {
      detailQuery: { isError: detailQuery.isError, isPending: detailQuery.isPending },
      isTaxiPot,
      messagesQuery: { isError: messagesQuery.isError, isPending: messagesQuery.isPending },
      onBack: handleBack,
      onLeave: actions.handleLeave,
      onWebSocketOpen: handleRefreshSettlementStatus,
      room,
      taxiPotQuery: { isError: taxiPotQuery.isError, isPending: taxiPotQuery.isPending },
      messageArea: {
        currentUserId,
        hasNewMessages: liveMessagesModel.hasNewMessages,
        hasNewerMessages,
        hasPreviousMessages,
        isFetchNewerMessagesError,
        isFetchPreviousMessagesError,
        isFetchingNewerMessages,
        isFetchingPreviousMessages,
        liveMessages: liveMessagesModel.liveMessages,
        onLoadNewerMessages: liveMessagesModel.handleLoadNewerMessages,
        onLoadPreviousMessages: fetchPreviousMessages,
        onReport: actions.handleReportRequest,
      },
      variant: {
        isRideActionHost,
        isTaxiPotHost,
        onRideActionConfirm: rideActionFlow.confirmRideAction,
        rideAction: rideActionFlow.rideAction,
        rideActionLoading: rideActionFlow.isPending,
        taxiPotDetail,
        taxiPotSettlement: {
          meter: {
            analysisResetKey: meterSettlement.analysisResetKey,
            hideMeterRequestMessage: meterSettlement.meterAnalysisStatus === 'PASSED',
            isTaxiPotHost,
            meterSettlementId: meterSettlement.meterSettlementId,
            onManualMeterEntry: meterSettlement.handleManualMeterEntry,
            onRegisterMeterPhotoPicker: meterSettlement.handleRegisterMeterPhotoPicker,
            onSendMeterPhoto: meterSettlement.handleSendMeterPhoto,
            onViewMeterImage: meterSettlement.handleViewMeterImage,
            remainingMeterAttempts: meterSettlement.remainingMeterAttempts,
            uploadingMeterPhoto: meterSettlement.uploadingMeterPhoto,
          },
          transfer: {
            analysisResetKey: transferSettlement.analysisResetKey,
            completingSettlement: transferSettlement.completingSettlement,
            currentUserId,
            isTaxiPotHost,
            onAcknowledgeSettlement: transferSettlement.handleAcknowledgeSettlement,
            onRegisterTransferPhotoPicker: transferSettlement.handleRegisterTransferPhotoPicker,
            onSendTransferPhoto: transferSettlement.handleSendTransferPhoto,
            onViewTransferProof: transferSettlement.handleViewTransferProof,
            settlementId: transferSettlement.settlementId,
            transferSubmissionBlockedSettlementId:
              transferSettlement.transferSubmissionBlockedSettlementId,
            uploadingTransferPhoto: transferSettlement.uploadingTransferPhoto,
          },
        },
        taxiPotStatus: taxiPotFlow.status,
      },
    },
    settlementDialogs: {
      meter: {
        image: {
          onOpenChange: meterSettlement.onMeterImageOpenChange,
          target: meterSettlement.meterImageTarget,
        },
        analysis: {
          amount: meterSettlement.meterAmount,
          amountTarget: meterSettlement.activeMeterAmountTarget,
          isDelayed: meterSettlement.isMeterAnalysisDelayed,
          isOpen: meterSettlement.isMeterAnalysisOpen,
          onManualEntry: meterSettlement.handleManualMeterEntry,
          onOpenChange: meterSettlement.onMeterAmountOpenChange,
          onRetakePhoto: meterSettlement.handleRetakeMeterPhoto,
          onSettle: meterSettlement.handleSettleMeterAmount,
          onValueChange: meterSettlement.onMeterAmountChange,
          remainingAttempts: meterSettlement.remainingMeterAttempts,
          savingAmount: meterSettlement.savingSettlementAmount,
        },
      },
      transfer: {
        proof: {
          onOpenChange: transferSettlement.onTransferProofOpenChange,
          target: transferSettlement.transferProofTarget,
        },
        analysis: {
          failedSettlementId: transferSettlement.activeTransferFailedSettlementId,
          isOpen: transferSettlement.isTransferAnalysisOpen,
          onReselectPhoto: transferSettlement.handleReselectTransferPhoto,
        },
      },
    },
    websocket: {
      onMessage: liveMessagesModel.handleWebSocketMessage,
      onSettlementAnalysisFinished: handleSettlementAnalysisFinished,
    },
  };
}
