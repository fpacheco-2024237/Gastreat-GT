import { create } from 'zustand';
import * as billingApi from '../../../shared/api/billing.js';
import { showError } from '../../../shared/utils/toast.js';

export const useBillingStore = create((set, get) => ({
  bills: [],
  selectedBill: null,
  loading: false,
  error: null,

  fetchBills: async () => {
    set({ loading: true, error: null });
    try {
      const bills = await billingApi.getBillingRecords();
      set({ bills, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al obtener facturación';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  loadBillByOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const bill = await billingApi.getBillingByOrderId(orderId);
      set({ selectedBill: bill, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al obtener factura';
      showError(message);
      set({ error: message, loading: false });
    }
  },

  payBill: async (payload) => {
    set({ loading: true, error: null });
    try {
      await billingApi.payBilling(payload);
      await get().fetchBills();
      set({ selectedBill: null, loading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al registrar el pago';
      showError(message);
      set({ error: message, loading: false });
    }
  },
}));
