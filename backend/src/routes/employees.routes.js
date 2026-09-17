'use strict';

const { Router } = require('express');
const {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employees.controller');

const router = Router();

/** GET /api/employees — list employees (?all=true for all, default active) */
router.get('/', listEmployees);

/** GET /api/employees/:id — get employee */
router.get('/:id', getEmployee);

/** POST /api/employees — create employee */
router.post('/', createEmployee);

/** PUT /api/employees/:id — update employee */
router.put('/:id', updateEmployee);

/** DELETE /api/employees/:id — delete/deactivate employee */
router.delete('/:id', deleteEmployee);

module.exports = router;
