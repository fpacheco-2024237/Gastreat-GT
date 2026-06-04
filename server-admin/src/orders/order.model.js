'use strict';

import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
    {
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
        subtotal: { type: Number, required: true },
        notes: { type: String, default: '', trim: true },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        tableId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Table',
            required: [true, 'La mesa es obligatoria'],
        },
        tableNumber: {
            type: Number,
            required: true,
        },
        waiterId: {
            type: String, // ID del usuario del auth-service (.NET)
            required: [true, 'El mesero es obligatorio'],
        },
        waiterName: {
            type: String,
            default: '',
        },
        items: {
            type: [orderItemSchema],
            validate: {
                validator: (v) => v.length > 0,
                message: 'La orden debe tener al menos un platillo',
            },
        },
        status: {
            type: String,
            enum: {
                values: ['Pendiente', 'Preparando', 'Preparado', 'Entregado', 'Cancelado'],
                message: 'Estado inválido',
            },
            default: 'Pendiente',
        },
        total: {
            type: Number,
            default: 0,
        },
        notes: {
            type: String,
            default: '',
            trim: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Calcular total automáticamente antes de guardar
orderSchema.pre('save', function (next) {
    this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    next();
});

export default mongoose.model('Order', orderSchema);
