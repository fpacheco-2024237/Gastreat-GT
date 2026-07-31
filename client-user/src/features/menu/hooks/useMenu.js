import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../shared/api/apiClient.js';
import useRestaurantStore from '../../../shared/store/restaurantStore.js';

export default function useMenu() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const { restaurantId } = useRestaurantStore();

  const fetchMenu = useCallback(async () => {
    if (!restaurantId) return [];
    setLoading(true);
    setError(null);
    try {
      const [prodResp, catResp] = await Promise.all([
        apiClient.get('/products', { params: { restaurantId } }),
        apiClient.get('/categories', { params: { restaurantId } })
      ]);
      const products = prodResp.data.data || prodResp.data || [];
      const categories = catResp.data.data || catResp.data || [];
      const categoryMap = {};
      categories.forEach(c => { categoryMap[c._id || c.id] = c.name; });

      const mapped = products.map(p => ({
        id: p._id || p.id,
        name: p.name,
        image: p.imageUrl || p.image || null,
        category: categoryMap[p.categoryId] || 'General',
        price: p.price,
        description: p.description,
        isAvailable: Boolean(p.stock > 0) && p.active !== false,
        restaurantId: p.restaurantId || p.restaurant?._id || null
      }));
      setItems(mapped);
      return mapped;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar el menú');
      return null;
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return { items, loading, error, fetchMenu };
}
