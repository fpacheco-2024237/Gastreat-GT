// File: src/features/auth/screens/LoginScreen.jsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Input from '../../../shared/components/common/Input.jsx';
import Button from '../../../shared/components/common/Button.jsx';
import useAuth from '../hooks/useAuth.js';
import { SPACING, COLORS, FONT_SIZE } from '../../../shared/constants/theme.js';

export default function LoginScreen({ navigation }) {
  const { control, handleSubmit } = useForm({ defaultValues: { emailOrUsername: '', password: '' } });
  const { handleLogin, loading, error } = useAuth();

  const onSubmit = async (values) => {
    const res = await handleLogin(values);
    if (!res.ok) {
      Alert.alert('Error', error || 'No se pudo iniciar sesión');
    }
  };

  return (
    <View style={{ flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
        <Image source={require('../../../../assets/gastreat_gt.png')} style={{ width: 140, height: 140, resizeMode: 'contain' }} />
      </View>

      <Controller
        control={control}
        name="emailOrUsername"
        render={({ field: { onChange, value } }) => (
          <Input label="Correo o usuario" value={value} onChangeText={onChange} placeholder="correo@ejemplo.com o usuario" />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input label="Contraseña" value={value} onChangeText={onChange} placeholder="********" secureTextEntry />
        )}
      />

      <Button title="Iniciar sesión" onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: SPACING.md }} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md }}>
        <Text style={{ color: COLORS.textLight }}>¿No tienes cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={{ color: COLORS.primary }}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
