'use strict';

import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token =
        req.header('x-token') ||
        req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No se proporcionó un token',
            error: 'MISSING_TOKEN',
        });
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({
                success: false,
                message: 'Configuración del servidor inválida: falta JWT_SECRET',
            });
        }

        const verifyOptions = {};
        if (process.env.JWT_ISSUER)  verifyOptions.issuer   = process.env.JWT_ISSUER;
        if (process.env.JWT_AUDIENCE) verifyOptions.audience = process.env.JWT_AUDIENCE;

        const decoded = jwt.verify(token, secret, verifyOptions);

        req.user = {
            id:   decoded.sub,
            jti:  decoded.jti,
            iat:  decoded.iat,
            role: decoded.role || 'USER_ROLE',
            name: decoded.name || '',
            email: decoded.email || '',
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'El token ha expirado',
                error: 'TOKEN_EXPIRED',
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Token inválido',
            error: 'INVALID_TOKEN',
        });
    }
};

export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado',
            error: 'UNAUTHORIZED',
        });
    }

    if (req.user.role !== 'ADMIN_ROLE') {
        return res.status(403).json({
            success: false,
            message: 'Se requiere rol de administrador',
            error: 'FORBIDDEN',
            yourRole: req.user.role,
        });
    }

    next();
};

// isStaff: permite tanto ADMIN_ROLE como USER_ROLE
export const isStaff = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado',
            error: 'UNAUTHORIZED',
        });
    }

    const allowedRoles = ['ADMIN_ROLE', 'USER_ROLE'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'No tienes permisos para realizar esta acción',
            error: 'FORBIDDEN',
            yourRole: req.user.role,
        });
    }

    next();
};
