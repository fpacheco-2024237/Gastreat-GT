'use strict';

import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'], default: null },
    status: { type: String, enum: ['PENDIENTE', 'PAGADA', 'ANULADA'], default: 'PENDIENTE' },
    issuedBy: { type: String, required: true }, // req.user.id
    voidReason: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Invoice', invoiceSchema);