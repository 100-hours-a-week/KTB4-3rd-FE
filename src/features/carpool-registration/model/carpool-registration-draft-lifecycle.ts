import { useCarpoolCreateStore } from './carpool-create-store';

export function resetCarpoolRegistrationDraft() {
  useCarpoolCreateStore.getState().reset();
}

export function getCarpoolRegistrationDraftRevision() {
  return useCarpoolCreateStore.getState().draftRevision;
}

export function resetCarpoolRegistrationDraftIfUnchanged(revision: number) {
  const state = useCarpoolCreateStore.getState();

  if (state.draftRevision !== revision) {
    return false;
  }

  state.reset();
  return true;
}
