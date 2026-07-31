// File: src/features/menu/MenuScreen.jsx
import React from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Image } from 'react-native';
import useMenu from '../hooks/useMenu.js';
import { Card, LoadingSpinner, EmptyState } from '../../../shared/components/common/Common.jsx';
import { COLORS, SPACING, FONT_SIZE } from '../../../shared/constants/theme.js';

function CategorySection({ title, data, onPressItem }) {
  return (
    // Una seccion por categoria para que el menu sea facil de escanear.
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={{ fontSize: FONT_SIZE.lg, color: COLORS.text, marginBottom: SPACING.sm }}>{title}</Text>
      {data.map((item) => (
        <TouchableOpacity key={item.id} onPress={() => onPressItem(item)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
            {item.image ? <Image source={{ uri: item.image }} style={{ width: 64, height: 64, borderRadius: 8, marginRight: SPACING.sm }} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text }}>{item.name}</Text>
              <Text style={{ color: COLORS.textLight }}>{item.description}</Text>
            </View>
            <Text style={{ color: COLORS.primary }}>{item.price ? `$ ${item.price}` : ''}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MenuScreen({ navigation }) {
  const { items, loading, error, fetchMenu } = useMenu();

  // Abre el detalle del platillo seleccionado.
  const onPressItem = (item) => {
    navigation.navigate('DishDetail', { dish: item });
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <EmptyState title="Error" message={error} />;
  if (!items || items.length === 0) return <EmptyState title="Sin platillos" message="No hay platillos disponibles." />;

  // Agrupa los platillos por categoria antes de pintarlos.
  const grouped = items.reduce((acc, it) => {
    (acc[it.category] = acc[it.category] || []).push(it);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    // Lista con pull-to-refresh para volver a cargar el menu.
    <FlatList
      data={categories}
      keyExtractor={(category) => category}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMenu} tintColor={COLORS.primary} />}
      renderItem={({ item: category }) => (
        <View style={{ padding: SPACING.lg }}>
          <CategorySection title={category} data={grouped[category]} onPressItem={onPressItem} />
        </View>
      )}
    />
  );
}
