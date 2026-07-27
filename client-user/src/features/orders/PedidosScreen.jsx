// File: src/features/orders/PedidosScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import useOrders from './useOrders.js';
import useAuthStore from '../../shared/store/authStore.js';
import { Card, LoadingSpinner, EmptyState } from '../../shared/components/common/Common.jsx';
import { COLORS, SPACING, FONT_SIZE } from '../../shared/constants/theme.js';

export default function PedidosScreen() {
  const { fetchOrders, loading, error } = useOrders();
  const { role } = useAuthStore();
  const [orders, setOrders] = useState([]);

  const load = async () => {
    const data = await fetchOrders();
    setOrders(data || []);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <EmptyState title="Error" message={error} />;
  if (!orders || orders.length === 0) return <EmptyState title="Sin pedidos" message="No hay pedidos disponibles." />;

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id || o._id || String(Math.random())}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.primary} />}
      renderItem={({ item }) => (
        <Card style={{ margin: SPACING.sm }}>
          <Text style={{ color: COLORS.text }}>{item.id || item._id}</Text>
          <Text style={{ color: COLORS.textLight }}>Estado: {item.normalizedStatus}</Text>
        </Card>
      )}
    />
  );
}
