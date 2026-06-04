'use strict';

import * as menuService from './menu.service.js';

export const getAll = async (req, res, next) => {
    try {
        const { category, status } = req.query;
        const items = await menuService.getAllItems({ category, status });
        res.status(200).json({
            success: true,
            count: items.length,
            data: items,
        });
    } catch (err) {
        next(err);
    }
};

export const getOne = async (req, res, next) => {
    try {
        const item = await menuService.getItemById(req.params.id);
        res.status(200).json({ success: true, data: item });
    } catch (err) {
        next(err);
    }
};

export const create = async (req, res, next) => {
    try {
        const item = await menuService.createItem(req.body, req.file);
        res.status(201).json({
            success: true,
            message: 'Platillo creado exitosamente',
            data: item,
        });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const item = await menuService.updateItem(req.params.id, req.body, req.file);
        res.status(200).json({
            success: true,
            message: 'Platillo actualizado exitosamente',
            data: item,
        });
    } catch (err) {
        next(err);
    }
};

export const updateStatus = async (req, res, next) => {
    try {
        const item = await menuService.changeStatus(req.params.id, req.body.status);
        res.status(200).json({
            success: true,
            message: `Estado cambiado a "${item.status}"`,
            data: item,
        });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        await menuService.deleteItem(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Platillo eliminado exitosamente',
        });
    } catch (err) {
        next(err);
    }
};
