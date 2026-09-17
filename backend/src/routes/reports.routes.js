'use strict';

const { Router } = require('express');
const {
  getMonthlyReport,
  getMonthlyReportPDF,
} = require('../controllers/dashboard.controller');

const router = Router();

/**
 * GET /api/reports/monthly?month=YYYY-MM
 * Full monthly analytics: summary, payment split, top services, daily breakdown.
 */
router.get('/monthly', getMonthlyReport);

/**
 * GET /api/reports/monthly/pdf?month=YYYY-MM
 * Streams a downloadable A4 PDF of the monthly report.
 * NOTE: must come BEFORE /monthly or Express may match wrong route.
 */
router.get('/monthly/pdf', getMonthlyReportPDF);

module.exports = router;
