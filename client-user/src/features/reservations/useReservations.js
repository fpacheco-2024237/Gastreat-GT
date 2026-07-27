// File: src/features/reservations/useReservations.js
import { useState, useCallback } from 'react';
import apiClient from '../../shared/api/apiClient.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function useReservations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { role } = useAuthStore();

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'USER_ROLE') {
        const resp = await apiClient.get('/reservations/me');
        const data = resp.data.data || resp.data;
        return data.map(r => ({ ...r, normalizedStatus: (r.status || '').toUpperCase() }));
      }
      // staff: get tables status
      const resp = await apiClient.get('/tables/status');
      const data = resp.data.data || resp.data;
      return (data || []).map(t => ({ id: t.id || t._id, name: t.name, status: (t.status || '').toUpperCase() }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar reservas/mesas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [role]);

  const createReservation = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post('/reservations', payload);
      const data = resp.data.data || resp.data;
      return { ok: true, data };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear reserva');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [role]);

  const cancelReservation = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.put(`/reservations/${id}/cancel`);
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
      const resp = await apiClient.put(`/tables/${tableId}/status`, { status });
      const data = resp.data.data || resp.data;
      return { ok: true, data };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar mesa');
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [role]);

  return { fetchReservations, createReservation, cancelReservation, updateTableStatus, loading, error };
}
