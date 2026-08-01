import dotenv from 'dotenv';
import { app } from '../configs/app.js';
import { dbConnection } from '../configs/db.js';

dotenv.config();

let databaseReady = false;

export default async function handler(req, res) {
  try {
    if (!databaseReady) {
      await dbConnection();
      databaseReady = true;
    }

    return app(req, res);
  } catch (error) {
    console.error('Error al inicializar Server Admin:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Servicio no disponible: no se pudo conectar a la base de datos',
    });
  }
}
