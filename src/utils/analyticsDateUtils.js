// Analytics Date Utilities v1.0
// Extended date range options for Analytics tab
// Supports: Last 7 days, Current month, Previous month, Last 3/6/12 months, Current year, All time, Custom
//
// CHANGELOG:
// v1.0 (2025-11-16): Initial implementation

/**
 * Format date as DD/MM/YYYY
 */
export function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date range as "DD/MM - DD/MM/YYYY" or "DD/MM/YYYY - DD/MM/YYYY"
 */
export function formatDateRange(start, end) {
  const startDay = String(start.getDate()).padStart(2, '0');
  const startMonth = String(start.getMonth() + 1).padStart(2, '0');
  const startYear = start.getFullYear();
  
  const endDay = String(end.getDate()).padStart(2, '0');
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  const endYear = end.getFullYear();
  
  // If same year, show year only once
  if (startYear === endYear) {
    return `${startDay}/${startMonth} - ${endDay}/${endMonth}/${endYear}`;
  }
  
  return `${startDay}/${startMonth}/${startYear} - ${endDay}/${endMonth}/${endYear}`;
}

/**
 * Get today's date at end of day
 */
function getToday() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

/**
 * Get last 7 days (today and 6 days back)
 */
function getLast7Days() {
  const end = getToday();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
}

/**
 * Get last 30 days (default)
 */
function getLast30Days() {
  const end = getToday();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
}

/**
 * Get current month (from 1st to today)
 */
function getCurrentMonth() {
  const end = getToday();
  const start = new Date(end.getFullYear(), end.getMonth(), 1, 0, 0, 0, 0);
  
  return { start, end };
}

/**
 * Get previous month (complete)
 */
function getPreviousMonth() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0, 0);
  const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get last 3 months (90 days)
 */
function getLast3Months() {
  const end = getToday();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 3);
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
}

/**
 * Get last 6 months (180 days)
 */
function getLast6Months() {
  const end = getToday();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 6);
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
}

/**
 * Get last 12 months (365 days)
 */
function getLast12Months() {
  const end = getToday();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 12);
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
}

/**
 * Get current year (from Jan 1 to today)
 */
function getCurrentYear() {
  const end = getToday();
  const start = new Date(end.getFullYear(), 0, 1, 0, 0, 0, 0);
  
  return { start, end };
}

/**
 * Get all-time window (from business start to today)
 */
function getAllTime() {
  const start = new Date(2024, 5, 1, 0, 0, 0, 0); // June 1, 2024
  const end = getToday();
  
  return { start, end };
}

/**
 * Get date range for given option
 * @param {string} option - Date range option
 * @param {Date} customStart - Custom start date (for 'custom' option)
 * @param {Date} customEnd - Custom end date (for 'custom' option)
 * @returns {Object} - { start, end, label, dateRange }
 */
export function getAnalyticsDateRange(option = 'last30days', customStart = null, customEnd = null) {
  let window;
  let label;
  
  switch(option) {
    case 'last7days':
      window = getLast7Days();
      label = 'Últimos 7 dias';
      break;
    case 'last30days':
      window = getLast30Days();
      label = 'Últimos 30 dias';
      break;
    case 'currentMonth':
      window = getCurrentMonth();
      label = 'Mês atual';
      break;
    case 'previousMonth':
      window = getPreviousMonth();
      label = 'Mês anterior';
      break;
    case 'last3months':
      window = getLast3Months();
      label = 'Últimos 3 meses';
      break;
    case 'last6months':
      window = getLast6Months();
      label = 'Últimos 6 meses';
      break;
    case 'last12months':
      window = getLast12Months();
      label = 'Últimos 12 meses';
      break;
    case 'currentYear':
      window = getCurrentYear();
      label = 'Ano atual';
      break;
    case 'allTime':
      window = getAllTime();
      label = 'Todo período';
      break;
    case 'custom':
      if (!customStart || !customEnd) {
        window = getLast30Days();
        label = 'Personalizado';
      } else {
        window = { start: customStart, end: customEnd };
        label = 'Personalizado';
      }
      break;
    default:
      window = getLast30Days();
      label = 'Últimos 30 dias';
  }
  
  const dateRange = formatDateRange(window.start, window.end);
  
  return {
    ...window,
    label,
    dateRange,
    option
  };
}

/**
 * Get all available date range options for dropdown
 */
export function getAnalyticsDateOptions() {
  return [
    { value: 'last7days', label: 'Últimos 7 dias' },
    { value: 'last30days', label: 'Últimos 30 dias' },
    { value: 'currentMonth', label: 'Mês atual' },
    { value: 'previousMonth', label: 'Mês anterior' },
    { value: 'last3months', label: 'Últimos 3 meses' },
    { value: 'last6months', label: 'Últimos 6 meses' },
    { value: 'last12months', label: 'Últimos 12 meses' },
    { value: 'currentYear', label: 'Ano atual' },
    { value: 'allTime', label: 'Todo período' },
    { value: 'custom', label: 'Período personalizado' }
  ];
}

/**
 * Calculate number of days in date range
 */
export function getDaysInRange(start, end) {
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end dates
}

/**
 * Get month name in Portuguese
 */
export function getMonthName(monthIndex) {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthIndex];
}

/**
 * Get short month name in Portuguese
 */
export function getShortMonthName(monthIndex) {
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return months[monthIndex];
}
