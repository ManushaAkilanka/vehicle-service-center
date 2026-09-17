'use strict';

const pool = require('../db/pool');
const { randomUUID } = require('crypto');

async function listAll() {
  const [rows] = await pool.query(`
    SELECT id, full_name, role, phone, active
    FROM   employees
    ORDER  BY full_name ASC
  `);
  return rows;
}

async function listActive() {
  const [rows] = await pool.query(`
    SELECT id, full_name, role, phone, active
    FROM   employees
    WHERE  active = 1
    ORDER  BY full_name ASC
  `);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, full_name, role, phone, active FROM employees WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function create({ full_name, role, phone, active = 1 }) {
  const id = randomUUID();
  await pool.query(
    'INSERT INTO employees (id, full_name, role, phone, active) VALUES (?, ?, ?, ?, ?)',
    [id, full_name.trim(), role.trim(), phone.trim(), active ? 1 : 0]
  );
  return findById(id);
}

async function update(id, { full_name, role, phone, active }) {
  const existing = await findById(id);
  if (!existing) return null;

  const updatedName   = full_name !== undefined ? full_name.trim() : existing.full_name;
  const updatedRole   = role !== undefined ? role.trim() : existing.role;
  const updatedPhone  = phone !== undefined ? phone.trim() : existing.phone;
  const updatedActive = active !== undefined ? (active ? 1 : 0) : existing.active;

  await pool.query(
    'UPDATE employees SET full_name = ?, role = ?, phone = ?, active = ? WHERE id = ?',
    [updatedName, updatedRole, updatedPhone, updatedActive, id]
  );
  return findById(id);
}

async function deleteOrDeactivate(id) {
  const existing = await findById(id);
  if (!existing) return null;

  // Check if assigned to any visits
  const [assigned] = await pool.query(
    'SELECT id FROM service_visit_employees WHERE employee_id = ? LIMIT 1',
    [id]
  );

  if (assigned.length > 0) {
    // Soft-deactivate if employee has historical service records
    await pool.query('UPDATE employees SET active = 0 WHERE id = ?', [id]);
    return { ...existing, active: 0, deactivated: true };
  } else {
    // Hard-delete if never assigned
    await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    return { ...existing, deleted: true };
  }
}

module.exports = {
  listAll,
  listActive,
  findById,
  create,
  update,
  deleteOrDeactivate,
};
