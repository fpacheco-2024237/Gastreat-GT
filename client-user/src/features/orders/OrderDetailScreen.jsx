// File: src/features/orders/OrderDetailScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import useOrders from './useOrders.js';
import useAuthStore from '../../shared/store/authStore.js';
import { Card, LoadingSpinner } from '../../shared/components/common/Common.jsx';
import Button from '../../shared/components/common/Button.jsx';
import { SPACING, COLORS } from '../../shared/constants/theme.js';

export default function OrderDetailScreen() {
  const route = useRoute();
  const { id, order } = route.params || {};
  const { patchOrder, fetchOrders, loading } = useOrders();
  const { role } = useAuthStore();
  const [data, setData] = useState(order || null);

  useEffect(() => {
    if (!data && id) {
      // idealmente fetch detalle, aquí usamos fetchOrders para refrescar lista
      fetchOrders().then(list => {
        const found = (list || []).find(o => (o.id === id || o._id === id));
        setData(found || null);
      });
    }
  }, [id]);

  if (loading && !data) return <LoadingSpinner />;
  if (!data) return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><Text>No se encontró el pedido</Text></View>
  );

  const handleAction = async (action, statusPayload) => {
    try {
      if (action === 'cancel' && role === 'USER_ROLE') {
        const res = await patchOrder(data.id || data._id, 'cancel');
        if (res.ok) Alert.alert('Pedido', 'Pedido cancelado');
      }
      if (action === 'status' && role === 'ADMIN_ROLE') {
        const res = await patchOrder(data.id || data._id, 'status', { status: statusPayload });
        if (res.ok) Alert.alert('Pedido', `Estado actualizado a ${statusPayload}`);
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e.message || 'Error en acción');
    }
  };

  return (
    <View style={{ flex:1, padding: SPACING.lg, backgroundColor: COLORS.background }}>
      <Card>
        <Text style={{ color: COLORS.text }}>ID: {data.id || data._id}</Text>
        <Text style={{ color: COLORS.textLight }}>Estado: {data.normalizedStatus || (data.status || '').toUpperCase()}</Text>
      </Card>

      <View style={{ marginTop: SPACING.md }}>
        {role === 'USER_ROLE' ? <Button title="Cancelar pedido" onPress={() => handleAction('cancel')} /> : null}
        {role === 'ADMIN_ROLE' ? (
          <>
            <Button title="Marcar EN_PREPARACION" onPress={() => handleAction('status', 'EN_PREPARACION')} style={{ marginBottom: SPACING.sm }} />
            <Button title="Marcar LISTO" onPress={() => handleAction('status', 'LISTO')} style={{ marginBottom: SPACING.sm }} />
            <Button title="Marcar ENTREGADO" onPress={() => handleAction('status', 'ENTREGADO')} style={{ marginBottom: SPACING.sm }} />
          </>
        ) : null}
      </View>
    </View>
  );
}
