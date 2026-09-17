'use strict';

const { Router } = require('express');
const { healthCheck } = require('../controllers/health.controller');

const router = Router();

/**
 * GET /api/health
 * Confirms that the server is running and the database connection is healthy.
 */
router.get('/', healthCheck);

module.exports = router;
