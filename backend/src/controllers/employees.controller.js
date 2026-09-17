'use strict';

const employeesModel = require('../models/employees.model');

/** GET /api/employees — list employees (?all=true for all, otherwise active only) */
async function listEmployees(req, res, next) {
  try {
    const includeAll = req.query.all === 'true';
    const employees = includeAll
      ? await employeesModel.listAll()
      : await employeesModel.listActive();
    res.status(200).json({ status: 'ok', data: employees });
  } catch (err) {
    next(err);
  }
}

/** GET /api/employees/:id — single employee */
async function getEmployee(req, res, next) {
  try {
    const employee = await employeesModel.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }
    res.status(200).json({ status: 'ok', data: employee });
  } catch (err) {
    next(err);
  }
}

/** POST /api/employees — create new employee */
async function createEmployee(req, res, next) {
  try {
    const { full_name, role, phone, active } = req.body;
    if (!full_name?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Employee name is required' });
    }
    if (!role?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Role / position is required' });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Phone number is required' });
    }

    const created = await employeesModel.create({
      full_name,
      role,
      phone,
      active: active !== undefined ? (active ? 1 : 0) : 1,
    });
    res.status(201).json({ status: 'ok', data: created, message: 'Employee added successfully' });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/employees/:id — update employee */
async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const { full_name, role, phone, active } = req.body;

    if (full_name !== undefined && !full_name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Employee name cannot be empty' });
    }
    if (role !== undefined && !role.trim()) {
      return res.status(400).json({ status: 'error', message: 'Role cannot be empty' });
    }
    if (phone !== undefined && !phone.trim()) {
      return res.status(400).json({ status: 'error', message: 'Phone cannot be empty' });
    }

    const updated = await employeesModel.update(id, { full_name, role, phone, active });
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }
    res.status(200).json({ status: 'ok', data: updated, message: 'Employee updated successfully' });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/employees/:id — delete or deactivate employee */
async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const result = await employeesModel.deleteOrDeactivate(id);
    if (!result) {
      return res.status(404).json({ status: 'error', message: 'Employee not found' });
    }

    const message = result.deactivated
      ? 'Employee deactivated (assigned to previous service records, history preserved).'
      : 'Employee deleted successfully.';

    res.status(200).json({ status: 'ok', data: result, message });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
