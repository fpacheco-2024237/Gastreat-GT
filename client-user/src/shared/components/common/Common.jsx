// File: src/shared/components/common/Common.jsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../constants/theme.js';

export function LoadingSpinner({ size = 'small' }) {
  // Indicador reutilizable para cargas cortas o globales.
  return <ActivityIndicator color={COLORS.primary} size={size} />;
}

export function EmptyState({ title = 'Sin elementos', message = 'No hay datos para mostrar.' }) {
  return (
    // Estado vacio para listas y pantallas sin contenido.
    <View style={{ padding: SPACING.lg, alignItems: 'center' }}>
      <Text style={{ fontSize: FONT_SIZE.lg, color: COLORS.text }}>{title}</Text>
      <Text style={{ marginTop: SPACING.sm, color: COLORS.textLight }}>{message}</Text>
    </View>
  );
}

export function Card({ children, style }) {
  return (
    // Tarjeta base para agrupar contenido con sombra suave.
    <View style={[{ backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: 12 }, SHADOWS.sm, style]}>
      {children}
    </View>
  );
}
