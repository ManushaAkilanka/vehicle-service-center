'use strict';

const path    = require('path');
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

// ── Route modules ─────────────────────────────────────────────────────────────
const healthRoutes    = require('./routes/health.routes');
const vehiclesRoutes  = require('./routes/vehicles.routes');
const employeesRoutes = require('./routes/employees.routes');
const servicesRoutes  = require('./routes/services.routes');
const visitsRoutes    = require('./routes/visits.routes');
const paymentsRoutes  = require('./routes/payments.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportsRoutes   = require('./routes/reports.routes');
const uploadsRoutes   = require('./routes/uploads.routes');

// ── Middleware ────────────────────────────────────────────────────────────────
const notFound     = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const helmet  = require('helmet');

// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// ── Security Headers (Task B.6) ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'https://www.payhere.lk', 'https://sandbox.payhere.lk'],
      frameSrc:   ["'self'", 'https://www.payhere.lk', 'https://sandbox.payhere.lk'],
      connectSrc: ["'self'", 'https://www.payhere.lk', 'https://sandbox.payhere.lk'],
      imgSrc:     ["'self'", 'data:', 'blob:', 'https://www.payhere.lk', 'https://sandbox.payhere.lk'],
      styleSrc:   ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows static images / uploads to be displayed
}));

// ── HTTPS Enforcement in Production (Task B.3) ───────────────────────────────
// In production environments, redirect all HTTP traffic to HTTPS.
// For local development, HTTP is permitted.
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && !req.secure) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ── Request logging ───────────────────────────────────────────────────────────
// Uses "dev" format in development, "combined" in production
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Restricted CORS (Task B.6) ────────────────────────────────────────────────
// Restrict cross-origin requests strictly to the application's trusted origins.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server IPN callbacks from PayHere, curl, server tests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy: origin not allowed'));
  },
  credentials: true,
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Static: serve uploaded visit photos ───────────────────────────────────────
// Serves both uploads/ (legacy) and the nested vehicle-photos/ subfolder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/health',     healthRoutes);
app.use('/api/vehicles',   vehiclesRoutes);
app.use('/api/employees',  employeesRoutes);
app.use('/api/services',   servicesRoutes);
app.use('/api/visits',     visitsRoutes);
app.use('/api/payments',   paymentsRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/reports',    reportsRoutes);
app.use('/api/uploads',    uploadsRoutes);

// ── 404 & Error Handling ─────────────────────────────────────────────────────
// These MUST come last — order matters in Express
app.use(notFound);
app.use(errorHandler);

module.exports = app;
