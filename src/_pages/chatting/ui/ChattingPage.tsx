'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import type { ChatWebSocketMessage } from '@/entities/chat';
import { useLeaveCompanionMutation } from '@/features/leave-companion';
import {
  createTaxiPotChatEntryMessages,
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
        participantMap.set(message.sender.id, message.sender.nickname);
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

function getLastPersistedMessageId(messages: readonly ChatRoomMessage[]) {
  let latestMessage: { id: string; numericId: number } | undefined;

  for (const message of messages) {
    const numericId = Number(message.id);

    if (!Number.isSafeInteger(numericId)) {
      continue;
    }

    if (!latestMessage || numericId > latestMessage.numericId) {
      latestMessage = { id: message.id, numericId };
    }
  }

  return latestMessage?.id;
}

export function ChattingPage({ roomId }: ChattingPageProps) {
  const router = useRouter();
  const [liveMessagesState, setLiveMessagesState] = useState<LiveMessagesState>({
    roomId,
    messages: [],
  });
  const { detailQuery, messagesQuery } = useChatRoomQueries(roomId);
  const currentUserQuery = useCurrentUserQuery();
  const ratingMutation = useChatRatingMutation();
  const reportMutation = useChatReportMutation();
  const leaveCompanionMutation = useLeaveCompanionMutation();
  const leaveTaxiPotMutation = useLeaveTaxiPotMutation();
  const readMarkerMutation = useChatRoomReadMarkerMutation();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ChatReportTarget | null>(null);
  const chatRoomDetail = detailQuery.data?.data;
  const companionId = chatRoomDetail?.companion_id;
  const currentUserId = currentUserQuery.data?.data.id;
  const taxiPotId =
    chatRoomDetail?.kind === 'TAXI_POT' ? String(chatRoomDetail.companion_id) : undefined;
  const isTaxiPot = taxiPotId !== undefined;
  const taxiPotQuery = useQuery({
    ...taxiPotQueries.detail(taxiPotId ?? ''),
    enabled: isTaxiPot,
  });
  const taxiPotDetail = taxiPotQuery.data?.data;
  const evaluationParticipants = useMemo(
    () =>
      createEvaluationParticipants(
        chatRoomDetail,
        messagesQuery.data?.data.items,
        currentUserQuery.data?.data.id,
      ),
    [chatRoomDetail, currentUserQuery.data?.data.id, messagesQuery.data?.data.items],
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

  const handleTaxiPotStartConfirmed = useCallback(
    (confirmedTaxiPotId: string) => {
      appendLiveMessage({
        id: `taxi-pot-ride-started-${confirmedTaxiPotId}`,
        kind: 'notice',
        content: '운행이 시작됐어요',
        variant: 'informative',
      });
    },
    [appendLiveMessage],
  );
  const taxiPotFlow = useTaxiPotChatFlow({
    onStartConfirmed: handleTaxiPotStartConfirmed,
    taxiPotDetail,
    taxiPotId,
  });

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
  const handleWebSocketMessage = useCallback(
    (message: ChatWebSocketMessage) => {
      if (taxiPotFlow.handleWebSocketMessage(message)) {
        return;
      }

      appendLiveMessage(createChatRoomMessageFromApi(message, currentUserId));
    },
    [appendLiveMessage, currentUserId, taxiPotFlow],
  );

  const baseRoom =
    chatRoomDetail && messagesQuery.data
      ? createChatRoomFromApi(chatRoomDetail, messagesQuery.data.data.items, currentUserId)
      : undefined;
  const taxiPotEntryMessages = taxiPotDetail
    ? createTaxiPotChatEntryMessages(taxiPotDetail).map(toChatRoomMessage)
    : [];
  const room: ChatRoom | undefined = baseRoom
    ? {
        ...baseRoom,
        memberCount: taxiPotDetail?.current_count ?? baseRoom.memberCount,
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
    () => getLastPersistedMessageId([...(room?.messages ?? []), ...liveMessages]),
    [liveMessages, room?.messages],
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
      if (isTaxiPot) {
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
  }, [companionId, isTaxiPot, leaveCompanionMutation, leaveTaxiPotMutation, router, taxiPotId]);
  const leaveLoading = leaveCompanionMutation.isPending || leaveTaxiPotMutation.isPending;

  return (
    <ChatRoomWebSocketConnection roomId={roomId} onMessage={handleWebSocketMessage}>
      {(connection) => (
        <ChattingPageContent
          connection={connection}
          detailQuery={detailQuery}
          evaluationParticipants={evaluationParticipants}
          isEvaluationOpen={taxiPotFlow.isEvaluationOpen}
          isLeaveDialogOpen={isLeaveDialogOpen}
          isReportDialogOpen={isReportDialogOpen}
          isTaxiPot={isTaxiPot}
          isTaxiPotHost={taxiPotFlow.isHost}
          messagesQuery={messagesQuery}
          onBack={handleBack}
          onEvaluationReport={handleEvaluationReport}
          onEvaluationSubmit={handleEvaluationSubmit}
          onEvaluationOpenChange={taxiPotFlow.onEvaluationOpenChange}
          onLeave={handleLeave}
          onLeaveConfirm={handleLeaveConfirm}
          onLeaveDialogChange={setIsLeaveDialogOpen}
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
          room={room}
          taxiPotDetail={taxiPotDetail}
          taxiPotQuery={taxiPotQuery}
          taxiPotStatus={taxiPotFlow.status}
          liveMessages={liveMessages}
        />
      )}
    </ChatRoomWebSocketConnection>
  );
}

type ChattingPageContentProps = {
  connection: ChatRoomWebSocketConnectionValue;
  detailQuery: ReturnType<typeof useChatRoomQueries>['detailQuery'];
  evaluationParticipants?: readonly ChatSatisfactionParticipant[];
  isEvaluationOpen: boolean;
  isLeaveDialogOpen: boolean;
  isReportDialogOpen: boolean;
  isTaxiPot: boolean;
  isTaxiPotHost: boolean;
  messagesQuery: ReturnType<typeof useChatRoomQueries>['messagesQuery'];
  onBack: () => void;
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
  onReport: (target: ChatReportTarget) => void;
  onReportDialogChange: (open: boolean) => void;
  onReportSubmit: (payload: ChatReportDialogSubmitPayload) => void;
  onRideActionConfirm: () => void;
  ratingLoading: boolean;
  reportLoading: boolean;
};

function ChattingPageContent({
  connection,
  detailQuery,
  evaluationParticipants,
  isEvaluationOpen,
  isLeaveDialogOpen,
  isReportDialogOpen,
  isTaxiPot,
  isTaxiPotHost,
  messagesQuery,
  onBack,
  onEvaluationReport,
  onEvaluationSubmit,
  onEvaluationOpenChange,
  onLeave,
  onLeaveConfirm,
  onLeaveDialogChange,
  onReport,
  onReportDialogChange,
  onReportSubmit,
  onRideActionConfirm,
  rideAction,
  rideActionLoading,
  ratingLoading,
  reportLoading,
  leaveLoading,
  room,
  taxiPotDetail,
  taxiPotQuery,
  taxiPotStatus,
  liveMessages,
}: ChattingPageContentProps) {
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
      className="absolute top-1.5 left-3 z-10 w-[calc(100%-24px)]"
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
          liveMessages={liveMessages}
          onReport={onReport}
          room={room}
          topContent={topContent}
        />
      </ChatRoomLayout>
      <SnackbarViewport className="fixed inset-x-0 bottom-[calc(78px+env(safe-area-inset-bottom,0px)+16px)] z-[2147483647] mx-auto max-w-[393px] px-5" />
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
    </>
  );
}
