/**
 * Brazilian Number Utilities
 * Decimal separator: comma (,)
 * Thousands separator: dot (.)
 */

/**
 * Parse Brazilian number format
 * Examples:
 *   "17,90" -> 17.90
 *   "1.234,56" -> 1234.56
 *   "1234.56" -> 1234.56 (fallback for already formatted)
 */
export const toNum = (s) => {
  const t = String(s ?? '').trim();
  let result = 0;
  
  // Handle both separators (Brazilian format: 1.234,56)
  if (t.includes(',') && t.includes('.')) {
    result = parseFloat(t.replace(/\./g, '').replace(/,/g, '.')) || 0;
  }
  // Only comma (Brazilian decimal: 17,90)
  else if (t.includes(',')) {
    result = parseFloat(t.replace(/,/g, '.')) || 0;
  }
  // Standard format or no separators
  else {
    result = parseFloat(t) || 0;
  }
  
  // Fix floating point precision issues
  return Math.round(result * 100) / 100;
};

/**
 * Format number as Brazilian currency
 */
export const formatCurrency = (value) => {
  if (isNaN(value) || value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

/**
 * Format number as Brazilian number (with comma decimal)
 */
export const formatNumber = (value, decimals = 2) => {
  if (isNaN(value) || value === null || value === undefined) return '0,00';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format percentage
 */
export const formatPercent = (value, decimals = 1) => {
  if (isNaN(value) || value === null || value === undefined) return '0%';
  return `${formatNumber(value, decimals)}%`;
};

/**
 * Calculate percentage change
 */
export const percentChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

/**
 * Format percentage change with sign
 */
export const formatPercentChange = (current, previous) => {
  const change = percentChange(current, previous);
  if (change === null) return 'N/A';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${formatPercent(change)}`;
};

/**
 * Sum array values
 */
export const sum = (arr, fn = x => x) => {
  return arr.reduce((total, item) => total + fn(item), 0);
};

/**
 * Average array values
 */
export const avg = (arr, fn = x => x) => {
  if (!arr || arr.length === 0) return 0;
  return sum(arr, fn) / arr.length;
};

/**
 * Calculate median
 */
export const median = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * Round to decimals
 */
export const round = (value, decimals = 2) => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};
