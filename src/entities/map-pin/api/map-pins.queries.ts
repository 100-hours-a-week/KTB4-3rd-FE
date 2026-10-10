import { queryOptions } from '@tanstack/react-query';

import { getMapPins } from './get-map-pins';
import type { MapPinsQuery } from './map-pins.types';

export const mapPinsQueries = {
  all: () => ['map-pins'] as const,
  list: (query: MapPinsQuery | null) =>
    queryOptions({
      queryKey: [...mapPinsQueries.all(), 'list', query] as const,
      enabled: query !== null,
      queryFn: () => {
        if (!query) {
          throw new Error('지도 범위가 없어 지도 핀을 조회할 수 없습니다.');
        }

        return getMapPins(query);
      },
    }),
};
