import { create } from 'zustand';
import * as categoryApi from '../../../shared/api/categories.js';
import { showError } from '../../../shared/utils/toast.js';
import { useRestaurantStore } from '../../restaurants/store/restaurantStore.js';

export const useCategoryStore = create((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  selectedCategory: null,

  fetchCategories: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const restaurantId = useRestaurantStore.getState().restaurantId;
      const params = { ...filters };
      if (restaurantId && !params.restaurantId) {
        params.restaurantId = restaurantId;
      }
      const data = await categoryApi.getCategories(params);
      const categories = Array.isArray(data) ? data : [];
      set({ categories, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al obtener categorías';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  createCategory: async (data) => {
    set({ loading: true, error: null });
    try {
      const restaurantId = useRestaurantStore.getState().restaurantId;
      const payload = { ...data };
      if (restaurantId && !payload.restaurantId) {
        payload.restaurantId = restaurantId;
      }
      await categoryApi.createCategory(payload);
      await get().fetchCategories();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al crear categoría';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  updateCategory: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await categoryApi.updateCategory(id, data);
      await get().fetchCategories();
      set({ loading: false, selectedCategory: null });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar categoría';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  toggleCategoryStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      await categoryApi.toggleCategoryStatus(id, status);
      await get().fetchCategories();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar estado de categoría';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      await categoryApi.deleteCategory(id);
      await get().fetchCategories();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar categoría';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  setSelectedCategory: (item) => set({ selectedCategory: item }),
  clearSelectedCategory: () => set({ selectedCategory: null }),
}));
