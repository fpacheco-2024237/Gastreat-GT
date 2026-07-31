'use strict';

import mongoose from 'mongoose';

const ORDER_STATUSES = ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot del nombre al momento del pedido
    unitPrice: { type: Number, required: true, min: 0 }, // snapshot del precio
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null }, // null = para llevar
    waiterId: { type: String, required: true }, // req.user.id de quien tomó el pedido
    items: { type: [orderItemSchema], validate: (v) => Array.isArray(v) && v.length > 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'PENDIENTE' },
    notes: { type: String, trim: true, maxlength: 300 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

export { ORDER_STATUSES };
export default mongoose.model('Order', orderSchema);