import { fmtLKR } from '../../utils/currency';
import { BACKEND_ORIGIN } from '../../config';

function fmtDate(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * VisitReceipt — shown after a visit is successfully created.
 * Displays a full breakdown and a "Proceed to Payment" CTA.
 */
export default function VisitReceipt({ visit, onNewVisit, onPayment }) {
  return (
    <div className="visit-receipt">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="receipt-header">
        <div>
          <div className="receipt-title">🧾 Visit Created</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {fmtDate(visit.visit_date)} · ID: <code style={{ fontSize: 11 }}>{visit.id}</code>
          </div>
        </div>
        <span className="receipt-badge">✅ Confirmed</span>
      </div>

      <div className="receipt-body">
        {/* ── Vehicle info ──────────────────────────────────── */}
        <div>
          <div className="receipt-section-title">Vehicle</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, background: 'var(--plate-bg)', color: 'var(--plate-text)', padding: '5px 14px', borderRadius: 6, border: '2px solid var(--plate-border)', letterSpacing: 3 }}>
              {visit.number_plate}
            </span>
            <div>
              <div style={{ fontWeight: 700 }}>{visit.owner_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {visit.make} {visit.model} · {visit.vehicle_type}
              </div>
            </div>
          </div>
        </div>

        {/* ── Service items ─────────────────────────────────── */}
        <div>
          <div className="receipt-section-title">Services Performed</div>
          {visit.items.map(item => (
            <div key={item.item_id} className="receipt-item">
              <div>
                <div className="receipt-item-name">{item.service_name}</div>
                <div className="receipt-item-emps">
                  👤 {item.employees.map(e => e.full_name).join(', ') || '—'}
                </div>
              </div>
              <div className="receipt-item-price">{fmtLKR(item.price_charged)}</div>
            </div>
          ))}
          <div className="receipt-total-row">
            <span className="receipt-total-label">Total</span>
            <span className="receipt-total-amount">{fmtLKR(visit.total_cost)}</span>
          </div>
        </div>

        {/* ── Photo (if any) ───────────────────────────────── */}
        {visit.photo_path && (
          <div>
            <div className="receipt-section-title">Vehicle Photo</div>
            <img
              src={`${BACKEND_ORIGIN}/${visit.photo_path}`}
              alt="Vehicle"
              style={{ width: '100%', maxWidth: 300, height: 180, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </div>
        )}
      </div>

      {/* ── Footer: actions ──────────────────────────────────── */}
      <div className="receipt-footer">
        <button className="btn-new-visit" onClick={onNewVisit}>
          ＋ New Visit
        </button>
        <button className="btn-payment" id="proceed-to-payment-btn" onClick={() => onPayment(visit)}>
          💳 Proceed to Payment — {fmtLKR(visit.total_cost)}
        </button>
      </div>
    </div>
  );
}
