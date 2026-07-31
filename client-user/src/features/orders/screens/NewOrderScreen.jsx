import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import useMenu from '../../menu/hooks/useMenu.js';
import useOrders from '../hooks/useOrders.js';
import { Card, LoadingSpinner, EmptyState } from '../../../shared/components/common/Common.jsx';
import Button from '../../../shared/components/common/Button.jsx';
import { SPACING, COLORS, FONT_SIZE } from '../../../shared/constants/theme.js';

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

  const decreaseQty = (itemId) => {
    setCart(prev => {
      const found = prev.find(p => p.id === itemId);
      if (!found) return prev;
      if (found.qty <= 1) return prev.filter(p => p.id !== itemId);
      return prev.map(p => p.id === itemId ? { ...p, qty: p.qty - 1 } : p);
    });
  };

  const removeItem = (itemId) => {
    setCart(prev => prev.filter(p => p.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);

  const submit = async () => {
    if (!cart || cart.length === 0) return Alert.alert('Carrito vacío');
    const restaurantId = cart[0].restaurantId;
    if (!restaurantId) return Alert.alert('Error', 'No se encontró el restaurante asociado al platillo');
    const payload = { restaurantId, items: cart.map(i => ({ productId: i.id, quantity: i.qty })) };
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
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView style={{ flex: 1, padding: SPACING.lg }}>
        <Text style={{ fontSize: FONT_SIZE.lg, color: COLORS.text, fontWeight: 'bold', marginBottom: SPACING.md }}>
          Menú
        </Text>

        {items.map(item => (
          <Card key={item.id} style={{ marginBottom: SPACING.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontWeight: 'bold' }}>{item.name}</Text>
                <Text style={{ color: COLORS.textLight, fontSize: 12 }}>{item.description}</Text>
                <Text style={{ color: COLORS.primary, fontWeight: 'bold', marginTop: 4 }}>Q{item.price?.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleAdd(item)}
                style={{ backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Agregar</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>

      {cart.length > 0 && (
        <View style={{
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          padding: SPACING.lg,
          maxHeight: 300,
        }}>
          <Text style={{ fontSize: FONT_SIZE.lg, color: COLORS.text, fontWeight: 'bold', marginBottom: SPACING.sm }}>
            Mi Pedido ({cart.length})
          </Text>

          <ScrollView style={{ maxHeight: 160 }}>
            {cart.map(item => (
              <View key={item.id} style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: SPACING.xs,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.text }}>{item.name}</Text>
                  <Text style={{ color: COLORS.textLight, fontSize: 12 }}>Q{item.price?.toFixed(2)} c/u</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => decreaseQty(item.id)}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>−</Text>
                  </TouchableOpacity>

                  <Text style={{ color: COLORS.text, fontWeight: 'bold', minWidth: 20, textAlign: 'center' }}>{item.qty}</Text>

                  <TouchableOpacity
                    onPress={() => toggleAdd(item)}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>+</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={{ marginLeft: 8, padding: 4 }}
                  >
                    <Text style={{ color: COLORS.error, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: FONT_SIZE.lg }}>Total</Text>
            <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: FONT_SIZE.lg }}>Q{cartTotal.toFixed(2)}</Text>
          </View>

          <Button title="Enviar pedido" onPress={submit} loading={orderLoading} style={{ marginTop: SPACING.md }} />
        </View>
      )}
    </View>
  );
}
