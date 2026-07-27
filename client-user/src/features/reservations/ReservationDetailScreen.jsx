// File: src/features/reservations/ReservationDetailScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import useReservations from './useReservations.js';
import useAuthStore from '../../shared/store/authStore.js';
import Button from '../../shared/components/common/Button.jsx';
import { Card } from '../../shared/components/common/Common.jsx';
import { SPACING, COLORS } from '../../shared/constants/theme.js';

export default function ReservationDetailScreen() {
  const route = useRoute();
  const { id, reservation } = route.params || {};
  const { role } = useAuthStore();
  const { fetchReservations, cancelReservation, updateTableStatus } = useReservations();
  const [data, setData] = useState(reservation || null);

  useEffect(() => {
    if (!data && id) {
      fetchReservations().then(list => {
        const found = (list || []).find(r => (r.id === id || r._id === id));
        setData(found || null);
      });
    }
  }, [id]);

  if (!data) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><Text>No encontrado</Text></View>;

  return (
    <View style={{ flex:1, padding: SPACING.lg, backgroundColor: COLORS.background }}>
      <Card>
        <Text style={{ color: COLORS.text }}>Mesa: {data.table?.name || data.table}</Text>
        <Text style={{ color: COLORS.textLight }}>Estado: {data.normalizedStatus || (data.status || '').toUpperCase()}</Text>
      </Card>

      <View style={{ marginTop: SPACING.md }}>
        {role === 'USER_ROLE' ? <Button title="Cancelar reserva" onPress={async () => { const res = await cancelReservation(data.id || data._id); if (res.ok) Alert.alert('Reserva', 'Cancelada'); }} /> : null}
        {role === 'ADMIN_ROLE' ? <Button title="Cambiar estado mesa a OCUPADA" onPress={async () => { const res = await updateTableStatus(data.id || data._id, 'OCUPADA'); if (res.ok) Alert.alert('Mesa', 'Estado actualizado'); }} /> : null}
      </View>
    </View>
  );
}
