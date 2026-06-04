import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore.js';
import { Spinner } from '../../features/auth/components/Spinner.jsx';

export const ProtecterRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoadingAuth = useAuthStore((state) => state.isLoadingAuth);

  if (isLoadingAuth) return <Spinner />;
  if (!isAuthenticated) return <Navigate to='/' replace />;

  return children;
};
