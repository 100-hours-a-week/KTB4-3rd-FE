import { apiFetch } from '@/shared/api/client';

import type { NearbyPostsQuery, NearbyPostsResponse } from './nearby-posts.types';

export function getNearbyPosts(query: NearbyPostsQuery): Promise<NearbyPostsResponse> {
  const searchParams = new URLSearchParams({
    lat: String(query.lat),
    lng: String(query.lng),
    sw_lat: String(query.sw_lat),
    sw_lng: String(query.sw_lng),
    ne_lat: String(query.ne_lat),
    ne_lng: String(query.ne_lng),
  });

  if (query.cursor) {
    searchParams.set('cursor', query.cursor);
  }

  return apiFetch<NearbyPostsResponse>(`/nearby-posts?${searchParams.toString()}`);
}
