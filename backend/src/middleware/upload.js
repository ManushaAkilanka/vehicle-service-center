'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

// ── Directories ───────────────────────────────────────────────────────────────
const UPLOADS_ROOT   = path.join(__dirname, '../../uploads');
const VEHICLE_PHOTOS = path.join(UPLOADS_ROOT, 'vehicle-photos');

[UPLOADS_ROOT, VEHICLE_PHOTOS].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Disk storage ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, VEHICLE_PHOTOS);
  },
  filename(_req, file, cb) {
    // UUID + timestamp to guarantee uniqueness under concurrent uploads
    const uid  = crypto.randomBytes(8).toString('hex');
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `vp_${Date.now()}_${uid}${ext}`;
    cb(null, name);
  },
});

// ── File type guard ───────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, HEIC) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
});

module.exports = upload;
