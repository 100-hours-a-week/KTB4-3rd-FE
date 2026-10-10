export const carpoolQueryKeys = {
  all: () => ['carpools'] as const,
  pins: () => [...carpoolQueryKeys.all(), 'pins'] as const,
  nearby: () => [...carpoolQueryKeys.all(), 'nearby'] as const,
};
