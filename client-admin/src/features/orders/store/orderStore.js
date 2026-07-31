import { create } from 'zustand';
import * as orderApi from '../../../shared/api/orders.js';
import { showError } from '../../../shared/utils/toast.js';
import { useRestaurantStore } from '../../restaurants/store/restaurantStore.js';

export const useOrderStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const restaurantId = useRestaurantStore.getState().restaurantId;
      const params = { ...filters };
      if (restaurantId && !params.restaurantId) {
        params.restaurantId = restaurantId;
      }
      const data = await orderApi.getOrders(params);
      const orders = Array.isArray(data) ? data : (data?.data || []);
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
