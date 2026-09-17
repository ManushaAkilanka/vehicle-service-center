'use strict';

const { Router } = require('express');
const {
  getSummary,
  getMonthlyReport,
  getMonthlyReportPDF,
} = require('../controllers/dashboard.controller');

const router = Router();

/**
 * GET /api/dashboard/summary
 * Returns today's visits/revenue, pending count, and this month's revenue.
 */
router.get('/summary', getSummary);

module.exports = router;
