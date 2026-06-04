'use strict';

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

cloudinary.config({
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    api_key:     process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE     = 10 * 1024 * 1024; // 10 MB

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        const ext      = extname(file.originalname);
        const baseName = file.originalname
            .replace(ext, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-+|-+$/g, '');

        const shortUuid = uuidv4().substring(0, 8);

        return {
            folder:           'gastreat_gt/menu',
            public_id:        `${baseName}-${shortUuid}`,
            allowedFormats:   ['jpg', 'jpeg', 'png', 'webp'],
            transformation:   [{ width: 800, height: 800, crop: 'limit' }],
            resource_type:    'image',
        };
    },
});

export const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Solo se permiten imágenes: ${ALLOWED_MIMETYPES.join(', ')}`));
        }
    },
    limits: { fileSize: MAX_FILE_SIZE },
});

export { cloudinary };
