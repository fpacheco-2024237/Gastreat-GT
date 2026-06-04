'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './cors.configuration.js';
import { helmetOptions } from './helmet.configuration.js';
import { dbConnection } from './db.configuration.js';
import { requestLimit } from './rateLimit.configuration.js';
import { AppError } from '../middlewares/handle-errors.js';
import menuRoutes from '../src/menu/menu.routes.js';
import tableRoutes from '../src/tables/table.routes.js';
import orderRoutes from '../src/orders/order.routes.js';
import billingRoutes from '../src/billing/billing.routes.js';

const BASE_PATH = '/gastreatGT/Admin/v1';

const routes = (app) => {
    app.use(`${BASE_PATH}/menu`, menuRoutes);
    app.use(`${BASE_PATH}/tables`, tableRoutes);
    app.use(`${BASE_PATH}/orders`, orderRoutes);
    app.use(`${BASE_PATH}/billing`, billingRoutes);

    app.get(`${BASE_PATH}/health`, (req, res) => {
        res.status(200).json({
            status: 'Healthy',
            timeStamp: new Date().toISOString(),
            service: 'Gastreat GT Admin Server'
        });
    });

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    });
};

const middlewares = (app) => {
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetOptions));
    app.use(morgan('dev'));
    app.use(requestLimit);
};

export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT;
    app.set('trust proxy', 1);

    try {
        middlewares(app);
        await dbConnection();
        routes(app);
        app.use(AppError);
        app.listen(PORT, () => {
            console.log(`Server Gastreat GT Admin running on port: ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
        });
    } catch (err) {
        console.error(`Gastreat GT - Error al iniciar el servidor: ${err.message}`);
        process.exit(1);
    }
};
