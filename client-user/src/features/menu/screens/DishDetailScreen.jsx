// File: src/features/menu/DishDetailScreen.jsx
import React from 'react';
import { View, Text, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import useAuthStore from '../../../shared/store/authStore.js';
import Button from '../../../shared/components/common/Button.jsx';
import { COLORS, SPACING, FONT_SIZE } from '../../../shared/constants/theme.js';

export default function DishDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { role } = useAuthStore();
  const { dish } = route.params || {};

  if (!dish) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No hay detalles del platillo.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background }}>
      {dish.image ? <Image source={{ uri: dish.image }} style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: SPACING.md }} /> : null}
      <Text style={{ fontSize: FONT_SIZE.xl, color: COLORS.text, marginBottom: SPACING.sm }}>{dish.name}</Text>
      <Text style={{ color: COLORS.textLight, marginBottom: SPACING.md }}>{dish.description}</Text>
      <Text style={{ color: COLORS.primary, marginBottom: SPACING.md }}>{dish.price ? `$ ${dish.price}` : ''}</Text>

      {role === 'USER_ROLE' ? (
        <Button title="Agregar al pedido" onPress={() => navigation.navigate('Pedidos', { screen: 'NewOrder', params: { dish } })} />
      ) : null}
    </View>
  );
}
