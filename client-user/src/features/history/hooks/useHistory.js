import { useState, useCallback } from 'react';
import apiClient from '../../../shared/api/apiClient.js';
import userClient from '../../../shared/api/userClient.js';
import useAuthStore from '../../../shared/store/authStore.js';

export default function useHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useAuthStore();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'USER_ROLE') {
        const [ordersResult, reservationsResult] = await Promise.allSettled([
          userClient.get('/orders/me'),
          userClient.get('/reservations/me')
        ]);

        const orders = ordersResult.status === 'fulfilled' ? (ordersResult.value.data.data || ordersResult.value.data || []) : [];
        const reservations = reservationsResult.status === 'fulfilled' ? (reservationsResult.value.data.data || reservationsResult.value.data || []) : [];
        return { orders, reservations };
      }
      if (role === 'ADMIN_ROLE') {
        const resp = await apiClient.get('/billing');
        return { receipts: resp.data.data || resp.data };
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al obtener historial');
      if (role === 'USER_ROLE') return { orders: [], reservations: [] };
      if (role === 'ADMIN_ROLE') return { receipts: [] };
      return {};
    } finally {
      setLoading(false);
    }
  }, [role]);

  return { fetchHistory, loading, error };
}
