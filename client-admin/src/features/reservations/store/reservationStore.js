import { create } from 'zustand';
import * as reservationApi from '../../../shared/api/reservations.js';
import { showError } from '../../../shared/utils/toast.js';

export const useReservationStore = create((set, get) => ({
  reservations: [],
  loading: false,
  error: null,

  fetchReservations: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await reservationApi.getReservations(filters);
      const reservations = Array.isArray(data) ? data : [];
      set({ reservations, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al obtener reservas';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  confirmReservation: async (id) => {
    set({ loading: true, error: null });
    try {
      await reservationApi.confirmReservation(id);
      await get().fetchReservations();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al confirmar reserva';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  cancelReservation: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      await reservationApi.cancelReservation(id, reason);
      await get().fetchReservations();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al cancelar reserva';
      showError(message);
      set({ error: message, loading: false });
    }
  },
}));
