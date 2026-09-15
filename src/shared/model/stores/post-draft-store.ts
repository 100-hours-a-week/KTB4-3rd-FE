import { create } from 'zustand';

import type { Transport } from '@/shared/types/common';

export type PostDraftFields = {
  type: 'COMPANION' | 'COMMUNITY' | null;
  title: string;
  content: string;
  origin: string;
  destination: string;
  departureAt: string | null;
  capacity: number | null;
  transport: Transport | null;
};

export type PostDraftState = PostDraftFields & {
  setField: <K extends keyof PostDraftFields>(field: K, value: PostDraftFields[K]) => void;
  setType: (type: PostDraftFields['type']) => void;
  resetDraft: () => void;
  saveDraft: () => void;
};

const initialDraft: PostDraftFields = {
  type: null,
  title: '',
  content: '',
  origin: '',
  destination: '',
  departureAt: null,
  capacity: null,
  transport: null,
};

export const usePostDraftStore = create<PostDraftState>((set) => ({
  ...initialDraft,
  setField: (field, value) => set({ [field]: value }),
  setType: (type) => set({ type }),
  resetDraft: () => set(initialDraft),
  saveDraft: () => undefined,
}));
