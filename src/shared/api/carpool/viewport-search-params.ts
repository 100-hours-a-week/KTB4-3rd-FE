import type { CarpoolViewport } from './carpool-read.types';

export function viewportSearchParams(viewport: CarpoolViewport) {
  return new URLSearchParams({
    sw_lat: String(viewport.sw_lat),
    sw_lng: String(viewport.sw_lng),
    ne_lat: String(viewport.ne_lat),
    ne_lng: String(viewport.ne_lng),
  });
}
