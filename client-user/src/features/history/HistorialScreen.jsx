// File: src/features/history/HistorialScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import useHistory from './useHistory.js';
import useAuthStore from '../../shared/store/authStore.js';
import { Card, LoadingSpinner, EmptyState } from '../../shared/components/common/Common.jsx';
import { COLORS, SPACING } from '../../shared/constants/theme.js';

export default function HistorialScreen() {
  const { fetchHistory, loading, error } = useHistory();
  const { role } = useAuthStore();
  const [data, setData] = useState({});

  const load = async () => {
    const res = await fetchHistory();
    setData(res || {});
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Error" message={error} />;

  // Render según role
  if (role === 'USER_ROLE') {
    const orders = data.orders || [];
    const reservations = data.reservations || [];
    if (orders.length === 0 && reservations.length === 0) return <EmptyState title="Sin historial" message="Aún no tienes historial." />;
    return (
      <FlatList
        data={[...orders, ...reservations]}
        keyExtractor={(i, idx) => i.id || i._id || String(idx)}
        renderItem={({ item }) => (
          <Card style={{ margin: SPACING.sm }}>
            <Text style={{ color: COLORS.text }}>{item.id || item._id}</Text>
          </Card>
        )}
      />
    );
  }

  if (role === 'ADMIN_ROLE') {
    const receipts = data.receipts || [];
    if (receipts.length === 0) return <EmptyState title="Sin recibos" message="No hay recibos." />;
    return (
      <FlatList
        data={receipts}
        keyExtractor={(r) => r.receiptNumber || String(Math.random())}
        renderItem={({ item }) => (
          <Card style={{ margin: SPACING.sm }}>
            <Text style={{ color: COLORS.text }}>Recibo: {item.receiptNumber}</Text>
            <Text style={{ color: COLORS.textLight }}>Total: {item.total}</Text>
          </Card>
        )}
      />
    );
  }
}
