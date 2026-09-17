/**
 * employees.js — API client for Employee management & assignment
 */

/**
 * Fetch employees.
 * @param {object} [options]
 * @param {boolean} [options.all=false] — If true, returns all employees including inactive
 */
export async function fetchEmployees({ all = false } = {}) {
  const url = all ? '/api/employees?all=true' : '/api/employees';
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to load employees');
  return json.data;
}

/**
 * Create a new employee.
 * @param {object} employee — { full_name, role, phone, active }
 */
export async function createEmployee(employee) {
  const res = await fetch('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to add employee');
  return json.data;
}

/**
 * Update an existing employee.
 * @param {string} id
 * @param {object} employee — { full_name, role, phone, active }
 */
export async function updateEmployee(id, employee) {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update employee');
  return json.data;
}

/**
 * Delete or deactivate an employee.
 * @param {string} id
 */
export async function deleteEmployee(id) {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete employee');
  return json;
}
