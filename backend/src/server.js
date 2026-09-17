'use strict';

// Load environment variables from .env BEFORE anything else
require('dotenv').config();

const app  = require('./app');
const pool = require('./db/pool');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0'; // Accept connections from all network interfaces

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Verify that we can actually talk to the database before accepting traffic
    await pool.query('SELECT 1');
    console.log('✅  Database connection pool is ready');
  } catch (err) {
    console.error('❌  Failed to connect to the database:', err.message);
    console.error('    Check your .env credentials and that MySQL is running.');
    process.exit(1); // Don't start the server if the DB is unreachable
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀  Server listening on http://${HOST}:${PORT}`);
    console.log(`    Health check → http://localhost:${PORT}/api/health`);
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — draining connection pool and shutting down…');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received — draining connection pool and shutting down…');
  await pool.end();
  process.exit(0);
});

start();
