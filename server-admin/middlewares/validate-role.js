'use strict';

/**
 * Roles provenientes del Auth Service (.NET)
 *   ADMIN_ROLE : Acceso total al sistema Gastreat GT
 *   USER_ROLE  : Acceso limitado a operaciones de consulta y propias
 */
export const ROLES = {
  ADMIN: 'ADMIN_ROLE',
  USER:  'USER_ROLE',
};

/**
 * Middleware para validar que el usuario tenga uno o más roles permitidos.
 * Debe ejecutarse siempre después de validateJWT.
 *
 * Uso:
 *   requireRole('ADMIN_ROLE')
 *   requireRole('ADMIN_ROLE', 'USER_ROLE')
 *   requireRole(ROLES.ADMIN, ROLES.USER)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'UNAUTHORIZED',
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        error: 'FORBIDDEN',
        requiredRoles: allowedRoles,
        yourRole: userRole,
      });
    }

    next();
  };
};
