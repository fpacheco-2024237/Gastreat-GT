'use strict';

import { body, param } from 'express-validator';
import { validateJWT } from './validate-JWT.js';
import { requireRole, ROLES } from './validate-role.js';
import { checkValidators } from './check-validators.js';

/**
 * Permisos en Gastreat GT con 2 roles del Auth Service (.NET):
 *
 *   ADMIN_ROLE : CRUD completo — crea mesas, confirma/cancela reservas, cambia estados
 *   USER_ROLE  : Solo consulta y crea sus propias reservas
 */

/**
 * Estados válidos de una mesa
 *   LIBRE    : disponible para sentarse o reservar
 *   OCUPADA  : con clientes actualmente
 *   RESERVADA: tiene una reserva pendiente confirmada
 *   INACTIVA : fuera de servicio (mantenimiento, etc.)
 */
const TABLE_STATUSES = ['LIBRE', 'OCUPADA', 'RESERVADA', 'INACTIVA'];

/**
 * Zonas del restaurante
 */
const TABLE_ZONES = ['SALON_PRINCIPAL', 'TERRAZA', 'PRIVADO', 'BARRA'];

// ──────────────────────────────────────────────
//  MESAS (gestión física del salón)
// ──────────────────────────────────────────────

// GET /tables — Ambos roles pueden ver las mesas disponibles
export const validateGetTables = [
  validateJWT,
  requireRole(ROLES.ADMIN, ROLES.USER),
  checkValidators,
];

// GET /tables/:id — Ambos roles
export const validateGetTableById = [
  validateJWT,
  requireRole(ROLES.ADMIN, ROLES.USER),
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  checkValidators,
];

// POST /tables — Solo Admin crea mesas
export const validateCreateTable = [
  validateJWT,
  requireRole(ROLES.ADMIN),
  body('tableNumber')
    .notEmpty()
    .withMessage('El número de mesa es requerido')
    .isInt({ min: 1 })
    .withMessage('El número de mesa debe ser un entero positivo'),
  body('capacity')
    .notEmpty()
    .withMessage('La capacidad es requerida')
    .isInt({ min: 1, max: 20 })
    .withMessage('La capacidad debe estar entre 1 y 20 personas'),
  body('zone')
    .notEmpty()
    .withMessage('La zona es requerida')
    .isIn(TABLE_ZONES)
    .withMessage(`Zona no válida. Valores permitidos: ${TABLE_ZONES.join(', ')}`),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('La descripción no puede exceder 300 caracteres'),
  checkValidators,
];

// PUT /tables/:id — Solo Admin actualiza datos de una mesa
export const validateUpdateTable = [
  validateJWT,
  requireRole(ROLES.ADMIN),
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  body('tableNumber')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El número de mesa debe ser un entero positivo'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('La capacidad debe estar entre 1 y 20 personas'),
  body('zone')
    .optional()
    .isIn(TABLE_ZONES)
    .withMessage(`Zona no válida. Valores permitidos: ${TABLE_ZONES.join(', ')}`),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('La descripción no puede exceder 300 caracteres'),
  checkValidators,
];

// PATCH /tables/:id/status — Solo Admin cambia el estado físico de la mesa
export const validateTableStatusChange = [
  validateJWT,
  requireRole(ROLES.ADMIN),
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  body('status')
    .notEmpty()
    .withMessage('El estado es requerido')
    .isIn(TABLE_STATUSES)
    .withMessage(`Estado no válido. Valores permitidos: ${TABLE_STATUSES.join(', ')}`),
  checkValidators,
];

// DELETE /tables/:id — Solo Admin puede eliminar mesas
export const validateDeleteTable = [
  validateJWT,
  requireRole(ROLES.ADMIN),
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  checkValidators,
];

// ──────────────────────────────────────────────
//  RESERVAS
// ──────────────────────────────────────────────

// GET /reservations — Solo Admin ve todas las reservas
export const validateGetReservations = [
  validateJWT,
  requireRole(ROLES.ADMIN),
  checkValidators,
];

// GET /reservations/pending — Solo Admin ve reservas pendientes
export const validateGetPendingReservations = [
  validateJWT,
  requireRole(ROLES.ADMIN),
  checkValidators,
];

// GET /reservations/:id — Ambos roles (el controller verifica ownership para USER_ROLE)
export const validateGetReservationById = [
  validateJWT,
  requireRole(ROLES.ADMIN, ROLES.USER),
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  checkValidators,
];

// POST /reservations — Ambos roles pueden crear una reserva
export const validateCreateReservation = [
  validateJWT,
  requireRole(ROLES.ADMIN, ROLES.USER),
  body('tableId')
    .notEmpty()
    .withMessage('El ID de la mesa es requerido')
    .isMongoId()
    .withMessage('tableId debe ser un ObjectId válido de MongoDB'),
  body('guestName')
    .trim()
    .notEmpty()
    .withMessage('El nombre del cliente es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('guestPhone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Número de teléfono inválido'),
  body('partySize')
    .notEmpty()
    .withMessage('El número de personas es requerido')
    .isInt({ min: 1, max: 20 })
    .withMessage('El número de personas debe estar entre 1 y 20'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Las notas no pueden exceder 300 caracteres'),
  checkValidators,
];

// PUT /reservations/:id/confirm — Solo Admin confirma reservas
export const validateConfirmReservation = [
  validateJWT,
  requireRole(ROLES.ADMIN),
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  checkValidators,
];

// PUT /reservations/:id/cancel — Admin cancela cualquiera; USER_ROLE solo las suyas (controller verifica)
export const validateCancelReservation = [
  validateJWT,
  requireRole(ROLES.ADMIN, ROLES.USER),
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  body('cancelReason')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('El motivo de cancelación no puede exceder 300 caracteres'),
  checkValidators,
];
