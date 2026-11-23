import type { ID } from './common';

export interface User {
  id: ID;
  name: string;
  email: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
}

export type UpdateUserData = Partial<Pick<User, 'name' | 'email'>>;
