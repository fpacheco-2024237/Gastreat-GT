// File: src/features/history/useHistory.js
import { useState, useCallback } from 'react';
import apiClient from '../../shared/api/apiClient.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function useHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useAuthStore();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'USER_ROLE') {
        const o = await apiClient.get('/orders/history');
        const r = await apiClient.get('/reservations/history');
        return { orders: o.data.data || o.data, reservations: r.data.data || r.data };
      }
      if (role === 'ADMIN_ROLE') {
        const resp = await apiClient.get('/billing/history');
        return { receipts: resp.data.data || resp.data };
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al obtener historial');
      return {};
    } finally {
      setLoading(false);
    }
  }, [role]);

  return { fetchHistory, loading, error };
}
