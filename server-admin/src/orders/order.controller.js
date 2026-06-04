'use strict';

import * as orderService from './order.service.js';

export const getAll = async (req, res, next) => {
    try {
        const { status, tableId } = req.query;
        const orders = await orderService.getAllOrders({ status, tableId });
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) { next(err); }
};

export const getPending = async (req, res, next) => {
    try {
        const orders = await orderService.getPendingOrders();
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try {
        const order = await orderService.getOrderById(req.params.id);
        res.status(200).json({ success: true, data: order });
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try {
        const order = await orderService.createOrder(req.body, req.user);
        res.status(201).json({ success: true, message: 'Orden creada exitosamente', data: order });
    } catch (err) { next(err); }
};

export const updateStatus = async (req, res, next) => {
    try {
        const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
        res.status(200).json({
            success: true,
            message: `Orden actualizada a "${order.status}"`,
            data: order,
        });
    } catch (err) { next(err); }
};

export const addItems = async (req, res, next) => {
    try {
        const order = await orderService.addItemsToOrder(req.params.id, req.body.items);
        res.status(200).json({ success: true, message: 'Platillos agregados a la orden', data: order });
    } catch (err) { next(err); }
};

export const cancel = async (req, res, next) => {
    try {
        const order = await orderService.cancelOrder(req.params.id);
        res.status(200).json({ success: true, message: 'Orden cancelada', data: order });
    } catch (err) { next(err); }
};
