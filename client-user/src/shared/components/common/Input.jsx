// File: src/shared/components/common/Input.jsx
import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme.js';

export default function Input({ label, value, onChangeText, placeholder, error, secureTextEntry = false, style, ...rest }) {
  return (
    // Campo de texto reutilizable con etiqueta y mensaje de error.
    <View style={{ marginBottom: SPACING.md }}>
      {label ? <Text style={{ marginBottom: 6, color: COLORS.text }}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        secureTextEntry={secureTextEntry}
        style={[{ padding: SPACING.sm, borderRadius: 8, backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, color: COLORS.text }, style]}
        {...rest}
      />
      {error ? <Text style={{ marginTop: 6, color: COLORS.error }}>{error}</Text> : null}
    </View>
  );
}
