'use strict';

/**
 * Middleware para validar reservationDate, startTime y endTime de una mesa.
 * - reservationDate : fecha del día de la reserva (ISO 8601)
 * - startTime       : hora de inicio de la reserva (ISO 8601)
 * - endTime         : hora de finalización de la reserva (ISO 8601)
 *
 * Reglas de negocio para Gastreat GT:
 *   - El restaurante opera de 07:00 a 23:00
 *   - La reserva mínima es de 30 minutos
 *   - La reserva máxima es de 4 horas
 *   - No se permiten reservas con fecha pasada
 */

const OPENING_HOUR = 7;   // 07:00
const CLOSING_HOUR = 23;  // 23:00
const MIN_DURATION_MS = 30 * 60 * 1000;        // 30 minutos
const MAX_DURATION_MS = 4 * 60 * 60 * 1000;    // 4 horas

export const validateTableTimes = (req, res, next) => {
  const { reservationDate, startTime, endTime } = req.body;

  // --- Campos requeridos ---
  if (!reservationDate || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'reservationDate, startTime y endTime son requeridos',
    });
  }

  const date  = new Date(reservationDate);
  const start = new Date(startTime);
  const end   = new Date(endTime);

  // --- Formato válido ---
  if (isNaN(date.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Formato de fecha inválido, usar ISO 8601',
    });
  }

  // --- No permitir fechas pasadas ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return res.status(400).json({
      success: false,
      message: 'No se pueden crear reservas en fechas pasadas',
    });
  }

  // --- endTime debe ser posterior a startTime ---
  if (end <= start) {
    return res.status(400).json({
      success: false,
      message: 'endTime debe ser posterior a startTime',
    });
  }

  // --- Duración mínima de 30 minutos ---
  const durationMs = end - start;
  if (durationMs < MIN_DURATION_MS) {
    return res.status(400).json({
      success: false,
      message: 'La reserva debe tener una duración mínima de 30 minutos',
    });
  }

  // --- Duración máxima de 4 horas ---
  if (durationMs > MAX_DURATION_MS) {
    return res.status(400).json({
      success: false,
      message: 'La reserva no puede exceder 4 horas de duración',
    });
  }

  // --- Horario de atención del restaurante (07:00 - 23:00) ---
  const startHour = start.getHours();
  const endHour   = end.getHours() + (end.getMinutes() > 0 ? 1 : 0);

  if (startHour < OPENING_HOUR || endHour > CLOSING_HOUR) {
    return res.status(400).json({
      success: false,
      message: `La reserva debe estar dentro del horario de atención: ${OPENING_HOUR}:00 - ${CLOSING_HOUR}:00`,
    });
  }

  // Adjuntamos objetos Date normalizados para evitar múltiples parseos en el controller
  req.reservationDateObj = date;
  req.startDateObj       = start;
  req.endDateObj         = end;
  next();
};
