import { create } from 'zustand';
import * as menuApi from '../../../shared/api/menu.js';
import { showError } from '../../../shared/utils/toast.js';

export const useMenuStore = create((set, get) => ({
  menuItems: [],
  loading: false,
  error: null,
  selectedItem: null,

  fetchMenuItems: async () => {
    set({ loading: true, error: null });
    try {
      const menuItems = await menuApi.getMenuItems();
      set({ menuItems, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al obtener el menú';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  createMenuItem: async (data) => {
    set({ loading: true, error: null });
    try {
      await menuApi.createMenuItem(data);
      await get().fetchMenuItems();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al crear platillo';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  updateMenuItem: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await menuApi.updateMenuItem(id, data);
      await get().fetchMenuItems();
      set({ loading: false, selectedItem: null });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar platillo';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  toggleMenuItemStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      await menuApi.toggleMenuItemStatus(id, status);
      await get().fetchMenuItems();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar estado';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  deleteMenuItem: async (id) => {
    set({ loading: true, error: null });
    try {
      await menuApi.deleteMenuItem(id);
      await get().fetchMenuItems();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar platillo';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  setSelectedItem: (item) => set({ selectedItem: item }),
  clearSelectedItem: () => set({ selectedItem: null }),
}));
