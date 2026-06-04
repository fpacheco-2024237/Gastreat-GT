'use strict';

import Billing from './billing.model.js';
import Order from '../orders/order.model.js';
import Table from '../tables/table.model.js';
import { AppError } from '../../middlewares/handle-errors.js';

const TAX_RATE = 0.12; // 12% IVA

/**
 * Genera o recupera la factura de una orden.
 * Si la orden ya tiene factura, la retorna; si no, la crea automáticamente.
 */
export const getOrCreateInvoice = async (orderId) => {
    // Buscar factura existente
    const existing = await Billing.findOne({ orderId });
    if (existing) return existing;

    // Buscar la orden
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Orden no encontrada', 404);
    if (order.status === 'Cancelado') throw new AppError('No se puede facturar una orden cancelada', 400);

    const subtotal = order.total;
    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const invoice = await Billing.create({
        orderId: order._id,
        tableNumber: order.tableNumber,
        waiterName: order.waiterName,
        items: order.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.subtotal,
        })),
        subtotal,
        taxRate: TAX_RATE,
        tax,
        tip: 0,
        total,
    });

    return invoice;
};

export const getAllInvoices = async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    return await Billing.find(query).sort({ createdAt: -1 });
};

export const getInvoiceByOrderId = async (orderId) => {
    return await getOrCreateInvoice(orderId);
};

export const payInvoice = async ({ orderId, paymentMethod, tip = 0, cashierId }) => {
    const invoice = await getOrCreateInvoice(orderId);

    if (invoice.status === 'Pagado') {
        throw new AppError('Esta orden ya fue pagada', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Orden no encontrada', 404);

    // Actualizar factura
    invoice.paymentMethod = paymentMethod;
    invoice.tip = tip;
    invoice.total = parseFloat((invoice.subtotal + invoice.tax + tip).toFixed(2));
    invoice.status = 'Pagado';
    invoice.paidAt = new Date();
    invoice.cashierId = cashierId;

    await invoice.save();

    // Marcar la orden como Entregado si aún no lo está
    if (!['Entregado', 'Cancelado'].includes(order.status)) {
        order.status = 'Entregado';
        await order.save();
    }

    // Liberar la mesa (marcarla como Sucia)
    await Table.findByIdAndUpdate(order.tableId, { status: 'Sucia' });

    return invoice;
};
