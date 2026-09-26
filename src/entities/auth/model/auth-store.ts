import { create } from 'zustand';

export type AuthState = {
  accessToken: string | null;
  signupToken: string | null;
  setAccessToken: (accessToken: string) => void;
  setSignupToken: (signupToken: string) => void;
  clearSignupToken: () => void;
  clearTokens: () => void;
};

export const selectIsAuthenticated = (state: AuthState) => state.accessToken !== null;

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  signupToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  setSignupToken: (signupToken) => set({ signupToken }),
  clearSignupToken: () => set({ signupToken: null }),
  clearTokens: () => set({ accessToken: null, signupToken: null }),
}));
