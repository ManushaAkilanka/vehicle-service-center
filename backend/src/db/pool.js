'use strict';

const mysql = require('mysql2/promise');

/**
 * MySQL connection pool — shared singleton across the whole application.
 *
 * All configuration is read from environment variables so that no credentials
 * ever appear in source code.
 *
 * mysql2's promise pool automatically manages acquiring / releasing connections,
 * so every route handler simply does:
 *
 *   const [rows] = await pool.query('SELECT ...', [params]);
 */
const pool = mysql.createPool({
  host:              process.env.DB_HOST     || '127.0.0.1',
  port:              Number(process.env.DB_PORT) || 3306,
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME     || 'vehicle_service_db',
  connectionLimit:   Number(process.env.DB_POOL_LIMIT) || 10,
  waitForConnections: true,
  queueLimit:        0,
  timezone:          '+00:00',
  charset:           'utf8mb4',
});

module.exports = pool;
