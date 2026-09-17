'use strict';

const pool = require('../db/pool');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/summary
// Returns four KPI cards for today's snapshot and the running month total.
// All queries run in parallel for speed.
// ─────────────────────────────────────────────────────────────────────────────
async function getSummary(req, res, next) {
  try {
    const [
      [[today]],
      [[pending]],
      [[month]],
      [[allTime]],
    ] = await Promise.all([

      // ── Today ──────────────────────────────────────────────────────────────
      pool.query(`
        SELECT
          COUNT(DISTINCT vehicle_id)                                                AS today_vehicles,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_cost END), 0)  AS today_revenue,
          COUNT(*)                                                                   AS today_visits
        FROM service_visits
        WHERE DATE(visit_date) = CURDATE()
      `),

      // ── Pending payments ───────────────────────────────────────────────────
      pool.query(`
        SELECT COUNT(*) AS pending_count
        FROM service_visits
        WHERE payment_status IS NULL OR payment_status = 'pending'
      `),

      // ── This calendar month ────────────────────────────────────────────────
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_cost END), 0) AS month_revenue,
          COUNT(DISTINCT vehicle_id)                                                AS month_vehicles,
          COUNT(*)                                                                  AS month_visits
        FROM service_visits
        WHERE DATE_FORMAT(visit_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
      `),

      // ── All-time totals ────────────────────────────────────────────────────
      pool.query(`
        SELECT
          COUNT(DISTINCT vehicle_id)                                                AS total_vehicles,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_cost END), 0)  AS total_revenue,
          COUNT(*)                                                                   AS total_visits
        FROM service_visits
      `),
    ]);

    res.json({
      status: 'ok',
      data: {
        today: {
          vehicles: today.today_vehicles,
          revenue:  parseFloat(today.today_revenue),
          visits:   today.today_visits,
        },
        pending_count: pending.pending_count,
        month: {
          revenue:  parseFloat(month.month_revenue),
          vehicles: month.month_vehicles,
          visits:   month.month_visits,
        },
        all_time: {
          vehicles: allTime.total_vehicles,
          revenue:  parseFloat(allTime.total_revenue),
          visits:   allTime.total_visits,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/monthly?month=YYYY-MM
// Full monthly analytics — revenue, vehicle count, payment split, top services.
// ─────────────────────────────────────────────────────────────────────────────
async function getMonthlyReport(req, res, next) {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        status:  'error',
        message: 'Query param `month` must be in YYYY-MM format (e.g. 2026-08)',
      });
    }

    const [
      [[summary]],
      [paymentSplit],
      [topServices],
      [dailyRevenue],
    ] = await Promise.all([

      // ── Summary totals ─────────────────────────────────────────────────────
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_cost END), 0) AS total_revenue,
          COALESCE(SUM(total_cost), 0)                                             AS gross_revenue,
          COUNT(DISTINCT vehicle_id)                                                AS vehicles_serviced,
          COUNT(*)                                                                  AS total_visits,
          SUM(CASE WHEN payment_status = 'pending' OR payment_status IS NULL THEN 1 ELSE 0 END) AS pending_count
        FROM service_visits
        WHERE DATE_FORMAT(visit_date, '%Y-%m') = ?
      `, [month]),

      // ── Cash vs Online breakdown ───────────────────────────────────────────
      pool.query(`
        SELECT
          COALESCE(payment_method, 'Pending')  AS payment_method,
          COUNT(*)                              AS visit_count,
          COALESCE(SUM(total_cost), 0)          AS amount
        FROM service_visits
        WHERE DATE_FORMAT(visit_date, '%Y-%m') = ?
        GROUP BY payment_method
        ORDER BY amount DESC
      `, [month]),

      // ── Top 5 services by visit count ─────────────────────────────────────
      pool.query(`
        SELECT
          s.name                               AS service_name,
          s.category                           AS service_category,
          COUNT(svi.id)                        AS visit_count,
          COALESCE(SUM(svi.price_charged), 0)  AS total_revenue
        FROM service_visit_items  svi
        JOIN services             s   ON svi.service_id = s.id
        JOIN service_visits       sv  ON svi.visit_id   = sv.id
        WHERE DATE_FORMAT(sv.visit_date, '%Y-%m') = ?
        GROUP BY s.id, s.name, s.category
        ORDER BY visit_count DESC
        LIMIT 5
      `, [month]),

      // ── Daily revenue breakdown (for sparkline / table) ───────────────────
      pool.query(`
        SELECT
          DAY(visit_date)                                                         AS day,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_cost END), 0) AS revenue,
          COUNT(*)                                                                 AS visits
        FROM service_visits
        WHERE DATE_FORMAT(visit_date, '%Y-%m') = ?
        GROUP BY DAY(visit_date)
        ORDER BY day
      `, [month]),
    ]);

    res.json({
      status: 'ok',
      data: {
        month,
        summary: {
          total_revenue:    parseFloat(summary.total_revenue),
          gross_revenue:    parseFloat(summary.gross_revenue),
          vehicles_serviced: summary.vehicles_serviced,
          total_visits:     summary.total_visits,
          pending_count:    summary.pending_count,
        },
        payment_split: paymentSplit.map(r => ({
          payment_method: r.payment_method,
          visit_count:    r.visit_count,
          amount:         parseFloat(r.amount),
        })),
        top_services: topServices.map(r => ({
          service_name:     r.service_name,
          service_category: r.service_category,
          visit_count:      r.visit_count,
          total_revenue:    parseFloat(r.total_revenue),
        })),
        daily_revenue: dailyRevenue.map(r => ({
          day:     r.day,
          revenue: parseFloat(r.revenue),
          visits:  r.visits,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/monthly/pdf?month=YYYY-MM
// Streams a pdfkit A4 PDF of the monthly report.
// ─────────────────────────────────────────────────────────────────────────────
async function getMonthlyReportPDF(req, res, next) {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        status:  'error',
        message: 'Query param `month` must be in YYYY-MM format',
      });
    }

    // Re-use the report data query (inline for self-containment)
    const fakeRes = { json: d => d };
    const data = await new Promise((resolve, reject) => {
      const r = { query: { month }, params: {} };
      const s = {
        json: (d) => resolve(d),
        status: () => ({ json: (d) => reject(new Error(d.message)) }),
      };
      getMonthlyReport(r, s, reject);
    });

    const { generateReportPDF } = require('../utils/reportPDF');
    generateReportPDF(data.data, res);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getMonthlyReport, getMonthlyReportPDF };
