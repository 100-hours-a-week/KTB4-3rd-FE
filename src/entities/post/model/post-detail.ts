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
  description: string;
  departure_location: string;
  destination: string;
  participants: readonly PostParticipant[];
};

export type CommunityPostDetail = CommunityPost & {
  description: string;
  comments: readonly PostComment[];
};

export type PostDetail = CompanionPostDetail | CommunityPostDetail;
