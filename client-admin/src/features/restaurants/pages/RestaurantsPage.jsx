import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantStore } from '../store/restaurantStore';
import { useAuthStore } from '../../auth/store/authStore';
import { CreateRestaurantModal } from '../components/CreateRestaurantModal';

export const RestaurantsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { restaurantId, restaurants, loading, fetchRestaurants, setRestaurant, createRestaurant } = useRestaurantStore();
  const { logout } = useAuthStore();

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    if (restaurantId) navigate('/dashboard/menu');
  }, [restaurantId, navigate]);

  const handleSelectRestaurant = (id, name) => {
    setRestaurant(id, name);
  };

  const handleCreate = async (payload) => {
    const res = await createRestaurant(payload);
    return res.ok;
  };

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      <header className='bg-white shadow-sm p-4 flex justify-between items-center'>
        <h1 className='text-xl font-bold text-gray-800'>Gastreat GT - Administrador</h1>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className='text-sm text-red-600 hover:text-red-800'
        >
          Cerrar Sesión
        </button>
      </header>

      <main className='flex-1 max-w-7xl w-full mx-auto p-8'>
        <div className='flex justify-between items-center mb-8'>
          <h2 className='text-2xl font-semibold text-gray-900'>Selecciona un Restaurante</h2>
          <button
            onClick={() => setShowModal(true)}
            className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition'
          >
            Crear Restaurante
          </button>
        </div>

        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className='text-center py-12 bg-white rounded-lg shadow-sm'>
            <p className='text-gray-500 mb-4'>No hay restaurantes registrados.</p>
            <button
              onClick={() => setShowModal(true)}
              className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition'
            >
              Crear tu primer restaurante
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {restaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer'
                onClick={() => handleSelectRestaurant(restaurant._id, restaurant.name)}
              >
                {restaurant.logo && (
                  <img src={restaurant.logo} alt={restaurant.name} className='w-full h-48 object-cover' />
                )}
                <div className='p-6'>
                  <h3 className='text-lg font-bold text-gray-900 mb-2'>{restaurant.name}</h3>
                  <p className='text-gray-600 text-sm line-clamp-2'>{restaurant.address || 'Sin dirección'}</p>
                </div>
                <div className='px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center'>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${restaurant.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {restaurant.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className='text-blue-600 text-sm font-medium hover:text-blue-800'>Ingresar &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateRestaurantModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
        loading={loading}
      />
    </div>
  );
};
