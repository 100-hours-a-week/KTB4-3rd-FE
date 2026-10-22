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

function getInitialRideAction(
  rideAction: TaxiPotRideAction | undefined,
  status: TaxiPotStatus | undefined,
) {
  if (rideAction === 'start' && status === 'RECRUITING') {
    return 'start' as const;
  }

  if (rideAction === 'end' && status === 'IN_PROGRESS') {
    return 'end' as const;
  }

  return undefined;
}

export function useTaxiPotChatFlow({
  currentUserId,
  initialRideAction,
  taxiPotDetail,
  taxiPotId,
}: TaxiPotChatFlowOptions) {
  const [rideActionState, setRideActionState] = useState<TaxiPotRideActionState>();
  const [statusState, setStatusState] = useState<TaxiPotStatusState>();
  const [evaluationTaxiPotId, setEvaluationTaxiPotId] = useState<string>();
  const statusMutation = useTaxiPotStatusMutation(taxiPotId ?? '');
  const isCurrentTaxiPot = statusState?.taxiPotId === taxiPotId;
  const isHost = isCurrentTaxiPot
    ? (statusState?.isHost ?? false)
    : taxiPotDetail?.host_id !== undefined && taxiPotDetail.host_id === currentUserId;
  const status = isCurrentTaxiPot ? statusState?.status : taxiPotDetail?.status;
  const rideAction =
    rideActionState?.taxiPotId === taxiPotId
      ? rideActionState?.action
      : getInitialRideAction(initialRideAction, status);

  const handleWebSocketMessage = useCallback(
    (message: ChatWebSocketMessage) => {
      if (!taxiPotId) {
        return false;
      }

      if (message.type === 'SYSTEM_RIDE_START_REQUESTED') {
        setRideActionState({ action: 'start', taxiPotId });
        return true;
      }

      if (message.type === 'SYSTEM_RIDE_END_REQUESTED') {
        setRideActionState({ action: 'end', taxiPotId });
        return true;
      }

      if (message.type === 'SYSTEM_RIDE_STARTED') {
        setRideActionState(undefined);
        setStatusState({ isHost, status: 'IN_PROGRESS', taxiPotId });
      }

      if (message.type === 'SYSTEM_RIDE_ENDED') {
        setRideActionState(undefined);
        setStatusState({ isHost, status: 'COMPLETED', taxiPotId });
        setEvaluationTaxiPotId(taxiPotId);
      }

      if (message.type === 'SYSTEM_SETTLEMENT_COMPLETED') {
        setEvaluationTaxiPotId(taxiPotId);
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

      setStatusState({ isHost: true, status: response.data.status, taxiPotId });
      setRideActionState(undefined);
    } catch {
      useSnackbarStore.getState().showSnackbar('요청 중 오류가 발생했어요', 'critical');
    }
  }, [isHost, rideAction, statusMutation, taxiPotId]);

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
