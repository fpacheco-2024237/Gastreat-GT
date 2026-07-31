// File: src/features/profile/ProfileScreen.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import authClient from '../../shared/api/authClient.js';
import useAuthStore from '../../shared/store/authStore.js';
import Input from '../../shared/components/common/Input.jsx';
import Button from '../../shared/components/common/Button.jsx';
import { Card, LoadingSpinner } from '../../shared/components/common/Common.jsx';
import { COLORS, SPACING, FONT_SIZE } from '../../shared/constants/theme.js';

const roleLabel = (role) => {
  // Traduce el rol técnico del backend a una etiqueta legible.
  switch ((role || '').toUpperCase()) {
    case 'USER_ROLE':
      return 'Cliente';
    case 'ADMIN_ROLE':
      return 'Administrador';
    default:
      return role || 'Usuario';
  }
};

export default function ProfileScreen() {
  const { user, role, updateUser, logout } = useAuthStore();
  const { control, handleSubmit, reset } = useForm({ defaultValues: { displayName: '', phone: '', direccion: '' } });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Carga el perfil desde el Auth Service y sincroniza el formulario.
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await authClient.get('/profile');
      const data = resp.data.data || resp.data;
      reset({
        displayName: data.displayName || data.name || '',
        phone: data.phone || '',
        direccion: data.direccion || data.address || '',
      });
      if (data) updateUser(data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  }, [reset, updateUser]);

  // Rehidrata el perfil apenas monta la pantalla.
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Persiste los cambios del perfil y actualiza la store local.
  const onSave = async (values) => {
    setLoading(true);
    try {
      const payload = { displayName: values.displayName, phone: values.phone };
      if (role === 'USER_ROLE') payload.direccion = values.direccion;
      const resp = await authClient.put('/profile', payload);
      const data = resp.data.data || resp.data;
      updateUser(data);
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Confirma el cierre de sesión antes de limpiar todo.
  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading && !user) return <LoadingSpinner size="large" />;

  const avatarUri = user?.avatar || user?.photo || '';
  const avatarSource = avatarUri && String(avatarUri).startsWith('http') ? { uri: avatarUri } : require('../../../assets/avatarForDefault.png');

  return (
    // Resumen visual del perfil + formulario editable por secciones.
    <View style={{ flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background }}>
      <Card style={{ alignItems: 'center', padding: SPACING.lg }}>
        <Image source={avatarSource} style={{ width: 96, height: 96, borderRadius: 48, marginBottom: SPACING.sm }} />
        <Text style={{ fontSize: FONT_SIZE.lg, color: COLORS.text }}>{user?.displayName || user?.name || user?.username}</Text>
        <Text style={{ color: COLORS.primary, marginTop: SPACING.sm }}>{roleLabel(role)}</Text>
      </Card>

      <View style={{ marginTop: SPACING.md }}>
        <Controller
          control={control}
          name="displayName"
          rules={{ required: 'El nombre es requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input label="Nombre mostrado" value={value} onChangeText={onChange} placeholder="Nombre" editable={editing} error={error?.message} />
          )}
        />

        <Controller
          control={control}
          name="phone"
          rules={{ pattern: { value: /^\+?\d{8,15}$/, message: 'Teléfono inválido (8-15 dígitos)' } }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input label="Teléfono" value={value} onChangeText={onChange} placeholder="Teléfono" editable={editing} error={error?.message} />
          )}
        />

        {role === 'USER_ROLE' ? (
          <Controller
            control={control}
            name="direccion"
            rules={{ required: role === 'USER_ROLE' ? 'Dirección requerida para entrega' : false }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input label="Dirección" value={value} onChangeText={onChange} placeholder="Dirección de entrega" editable={editing} error={error?.message} />
            )}
          />
        ) : null}

        {!editing ? (
          <Button title="Editar perfil" onPress={() => setEditing(true)} style={{ marginTop: SPACING.md }} />
        ) : (
          <View>
            <Button title="Guardar" onPress={handleSubmit(onSave)} loading={loading} />
            <Button title="Cancelar" variant="secondary" onPress={() => { setEditing(false); fetchProfile(); }} style={{ marginTop: SPACING.sm }} />
          </View>
        )}

        <Button title="Cerrar sesión" variant="secondary" onPress={handleLogout} style={{ marginTop: SPACING.md }} />
      </View>
    </View>
  );
}
