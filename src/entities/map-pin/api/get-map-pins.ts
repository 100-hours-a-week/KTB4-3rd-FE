import { apiFetch } from '@/shared/api/client';
import type { MapPinsQuery, MapPinsResponse } from './map-pins.types';

export function getMapPins(query: MapPinsQuery): Promise<MapPinsResponse> {
  const searchParams = new URLSearchParams({
    sw_lat: String(query.sw_lat),
    sw_lng: String(query.sw_lng),
    ne_lat: String(query.ne_lat),
    ne_lng: String(query.ne_lng),
  });

  return apiFetch<MapPinsResponse>(`/map-pins?${searchParams.toString()}`);
}
