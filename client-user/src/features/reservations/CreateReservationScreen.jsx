// File: src/features/reservations/CreateReservationScreen.jsx
import React from 'react';
import { View, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Input from '../../shared/components/common/Input.jsx';
import Button from '../../shared/components/common/Button.jsx';
import useReservations from './useReservations.js';
import { SPACING, COLORS } from '../../shared/constants/theme.js';

export default function CreateReservationScreen({ navigation }) {
  const { control, handleSubmit } = useForm({ defaultValues: { date: '', time: '', people: '2' } });
  const { createReservation, loading, error } = useReservations();

  const onSubmit = async (values) => {
    const payload = { date: values.date, time: values.time, people: Number(values.people) };
    const res = await createReservation(payload);
    if (res.ok) {
      Alert.alert('Reserva', 'Reserva creada correctamente', [{ text: 'OK', onPress: () => navigation.navigate('MyReservationsList') }]);
    } else {
      Alert.alert('Error', error || 'No se pudo crear la reserva');
    }
  };

  return (
    <View style={{ flex:1, padding: SPACING.lg, backgroundColor: COLORS.background }}>
      <Controller control={control} name="date" render={({ field: { onChange, value } }) => (
        <Input label="Fecha" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" />
      )} />

      <Controller control={control} name="time" render={({ field: { onChange, value } }) => (
        <Input label="Hora" value={value} onChangeText={onChange} placeholder="HH:MM" />
      )} />

      <Controller control={control} name="people" render={({ field: { onChange, value } }) => (
        <Input label="Personas" value={value} onChangeText={onChange} placeholder="2" />
      )} />

      <Button title="Crear reserva" onPress={handleSubmit(onSubmit)} loading={loading} />
    </View>
  );
}
