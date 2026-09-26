import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CompanionTransport, PostType } from '@/entities/post';
import type { MapCoordinate } from '@/shared/types/common';

export type PostCreateLocation = {
  name: string;
  lat: number | null;
  lng: number | null;
};

export type PostCreateTime = {
  period: '오전' | '오후';
  hour: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  minute: 0 | 10 | 20 | 30 | 40 | 50;
};

export type CompanionPostCreateDraft = {
  origin: PostCreateLocation | null;
  destination: PostCreateLocation | null;
  departureDate: string | null;
  departureTime: PostCreateTime | null;
  transportType: CompanionTransport;
  recruitCount: number | null;
  content: string;
};

export type CommunityPostCreateDraft = {
  title: string;
  content: string;
};

export type CompanionPostCreatePayload = {
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_name: string;
  dest_lat: number;
  dest_lng: number;
  departure_at: string;
  transport_type: CompanionTransport;
  recruit_count: number;
  content?: string;
};

export type CommunityPostCreatePayload = {
  title: string;
  content: string;
  lat: number;
  lng: number;
};

export type PostCreateState = {
  type: PostType | null;
  postLocation: MapCoordinate | null;
  postLocationName: string | null;
  companion: CompanionPostCreateDraft;
  community: CommunityPostCreateDraft;
  setType: (type: PostType | null) => void;
  setCompanionField: <K extends keyof CompanionPostCreateDraft>(
    field: K,
    value: CompanionPostCreateDraft[K],
  ) => void;
  setCommunityField: <K extends keyof CommunityPostCreateDraft>(
    field: K,
    value: CommunityPostCreateDraft[K],
  ) => void;
  setCompanionLocation: (
    field: 'origin' | 'destination',
    location: PostCreateLocation | null,
  ) => void;
  setPostLocation: (location: MapCoordinate | null, placeName?: string | null) => void;
  hasDraftData: () => boolean;
  getCompanionPayload: () => CompanionPostCreatePayload | null;
  getCommunityPayload: () => CommunityPostCreatePayload | null;
  resetDraft: () => void;
};

function createInitialCompanionDraft(): CompanionPostCreateDraft {
  return {
    origin: null,
    destination: null,
    departureDate: null,
    departureTime: null,
    transportType: 'TAXI',
    recruitCount: null,
    content: '',
  };
}

function createInitialCommunityDraft(): CommunityPostCreateDraft {
  return {
    title: '',
    content: '',
  };
}

function createInitialState() {
  return {
    type: null,
    postLocation: null,
    postLocationName: null,
    companion: createInitialCompanionDraft(),
    community: createInitialCommunityDraft(),
  };
}

function toDepartureAt(dateValue: string, time: PostCreateTime): string | null {
  const [year, month, day] = dateValue.split('-').map(Number);
  const departure = new Date(year, month - 1, day);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    Number.isNaN(departure.getTime())
  ) {
    return null;
  }

  let hour: number = time.hour;

  if (time.period === '오전' && time.hour === 12) {
    hour = 0;
  }

  if (time.period === '오후' && time.hour !== 12) {
    hour += 12;
  }

  departure.setHours(hour, time.minute, 0, 0);

  return departure.toISOString();
}

function isCompleteLocation(
  location: PostCreateLocation | null,
): location is PostCreateLocation & { lat: number; lng: number } {
  return (
    location !== null &&
    location.name.trim().length > 0 &&
    typeof location.lat === 'number' &&
    typeof location.lng === 'number'
  );
}

function toCompanionPayload(draft: CompanionPostCreateDraft): CompanionPostCreatePayload | null {
  if (
    !isCompleteLocation(draft.origin) ||
    !isCompleteLocation(draft.destination) ||
    !draft.departureDate ||
    draft.departureTime === null ||
    draft.recruitCount === null
  ) {
    return null;
  }

  const departureAt = toDepartureAt(draft.departureDate, draft.departureTime);

  if (departureAt === null) {
    return null;
  }

  const payload: CompanionPostCreatePayload = {
    origin_name: draft.origin.name,
    origin_lat: draft.origin.lat,
    origin_lng: draft.origin.lng,
    dest_name: draft.destination.name,
    dest_lat: draft.destination.lat,
    dest_lng: draft.destination.lng,
    departure_at: departureAt,
    transport_type: draft.transportType,
    recruit_count: draft.recruitCount,
  };

  if (draft.content.trim()) {
    payload.content = draft.content;
  }

  return payload;
}

function hasDraftData(state: Pick<PostCreateState, 'companion' | 'community'>) {
  return (
    state.companion.origin !== null ||
    state.companion.destination !== null ||
    state.companion.departureDate !== null ||
    state.companion.departureTime !== null ||
    state.companion.recruitCount !== null ||
    state.companion.content.trim().length > 0 ||
    state.community.title.trim().length > 0 ||
    state.community.content.trim().length > 0
  );
}

function toCommunityPayload(
  draft: CommunityPostCreateDraft,
  postLocation: MapCoordinate | null,
): CommunityPostCreatePayload | null {
  if (!draft.title.trim() || !draft.content.trim() || postLocation === null) {
    return null;
  }

  return {
    title: draft.title,
    content: draft.content,
    lat: postLocation.lat,
    lng: postLocation.lng,
  };
}

export const usePostCreateStore = create<PostCreateState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      setType: (type) => set({ type }),
      setCompanionField: (field, value) =>
        set((state) => ({ companion: { ...state.companion, [field]: value } })),
      setCommunityField: (field, value) =>
        set((state) => ({ community: { ...state.community, [field]: value } })),
      setCompanionLocation: (field, location) =>
        set((state) => ({ companion: { ...state.companion, [field]: location } })),
      setPostLocation: (postLocation, postLocationName = null) =>
        set({ postLocation, postLocationName }),
      hasDraftData: () => hasDraftData(get()),
      getCompanionPayload: () => toCompanionPayload(get().companion),
      getCommunityPayload: () => toCommunityPayload(get().community, get().postLocation),
      resetDraft: () => set(createInitialState()),
    }),
    {
      name: 'post-create-draft',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        type: state.type,
        postLocation: state.postLocation,
        postLocationName: state.postLocationName,
        companion: state.companion,
        community: state.community,
      }),
    },
  ),
);
