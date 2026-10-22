'use client';

import { useEffect } from 'react';

import {
  ChatLeaveDialog,
  ChatReportDialog,
  type ChatReportDialogSubmitPayload,
  ChatSatisfactionDialog,
  type ChatSatisfactionDialogSubmitPayload,
  type ChatSatisfactionParticipant,
  type ChatRoomWebSocketConnectionValue,
} from '@/features/chatting';
import {
  TaxiPotAnnouncement,
  TaxiPotRideActionNotice,
  type TaxiPotDetailData,
  type TaxiPotRideAction,
  type TaxiPotStatus,
} from '@/features/taxi-pot-chat';
import {
  SettlementMeterImageDialog,
  SettlementTransferProofDialog,
  TaxiMeterAnalysisDialog,
  TaxiMeterAmountDialog,
  TransferConfirmationAnalysisDialog,
  TransferConfirmationRecognitionFailedDialog,
} from '@/features/taxi-pot-settlement';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';

import type { ChatRoom, ChatRoomMessage } from '@/_pages/chatting/model/chat-room';
import type { ChatReportTarget } from '@/_pages/chatting/model/chat-report-target';
import { ChatRoomContent } from './chat-room-content';
import { ChatRoomLayout } from './chat-room-layout';
import { ChatRoomState } from './chat-room-state';

type TransferProofTarget = {
  settlementId: number;
  userId: number;
} | null;

type MeterImageTarget = number | null;

type QueryState = {
  isError: boolean;
  isPending: boolean;
};

type ChattingPageContentProps = {
  connection: ChatRoomWebSocketConnectionValue;
  detailQuery: QueryState;
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
  isRideActionHost: boolean;
  isTaxiPot: boolean;
  isTaxiPotHost: boolean;
  messagesQuery: QueryState;
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
  analysisResetKey: number;
  onManualMeterEntry: (settlementId?: number) => void;
  meterSettlementId?: number;
  remainingMeterAttempts?: number;
  onSendTransferPhoto: (settlementId: number, file: File) => void;
  transferSubmissionBlockedSettlementId: number | null;
  onRegisterMeterPhotoPicker: (openPicker: (() => void) | null) => void;
  onRegisterTransferPhotoPicker: (settlementId: number, openPicker: (() => void) | null) => void;
  onViewTransferProof: (settlementId: number, nickname: string) => void;
  onViewMeterImage: (settlementId: number) => void;
  transferProofTarget: TransferProofTarget;
  meterImageTarget: MeterImageTarget;
  onMeterImageOpenChange: (open: boolean) => void;
  onTransferProofOpenChange: (open: boolean) => void;
  onMeterAmountOpenChange: (open: boolean) => void;
  onMeterAmountChange: (value: string) => void;
  onRetakeMeterPhoto: () => void;
  onReselectTransferPhoto: () => void;
  onSettleMeterAmount: () => void;
  activeMeterAmountTarget: { recognitionFailed: boolean } | null;
  activeTransferFailedSettlementId: number | null;
  isMeterAnalysisDelayed: boolean;
  isMeterAnalysisOpen: boolean;
  isTransferAnalysisOpen: boolean;
  meterAmount: string;
  savingSettlementAmount: boolean;
  uploadingSettlementPhoto: boolean;
  currentUserId?: number;
  hideMeterRequestMessage: boolean;
};

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

export function ChattingPageContent({
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
  isRideActionHost,
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
  analysisResetKey,
  onManualMeterEntry,
  meterSettlementId,
  remainingMeterAttempts,
  onSendTransferPhoto,
  transferSubmissionBlockedSettlementId,
  onRegisterMeterPhotoPicker,
  onRegisterTransferPhotoPicker,
  onViewTransferProof,
  onViewMeterImage,
  transferProofTarget,
  meterImageTarget,
  onMeterImageOpenChange,
  onTransferProofOpenChange,
  onMeterAmountOpenChange,
  onMeterAmountChange,
  onRetakeMeterPhoto,
  onReselectTransferPhoto,
  onSettleMeterAmount,
  activeMeterAmountTarget,
  activeTransferFailedSettlementId,
  isMeterAnalysisDelayed,
  isMeterAnalysisOpen,
  isTransferAnalysisOpen,
  meterAmount,
  savingSettlementAmount,
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
    isRideActionHost && rideAction ? (
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
          settlementId={taxiPotDetail?.settlement_id}
          onLoadPreviousMessages={onLoadPreviousMessages}
          onLoadNewerMessages={onLoadNewerMessages}
          onReport={onReport}
          onAcknowledgeSettlement={isTaxiPotHost ? onAcknowledgeSettlement : undefined}
          completingSettlement={completingSettlement}
          isTaxiPotHost={isTaxiPotHost}
          currentUserId={currentUserId}
          onSendMeterPhoto={onSendMeterPhoto}
          analysisResetKey={analysisResetKey}
          onManualMeterEntry={onManualMeterEntry}
          meterSettlementId={meterSettlementId}
          remainingMeterAttempts={remainingMeterAttempts}
          onSendTransferPhoto={onSendTransferPhoto}
          transferSubmissionBlockedSettlementId={transferSubmissionBlockedSettlementId}
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
      <TaxiMeterAnalysisDialog
        delayed={isMeterAnalysisDelayed}
        onManualEntry={onManualMeterEntry}
        open={isMeterAnalysisOpen}
      />
      <TaxiMeterAmountDialog
        onOpenChange={onMeterAmountOpenChange}
        onRetakePhoto={onRetakeMeterPhoto}
        onSettle={onSettleMeterAmount}
        onValueChange={onMeterAmountChange}
        open={activeMeterAmountTarget !== null}
        allowRetakePhoto={remainingMeterAttempts !== 0}
        recognitionFailed={activeMeterAmountTarget?.recognitionFailed}
        submitting={savingSettlementAmount}
        value={meterAmount}
      />
      <TransferConfirmationAnalysisDialog open={isTransferAnalysisOpen} />
      <TransferConfirmationRecognitionFailedDialog
        onReselectPhoto={onReselectTransferPhoto}
        open={activeTransferFailedSettlementId !== null}
      />
    </>
  );
}
