import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AuthState = {
  accessToken: string | null;
  verifiedViewerId: number | null;
  signupToken: string | null;
  setAccessToken: (accessToken: string) => void;
  setVerifiedViewerId: (accessToken: string, viewerId: number) => void;
  setSignupToken: (signupToken: string) => void;
  clearSignupToken: () => void;
  clearTokens: () => void;
};

export const selectIsAuthenticated = (state: AuthState) => state.accessToken !== null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      verifiedViewerId: null,
      signupToken: null,
      setAccessToken: (accessToken) =>
        set((state) => ({
          accessToken,
          verifiedViewerId: state.accessToken === accessToken ? state.verifiedViewerId : null,
        })),
      setVerifiedViewerId: (accessToken, verifiedViewerId) =>
        set((state) => (state.accessToken === accessToken ? { verifiedViewerId } : state)),
      setSignupToken: (signupToken) => set({ signupToken }),
      clearSignupToken: () => set({ signupToken: null }),
      clearTokens: () => set({ accessToken: null, verifiedViewerId: null, signupToken: null }),
    }),
    {
      name: 'moyeota-auth',
      partialize: (state) => ({ accessToken: state.accessToken }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
