'use strict';

/**
 * PayHere Payment Gateway Integration Module
 * ─────────────────────────────────────────────────────────────────────────────
 * Isolates all PayHere-specific logic so failures here never crash the server.
 * PayHere is Sri Lanka's most widely-used payment gateway, supporting:
 *   - Google Pay, Apple Pay
 *   - Visa / Mastercard / AMEX
 *   - Local bank cards (Sampath, Commercial Bank, BOC, etc.)
 *   - FriMi, eZ Cash (mobile wallets)
 *
 * Integration type: PayHere JS SDK (popup — no page redirect needed)
 * Docs: https://support.payhere.lk/api-&-sdk/payhere-checkout
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');

/** URL of the PayHere JS SDK — single URL for both sandbox and live */
const PAYHERE_JS_SDK_URL = 'https://www.payhere.lk/lib/payhere.js';

// ─────────────────────────────────────────────────────────────────────────────
// generateHash
//
// Required by PayHere before every payment initiation.
// Formula: MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase())
// ─────────────────────────────────────────────────────────────────────────────
function generateHash(merchantId, orderId, amount, currency, merchantSecret) {
  const secretHash = crypto.createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const raw = `${merchantId}${orderId}${amount}${currency}${secretHash}`;
  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// generateIPNHash & verifyIPNHash
//
// Validates the MD5 signature sent by PayHere's IPN callback.
// Formula: MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret).toUpperCase())
// MUST be verified before trusting any payment status from PayHere.
// ─────────────────────────────────────────────────────────────────────────────
function generateIPNHash(merchantId, orderId, amount, currency, statusCode, merchantSecret) {
  const secretHash = crypto.createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const raw = `${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`;
  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
}

function verifyIPNHash(data, merchantSecret) {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = data;
  if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || status_code === undefined || !md5sig) {
    return false;
  }
  const expected = generateIPNHash(merchant_id, order_id, payhere_amount, payhere_currency, status_code, merchantSecret);
  return expected === (md5sig || '').toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// createPaymentPayload
//
// Builds the complete JS SDK payload object the frontend passes to
// payhere.startPayment().  Returns null (not throws) if credentials are
// missing — callers should check for null and return 503.
// ─────────────────────────────────────────────────────────────────────────────
function createPaymentPayload({ visit, notifyUrl, returnUrl, cancelUrl }) {
  const merchantId     = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

  if (
    !merchantId     || merchantId     === 'YOUR_PAYHERE_MERCHANT_ID' ||
    !merchantSecret || merchantSecret === 'YOUR_PAYHERE_MERCHANT_SECRET'
  ) {
    return null; // Caller returns 503 so the app degrades gracefully to cash-only
  }

  // switch sandbox=true to false and swap in live merchant credentials when ready to go live
  const sandbox = process.env.PAYHERE_SANDBOX !== 'false'; // default: sandbox
  const orderId = visit.receipt_number || `VSC-${visit.id.slice(0, 8).toUpperCase()}`;
  const amount  = parseFloat(visit.total_cost).toFixed(2);
  const hash    = generateHash(merchantId, orderId, amount, 'LKR', merchantSecret);

  const nameParts = (visit.owner_name || 'Customer').trim().split(' ');
  const firstName = nameParts[0];
  const lastName  = nameParts.slice(1).join(' ') || 'N/A';

  const backendUrl  = process.env.BACKEND_URL  || 'http://localhost:3000';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return {
    sandbox,
    merchant_id:  merchantId,
    return_url:   returnUrl  || frontendUrl,
    cancel_url:   cancelUrl  || frontendUrl,
    notify_url:   notifyUrl  || `${backendUrl}/api/payments/payhere/notify`,
    order_id:     orderId,
    items:        `Vehicle Service - ${visit.number_plate}`,
    amount,
    currency:     'LKR',
    hash,
    // Customer details (required by PayHere)
    first_name:   firstName,
    last_name:    lastName,
    email:        process.env.SHOP_EMAIL || 'service@vsc.lk',
    phone:        (visit.owner_phone || '0000000000').replace(/\D/g, '').slice(0, 10),
    address:      'N/A',
    city:         'Colombo',
    country:      'Sri Lanka',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PayHere IPN status codes
// ─────────────────────────────────────────────────────────────────────────────
const IPN_STATUS = {
  SUCCESS:      2,
  PENDING:      0,
  CANCELLED:   -1,
  FAILED:      -2,
  CHARGEDBACK: -3,
};

module.exports = {
  PAYHERE_JS_SDK_URL,
  generateHash,
  generateIPNHash,
  verifyIPNHash,
  createPaymentPayload,
  IPN_STATUS,
};
