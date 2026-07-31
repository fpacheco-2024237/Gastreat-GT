// File: src/features/reservations/TablesStatusScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import useReservations from '../hooks/useReservations.js';
import { Card, LoadingSpinner, EmptyState } from '../../../shared/components/common/Common.jsx';
import { COLORS, SPACING } from '../../../shared/constants/theme.js';

export default function TablesStatusScreen() {
  const { fetchReservations, loading, error, updateTableStatus } = useReservations();
  const [tables, setTables] = useState([]);

  // Carga el estado de mesas y deja una grilla lista para operar.
  const load = async () => {
    const data = await fetchReservations();
    setTables(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Error" message={error} />;
  if (!tables || tables.length === 0) return <EmptyState title="Sin mesas" message="No se encontraron mesas." />;

  const colorFor = (status) => {
    if (!status) return COLORS.surface;
    if (status === 'LIBRE') return '#d1fae5';
    if (status === 'OCUPADA') return '#fee2e2';
    if (status === 'RESERVADA') return '#fef3c7';
    return COLORS.surface;
  };

  return (
    // Cada tarjeta refleja el estado de la mesa y permite alternarlo.
    <FlatList
      data={tables}
      keyExtractor={(table) => table.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={async () => {
            const nextStatus = item.status === 'LIBRE' ? 'OCUPADA' : 'LIBRE';
            const res = await updateTableStatus(item.id, nextStatus);
            if (res.ok) load();
          }}
        >
          <Card style={{ margin: SPACING.sm, backgroundColor: colorFor(item.status) }}>
            <Text style={{ color: COLORS.text }}>{item.name}</Text>
            <Text style={{ color: COLORS.textLight }}>{item.status}</Text>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}
