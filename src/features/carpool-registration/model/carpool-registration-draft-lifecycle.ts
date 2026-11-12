import { useCarpoolCreateStore } from './carpool-create-store';

export const resetCarpoolRegistrationDraft = () => useCarpoolCreateStore.getState().reset();
