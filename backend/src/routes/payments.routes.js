'use strict';

const { Router } = require('express');
const {
  checkConnectivity,
  initPayhere,
  payhereNotify,
  getVisitByOrder,
} = require('../controllers/payments.controller');

const router = Router();

/**
 * GET  /api/payments/connectivity
 * Checks whether PayHere servers are reachable (internet access).
 * Frontend calls this on mount to decide whether to enable Online payment.
 */
router.get('/connectivity', checkConnectivity);

/**
 * GET  /api/payments/by-order/:orderId
 * Fetches visit by receipt_number (used as PayHere order_id)
 */
router.get('/by-order/:orderId', getVisitByOrder);

/**
 * POST /api/payments/payhere/init
 * Body: { visit_id }
 * Returns the JS SDK payload (with hash) for the frontend to call payhere.startPayment().
 */
router.post('/payhere/init', initPayhere);

/**
 * POST /api/payments/payhere/notify
 * PayHere IPN (Instant Payment Notification) — server-to-server.
 * PayHere POSTs here after every payment attempt.
 * NOTE: must be reachable on a public URL for IPN to work in production.
 */
router.post('/payhere/notify', payhereNotify);

module.exports = router;
