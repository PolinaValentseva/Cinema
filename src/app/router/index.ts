import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '../../stores/auth';

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    guestOnly?: boolean;
  }
}

const routes = [
  {
    path: '/',
    redirect: '/movies',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/pages/LoginPage.vue'),
    meta: {
      title: 'Вход',
      guestOnly: true,
    },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () =>
      import('@/modules/auth/pages/ForgotPasswordPage.vue'),
    meta: {
      title: 'Восстановление пароля',
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/modules/auth/pages/RegisterPage.vue'),
    meta: {
      title: 'Регистрация',
      guestOnly: true,
    },
  },
  {
    path: '/movies',
    name: 'movies',
    component: () => import('@/modules/movies/pages/MoviesPage.vue'),
    meta: { title: 'Афиша' },
  },
  {
    path: '/movies/:id',
    name: 'movie-details',
    component: () => import('@/modules/movies/pages/MovieDetailsPage.vue'),
    meta: { title: 'Информация о фильме' },
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/modules/movies/pages/SearchPage.vue'),
    meta: { title: 'Поиск' },
  },
  {
    path: '/booking/:sessionId',
    name: 'booking',
    component: () => import('@/modules/booking/pages/BookingPage.vue'),
    meta: {
      title: 'Покупка билета',
      requiresAuth: true,
    },
  },
  {
    path: '/tickets',
    name: 'tickets',
    component: () => import('@/modules/tickets/pages/TicketsPage.vue'),
    meta: {
      title: 'Мои билеты',
      requiresAuth: true,
    },
  },
  {
    path: '/profile/account',
    name: 'profile-account',
    component: () => import('@/modules/profile/pages/AccountPage.vue'),
    meta: {
      title: 'Аккаунт',
      requiresAuth: true,
    },
  },
  {
    path: '/profile/finances',
    name: 'profile-finances',
    component: () => import('@/modules/profile/pages/FinancesPage.vue'),
    meta: {
      title: 'Финансы',
      requiresAuth: true,
    },
  },
  {
    path: '/profile/password',
    name: 'profile-password',
    component: () => import('@/modules/profile/pages/PasswordPage.vue'),
    meta: {
      title: 'Пароль',
      requiresAuth: true,
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/modules/profile/pages/ProfilePage.vue'),
    meta: {
      title: 'Профиль',
      requiresAuth: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'movies' };
  }
});

export default router;
