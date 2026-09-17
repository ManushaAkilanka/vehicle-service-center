/** dashboard.js — API helpers for dashboard summary and monthly reports */

import { BACKEND_ORIGIN } from '../config';


const BASE = '/api';

/** GET /api/dashboard/summary */
export async function fetchSummary() {
  const res  = await fetch(`${BASE}/dashboard/summary`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch summary');
  return json.data;
}

/**
 * GET /api/reports/monthly?month=YYYY-MM
 * @param {string} month — e.g. '2026-08'
 */
export async function fetchMonthlyReport(month) {
  const res  = await fetch(`${BASE}/reports/monthly?month=${month}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch report');
  return json.data;
}

/**
 * Returns the URL for the monthly PDF report (used for download link).
 * @param {string} month — e.g. '2026-08'
 */
export function monthlyReportPdfUrl(month) {
  return `${BACKEND_ORIGIN}/api/reports/monthly/pdf?month=${month}`;
}
