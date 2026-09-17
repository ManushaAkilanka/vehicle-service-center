/**
 * services.js
 * Centralised API calls for the services / service catalog resource.
 */

const BASE = '/api/services';

/** Fetch all active services, optionally filtered by vehicle type. */
export async function fetchServices(vehicleType) {
  const url = vehicleType ? `${BASE}?vehicle_type=${encodeURIComponent(vehicleType)}` : BASE;
  const res  = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to load services');
  return json.data;
}

/** Create a new service (name, vehicle_type, category, description, current_price). */
export async function createService(payload) {
  const res  = await fetch(BASE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Create failed');
  return json.data;
}

/** Update a service (name, vehicle_type, category, description, current_price). */
export async function updateService(id, payload) {
  const res  = await fetch(`${BASE}/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Update failed');
  return json.data;
}

/** Soft-delete / deactivate a service (sets active = false). */
export async function deactivateService(id) {
  const res  = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Deactivate failed');
  return json;
}

/** Delete service alias. */
export const deleteService = deactivateService;

/** Fetch full price history for one service. */
export async function fetchPriceHistory(id) {
  const res  = await fetch(`${BASE}/${id}/price-history`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to load price history');
  return json.data;
}
