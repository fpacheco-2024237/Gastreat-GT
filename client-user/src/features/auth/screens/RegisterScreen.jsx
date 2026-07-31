// File: src/features/auth/screens/RegisterScreen.jsx
import React from 'react';
import { View, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Input from '../../../shared/components/common/Input.jsx';
import Button from '../../../shared/components/common/Button.jsx';
import useAuth from '../hooks/useAuth.js';
import { SPACING, COLORS } from '../../../shared/constants/theme.js';

export default function RegisterScreen({ navigation }) {
  const { control, handleSubmit } = useForm({ defaultValues: { name: '', surname: '', username: '', email: '', password: '', phone: '' } });
  const { handleRegister, loading, error } = useAuth();

  // Registra el usuario y va a verificación de correo.
  const onSubmit = async (values) => {
    const res = await handleRegister(values);
    if (res.ok) {
      Alert.alert('Registro', 'Registro exitoso. Revisa tu correo para verificar tu cuenta.', [
        { text: 'OK', onPress: () => navigation.navigate('VerifyEmail', { email: values.email }) },
      ]);
    } else {
      Alert.alert('Error', res.error?.response?.data?.message || res.error?.message || error || 'No se pudo registrar');
    }
  };

  return (
    // Formulario simple de alta de usuario.
    <View style={{ flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background, justifyContent: 'center' }}>
      <Controller control={control} name="name" render={({ field: { onChange, value } }) => <Input label="Nombre" value={value} onChangeText={onChange} placeholder="Nombre" />} />
      <Controller control={control} name="surname" render={({ field: { onChange, value } }) => <Input label="Apellido" value={value} onChangeText={onChange} placeholder="Apellido" />} />
      <Controller control={control} name="username" render={({ field: { onChange, value } }) => <Input label="Usuario" value={value} onChangeText={onChange} placeholder="usuario" />} />
      <Controller control={control} name="email" render={({ field: { onChange, value } }) => <Input label="Correo" value={value} onChangeText={onChange} placeholder="correo@ejemplo.com" />} />
      <Controller control={control} name="password" render={({ field: { onChange, value } }) => <Input label="Contraseña" value={value} onChangeText={onChange} placeholder="********" secureTextEntry />} />
      <Controller control={control} name="phone" render={({ field: { onChange, value } }) => <Input label="Teléfono" value={value} onChangeText={onChange} placeholder="+502 4XXXXXXX" />} />

      <Button title="Crear cuenta" onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: SPACING.md }} />
    </View>
  );
}
