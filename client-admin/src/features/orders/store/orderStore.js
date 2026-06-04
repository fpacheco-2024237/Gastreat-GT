import { create } from 'zustand';
import * as orderApi from '../../../shared/api/orders.js';
import { showError } from '../../../shared/utils/toast.js';

export const useOrderStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await orderApi.getOrders();
      set({ orders, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al obtener las órdenes';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  updateOrderStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      await orderApi.updateOrderStatus(id, status);
      await get().fetchOrders();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar estado de la orden';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  cancelOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      await orderApi.cancelOrder(id);
      await get().fetchOrders();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al cancelar la orden';
      showError(message);
      set({ error: message, loading: false });
    }
  },
}));
