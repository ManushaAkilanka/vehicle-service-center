'use strict';

const pool        = require('../db/pool');
const visitsModel = require('../models/visits.model');
const payhere     = require('../modules/payhere');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/connectivity
//
// Checks whether PayHere's servers are reachable (i.e. the machine has
// internet access).  The frontend calls this on mount and disables the
// Online option when this returns { online: false }.
// Uses a 4-second timeout so it fails fast on a local-only network.
// ─────────────────────────────────────────────────────────────────────────────
async function checkConnectivity(req, res) {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 4000);

    const targetUrl = process.env.PAYHERE_SANDBOX !== 'false'
      ? 'https://sandbox.payhere.lk'
      : 'https://www.payhere.lk';

    let reachable = false;
    try {
      const resp = await fetch(targetUrl, {
        method:  'HEAD',
        signal:  controller.signal,
        headers: { 'User-Agent': 'VehicleServiceSystem/1.0' },
      });
      clearTimeout(tid);
      reachable = resp.status < 500;
    } catch (_) {
      // Fallback check to ensure network is reachable
      const fbController = new AbortController();
      const fbTid = setTimeout(() => fbController.abort(), 3000);
      try {
        const fbResp = await fetch('https://www.google.com', {
          method: 'HEAD',
          signal: fbController.signal,
        });
        clearTimeout(fbTid);
        reachable = fbResp.status < 500;
      } catch (__) {
        reachable = false;
      }
    }

    return res.json({
      status: 'ok',
      data: {
        online:  reachable,
        payhere: reachable,
        message: reachable
          ? 'Online payment is available'
          : 'PayHere servers are unreachable. Only cash payment available.',
      },
    });
  } catch (_) {
    return res.json({
      status: 'ok',
      data: {
        online:  false,
        payhere: false,
        message: 'No internet connection detected. Only cash payment is available.',
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/payhere/init
//
// Generates the PayHere hash and returns the complete JS SDK payload for the
// frontend.  Pre-assigns a receipt_number (used as PayHere order_id) so the
// IPN notify callback can look it up later.
//
// Body: { visit_id: string }
// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting & duplicate-submission protection map (Task B.4)
const activeInits = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [id, time] of activeInits.entries()) {
    if (now - time > 60000) activeInits.delete(id);
  }
}, 60000);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/payhere/init
//
// Generates the PayHere hash and returns the complete JS SDK payload for the frontend.
// Security:
// - Verifies amount against database (never trusts client amount) (Task B.5)
// - Prevents double-charging if already paid (Task B.4)
// - Cooldown rate-limiting against rapid double-clicks (Task B.4)
// ─────────────────────────────────────────────────────────────────────────────
async function initPayhere(req, res, next) {
  try {
    const { visit_id } = req.body;
    if (!visit_id || typeof visit_id !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Valid visit_id is required' });
    }

    // Rate-limiting / rapid double-click protection (Task B.4)
    const now = Date.now();
    const lastInit = activeInits.get(visit_id);
    if (lastInit && now - lastInit < 2000) {
      return res.status(429).json({
        status: 'error',
        message: 'Payment request is already being initialized. Please wait a moment.',
        code: 'RATE_LIMITED',
      });
    }
    activeInits.set(visit_id, now);

    let visit = await visitsModel.findById(visit_id);
    if (!visit) {
      return res.status(404).json({ status: 'error', message: `Visit not found: ${visit_id}` });
    }

    // Prevent double-charging / re-initiating paid visits (Task B.4)
    if (visit.payment_status === 'paid') {
      return res.status(409).json({
        status: 'error',
        message: 'This visit has already been paid.',
        code: 'ALREADY_PAID',
      });
    }

    // Verify visit amount is positive and valid (Task B.5)
    const totalCost = parseFloat(visit.total_cost);
    if (isNaN(totalCost) || totalCost <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid visit total cost' });
    }

    // Pre-assign receipt_number so we can use it as PayHere order_id.
    if (!visit.receipt_number) {
      const nowDate  = new Date();
      const datePart = nowDate.toISOString().slice(0, 10).replace(/-/g, '');
      const rand     = Math.random().toString(36).toUpperCase().slice(2, 6);
      const rcptNo   = `VSC-${datePart}-${rand}`;

      await pool.query(
        `UPDATE service_visits SET receipt_number = ?, payment_status = 'pending' WHERE id = ?`,
        [rcptNo, visit_id]
      );
      visit = await visitsModel.findById(visit_id);
    }

    // Build payload (hash computed server-side, never exposes merchant_secret) (Task B.1, B.2, B.5)
    const payload = payhere.createPaymentPayload({
      visit,
      notifyUrl: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/payments/payhere/notify`,
      returnUrl: req.body.return_url || `${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
      cancelUrl: req.body.cancel_url || `${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
    });

    if (!payload) {
      return res.status(503).json({
        status:  'error',
        message: 'Online payment is not configured on this system. Please use cash.',
        code:    'PAYHERE_NOT_CONFIGURED',
      });
    }

    return res.json({
      status: 'ok',
      data: {
        payload,
        sdk_url: payhere.PAYHERE_JS_SDK_URL,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/payhere/notify
//
// PayHere IPN (Instant Payment Notification) — server-to-server callback.
// Security:
// - Recomputes & verifies MD5 signature using merchant_secret (Task B.1)
// - Verifies amount against visit total in DB (Task B.5)
// - Idempotent: ignores duplicate callbacks without double-marking (Task B.4)
// - Minimal sanitized logging: order_id, status, timestamp only (Task B.7)
// - Marks visit as "Paid" with payment_method="Online (Card)" ONLY on status=2 (Task A)
// ─────────────────────────────────────────────────────────────────────────────
async function payhereNotify(req, res) {
  try {
    const data           = req.body;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantSecret) {
      console.warn('[PayHere IPN] PAYHERE_MERCHANT_SECRET not set — skipping IPN');
      return res.send('OK');
    }

    // Log ONLY order_id, status, and timestamp — no sensitive fields (Task B.7)
    console.log(`[PayHere IPN] order_id=${data?.order_id} status=${data?.status_code} timestamp=${new Date().toISOString()}`);

    // 1. Verify signature authenticity server-side (Task B.1)
    if (!payhere.verifyIPNHash(data, merchantSecret)) {
      console.warn(`[PayHere IPN] Signature mismatch for order_id=${data?.order_id}. Rejecting callback.`);
      return res.status(400).send('INVALID_SIGNATURE');
    }

    const orderId = String(data.order_id || '').trim();
    if (!orderId || !/^[A-Za-z0-9-]+$/.test(orderId)) {
      return res.status(400).send('INVALID_ORDER_ID');
    }

    const [rows] = await pool.query(
      'SELECT id, total_cost, payment_status FROM service_visits WHERE receipt_number = ? LIMIT 1',
      [orderId]
    );

    if (!rows.length) {
      console.warn(`[PayHere IPN] Order not found: ${orderId}`);
      return res.status(404).send('ORDER_NOT_FOUND');
    }

    const dbVisit = rows[0];

    // Duplicate-submission / Idempotency protection (Task B.4)
    if (dbVisit.payment_status === 'paid') {
      console.log(`[PayHere IPN] Visit ${dbVisit.id} is already paid. Idempotent return.`);
      return res.send('OK');
    }

    // Verify amount matches database (Task B.5)
    const expectedAmount = parseFloat(dbVisit.total_cost).toFixed(2);
    const paidAmount     = parseFloat(data.payhere_amount).toFixed(2);
    if (expectedAmount !== paidAmount) {
      console.warn(`[PayHere IPN] Amount mismatch for ${orderId}: expected ${expectedAmount}, received ${paidAmount}`);
      return res.status(400).send('AMOUNT_MISMATCH');
    }

    const statusCode = parseInt(data.status_code, 10);

    // 2. Mark visit as "Paid" ONLY when status_code = 2 (SUCCESS) (Task A)
    if (statusCode === payhere.IPN_STATUS.SUCCESS) {
      await pool.query(
        `UPDATE service_visits
         SET payment_status    = 'paid',
             payment_method    = 'Online (Card)',
             payment_reference = ?
         WHERE id = ?`,
        [data.payment_id || orderId, dbVisit.id]
      );
      console.log(`[PayHere IPN] Visit ${dbVisit.id} marked as PAID. Transaction ID: ${data.payment_id}`);
    } else {
      // Payment failed or cancelled
      await pool.query(
        `UPDATE service_visits
         SET payment_status    = 'failed',
             payment_method    = 'Online (Card)'
         WHERE id = ?`,
        [dbVisit.id]
      );
      console.log(`[PayHere IPN] Visit ${dbVisit.id} recorded non-success status: ${statusCode}`);
    }

    return res.send('OK');
  } catch (err) {
    console.error('[PayHere IPN] Error processing IPN:', err.message);
    return res.send('OK');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/by-order/:orderId
// Looks up a visit by receipt_number (which is used as PayHere order_id)
// ─────────────────────────────────────────────────────────────────────────────
async function getVisitByOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const [rows] = await pool.query(
      'SELECT id, payment_status, total_cost FROM service_visits WHERE receipt_number = ? LIMIT 1',
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({ status: 'error', message: `No visit found for order: ${orderId}` });
    }

    const visitRow = rows[0];

    // In local sandbox development, PayHere cannot reach http://localhost:3000 to deliver the notify_url webhook.
    // If sandbox_confirm is requested and PAYHERE_SANDBOX is true, complete the visit so the demo completes successfully.
    if (process.env.PAYHERE_SANDBOX !== 'false' && req.query.sandbox_confirm === 'true') {
      if (visitRow.payment_status === 'pending') {
        await pool.query(
          `UPDATE service_visits
           SET payment_status    = 'paid',
               payment_method    = 'Online (Card)',
               payment_reference = ?
           WHERE id = ?`,
          [`PYH-SBX-${orderId.slice(-6)}`, visitRow.id]
        );
      }
    }

    const visit = await visitsModel.findById(visitRow.id);
    return res.json({ status: 'ok', data: visit });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkConnectivity, initPayhere, payhereNotify, getVisitByOrder };
