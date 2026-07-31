// File: src/features/orders/PedidosScreen.jsx
import React, { useEffect, useState } from 'react';
import { Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import useOrders from '../hooks/useOrders.js';
import useAuthStore from '../../../shared/store/authStore.js';
import { Card, LoadingSpinner, EmptyState } from '../../../shared/components/common/Common.jsx';
import { COLORS, SPACING } from '../../../shared/constants/theme.js';

export default function PedidosScreen({ navigation }) {
  const { fetchOrders, loading, error } = useOrders();
  const { role } = useAuthStore();
  const [orders, setOrders] = useState([]);

  // Recarga la lista según el rol y deja el estado en pantalla.
  const load = async () => {
    const data = await fetchOrders();
    setOrders(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <EmptyState title="Error" message={error} />;
  if (!orders || orders.length === 0) return <EmptyState title="Sin pedidos" message="No hay pedidos disponibles." />;

  return (
    // Lista navegable: cada pedido abre su detalle.
    <FlatList
      data={orders}
      keyExtractor={(order) => order.id || order._id || String(Math.random())}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.primary} />}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { order: item, id: item.id || item._id })}>
          <Card style={{ margin: SPACING.sm }}>
            <Text style={{ color: COLORS.text }}>{item.id || item._id}</Text>
            <Text style={{ color: COLORS.textLight }}>Estado: {item.normalizedStatus}</Text>
            {item.total ? <Text style={{ color: COLORS.textLight }}>Total: {item.total}</Text> : null}
            <Text style={{ color: COLORS.textLight, marginTop: SPACING.xs }}>{role === 'USER_ROLE' ? 'Mis pedidos' : 'Pedidos activos'}</Text>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}
