'use strict';

/**
 * generateReceiptPDF
 *
 * Produces an A4 PDF receipt using pdfkit and pipes it directly into an
 * Express response object.  Call this from the controller; do NOT set
 * res.json() afterwards — the stream ends automatically via doc.end().
 *
 * @param {object} visit  — full visit row from visits.model.findById()
 * @param {object} res    — Express response
 */
const PDFDocument = require('pdfkit');

function fmtLKR(amount) {
  const n = parseFloat(amount || 0);
  return 'Rs. ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });
}

function generateReceiptPDF(visit, res) {
  const SHOP_NAME    = process.env.SHOP_NAME    || 'Vehicle Service Centre';
  const SHOP_ADDRESS = process.env.SHOP_ADDRESS || '123 Workshop Road, Bengaluru - 560001';
  const SHOP_PHONE   = process.env.SHOP_PHONE   || '+91 98765 43210';
  const SHOP_EMAIL   = process.env.SHOP_EMAIL   || 'service@vsc.local';

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });

  // Stream directly to response
  res.setHeader('Content-Type', 'application/pdf');
  const filename = `receipt-${visit.receipt_number || visit.id.slice(0, 8)}.pdf`;
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  doc.pipe(res);

  const W  = doc.page.width;   // 595.28 pts
  const H  = doc.page.height;  // 841.89 pts
  const M  = 45;               // margin
  const CW = W - 2 * M;       // usable content width

  /* ── Colours ─────────────────────────────────────────────── */
  const C_DARK    = '#0f0f1a';
  const C_AMBER   = '#d4920a';
  const C_AMBER2  = '#f5a623';
  const C_GRAY    = '#666666';
  const C_LGRAY   = '#f5f5f5';
  const C_BORDER  = '#dddddd';
  const C_WHITE   = '#ffffff';
  const C_TEXT    = '#1a1a1a';
  const C_GREEN   = '#16a34a';

  /* ── Helper: horizontal rule ─────────────────────────────── */
  function rule(y, color = C_BORDER, w = 0.5) {
    doc.save().moveTo(M, y).lineTo(W - M, y)
       .lineWidth(w).strokeColor(color).stroke().restore();
  }

  /* ── Helper: filled rect ─────────────────────────────────── */
  function fillRect(x, y, w, h, color) {
    doc.save().rect(x, y, w, h).fill(color).restore();
  }

  /* ═══════════════════════════════════════════════════════════
     HEADER BAND
     ═══════════════════════════════════════════════════════════ */
  const HDR_H = 100;
  fillRect(0, 0, W, HDR_H, C_DARK);

  // Left: accent side stripe
  fillRect(0, 0, 6, HDR_H, C_AMBER2);

  // Shop name
  doc.fill(C_WHITE).fontSize(22).font('Helvetica-Bold')
     .text(SHOP_NAME, M + 10, 22, { width: 320 });

  doc.fill(C_AMBER2).fontSize(9).font('Helvetica')
     .text(SHOP_ADDRESS, M + 10, 50);
  doc.fill('#aaaaaa')
     .text(`Ph: ${SHOP_PHONE}   |   ${SHOP_EMAIL}`, M + 10, 62);

  // Right: "RECEIPT" label
  doc.fill(C_AMBER2).fontSize(32).font('Helvetica-Bold')
     .text('RECEIPT', M, 28, { width: CW, align: 'right' });

  /* ═══════════════════════════════════════════════════════════
     INFO STRIP  (receipt no · date · payment)
     ═══════════════════════════════════════════════════════════ */
  const INFO_Y = HDR_H + 20;

  // Left column: receipt meta
  const COL1_X = M + 10;
  const COL2_X = W / 2 + 10;

  // --- Receipt Number
  doc.fill(C_GRAY).fontSize(7.5).font('Helvetica-Bold').text('RECEIPT NO.', COL1_X, INFO_Y);
  doc.fill(C_TEXT).fontSize(12).font('Helvetica-Bold')
     .text(visit.receipt_number || '—', COL1_X, INFO_Y + 11);

  // --- Date & Time
  doc.fill(C_GRAY).fontSize(7.5).font('Helvetica-Bold').text('DATE & TIME', COL1_X, INFO_Y + 32);
  doc.fill(C_TEXT).fontSize(10).font('Helvetica')
     .text(`${fmtDate(visit.visit_date)}  ${fmtTime(visit.visit_date)}`, COL1_X, INFO_Y + 43);

  // --- Payment Method
  doc.fill(C_GRAY).fontSize(7.5).font('Helvetica-Bold').text('PAYMENT METHOD', COL1_X, INFO_Y + 64);
  doc.fill(C_TEXT).fontSize(10).font('Helvetica')
     .text(visit.payment_method || 'Not recorded', COL1_X, INFO_Y + 75);

  // Right column: vehicle plate (styled box)
  const PLATE_W = 170;
  const PLATE_H = 34;
  const PLATE_X = W - M - PLATE_W - 10;
  const PLATE_Y = INFO_Y;

  // Plate background (yellow-white like Indian plate)
  fillRect(PLATE_X, PLATE_Y, PLATE_W, PLATE_H, '#FFF9E6');
  doc.save().rect(PLATE_X, PLATE_Y, PLATE_W, PLATE_H)
     .lineWidth(2).strokeColor('#C9A227').stroke().restore();

  doc.fill(C_TEXT).fontSize(16).font('Helvetica-Bold')
     .text(visit.number_plate || '—', PLATE_X, PLATE_Y + 9,
           { width: PLATE_W, align: 'center', characterSpacing: 3 });

  // Owner / vehicle below plate
  doc.fill(C_GRAY).fontSize(7.5).font('Helvetica-Bold')
     .text('OWNER', COL2_X, INFO_Y + 44);
  doc.fill(C_TEXT).fontSize(11).font('Helvetica-Bold')
     .text(visit.owner_name || '—', COL2_X, INFO_Y + 55);

  doc.fill(C_GRAY).fontSize(7.5).font('Helvetica-Bold')
     .text('VEHICLE', COL2_X, INFO_Y + 74);
  doc.fill(C_TEXT).fontSize(10).font('Helvetica')
     .text(`${visit.make || ''} ${visit.model || ''} · ${visit.vehicle_type || ''}`, COL2_X, INFO_Y + 85, { width: 200 });

  /* ═══════════════════════════════════════════════════════════
     SERVICES TABLE
     ═══════════════════════════════════════════════════════════ */
  let tableY = INFO_Y + 115;

  rule(tableY, C_BORDER, 0.5);
  tableY += 14;

  // "SERVICES PERFORMED" section heading
  doc.fill(C_AMBER).fontSize(8).font('Helvetica-Bold')
     .text('SERVICES PERFORMED', M + 4, tableY);
  tableY += 14;

  // Column definitions
  const T = {
    num:  { x: M,         w: 22  },
    name: { x: M + 26,    w: 170 },
    cat:  { x: M + 200,   w: 90  },
    emp:  { x: M + 294,   w: 140 },
    amt:  { x: M + 437,   w: 60  },
  };

  // Table header row
  const TH_H = 22;
  fillRect(M, tableY, CW, TH_H, C_DARK);

  const thY = tableY + 7;
  const thStyle = { fontSize: 7.5, font: 'Helvetica-Bold', fill: '#aaaaaa' };
  doc.fill('#aaaaaa').fontSize(7.5).font('Helvetica-Bold');
  doc.text('#',          T.num.x  + 6,  thY);
  doc.text('SERVICE',    T.name.x,      thY);
  doc.text('CATEGORY',   T.cat.x,       thY);
  doc.text('TECHNICIAN', T.emp.x,       thY);
  doc.text('AMOUNT',     T.amt.x,       thY, { width: T.amt.w, align: 'right' });

  tableY += TH_H;

  // Table rows
  const items = visit.items || [];
  let subtotal = 0;

  items.forEach((item, idx) => {
    const empNames = (item.employees || []).map(e => e.full_name).join(', ') || '—';
    const price    = parseFloat(item.price_charged || 0);
    subtotal      += price;

    // Estimate row height (allow for text wrap in narrow columns)
    const ROW_H = 28;
    const rowBg = idx % 2 === 0 ? C_WHITE : C_LGRAY;
    fillRect(M, tableY, CW, ROW_H, rowBg);

    const cellY = tableY + 9;

    doc.fill(C_GRAY).fontSize(8.5).font('Helvetica')
       .text(String(idx + 1), T.num.x + 6, cellY);

    doc.fill(C_TEXT).fontSize(8.5).font('Helvetica-Bold')
       .text(item.service_name || '—', T.name.x, cellY, { width: T.name.w - 4, ellipsis: true });

    doc.fill(C_GRAY).fontSize(8).font('Helvetica')
       .text(item.service_category || '—', T.cat.x, cellY, { width: T.cat.w - 4, ellipsis: true });

    doc.fill(C_TEXT).fontSize(8).font('Helvetica')
       .text(empNames, T.emp.x, cellY, { width: T.emp.w - 4, ellipsis: true });

    doc.fill(C_AMBER).fontSize(9.5).font('Helvetica-Bold')
       .text(fmtLKR(price), T.amt.x, cellY, { width: T.amt.w, align: 'right' });

    // row bottom border
    rule(tableY + ROW_H, '#eeeeee', 0.3);
    tableY += ROW_H;
  });

  /* ═══════════════════════════════════════════════════════════
     TOTAL BAND
     ═══════════════════════════════════════════════════════════ */
  tableY += 10;
  rule(tableY, C_BORDER, 1);
  tableY += 12;

  // Total row — dark band
  const TOT_H = 48;
  fillRect(M, tableY, CW, TOT_H, C_DARK);

  // Left: "TOTAL" label
  doc.fill('#888888').fontSize(10).font('Helvetica-Bold')
     .text('TOTAL AMOUNT DUE', M + 16, tableY + 16);

  // Right: amount
  doc.fill(C_AMBER2).fontSize(24).font('Helvetica-Bold')
     .text(fmtLKR(visit.total_cost), M, tableY + 12, { width: CW - 16, align: 'right' });

  tableY += TOT_H + 16;

  // Payment reference (if any)
  if (visit.payment_reference) {
    doc.fill(C_GRAY).fontSize(8.5).font('Helvetica')
       .text(`Transaction Reference: ${visit.payment_reference}`, M + 10, tableY);
    tableY += 16;
  }

  // Payment status badge
  const statusText   = (visit.payment_status || 'PENDING').toUpperCase();
  const badgeColor   = statusText === 'PAID' ? C_GREEN : '#d97706';
  const BADGE_W = 56;
  const BADGE_H = 18;
  fillRect(M + 10, tableY, BADGE_W, BADGE_H, badgeColor);
  doc.fill(C_WHITE).fontSize(7.5).font('Helvetica-Bold')
     .text(statusText, M + 10, tableY + 5, { width: BADGE_W, align: 'center' });

  /* ═══════════════════════════════════════════════════════════
     FOOTER
     ═══════════════════════════════════════════════════════════ */
  const FOOT_Y = H - 70;

  rule(FOOT_Y, C_BORDER, 0.5);

  // Accent stripe at very bottom
  fillRect(0, H - 6, W, 6, C_AMBER2);

  doc.fill(C_GRAY).fontSize(9).font('Helvetica')
     .text(`Thank you for choosing ${SHOP_NAME}. We appreciate your business!`,
           M, FOOT_Y + 14, { width: CW, align: 'center' });
  doc.fill('#aaaaaa').fontSize(8)
     .text(`${SHOP_ADDRESS}  |  ${SHOP_PHONE}  |  ${SHOP_EMAIL}`,
           M, FOOT_Y + 30, { width: CW, align: 'center' });

  doc.fill(C_GRAY).fontSize(7.5)
     .text('This is a computer-generated receipt and does not require a signature.',
           M, FOOT_Y + 46, { width: CW, align: 'center' });

  doc.end();
}

module.exports = { generateReceiptPDF };
