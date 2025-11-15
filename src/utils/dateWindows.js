// Date Windows Utility v1.0
// Centralized date calculations for all tabs
// Brazil timezone: America/Sao_Paulo
// Business weeks: Sunday to Saturday

/**
 * Get current week boundaries (Sunday to Saturday)
 * @param {boolean} includePartial - If true, includes current day (partial week)
 */
function getCurrentWeek(includePartial = true) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  
  // Start: Most recent Sunday
  const startSunday = new Date(today);
  startSunday.setDate(today.getDate() - dayOfWeek);
  startSunday.setHours(0, 0, 0, 0);
  
  // End: This Saturday or Today
  const endSaturday = new Date(startSunday);
  endSaturday.setDate(startSunday.getDate() + 6);
  endSaturday.setHours(23, 59, 59, 999);
  
  if (includePartial) {
    // Use today as end if it's before Saturday
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    return {
      start: startSunday,
      end: todayEnd < endSaturday ? todayEnd : endSaturday
    };
  }
  
  return { start: startSunday, end: endSaturday };
}

/**
 * Get last complete week (Sunday to Saturday)
 */
function getLastWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Find last Saturday
  const lastSaturday = new Date(today);
  if (dayOfWeek === 6) {
    // Today is Saturday - go back to previous Saturday
    lastSaturday.setDate(lastSaturday.getDate() - 7);
  } else {
    // Go back to most recent Saturday
    const daysToLastSaturday = dayOfWeek === 0 ? 1 : (dayOfWeek + 1);
    lastSaturday.setDate(lastSaturday.getDate() - daysToLastSaturday);
  }
  lastSaturday.setHours(23, 59, 59, 999);
  
  // Get the Sunday before that Saturday
  const startSunday = new Date(lastSaturday);
  startSunday.setDate(lastSaturday.getDate() - 6);
  startSunday.setHours(0, 0, 0, 0);
  
  return { start: startSunday, end: lastSaturday };
}

/**
 * Get last 4 complete weeks (28 days)
 */
function getLast4Weeks() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Find last Saturday
  const lastSaturday = new Date(today);
  if (dayOfWeek === 6) {
    lastSaturday.setDate(lastSaturday.getDate() - 7);
  } else {
    const daysToLastSaturday = dayOfWeek === 0 ? 1 : (dayOfWeek + 1);
    lastSaturday.setDate(lastSaturday.getDate() - daysToLastSaturday);
  }
  lastSaturday.setHours(23, 59, 59, 999);
  
  // Go back 28 days to get 4 weeks
  const start28DaysAgo = new Date(lastSaturday);
  start28DaysAgo.setDate(lastSaturday.getDate() - 27); // 28 days total including end day
  start28DaysAgo.setHours(0, 0, 0, 0);
  
  return { start: start28DaysAgo, end: lastSaturday };
}

/**
 * Get all-time window (from business start to today)
 */
function getAllTime() {
  const businessStart = new Date(2024, 5, 1); // June 1, 2024
  businessStart.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  return { start: businessStart, end: today };
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param {Date} date 
 */
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date range for display (DD/MM/YYYY - DD/MM/YYYY)
 * @param {Date} start 
 * @param {Date} end 
 */
export function formatDateRange(start, end) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Format date range for display (shortened for dropdown)
 * @param {Date} start 
 * @param {Date} end 
 */
export function formatDateRangeShort(start, end) {
  const startDay = String(start.getDate()).padStart(2, '0');
  const startMonth = String(start.getMonth() + 1).padStart(2, '0');
  const endDay = String(end.getDate()).padStart(2, '0');
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  
  // If same month, show DD/MM - DD/MM
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
  }
  
  // Different months, show DD/MM - DD/MM
  return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
}

/**
 * Get readable label with dates
 * @param {string} option - currentWeek, lastWeek, last4Weeks, allTime
 * @param {Date} start 
 * @param {Date} end 
 */
export function getDateLabel(option, start, end) {
  const labels = {
    currentWeek: 'Semana Atual',
    lastWeek: 'Semana Passada',
    last4Weeks: 'Últimas 4 Semanas',
    allTime: 'Todo Período'
  };
  
  const shortRange = formatDateRangeShort(start, end);
  return `${labels[option]} (${shortRange})`;
}

/**
 * Main function: Get date windows for any option
 * @param {string} option - currentWeek, lastWeek, last4Weeks, allTime
 * @returns {Object} { start, end, label, dateRange, fullLabel, option }
 */
export function getDateWindows(option = 'currentWeek') {
  let window;
  let label;
  
  switch(option) {
    case 'currentWeek':
      window = getCurrentWeek(true);
      label = 'Semana Atual';
      break;
    case 'lastWeek':
      window = getLastWeek();
      label = 'Semana Passada';
      break;
    case 'last4Weeks':
      window = getLast4Weeks();
      label = 'Últimas 4 Semanas';
      break;
    case 'allTime':
      window = getAllTime();
      label = 'Todo Período';
      break;
    default:
      window = getCurrentWeek(true);
      label = 'Semana Atual';
  }
  
  const dateRange = formatDateRange(window.start, window.end);
  const shortDateRange = formatDateRangeShort(window.start, window.end);
  
  return {
    ...window,
    label,
    dateRange,
    shortDateRange,
    fullLabel: `${label} (${shortDateRange})`,
    option
  };
}

/**
 * Get dropdown options with current dates
 */
export function getDateOptions() {
  return [
    {
      value: 'currentWeek',
      label: 'Semana Atual',
      ...getCurrentWeek(true)
    },
    {
      value: 'lastWeek',
      label: 'Semana Passada',
      ...getLastWeek()
    },
    {
      value: 'last4Weeks',
      label: 'Últimas 4 Semanas',
      ...getLast4Weeks()
    },
    {
      value: 'allTime',
      label: 'Todo Período',
      ...getAllTime()
    }
  ].map(opt => ({
    ...opt,
    displayLabel: `${opt.label} (${formatDateRangeShort(opt.start, opt.end)})`
  }));
}
