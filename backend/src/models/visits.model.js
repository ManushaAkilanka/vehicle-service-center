'use strict';

const pool         = require('../db/pool');
const { randomUUID } = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// createVisit
//
// Runs inside a single transaction:
//   1. Insert service_visits row (total_cost = 0 initially)
//   2. For each service item:
//      a. Snapshot current_price → price_charged (never reference live price later)
//      b. Insert service_visit_items row
//      c. Insert service_visit_employees rows for each assigned employee
//   3. Calculate total_cost = SUM of price_charged values
//   4. Update service_visits.total_cost
//   5. COMMIT — or ROLLBACK if anything throws
//
// @param {string}   vehicle_id
// @param {Array}    services  — [{ service_id, employee_ids: string[] }]
// @param {string|null} photo_path
// ─────────────────────────────────────────────────────────────────────────────
async function createVisit({ vehicle_id, services, photo_path = null }) {
  if (!vehicle_id)               throw new Error('vehicle_id is required');
  if (!services?.length)         throw new Error('At least one service is required');

  const visitId = randomUUID();
  const conn    = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // ── 1. Snapshot prices for all service IDs in one round-trip ─────────
    const serviceIds = [...new Set(services.map(s => s.service_id))];
    const [priceRows] = await conn.query(
      `SELECT id, current_price, active FROM services WHERE id IN (?)`,
      [serviceIds]
    );

    const priceMap = {};
    for (const row of priceRows) {
      if (!row.active) throw new Error(`Service ${row.id} is not active`);
      priceMap[row.id] = parseFloat(row.current_price);
    }

    // Validate all requested service IDs exist and are active
    for (const { service_id } of services) {
      if (priceMap[service_id] === undefined) {
        throw new Error(`Unknown or inactive service id: ${service_id}`);
      }
    }

    // ── 2. Insert the visit header (total_cost placeholder = 0) ──────────
    await conn.query(
      `INSERT INTO service_visits (id, vehicle_id, total_cost, photo_path, visit_date)
       VALUES (?, ?, 0.00, ?, NOW())`,
      [visitId, vehicle_id, photo_path]
    );

    // ── 3. Insert line items and employee assignments ─────────────────────
    let totalCost = 0;

    for (const item of services) {
      const itemId       = randomUUID();
      const priceCharged = priceMap[item.service_id];
      totalCost         += priceCharged;

      await conn.query(
        `INSERT INTO service_visit_items (id, visit_id, service_id, price_charged)
         VALUES (?, ?, ?, ?)`,
        [itemId, visitId, item.service_id, priceCharged]
      );

      const empIds = item.employee_ids || [];
      for (const empId of empIds) {
        await conn.query(
          `INSERT INTO service_visit_employees (id, visit_item_id, employee_id)
           VALUES (?, ?, ?)`,
          [randomUUID(), itemId, empId]
        );
      }
    }

    // ── 4. Write the correct total back to the visit row ─────────────────
    await conn.query(
      `UPDATE service_visits SET total_cost = ? WHERE id = ?`,
      [totalCost.toFixed(2), visitId]
    );

    await conn.commit();
    return visitId;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// findById — full visit detail with nested items + employees
// ─────────────────────────────────────────────────────────────────────────────
async function findById(visitId) {
  // Visit header + vehicle info
  const [visitRows] = await pool.query(`
    SELECT
      sv.id, sv.visit_date, sv.total_cost,
      sv.payment_method, sv.payment_status, sv.payment_reference,
      sv.photo_path, sv.receipt_number,
      v.id         AS vehicle_id,
      v.number_plate,
      v.vehicle_type,
      v.make,
      v.model,
      v.owner_name,
      v.owner_phone
    FROM service_visits sv
    JOIN vehicles       v  ON v.id  = sv.vehicle_id
    WHERE sv.id = ?
    LIMIT 1
  `, [visitId]);

  if (!visitRows.length) return null;
  const visit = visitRows[0];

  // Line items
  const [itemRows] = await pool.query(`
    SELECT
      svi.id            AS item_id,
      svi.service_id,
      s.name            AS service_name,
      s.category        AS service_category,
      svi.price_charged
    FROM service_visit_items svi
    JOIN services s ON s.id = svi.service_id
    WHERE svi.visit_id = ?
    ORDER BY s.category, s.name
  `, [visitId]);

  // Employees per line item
  const itemIds = itemRows.map(r => r.item_id);
  let empRows = [];
  if (itemIds.length) {
    [empRows] = await pool.query(`
      SELECT
        sve.visit_item_id,
        e.id         AS employee_id,
        e.full_name,
        e.role
      FROM service_visit_employees sve
      JOIN employees e ON e.id = sve.employee_id
      WHERE sve.visit_item_id IN (?)
    `, [itemIds]);
  }

  // Group employees by item_id
  const empByItem = {};
  for (const e of empRows) {
    if (!empByItem[e.visit_item_id]) empByItem[e.visit_item_id] = [];
    empByItem[e.visit_item_id].push({ employee_id: e.employee_id, full_name: e.full_name, role: e.role });
  }

  return {
    ...visit,
    items: itemRows.map(item => ({
      ...item,
      employees: empByItem[item.item_id] || [],
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// recordPayment
//
// Updates payment fields on a service_visits row.
// Generates a receipt_number in the format VRC-YYYYMMDD-XXXX (if not already set).
// Returns the updated visit detail via findById.
// ─────────────────────────────────────────────────────────────────────────────
async function recordPayment(visitId, { payment_method, payment_reference = null }) {
  const existing = await findById(visitId);
  if (!existing) throw new Error(`Visit not found: ${visitId}`);

  // Only generate a receipt number if one doesn't already exist
  let receiptNumber = existing.receipt_number;
  if (!receiptNumber) {
    const now     = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand     = Math.random().toString(36).toUpperCase().slice(2, 6);
    receiptNumber  = `VRC-${datePart}-${rand}`;
  }

  await pool.query(`
    UPDATE service_visits
    SET    payment_method    = ?,
           payment_status    = 'paid',
           payment_reference = ?,
           receipt_number    = ?
    WHERE  id = ?
  `, [payment_method, payment_reference, receiptNumber, visitId]);

  return findById(visitId);
}

module.exports = { createVisit, findById, recordPayment };

