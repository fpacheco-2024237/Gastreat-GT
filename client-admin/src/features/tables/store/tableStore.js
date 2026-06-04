import { create } from 'zustand';
import * as tableApi from '../../../shared/api/tables.js';
import { showError } from '../../../shared/utils/toast.js';

export const useTableStore = create((set, get) => ({
  tables: [],
  loading: false,
  error: null,

  fetchTables: async () => {
    set({ loading: true, error: null });
    try {
      const tables = await tableApi.getTables();
      set({ tables, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al obtener mesas';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  createTable: async (table) => {
    set({ loading: true, error: null });
    try {
      await tableApi.createTable(table);
      await get().fetchTables();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al crear mesa';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  updateTable: async (id, table) => {
    set({ loading: true, error: null });
    try {
      await tableApi.updateTable(id, table);
      await get().fetchTables();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar mesa';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  toggleTableStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      await tableApi.toggleTableStatus(id, status);
      await get().fetchTables();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar estado';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  deleteTable: async (id) => {
    set({ loading: true, error: null });
    try {
      await tableApi.deleteTable(id);
      await get().fetchTables();
      set({ loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar mesa';
      showError(message);
      set({ error: message, loading: false });
    }
  },
}));
