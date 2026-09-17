import { useState, useEffect, useCallback } from 'react';
import { fetchSummary } from '../api/dashboard';
import { fmtLKR } from '../utils/currency';

/* ─── Mini Metric Card ───────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color, loading }) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color }}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        {loading
          ? <div className="kpi-value kpi-loading">—</div>
          : <div className="kpi-value">{value}</div>
        }
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      <div className="kpi-accent" />
    </div>
  );
}

/* ─── Quick Action Button ────────────────────────────────────────────────────── */
function QuickAction({ icon, label, desc, onClick, id }) {
  return (
    <button id={id} className="qa-btn" onClick={onClick}>
      <span className="qa-icon">{icon}</span>
      <div>
        <div className="qa-label">{label}</div>
        <div className="qa-desc">{desc}</div>
      </div>
      <span className="qa-arrow">›</span>
    </button>
  );
}

/* ─── DashboardPage ─────────────────────────────────────────────────────────── */
export default function DashboardPage({ onGoTo }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await fetchSummary();
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60 s
  useEffect(() => {
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-LK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="dashboard-page">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Good {greeting()}, Welcome back 👋</h1>
          <p className="dash-date">{dateStr}</p>
        </div>
        <button className="btn-secondary dash-refresh" onClick={load} disabled={loading} title="Refresh">
          <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
          {loading ? ' Refreshing…' : ' Refresh'}
        </button>
      </div>

      {error && <div className="error-banner">⚠️ {error} <button className="btn-link" onClick={load}>Retry</button></div>}

      {/* ── KPI cards ───────────────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          icon="🚗" label="Today's Visits"
          value={loading ? '—' : data?.today?.visits ?? 0}
          sub={loading ? '' : `${data?.today?.vehicles ?? 0} unique vehicles`}
          color="var(--blue)" loading={false}
        />
        <KpiCard
          icon="💰" label="Today's Revenue"
          value={loading ? '—' : fmtLKR(data?.today?.revenue ?? 0)}
          sub="Paid visits only"
          color="var(--amber)" loading={false}
        />
        <KpiCard
          icon="⏳" label="Pending Payments"
          value={loading ? '—' : data?.pending_count ?? 0}
          sub="Awaiting settlement"
          color={data?.pending_count > 0 ? '#EF4444' : 'var(--green)'} loading={false}
        />
        <KpiCard
          icon="📅" label="This Month's Revenue"
          value={loading ? '—' : fmtLKR(data?.month?.revenue ?? 0)}
          sub={loading ? '' : `${data?.month?.visits ?? 0} visits · ${data?.month?.vehicles ?? 0} vehicles`}
          color="var(--green)" loading={false}
        />
      </div>

      {/* ── All-time totals strip ────────────────────────────────── */}
      {data?.all_time && !loading && (
        <div className="dash-totals-strip">
          <span className="totals-label">All-time totals:</span>
          <span className="totals-item">🔧 <strong>{data.all_time.visits}</strong> visits</span>
          <span className="totals-sep">·</span>
          <span className="totals-item">🚗 <strong>{data.all_time.vehicles}</strong> vehicles</span>
          <span className="totals-sep">·</span>
          <span className="totals-item">💰 <strong>{fmtLKR(data.all_time.revenue)}</strong> revenue</span>
        </div>
      )}

      {/* ── Quick actions ────────────────────────────────────────── */}
      <div className="dash-section-title">Quick Actions</div>
      <div className="qa-grid">
        <QuickAction
          id="qa-find-vehicle"
          icon="🔍" label="Find Vehicle"
          desc="Look up by number plate"
          onClick={() => onGoTo('vehicles')}
        />
        <QuickAction
          id="qa-new-visit"
          icon="📋" label="New Service Visit"
          desc="Start a new service job"
          onClick={() => onGoTo('newvisit')}
        />
        <QuickAction
          id="qa-manage-services"
          icon="⚙️" label="Manage Services"
          desc="Edit catalog &amp; prices"
          onClick={() => onGoTo('services')}
        />
        <QuickAction
          id="qa-monthly-report"
          icon="📊" label="Monthly Report"
          desc="Revenue &amp; analytics"
          onClick={() => onGoTo('reports')}
        />
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
