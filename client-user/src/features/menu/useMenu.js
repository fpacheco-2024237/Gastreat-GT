// File: src/features/menu/useMenu.js
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../shared/api/apiClient.js';

export default function useMenu() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.get('/menu');
      const data = resp.data.data || resp.data;
      // mapear platillos
      const mapped = (data || []).map((p) => ({
        id: p.id || p._id || String(Math.random()),
        name: p.name,
        image: p.photo || p.image || null,
        category: p.category || 'General',
        price: p.price,
        description: p.description,
        isAvailable: Boolean((p.stock && p.stock > 0) || p.isActive || p.available)
      }));
      setItems(mapped);
      return mapped;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar el menú');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return { items, loading, error, fetchMenu };
}
