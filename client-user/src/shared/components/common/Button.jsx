// File: src/shared/components/common/Button.jsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme.js';

export default function Button({ variant = 'primary', title, onPress, loading = false, style, icon }) {
  // Boton reutilizable con variantes de color y estado de carga.
  const backgroundColor = variant === 'primary' ? COLORS.primary : COLORS.secondary;
  const color = '#fff';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[{ padding: SPACING.md, backgroundColor, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }, style]}
      disabled={loading}
    >
      {/* Mientras carga, mostramos spinner en lugar del icono. */}
      {loading ? (
        <ActivityIndicator color={color} style={{ marginRight: 8 }} />
      ) : (
        icon ? <MaterialIcons name={icon} size={20} color={color} style={{ marginRight: 8 }} /> : null
      )}
      <Text style={{ color, fontSize: FONT_SIZE.md }}>{title}</Text>
    </TouchableOpacity>
  );
}
