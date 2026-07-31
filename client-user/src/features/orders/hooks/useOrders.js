import { useState, useCallback } from 'react';
import apiClient from '../../../shared/api/apiClient.js';
import userClient from '../../../shared/api/userClient.js';
import useAuthStore from '../../../shared/store/authStore.js';
import useRestaurantStore from '../../../shared/store/restaurantStore.js';

export default function useOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useAuthStore();
  const { restaurantId } = useRestaurantStore();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let resp;
      if (role === 'USER_ROLE') {
        resp = await userClient.get('/orders/me');
      } else {
        resp = await apiClient.get('/orders', { params: { restaurantId } });
      }

      const data = resp.data.data || resp.data;
      const mapped = (data || []).map(o => ({
        ...o,
        normalizedStatus: (o.status || '').toUpperCase()
      }));
      return mapped;
    } catch (err) {
      if (role === 'USER_ROLE') {
        setError(null);
        return [];
      }
      setError(err.response?.data?.message || err.message || 'Error al obtener pedidos');
      return [];
    } finally {
      setLoading(false);
    }
  }, [role, restaurantId]);

  const createOrder = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await userClient.post('/orders', payload);
      const data = resp.data.data || resp.data;
      return { ok: true, data };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear pedido');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, []);

  return { fetchOrders, createOrder, patchOrder, loading, error };
}
