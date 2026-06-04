import { useEffect, useMemo } from 'react';
import { useOrderStore } from '../store/orderStore.js';
import { useUIStore } from '../../auth/store/uiStore.js';
import { Spinner } from '../../auth/components/Spinner.jsx';
import { showError } from '../../../shared/utils/toast.js';

const nextStatus = {
  Pendiente: 'Preparando',
  Preparando: 'Preparado',
  Preparado: 'Entregado',
  Entregado: 'Entregado',
  Cancelado: 'Cancelado',
};

const statusBadge = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Preparando: 'bg-orange-100 text-orange-700',
  Preparado: 'bg-blue-100 text-blue-700',
  Entregado: 'bg-green-100 text-green-700',
  Cancelado: 'bg-red-100 text-red-700',
};

export const Orders = () => {
  const { orders, loading, error, fetchOrders, updateOrderStatus, cancelOrder } = useOrderStore();
  const { openConfirm } = useUIStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  const visibleOrders = useMemo(() => orders || [], [orders]);

  const handleAdvance = (order) => {
    const next = nextStatus[order.status] || 'Entregado';
    if (next === order.status) return;
    openConfirm({
      title: 'Cambiar estado de orden',
      message: `¿Marcar la orden ${order._id} como ${next}?`,
      onConfirm: async () => updateOrderStatus(order._id, next),
    });
  };

  const handleCancel = (order) => {
    openConfirm({
      title: 'Cancelar orden',
      message: `¿Cancelar la orden de mesa ${order.tableNumber}?`,
      onConfirm: async () => cancelOrder(order._id),
    });
  };

  return (
    <div className='p-4'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-main-blue'>Comandas (Pedidos)</h1>
          <p className='text-gray-500 text-sm'>Visualiza y actualiza el flujo de pedidos de cocina.</p>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className='space-y-6'>
          {visibleOrders.length === 0 ? (
            <div className='bg-white rounded-xl shadow-sm p-6 text-center text-gray-600'>
              No hay órdenes registradas aún.
            </div>
          ) : (
            visibleOrders.map((order) => (
              <div key={order._id} className='bg-white rounded-xl shadow-sm border border-gray-200 p-5'>
                <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                  <div>
                    <h2 className='text-xl font-semibold text-main-blue'>Orden #{order._id}</h2>
                    <p className='text-sm text-gray-500 mt-1'>Mesa {order.tableNumber} • {order.waiterName || order.waiterId}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status}
                  </span>
                </div>
                <div className='mt-4 grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <p className='text-sm text-gray-600'>Ítems:</p>
                    <ul className='space-y-2'>
                      {order.items?.map((item, index) => (
                        <li key={index} className='rounded-lg bg-slate-50 p-3'>
                          <div className='flex items-center justify-between gap-2'>
                            <span className='font-medium'>{item.name}</span>
                            <span className='text-sm text-gray-500'>x{item.quantity}</span>
                          </div>
                          <p className='text-sm text-gray-500'>Q{item.subtotal.toFixed(2)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-gray-600'>Total:</p>
                    <p className='text-2xl font-semibold text-main-blue'>Q{order.total?.toFixed(2) || '0.00'}</p>
                    <p className='text-sm text-gray-500'>Creada: {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className='mt-5 flex flex-wrap gap-3'>
                  <button
                    className='px-4 py-2 rounded-lg bg-main-blue text-white hover:opacity-90 transition text-sm'
                    disabled={order.status === 'Entregado' || order.status === 'Cancelado'}
                    onClick={() => handleAdvance(order)}
                  >
                    Avanzar a {nextStatus[order.status]}
                  </button>
                  <button
                    className='px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm'
                    disabled={order.status === 'Cancelado' || order.status === 'Entregado'}
                    onClick={() => handleCancel(order)}
                  >
                    Cancelar Orden
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
