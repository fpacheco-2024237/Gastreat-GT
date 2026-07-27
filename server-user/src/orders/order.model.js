'use strict';

import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    waiterId: { type: String, required: true },
    items: { type: [orderItemSchema], validate: (v) => Array.isArray(v) && v.length > 0 },
    status: { type: String, enum: ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'], default: 'PENDIENTE' },
    notes: { type: String, trim: true, maxlength: 300 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Order', orderSchema);