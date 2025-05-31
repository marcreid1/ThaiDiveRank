import { createContext, useContext } from 'react';

interface AuthDialogContextType {
  openSignInDialog: () => void;
  openSignUpDialog: () => void;
}

export const AuthDialogContext = createContext<AuthDialogContextType | undefined>(undefined);

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);
  if (context === undefined) {
    throw new Error('useAuthDialog must be used within an AuthDialogProvider');
  }
  return context;
}