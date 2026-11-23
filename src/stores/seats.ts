
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';


import { seatApi } from '@/services/mock-api';

import type { SeatAvailability } from '@/services/mock-api/seat.api';

export const useSeatsStore = defineStore('seats', () => {
  const seats = ref<SeatAvailability[]>([]);
  const selectedSeatIds = ref<string[]>([]);

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const selectedSeats = computed(() =>
    seats.value
      .filter((item) => selectedSeatIds.value.includes(item.seat.id))
      .map((item) => item.seat),
  );

  function isSelected(seatId: string): boolean {
    return selectedSeatIds.value.includes(seatId);
  }

  function toggleSeat(seatId: string): void {
    const seat = seats.value.find(
      (item) => item.seat.id === seatId,
    );

    if (!seat || seat.status === 'occupied') {
      return;
    }

    if (isSelected(seatId)) {
      selectedSeatIds.value = selectedSeatIds.value.filter(
        (id) => id !== seatId,
      );
      return;
    }

    selectedSeatIds.value = [...selectedSeatIds.value, seatId];
  }

  async function fetchSeats(sessionId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    selectedSeatIds.value = [];

    try {
      seats.value = await seatApi.getBySessionId(sessionId);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось загрузить места';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function clearSelection(): void {
    selectedSeatIds.value = [];
  }

  return {
    seats,
    selectedSeatIds,
    selectedSeats,
    isLoading,
    error,
    isSelected,
    toggleSeat,
    fetchSeats,
    clearSelection,
  };
});
