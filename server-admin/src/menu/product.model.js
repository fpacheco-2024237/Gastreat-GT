'use strict';

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del platillo es obligatorio'],
      trim: true,
      maxlength: 150,
    },
    description: { type: String, trim: true, maxlength: 500 },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    stock: {
      type: Number,
      required: [true, 'El stock es obligatorio'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0,
    },
    imageUrl: { type: String, trim: true, default: null },
    imagePublicId: { type: String, trim: true, default: null },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es obligatoria'],
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'El restaurante es obligatorio'],
    },
    active: { type: Boolean, default: true },
    deletedAt: { type: Date },
    deletedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Product', productSchema);