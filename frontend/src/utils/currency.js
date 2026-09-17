/**
 * Currency formatting for Sri Lanka (LKR — Sri Lankan Rupee)
 * Symbol: Rs.  |  ISO code: LKR
 */

/**
 * Format a number as LKR — e.g. "Rs. 1,500.00"
 * @param {number|string} amount
 * @returns {string}
 */
export function fmtLKR(amount) {
  const n = parseFloat(amount || 0);
  return 'Rs.\u00A0' + n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format as compact LKR without the symbol — e.g. "1,500.00"
 */
export function fmtLKRRaw(amount) {
  return parseFloat(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
