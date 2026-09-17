'use strict';

const servicesModel = require('../models/services.model');

// ── Validation helper ─────────────────────────────────────────────────────────
const VALID_VEHICLE_TYPES = ['Bike', 'Car', 'Three Wheeler'];

function validateServiceBody(body, requireAll = true) {
  const errors = [];
  if (requireAll || body.name !== undefined) {
    if (!body.name?.trim()) errors.push('name is required');
  }
  if (requireAll || body.vehicle_type !== undefined) {
    if (!body.vehicle_type?.trim()) {
      errors.push('vehicle_type is required');
    } else if (!VALID_VEHICLE_TYPES.includes(body.vehicle_type.trim())) {
      errors.push(`vehicle_type must be one of: ${VALID_VEHICLE_TYPES.join(', ')}`);
    }
  }
  if (requireAll || body.category !== undefined) {
    if (!body.category?.trim()) errors.push('category is required');
  }
  if (requireAll || body.current_price !== undefined) {
    const p = parseFloat(body.current_price);
    if (isNaN(p) || p < 0) errors.push('current_price must be a non-negative number');
  }
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/services
// ─────────────────────────────────────────────────────────────────────────────
async function listServices(req, res, next) {
  try {
    const { vehicle_type } = req.query;
    const services = await servicesModel.listActive(vehicle_type || null);
    res.status(200).json({ status: 'ok', data: services });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/services
// ─────────────────────────────────────────────────────────────────────────────
async function createService(req, res, next) {
  try {
    const errors = validateServiceBody(req.body, true);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors.join('; ') });
    }

    const id = await servicesModel.createService(req.body);
    const service = await servicesModel.findById(id);
    res.status(201).json({ status: 'ok', data: service });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/services/:id
// Updates the service; inserts price history row if price changed.
// ─────────────────────────────────────────────────────────────────────────────
async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const errors = validateServiceBody(req.body, true);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors.join('; ') });
    }

    const affected = await servicesModel.updateService(id, req.body);
    if (affected === 0) {
      return res.status(404).json({
        status: 'error',
        message: `No service found with id "${id}"`,
      });
    }

    const service = await servicesModel.findById(id);
    res.status(200).json({ status: 'ok', data: service });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/services/:id/deactivate
// Soft-delete: sets active = FALSE so historical records stay intact.
// ─────────────────────────────────────────────────────────────────────────────
async function deactivateService(req, res, next) {
  try {
    const { id } = req.params;
    const affected = await servicesModel.deactivateService(id);
    if (affected === 0) {
      return res.status(404).json({
        status: 'error',
        message: `No service found with id "${id}"`,
      });
    }
    res.status(200).json({
      status: 'ok',
      message: 'Service deactivated. Historical records are preserved.',
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/services/:id/price-history
// Optional helper — returns the full price audit trail for one service.
// ─────────────────────────────────────────────────────────────────────────────
async function getPriceHistory(req, res, next) {
  try {
    const { id } = req.params;
    const service = await servicesModel.findById(id);
    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: `No service found with id "${id}"`,
      });
    }
    const history = await servicesModel.getPriceHistory(id);
    res.status(200).json({ status: 'ok', data: history });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listServices,
  createService,
  updateService,
  deactivateService,
  deleteService: deactivateService,
  getPriceHistory,
};
