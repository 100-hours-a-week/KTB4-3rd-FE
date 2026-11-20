import {
  TransferCompletionConfirmationSystemMessage,
  TransferCompletionSystemMessage,
  TaxiMeterPhotoRequest,
  TaxiPotSettlementRequestSystemMessage,
  TransferPhotoRequest,
} from '@/features/taxi-pot-settlement';
import { ChatNotice } from '@/features/chatting';
import { BANK_ACCOUNT_OPTIONS } from '@/entities/user';
import { cn } from '@/shared/lib/cn';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

import type { ChatRoomMessage } from '@/_pages/chatting/model/chat-room';

import { ChatMessageItem, getMessageClassName } from './chat-message-item';
import type { ChatReportTarget } from './chat-message-menu';

export type TaxiPotMeterMessageProps = {
  analysisResetKey?: number;
  isTaxiPotHost?: boolean;
  meterSettlementId?: number;
  onManualMeterEntry?: (settlementId: number) => void;
  onRegisterMeterPhotoPicker?: (openPicker: (() => void) | null) => void;
  onSendMeterPhoto?: (settlementId: number, file: File) => void;
  onViewMeterImage?: (settlementId: number) => void;
  remainingMeterAttempts?: number;
  uploadingMeterPhoto?: boolean;
};

export type TaxiPotTransferMessageProps = {
  analysisResetKey?: number;
  onAcknowledgeSettlement?: (settlementId: number) => void;
  completingSettlement?: boolean;
  isTaxiPotHost?: boolean;
  currentUserId?: number;
  onSendTransferPhoto?: (settlementId: number, file: File) => void;
  transferPhotoDisabled?: boolean;
  onRegisterTransferPhotoPicker?: (settlementId: number, openPicker: (() => void) | null) => void;
  onViewTransferProof?: (settlementId: number, userId: number) => void;
  transferAmount?: number;
  transferSettlementId?: number;
  uploadingTransferPhoto?: boolean;
};

export type TaxiPotChatMessageItemProps = {
  message: ChatRoomMessage;
  index: number;
  onReport: (target: ChatReportTarget) => void;
  meter?: TaxiPotMeterMessageProps;
  transfer?: TaxiPotTransferMessageProps;
};

function getTransferCompletionDetails(content: string, fallbackAmount: number) {
  const nickname = content.match(/^(.+?)님이 송금을 완료했어요!?/)?.[1] ?? '동승자';
  const amountText = content.match(/(?:금액\s*)?([\d,]+)\s*원/)?.[1];

  return {
    amount: amountText ? Number(amountText.replaceAll(',', '')) : fallbackAmount,
    nickname,
  };
}

async function copyBankAccount(bankAccount: string) {
  if (!navigator.clipboard) {
    useSnackbarStore.getState().showSnackbar('계좌번호를 복사하지 못했어요', 'critical');
    return;
  }

  try {
    await navigator.clipboard.writeText(bankAccount);
    useSnackbarStore.getState().showSnackbar('복사완료', 'positive');
  } catch {
    useSnackbarStore.getState().showSnackbar('계좌번호를 복사하지 못했어요', 'critical');
  }
}

export function TaxiPotChatMessageItem({
  message,
  index,
  onReport,
  meter,
  transfer,
}: TaxiPotChatMessageItemProps) {
  if (message.kind !== 'notice') {
    return <ChatMessageItem index={index} message={message} onReport={onReport} />;
  }

  const className = getMessageClassName(message, index);
  const systemMessageClassName = getMessageClassName(message, index, 'start');
  const transferSettlementId = transfer?.transferSettlementId;

  if (message.systemType === 'SYSTEM_METER_REQUESTED') {
    if (meter?.isTaxiPotHost && meter.onSendMeterPhoto) {
      return (
        <TaxiMeterPhotoRequest
          className={systemMessageClassName}
          key={`meter-photo-${meter.analysisResetKey ?? 0}`}
          onSend={(file) => {
            if (meter.meterSettlementId !== undefined) {
              meter.onSendMeterPhoto?.(meter.meterSettlementId, file);
            }
          }}
          onManualEntry={() => {
            if (meter.meterSettlementId !== undefined) {
              meter.onManualMeterEntry?.(meter.meterSettlementId);
            }
          }}
          onRegisterPhotoPicker={meter.onRegisterMeterPhotoPicker}
          remainingAttempts={meter.remainingMeterAttempts}
          sending={meter.uploadingMeterPhoto}
        />
      );
    }

    return (
      <ChatNotice className={className} data-message-id={message.id} variant={message.variant}>
        방장의 정산 요청을 기다리고있어요
      </ChatNotice>
    );
  }

  if (message.systemType === 'SYSTEM_TRANSFER_REQUESTED') {
    const isHost =
      transfer?.currentUserId === undefined
        ? transfer?.isTaxiPotHost
        : message.settlement.payee.id === transfer.currentUserId;
    const role = isHost ? 'host' : 'passenger';
    const bankName =
      BANK_ACCOUNT_OPTIONS.find(({ value }) => value === message.settlement.payee.bank_name)
        ?.label ?? message.settlement.payee.bank_name;
    const bankAccount = `${bankName} ${message.settlement.payee.account_no}`;
    const requestMessage =
      role === 'host' ? (
        <TaxiPotSettlementRequestSystemMessage
          bankAccount={bankAccount}
          onBankAccountClick={copyBankAccount}
          perPersonAmount={message.settlement.amount_per_person}
          role="host"
        />
      ) : (
        <TaxiPotSettlementRequestSystemMessage
          bankAccount={bankAccount}
          onBankAccountClick={copyBankAccount}
          perPersonAmount={message.settlement.amount_per_person}
          role="passenger"
          totalAmount={message.settlement.total_amount}
          onViewMeterPhoto={() => meter?.onViewMeterImage?.(message.settlement.settlement_id)}
        />
      );

    return (
      <div className={cn('flex flex-col gap-3', systemMessageClassName)}>
        {requestMessage}
        {role === 'passenger' && transfer?.onSendTransferPhoto ? (
          <TransferPhotoRequest
            settlementId={message.settlement.settlement_id}
            key={`transfer-photo-${transfer.analysisResetKey ?? 0}`}
            onRegisterPhotoPicker={transfer.onRegisterTransferPhotoPicker}
            onSend={(file) =>
              transfer.onSendTransferPhoto?.(message.settlement.settlement_id, file)
            }
            disabled={transfer.transferPhotoDisabled}
            sending={transfer.uploadingTransferPhoto}
          />
        ) : null}
      </div>
    );
  }

  if (message.systemType === 'SYSTEM_TRANSFER_DONE') {
    const { amount, nickname } = getTransferCompletionDetails(
      message.content,
      transfer?.transferAmount ?? 0,
    );

    return (
      <TransferCompletionSystemMessage
        amount={amount}
        className={systemMessageClassName}
        nickname={nickname}
        onViewReceipt={
          transfer?.isTaxiPotHost &&
          transferSettlementId !== undefined &&
          message.transferUserId !== undefined &&
          transfer.onViewTransferProof
            ? () => {
                if (transferSettlementId !== undefined) {
                  transfer.onViewTransferProof?.(transferSettlementId, message.transferUserId);
                }
              }
            : undefined
        }
      />
    );
  }

  if (
    message.systemType === 'SYSTEM_SETTLEMENT_CONFIRM_REQUESTED' ||
    message.systemType === 'SYSTEM_TRANSFER_UNVERIFIED'
  ) {
    if (message.systemType === 'SYSTEM_TRANSFER_UNVERIFIED' && !transfer?.isTaxiPotHost) {
      return null;
    }

    return (
      <TransferCompletionConfirmationSystemMessage
        className={systemMessageClassName}
        acknowledging={transfer?.completingSettlement}
        description={
          message.systemType === 'SYSTEM_TRANSFER_UNVERIFIED'
            ? '송금 확인이 어려우면 대면으로 내역 확인 후 버튼을 눌러주세요.'
            : undefined
        }
        onAcknowledge={
          transferSettlementId === undefined || !transfer?.onAcknowledgeSettlement
            ? undefined
            : () => {
                if (transferSettlementId !== undefined) {
                  transfer.onAcknowledgeSettlement?.(transferSettlementId);
                }
              }
        }
      />
    );
  }

  return (
    <ChatNotice className={className} data-message-id={message.id} variant={message.variant}>
      {message.content}
    </ChatNotice>
  );
}
