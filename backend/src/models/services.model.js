'use strict';

const pool     = require('../db/pool');
const { randomUUID } = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// listActive — all active services ordered by vehicle_type, category then name
// Optionally filters by vehicleType if provided
// ─────────────────────────────────────────────────────────────────────────────
async function listActive(vehicleType = null) {
  let query = `
    SELECT id, name, vehicle_type, category, description,
           current_price, extra_details, active
    FROM   services
    WHERE  active = TRUE
  `;
  const params = [];
  if (vehicleType) {
    query += ' AND vehicle_type = ?';
    params.push(vehicleType);
  }
  query += ' ORDER BY vehicle_type, category, name';

  const [rows] = await pool.query(query, params);
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// findById
// ─────────────────────────────────────────────────────────────────────────────
async function findById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM services WHERE id = ? LIMIT 1', [id]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// createService
// Inserts a new service row AND seeds its first price history record.
// extra_details is stored as JSON; pass null if not used.
// ─────────────────────────────────────────────────────────────────────────────
async function createService({ name, vehicle_type = 'Car', category, description, current_price, extra_details = null }) {
  const serviceId = randomUUID();
  const historyId = randomUUID();

  // Use a transaction so both inserts succeed or fail together
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`
      INSERT INTO services (id, name, vehicle_type, category, description, current_price, extra_details, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [serviceId, name.trim(), (vehicle_type || 'Car').trim(), category.trim(), description?.trim() || null,
        current_price, extra_details ? JSON.stringify(extra_details) : null]);

    // Seed the first price history record
    await conn.query(`
      INSERT INTO service_price_history (id, service_id, price, effective_from)
      VALUES (?, ?, ?, NOW())
    `, [historyId, serviceId, current_price]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return serviceId;
}

// ─────────────────────────────────────────────────────────────────────────────
// updateService
// Updates editable fields. If current_price changes, a new price history row
// is inserted BEFORE overwriting current_price — preserving the full audit
// trail.
// Returns the number of affected rows (0 = not found).
// ─────────────────────────────────────────────────────────────────────────────
async function updateService(id, { name, vehicle_type, category, description, current_price, extra_details }) {
  const existing = await findById(id);
  if (!existing) return 0;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Only write a price history row when the price actually changes
    const oldPrice = parseFloat(existing.current_price);
    const newPrice = parseFloat(current_price);
    if (oldPrice !== newPrice) {
      await conn.query(`
        INSERT INTO service_price_history (id, service_id, price, effective_from)
        VALUES (?, ?, ?, NOW())
      `, [randomUUID(), id, newPrice]);
    }

    const nextVehicleType = vehicle_type !== undefined ? vehicle_type.trim() : existing.vehicle_type;

    const [result] = await conn.query(`
      UPDATE services
      SET    name          = ?,
             vehicle_type  = ?,
             category      = ?,
             description   = ?,
             current_price = ?,
             extra_details = ?
      WHERE  id = ?
    `, [name.trim(),
        nextVehicleType,
        category.trim(),
        description !== undefined ? (description?.trim() || null) : existing.description,
        newPrice,
        extra_details ? JSON.stringify(extra_details) : existing.extra_details,
        id]);

    await conn.commit();
    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// deactivateService — soft-delete: sets active = FALSE
// Returns affected rows (0 = not found).
// ─────────────────────────────────────────────────────────────────────────────
async function deactivateService(id) {
  const [result] = await pool.query(
    'UPDATE services SET active = FALSE WHERE id = ?', [id]
  );
  return result.affectedRows;
}

// ─────────────────────────────────────────────────────────────────────────────
// getPriceHistory — all price records for one service, newest first
// ─────────────────────────────────────────────────────────────────────────────
async function getPriceHistory(serviceId) {
  const [rows] = await pool.query(`
    SELECT id, price, effective_from
    FROM   service_price_history
    WHERE  service_id = ?
    ORDER  BY effective_from DESC
  `, [serviceId]);
  return rows;
}

module.exports = {
  listActive,
  findById,
  createService,
  updateService,
  deactivateService,
  getPriceHistory,
};
