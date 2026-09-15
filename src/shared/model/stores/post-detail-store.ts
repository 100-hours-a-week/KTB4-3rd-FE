import { create } from 'zustand';

export type PostReference = {
  type: 'COMPANION' | 'COMMUNITY';
  id: number;
};

export type PostDetailState = {
  open: boolean;
  postRef: PostReference | null;
  openPostDetail: (postRef: PostReference) => void;
  closePostDetail: () => void;
  reset: () => void;
};

const initialState = {
  open: false,
  postRef: null,
};

export const usePostDetailStore = create<PostDetailState>((set) => ({
  ...initialState,
  openPostDetail: (postRef) => set({ open: true, postRef }),
  closePostDetail: () => set(initialState),
  reset: () => set(initialState),
}));
