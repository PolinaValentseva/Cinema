
<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'small' | 'medium' | 'large';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
  }>(),
  {
    variant: 'primary',
    size: 'medium',
    type: 'button',
    disabled: false,
    loading: false,
    fullWidth: false,
  },
);
</script>

<template>
  <button
    class="base-button"
    :class="[
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--full-width': fullWidth },
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <span
      v-if="loading"
      class="base-button__loader"
      aria-hidden="true"
    />

    <slot />
  </button>
</template>

<style scoped lang="scss">
.base-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  border: 1px solid transparent;
  border-radius: 33px;

  font-family: inherit;
  font-weight: 500;
  cursor: pointer;

  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary, #fff);
    outline-offset: 3px;
  }

  &--primary {
    background: var(--color-primary);
    color: var(--color-on-primary, #111);

    &:not(:disabled):hover {
      opacity: 0.85;
    }
  }

  &--secondary {
    background: var(--color-dark);
    color: var(--color-white);

    &:not(:disabled):hover {
      background: var(--color-surface-hover, #444);
    }
  }

  &--outline {
    background: transparent;
    border-color: var(--color-border, #555);
    color: var(--color-text, #fff);

    &:not(:disabled):hover {
      background: var(--color-surface, #333);
    }
  }

  &--ghost {
    background: transparent;
    color: var(--color-text, #fff);

    &:not(:disabled):hover {
      background: var(--color-surface, #333);
    }
  }

  &--danger {
    background: #d94141;
    color: #fff;

    &:not(:disabled):hover {
      background: #bd3030;
    }
  }

  &--small {
    min-height: 32px;
    padding: 6px 12px;
    font-size: 13px;
  }

  &--medium {
    min-height: 42px;
    padding: 10px 18px;
    font-size: 14px;
  }

  &--large {
    min-height: 50px;
    padding: 14px 24px;
    font-size: 16px;
  }

  &--full-width {
    width: 100%;
  }

  &__loader {
    width: 16px;
    height: 16px;
    flex-shrink: 0;

    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;

    animation: button-spin 0.7s linear infinite;
  }
}

@keyframes button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
