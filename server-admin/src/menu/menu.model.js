'use strict';

import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre del platillo es obligatorio'],
            trim: true,
            maxlength: [100, 'El nombre no puede superar 100 caracteres'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, 'La descripción no puede superar 300 caracteres'],
            default: '',
        },
        price: {
            type: Number,
            required: [true, 'El precio es obligatorio'],
            min: [0, 'El precio no puede ser negativo'],
        },
        category: {
            type: String,
            required: [true, 'La categoría es obligatoria'],
            enum: {
                values: ['Comida', 'Bebida', 'Postre', 'Entrada', 'Otro'],
                message: 'Categoría no válida',
            },
        },
        status: {
            type: String,
            enum: {
                values: ['Disponible', 'Agotado'],
                message: 'Estado no válido. Usa: Disponible | Agotado',
            },
            default: 'Disponible',
        },
        image: {
            type: String,
            default: null,
        },
        imagePublicId: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default mongoose.model('MenuItem', menuItemSchema);
