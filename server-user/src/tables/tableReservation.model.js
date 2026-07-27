'use strict';

import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    guestName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    guestPhone: { type: String, trim: true },
    partySize: { type: Number, required: true, min: 1, max: 20 },
    reservationDate: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'], default: 'PENDIENTE' },
    notes: { type: String, trim: true, maxlength: 300 },
    cancelReason: { type: String, trim: true, maxlength: 300 },
    createdBy: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

reservationSchema.statics.findConflictingReservations = async function (tableId, startTime, endTime, excludeId = null) {
  const query = {
    tableId,
    status: { $ne: 'CANCELADA' },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return await this.find(query);
};

export default mongoose.model('TableReservation', reservationSchema);