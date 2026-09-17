/**
 * vehicles.js
 * Centralised API calls for the vehicles resource.
 * All paths are relative — Vite's dev proxy forwards /api/* to the backend.
 */

const BASE = '/api/vehicles';

/** Look up a vehicle by number plate. Returns vehicle object or throws. */
export async function lookupVehicle(numberPlate) {
  const res = await fetch(`${BASE}/${encodeURIComponent(numberPlate.trim().toUpperCase())}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Lookup failed');
  return json.data;
}

/** Create a new vehicle. Returns created vehicle object or throws. */
export async function createVehicle(payload) {
  const res = await fetch(BASE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Create failed');
  return json.data;
}

/** Update an existing vehicle by UUID. Returns updated vehicle or throws. */
export async function updateVehicle(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Update failed');
  return json.data;
}
