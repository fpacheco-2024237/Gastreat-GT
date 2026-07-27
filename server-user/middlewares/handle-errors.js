class AppError extends Error {
  constructor(message, statusCode = 500, code = 'CUSTOM_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

const sendValidationError = (res, err) => {
  const errors = Object.values(err.errors || {}).map((error) => ({ field: error.path, message: error.message }));
  return res.status(400).json({ success: false, message: 'Error de validación', errors });
};

export const errorHandler = (err, req, res, next) => {
  console.error(`Error in User Server: ${err.message}`);

  if (err.name === 'ValidationError') return sendValidationError(res, err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({ success: false, message: `${field} ya existe`, error: 'DUPLICATE_FIELD' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Formato de ID inválido', error: 'INVALID_ID' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token inválido', error: 'INVALID_TOKEN' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expirado', error: 'TOKEN_EXPIRED' });
  }

  if (err instanceof AppError || err.statusCode) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message, error: err.code || 'CUSTOM_ERROR' });
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message, stack: err.stack }),
  });
};

export { AppError };