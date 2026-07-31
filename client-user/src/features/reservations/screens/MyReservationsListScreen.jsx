// File: src/features/reservations/MyReservationsListScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import useReservations from '../hooks/useReservations.js';
import { Card, LoadingSpinner, EmptyState } from '../../../shared/components/common/Common.jsx';
import { COLORS, SPACING } from '../../../shared/constants/theme.js';

export default function MyReservationsListScreen({ navigation }) {
  const { fetchReservations, loading, error, cancelReservation } = useReservations();
  const [items, setItems] = useState([]);

  // Recupera reservas del usuario y refresca la vista.
  const load = async () => {
    const data = await fetchReservations();
    setItems(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Error" message={error} />;

  const createButton = (
    <TouchableOpacity
      onPress={() => navigation.navigate('CreateReservation')}
      style={{ backgroundColor: COLORS.primary, borderRadius: 8, padding: SPACING.sm, alignItems: 'center', margin: SPACING.sm }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Nueva reserva</Text>
    </TouchableOpacity>
  );

  if (!items || items.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState title="Sin reservas" message="No tienes reservas. Elige una mesa para crear la primera." />
        {createButton}
      </View>
    );
  }

  return (
    // Tarjetas con acceso al detalle y accion rapida de cancelacion.
    <FlatList
      data={items}
      keyExtractor={(item) => item.id || String(Math.random())}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.primary} />}
      ListHeaderComponent={createButton}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('ReservationDetail', { reservation: item, id: item.id || item._id })}>
          <Card style={{ margin: SPACING.sm }}>
            <Text style={{ color: COLORS.text }}>{item.table?.name || item.table}</Text>
            <Text style={{ color: COLORS.textLight }}>Estado: {item.normalizedStatus}</Text>
            {item.startTime ? <Text style={{ color: COLORS.textLight, marginTop: SPACING.sm }}>Inicio: {new Date(item.startTime).toLocaleString()}</Text> : null}
            <TouchableOpacity
              onPress={async () => {
                const res = await cancelReservation(item.id || item._id);
                if (res.ok) {
                  Alert.alert('Reserva', 'Cancelada');
                  load();
                }
              }}
              style={{ marginTop: SPACING.sm }}
            >
              <Text style={{ color: COLORS.primary }}>Cancelar</Text>
            </TouchableOpacity>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}
