import type { Post } from '@/entities/post';
import type { ApiResponse } from '@/shared/api/types';

export type NearbyPost = Post;

export type NearbyPostsQuery = {
  lat: number;
  lng: number;
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
  cursor?: string;
};

export type NearbyPostsData = {
  items: NearbyPost[];
  next_cursor: string | null;
};

export type NearbyPostsResponse = ApiResponse<NearbyPostsData>;
