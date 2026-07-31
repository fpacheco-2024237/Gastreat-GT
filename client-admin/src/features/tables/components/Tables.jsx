import { useEffect, useMemo, useState } from 'react';
import { useTableStore } from '../store/tableStore.js';
import { useUIStore } from '../../auth/store/uiStore.js';
import { Spinner } from '../../auth/components/Spinner.jsx';
import { showError } from '../../../shared/utils/toast.js';

const initialForm = {
  number: '',
  capacity: '',
  location: 'SALON_PRINCIPAL',
  status: 'LIBRE',
};

export const Tables = () => {
  const { tables, loading, error, fetchTables, createTable, updateTable, toggleTableStatus, deleteTable } = useTableStore();
  const { openConfirm } = useUIStore();
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  const isEditMode = Boolean(editingId);

  const handleOpenForm = (table = null) => {
    if (table) {
      setEditingId(table._id);
      setForm({
        number: table.tableNumber ?? '',
        capacity: table.capacity ?? '',
        location: table.zone || 'SALON_PRINCIPAL',
        status: table.status || 'LIBRE',
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setOpenForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.number || !form.capacity) {
      showError('Número y capacidad son obligatorios.');
      return;
    }

    const payload = {
      tableNumber: Number(form.number),
      capacity: Number(form.capacity),
      zone: form.location,
      status: form.status,
    };

    if (isEditMode) {
      await updateTable(editingId, payload);
    } else {
      await createTable(payload);
    }

    setOpenForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleToggleStatus = (table) => {
    const nextStatus = table.status === 'LIBRE' ? 'OCUPADA' : 'LIBRE';
    openConfirm({
      title: 'Cambiar estado',
      message: `¿Cambiar estado de la mesa ${table.tableNumber} a ${nextStatus}?`,
      onConfirm: async () => toggleTableStatus(table._id, nextStatus),
    });
  };

  const handleDelete = (table) => {
    openConfirm({
      title: 'Eliminar mesa',
      message: `¿Eliminar mesa ${table.tableNumber}?`,
      onConfirm: async () => deleteTable(table._id),
    });
  };

  const statusOptions = useMemo(() => ['LIBRE', 'OCUPADA', 'RESERVADA', 'INACTIVA'], []);
  const locationOptions = useMemo(() => ['SALON_PRINCIPAL', 'TERRAZA', 'PRIVADO', 'BARRA'], []);

  return (
    <div className='p-4'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-main-blue'>Mesas y Reservas</h1>
          <p className='text-gray-500 text-sm'>Administra el estado físico de las mesas del restaurante.</p>
        </div>
        <button
          className='bg-main-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition'
          onClick={() => handleOpenForm()}
        >
          + Agregar Mesa
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3'>
          {tables.length === 0 ? (
            <div className='bg-white rounded-xl shadow-sm p-6 text-center text-gray-600'>
              No hay mesas registradas aún.
            </div>
          ) : (
            tables.map((table) => (
              <div key={table._id} className='bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200'>
                <div className='p-5'>
                  <div className='mb-3 flex items-center justify-between'>
                    <h2 className='text-xl font-semibold text-main-blue'>Mesa {table.tableNumber}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${table.status === 'LIBRE' ? 'bg-green-100 text-green-700' : table.status === 'OCUPADA' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                      {table.status}
                    </span>
                  </div>
                  <p className='text-sm text-gray-500'>Capacidad: {table.capacity}</p>
                  <p className='text-sm text-gray-500'>Ubicación: {table.zone}</p>
                  <div className='mt-5 flex gap-2 flex-wrap'>
                    <button
                      className='flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm'
                      onClick={() => handleOpenForm(table)}
                    >
                      Editar
                    </button>
                    <button
                      className='flex-1 py-2 rounded-lg bg-main-blue text-white hover:opacity-90 transition text-sm'
                      onClick={() => handleToggleStatus(table)}
                    >
                      Alternar estado
                    </button>
                    <button
                      className='flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm'
                      onClick={() => handleDelete(table)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {openForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-2xl bg-white rounded-3xl shadow-xl p-6'>
            <div className='flex items-center justify-between mb-5'>
              <h2 className='text-2xl font-semibold'>{isEditMode ? 'Editar Mesa' : 'Nueva Mesa'}</h2>
              <button
                className='text-gray-500 hover:text-gray-700'
                onClick={() => {
                  setOpenForm(false);
                  setEditingId(null);
                  setForm(initialForm);
                }}
              >
                Cerrar
              </button>
            </div>
            <form className='grid gap-4' onSubmit={handleSubmit}>
              <div className='grid gap-4 md:grid-cols-2'>
                <label className='space-y-2'>
                  <span className='text-sm font-medium text-gray-700'>Número de Mesa</span>
                  <input
                    type='number'
                    min='1'
                    value={form.number}
                    onChange={(event) => setForm({ ...form, number: event.target.value })}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                  />
                </label>
                <label className='space-y-2'>
                  <span className='text-sm font-medium text-gray-700'>Capacidad</span>
                  <input
                    type='number'
                    min='1'
                    value={form.capacity}
                    onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                  />
                </label>
              </div>
              <div className='grid gap-4 md:grid-cols-2'>
                <label className='space-y-2'>
                  <span className='text-sm font-medium text-gray-700'>Ubicación</span>
                  <select
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                  >
                    {locationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </label>
                <label className='space-y-2'>
                  <span className='text-sm font-medium text-gray-700'>Estado</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className='flex justify-end gap-3'>
                <button
                  type='button'
                  className='px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition'
                  onClick={() => {
                    setOpenForm(false);
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                >
                  Cancelar
                </button>
                <button type='submit' className='px-4 py-2 rounded-lg bg-main-blue text-white hover:opacity-90 transition'>
                  {isEditMode ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
