'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
import { requestLimit } from '../middlewares/request-limit.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { errorHandler } from '../middlewares/handle-errors.js';

import categoryRoutes from '../src/menu/category.routes.js';
import productRoutes from '../src/menu/product.routes.js';
import tableRoutes from '../src/tables/table.routes.js';
import orderRoutes from '../src/orders/order.routes.js';
import invoiceRoutes from '../src/billing/invoice.routes.js';
import restaurantRoutes from '../src/restaurants/restaurant.routes.js';

const BASE_PATH = '/gastreatGT/Admin/v1';

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(requestLimit);
    app.use(morgan('dev'));
};

const routes = (app) => {
    app.get('/', (req, res) => {
        res.status(200).json({
            status: 'Healthy',
            service: 'Gastreat GT Admin Server',
            healthCheck: `${BASE_PATH}/health`
        });
    });

    app.use(`${BASE_PATH}/categories`, categoryRoutes);
    app.use(`${BASE_PATH}/products`, productRoutes);
    app.use(`${BASE_PATH}`, tableRoutes); // includes tables and reservations
    app.use(`${BASE_PATH}/orders`, orderRoutes);
    app.use(`${BASE_PATH}/billing`, invoiceRoutes);
    app.use(`${BASE_PATH}/restaurants`, restaurantRoutes);

    app.get(`${BASE_PATH}/health`, (req, res) => {
        res.status(200).json({
            status: 'Healthy',
            timeStamp: new Date().toISOString(),
            service: 'Gastreat GT Admin Server'
        });
    });

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    });
};

export const app = express();
app.set('trust proxy', 1);
middlewares(app);
routes(app);
app.use(errorHandler);

export const initServer = async () => {
    const PORT = process.env.PORT;

    try {
        await dbConnection();

        app.listen(PORT, () => {
            console.log(`Server Gastreat GT Admin running on port: ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
        });
    } catch (err) {
        console.error(`Gastreat GT - Error al iniciar el servidor: ${err.message}`);
        process.exit(1);
    }
};
