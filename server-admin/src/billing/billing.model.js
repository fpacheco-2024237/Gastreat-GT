'use strict';

import mongoose from 'mongoose';

const billingItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        subtotal: { type: Number, required: true },
    },
    { _id: false }
);

const billingSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            unique: true,
        },
        tableNumber: {
            type: Number,
            required: true,
        },
        waiterName: {
            type: String,
            default: '',
        },
        items: [billingItemSchema],
        subtotal: { type: Number, required: true },
        taxRate: { type: Number, default: 0.12 },   // 12% IVA (ajustable)
        tax: { type: Number, required: true },
        tip: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true },
        paymentMethod: {
            type: String,
            enum: {
                values: ['Efectivo', 'Tarjeta'],
                message: 'Método de pago inválido. Usa: Efectivo | Tarjeta',
            },
            default: null,
        },
        status: {
            type: String,
            enum: ['Pendiente', 'Pagado'],
            default: 'Pendiente',
        },
        paidAt: {
            type: Date,
            default: null,
        },
        cashierId: {
            type: String, // ID del cajero/admin del auth-service
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default mongoose.model('Billing', billingSchema);
