import { create } from 'zustand';

import type { CarpoolRequestDecision } from '@/features/carpool-request-review/api';

export type CarpoolRequestDecisionOutcomeState = 'checking' | 'uncertain';

export type CarpoolRequestDecisionOutcome = {
  requestedStatus: CarpoolRequestDecision;
  state: CarpoolRequestDecisionOutcomeState;
};

type CarpoolRequestDecisionStore = {
  outcomes: Record<string, CarpoolRequestDecisionOutcome>;
  inFlight: Record<string, boolean>;
  beginDecision: (key: string) => boolean;
  finishDecision: (key: string) => void;
  markChecking: (key: string, requestedStatus: CarpoolRequestDecision) => void;
  markUncertain: (key: string, requestedStatus: CarpoolRequestDecision) => void;
  clearOutcome: (key: string) => void;
};

export function getCarpoolRequestDecisionOutcomeKey(
  viewerId: number,
  carpoolId: number,
  requestId: number,
) {
  return JSON.stringify([viewerId, carpoolId, requestId]);
}

export const useCarpoolRequestDecisionStore = create<CarpoolRequestDecisionStore>((set) => ({
  outcomes: {},
  inFlight: {},
  beginDecision: (key) => {
    let started = false;
    set((state) => {
      if (state.inFlight[key] || state.outcomes[key]) {
        return state;
      }

      started = true;
      return { inFlight: { ...state.inFlight, [key]: true } };
    });
    return started;
  },
  finishDecision: (key) =>
    set((state) => {
      const inFlight = Object.fromEntries(
        Object.entries(state.inFlight).filter(([entry]) => entry !== key),
      );
      return { inFlight };
    }),
  markChecking: (key, requestedStatus) =>
    set((state) => ({
      outcomes: { ...state.outcomes, [key]: { requestedStatus, state: 'checking' } },
    })),
  markUncertain: (key, requestedStatus) =>
    set((state) => ({
      outcomes: { ...state.outcomes, [key]: { requestedStatus, state: 'uncertain' } },
    })),
  clearOutcome: (key) =>
    set((state) => {
      const outcomes = Object.fromEntries(
        Object.entries(state.outcomes).filter(([entry]) => entry !== key),
      );
      return { outcomes };
    }),
}));
