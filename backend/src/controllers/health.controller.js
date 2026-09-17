'use strict';

const pool = require('../db/pool');

/**
 * GET /api/health
 *
 * Returns the server status and confirms a working database connection by
 * executing a cheap 1-row ping query against the pool.
 */
async function healthCheck(req, res, next) {
  try {
    // Acquire a connection from the pool and run a lightweight ping query
    await pool.query('SELECT 1');

    res.status(200).json({
      status:    'ok',
      db:        'connected',
      timestamp: new Date().toISOString(),
      uptime_s:  Math.floor(process.uptime()),
    });
  } catch (err) {
    // Pass to the global error handler — it will log and return 500
    next(err);
  }
}

module.exports = { healthCheck };
