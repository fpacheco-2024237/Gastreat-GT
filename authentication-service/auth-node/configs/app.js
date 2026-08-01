'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
// Ensure models are registered before DB sync
import '../src/users/user.model.js';
import '../src/auth/role.model.js';
import { requestLimit } from '../middlewares/request-limit.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import {
  errorHandler,
  notFound,
} from '../middlewares/server-genericError-handler.js';
import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/users/user.routes.js';

const BASE_PATH = '/api/v1';

const middlewares = (app) => {
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors(corsOptions));
  app.use(helmet(helmetConfiguration));
  app.use(requestLimit);
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
};

const routes = (app) => {
  app.get('/', (_req, res) => {
    res.status(200).json({
      status: 'Healthy',
      service: 'Gastreat GT Authentication Service',
      healthCheck: `${BASE_PATH}/health`,
    });
  });

  app.use(`${BASE_PATH}/auth`, authRoutes);
  app.use(`${BASE_PATH}/users`, userRoutes);

  app.get(`${BASE_PATH}/health`, (req, res) => {
    res.status(200).json({
      status: 'Healthy',
      timestamp: new Date().toISOString(),
      service: 'Gastreat GT Authentication Service',
    });
  });
};

// ── Shared app instance ─────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);

middlewares(app);
routes(app);
app.use(notFound);
app.use(errorHandler);

export { app };

// ── Local / standalone server ───────────────────────────────────────
let dbInitialized = false;

export const initServer = async () => {
  const PORT = process.env.PORT;

  try {
    if (!dbInitialized) {
      await dbConnection();
      const { seedRoles } = await import('../helpers/role-seed.js');
      await seedRoles();
      dbInitialized = true;
    }

    app.listen(PORT, () => {
      console.log(`Gastreat GT Auth Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
    });
  } catch (err) {
    console.error(`Error starting Auth Server: ${err.message}`);
    process.exit(1);
  }
};
