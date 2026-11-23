import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import router from './app/router';

import { useAuthStore } from './stores/auth';

import './app/styles/main.scss';

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);

  const authStore = useAuthStore(pinia);

  await authStore.initialize();

  app.use(router);

  await router.isReady();

  app.mount('#app');
}

bootstrap();
