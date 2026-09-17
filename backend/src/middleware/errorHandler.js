'use strict';

/**
 * Global error-handling middleware.
 *
 * Express recognises this as an error handler because it declares FOUR
 * parameters (err, req, res, next).  All unhandled errors thrown inside
 * controllers / route handlers propagate here via next(err).
 *
 * In development the full stack trace is included in the response body so
 * debugging is straightforward.  In production only a generic message is sent
 * to avoid leaking implementation details to clients.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log the full error server-side regardless of environment
  console.error('[ERROR]', err);

  const statusCode = err.statusCode || err.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    status:  'error',
    message: err.message || 'Internal Server Error',
    // Only expose the stack trace outside of production
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
