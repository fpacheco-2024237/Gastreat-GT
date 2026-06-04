import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { ProtecterRoute } from './ProtecterRoute.jsx';
import { DashboardPage } from '../layouts/DashboardPage.jsx';
import { RoleGuard } from './RoleGuard.jsx';
import { Menu } from '../../features/menu/components/Menu.jsx';
import { Tables } from '../../features/tables/components/Tables.jsx';
import { Orders } from '../../features/orders/components/Orders.jsx';
import { Billing } from '../../features/billing/components/Billing.jsx';
import { Users } from '../../features/users/components/Users.jsx';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage.jsx';
export const AppRouter = () => {
  return (
    <Routes>
      <Route path='/' element={<AuthPage />} />
      <Route path='/verify-email' element={<VerifyEmailPage />} />
      <Route
        path='/dashboard/*'
        element={
          <ProtecterRoute>
            <RoleGuard allowedRoles={['ADMIN_ROLE']}>
              <DashboardPage />
            </RoleGuard>
          </ProtecterRoute>
        }
      >
        <Route index element={<Navigate to='menu' replace />} />
        <Route path='menu' element={<Menu />} />
        <Route path='tables' element={<Tables />} />
        <Route path='orders' element={<Orders />} />
        <Route path='billing' element={<Billing />} />
        <Route path='users' element={<Users />} />
      </Route>
    </Routes>
  );
};
