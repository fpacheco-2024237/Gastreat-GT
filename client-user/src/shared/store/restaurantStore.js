import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient.js';

const useRestaurantStore = create(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      restaurants: [],
      loading: false,
      error: null,

      fetchRestaurants: async () => {
        set({ loading: true, error: null });
        try {
          const resp = await apiClient.get('/restaurants');
          const data = resp.data.data || resp.data || [];
          const restaurants = Array.isArray(data) ? data : [];
          set({ restaurants, loading: false });
          return restaurants;
        } catch (err) {
          const message = err.response?.data?.message || 'Error al obtener restaurantes';
          set({ error: message, loading: false });
          return [];
        }
      },

      setRestaurant: (id, name) => set({ restaurantId: id, restaurantName: name }),
      clearRestaurant: () => set({ restaurantId: null, restaurantName: null }),
    }),
    {
      name: 'restaurant',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useRestaurantStore;
