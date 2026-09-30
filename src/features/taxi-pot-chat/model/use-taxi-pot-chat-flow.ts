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
  currentUserId,
  initialRideAction,
  onStartConfirmed,
  taxiPotDetail,
  taxiPotId,
}: TaxiPotChatFlowOptions) {
  const [rideActionState, setRideActionState] = useState<TaxiPotRideActionState>();
  const [statusState, setStatusState] = useState<TaxiPotStatusState>();
  const [evaluationTaxiPotId, setEvaluationTaxiPotId] = useState<string>();
  const statusMutation = useTaxiPotStatusMutation(taxiPotId ?? '');
  const isTaxiPot = taxiPotId !== undefined;
  const isHost =
    statusState !== undefined && statusState.taxiPotId === taxiPotId
      ? statusState.isHost
      : isTaxiPot && taxiPotDetail?.host_id === currentUserId;
  const status =
    statusState !== undefined && statusState.taxiPotId === taxiPotId
      ? statusState.status
      : taxiPotDetail?.status;
  const currentRideAction =
    rideActionState !== undefined && rideActionState.taxiPotId === taxiPotId
      ? rideActionState.action
      : undefined;
  const canShowInitialRideAction =
    (initialRideAction === 'start' && status === 'RECRUITING') ||
    (initialRideAction === 'end' && status === 'IN_PROGRESS');
  const rideAction =
    currentRideAction ?? (canShowInitialRideAction ? initialRideAction : undefined);

  const handleWebSocketMessage = useCallback(
    (message: ChatWebSocketMessage) => {
      if (!taxiPotId) {
        return false;
      }

      if (message.type === 'SYSTEM_RIDE_START_REQUESTED') {
        setRideActionState({ taxiPotId, action: 'start' });
        return true;
      }

      if (message.type === 'SYSTEM_RIDE_END_REQUESTED') {
        setRideActionState({ taxiPotId, action: 'end' });
        return true;
      }

      if (message.type === 'SYSTEM_RIDE_STARTED') {
        setRideActionState(undefined);
        setStatusState({ taxiPotId, status: 'IN_PROGRESS', isHost });
      }

      if (message.type === 'SYSTEM_RIDE_ENDED') {
        setRideActionState(undefined);
        setStatusState({ taxiPotId, status: 'COMPLETED', isHost });
      }

      return false;
    },
    [isHost, taxiPotId],
  );

  const confirmRideAction = useCallback(async () => {
    if (!taxiPotId || !rideAction || !isHost) {
      return;
    }

    const nextStatus: Exclude<TaxiPotStatus, 'RECRUITING'> =
      rideAction === 'start' ? 'IN_PROGRESS' : 'COMPLETED';

    try {
      const response = await statusMutation.mutateAsync(nextStatus);

      setStatusState({ taxiPotId, status: response.data.status, isHost: true });
      setRideActionState(undefined);

      if (nextStatus === 'IN_PROGRESS') {
        onStartConfirmed?.(taxiPotId);
      } else {
        setEvaluationTaxiPotId(taxiPotId);
      }
    } catch {
      useSnackbarStore.getState().showSnackbar('요청 중 오류가 발생했어요', 'critical');
    }
  }, [isHost, onStartConfirmed, rideAction, statusMutation, taxiPotId]);

  return {
    confirmRideAction,
    handleWebSocketMessage,
    isEvaluationOpen: taxiPotId !== undefined && evaluationTaxiPotId === taxiPotId,
    isHost,
    isPending: statusMutation.isPending,
    onEvaluationOpenChange: (open: boolean) => setEvaluationTaxiPotId(open ? taxiPotId : undefined),
    rideAction,
    status,
  };
}
