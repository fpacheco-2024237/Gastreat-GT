import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import useRestaurantStore from '../../../shared/store/restaurantStore.js';
import { LoadingSpinner, EmptyState } from '../../../shared/components/common/Common.jsx';
import { COLORS, SPACING, FONT_SIZE } from '../../../shared/constants/theme.js';

export default function RestaurantsScreen() {
  const { restaurants, loading, error, fetchRestaurants, setRestaurant } = useRestaurantStore();

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleSelect = (restaurant) => {
    setRestaurant(restaurant._id, restaurant.name);
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <EmptyState title="Error" message={error} />;
  if (!restaurants || restaurants.length === 0) {
    return <EmptyState title="Sin restaurantes" message="No hay restaurantes disponibles." />;
  }

  return (
    <View style={{ flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background }}>
      <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
        <Text style={{ fontSize: FONT_SIZE.xl, color: COLORS.text, fontWeight: 'bold' }}>
          Selecciona un Restaurante
        </Text>
        <Text style={{ color: COLORS.textLight, marginTop: SPACING.xs }}>
          Elige el restaurante para continuar
        </Text>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelect(item)}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 12,
              padding: SPACING.lg,
              marginBottom: SPACING.md,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: SPACING.md }} />
            ) : null}
            <Text style={{ fontSize: FONT_SIZE.lg, color: COLORS.text, fontWeight: 'bold' }}>
              {item.name}
            </Text>
            <Text style={{ color: COLORS.textLight, marginTop: SPACING.xs }}>
              {item.address || 'Sin dirección'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm }}>
              <View style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: item.active ? COLORS.success : COLORS.error,
                marginRight: SPACING.xs,
              }} />
              <Text style={{ color: COLORS.textLight, fontSize: 12 }}>
                {item.active ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
