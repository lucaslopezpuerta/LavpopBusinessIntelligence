// formatters.js v1.0
// Centralized formatting utilities for consistent data display
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial implementation
//   - Consolidated formatCurrency from 5+ components
//   - Consolidated formatNumber from 5+ components
//   - Added formatPercent, formatDate, formatPhone
//   - Brazilian locale (pt-BR) as default

/**
 * Format a number as Brazilian Real currency
 * @param {number} value - The value to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    showSymbol = true,
  } = options;

  const formatted = new Intl.NumberFormat('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value || 0);

  return formatted;
};

/**
 * Format a number with Brazilian locale
 * @param {number} value - The value to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

/**
 * Format a percentage value
 * @param {number} value - The value to format (e.g., 75 for 75%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value, decimals = 0) => {
  return `${(value || 0).toFixed(decimals)}%`;
};

/**
 * Format a date in Brazilian format
 * @param {Date|string} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  };

  return dateObj.toLocaleDateString('pt-BR', { ...defaultOptions, timeZone: 'America/Sao_Paulo' });
};

/**
 * Format a phone number for display
 * @param {string} phone - Raw phone number
 * @returns {string|null} Formatted phone or null if invalid
 */
export const formatPhone = (phone) => {
  if (!phone) return null;

  const cleaned = String(phone).replace(/\D/g, '');

  if (cleaned.length < 10) return null;

  // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }

  return cleaned;
};

/**
 * Format a large number in compact form (e.g., 1.5k, 2.3M)
 * @param {number} value - The value to format
 * @returns {string} Compact formatted number
 */
export const formatCompact = (value) => {
  if (!value || value === 0) return '0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000000) {
    return `${sign}${(absValue / 1000000).toFixed(1)}M`;
  }
  if (absValue >= 1000) {
    return `${sign}${(absValue / 1000).toFixed(1)}k`;
  }

  return formatNumber(value);
};

/**
 * Get trend data object for consistent trend badge display
 * @param {number} value - Percentage change value
 * @returns {object} Trend configuration object
 */
export const getTrendData = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return { show: false };
  }

  const absValue = Math.abs(value);

  // Neutral: less than 0.5% change
  if (absValue < 0.5) {
    return {
      show: true,
      direction: 'neutral',
      text: '→',
      value: 0,
      colorClass: 'text-slate-600 dark:text-slate-300',
      bgClass: 'bg-slate-100 dark:bg-slate-700',
    };
  }

  // Positive
  if (value > 0) {
    return {
      show: true,
      direction: 'up',
      text: `↑${value.toFixed(1)}%`,
      value: value,
      colorClass: 'text-emerald-700 dark:text-emerald-300',
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/40',
    };
  }

  // Negative
  return {
    show: true,
    direction: 'down',
    text: `↓${absValue.toFixed(1)}%`,
    value: value,
    colorClass: 'text-red-700 dark:text-red-300',
    bgClass: 'bg-red-100 dark:bg-red-900/40',
  };
};

export default {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatPhone,
  formatCompact,
  getTrendData,
};
