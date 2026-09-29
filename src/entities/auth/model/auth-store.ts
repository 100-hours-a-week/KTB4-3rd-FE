import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AuthState = {
  accessToken: string | null;
  signupToken: string | null;
  setAccessToken: (accessToken: string) => void;
  setSignupToken: (signupToken: string) => void;
  clearSignupToken: () => void;
  clearTokens: () => void;
};

export const selectIsAuthenticated = (state: AuthState) => state.accessToken !== null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      signupToken: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      setSignupToken: (signupToken) => set({ signupToken }),
      clearSignupToken: () => set({ signupToken: null }),
      clearTokens: () => set({ accessToken: null, signupToken: null }),
    }),
    {
      name: 'moyeota-auth',
      partialize: (state) => ({ accessToken: state.accessToken }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
