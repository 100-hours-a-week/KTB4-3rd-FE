export const carpoolMutationQueryKeys = {
  all: () => ['carpools'] as const,
  pins: () => [...carpoolMutationQueryKeys.all(), 'pins'] as const,
  nearby: () => [...carpoolMutationQueryKeys.all(), 'nearby'] as const,
  detail: (carpoolId: number) => [...carpoolMutationQueryKeys.all(), 'detail', carpoolId] as const,
};

export const chatRoomMutationQueryKeys = {
  all: () => ['chat-rooms'] as const,
};
