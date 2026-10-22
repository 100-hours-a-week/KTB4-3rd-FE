'use client';

import { useCallback, useState } from 'react';

import type { ChatWebSocketMessage } from '@/entities/chat';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

import { useCarpoolStatusMutation } from './use-carpool-status-mutation';
import type { CarpoolStatus } from '@/features/carpool-chat/api/carpool';

type CarpoolRideAction = 'start' | 'end';

type CarpoolChatFlowOptions = {
  carpoolId?: string;
  currentUserId?: number;
  hostId?: number;
  initialRideAction?: CarpoolRideAction;
  status?: CarpoolStatus;
};

type CarpoolStatusState = {
  chatId: string;
  isHost: boolean;
  status: CarpoolStatus;
};

type CarpoolRideActionState = {
  action: CarpoolRideAction;
  chatId: string;
};

function getInitialRideAction(
  rideAction: CarpoolRideAction | undefined,
  status: CarpoolStatus | undefined,
) {
  if (rideAction === 'start' && status === 'RECRUITING') {
    return 'start' as const;
  }

  if (rideAction === 'end' && status === 'IN_PROGRESS') {
    return 'end' as const;
  }

  return undefined;
}

export function useCarpoolChatFlow({
  carpoolId,
  currentUserId,
  hostId,
  initialRideAction,
  status: initialStatus,
}: CarpoolChatFlowOptions) {
  const [rideActionState, setRideActionState] = useState<CarpoolRideActionState>();
  const [statusState, setStatusState] = useState<CarpoolStatusState>();
  const [evaluationChatId, setEvaluationChatId] = useState<string>();
  const statusMutation = useCarpoolStatusMutation(carpoolId ?? '');
  const isCurrentChatStatus = statusState?.chatId === carpoolId;
  const isHost = isCurrentChatStatus
    ? (statusState?.isHost ?? false)
    : hostId !== undefined && hostId === currentUserId;
  const status = isCurrentChatStatus ? statusState?.status : initialStatus;
  const rideAction =
    rideActionState?.chatId === carpoolId
      ? rideActionState?.action
      : getInitialRideAction(initialRideAction, status);

  const handleWebSocketMessage = useCallback(
    (message: ChatWebSocketMessage) => {
      if (!carpoolId) {
        return false;
      }

      if (message.type === 'SYSTEM_RIDE_START_REQUESTED') {
        setRideActionState({ action: 'start', chatId: carpoolId });
        return true;
      }

      if (message.type === 'SYSTEM_RIDE_END_REQUESTED') {
        setRideActionState({ action: 'end', chatId: carpoolId });
        return true;
      }

      if (message.type === 'SYSTEM_RIDE_STARTED') {
        setRideActionState(undefined);
        setStatusState({ chatId: carpoolId, isHost, status: 'IN_PROGRESS' });
      }

      if (message.type === 'SYSTEM_RIDE_ENDED') {
        setRideActionState(undefined);
        setStatusState({ chatId: carpoolId, isHost, status: 'COMPLETED' });
        setEvaluationChatId(carpoolId);
      }

      return false;
    },
    [carpoolId, isHost],
  );

  const confirmRideAction = useCallback(async () => {
    if (!carpoolId || !rideAction || !isHost) {
      return;
    }

    const nextStatus = rideAction === 'start' ? 'IN_PROGRESS' : 'COMPLETED';

    try {
      const response = await statusMutation.mutateAsync(nextStatus);

      setStatusState({ chatId: carpoolId, isHost: true, status: response.data.status });
      setRideActionState(undefined);
    } catch {
      useSnackbarStore.getState().showSnackbar('요청 중 오류가 발생했어요', 'critical');
    }
  }, [carpoolId, isHost, rideAction, statusMutation]);

  return {
    confirmRideAction,
    handleWebSocketMessage,
    isEvaluationOpen: carpoolId !== undefined && evaluationChatId === carpoolId,
    isHost,
    isPending: statusMutation.isPending,
    onEvaluationOpenChange: (open: boolean) => setEvaluationChatId(open ? carpoolId : undefined),
    rideAction,
    status,
  };
}
