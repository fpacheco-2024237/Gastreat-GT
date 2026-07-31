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

const roleLabel = (r) => {
  switch ((r || '').toUpperCase()) {
    case 'USER_ROLE': return 'Cliente';
    case 'ADMIN_ROLE': return 'Administrador';
    default: return r || 'Usuario';
  }
};

export default function ProfileScreen() {
  const { user, role, updateUser, logout } = useAuthStore();
  const { control, handleSubmit, reset } = useForm({ defaultValues: { displayName: '', phone: '', direccion: '' } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await authClient.get('/profile');
      const data = resp.data.data || resp.data;
      reset({ displayName: data.displayName || data.name || '', phone: data.phone || '', direccion: data.direccion || data.address || '' });
      if (data) updateUser(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  }, [reset, updateUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onSave = async (vals) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { displayName: vals.displayName, phone: vals.phone };
      if (role === 'USER_ROLE') payload.direccion = vals.direccion;
      const resp = await authClient.put('/profile', payload);
      const data = resp.data.data || resp.data;
      updateUser(data);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar perfil');
      Alert.alert('Error', error || 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() }
    ]);
  };

  if (loading && !user) return <LoadingSpinner size="large" />;

  const avatarUri = user?.avatar || user?.photo || '';
  const avatarSource = avatarUri && String(avatarUri).startsWith('http') ? { uri: avatarUri } : require('../../../assets/avatarForDefault.png');

  return (
    <View style={{ flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background }}>
      <Card style={{ alignItems: 'center', padding: SPACING.lg }}>
        <Image source={avatarSource} style={{ width: 96, height: 96, borderRadius: 48, marginBottom: SPACING.sm }} />
        <Text style={{ fontSize: FONT_SIZE.lg, color: COLORS.text }}>{user?.displayName || user?.name || user?.username}</Text>
        <Text style={{ color: COLORS.primary, marginTop: SPACING.sm }}>{roleLabel(role)}</Text>
      </Card>

      <View style={{ marginTop: SPACING.md }}>
        <Controller control={control} name="displayName" render={({ field: { onChange, value } }) => (
          <Input label="Nombre mostrado" value={value} onChangeText={onChange} placeholder="Nombre" editable={editing} />
        )} />

        <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
          <Input label="Teléfono" value={value} onChangeText={onChange} placeholder="Teléfono" editable={editing} />
        )} />

        {role === 'USER_ROLE' ? (
          <Controller control={control} name="direccion" render={({ field: { onChange, value } }) => (
            <Input label="Dirección" value={value} onChangeText={onChange} placeholder="Dirección de entrega" editable={editing} />
          )} />
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
