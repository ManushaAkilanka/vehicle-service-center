import { useEffect, useRef } from 'react';
import { receiptPdfUrl } from '../api/visits';
import { fmtLKR } from '../utils/currency';
function fmtDateTime(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * ReceiptPage
 *
 * Renders a styled HTML receipt AND embeds the PDF from the backend in a hidden
 * iframe for printing.  Auto-triggers the browser print dialog on mount
 * (after a short delay to let the iframe load).
 *
 * @param {object} visit      — full visit object from recordPayment response
 * @param {function} onNewVisit — callback to start a fresh visit
 */
export default function ReceiptPage({ visit, onNewVisit }) {
  const iframeRef = useRef(null);
  const pdfUrl    = receiptPdfUrl(visit.id);

  const SHOP_NAME = 'Lanka Vehicle Service Centre';

  // Auto-trigger print when the PDF iframe loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function tryPrint() {
      try {
        iframe.contentWindow?.print();
      } catch (_) {
        // Some browsers block cross-origin print; open PDF in new tab as fallback
        window.open(pdfUrl, '_blank');
      }
    }

    iframe.addEventListener('load', tryPrint);
    // Fallback: trigger after 2.5 s if load event doesn't fire (e.g. PDF viewers)
    const timer = setTimeout(tryPrint, 2500);
    return () => {
      iframe.removeEventListener('load', tryPrint);
      clearTimeout(timer);
    };
  }, [pdfUrl]);

  return (
    <>
      {/*
        Hidden PDF iframe — used only to trigger browser print dialog.
        The visible receipt below is the HTML version.
      */}
      <iframe
        ref={iframeRef}
        src={pdfUrl}
        title="Receipt PDF"
        aria-hidden="true"
        style={{ display: 'none' }}
      />

      {/* ── Visible HTML receipt ────────────────────────── */}
      <div id="receipt-page" className="receipt-page-wrap">

        {/* Page title + actions */}
        <div className="receipt-page-toolbar">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
              🧾 Receipt — <span style={{ color: 'var(--amber)' }}>{visit.receipt_number}</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {fmtDateTime(visit.visit_date)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', textDecoration: 'none' }}
            >
              ⬇️ Download PDF
            </a>
            <button
              id="print-receipt-btn"
              className="btn-primary"
              style={{ height: 44 }}
              onClick={() => window.open(pdfUrl, '_blank')}
            >
              🖨️ Print Receipt
            </button>
            <button
              id="new-visit-from-receipt-btn"
              className="btn-secondary"
              style={{ height: 44 }}
              onClick={onNewVisit}
            >
              ＋ New Visit
            </button>
          </div>
        </div>

        {/* Receipt card */}
        <div className="receipt-html-card">
          {/* ── Header ───────────────────────────────────── */}
          <div className="receipt-html-header">
            <div>
              <div className="receipt-html-shopname">{SHOP_NAME}</div>
              <div className="receipt-html-shopinfo">
                123 Workshop Road, Bengaluru · +91 98765 43210
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="receipt-html-title">RECEIPT</div>
              <div style={{ fontSize: 12, color: 'rgba(245,166,35,.7)', marginTop: 4 }}>
                {visit.receipt_number}
              </div>
            </div>
          </div>

          {/* ── Info strip ───────────────────────────────── */}
          <div className="receipt-html-info">
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div className="rcpt-label">Date &amp; Time</div>
                <div className="rcpt-value">{fmtDateTime(visit.visit_date)}</div>
              </div>
              <div>
                <div className="rcpt-label">Payment Method</div>
                <div className="rcpt-value">{visit.payment_method || '—'}</div>
              </div>
              {visit.payment_reference && (
                <div>
                  <div className="rcpt-label">Reference</div>
                  <div className="rcpt-value">{visit.payment_reference}</div>
                </div>
              )}
            </div>

            {/* Right: vehicle */}
            <div style={{ textAlign: 'right' }}>
              <div className="receipt-plate-box">{visit.number_plate}</div>
              <div style={{ marginTop: 10 }}>
                <div className="rcpt-label">Owner</div>
                <div className="rcpt-value">{visit.owner_name}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div className="rcpt-label">Vehicle</div>
                <div className="rcpt-value">{visit.make} {visit.model} · {visit.vehicle_type}</div>
              </div>
            </div>
          </div>

          {/* ── Services table ────────────────────────────── */}
          <div className="receipt-html-table-wrap">
            <table className="receipt-html-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Technician(s)</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(visit.items || []).map((item, idx) => (
                  <tr key={item.item_id} className={idx % 2 === 0 ? 'even' : 'odd'}>
                    <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.service_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.service_category}</td>
                    <td>{(item.employees || []).map(e => e.full_name).join(', ') || '—'}</td>
                    <td style={{ textAlign: 'right', color: 'var(--amber)', fontWeight: 800 }}>
                      {fmtLKR(item.price_charged)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Total ─────────────────────────────────────── */}
          <div className="receipt-html-total-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                className="receipt-status-badge"
                data-status={visit.payment_status}
              >
                {(visit.payment_status || 'PENDING').toUpperCase()}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Paid via {visit.payment_method || '—'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)' }}>
                Total Paid
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--amber)', letterSpacing: '-0.5px' }}>
                {fmtLKR(visit.total_cost)}
              </div>
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────── */}
          <div className="receipt-html-footer">
            Thank you for choosing <strong>{SHOP_NAME}</strong>. We appreciate your business!
            <br />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              This is a computer-generated receipt and does not require a signature.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
