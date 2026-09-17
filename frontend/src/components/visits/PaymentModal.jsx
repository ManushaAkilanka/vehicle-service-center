import { useState } from 'react';
import { recordPayment } from '../../api/visits';

const METHODS = [
  { id: 'Cash', icon: '💵', label: 'Cash' },
  { id: 'Card', icon: '💳', label: 'Card' },
  { id: 'UPI',  icon: '📱', label: 'UPI'  },
  { id: 'Other',icon: '🏦', label: 'Other' },
];

function fmtINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(n);
}

export default function PaymentModal({ visit, onClose, onPaid }) {
  const [method,    setMethod]    = useState('Cash');
  const [reference, setReference] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const needsRef = method === 'Card' || method === 'UPI';

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      const updated = await recordPayment(visit.id, {
        payment_method:    method,
        payment_reference: reference.trim() || null,
      });
      onPaid(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay" id="payment-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ width: 460, maxWidth: '95vw' }}>
        {/* Header */}
        <div className="form-panel-header">
          <span className="form-panel-title">💳 Confirm Payment</span>
          <button className="btn-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Amount due */}
          <div style={{
            background: 'var(--bg-page)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 24,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)' }}>Amount Due</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--amber)', letterSpacing: '-0.5px' }}>
                {fmtINR(visit.total_cost)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{visit.number_plate}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{visit.owner_name}</div>
            </div>
          </div>

          {/* Payment method picker */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)', marginBottom: 10 }}>
              Payment Method
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {METHODS.map(m => (
                <button
                  key={m.id}
                  id={`pay-method-${m.id.toLowerCase()}`}
                  onClick={() => { setMethod(m.id); setReference(''); }}
                  style={{
                    padding: '14px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${method === m.id ? 'var(--amber)' : 'var(--border)'}`,
                    background: method === m.id ? 'rgba(245,166,35,.12)' : 'var(--bg-input)',
                    color: method === m.id ? 'var(--amber)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13,
                    transition: 'all var(--tx-fast)',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference input (Card / UPI) */}
          {needsRef && (
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="pay-reference" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                {method === 'Card' ? 'Card Last 4 Digits / Reference' : 'UPI Transaction ID'}
              </label>
              <input
                id="pay-reference"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder={method === 'Card' ? 'e.g. 4242 or TXN-ID' : 'e.g. UPI-12345678'}
                style={{
                  width: '100%', height: 48, padding: '0 14px',
                  background: 'var(--bg-input)', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                  fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
        </div>

        {/* Footer */}
        <div className="form-footer" style={{ borderTop: '1px solid var(--border)', padding: '16px 24px' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            id="confirm-payment-btn"
            className="btn-primary"
            style={{ background: 'var(--green)', minWidth: 160, fontSize: 15, fontWeight: 900 }}
            onClick={handleConfirm}
            disabled={loading || (needsRef && !reference.trim())}
          >
            {loading
              ? <><span className="spinner" style={{ borderTopColor: '#000' }} /> Processing…</>
              : `✅ Confirm ${fmtINR(visit.total_cost)}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}
