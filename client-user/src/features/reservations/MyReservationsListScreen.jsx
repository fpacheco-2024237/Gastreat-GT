// File: src/features/reservations/MyReservationsListScreen.jsx
import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, RefreshControl } from 'react-native';
import useReservations from './useReservations.js';
import { Card, LoadingSpinner, EmptyState } from '../../shared/components/common/Common.jsx';
import { COLORS, SPACING } from '../../shared/constants/theme.js';

export default function MyReservationsListScreen() {
  const { fetchReservations, loading, error, cancelReservation } = useReservations();
  const [items, setItems] = useState([]);

  const load = async () => {
    const data = await fetchReservations();
    setItems(data || []);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Error" message={error} />;
  if (!items || items.length === 0) return <EmptyState title="Sin reservas" message="No tienes reservas." />;

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id || String(Math.random())}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.primary} />}
      renderItem={({ item }) => (
        <Card style={{ margin: SPACING.sm }}>
          <Text style={{ color: COLORS.text }}>{item.table?.name || item.table}</Text>
          <Text style={{ color: COLORS.textLight }}>Estado: {item.normalizedStatus}</Text>
        </Card>
      )}
    />
  );
}
