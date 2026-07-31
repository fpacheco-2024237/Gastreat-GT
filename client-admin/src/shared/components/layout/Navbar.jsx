import { Typography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import imgLogo from '../../../assets/img/gastreat_gt.png';
import { AvatarUser } from '../ui/AvatarUser.jsx';
import { useRestaurantStore } from '../../../features/restaurants/store/restaurantStore.js';

export const Navbar = () => {
  const { restaurantName, clearRestaurant } = useRestaurantStore();
  const navigate = useNavigate();

  const handleChangeRestaurant = () => {
    clearRestaurant();
    navigate('/restaurants');
  };

  return (
    <nav className='bg-white shadow-md sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2 pr-4 border-r border-gray-200'>
            <img
              src={imgLogo}
              alt='Gastreat GT Logo'
              className='h-8 md:h-10 w-auto object-contain'
            />
            <Typography variant='h5' className='font-bold text-main-blue hidden md:block'>
              Gastreat GT
            </Typography>
          </div>
          {restaurantName && (
            <div className='flex items-center gap-3'>
              <Typography variant='h6' className='text-gray-800 hidden sm:block'>
                {restaurantName}
              </Typography>
              <button 
                onClick={handleChangeRestaurant}
                className='text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition'
              >
                Cambiar
              </button>
            </div>
          )}
        </div>
        <AvatarUser />
      </div>
    </nav>
  );
};
