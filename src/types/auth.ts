import type { ID, ISODateString } from './common';

export interface AuthSession {
  userId: ID;
  expiresAt: ISODateString;
}

export interface AuthState {
  user: import('./user').User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
