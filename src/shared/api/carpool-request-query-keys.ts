export type CarpoolRequestDirection = 'SENT' | 'RECEIVED';

export const carpoolRequestQueryKeys = {
  all: () => ['carpools', 'requests'] as const,
  lists: (viewerId: number) => [...carpoolRequestQueryKeys.all(), { viewerId }, 'list'] as const,
  list: (viewerId: number, direction: CarpoolRequestDirection) =>
    [...carpoolRequestQueryKeys.lists(viewerId), direction] as const,
  detail: (viewerId: number, carpoolId: number, requestId: number) =>
    [...carpoolRequestQueryKeys.all(), { viewerId }, 'detail', carpoolId, requestId] as const,
};
