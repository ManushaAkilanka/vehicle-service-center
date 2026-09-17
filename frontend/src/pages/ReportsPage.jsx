import { useState, useEffect } from 'react';
import { fetchMonthlyReport, monthlyReportPdfUrl } from '../api/dashboard';
import { fmtLKR } from '../utils/currency';

/* Current month as YYYY-MM */
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/* Human-readable month label */
function monthLabel(m) {
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1, 1)
    .toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/* Horizontal progress bar */
function Bar({ pct, color }) {
  return (
    <div style={{
      height: 8, borderRadius: 99, background: 'var(--border)',
      overflow: 'hidden', marginTop: 6,
    }}>
      <div style={{
        height: '100%', width: `${Math.min(100, Math.round(pct))}%`,
        background: color, borderRadius: 99,
        transition: 'width .5s ease',
      }} />
    </div>
  );
}

export default function ReportsPage() {
  const [month,   setMonth]   = useState(currentMonth());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function load(m) {
    setLoading(true);
    setError('');
    try {
      const d = await fetchMonthlyReport(m);
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(month); }, [month]);

  const pdfUrl    = monthlyReportPdfUrl(month);
  const { summary = {}, payment_split = [], top_services = [], daily_revenue = [] } = data || {};

  const maxRevenue  = Math.max(...daily_revenue.map(d => d.revenue), 1);
  const maxServices = top_services.length > 0 ? top_services[0].visit_count : 1;
  const totalPaid   = payment_split.reduce((s, r) => s + r.amount, 0);

  const payColor = (method) => {
    if (method === 'Cash')   return 'var(--green)';
    if (method === 'Online') return 'var(--blue)';
    return 'var(--text-muted)';
  };

  return (
    <div className="reports-page">

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="reports-toolbar">
        <div>
          <h1 className="dash-title">📊 Monthly Report</h1>
          <p className="dash-date">
            {data ? monthLabel(month) : 'Select a month to view analytics'}
          </p>
        </div>
        <div className="reports-controls">
          <input
            id="report-month-picker"
            type="month"
            value={month}
            max={currentMonth()}
            onChange={e => setMonth(e.target.value)}
            className="month-picker"
          />
          <a
            id="download-pdf-btn"
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8,
                     padding: '0 20px', textDecoration: 'none', opacity: loading ? .5 : 1 }}
          >
            ⬇️ Download PDF
          </a>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* ── Summary KPI cards ───────────────────────────────────── */}
      <div className="kpi-grid">
        {[
          { icon: '💰', label: 'Revenue Collected', value: fmtLKR(summary.total_revenue ?? 0), color: 'var(--amber)' },
          { icon: '🚗', label: 'Vehicles Serviced',  value: summary.vehicles_serviced ?? 0,     color: 'var(--blue)' },
          { icon: '📋', label: 'Total Visits',        value: summary.total_visits ?? 0,          color: 'var(--green)' },
          { icon: '⏳', label: 'Pending Payments',    value: summary.pending_count ?? 0,         color: summary.pending_count > 0 ? '#EF4444' : 'var(--green)' },
        ].map(card => (
          <div key={card.label} className="kpi-card" style={{ '--kpi-color': card.color }}>
            <div className="kpi-icon">{card.icon}</div>
            <div className="kpi-body">
              <div className="kpi-label">{card.label}</div>
              <div className="kpi-value">
                {loading ? <span style={{ opacity: .4 }}>—</span> : card.value}
              </div>
            </div>
            <div className="kpi-accent" />
          </div>
        ))}
      </div>

      <div className="reports-grid-2col">

        {/* ── Payment Breakdown ──────────────────────────────────── */}
        <div className="report-panel">
          <div className="report-panel-title">💳 Payment Breakdown</div>
          {loading
            ? <div className="report-loading">Loading…</div>
            : payment_split.length === 0
              ? <div className="report-empty">No paid visits this month.</div>
              : payment_split.map(row => (
                <div key={row.payment_method} className="pay-split-row">
                  <div className="pay-split-header">
                    <span style={{ fontWeight: 700, color: payColor(row.payment_method) }}>
                      {row.payment_method}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {row.visit_count} visit{row.visit_count !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      {fmtLKR(row.amount)}
                    </span>
                  </div>
                  <Bar pct={totalPaid > 0 ? (row.amount / totalPaid) * 100 : 0} color={payColor(row.payment_method)} />
                </div>
              ))
          }
        </div>

        {/* ── Top Services ─────────────────────────────────────────── */}
        <div className="report-panel">
          <div className="report-panel-title">⚙️ Top Services</div>
          {loading
            ? <div className="report-loading">Loading…</div>
            : top_services.length === 0
              ? <div className="report-empty">No services recorded this month.</div>
              : top_services.map((svc, i) => (
                <div key={svc.service_name} className="top-svc-row">
                  <div className="top-svc-rank">{i + 1}</div>
                  <div className="top-svc-info">
                    <div className="top-svc-name">{svc.service_name}</div>
                    <div className="top-svc-cat">{svc.service_category}</div>
                    <Bar pct={(svc.visit_count / maxServices) * 100} color="var(--amber)" />
                  </div>
                  <div className="top-svc-stats">
                    <div style={{ fontWeight: 800, color: 'var(--amber)', fontSize: 15 }}>
                      {svc.visit_count}×
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {fmtLKR(svc.total_revenue)}
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* ── Daily Revenue Bar Chart ───────────────────────────────── */}
      {daily_revenue.length > 0 && !loading && (
        <div className="report-panel">
          <div className="report-panel-title">📅 Daily Revenue — {monthLabel(month)}</div>
          <div className="daily-chart">
            {daily_revenue.map(d => (
              <div key={d.day} className="daily-bar-col" title={`Day ${d.day}: ${fmtLKR(d.revenue)} · ${d.visits} visit${d.visits !== 1 ? 's' : ''}`}>
                <div
                  className="daily-bar"
                  style={{ height: `${Math.round((d.revenue / maxRevenue) * 100)}%` }}
                />
                <div className="daily-bar-label">{d.day}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
