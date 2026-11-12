import type { CompanionPost, CommunityPost } from './post';
import type { CompanionPostDetail, CommunityPostDetail, PostComment } from './post-detail';
import type {
  CompanionPostDetailData,
  CommunityPostDetailData,
} from '@/entities/post/api/post-detail.types';

export function toCompanionPostDetail(
  data: CompanionPostDetailData,
  summary?: CompanionPost,
): CompanionPostDetail {
  const postSummary: CompanionPost = summary ?? {
    type: 'COMPANION',
    id: data.id,
    title: data.title,
    author: { nickname: data.author.nickname, profile_image_url: null },
    transport_type: data.transport_type,
    distance_m: 0,
    current_count: data.current_count,
    capacity: data.capacity,
    departure_at: data.departure_at,
    is_expired: data.is_expired,
  };

  return {
    ...postSummary,
    id: data.id,
    title: data.title,
    content: data.content,
    transport_type: data.transport_type,
    departure_at: data.departure_at,
    is_expired: data.is_expired,
    current_count: data.current_count,
    capacity: data.capacity,
    author: { ...postSummary.author, nickname: data.author.nickname },
    origin_name: data.origin_name,
    dest_name: data.dest_name,
    participants: (data.participants ?? []).map((participant, index) => ({
      ...participant,
      id: index + 1,
    })),
  };
}

export function toCommunityPostDetail(
  data: CommunityPostDetailData,
  comments: readonly PostComment[],
  summary?: CommunityPost,
): CommunityPostDetail {
  const postSummary: CommunityPost = summary ?? {
    type: 'COMMUNITY',
    id: data.id,
    title: data.title,
    author: { nickname: data.author.nickname, profile_image_url: null },
    distance_m: 0,
    comment_count: data.comment_count,
    created_at: data.created_at,
  };

  return {
    ...postSummary,
    id: data.id,
    title: data.title,
    content: data.content,
    author: { ...postSummary.author, nickname: data.author.nickname },
    comment_count: data.comment_count,
    created_at: data.created_at,
    comments,
  };
}
