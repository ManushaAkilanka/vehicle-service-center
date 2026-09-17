import { useState } from 'react';
import { deactivateService, fetchPriceHistory } from '../../api/services';
import { fmtLKR } from '../../utils/currency';

function fmtPrice(p) { return fmtLKR(p); }

function fmtDate(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getVehicleBadge(type) {
  switch (type) {
    case 'Bike':
      return { icon: '🏍️', label: 'Bike', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
    case 'Three Wheeler':
      return { icon: '🛺', label: 'Three Wheeler', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
    case 'Car':
    default:
      return { icon: '🚗', label: 'Car', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
  }
}

export default function ServiceCard({ service, isAdmin, onEdit, onDeactivated, onToast }) {
  const [showHistory,  setShowHistory]    = useState(false);
  const [history,      setHistory]        = useState([]);
  const [histLoading,  setHistLoading]    = useState(false);

  // ── Price history ─────────────────────────────────────────
  async function toggleHistory() {
    if (showHistory) { setShowHistory(false); return; }
    setHistLoading(true);
    setShowHistory(true);
    try {
      const rows = await fetchPriceHistory(service.id);
      setHistory(rows);
    } catch (err) {
      onToast('⚠️ ' + err.message);
    } finally {
      setHistLoading(false);
    }
  }

  // ── Deactivate / Delete ───────────────────────────────────
  async function handleDelete() {
    if (!window.confirm(`Delete "${service.name}" from catalog?`)) return;
    try {
      await deactivateService(service.id);
      onDeactivated(service.id);
      onToast('🗑️ Service deleted from catalog');
    } catch (err) {
      onToast('⚠️ ' + err.message);
    }
  }

  const badge = getVehicleBadge(service.vehicle_type);

  return (
    <div className="service-card">
      {/* ── Top row ──────────────────────────────────── */}
      <div className="service-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <span className="service-name">{service.name}</span>
        <span
          className="vehicle-tag"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            color: badge.color,
            background: badge.bg,
            border: `1px solid ${badge.border}`,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {badge.icon} {badge.label}
        </span>
      </div>

      {/* ── Description ──────────────────────────────── */}
      {service.description && (
        <p className="service-desc">{service.description}</p>
      )}

      {/* ── Footer: price + actions ───────────────────── */}
      <div className="service-card-footer">
        <div>
          <div className="service-price-label">Price (LKR)</div>
          <div className="service-price">{fmtPrice(service.current_price)}</div>
        </div>

        <div className="service-card-actions">
          {/* Price history */}
          <button
            className="btn-icon history"
            title="Price history"
            onClick={toggleHistory}
          >
            📈
          </button>

          {/* Edit service */}
          {isAdmin && (
            <button
              className="btn-icon"
              title="Edit service"
              onClick={() => onEdit(service)}
            >
              ✏️
            </button>
          )}

          {/* Delete service */}
          {isAdmin && (
            <button
              className="btn-icon danger"
              title="Delete service"
              onClick={handleDelete}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* ── Price history panel ───────────────────────── */}
      {showHistory && (
        <div className="price-history-panel">
          {histLoading ? (
            <p style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
          ) : history.length === 0 ? (
            <p style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 13 }}>No history yet</p>
          ) : (
            <table>
              <thead>
                <tr><th>Price</th><th>Effective From</th></tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>{fmtPrice(h.price)}</td>
                    <td>{fmtDate(h.effective_from)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
