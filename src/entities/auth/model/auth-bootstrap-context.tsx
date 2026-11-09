'use client';

import { createContext, useContext, type ReactNode } from 'react';

const AuthBootstrapCompleteContext = createContext(true);

type AuthBootstrapCompleteProviderProps = {
  children: ReactNode;
  isComplete: boolean;
};

export function AuthBootstrapCompleteProvider({
  children,
  isComplete,
}: AuthBootstrapCompleteProviderProps) {
  return (
    <AuthBootstrapCompleteContext.Provider value={isComplete}>
      {children}
    </AuthBootstrapCompleteContext.Provider>
  );
}

export function useAuthBootstrapComplete() {
  return useContext(AuthBootstrapCompleteContext);
}
