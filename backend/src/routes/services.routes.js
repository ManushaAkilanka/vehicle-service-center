'use strict';

const { Router } = require('express');
const {
  listServices,
  createService,
  updateService,
  deactivateService,
  getPriceHistory,
} = require('../controllers/services.controller');

const router = Router();

/** GET  /api/services               — list all active services */
router.get('/',                   listServices);

/** POST /api/services               — add a new service */
router.post('/',                  createService);

/** GET  /api/services/:id/price-history — full price audit trail */
router.get('/:id/price-history',  getPriceHistory);

/** PUT  /api/services/:id           — edit service + price history if price changes */
router.put('/:id',                updateService);

/** PUT  /api/services/:id/deactivate — soft-delete (active = FALSE) */
router.put('/:id/deactivate',     deactivateService);

/** DELETE /api/services/:id          — delete / deactivate service */
router.delete('/:id',             deactivateService);

module.exports = router;

