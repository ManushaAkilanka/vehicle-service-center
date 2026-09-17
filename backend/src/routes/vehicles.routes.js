'use strict';

const { Router } = require('express');
const {
  getVehicleByPlate,
  createVehicle,
  updateVehicle,
} = require('../controllers/vehicles.controller');

const router = Router();

/**
 * POST /api/vehicles
 * Create a new vehicle. UUID is generated server-side.
 */
router.post('/', createVehicle);

/**
 * GET /api/vehicles/:numberPlate
 * Look up a vehicle by number plate.
 * Includes serviced_before flag and last_service_date via JOIN.
 */
router.get('/:numberPlate', getVehicleByPlate);

/**
 * PUT /api/vehicles/:id
 * Update editable vehicle details by UUID.
 */
router.put('/:id', updateVehicle);

module.exports = router;
