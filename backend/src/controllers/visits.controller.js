'use strict';

const visitsModel      = require('../models/visits.model');
const { generateReceiptPDF } = require('../utils/receiptPDF');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/visits/photo
// Receives a single image file, saves to disk, returns the stored path.
// ─────────────────────────────────────────────────────────────────────────────
async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file received' });
    }
    // Return a relative path that can be stored in the DB
    const relativePath = `uploads/${req.file.filename}`;
    res.status(200).json({ status: 'ok', data: { path: relativePath, filename: req.file.filename } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/visits
//
// Body (JSON):
// {
//   vehicle_id:  string,
//   services: [
//     { service_id: string, employee_ids: string[] }
//   ],
//   photo_path: string | null
// }
// ─────────────────────────────────────────────────────────────────────────────
async function createVisit(req, res, next) {
  try {
    const { vehicle_id, services, photo_path } = req.body;

    // Basic validation
    const errors = [];
    if (!vehicle_id?.trim())          errors.push('vehicle_id is required');
    if (!Array.isArray(services) || services.length === 0)
      errors.push('services must be a non-empty array');
    else {
      services.forEach((item, i) => {
        if (!item.service_id)          errors.push(`services[${i}].service_id is required`);
        if (!Array.isArray(item.employee_ids) || item.employee_ids.length === 0)
          errors.push(`services[${i}].employee_ids must have at least one employee`);
      });
    }

    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors.join('; ') });
    }

    const visitId = await visitsModel.createVisit({ vehicle_id, services, photo_path: photo_path || null });
    const visit   = await visitsModel.findById(visitId);

    res.status(201).json({ status: 'ok', data: visit });
  } catch (err) {
    // Re-surface business-rule errors as 422 Unprocessable Entity
    if (err.message?.includes('not active') || err.message?.includes('Unknown')) {
      return res.status(422).json({ status: 'error', message: err.message });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/visits/:id
// Returns the full visit detail including nested items and employee names.
// ─────────────────────────────────────────────────────────────────────────────
async function getVisit(req, res, next) {
  try {
    const visit = await visitsModel.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ status: 'error', message: `Visit not found: ${req.params.id}` });
    }
    res.status(200).json({ status: 'ok', data: visit });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// PUT /api/visits/:id/payment
// Records payment method, sets status = 'paid', and generates receipt_number.
// Body: { payment_method: 'Cash'|'Card'|'UPI'|'Other', payment_reference?: string }
// ─────────────────────────────────────────────────────────────────────────────────
async function recordPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { payment_method, payment_reference } = req.body;

    const VALID_METHODS = ['Cash', 'Online', 'Online (Card)', 'Card', 'Other'];
    if (!payment_method || !VALID_METHODS.includes(payment_method)) {
      return res.status(400).json({
        status:  'error',
        message: `payment_method must be one of: ${VALID_METHODS.join(', ')}`,
      });
    }

    const visit = await visitsModel.recordPayment(id, { payment_method, payment_reference });
    res.status(200).json({ status: 'ok', data: visit });
  } catch (err) {
    if (err.message?.includes('not found')) {
      return res.status(404).json({ status: 'error', message: err.message });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// GET /api/visits/:id/receipt
// Streams a pdfkit-generated A4 PDF receipt for the given visit.
// If the visit has no receipt_number yet, one is auto-generated here.
// ─────────────────────────────────────────────────────────────────────────────────
async function generateReceipt(req, res, next) {
  try {
    let visit = await visitsModel.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ status: 'error', message: `Visit not found: ${req.params.id}` });
    }

    // Auto-assign a receipt number if missing (e.g. for reprints before payment step)
    if (!visit.receipt_number) {
      visit = await visitsModel.recordPayment(req.params.id, {
        payment_method:    visit.payment_method || 'Cash',
        payment_reference: visit.payment_reference,
      });
    }

    generateReceiptPDF(visit, res);
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadPhoto, createVisit, getVisit, recordPayment, generateReceipt };
