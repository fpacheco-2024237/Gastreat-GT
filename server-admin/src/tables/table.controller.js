'use strict';

import * as tableService from './table.service.js';

export const getAll = async (req, res, next) => {
    try {
        const { status } = req.query;
        const tables = await tableService.getAllTables({ status });
        res.status(200).json({ success: true, count: tables.length, data: tables });
    } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try {
        const table = await tableService.getTableById(req.params.id);
        res.status(200).json({ success: true, data: table });
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try {
        const table = await tableService.createTable(req.body);
        res.status(201).json({ success: true, message: 'Mesa creada exitosamente', data: table });
    } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try {
        const table = await tableService.updateTable(req.params.id, req.body);
        res.status(200).json({ success: true, message: 'Mesa actualizada', data: table });
    } catch (err) { next(err); }
};

export const updateStatus = async (req, res, next) => {
    try {
        const table = await tableService.changeStatus(req.params.id, req.body.status);
        res.status(200).json({
            success: true,
            message: `Mesa ${table.number} ahora está "${table.status}"`,
            data: table,
        });
    } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try {
        await tableService.deleteTable(req.params.id);
        res.status(200).json({ success: true, message: 'Mesa eliminada exitosamente' });
    } catch (err) { next(err); }
};
