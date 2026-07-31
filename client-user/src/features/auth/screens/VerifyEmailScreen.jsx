import { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Input from '../../../shared/components/common/Input.jsx';
import Button from '../../../shared/components/common/Button.jsx';
import useAuth from '../hooks/useAuth.js';
import { SPACING, COLORS, FONT_SIZE } from '../../../shared/constants/theme.js';

export default function VerifyEmailScreen({ navigation, route }) {
  const { email: registeredEmail } = route.params || {};
  const { control, handleSubmit } = useForm({ defaultValues: { token: '', email: registeredEmail || '' } });
  const { handleVerifyEmail, handleResendVerification, loading } = useAuth();
  const [resending, setResending] = useState(false);

  const onSubmitVerification = async (values) => {
    const res = await handleVerifyEmail({ token: values.token });
    if (res.ok) {
      Alert.alert('Verificado', 'Correo verificado exitosamente. Ya puedes iniciar sesión.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } else {
      Alert.alert('Error', res.error?.response?.data?.message || res.error?.message || 'Token inválido o expirado');
    }
  };

  const onResend = async () => {
    if (!registeredEmail) {
      Alert.alert('Error', 'No se encontró el correo registrado');
      return;
    }
    setResending(true);
    const res = await handleResendVerification({ email: registeredEmail });
    setResending(false);
    if (res.ok) {
      Alert.alert('Reenviado', 'Se ha enviado un nuevo código de verificación a tu correo.');
    } else {
      Alert.alert('Error', res.error?.response?.data?.message || res.error?.message || 'Error al reenviar');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background, justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.textDark, marginBottom: SPACING.sm, textAlign: 'center' }}>
          Verifica tu correo
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.lg, textAlign: 'center' }}>
          Ingresa el código de verificación enviado a {registeredEmail || 'tu correo'}
        </Text>

        <Controller
          control={control}
          name='token'
          rules={{ required: 'El código es requerido' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input label='Código de verificación' value={value} onChangeText={onChange} placeholder='000000' error={error?.message} />
          )}
        />

        <Button title='Verificar' onPress={handleSubmit(onSubmitVerification)} loading={loading} style={{ marginTop: SPACING.md }} />

        <View style={{ marginTop: SPACING.lg, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm }}>¿No recibiste el código?</Text>
          <TouchableOpacity onPress={onResend} disabled={resending}>
            <Text style={{ fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '600' }}>
              {resending ? 'Enviando...' : 'Reenviar código'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
