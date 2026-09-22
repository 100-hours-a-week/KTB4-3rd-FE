export type PostAuthor = {
  nickname: string;
  profile_image_url: string | null;
};

export type PostType = 'COMPANION' | 'COMMUNITY';

export type CompanionTransport = 'CAR' | 'TAXI' | 'SUBWAY' | 'BUS';

export type CompanionPost = {
  type: 'COMPANION';
  id: number;
  title: string;
  author: PostAuthor;
  transport: CompanionTransport;
  distance_m: number;
  current_count: number;
  capacity: number;
  departure_at: string;
  is_expired: boolean;
};

export type CommunityPost = {
  type: 'COMMUNITY';
  id: number;
  title: string;
  author: PostAuthor;
  distance_m: number;
  comment_count: number;
  created_at: string;
};

export type Post = CompanionPost | CommunityPost;

export type PostListResponse = {
  message: string;
  data: {
    items: Post[];
    next_cursor: string | null;
  };
};
