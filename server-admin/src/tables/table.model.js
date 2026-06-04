'use strict';

import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
    {
        number: {
            type: Number,
            required: [true, 'El número de mesa es obligatorio'],
            unique: true,
            min: [1, 'El número de mesa debe ser mayor a 0'],
        },
        capacity: {
            type: Number,
            required: [true, 'La capacidad es obligatoria'],
            min: [1, 'La capacidad mínima es 1'],
            max: [20, 'La capacidad máxima es 20'],
        },
        status: {
            type: String,
            enum: {
                values: ['Libre', 'Ocupada', 'Sucia'],
                message: 'Estado inválido. Usa: Libre | Ocupada | Sucia',
            },
            default: 'Libre',
        },
        location: {
            type: String,
            trim: true,
            default: 'Interior',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default mongoose.model('Table', tableSchema);
