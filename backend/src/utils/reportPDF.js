'use strict';

const PDFDocument = require('pdfkit');

function fmtLKR(amount) {
  const n = parseFloat(amount || 0);
  return 'Rs. ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthLabel(monthStr) {
  // '2026-08' → 'August 2026'
  const [y, m] = monthStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * generateReportPDF
 * Pipes a pdfkit A4 monthly report directly to the Express `res` object.
 * @param {object} reportData — data object from getMonthlyReport()
 * @param {object} res        — Express response
 */
function generateReportPDF(reportData, res) {
  const shopName    = process.env.SHOP_NAME    || 'Lanka Vehicle Service Centre';
  const shopAddress = process.env.SHOP_ADDRESS || 'Colombo, Sri Lanka';
  const shopPhone   = process.env.SHOP_PHONE   || '+94 11 000 0000';
  const shopEmail   = process.env.SHOP_EMAIL   || 'service@lankavsc.lk';

  const { month, summary, payment_split, top_services, daily_revenue } = reportData;
  const label = monthLabel(month);

  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${month}.pdf"`);
  doc.pipe(res);

  // ─── Palette ────────────────────────────────────────────────────────────────
  const AMBER   = '#F5A623';
  const DARK    = '#1A1A2E';
  const MUTED   = '#888';
  const GREEN   = '#22C55E';
  const BLUE    = '#3B82F6';
  const W       = 595 - 100; // usable width
  const L       = 50;        // left margin

  // ─── Header band ────────────────────────────────────────────────────────────
  doc.rect(0, 0, 595, 90).fill(DARK);

  doc.fillColor(AMBER).fontSize(18).font('Helvetica-Bold')
     .text(shopName, L, 20);
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica')
     .text(`${shopAddress}   ·   ${shopPhone}   ·   ${shopEmail}`, L, 44);

  // Right: MONTHLY REPORT
  doc.fillColor(AMBER).fontSize(11).font('Helvetica-Bold')
     .text('MONTHLY REPORT', L, 20, { align: 'right' });
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica')
     .text(label, L, 38, { align: 'right' })
     .text(`Generated: ${new Date().toLocaleDateString('en-LK')}`, L, 50, { align: 'right' });

  doc.fillColor(AMBER).moveTo(L, 100).lineTo(595 - L, 100).lineWidth(1).stroke();

  // ─── Summary KPI boxes ──────────────────────────────────────────────────────
  let y = 115;
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
     .text('PERIOD SUMMARY', L, y);
  y += 18;

  const kpis = [
    { label: 'Total Revenue (Paid)',  value: fmtLKR(summary.total_revenue),   color: GREEN },
    { label: 'Vehicles Serviced',     value: summary.vehicles_serviced,        color: BLUE  },
    { label: 'Total Visits',          value: summary.total_visits,             color: AMBER },
    { label: 'Pending Payments',      value: summary.pending_count,            color: '#EF4444' },
  ];

  const boxW = (W - 30) / 4;
  kpis.forEach((k, i) => {
    const bx = L + i * (boxW + 10);
    doc.rect(bx, y, boxW, 60).stroke(MUTED).fillOpacity(0.04).fillAndStroke('#F0F0F0', MUTED);
    doc.fillOpacity(1).fillColor(k.color).fontSize(18).font('Helvetica-Bold')
       .text(String(k.value), bx + 6, y + 8, { width: boxW - 12, align: 'center' });
    doc.fillColor('#555').fontSize(8).font('Helvetica')
       .text(k.label, bx + 4, y + 38, { width: boxW - 8, align: 'center' });
  });
  y += 80;

  // ─── Payment split ───────────────────────────────────────────────────────────
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
     .text('PAYMENT BREAKDOWN', L, y);
  y += 16;

  const totalPaid = payment_split.reduce((s, r) => s + r.amount, 0);
  payment_split.forEach(row => {
    const pct  = totalPaid > 0 ? row.amount / totalPaid : 0;
    const barW = Math.round(W * pct);

    doc.fillColor('#E5E7EB').rect(L, y + 4, W, 14).fill();
    const barColor = row.payment_method === 'Cash' ? GREEN : row.payment_method === 'Online' ? BLUE : '#999';
    doc.fillColor(barColor).rect(L, y + 4, barW, 14).fill();

    doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
       .text(`${row.payment_method}  ·  ${row.visit_count} visits`, L, y, { continued: true })
       .font('Helvetica').fillColor(MUTED)
       .text(`  ${fmtLKR(row.amount)}  (${Math.round(pct * 100)}%)`, { align: 'right' });
    y += 26;
  });
  y += 12;

  // ─── Top services table ──────────────────────────────────────────────────────
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
     .text('TOP SERVICES', L, y);
  y += 14;

  // Table header
  doc.rect(L, y, W, 18).fill('#F3F4F6');
  doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold')
     .text('#',           L + 4,         y + 5)
     .text('Service',     L + 18,        y + 5)
     .text('Category',    L + 220,       y + 5)
     .text('Visits',      L + 340,       y + 5, { width: 50, align: 'right' })
     .text('Revenue',     L + 390,       y + 5, { width: W - 390, align: 'right' });
  y += 18;

  const maxVisits = top_services.length > 0 ? top_services[0].visit_count : 1;
  top_services.forEach((svc, idx) => {
    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    doc.rect(L, y, W, 18).fill(rowBg);

    // Mini bar under service name
    const barFrac = svc.visit_count / maxVisits;
    doc.fillColor(AMBER + '44').rect(L + 18, y + 12, Math.round(180 * barFrac), 4).fill();

    doc.fillColor('#374151').fontSize(8).font('Helvetica')
       .text(`${idx + 1}`,                 L + 4,   y + 5)
       .text(svc.service_name,             L + 18,  y + 5, { width: 195, lineBreak: false })
       .text(svc.service_category || '-',  L + 220, y + 5, { width: 110, lineBreak: false })
       .text(String(svc.visit_count),      L + 340, y + 5, { width: 50, align: 'right' })
       .text(fmtLKR(svc.total_revenue),   L + 390, y + 5, { width: W - 390, align: 'right' });
    y += 18;
  });

  if (top_services.length === 0) {
    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
       .text('No service data for this month.', L, y);
    y += 18;
  }
  y += 16;

  // ─── Daily breakdown (compact) ───────────────────────────────────────────────
  if (daily_revenue && daily_revenue.length > 0) {
    doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
       .text('DAILY REVENUE BREAKDOWN', L, y);
    y += 14;

    const maxRev = Math.max(...daily_revenue.map(d => d.revenue), 1);
    const cellW  = Math.min(18, Math.floor(W / 31));

    daily_revenue.forEach(d => {
      const bh   = Math.round(40 * d.revenue / maxRev);
      const bx   = L + (d.day - 1) * (cellW + 1);
      const color = d.revenue > 0 ? AMBER : '#E5E7EB';
      doc.fillColor(color).rect(bx, y + (40 - bh), cellW, bh).fill();
      doc.fillColor('#999').fontSize(6).font('Helvetica')
         .text(String(d.day), bx, y + 42, { width: cellW, align: 'center' });
    });
    y += 60;
  }

  // ─── Footer ──────────────────────────────────────────────────────────────────
  const pageHeight = 842;
  doc.fillColor(DARK).rect(0, pageHeight - 40, 595, 40).fill();
  doc.fillColor('#AAA').fontSize(8).font('Helvetica')
     .text(
       `${shopName}  ·  ${label} Report  ·  This is a computer-generated report`,
       L, pageHeight - 24, { align: 'center', width: W },
     );

  doc.end();
}

module.exports = { generateReportPDF };
