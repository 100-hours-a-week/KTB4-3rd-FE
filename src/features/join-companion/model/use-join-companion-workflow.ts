'use client';

import { useCallback, useState } from 'react';

import { useJoinCompanionMutation } from './use-join-companion';

type RequireAuth = (action: () => void) => void;

export type JoinCompanionWorkflowOptions = {
  companionId: number | null;
  onJoined: (chatRoomId: number) => void;
  requireAuth: RequireAuth;
};

export function useJoinCompanionWorkflow({
  companionId,
  onJoined,
  requireAuth,
}: JoinCompanionWorkflowOptions) {
  const joinCompanionMutation = useJoinCompanionMutation();
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);

  const handleJoinClick = useCallback(() => {
    if (companionId === null) {
      return;
    }

    requireAuth(() => {
      setJoinErrorMessage(null);
      joinCompanionMutation.mutate(companionId, {
        onError: (error) => {
          setJoinErrorMessage(
            error instanceof Error ? error.message : '채팅방 참여에 실패했어요. 다시 시도해주세요.',
          );
        },
        onSuccess: ({ data }) => {
          setJoinErrorMessage(null);
          onJoined(data.chat_room_id);
        },
      });
    });
  }, [companionId, joinCompanionMutation, onJoined, requireAuth]);

  const handleJoinErrorDismiss = useCallback(() => {
    setJoinErrorMessage(null);
  }, []);

  return {
    isJoining: joinCompanionMutation.isPending,
    joinErrorMessage,
    onJoinClick: handleJoinClick,
    onJoinErrorDismiss: handleJoinErrorDismiss,
  };
}
