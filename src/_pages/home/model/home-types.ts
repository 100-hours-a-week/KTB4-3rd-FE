import type { Post } from '@/entities/post';
import type { MapCoordinate } from '@/shared/types/common';

export type SelectedPost = {
  id: number;
  position: MapCoordinate;
  summary?: Post;
  type: Post['type'];
};
