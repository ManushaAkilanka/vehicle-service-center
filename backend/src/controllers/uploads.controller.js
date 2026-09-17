'use strict';

const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/uploads/vehicle-photo
//
// Accepts a multipart/form-data POST with field name "photo".
// Multer (configured in upload middleware) saves the file to
// uploads/vehicle-photos/ and provides req.file.
//
// Returns:
//   { status: 'ok', data: { path, url, filename, size } }
//
// The `path` value (e.g. "uploads/vehicle-photos/vp_123.jpg") is stored
// as photo_path on the service_visits row.
// The `url`  value is the full static URL for browser display.
// ─────────────────────────────────────────────────────────────────────────────
async function uploadVehiclePhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status:  'error',
        message: 'No file received. Send the image as form-data field "photo".',
      });
    }

    // Relative path stored in DB — portable across OS
    const relativePath = `uploads/vehicle-photos/${req.file.filename}`;

    // Full static URL for immediate browser display
    const baseUrl  = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const imageUrl = `${baseUrl}/${relativePath}`;

    res.status(201).json({
      status: 'ok',
      data: {
        path:     relativePath,
        url:      imageUrl,
        filename: req.file.filename,
        size:     req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadVehiclePhoto };
