// Date Windows Utility v1.1
// Centralized date calculations for all tabs
// Week-based system: Sunday-Saturday (Brazilian business standard)
//
// CHANGELOG:
// v1.0 (2025-11-15): Initial implementation
//   - Created centralized date window calculations
//   - Support for 4 date options: currentWeek, lastWeek, last4Weeks, allTime
//   - Brazilian date format (DD/MM/YYYY)
//   - Sunday-Saturday business weeks

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
  
  return {
    start: startSunday,
    end: endSaturday
  };
}

/**
 * Get last complete week (Sunday to Saturday)
 */
function getLastWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Get last Saturday
  let lastSaturday = new Date(today);
  if (dayOfWeek === 6) {
    // If today is Saturday, go back 7 days
    lastSaturday.setDate(lastSaturday.getDate() - 7);
  } else {
    // Go back to most recent Saturday
    const daysToLastSaturday = dayOfWeek === 0 ? 1 : (dayOfWeek + 1);
    lastSaturday.setDate(lastSaturday.getDate() - daysToLastSaturday);
  }
  lastSaturday.setHours(23, 59, 59, 999);
  
  // Get Sunday of that week
  const startSunday = new Date(lastSaturday);
  startSunday.setDate(lastSaturday.getDate() - 6);
  startSunday.setHours(0, 0, 0, 0);
  
  return {
    start: startSunday,
    end: lastSaturday
  };
}

/**
 * Get last 4 complete weeks (28 days)
 */
function getLast4Weeks() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Get last Saturday
  let lastSaturday = new Date(today);
  if (dayOfWeek === 6) {
    lastSaturday.setDate(lastSaturday.getDate() - 7);
  } else {
    const daysToLastSaturday = dayOfWeek === 0 ? 1 : (dayOfWeek + 1);
    lastSaturday.setDate(lastSaturday.getDate() - daysToLastSaturday);
  }
  lastSaturday.setHours(23, 59, 59, 999);
  
  // Go back 28 days (4 weeks) from last Saturday
  const startDate = new Date(lastSaturday);
  startDate.setDate(lastSaturday.getDate() - 27); // 27 days back + 1 (lastSaturday) = 28 days
  startDate.setHours(0, 0, 0, 0);
  
  return {
    start: startDate,
    end: lastSaturday
  };
}

/**
 * Get all-time window (from business start to today)
 */
function getAllTime() {
  const startDate = new Date(2024, 5, 1, 0, 0, 0, 0); // June 1, 2024
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  return {
    start: startDate,
    end: today
  };
}

/**
 * Get the week before last week (for comparison when viewing lastWeek)
 */
function getTwoWeeksAgo() {
  const lastWeek = getLastWeek();
  
  // Go back 7 more days from last week's start
  const startSunday = new Date(lastWeek.start);
  startSunday.setDate(startSunday.getDate() - 7);
  startSunday.setHours(0, 0, 0, 0);
  
  const endSaturday = new Date(lastWeek.end);
  endSaturday.setDate(endSaturday.getDate() - 7);
  endSaturday.setHours(23, 59, 59, 999);
  
  return {
    start: startSunday,
    end: endSaturday
  };
}

/**
 * Get the 4 weeks before last 4 weeks (for comparison)
 */
function getPrevious4Weeks() {
  const last4 = getLast4Weeks();
  
  // Go back 28 more days from last4Weeks start
  const startDate = new Date(last4.start);
  startDate.setDate(startDate.getDate() - 28);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(last4.end);
  endDate.setDate(endDate.getDate() - 28);
  endDate.setHours(23, 59, 59, 999);
  
  return {
    start: startDate,
    end: endDate
  };
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date range as "DD/MM/YYYY - DD/MM/YYYY"
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
 * Get date window and metadata for a given option
 * @param {string} option - One of: 'currentWeek', 'lastWeek', 'last4Weeks', 'allTime', 'twoWeeksAgo', 'previous4Weeks'
 * @returns {Object} - { start, end, label, dateRange, fullLabel, option }
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
    case 'twoWeeksAgo':
      window = getTwoWeeksAgo();
      label = 'Semana Anterior';
      break;
    case 'previous4Weeks':
      window = getPrevious4Weeks();
      label = '4 Semanas Anteriores';
      break;
    default:
      window = getCurrentWeek(true);
      label = 'Semana Atual';
  }
  
  const dateRange = formatDateRange(window.start, window.end);
  
  return {
    ...window,
    label,
    dateRange,
    fullLabel: `${label} (${dateRange})`,
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
    displayLabel: `${opt.label} (${formatDateRange(opt.start, opt.end)})`
  }));
}
