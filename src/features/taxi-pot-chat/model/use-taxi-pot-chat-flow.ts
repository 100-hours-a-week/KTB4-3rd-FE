'use client';

import { useCallback, useState } from 'react';

import type { ChatWebSocketMessage } from '@/entities/chat';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

import type { TaxiPotDetailData, TaxiPotStatus } from '@/features/taxi-pot-chat/api/taxi-pot';
import { useTaxiPotStatusMutation } from '@/features/taxi-pot-chat/model/use-taxi-pot-status-mutation';

import type { TaxiPotRideAction } from './taxi-pot-chat';

type TaxiPotChatFlowOptions = {
  currentUserId?: number;
  initialRideAction?: TaxiPotRideAction;
  rideActionChatId?: string;
  rideActionHostId?: number;
  rideActionStatus?: string;
  taxiPotDetail?: TaxiPotDetailData;
  taxiPotId?: string;
};

type TaxiPotStatusState = {
  isHost: boolean;
  status: TaxiPotStatus;
  taxiPotId: string;
};

type TaxiPotRideActionState = {
  action: TaxiPotRideAction;
  chatId: string;
};

export function useTaxiPotChatFlow({
  currentUserId,
  initialRideAction,
  rideActionChatId,
  rideActionHostId,
  rideActionStatus,
  taxiPotDetail,
  taxiPotId,
}: TaxiPotChatFlowOptions) {
  const [rideActionState, setRideActionState] = useState<TaxiPotRideActionState>();
  const [statusState, setStatusState] = useState<TaxiPotStatusState>();
  const [evaluationChatId, setEvaluationChatId] = useState<string>();
  const statusMutation = useTaxiPotStatusMutation(taxiPotId ?? '');
  const isTaxiPot = taxiPotId !== undefined;
  const rideActionChatIdValue = taxiPotId ?? rideActionChatId;
  let isHost = rideActionHostId === currentUserId;

  if (isTaxiPot) {
    isHost = taxiPotDetail?.host_id === currentUserId;
  }

  if (statusState !== undefined && statusState.taxiPotId === taxiPotId) {
    isHost = statusState.isHost;
  }
  const status =
    statusState !== undefined && statusState.taxiPotId === taxiPotId
      ? statusState.status
      : taxiPotDetail?.status;
  const currentRideAction =
    rideActionState !== undefined && rideActionState.chatId === rideActionChatIdValue
      ? rideActionState.action
      : undefined;
  const currentRideActionStatus = isTaxiPot ? status : rideActionStatus;
  const canShowInitialRideAction =
    (initialRideAction === 'start' && currentRideActionStatus === 'RECRUITING') ||
    (initialRideAction === 'end' && currentRideActionStatus === 'IN_PROGRESS');
  const rideAction =
    currentRideAction ?? (canShowInitialRideAction ? initialRideAction : undefined);

  const handleWebSocketMessage = useCallback(
    (message: ChatWebSocketMessage) => {
      if (!rideActionChatIdValue) {
        return false;
      }

      if (message.type === 'SYSTEM_RIDE_START_REQUESTED') {
        setRideActionState({ chatId: rideActionChatIdValue, action: 'start' });
        return true;
      }

      if (message.type === 'SYSTEM_RIDE_END_REQUESTED') {
        setRideActionState({ chatId: rideActionChatIdValue, action: 'end' });
        return true;
      }

      if (message.type === 'SYSTEM_RIDE_STARTED') {
        setRideActionState(undefined);
        if (taxiPotId) {
          setStatusState({ taxiPotId, status: 'IN_PROGRESS', isHost });
        }
      }

      if (message.type === 'SYSTEM_RIDE_ENDED') {
        setRideActionState(undefined);
        if (taxiPotId) {
          setStatusState({ taxiPotId, status: 'COMPLETED', isHost });
        } else {
          setEvaluationChatId(rideActionChatIdValue);
        }
      }

      if (message.type === 'SYSTEM_SETTLEMENT_COMPLETED') {
        setEvaluationChatId(taxiPotId);
      }

      return false;
    },
    [isHost, rideActionChatIdValue, taxiPotId],
  );

  const confirmRideAction = useCallback(async () => {
    if (!rideActionChatIdValue || !rideAction || !isHost) {
      return;
    }

    if (!taxiPotId) {
      setRideActionState(undefined);
      return;
    }

    const nextStatus: Exclude<TaxiPotStatus, 'RECRUITING'> =
      rideAction === 'start' ? 'IN_PROGRESS' : 'COMPLETED';

    try {
      const response = await statusMutation.mutateAsync(nextStatus);

      setStatusState({ taxiPotId, status: response.data.status, isHost: true });
      setRideActionState(undefined);
    } catch {
      useSnackbarStore.getState().showSnackbar('요청 중 오류가 발생했어요', 'critical');
    }
  }, [isHost, rideAction, rideActionChatIdValue, statusMutation, taxiPotId]);

  return {
    confirmRideAction,
    handleWebSocketMessage,
    isEvaluationOpen: evaluationChatId !== undefined && evaluationChatId === rideActionChatIdValue,
    isHost,
    isPending: statusMutation.isPending,
    onEvaluationOpenChange: (open: boolean) =>
      setEvaluationChatId(open ? rideActionChatIdValue : undefined),
    rideAction,
    status,
  };
}
