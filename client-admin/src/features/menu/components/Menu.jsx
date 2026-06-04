import { useEffect, useMemo, useState } from 'react';
import { useMenuStore } from '../store/menuStore.js';
import { useUIStore } from '../../auth/store/uiStore.js';
import { Spinner } from '../../auth/components/Spinner.jsx';
import { showError } from '../../../shared/utils/toast.js';

const initialForm = {
  name: '',
  description: '',
  category: 'Comida',
  price: '',
  status: 'Disponible',
};

export const Menu = () => {
  const { menuItems, loading, error, fetchMenuItems, createMenuItem, updateMenuItem, toggleMenuItemStatus, deleteMenuItem } = useMenuStore();
  const { openConfirm } = useUIStore();
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  const isEditMode = Boolean(editingId);

  const handleOpenForm = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setForm({
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'Comida',
        price: item.price ?? '',
        status: item.status || 'Disponible',
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setOpenForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.category || form.price === '') {
      showError('Nombre, categoría y precio son obligatorios.');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      status: form.status,
    };

    if (isEditMode) {
      await updateMenuItem(editingId, payload);
    } else {
      await createMenuItem(payload);
    }

    setOpenForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleToggleStatus = (item) => {
    const nextStatus = item.status === 'Disponible' ? 'Agotado' : 'Disponible';
    openConfirm({
      title: 'Cambiar estado',
      message: `¿Cambiar el estado de ${item.name} a ${nextStatus}?`,
      onConfirm: async () => toggleMenuItemStatus(item._id, nextStatus),
    });
  };

  const handleDelete = (item) => {
    openConfirm({
      title: 'Eliminar platillo',
      message: `¿Eliminar ${item.name}? Esta acción no se puede deshacer.`,
      onConfirm: async () => deleteMenuItem(item._id),
    });
  };

  const categoryOptions = useMemo(
    () => ['Comida', 'Bebida', 'Postre', 'Entrada', 'Otro'],
    []
  );

  return (
    <div className='p-4'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-main-blue'>Menú e Inventario</h1>
          <p className='text-gray-500 text-sm'>Administra los platillos y bebidas de Gastreat GT.</p>
        </div>
        <button
          className='bg-main-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition'
          onClick={() => handleOpenForm()}
        >
          + Agregar Platillo
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3'>
          {menuItems.length === 0 ? (
            <div className='bg-white rounded-xl shadow-sm p-6 text-center text-gray-600'>
              No hay platillos registrados aún.
            </div>
          ) : (
            menuItems.map((item) => (
              <div key={item._id} className='bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200'>
                <div className='p-5'>
                  <div className='mb-3 flex items-center justify-between'>
                    <h2 className='text-xl font-semibold text-main-blue'>{item.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'Disponible' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className='text-sm text-gray-500 mb-3'>{item.category}</p>
                  <p className='text-gray-600 text-sm mb-4'>{item.description || 'Sin descripción'}</p>
                  <div className='flex items-center justify-between gap-4'>
                    <span className='text-lg font-semibold'>Q{item.price}</span>
                    <div className='flex gap-2'>
                      <button
                        className='px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm'
                        onClick={() => handleOpenForm(item)}
                      >
                        Editar
                      </button>
                      <button
                        className='px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm'
                        onClick={() => handleDelete(item)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <button
                    className='mt-4 w-full py-2 rounded-lg bg-main-blue text-white hover:opacity-90 transition text-sm'
                    onClick={() => handleToggleStatus(item)}
                  >
                    Cambiar a {item.status === 'Disponible' ? 'Agotado' : 'Disponible'}
                  </button>
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
              <h2 className='text-2xl font-semibold'>{isEditMode ? 'Editar Platillo' : 'Nuevo Platillo'}</h2>
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
                  <span className='text-sm font-medium text-gray-700'>Nombre</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                    placeholder='Ej. Hamburguesa clásica'
                  />
                </label>
                <label className='space-y-2'>
                  <span className='text-sm font-medium text-gray-700'>Precio</span>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                    placeholder='Ej. 45.50'
                  />
                </label>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <label className='space-y-2'>
                  <span className='text-sm font-medium text-gray-700'>Categoría</span>
                  <select
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
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
                    <option value='Disponible'>Disponible</option>
                    <option value='Agotado'>Agotado</option>
                  </select>
                </label>
              </div>

              <label className='space-y-2'>
                <span className='text-sm font-medium text-gray-700'>Descripción</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                  rows='4'
                  placeholder='Descripción corta del platillo'
                />
              </label>

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
