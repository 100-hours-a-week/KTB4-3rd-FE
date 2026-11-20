import type { CompanionPost, CommunityPost, PostAuthor } from './post';

export type PostParticipant = PostAuthor & {
  id: number;
};

export type PostComment = {
  id: number;
  author: PostAuthor;
  content: string;
};

export type CompanionPostDetail = CompanionPost & {
  content: string;
  origin_name: string;
  dest_name: string;
  participants: readonly PostParticipant[];
};

export type CommunityPostDetail = CommunityPost & {
  content: string;
  comments: readonly PostComment[];
};

export type PostDetail = CompanionPostDetail | CommunityPostDetail;
