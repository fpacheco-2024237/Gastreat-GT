import { useEffect, useState } from 'react';
import { useReservationStore } from '../store/reservationStore.js';
import { useUIStore } from '../../auth/store/uiStore.js';
import { Spinner } from '../../auth/components/Spinner.jsx';
import { showError } from '../../../shared/utils/toast.js';

const statusBadge = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRMADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-700',
  COMPLETADA: 'bg-blue-100 text-blue-700',
};

const statusLabels = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
};

export const Reservations = () => {
  const { reservations, loading, error, fetchReservations, confirmReservation, cancelReservation } = useReservationStore();
  const { openConfirm } = useUIStore();
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  const handleConfirm = (reservation) => {
    openConfirm({
      title: 'Confirmar reserva',
      message: `¿Confirmar la reserva de ${reservation.guestName} para ${reservation.partySize} personas?`,
      onConfirm: async () => confirmReservation(reservation._id),
    });
  };

  const handleCancel = (reservation) => {
    openConfirm({
      title: 'Cancelar reserva',
      message: `¿Cancelar la reserva de ${reservation.guestName}?`,
      onConfirm: async () => await cancelReservation(reservation._id, 'Cancelada desde administración'),
    });
  };

  const filteredReservations = reservations.filter(r => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className='p-4'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-main-blue'>Reservas de Mesas</h1>
          <p className='text-gray-500 text-sm'>Gestiona las reservas realizadas por los clientes.</p>
        </div>
      </div>

      <div className='flex gap-2 mb-6 flex-wrap'>
        {['ALL', 'PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === s ? 'bg-main-blue text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'Todas' : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className='space-y-4'>
          {filteredReservations.length === 0 ? (
            <div className='bg-white rounded-xl shadow-sm p-6 text-center text-gray-600'>
              No hay reservas {filter !== 'ALL' ? `con estado "${statusLabels[filter]}"` : ''}.
            </div>
          ) : (
            filteredReservations.map((reservation) => (
              <div key={reservation._id} className='bg-white rounded-xl shadow-sm border border-gray-200 p-5'>
                <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                  <div className='space-y-1'>
                    <h2 className='text-xl font-semibold text-main-blue'>{reservation.guestName}</h2>
                    <p className='text-sm text-gray-500'>
                      Mesa #{reservation.tableId?.tableNumber || reservation.tableId} • {reservation.partySize} personas
                    </p>
                    <p className='text-sm text-gray-500'>
                      Inicio: {formatDate(reservation.startTime)} — Fin: {formatDate(reservation.endTime)}
                    </p>
                    {reservation.notes && (
                      <p className='text-sm text-gray-400 italic'>Notas: {reservation.notes}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[reservation.status] || 'bg-gray-100 text-gray-700'}`}>
                    {statusLabels[reservation.status] || reservation.status}
                  </span>
                </div>

                <div className='mt-4 flex flex-wrap gap-3'>
                  {reservation.status === 'PENDIENTE' && (
                    <>
                      <button
                        className='px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm'
                        onClick={() => handleConfirm(reservation)}
                      >
                        Confirmar
                      </button>
                      <button
                        className='px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm'
                        onClick={() => handleCancel(reservation)}
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {reservation.status === 'CONFIRMADA' && (
                    <button
                      className='px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm'
                      onClick={() => handleCancel(reservation)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
