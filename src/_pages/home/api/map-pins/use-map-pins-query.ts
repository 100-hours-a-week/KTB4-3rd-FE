import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { mapPinsQueries, type MapPinsResponse } from '@/entities/map-pin';
import type { MapViewport } from '@/shared/ui/map';

function toMapPinsQuery(viewport: MapViewport) {
  return {
    sw_lat: viewport.southWest.lat,
    sw_lng: viewport.southWest.lng,
    ne_lat: viewport.northEast.lat,
    ne_lng: viewport.northEast.lng,
  };
}

/**
 * 지도 범위별 핀 조회.
 *
 * 범위(query key)가 바뀌면 TanStack Query는 새 key의 데이터가 생길 때까지 `data`를 비운다.
 * 이 훅은 "마지막으로 받은 응답"을 보관했다가, 현재 범위에 응답(캐시 포함)이 없는 동안에만 대신 반환한다.
 *
 * 표시 기준
 * - 현재 범위의 응답이 있으면(새 응답, 캐시, 재조회 실패 후 유지된 응답) 그것을 표시한다. 빈 응답이면 핀을 비운다.
 * - 현재 범위의 응답이 없으면(요청 중, 실패, 범위 미확정) 직전 범위의 응답을 표시하고
 *   `isShowingPreviousRange`를 true로 둔다.
 * - 이전 응답 자체가 없으면(첫 조회) `data`는 undefined다.
 */
export function useMapPinsQuery(viewport: MapViewport | null) {
  const query = viewport ? toMapPinsQuery(viewport) : null;
  const queryResult = useQuery(mapPinsQueries.list(query));
  const [lastResponse, setLastResponse] = useState<MapPinsResponse | undefined>(undefined);
  const currentRangeResponse = queryResult.data;

  if (currentRangeResponse !== undefined && currentRangeResponse !== lastResponse) {
    setLastResponse(currentRangeResponse);
  }

  return {
    ...queryResult,
    data: currentRangeResponse ?? lastResponse,
    isShowingPreviousRange: currentRangeResponse === undefined && lastResponse !== undefined,
  };
}
