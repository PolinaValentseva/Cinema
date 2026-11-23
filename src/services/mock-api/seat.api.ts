
import type { Order, Seat, SeatStatus } from '@/types';

import { storage, STORAGE_KEYS } from '@/services/storage';

export interface SeatAvailability {
  seat: Seat;
  status: Exclude<SeatStatus, 'selected'>;
}

const ROWS_COUNT = 8;
const SEATS_PER_ROW = 10;

function getSeats(): Seat[] {
  return storage.get<Seat[]>(STORAGE_KEYS.SEATS) ?? [];
}

function getOrders(): Order[] {
  return storage.get<Order[]>(STORAGE_KEYS.ORDERS) ?? [];
}

function createSeatsForSession(sessionId: string): Seat[] {
  const seats: Seat[] = [];

  for (let row = 1; row <= ROWS_COUNT; row++) {
    for (let number = 1; number <= SEATS_PER_ROW; number++) {
      seats.push({
        id: `${sessionId}-row-${row}-seat-${number}`,
        sessionId,
        row,
        number,
      });
    }
  }

  return seats;
}

export const seatApi = {
  async getBySessionId(sessionId: string): Promise<SeatAvailability[]> {
    let allSeats = getSeats();

    let sessionSeats = allSeats.filter(
      (seat) => seat.sessionId === sessionId,
    );

    if (sessionSeats.length === 0) {
      sessionSeats = createSeatsForSession(sessionId);
      allSeats = [...allSeats, ...sessionSeats];

      storage.set(STORAGE_KEYS.SEATS, allSeats);
    }

    const occupiedSeatIds = new Set(
      getOrders()
        .filter((order) => order.status === 'paid')
        .flatMap((order) => order.seatIds),
    );

    return sessionSeats.map((seat) => ({
      seat,
      status: occupiedSeatIds.has(seat.id) ? 'occupied' : 'available',
    }));
  },
};
