import { useState, useCallback } from 'react';
import apiClient from '../../../shared/api/apiClient.js';
import userClient from '../../../shared/api/userClient.js';
import useAuthStore from '../../../shared/store/authStore.js';
import useRestaurantStore from '../../../shared/store/restaurantStore.js';

export default function useReservations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useAuthStore();
  const { restaurantId } = useRestaurantStore();

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'USER_ROLE') {
        const resp = await userClient.get('/reservations/me');
        const data = resp.data.data || resp.data;
        return data.map(r => ({ ...r, normalizedStatus: (r.status || '').toUpperCase() }));
      }
      const resp = await apiClient.get('/tables', { params: { restaurantId } });
      const data = resp.data.data || resp.data;
      return (data || []).map(t => ({ id: t._id || t.id, name: `Mesa ${t.tableNumber}`, capacity: t.capacity, zone: t.zone, status: (t.status || '').toUpperCase() }));
    } catch (err) {
      if (role === 'USER_ROLE') {
        setError(null);
        return [];
      }
      setError(err.response?.data?.message || err.message || 'Error al cargar reservas/mesas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [role, restaurantId]);

  const createReservation = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await userClient.post('/reservations', payload);
      const data = resp.data.data || resp.data;
      return { ok: true, data };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear reserva');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelReservation = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      let resp;
      if (role === 'USER_ROLE') {
        resp = await userClient.put(`/reservations/me/${id}/cancel`);
      } else {
        resp = await apiClient.put(`/reservations/${id}/cancel`);
      }
      const data = resp.data.data || resp.data;
      return { ok: true, data };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cancelar reserva');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [role]);

  const updateTableStatus = useCallback(async (tableId, status) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.patch(`/tables/${tableId}/status`, { status });
      const data = resp.data.data || resp.data;
      return { ok: true, data };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar mesa');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchReservations, createReservation, cancelReservation, updateTableStatus, loading, error };
}
