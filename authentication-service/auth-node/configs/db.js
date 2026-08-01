'use strict';

import { Sequelize } from 'sequelize';
import pg from 'pg'; // <-- ¡LÍNEA AÑADIDA PARA VERCEL!
import dotenv from 'dotenv';

dotenv.config();

// Configuración de PostgreSQL (igual que la API .NET)
const databaseConfig = {
  dialect: 'postgres',
  dialectModule: pg, // <-- ¡LÍNEA MÁGICA PARA VERCEL!
  logging: process.env.DB_SQL_LOGGING === 'true' ? console.log : false,
  define: {
    freezeTableName: true, // Usar nombres exactos sin pluralización
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true, // Usar snake_case para todos los campos
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

if (process.env.DB_SSL === 'true') {
  databaseConfig.dialectOptions = {
    ssl: { require: true, rejectUnauthorized: false },
  };
}

export const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, databaseConfig)
  : new Sequelize({
      ...databaseConfig,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    });

// Función para conectar a la base de datos
export const dbConnection = async () => {
  try {
    console.log('PostgreSQL | Trying to connect...');

    await sequelize.authenticate();
    console.log('PostgreSQL | Connected to PostgreSQL');
    console.log('PostgreSQL | Connection to database established');

    // Sincronizar modelos en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const syncLogging =
        process.env.DB_SQL_LOGGING === 'true' ? console.log : false;
      await sequelize.sync({ alter: true, logging: syncLogging });
      console.log('PostgreSQL | Models synchronized with database');
    }
  } catch (error) {
    console.error('PostgreSQL | Could not connect to PostgreSQL');
    console.error('PostgreSQL | Error:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(
    `PostgreSQL | Received ${signal}. Closing database connection...`
  );
  try {
    await sequelize.close();
    console.log('PostgreSQL | Database connection closed successfully');
    // En Vercel no es necesario hacer process.exit(), pero lo dejamos para desarrollo local
    if (process.env.NODE_ENV !== 'production') {
       process.exit(0);
    }
  } catch (error) {
    console.error(
      'PostgreSQL | Error during graceful shutdown:',
      error.message
    );
    if (process.env.NODE_ENV !== 'production') {
       process.exit(1);
    }
  }
};

// Handle different termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restarts