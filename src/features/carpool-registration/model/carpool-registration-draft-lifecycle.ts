import { useCarpoolCreateStore, type CarpoolCreateDraft } from './carpool-create-store';

export const resetCarpoolRegistrationDraft = () => useCarpoolCreateStore.getState().reset();

export const getCarpoolRegistrationDraftSnapshot = () => useCarpoolCreateStore.getState().draft;

export function resetCarpoolRegistrationDraftIfUnchanged(snapshot: CarpoolCreateDraft) {
  const state = useCarpoolCreateStore.getState();

  if (state.draft !== snapshot) {
    return false;
  }

  state.reset();
  return true;
}
