'use strict';

const vehiclesModel = require('../models/vehicles.model');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Validate required string fields and return an array of error messages. */
function validateVehicleBody(body, requireNumberPlate = true) {
  const errors = [];
  if (requireNumberPlate && !body.number_plate?.trim()) errors.push('number_plate is required');
  if (!body.vehicle_type?.trim())  errors.push('vehicle_type is required');
  if (!body.make?.trim())          errors.push('make is required');
  if (!body.model?.trim())         errors.push('model is required');
  if (!body.owner_name?.trim())    errors.push('owner_name is required');
  if (!body.owner_phone?.trim())   errors.push('owner_phone is required');
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vehicles/:numberPlate
// ─────────────────────────────────────────────────────────────────────────────
async function getVehicleByPlate(req, res, next) {
  try {
    const { numberPlate } = req.params;
    if (!numberPlate?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Number plate is required' });
    }

    const vehicle = await vehiclesModel.findByNumberPlate(numberPlate);
    if (!vehicle) {
      return res.status(404).json({
        status:  'error',
        message: `No vehicle found with number plate "${numberPlate.toUpperCase()}"`,
      });
    }

    res.status(200).json({ status: 'ok', data: vehicle });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/vehicles
// ─────────────────────────────────────────────────────────────────────────────
async function createVehicle(req, res, next) {
  try {
    const errors = validateVehicleBody(req.body, true);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors.join('; ') });
    }

    // Check for duplicate number plate
    const existing = await vehiclesModel.findByNumberPlate(req.body.number_plate);
    if (existing) {
      return res.status(409).json({
        status:  'error',
        message: `A vehicle with number plate "${req.body.number_plate.trim().toUpperCase()}" already exists`,
      });
    }

    const id = await vehiclesModel.createVehicle(req.body);
    const vehicle = await vehiclesModel.findById(id);
    res.status(201).json({ status: 'ok', data: vehicle });
  } catch (err) {
    // MySQL duplicate entry (race condition guard)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status:  'error',
        message: 'A vehicle with that number plate already exists',
      });
    }
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/vehicles/:id
// ─────────────────────────────────────────────────────────────────────────────
async function updateVehicle(req, res, next) {
  try {
    const { id } = req.params;

    const errors = validateVehicleBody(req.body, false);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: errors.join('; ') });
    }

    const affectedRows = await vehiclesModel.updateVehicle(id, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({
        status:  'error',
        message: `No vehicle found with id "${id}"`,
      });
    }

    const vehicle = await vehiclesModel.findById(id);
    res.status(200).json({ status: 'ok', data: vehicle });
  } catch (err) {
    next(err);
  }
}

module.exports = { getVehicleByPlate, createVehicle, updateVehicle };
