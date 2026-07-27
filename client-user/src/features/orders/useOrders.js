// File: src/features/orders/useOrders.js
import { useState, useCallback } from 'react';
import apiClient from '../../shared/api/apiClient.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function useOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useAuthStore();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let resp;
      if (role === 'USER_ROLE') resp = await apiClient.get('/orders/me');
      else if (role === 'ADMIN_ROLE') resp = await apiClient.get('/orders/active');
      else resp = await apiClient.get('/orders');

      const data = resp.data.data || resp.data;
      const mapped = (data || []).map(o => ({
        ...o,
        normalizedStatus: (o.status || '').toUpperCase()
      }));
      return mapped;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al obtener pedidos');
      return [];
    } finally {
      setLoading(false);
    }
  }, [role]);

  const createOrder = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post('/orders', payload);
      const data = resp.data.data || resp.data;
      return { ok: true, data };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear pedido');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [role]);

  const patchOrder = useCallback(async (id, path, body = {}) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.patch(`/orders/${id}${path ? `/${path}` : ''}`, body);
      const data = resp.data.data || resp.data;
      return { ok: true, data };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar pedido');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [role]);

  return { fetchOrders, createOrder, patchOrder, loading, error };
}
