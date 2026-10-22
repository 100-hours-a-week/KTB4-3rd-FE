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
  rideActionStatus?: TaxiPotStatus;
  rideStatusMutation?: RideStatusMutation;
  taxiPotDetail?: TaxiPotDetailData;
  taxiPotId?: string;
};

type TaxiPotStatusState = {
  chatId: string;
  isHost: boolean;
  status: TaxiPotStatus;
};

type TaxiPotRideActionState = {
  action: TaxiPotRideAction;
  chatId: string;
};

type RideStatusMutation = {
  isPending: boolean;
  mutateAsync: (status: Exclude<TaxiPotStatus, 'RECRUITING'>) => Promise<{
    data: { status: TaxiPotStatus };
  }>;
};

export function useTaxiPotChatFlow({
  currentUserId,
  initialRideAction,
  rideActionChatId,
  rideActionHostId,
  rideActionStatus,
  rideStatusMutation,
  taxiPotDetail,
  taxiPotId,
}: TaxiPotChatFlowOptions) {
  const [rideActionState, setRideActionState] = useState<TaxiPotRideActionState>();
  const [statusState, setStatusState] = useState<TaxiPotStatusState>();
  const [evaluationChatId, setEvaluationChatId] = useState<string>();
  const taxiPotStatusMutation = useTaxiPotStatusMutation(taxiPotId ?? '');
  const statusMutation = rideStatusMutation ?? taxiPotStatusMutation;
  const isTaxiPot = taxiPotId !== undefined;
  const rideActionChatIdValue = taxiPotId ?? rideActionChatId;
  const isStatusForCurrentChat =
    rideActionChatIdValue !== undefined && statusState?.chatId === rideActionChatIdValue;
  let isHost = rideActionHostId !== undefined && rideActionHostId === currentUserId;

  if (isStatusForCurrentChat) {
    isHost = statusState.isHost;
  } else if (isTaxiPot) {
    isHost = taxiPotDetail?.host_id === currentUserId;
  }

  let status = rideActionStatus;

  if (isStatusForCurrentChat) {
    status = statusState.status;
  } else if (isTaxiPot) {
    status = taxiPotDetail?.status;
  }
  const currentRideAction =
    rideActionState !== undefined && rideActionState.chatId === rideActionChatIdValue
      ? rideActionState.action
      : undefined;
  const canShowInitialRideAction =
    (initialRideAction === 'start' && status === 'RECRUITING') ||
    (initialRideAction === 'end' && status === 'IN_PROGRESS');
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
        setStatusState({ chatId: rideActionChatIdValue, status: 'IN_PROGRESS', isHost });
      }

      if (message.type === 'SYSTEM_RIDE_ENDED') {
        setRideActionState(undefined);
        setStatusState({ chatId: rideActionChatIdValue, status: 'COMPLETED', isHost });

        if (!taxiPotId) {
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

    const nextStatus: Exclude<TaxiPotStatus, 'RECRUITING'> =
      rideAction === 'start' ? 'IN_PROGRESS' : 'COMPLETED';

    try {
      const response = await statusMutation.mutateAsync(nextStatus);

      setStatusState({
        chatId: rideActionChatIdValue,
        status: response.data.status,
        isHost: true,
      });
      setRideActionState(undefined);
    } catch {
      useSnackbarStore.getState().showSnackbar('요청 중 오류가 발생했어요', 'critical');
    }
  }, [isHost, rideAction, rideActionChatIdValue, statusMutation]);

  return {
    confirmRideAction,
    handleWebSocketMessage,
    isEvaluationOpen:
      rideActionChatIdValue !== undefined && evaluationChatId === rideActionChatIdValue,
    isHost,
    isPending: statusMutation.isPending,
    onEvaluationOpenChange: (open: boolean) =>
      setEvaluationChatId(open ? rideActionChatIdValue : undefined),
    rideAction,
    status,
  };
}
