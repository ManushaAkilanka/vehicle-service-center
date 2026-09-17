'use strict';

const { Router } = require('express');
const {
  uploadPhoto,
  createVisit,
  getVisit,
  recordPayment,
  generateReceipt,
} = require('../controllers/visits.controller');
const upload = require('../middleware/upload');

const router = Router();

/** POST /api/visits/photo          — upload vehicle photo, returns stored path */
router.post('/photo',           upload.single('photo'), uploadPhoto);

/** POST /api/visits               — create a full visit (transactional) */
router.post('/',                createVisit);

/** PUT  /api/visits/:id/payment   — record payment, set status='paid', generate receipt_number */
router.put('/:id/payment',      recordPayment);

/** GET  /api/visits/:id/receipt   — stream A4 PDF receipt (pdfkit) */
router.get('/:id/receipt',      generateReceipt);

/** GET  /api/visits/:id           — full visit detail with items + employees */
router.get('/:id',              getVisit);

module.exports = router;

