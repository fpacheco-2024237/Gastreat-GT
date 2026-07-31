import { create } from 'zustand';
import * as billingApi from '../../../shared/api/billing.js';
import { showError } from '../../../shared/utils/toast.js';
import { useRestaurantStore } from '../../restaurants/store/restaurantStore.js';

export const useBillingStore = create((set, get) => ({
  bills: [],
  selectedBill: null,
  loading: false,
  error: null,

  fetchBills: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const restaurantId = useRestaurantStore.getState().restaurantId;
      const params = { ...filters };
      if (restaurantId && !params.restaurantId) {
        params.restaurantId = restaurantId;
      }
      const data = await billingApi.getBillingRecords(params);
      const bills = Array.isArray(data) ? data : (data?.data || []);
      set({ bills, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al obtener facturación';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  loadBillById: async (id) => {
    set({ loading: true, error: null });
    try {
      const bill = await billingApi.getInvoiceById(id);
      set({ selectedBill: bill, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al obtener factura';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  createBill: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const bill = await billingApi.createInvoice(orderId);
      await get().fetchBills();
      set({ loading: false });
      return { ok: true, data: bill };
    } catch (err) {
      const message = err.response?.data?.message || 'Error al crear factura';
      showError(message);
      set({ error: message, loading: false });
      return { ok: false, error: err };
    }
  },

  payBill: async (id, paymentMethod) => {
    set({ loading: true, error: null });
    try {
      await billingApi.payInvoice(id, paymentMethod);
      await get().fetchBills();
      set({ selectedBill: null, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al registrar el pago';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  voidBill: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      await billingApi.voidInvoice(id, reason);
      await get().fetchBills();
      set({ selectedBill: null, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al anular factura';
      showError(message);
      set({ error: message, loading: false });
    }
  },
}));
