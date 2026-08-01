import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from '../configs/db.js';
import '../src/users/user.model.js';
import '../src/auth/role.model.js';
import { requestLimit } from '../middlewares/request-limit.js';
import { corsOptions } from '../configs/cors-configuration.js';
import { helmetConfiguration } from '../configs/helmet-configuration.js';
import {
  errorHandler,
  notFound,
} from '../middlewares/server-genericError-handler.js';
import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/users/user.routes.js';

const BASE_PATH = '/api/v1';

const app = express();
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(cors(corsOptions));
app.use(helmet(helmetConfiguration));
app.use(requestLimit);
app.use(morgan('combined'));

let dbReady = false;

const ensureDb = async () => {
  if (!dbReady) {
    await dbConnection();
    const { seedRoles } = await import('../helpers/role-seed.js');
    await seedRoles();
    dbReady = true;
  }
};

app.use(async (_req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error('DB init error:', err.message);
    res.status(503).json({
      success: false,
      message: 'Service unavailable - database connection failed',
    });
  }
});

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/users`, userRoutes);

app.get(`${BASE_PATH}/health`, (_req, res) => {
  res.status(200).json({
    status: 'Healthy',
    timestamp: new Date().toISOString(),
    service: 'Gastreat GT Authentication Service',
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
