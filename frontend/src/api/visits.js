/** visits.js — API helpers for the visit workflow */

import { BACKEND_ORIGIN } from '../config';


/**
 * Upload a vehicle photo.
 * Returns { path, url, filename, size } — `path` goes into the visit record,
 * `url` is the full static URL ready for display in an <img> tag.
 */
export async function uploadVisitPhoto(file) {
  const form = new FormData();
  form.append('photo', file);
  const res  = await fetch('/api/uploads/vehicle-photo', { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Photo upload failed');
  return json.data;
}

/**
 * Create a visit.
 * @param {object} payload — { vehicle_id, services: [{service_id, employee_ids}], photo_path }
 */
export async function createVisit(payload) {
  const res  = await fetch('/api/visits', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Visit creation failed');
  return json.data;
}

/** Get full visit detail by ID */
export async function fetchVisit(id) {
  const res  = await fetch(`/api/visits/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Visit not found');
  return json.data;
}

/**
 * Record payment for a visit.
 * @param {string} id
 * @param {object} payload — { payment_method: 'Cash'|'Card'|'UPI'|'Other', payment_reference?: string }
 */
export async function recordPayment(id, payload) {
  const res  = await fetch(`/api/visits/${id}/payment`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Payment recording failed');
  return json.data;
}

/**
 * Returns the URL for the PDF receipt (used for iframe src / download link).
 * The backend streams the PDF at this URL.
 */
export function receiptPdfUrl(id) {
  return `${BACKEND_ORIGIN}/api/visits/${id}/receipt`;
}

