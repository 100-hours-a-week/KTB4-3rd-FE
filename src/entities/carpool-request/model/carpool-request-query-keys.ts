export const carpoolRequestQueryKeys = {
  all: () => ['carpools', 'requests'] as const,
  viewer: (viewerId: number) => [...carpoolRequestQueryKeys.all(), { viewerId }] as const,
  listPrefix: (viewerId: number) => [...carpoolRequestQueryKeys.viewer(viewerId), 'list'] as const,
  list: (viewerId: number, direction: 'SENT' | 'RECEIVED') =>
    [...carpoolRequestQueryKeys.listPrefix(viewerId), direction] as const,
  detail: (viewerId: number, carpoolId: number, requestId: number) =>
    [...carpoolRequestQueryKeys.viewer(viewerId), 'detail', carpoolId, requestId] as const,
};
