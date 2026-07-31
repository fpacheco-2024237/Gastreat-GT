import { useEffect, useState } from 'react';
import { useBillingStore } from '../store/billingStore.js';
import { useUIStore } from '../../auth/store/uiStore.js';
import { Spinner } from '../../auth/components/Spinner.jsx';
import { showError } from '../../../shared/utils/toast.js';

const statusBadge = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  PAGADA: 'bg-green-100 text-green-700',
  ANULADA: 'bg-red-100 text-red-700',
};

export const Billing = () => {
  const { bills, selectedBill, loading, error, fetchBills, loadBillById, payBill, voidBill } = useBillingStore();
  const { openConfirm } = useUIStore();
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  const handlePay = (bill) => {
    openConfirm({
      title: 'Registrar pago',
      message: `¿Registrar pago de Q${bill.total.toFixed(2)} para la factura?`,
      onConfirm: async () => {
        await payBill(bill._id, paymentMethod);
      },
    });
  };

  const handleVoid = (bill) => {
    openConfirm({
      title: 'Anular factura',
      message: `¿Anular la factura de Q${bill.total.toFixed(2)}?`,
      onConfirm: async () => {
        await voidBill(bill._id, 'Anulada desde administración');
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
                      <h2 className='text-lg font-semibold text-main-blue'>Factura #{bill._id?.slice(-6)}</h2>
                      <p className='text-sm text-gray-500'>Orden: {typeof bill.orderId === 'object' ? bill.orderId?._id : bill.orderId}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[bill.status] || 'bg-gray-100 text-gray-700'}`}>
                      {bill.status}
                    </span>
                  </div>
                  <div className='mt-4 grid grid-cols-3 gap-4 text-sm'>
                    <div>
                      <p className='text-gray-500'>Subtotal</p>
                      <p className='font-semibold'>Q{bill.subtotal?.toFixed(2) ?? '0.00'}</p>
                    </div>
                    <div>
                      <p className='text-gray-500'>IVA (12%)</p>
                      <p className='font-semibold'>Q{bill.tax?.toFixed(2) ?? '0.00'}</p>
                    </div>
                    <div>
                      <p className='text-gray-500'>Total</p>
                      <p className='text-xl font-semibold text-main-blue'>Q{bill.total?.toFixed(2) ?? '0.00'}</p>
                    </div>
                  </div>
                  <div className='mt-4 flex gap-3'>
                    <button
                      className='px-4 py-2 rounded-lg bg-main-blue text-white hover:opacity-90 transition text-sm'
                      onClick={() => loadBillById(bill._id)}
                    >
                      Ver detalle
                    </button>
                  </div>
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
                    <p className='text-sm text-gray-500'>Factura</p>
                    <p className='font-semibold'>#{selectedBill._id?.slice(-6)}</p>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-gray-500'>Orden</p>
                    <p className='font-semibold'>{typeof selectedBill.orderId === 'object' ? selectedBill.orderId?._id : selectedBill.orderId}</p>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-gray-500'>Generada por</p>
                    <p className='font-semibold'>{selectedBill.issuedBy}</p>
                  </div>
                  <div className='rounded-lg bg-slate-50 p-4 space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>Subtotal</span>
                      <span>Q{selectedBill.subtotal?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>IVA (12%)</span>
                      <span>Q{selectedBill.tax?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    <div className='flex justify-between font-semibold text-main-blue'>
                      <span>Total</span>
                      <span>Q{selectedBill.total?.toFixed(2) ?? '0.00'}</span>
                    </div>
                  </div>

                  {selectedBill.status === 'PENDIENTE' && (
                    <div className='space-y-4 pt-4 border-t'>
                      <label className='block text-sm font-medium text-gray-700'>Método de pago</label>
                      <select
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                        className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='EFECTIVO'>Efectivo</option>
                        <option value='TARJETA'>Tarjeta</option>
                        <option value='TRANSFERENCIA'>Transferencia</option>
                      </select>
                      <button
                        className='w-full py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition'
                        onClick={() => handlePay(selectedBill)}
                      >
                        Registrar pago
                      </button>
                      <button
                        className='w-full py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition'
                        onClick={() => handleVoid(selectedBill)}
                      >
                        Anular factura
                      </button>
                    </div>
                  )}

                  {selectedBill.status === 'PAGADA' && (
                    <div className='pt-4 border-t'>
                      <p className='text-sm text-green-700 font-semibold'>Pagada con {selectedBill.paymentMethod}</p>
                    </div>
                  )}

                  {selectedBill.status === 'ANULADA' && (
                    <div className='pt-4 border-t'>
                      <p className='text-sm text-red-700 font-semibold'>Anulada</p>
                      {selectedBill.voidReason && <p className='text-sm text-gray-500'>Motivo: {selectedBill.voidReason}</p>}
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
