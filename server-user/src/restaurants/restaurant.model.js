'use strict';

import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 150 },
    address: { type: String, required: true, trim: true },
    taxId: { type: String, trim: true },
    openTime: { type: String, trim: true, match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ },
    closeTime: { type: String, trim: true, match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ },
    active: { type: Boolean, default: true },
    administrators: { type: [String], default: [] },
    deletedAt: { type: Date },
    deletedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Restaurant', restaurantSchema);