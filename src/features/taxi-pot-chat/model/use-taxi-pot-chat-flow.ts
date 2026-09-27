'use client';

import { useCallback, useState } from 'react';

import type { ChatWebSocketMessage } from '@/entities/chat';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

import type { TaxiPotDetailData, TaxiPotStatus } from '@/features/taxi-pot-chat/api/taxi-pot';
import { useTaxiPotStatusMutation } from '@/features/taxi-pot-chat/model/use-taxi-pot-status-mutation';

import type { TaxiPotRideAction } from './taxi-pot-chat';

type TaxiPotChatFlowOptions = {
  taxiPotDetail?: TaxiPotDetailData;
  taxiPotId?: string;
  onStartConfirmed?: (taxiPotId: string) => void;
};

type TaxiPotStatusState = {
  isHost: boolean;
  status: TaxiPotStatus;
  taxiPotId: string;
};

type TaxiPotRideActionState = {
  action: TaxiPotRideAction;
  taxiPotId: string;
};

export function useTaxiPotChatFlow({
  onStartConfirmed,
  taxiPotDetail,
  taxiPotId,
}: TaxiPotChatFlowOptions) {
  const [rideActionState, setRideActionState] = useState<TaxiPotRideActionState>();
  const [statusState, setStatusState] = useState<TaxiPotStatusState>();
  const statusMutation = useTaxiPotStatusMutation(taxiPotId ?? '');
  const isTaxiPot = taxiPotId !== undefined;
  const isHost =
    statusState !== undefined && statusState.taxiPotId === taxiPotId
      ? statusState.isHost
      : isTaxiPot && taxiPotDetail?.current_count === 1;
  const status =
    statusState !== undefined && statusState.taxiPotId === taxiPotId
      ? statusState.status
      : taxiPotDetail?.status;
  const rideAction =
    rideActionState !== undefined && rideActionState.taxiPotId === taxiPotId
      ? rideActionState.action
      : undefined;

  const handleWebSocketMessage = useCallback(
    (message: ChatWebSocketMessage) => {
      if (!taxiPotId) {
        return false;
      }

      if (message.type === 'SYSTEM_RIDE_START_REQUESTED') {
        setRideActionState({ taxiPotId, action: 'start' });
        return true;
      }

      if (message.type === 'SYSTEM_RIDE_STARTED') {
        setRideActionState(undefined);
        setStatusState({ taxiPotId, status: 'IN_PROGRESS', isHost });
      }

      return false;
    },
    [isHost, taxiPotId],
  );

  const confirmRideAction = useCallback(async () => {
    if (!taxiPotId || !rideAction || !isHost) {
      return;
    }

    const nextStatus: Exclude<TaxiPotStatus, 'RECRUITING'> = 'IN_PROGRESS';

    try {
      const response = await statusMutation.mutateAsync(nextStatus);

      setStatusState({ taxiPotId, status: response.data.status, isHost: true });
      setRideActionState(undefined);

      onStartConfirmed?.(taxiPotId);
    } catch {
      useSnackbarStore.getState().showSnackbar('요청 중 오류가 발생했어요', 'critical');
    }
  }, [isHost, onStartConfirmed, rideAction, statusMutation, taxiPotId]);

  return {
    confirmRideAction,
    handleWebSocketMessage,
    isHost,
    isPending: statusMutation.isPending,
    rideAction,
    status,
  };
}
