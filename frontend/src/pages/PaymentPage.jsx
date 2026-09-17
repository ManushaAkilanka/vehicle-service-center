import { useState, useEffect } from 'react';
import { recordPayment } from '../api/visits';
import { fmtLKR } from '../utils/currency';

/* ─── Load PayHere JS SDK dynamically ───────────────────────────────────────── */
function loadPayHereSDK(sdkUrl) {
  return new Promise((resolve, reject) => {
    if (window.payhere) { resolve(window.payhere); return; }
    const existing = document.getElementById('payhere-sdk-script');
    if (existing) {
      // Script tag exists but SDK not ready — wait for it
      existing.addEventListener('load',  () => resolve(window.payhere));
      existing.addEventListener('error', () => reject(new Error('PayHere SDK failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.id    = 'payhere-sdk-script';
    script.src   = sdkUrl || 'https://www.payhere.lk/lib/payhere.js';
    script.async = true;
    script.onload  = () => resolve(window.payhere);
    script.onerror = () => reject(new Error('Could not load PayHere SDK. Check internet connection.'));
    document.head.appendChild(script);
  });
}

/* ─── Component ─────────────────────────────────────────────────────────────── */
/**
 * PaymentPage
 *
 * Full-screen payment view shown between VisitReceipt and ReceiptPage.
 * Offers Cash and Online (PayHere — Google Pay / Visa / Mastercard / local cards).
 * Automatically disables Online if no internet is detected.
 *
 * @param {object}   visit    — full visit object from createVisit response
 * @param {function} onPaid   — called with updatedVisit after payment confirmed
 * @param {function} onBack   — go back to visit summary
 */
export default function PaymentPage({ visit, onPaid, onBack }) {
  const [selected,   setSelected]   = useState('Cash');
  const [online,     setOnline]     = useState(null);   // null=checking, true, false
  const [onlineMsg,  setOnlineMsg]  = useState('Checking internet connection…');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  /* Check connectivity on mount and when network state changes */
  useEffect(() => {
    function check() {
      const navOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!navOnline) {
        setOnline(false);
        setOnlineMsg('No internet connection detected. Only cash payment is available.');
        setSelected('Cash');
        return;
      }

      fetch('/api/payments/connectivity')
        .then(r => r.json())
        .then(json => {
          const available = json.data?.online ?? navOnline;
          setOnline(available);
          setOnlineMsg(json.data?.message || (available ? 'Online payment is available' : 'PayHere is unreachable.'));
          if (!available) setSelected('Cash');
        })
        .catch(() => {
          if (navOnline) {
            setOnline(true);
            setOnlineMsg('Online payment is available');
          } else {
            setOnline(false);
            setOnlineMsg('No internet connection detected. Only cash payment is available.');
            setSelected('Cash');
          }
        });
    }

    check();
    window.addEventListener('online', check);
    window.addEventListener('offline', check);
    return () => {
      window.removeEventListener('online', check);
      window.removeEventListener('offline', check);
    };
  }, []);

  /* ── Cash payment ─────────────────────────────────────────────────────────── */
  async function handleCash() {
    setLoading(true);
    setError('');
    try {
      const updated = await recordPayment(visit.id, { payment_method: 'Cash' });
      onPaid(updated);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  /* ── Online payment via PayHere ───────────────────────────────────────────── */
  async function handleOnline() {
    setLoading(true);
    setError('');
    try {
      // 1. Get PayHere payload (with hash) from backend
      const initRes = await fetch('/api/payments/payhere/init', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          visit_id:   visit.id,
          return_url: window.location.origin,
          cancel_url: window.location.origin,
        }),
      });
      const initJson = await initRes.json();

      if (!initRes.ok) {
        setError(initJson.message || 'Online payment is not available. Please use cash.');
        setOnline(false);
        setSelected('Cash');
        setLoading(false);
        return;
      }

      const { payload, sdk_url } = initJson.data;

      // 2. Load PayHere JS SDK or fallback to form redirect
      // switch sandbox=true to false and swap in live merchant credentials when ready to go live
      try {
        const payhere = await loadPayHereSDK(sdk_url);

        // 3. Register callbacks
        payhere.onCompleted = async (orderId) => {
          // Task A & B: NEVER mark visit as paid from frontend.
          // Poll server to confirm that the server-side IPN notify_url verified the signature and marked it paid.
          setLoading(true);
          const maxAttempts = 10;
          let attempt = 0;

          const checkServerStatus = async () => {
            attempt++;
            try {
              const res = await fetch(`/api/payments/by-order/${encodeURIComponent(orderId || payload.order_id)}?sandbox_confirm=true`);
              const json = await res.json();
              if (json.data && json.data.payment_status === 'paid') {
                setLoading(false);
                onPaid(json.data);
                return;
              }
              if (json.data && json.data.payment_status === 'failed') {
                setLoading(false);
                setError('Payment failed or was declined. Please try again or choose cash.');
                return;
              }
            } catch (err) {
              console.warn('[Payment] Polling attempt error:', err.message);
            }

            if (attempt < maxAttempts) {
              setTimeout(checkServerStatus, 1000);
            } else {
              setLoading(false);
              setError('Payment submitted, but verification is still pending. If card was charged, receipt will be generated shortly.');
            }
          };

          // Give IPN callback a moment to arrive, then poll
          setTimeout(checkServerStatus, 1000);
        };

        payhere.onDismissed = () => {
          setLoading(false);
          setError('Payment was cancelled. You can try again or choose cash.');
        };

        payhere.onError = (errMsg) => {
          setLoading(false);
          setError(
            errMsg?.toLowerCase().includes('unauthorized') || errMsg?.toLowerCase().includes('merchant')
              ? 'PayHere Error: Unauthorized request. Please ensure your PayHere Sandbox Merchant ID & Secret are configured in backend/.env for domain ' + window.location.host
              : 'PayHere error: ' + (errMsg || 'Unknown error. Please try again.')
          );
        };

        // 4. Open PayHere popup
        payhere.startPayment(payload);
      } catch (sdkErr) {
        console.warn('PayHere SDK popup unavailable, falling back to hosted form redirect', sdkErr);
        const checkoutUrl = payload.sandbox !== false
          ? 'https://sandbox.payhere.lk/pay/checkout'
          : 'https://www.payhere.lk/pay/checkout';

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = checkoutUrl;

        for (const [key, val] of Object.entries(payload)) {
          if (val !== undefined && val !== null) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(val);
            form.appendChild(input);
          }
        }
        document.body.appendChild(form);
        form.submit();
      }

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const serviceList = (visit.items || []).map(i => i.service_name).join(' · ');
  const isChecking  = online === null;
  const isOffline   = online === false;

  return (
    <div className="payment-page">

      {/* ── Vehicle header ─────────────────────────────────────── */}
      <div className="pay-vehicle-header">
        <div className="visit-vehicle-plate">{visit.number_plate}</div>
        <div>
          <div className="visit-vehicle-name">{visit.owner_name}</div>
          <div className="visit-vehicle-meta" style={{ maxWidth: 420 }}>{serviceList}</div>
        </div>
      </div>

      {/* ── Amount card ────────────────────────────────────────── */}
      <div className="pay-amount-card">
        <div className="pay-amount-label">Total Amount Due</div>
        <div className="pay-amount-value">{fmtLKR(visit.total_cost)}</div>
        <div className="pay-amount-currency">Sri Lankan Rupees (LKR)</div>
      </div>

      {/* ── Connectivity status banner ─────────────────────────── */}
      {(isChecking || isOffline) && (
        <div className={`pay-status-banner ${isOffline ? 'offline' : 'checking'}`}>
          {isChecking
            ? '📡 Checking internet connection…'
            : `📵 ${onlineMsg}`}
        </div>
      )}

      {/* ── Payment method cards ───────────────────────────────── */}
      <div className="pay-methods-grid">

        {/* Cash */}
        <button
          id="pay-cash-btn"
          className={`pay-method-card${selected === 'Cash' ? ' selected' : ''}`}
          onClick={() => !loading && setSelected('Cash')}
          disabled={loading}
        >
          <div className="pay-method-icon">💵</div>
          <div className="pay-method-name">Cash</div>
          <div className="pay-method-desc">Pay at the service counter</div>
          {selected === 'Cash' && <div className="pay-method-check">✓</div>}
        </button>

        {/* Online */}
        <button
          id="pay-online-btn"
          className={`pay-method-card${selected === 'Online' ? ' selected' : ''}${isChecking || isOffline ? ' pay-card-disabled' : ''}`}
          onClick={() => !loading && !isChecking && !isOffline && setSelected('Online')}
          disabled={loading || isChecking || isOffline}
          title={isOffline ? onlineMsg : ''}
        >
          <div className="pay-method-icon">💳</div>
          <div className="pay-method-name">Online</div>
          <div className="pay-method-desc">
            {isChecking
              ? 'Checking…'
              : isOffline
                ? 'Not available offline'
                : 'Google Pay · Visa · Mastercard · Local bank cards'}
          </div>
          <div className="pay-method-logos">
            {!isOffline && !isChecking && (
              <>
                <span className="pay-logo-chip">G Pay</span>
                <span className="pay-logo-chip">Visa</span>
                <span className="pay-logo-chip">MC</span>
              </>
            )}
          </div>
          {selected === 'Online' && <div className="pay-method-check">✓</div>}
        </button>
      </div>

      {/* Error */}
      {error && <div className="error-banner" style={{ marginTop: 0 }}>⚠️ {error}</div>}

      {/* ── Action row ─────────────────────────────────────────── */}
      <div className="pay-action-row">
        <button
          className="btn-secondary"
          style={{ height: 56, padding: '0 28px', fontSize: 14 }}
          onClick={onBack}
          disabled={loading}
        >
          ← Back to Summary
        </button>

        <button
          id="confirm-payment-btn"
          className="pay-confirm-btn"
          onClick={selected === 'Cash' ? handleCash : handleOnline}
          disabled={loading || isChecking}
        >
          {loading ? (
            <><span className="spinner" style={{ borderTopColor: '#000' }} /> Processing…</>
          ) : selected === 'Cash' ? (
            `✅ Confirm Cash — ${fmtLKR(visit.total_cost)}`
          ) : (
            `💳 Pay via PayHere — ${fmtLKR(visit.total_cost)}`
          )}
        </button>
      </div>

      {/* PayHere note */}
      {selected === 'Online' && !isOffline && (
        <p className="pay-note">
          Powered by <strong>PayHere</strong> — Sri Lanka's trusted payment gateway.
          Your payment is secured with 256-bit SSL encryption.
        </p>
      )}
    </div>
  );
}
