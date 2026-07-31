'use strict';

import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede superar 100 caracteres'],
    },
    description: { type: String, trim: true, maxlength: 300 },
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

categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);