
import type {
  RegisterUserData,
  UpdateUserData,
  User,
  UserCredentials,
} from '@/types';

import { storage, STORAGE_KEYS } from '@/services/storage';

interface StoredUser extends User {
  password: string;
}

const delay = (ms = 500) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function getUsers(): StoredUser[] {
  return storage.get<StoredUser[]>(STORAGE_KEYS.USERS) ?? [];
}

function toPublicUser(user: StoredUser): User {
  const { password: _, ...publicUser } = user;
  return publicUser;
}

export const authApi = {
  async register(data: RegisterUserData): Promise<User> {
    await delay();

    const users = getUsers();
    const email = data.email.trim().toLowerCase();

    if (users.some((user) => user.email === email)) {
      throw new Error('Пользователь с такой почтой уже существует');
    }

    const user: StoredUser = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      email,
      isPushkinCardConnected: false,
      password: data.password,
    };

    storage.set(STORAGE_KEYS.USERS, [...users, user]);

    return toPublicUser(user);
  },

  async login(credentials: UserCredentials): Promise<User> {
    await delay();

    const users = getUsers();
    const email = credentials.email.trim().toLowerCase();

    const user = users.find(
      (item) =>
        item.email === email &&
        item.password === credentials.password,
    );

    if (!user) {
      throw new Error('Неверная почта или пароль');
    }

    return toPublicUser(user);
  },

  async getUserById(userId: string): Promise<User | null> {
    await delay(0);

    const user = getUsers().find((item) => item.id === userId);

    return user ? toPublicUser(user) : null;
  },

  async updateUser(
    userId: string,
    data: UpdateUserData,
  ): Promise<User> {
    await delay();

    const users = getUsers();
    const userIndex = users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      throw new Error('Пользователь не найден');
    }

    const currentUser = users[userIndex];
    const name = data.name?.trim() ?? currentUser.name;
    const email = data.email?.trim().toLowerCase() ?? currentUser.email;

    if (!name || !email) {
      throw new Error('Заполните все поля');
    }

    const emailIsTaken = users.some(
      (item) => item.id !== userId && item.email === email,
    );

    if (emailIsTaken) {
      throw new Error('Пользователь с такой почтой уже существует');
    }

    const updatedUser: StoredUser = {
      ...currentUser,
      name,
      email,
      isPushkinCardConnected:
        data.isPushkinCardConnected ?? currentUser.isPushkinCardConnected,
    };

    users[userIndex] = updatedUser;
    storage.set(STORAGE_KEYS.USERS, users);

    return toPublicUser(updatedUser);
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await delay();

    const users = getUsers();
    const userIndex = users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      throw new Error('Пользователь не найден');
    }

    const user = users[userIndex];

    if (user.password !== currentPassword) {
      throw new Error('Текущий пароль указан неверно');
    }

    if (newPassword.length < 6) {
      throw new Error('Новый пароль должен содержать минимум 6 символов');
    }

    users[userIndex] = {
      ...user,
      password: newPassword,
    };

    storage.set(STORAGE_KEYS.USERS, users);
  },
};
