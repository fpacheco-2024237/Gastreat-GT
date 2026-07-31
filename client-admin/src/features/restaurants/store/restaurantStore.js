import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as restaurantApi from '../../../shared/api/restaurants.js';

export const useRestaurantStore = create(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      restaurants: [],
      loading: false,
      error: null,

      setRestaurant: (id, name) => set({ restaurantId: id, restaurantName: name }),
      clearRestaurant: () => set({ restaurantId: null, restaurantName: null }),

      fetchRestaurants: async () => {
        set({ loading: true, error: null });
        try {
          const resp = await restaurantApi.getRestaurants();
          const data = resp.data?.data ?? resp.data ?? [];
          const restaurants = Array.isArray(data) ? data : [];
          set({ restaurants, loading: false });
          return restaurants;
        } catch (err) {
          const message = err.response?.data?.message || 'Error al obtener restaurantes';
          set({ error: message, loading: false });
          return [];
        }
      },

      createRestaurant: async (payload) => {
        set({ loading: true, error: null });
        try {
          const resp = await restaurantApi.createRestaurant(payload);
          const restaurant = resp.data?.data ?? resp.data;
          await get().fetchRestaurants();
          set({ loading: false });
          return { ok: true, data: restaurant };
        } catch (err) {
          const message = err.response?.data?.message || 'Error al crear restaurante';
          set({ error: message, loading: false });
          return { ok: false, error: message };
        }
      },
    }),
    {
      name: 'restaurant-storage',
      partialize: (state) => ({ restaurantId: state.restaurantId, restaurantName: state.restaurantName }),
    }
  )
);
