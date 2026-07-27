'use strict';

import * as productService from './product.service.js';
import { cloudinary } from '../../middlewares/upload.middleware.js';

const isAdmin = (req) => req.user && req.user.role === 'ADMIN_ROLE';

export const getAll = async (req, res, next) => {
  try {
    const { restaurantId, categoryId, name, includeInactive } = req.query;
    const options = { includeInactive: false, isAdmin: false };
    if ((includeInactive === 'true' || includeInactive === true) && isAdmin(req)) {
      options.includeInactive = true;
      options.isAdmin = true;
    }
    const items = await productService.getAll({ restaurantId, categoryId, name }, options);
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await productService.getById(req.params.id);
    if (!item.active && !isAdmin(req)) {
      return res.status(404).json({ success: false, message: 'Platillo no encontrado' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    delete req.body.active;
    if (req.file) {
      req.body.imageUrl = req.file.path;
      req.body.imagePublicId = req.file.filename;
    }
    const item = await productService.create(req.body);
    res.status(201).json({ success: true, message: 'Platillo creado', data: item });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    delete req.body.active;
    delete req.body.restaurantId;

    const current = await productService.getById(req.params.id);

    if (req.file) {
      req.body.imageUrl = req.file.path;
      req.body.imagePublicId = req.file.filename;
      // Borra la imagen anterior en Cloudinary si existía
      if (current.imagePublicId) {
        cloudinary.uploader.destroy(current.imagePublicId).catch((e) =>
          console.error(`No se pudo borrar imagen anterior: ${e.message}`)
        );
      }
    }

    const item = await productService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Platillo actualizado', data: item });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const deleted = await productService.softDelete(req.params.id, req.user?.id);
    res.status(200).json({ success: true, message: 'Platillo dado de baja', data: deleted });
  } catch (err) {
    next(err);
  }
};

export const reactivate = async (req, res, next) => {
  try {
    const item = await productService.reactivate(req.params.id);
    res.status(200).json({ success: true, message: 'Platillo reactivado', data: item });
  } catch (err) {
    next(err);
  }
};