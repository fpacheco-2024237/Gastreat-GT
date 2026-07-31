import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
  const location = useLocation();

  const items = [
    { label: 'Menú', to: '/dashboard/menu' },
    { label: 'Categorías', to: '/dashboard/categories' },
    { label: 'Mesas', to: '/dashboard/tables' },
    { label: 'Reservas', to: '/dashboard/reservations' },
    { label: 'Comandas', to: '/dashboard/orders' },
    { label: 'Facturación', to: '/dashboard/billing' },
    { label: 'Usuarios', to: '/dashboard/users' },
  ];

  return (
    <aside className='w-60 bg-white min-h-[calc(100vh-4rem)] p-4 shadow-sm'>
      <ul className='space-y-1'>
        {items.map((item) => {
          const active = location.pathname === item.to;

          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`block px-4 py-2 rounded-lg font-medium transition-colors sidebar-underline${active ? ' active text-main-blue' : ' text-gray-700 hover:bg-gray-100'}`}
                style={active ? { fontWeight: 700 } : {}}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};
