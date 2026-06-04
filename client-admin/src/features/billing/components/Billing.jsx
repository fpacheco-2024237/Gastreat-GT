import { useEffect, useState } from 'react';
import { useBillingStore } from '../store/billingStore.js';
import { useUIStore } from '../../auth/store/uiStore.js';
import { Spinner } from '../../auth/components/Spinner.jsx';
import { showError } from '../../../shared/utils/toast.js';

export const Billing = () => {
  const { bills, selectedBill, loading, error, fetchBills, loadBillByOrder, payBill } = useBillingStore();
  const { openConfirm } = useUIStore();
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [tip, setTip] = useState('0');

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  const handleLoadBill = async (orderId) => {
    await loadBillByOrder(orderId);
    setPaymentMethod('Efectivo');
    setTip('0');
  };

  const handlePay = (bill) => {
    openConfirm({
      title: 'Registrar pago',
      message: `¿Registrar pago de Q${bill.total.toFixed(2)} para la orden ${bill.orderId}?`,
      onConfirm: async () => {
        await payBill({
          orderId: bill.orderId,
          paymentMethod,
          tip: Number(tip),
        });
      },
    });
  };

  return (
    <div className='p-4'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-main-blue'>Facturación y Pagos</h1>
          <p className='text-gray-500 text-sm'>Administra facturas, pagos y cierre de cuentas.</p>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className='grid gap-6 xl:grid-cols-3'>
          <div className='space-y-4 xl:col-span-2'>
            {bills.length === 0 ? (
              <div className='bg-white rounded-xl shadow-sm p-6 text-center text-gray-600'>
                No hay facturas disponibles.
              </div>
            ) : (
              bills.map((bill) => (
                <div key={bill._id} className='bg-white rounded-xl border border-gray-200 p-5'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <h2 className='text-lg font-semibold text-main-blue'>Factura de orden {bill.orderId}</h2>
                      <p className='text-sm text-gray-500'>Mesa {bill.tableNumber}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${bill.status === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {bill.status}
                    </span>
                  </div>
                  <div className='mt-4 flex items-center justify-between'>
                    <div className='text-sm text-gray-500'>Total:</div>
                    <div className='text-xl font-semibold'>Q{bill.total?.toFixed(2) ?? '0.00'}</div>
                  </div>
                  <button
                    className='mt-4 w-full py-2 rounded-lg bg-main-blue text-white hover:opacity-90 transition text-sm'
                    onClick={() => handleLoadBill(bill.orderId)}
                  >
                    Ver detalle
                  </button>
                </div>
              ))
            )}
          </div>

          <div className='space-y-4'>
            <div className='bg-white rounded-xl border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-main-blue mb-4'>Detalle de Factura</h2>
              {!selectedBill ? (
                <p className='text-gray-500'>Selecciona una factura para ver el detalle.</p>
              ) : (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <p className='text-sm text-gray-500'>Orden</p>
                    <p className='font-semibold'>{selectedBill.orderId}</p>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-gray-500'>Mesa</p>
                    <p className='font-semibold'>{selectedBill.tableNumber}</p>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-gray-500'>Cajero</p>
                    <p className='font-semibold'>{selectedBill.cashierId || 'N/A'}</p>
                  </div>
                  <div className='rounded-lg bg-slate-50 p-4 space-y-2'>
                    {selectedBill.items?.map((item, index) => (
                      <div key={index} className='flex justify-between text-sm'>
                        <span>{item.name} x{item.quantity}</span>
                        <span>Q{item.subtotal?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className='space-y-2 text-sm text-gray-500'>
                    <div className='flex justify-between'>
                      <span>Subtotal</span>
                      <span>Q{selectedBill.subtotal?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>IVA</span>
                      <span>Q{selectedBill.tax?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Propina</span>
                      <span>Q{selectedBill.tip?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    <div className='flex justify-between font-semibold'>
                      <span>Total</span>
                      <span>Q{selectedBill.total?.toFixed(2) ?? '0.00'}</span>
                    </div>
                  </div>
                  {selectedBill.status !== 'Pagado' && (
                    <div className='space-y-4'>
                      <label className='block text-sm font-medium text-gray-700'>Método de pago</label>
                      <select
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                        className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='Efectivo'>Efectivo</option>
                        <option value='Tarjeta'>Tarjeta</option>
                      </select>
                      <label className='block text-sm font-medium text-gray-700'>Propina</label>
                      <input
                        type='number'
                        min='0'
                        step='0.01'
                        value={tip}
                        onChange={(event) => setTip(event.target.value)}
                        className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                      />
                      <button
                        className='w-full py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition'
                        onClick={() => handlePay(selectedBill)}
                      >
                        Registrar pago
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
