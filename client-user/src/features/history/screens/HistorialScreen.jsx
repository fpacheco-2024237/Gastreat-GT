// File: src/features/history/HistorialScreen.jsx
import React, { useEffect, useState } from 'react';
import { Text, FlatList } from 'react-native';
import useHistory from '../hooks/useHistory.js';
import useAuthStore from '../../../shared/store/authStore.js';
import { Card, LoadingSpinner, EmptyState } from '../../../shared/components/common/Common.jsx';
import { COLORS, SPACING } from '../../../shared/constants/theme.js';

export default function HistorialScreen() {
  const { fetchHistory, loading, error } = useHistory();
  const { role } = useAuthStore();
  const [data, setData] = useState({});

  // Junta el historial remoto y deja listo el conjunto para renderizar.
  const load = async () => {
    const res = await fetchHistory();
    setData(res || {});
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Error" message={error} />;

  // Vista para cliente: pedidos y reservas mezclados por fecha.
  if (role === 'USER_ROLE') {
    const orders = data.orders || [];
    const reservations = data.reservations || [];
    if (orders.length === 0 && reservations.length === 0) return <EmptyState title="Sin historial" message="Aún no tienes historial." />;

    const items = [
      ...orders.map((item) => ({ ...item, kind: 'Pedido', sortDate: item.createdAt || item.updatedAt || item.date })),
      ...reservations.map((item) => ({ ...item, kind: 'Reserva', sortDate: item.createdAt || item.startTime || item.date })),
    ].sort((left, right) => new Date(right.sortDate || 0) - new Date(left.sortDate || 0));

    return (
      <FlatList
        data={items}
        keyExtractor={(item, index) => item.id || item._id || String(index)}
        renderItem={({ item }) => (
          <Card style={{ margin: SPACING.sm }}>
            <Text style={{ color: COLORS.text }}>{item.kind}</Text>
            <Text style={{ color: COLORS.textLight }}>{item.id || item._id}</Text>
            <Text style={{ color: COLORS.textLight }}>{item.status || item.normalizedStatus}</Text>
          </Card>
        )}
      />
    );
  }

  // Vista para admin: recibos globales de facturacion.
  if (role === 'ADMIN_ROLE') {
    const receipts = data.receipts || [];
    if (receipts.length === 0) return <EmptyState title="Sin recibos" message="No hay recibos." />;

    return (
      <FlatList
        data={receipts}
        keyExtractor={(receipt) => receipt.receiptNumber || String(Math.random())}
        renderItem={({ item }) => (
          <Card style={{ margin: SPACING.sm }}>
            <Text style={{ color: COLORS.text }}>Recibo: {item.receiptNumber}</Text>
            <Text style={{ color: COLORS.textLight }}>Total: {item.total}</Text>
          </Card>
        )}
      />
    );
  }

  return <EmptyState title="Sin datos" message="No se encontró información para este rol." />;
}
