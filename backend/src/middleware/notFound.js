'use strict';

/**
 * 404 — Not Found middleware.
 *
 * Catches any request that didn't match a registered route and returns a
 * structured JSON 404 response.  Must be mounted AFTER all routes.
 */
function notFound(req, res) {
  res.status(404).json({
    status:  'error',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFound;
