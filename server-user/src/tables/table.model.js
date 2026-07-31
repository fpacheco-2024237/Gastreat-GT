'use strict';

import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1, max: 20 },
    zone: { type: String, required: true, enum: ['SALON_PRINCIPAL', 'TERRAZA', 'PRIVADO', 'BARRA'] },
    description: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: ['LIBRE', 'OCUPADA', 'RESERVADA', 'INACTIVA'], default: 'LIBRE' },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  },
  { timestamps: true, versionKey: false }
);

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

export default mongoose.model('Table', tableSchema);