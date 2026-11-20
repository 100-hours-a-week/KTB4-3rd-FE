export const carpoolDetailQueryKeys = {
  all: () => ['carpools', 'detail'] as const,
  carpool: (carpoolId: number) => [...carpoolDetailQueryKeys.all(), carpoolId] as const,
  detail: (carpoolId: number, viewerId: number | null) =>
    [...carpoolDetailQueryKeys.carpool(carpoolId), { viewerId }] as const,
};
