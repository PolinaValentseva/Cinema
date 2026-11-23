
<template>
  <div
    class="app"
    :class="{ 'app--with-navigation': showNavigation }"
  >
    <RouterView />
  </div>

  <BottomNavigation v-if="showNavigation" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';

import BottomNavigation from '@/components/layout/BottomNavigation.vue';

const route = useRoute();

const showNavigation = computed(() => !route.meta.guestOnly);
</script>


<style lang="scss">
.app {
  min-height: 100vh;

  &--with-navigation {
    padding-bottom: 68px;
  }
}
</style>
