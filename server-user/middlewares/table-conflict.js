'use strict';

import TableReservation from '../src/tables/tableReservation.model.js';

/**
 * Middleware para detectar conflictos de horario en reservas de mesas.
 *
 * Uso dual:
 *  - Creación  : requiere tableId, startTime, endTime en req.body
 *  - Confirmación : si viene :id, carga la reserva existente y verifica conflictos
 *
 * Si no hay conflictos, continúa al controller.
 * Si los hay, responde 409 con el detalle de cada conflicto.
 */
export const checkTableReservationConflict = async (req, res, next) => {
  try {
    let tableId;
    let start;
    let end;
    let existingReservation;

    // ── Caso confirmación: viene un :id en la URL ──
    if (req.params.id) {
      existingReservation = await TableReservation.findById(req.params.id);

      if (!existingReservation) {
        return res.status(404).json({
          success: false,
          message: 'Reserva de mesa no encontrada',
        });
      }

      tableId = existingReservation.tableId;
      start   = existingReservation.startTime;
      end     = existingReservation.endTime;

      // Adjuntamos la reserva al request para que el controller no la busque de nuevo
      req.tableReservation = existingReservation;

    } else {
      // ── Caso creación: los datos vienen en el body ──
      // Si validateTableTimes ya corrió, usamos los Date normalizados
      const tableIdBody = req.body.tableId;
      start = req.startDateObj  || new Date(req.body.startTime);
      end   = req.endDateObj    || new Date(req.body.endTime);

      if (!tableIdBody || !start || !end) {
        return res.status(400).json({
          success: false,
          message: 'tableId, startTime y endTime son requeridos para verificar disponibilidad',
        });
      }

      tableId = tableIdBody;
    }

    // ── Buscar reservas que se superpongan en la misma mesa ──
    const conflicts = await TableReservation.findConflictingReservations(
      tableId,
      start,
      end,
      existingReservation?._id || null   // excluye la reserva actual al confirmar
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'La mesa ya tiene una reserva en ese horario',
        conflicts: conflicts.map((c) => ({
          id:        c._id,
          tableId:   c.tableId,
          startTime: c.startTime,
          endTime:   c.endTime,
          status:    c.status,
          guestName: c.guestName,
        })),
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};
