import { Navigate } from 'react-router-dom';
import { useRestaurantStore } from '../../features/restaurants/store/restaurantStore';

export const RestaurantGuard = ({ children }) => {
  const { restaurantId } = useRestaurantStore();

  if (!restaurantId) {
    return <Navigate to="/restaurants" replace />;
  }

  return children;
};
