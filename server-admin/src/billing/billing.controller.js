'use strict';

import * as billingService from './billing.service.js';

export const getAll = async (req, res, next) => {
    try {
        const { status } = req.query;
        const invoices = await billingService.getAllInvoices({ status });
        res.status(200).json({ success: true, count: invoices.length, data: invoices });
    } catch (err) { next(err); }
};

export const getByOrderId = async (req, res, next) => {
    try {
        const invoice = await billingService.getInvoiceByOrderId(req.params.orderId);
        res.status(200).json({ success: true, data: invoice });
    } catch (err) { next(err); }
};

export const pay = async (req, res, next) => {
    try {
        const { orderId, paymentMethod, tip } = req.body;
        const cashierId = req.user?.id || req.user?.sub;

        const invoice = await billingService.payInvoice({
            orderId,
            paymentMethod,
            tip: tip || 0,
            cashierId,
        });

        res.status(200).json({
            success: true,
            message: 'Pago registrado exitosamente',
            data: {
                invoiceId: invoice._id,
                tableNumber: invoice.tableNumber,
                subtotal: invoice.subtotal,
                tax: invoice.tax,
                tip: invoice.tip,
                total: invoice.total,
                paymentMethod: invoice.paymentMethod,
                status: invoice.status,
                paidAt: invoice.paidAt,
            },
        });
    } catch (err) { next(err); }
};
