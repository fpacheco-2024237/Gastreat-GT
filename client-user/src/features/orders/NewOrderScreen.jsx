// File: src/features/orders/NewOrderScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import useMenu from '../menu/useMenu.js';
import useOrders from './useOrders.js';
import { Card, LoadingSpinner, EmptyState } from '../../shared/components/common/Common.jsx';
import Button from '../../shared/components/common/Button.jsx';
import { SPACING, COLORS } from '../../shared/constants/theme.js';

export default function NewOrderScreen({ route, navigation }) {
  const { dish: preselected } = route.params || {};
  const { items, loading: menuLoading, fetchMenu } = useMenu();
  const { createOrder, loading: orderLoading } = useOrders();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (preselected) setCart([{ ...preselected, qty: 1 }]);
  }, [preselected]);

  const toggleAdd = (item) => {
    setCart(prev => {
      const found = prev.find(p => p.id === item.id);
      if (found) return prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const submit = async () => {
    if (!cart || cart.length === 0) return Alert.alert('Carrito vacío');
    const payload = { items: cart.map(i => ({ id: i.id, quantity: i.qty })) };
    const res = await createOrder(payload);
    if (res.ok) {
      Alert.alert('Pedido', 'Pedido creado correctamente');
      navigation.navigate('Pedidos');
    } else {
      Alert.alert('Error', res.error?.response?.data?.message || 'No se pudo crear el pedido');
    }
  };

  if (menuLoading) return <LoadingSpinner />;
  if (!items || items.length === 0) return <EmptyState title="Sin platillos" message="No hay platillos para seleccionar." />;

  return (
    <View style={{ flex:1, padding: SPACING.lg, backgroundColor: COLORS.background }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: SPACING.sm }}>
            <Text style={{ color: COLORS.text }}>{item.name}</Text>
            <Text style={{ color: COLORS.textLight }}>{item.description}</Text>
            <TouchableOpacity onPress={() => toggleAdd(item)}>
              <Text style={{ color: COLORS.primary }}>Agregar</Text>
            </TouchableOpacity>
          </Card>
        )}
      />

      <Button title="Enviar pedido" onPress={submit} loading={orderLoading} />
    </View>
  );
}
