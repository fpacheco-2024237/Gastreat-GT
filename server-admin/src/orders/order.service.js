'use strict';

import Order from './order.model.js';
import Table from '../tables/table.model.js';
import MenuItem from '../menu/menu.model.js';
import { AppError } from '../../middlewares/handle-errors.js';

export const getAllOrders = async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.tableId) query.tableId = filters.tableId;
    return await Order.find(query).sort({ createdAt: -1 });
};

export const getPendingOrders = async () => {
    return await Order.find({
        status: { $in: ['Pendiente', 'Preparando'] },
    }).sort({ createdAt: 1 }); // Más antiguas primero (FIFO cocina)
};

export const getOrderById = async (id) => {
    const order = await Order.findById(id);
    if (!order) throw new AppError('Orden no encontrada', 404);
    return order;
};

export const createOrder = async (data, user) => {
    // Verificar que la mesa exista
    const table = await Table.findById(data.tableId);
    if (!table) throw new AppError('Mesa no encontrada', 404);

    // Verificar y construir los items con precio actual
    const itemsBuilt = [];
    for (const item of data.items) {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (!menuItem) throw new AppError(`Platillo con ID ${item.menuItemId} no encontrado`, 404);
        if (menuItem.status === 'Agotado') throw new AppError(`"${menuItem.name}" está agotado`, 400);

        const unitPrice = menuItem.price;
        const subtotal = unitPrice * item.quantity;

        itemsBuilt.push({
            menuItemId: menuItem._id,
            name: menuItem.name,
            quantity: item.quantity,
            unitPrice,
            subtotal,
            notes: item.notes || '',
        });
    }

    // Marcar la mesa como Ocupada
    await Table.findByIdAndUpdate(data.tableId, { status: 'Ocupada' });

    const order = new Order({
        tableId: data.tableId,
        tableNumber: table.number,
        waiterId: user.id || user.sub,
        waiterName: user.name || user.email || '',
        items: itemsBuilt,
        notes: data.notes || '',
    });

    return await order.save();
};

export const updateOrderStatus = async (id, status) => {
    const order = await Order.findById(id);
    if (!order) throw new AppError('Orden no encontrada', 404);

    // Validar transición de estados
    const transitions = {
        Pendiente: ['Preparando', 'Cancelado'],
        Preparando: ['Preparado', 'Cancelado'],
        Preparado: ['Entregado'],
        Entregado: [],
        Cancelado: [],
    };

    if (!transitions[order.status].includes(status)) {
        throw new AppError(
            `No se puede cambiar de "${order.status}" a "${status}"`,
            400
        );
    }

    order.status = status;

    // Si se cancela la orden y la mesa quedó Ocupada, liberarla
    if (status === 'Cancelado') {
        const otherOrders = await Order.findOne({
            tableId: order.tableId,
            status: { $in: ['Pendiente', 'Preparando', 'Preparado'] },
            _id: { $ne: order._id },
        });
        if (!otherOrders) {
            await Table.findByIdAndUpdate(order.tableId, { status: 'Sucia' });
        }
    }

    return await order.save();
};

export const addItemsToOrder = async (id, newItems) => {
    const order = await Order.findById(id);
    if (!order) throw new AppError('Orden no encontrada', 404);
    if (['Entregado', 'Cancelado'].includes(order.status)) {
        throw new AppError('No se pueden agregar platillos a una orden cerrada', 400);
    }

    for (const item of newItems) {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (!menuItem) throw new AppError(`Platillo con ID ${item.menuItemId} no encontrado`, 404);
        if (menuItem.status === 'Agotado') throw new AppError(`"${menuItem.name}" está agotado`, 400);

        const unitPrice = menuItem.price;
        order.items.push({
            menuItemId: menuItem._id,
            name: menuItem.name,
            quantity: item.quantity,
            unitPrice,
            subtotal: unitPrice * item.quantity,
            notes: item.notes || '',
        });
    }

    return await order.save();
};

export const cancelOrder = async (id) => {
    return await updateOrderStatus(id, 'Cancelado');
};
