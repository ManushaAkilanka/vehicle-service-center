'use strict';

const { Router } = require('express');
const upload     = require('../middleware/upload');
const { uploadVehiclePhoto } = require('../controllers/uploads.controller');

const router = Router();

/**
 * POST /api/uploads/vehicle-photo
 *
 * Accepts multipart/form-data with field name "photo".
 * Stores the image in uploads/vehicle-photos/ on the server filesystem.
 * Returns { path, url, filename, size } — save `path` as photo_path on the visit.
 *
 * Limits: 15 MB · JPEG / PNG / WebP / HEIC only.
 */
router.post(
  '/vehicle-photo',
  upload.single('photo'),
  uploadVehiclePhoto,
);

module.exports = router;
