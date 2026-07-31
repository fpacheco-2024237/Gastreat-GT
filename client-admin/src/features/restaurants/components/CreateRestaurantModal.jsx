import { useForm } from 'react-hook-form';
import { Spinner } from '../../auth/components/Spinner.jsx';

export const CreateRestaurantModal = ({ isOpen, onClose, onCreate, loading, error }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { name: '', address: '', openTime: '', closeTime: '', taxId: '' } });

  if (!isOpen) return null;

  const submit = async (values) => {
    const payload = {
      name: values.name.trim(),
      address: values.address.trim(),
    };
    if (values.openTime) payload.openTime = values.openTime;
    if (values.closeTime) payload.closeTime = values.closeTime;
    if (values.taxId) payload.taxId = values.taxId.trim();

    const ok = await onCreate(payload);
    if (ok) {
      reset();
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 px-3 sm:px-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden'>
        <div
          className='p-4 sm:p-5 text-white sticky top-0 z-10'
          style={{
            background: 'linear-gradient(90deg, var(--main-blue) 0%, #1956a3 100%)',
          }}
        >
          <h2 className='text-xl sm:text-2xl font-bold'>Nuevo Restaurante</h2>
          <p className='text-xs sm:text-sm opacity-80'>
            Completa la información para registrar un nuevo restaurante
          </p>
        </div>

        <form onSubmit={handleSubmit(submit)} className='p-4 sm:p-6 space-y-4 overflow-y-auto'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>Nombre *</label>
            <input
              {...register('name', { required: 'El nombre es obligatorio' })}
              type='text'
              className='w-full px-3 py-2 border rounded-lg'
              placeholder='Ej. La Casona'
            />
            {errors.name && <p className='text-red-600 text-xs'>{errors.name.message}</p>}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>Dirección *</label>
            <input
              {...register('address', { required: 'La dirección es obligatoria' })}
              type='text'
              className='w-full px-3 py-2 border rounded-lg'
              placeholder='Ej. 5a Avenida 10-20, Zona 1'
            />
            {errors.address && <p className='text-red-600 text-xs'>{errors.address.message}</p>}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1.5'>Hora apertura</label>
              <input
                {...register('openTime')}
                type='time'
                className='w-full px-3 py-2 border rounded-lg'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1.5'>Hora cierre</label>
              <input
                {...register('closeTime')}
                type='time'
                className='w-full px-3 py-2 border rounded-lg'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>NIT / Tax ID</label>
            <input
              {...register('taxId')}
              type='text'
              className='w-full px-3 py-2 border rounded-lg'
              placeholder='Opcional'
            />
          </div>

          {error && <p className='text-red-600 text-sm text-center'>{error}</p>}

          <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t'>
            <button
              type='button'
              onClick={() => { reset(); onClose(); }}
              className='w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={loading}
              className='w-full sm:w-auto px-5 py-2 rounded-lg text-white font-medium transition shadow disabled:opacity-60'
              style={{
                background: 'linear-gradient(90deg, var(--main-blue) 0%, #1956a3 100%)',
                border: 'none',
              }}
            >
              {loading ? <Spinner small /> : 'Crear restaurante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
