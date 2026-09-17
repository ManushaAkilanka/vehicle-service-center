'use strict';

const pool = require('../db/pool');
const { randomUUID } = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// findByNumberPlate
//
// Looks up a vehicle by number plate (case-insensitive).
// JOINs with service_visits to surface:
//   - serviced_before  (boolean: has the vehicle been in before?)
//   - last_service_date (most recent visit_date or null)
// ─────────────────────────────────────────────────────────────────────────────
async function findByNumberPlate(numberPlate) {
  const sql = `
    SELECT
      v.id,
      v.number_plate,
      v.vehicle_type,
      v.make,
      v.model,
      v.owner_name,
      v.owner_phone,
      v.created_at,
      COUNT(sv.id)       AS visit_count,
      MAX(sv.visit_date) AS last_service_date
    FROM vehicles v
    LEFT JOIN service_visits sv ON sv.vehicle_id = v.id
    WHERE UPPER(v.number_plate) = UPPER(?)
    GROUP BY v.id
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [numberPlate.trim()]);
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    ...row,
    serviced_before:   Number(row.visit_count) > 0,
    last_service_date: row.last_service_date || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// createVehicle
//
// Inserts a new vehicle row. UUID is generated here in application code so
// we can immediately return the id to the caller without a second SELECT.
// ─────────────────────────────────────────────────────────────────────────────
async function createVehicle({ number_plate, vehicle_type, make, model, owner_name, owner_phone }) {
  const id = randomUUID();
  const sql = `
    INSERT INTO vehicles (id, number_plate, vehicle_type, make, model, owner_name, owner_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await pool.query(sql, [id, number_plate.trim().toUpperCase(), vehicle_type, make, model, owner_name, owner_phone]);
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// updateVehicle
//
// Updates editable fields for a vehicle identified by its UUID.
// Returns the number of affected rows (0 = not found).
// ─────────────────────────────────────────────────────────────────────────────
async function updateVehicle(id, { vehicle_type, make, model, owner_name, owner_phone }) {
  const sql = `
    UPDATE vehicles
    SET vehicle_type = ?,
        make         = ?,
        model        = ?,
        owner_name   = ?,
        owner_phone  = ?
    WHERE id = ?
  `;
  const [result] = await pool.query(sql, [vehicle_type, make, model, owner_name, owner_phone, id]);
  return result.affectedRows;
}

// ─────────────────────────────────────────────────────────────────────────────
// findById
//
// Needed after an update so the controller can return the refreshed record.
// ─────────────────────────────────────────────────────────────────────────────
async function findById(id) {
  const sql = `
    SELECT
      v.id,
      v.number_plate,
      v.vehicle_type,
      v.make,
      v.model,
      v.owner_name,
      v.owner_phone,
      v.created_at,
      COUNT(sv.id)       AS visit_count,
      MAX(sv.visit_date) AS last_service_date
    FROM vehicles v
    LEFT JOIN service_visits sv ON sv.vehicle_id = v.id
    WHERE v.id = ?
    GROUP BY v.id
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [id]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    serviced_before:   Number(row.visit_count) > 0,
    last_service_date: row.last_service_date || null,
  };
}

module.exports = { findByNumberPlate, createVehicle, updateVehicle, findById };
