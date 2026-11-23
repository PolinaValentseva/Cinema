
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import {
    Home,
    Search,
    Ticket,
    UserRound,
} from 'lucide-vue-next';

const route = useRoute();

const navigationItems = [
  {
    name: 'movies',
    label: 'Главная',
    icon: Home,
    activeRoutes: ['movies', 'movie-details'],
  },
  {
    name: 'search',
    label: 'Поиск',
    icon: Search,
    activeRoutes: ['search'],
  },
  {
    name: 'tickets',
    label: 'Мои билеты',
    icon: Ticket,
    activeRoutes: ['tickets'],
  },
  {
    name: 'profile',
    label: 'Профиль',
    icon: UserRound,
    activeRoutes: ['profile'],
  },
];

const activeRoute = computed(() => route.name);

function isActive(item: (typeof navigationItems)[number]): boolean {
  return item.activeRoutes.includes(String(activeRoute.value));
}
</script>

<template>
  <nav class="bottom-navigation">
    <RouterLink
      v-for="item in navigationItems"
      :key="item.name"
      :to="{ name: item.name }"
      class="bottom-navigation__item"
      :class="{ 'bottom-navigation__item--active': isActive(item) }"
      :aria-label="item.label"
      :aria-current="isActive(item) ? 'page' : undefined"
    >
      <component :is="item.icon" :size="24" :stroke-width="1.8" />
    </RouterLink>
  </nav>
</template>

<style scoped lang="scss">
.bottom-navigation {
  position: fixed;
  z-index: 100;
  right: 0;
  bottom: 0;
  left: 0;

  display: flex;
  justify-content: space-around;
  align-items: center;

  height: 68px;
  padding: 0 16px;

  background: var(--color-surface, #171717);
  border-top: 1px solid var(--color-border, #333);

  &__item {
    display: flex;
    justify-content: center;
    align-items: center;

    width: 56px;
    height: 56px;

    color: var(--color-text-secondary, #888);
    text-decoration: none;

    transition: color 0.2s ease;

    &--active {
      color: var(--color-primary, #fff);
    }
  }
}
</style>
