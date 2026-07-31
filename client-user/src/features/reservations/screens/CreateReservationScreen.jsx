import React, { useEffect, useState } from 'react';
import { View, Text, Alert, FlatList, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Input from '../../../shared/components/common/Input.jsx';
import Button from '../../../shared/components/common/Button.jsx';
import { Card, LoadingSpinner } from '../../../shared/components/common/Common.jsx';
import useReservations from '../hooks/useReservations.js';
import apiClient from '../../../shared/api/apiClient.js';
import useRestaurantStore from '../../../shared/store/restaurantStore.js';
import { SPACING, COLORS } from '../../../shared/constants/theme.js';

export default function CreateReservationScreen({ navigation }) {
  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: { guestName: '', partySize: '1', date: '', time: '', notes: '', tableId: '' }
  });
  const { createReservation, loading } = useReservations();
  const { restaurantId } = useRestaurantStore();
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const partySize = Number(watch('partySize')) || 1;

  useEffect(() => {
    (async () => {
      try {
        if (!restaurantId) {
          setTablesError('Selecciona un restaurante antes de reservar.');
          return;
        }
        const resp = await apiClient.get('/tables', { params: { restaurantId } });
        const data = resp.data.data || resp.data || [];
        setTables(data);
      } catch (error) {
        setTables([]);
        setTablesError(error.response?.data?.message || 'No se pudieron cargar las mesas.');
      } finally {
        setTablesLoading(false);
      }
    })();
  }, [restaurantId]);

  const availableTables = tables.filter((table) =>
    (table.status || '').toUpperCase() === 'LIBRE' && Number(table.capacity) >= partySize
  );

  const onSubmit = async (values) => {
    if (!selectedTable) return Alert.alert('Error', 'Selecciona una mesa');
    const start = new Date(`${values.date}T${values.time}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    if (isNaN(start.getTime())) return Alert.alert('Error', 'Fecha u hora inválida');

    const payload = {
      tableId: selectedTable._id || selectedTable.id,
      guestName: values.guestName.trim(),
      partySize: Number(values.partySize),
      notes: values.notes.trim() || undefined,
      reservationDate: values.date,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };

    const res = await createReservation(payload);
    if (res.ok) {
      Alert.alert('Reserva', 'Reserva creada correctamente', [
        { text: 'OK', onPress: () => navigation.navigate('MyReservationsList') }
      ]);
    } else {
      Alert.alert('Error', res.error?.response?.data?.message || 'No se pudo crear la reserva');
    }
  };

  return (
    <View style={{ flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background }}>
      <Controller control={control} name="guestName" rules={{ required: true, minLength: 2 }}
        render={({ field: { onChange, value } }) => (
          <Input label="Nombre" value={value} onChangeText={onChange} placeholder="Tu nombre" />
        )}
      />

      <Controller control={control} name="date" rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <Input label="Fecha" value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" />
        )}
      />

      <Controller control={control} name="time" rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <Input label="Hora" value={value} onChangeText={onChange} placeholder="HH:MM (ej. 14:30)" />
        )}
      />

      <Controller control={control} name="partySize" rules={{ required: true, min: 1, max: 20 }}
        render={({ field: { onChange, value } }) => (
          <Input label="Personas (mínimo 1)" value={value} onChangeText={onChange} placeholder="1" keyboardType="numeric" />
        )}
      />

      <Controller control={control} name="notes"
        render={({ field: { onChange, value } }) => (
          <Input label="Notas (opcional)" value={value} onChangeText={onChange} placeholder="Alergias, ocasión especial..." />
        )}
      />

      <Text style={{ color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.sm }}>Mesa</Text>
      {tablesLoading ? (
        <LoadingSpinner />
      ) : tablesError ? (
        <Text style={{ color: COLORS.error }}>{tablesError}</Text>
      ) : (
        <FlatList
          data={availableTables}
          horizontal
          keyExtractor={(t) => t._id || t.id || String(Math.random())}
          renderItem={({ item }) => {
            const isSelected = (selectedTable?._id || selectedTable?.id) === (item._id || item.id);
            return (
              <TouchableOpacity
                onPress={() => { setSelectedTable(item); setValue('tableId', item._id || item.id); }}
                style={{
                  padding: SPACING.sm,
                  marginRight: SPACING.sm,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: isSelected ? COLORS.primary : '#ccc',
                  backgroundColor: isSelected ? COLORS.primary + '20' : 'transparent',
                  opacity: 1
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: 'bold' }}>Mesa {item.tableNumber}</Text>
                <Text style={{ color: COLORS.textLight }}>Cap. {item.capacity}</Text>
                <Text style={{ color: 'green' }}>Disponible</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={{ color: COLORS.textLight }}>No hay mesas disponibles para {partySize} persona(s).</Text>}
        />
      )}

      <Button title="Crear reserva" onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: SPACING.lg }} />
    </View>
  );
}
