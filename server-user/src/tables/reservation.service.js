'use strict';

import TableReservation from './tableReservation.model.js';
import Table from './table.model.js';
import { AppError } from '../../middlewares/handle-errors.js';

export const create = async (data, createdBy) => {
  const table = await Table.findById(data.tableId);
  if (!table) throw new AppError('Mesa no encontrada', 404);

  return await TableReservation.create({ ...data, createdBy });
};