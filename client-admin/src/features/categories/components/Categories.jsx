import { useEffect, useState } from 'react';
import { useCategoryStore } from '../store/categoryStore.js';
import { useUIStore } from '../../auth/store/uiStore.js';
import { Spinner } from '../../auth/components/Spinner.jsx';
import { showError } from '../../../shared/utils/toast.js';

const initialForm = {
  name: '',
  description: '',
};

export const Categories = () => {
  const { categories, loading, error, fetchCategories, createCategory, updateCategory, toggleCategoryStatus, deleteCategory } = useCategoryStore();
  const { openConfirm } = useUIStore();
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setOpenForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name) {
      showError('El nombre de la categoría es obligatorio.');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
    };

    if (isEditMode) {
      await updateCategory(editingId, payload);
    } else {
      await createCategory(payload);
    }

    setOpenForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleToggleStatus = (item) => {
    const nextStatus = item.active ? 'Inactivo' : 'Activo';
    openConfirm({
      title: 'Cambiar estado',
      message: `¿Cambiar el estado de ${item.name} a ${nextStatus}?`,
      onConfirm: async () => toggleCategoryStatus(item._id, !item.active),
    });
  };

  const handleDelete = (item) => {
    openConfirm({
      title: 'Eliminar categoría',
      message: `¿Eliminar ${item.name}? Esta acción no se puede deshacer.`,
      onConfirm: async () => deleteCategory(item._id),
    });
  };

  return (
    <div className='p-4'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-main-blue'>Categorías</h1>
          <p className='text-gray-500 text-sm'>Administra las categorías de tu menú.</p>
        </div>
        <button
          className='bg-main-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition'
          onClick={() => handleOpenForm()}
        >
          + Agregar Categoría
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3'>
          {categories.length === 0 ? (
            <div className='bg-white rounded-xl shadow-sm p-6 text-center text-gray-600'>
              No hay categorías registradas aún.
            </div>
          ) : (
            categories.map((item) => (
              <div key={item._id} className='bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200'>
                <div className='p-5'>
                  <div className='mb-3 flex items-center justify-between'>
                    <h2 className='text-xl font-semibold text-main-blue'>{item.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className='text-gray-600 text-sm mb-4'>{item.description || 'Sin descripción'}</p>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='flex gap-2 w-full'>
                      <button
                        className='flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm'
                        onClick={() => handleOpenForm(item)}
                      >
                        Editar
                      </button>
                      <button
                        className='flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm'
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
                    Cambiar a {item.active ? 'Inactivo' : 'Activo'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {openForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-lg bg-white rounded-3xl shadow-xl p-6'>
            <div className='flex items-center justify-between mb-5'>
              <h2 className='text-2xl font-semibold'>{isEditMode ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
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
              <label className='space-y-2'>
                <span className='text-sm font-medium text-gray-700'>Nombre</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                  placeholder='Ej. Postres'
                />
              </label>

              <label className='space-y-2'>
                <span className='text-sm font-medium text-gray-700'>Descripción</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                  rows='3'
                  placeholder='Descripción opcional'
                />
              </label>

              <div className='flex justify-end gap-3 mt-4'>
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
