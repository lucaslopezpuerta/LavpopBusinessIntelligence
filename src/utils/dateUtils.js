/**
 * Brazilian Date Utilities
 * Timezone-independent for BI analytics
 * Format: DD/MM/YYYY or DD-MM-YYYY
 *
 * IMPORTANT: All timestamps in this BI tool represent Brazil business time.
 * The raw time values (hour, day, month) are preserved exactly as recorded,
 * regardless of the viewer's browser timezone.
 */

/**
 * Parse Brazilian date format (DD/MM/YYYY HH:mm:ss)
 *
 * Returns a Date object with an additional `brazil` property containing
 * the RAW time components for timezone-independent calculations.
 *
 * USAGE:
 * - For display: use date.brazil.hour, date.brazil.day, etc.
 * - For sorting/comparison: use the Date object directly
 * - For peak hour analysis: use date.brazil.hour (NOT date.getHours())
 *
 * @param {string} str - Date string in DD/MM/YYYY HH:mm:ss format
 * @returns {Date} Date object with .brazil property containing raw components
 */
export const parseBrDate = (str) => {
  const fallbackDate = new Date('1970-01-01');
  fallbackDate.brazil = { year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0 };

  if (!str) return fallbackDate;

  try {
    let year, month, day, hour = 0, minute = 0, second = 0;

    // Handle DD/MM/YYYY format
    if (str.includes('/')) {
      const [datePart, timePart = '00:00:00'] = str.split(' ');
      [day, month, year] = datePart.split('/').map(Number);
      [hour = 0, minute = 0, second = 0] = timePart.split(':').map(Number);

      if (!day || !month || !year) return fallbackDate;
      year = year < 100 ? 2000 + year : year;
    }
    // Handle DD-MM-YYYY format (RFM CSV)
    else if (str.includes('-') && !str.match(/^\d{4}/)) {
      [day, month, year] = str.split('-').map(Number);
      if (!day || !month || !year) return fallbackDate;
      year = year < 100 ? 2000 + year : year;
    }
    // Handle ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    else if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
      const match = str.match(/(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2}))?/);
      if (match) {
        [, year, month, day, hour, minute, second] = match.map(v => Number(v) || 0);
      } else {
        return fallbackDate;
      }
    }
    else {
      // Fallback
      const directParse = new Date(str);
      if (!isNaN(directParse.getTime())) {
        directParse.brazil = {
          year: directParse.getFullYear(),
          month: directParse.getMonth() + 1,
          day: directParse.getDate(),
          hour: directParse.getHours(),
          minute: directParse.getMinutes(),
          second: directParse.getSeconds()
        };
        return directParse;
      }
      return fallbackDate;
    }

    // Create Date object for sorting/comparison
    // Uses local timezone but we'll use .brazil for actual values
    const date = new Date(year, month - 1, day, hour, minute, second);

    // Attach RAW Brazil time components for timezone-independent calculations
    // These are the ACTUAL recorded values, not browser-adjusted
    date.brazil = { year, month, day, hour, minute, second };

    return date;
  } catch (e) {
    return fallbackDate;
  }
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date to Brazilian format (DD/MM/YYYY)
 */
export const formatBrDate = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Get date windows for Sunday-Saturday business week
 */
export const getDateWindows = () => {
  const currentDate = new Date();
  
  // Find the most recent Saturday (end of current business week)
  let lastSaturday = new Date(currentDate);
  const daysFromSaturday = (currentDate.getDay() + 1) % 7; // 0 if today is Saturday
  lastSaturday.setDate(lastSaturday.getDate() - daysFromSaturday);
  lastSaturday.setHours(23, 59, 59, 999);
  
  // Find the Sunday that starts this week (6 days before Saturday)
  let startSunday = new Date(lastSaturday);
  startSunday.setDate(startSunday.getDate() - 6);
  startSunday.setHours(0, 0, 0, 0);
  
  // Previous week
  const prevWeekEnd = new Date(startSunday);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  prevWeekEnd.setHours(23, 59, 59, 999);
  
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekStart.getDate() - 6);
  prevWeekStart.setHours(0, 0, 0, 0);
  
  // Four week window
  const fourWeekStart = new Date(startSunday);
  fourWeekStart.setDate(fourWeekStart.getDate() - 21);
  
  return {
    currentWeek: {
      start: startSunday,
      end: lastSaturday,
      startDate: formatDate(startSunday),
      endDate: formatDate(lastSaturday)
    },
    previousWeek: {
      start: prevWeekStart,
      end: prevWeekEnd,
      startDate: formatDate(prevWeekStart),
      endDate: formatDate(prevWeekEnd)
    },
    fourWeek: {
      start: fourWeekStart,
      end: lastSaturday,
      startDate: formatDate(fourWeekStart),
      endDate: formatDate(lastSaturday)
    }
  };
};

/**
 * Get various date ranges
 */
export const getDateRange = (type) => {
  const now = new Date();
  
  switch (type) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: now
      };
      
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
        end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
      };
      
    case 'last7days':
      const start7 = new Date(now);
      start7.setDate(start7.getDate() - 6);
      start7.setHours(0, 0, 0, 0);
      return { start: start7, end: now };
      
    case 'last30days':
      const start30 = new Date(now);
      start30.setDate(start30.getDate() - 29);
      start30.setHours(0, 0, 0, 0);
      return { start: start30, end: now };
      
    case 'thisMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now
      };
      
    case 'lastMonth':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: lastMonth, end: lastMonthEnd };
      
    case 'ytd':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: now
      };
      
    case 'allTime':
    default:
      return { start: null, end: null };
  }
};

/**
 * Format date range for display
 */
export const formatDateRange = (start, end) => {
  if (!start && !end) return 'Todo o período';
  const opts = { day: '2-digit', month: 'short', year: 'numeric' };
  const startStr = start ? start.toLocaleDateString('pt-BR', opts) : 'Início';
  const endStr = end ? end.toLocaleDateString('pt-BR', opts) : 'Hoje';
  return `${startStr} - ${endStr}`;
};

/**
 * Format month key (YYYY-MM) to user-friendly Portuguese format
 * @param {string} monthKey - Month in YYYY-MM format (e.g., "2024-11")
 * @param {string} format - 'tiny' (N24), 'short' (Nov 24), 'medium' (Nov 2024), 'long' (Novembro 2024)
 * @returns {string} Formatted month string
 */
export const formatMonthKey = (monthKey, format = 'medium') => {
  if (!monthKey || typeof monthKey !== 'string') return monthKey;

  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;

  const date = new Date(year, month - 1, 1);

  switch (format) {
    case 'tiny':
      // "N24" - Single letter month + 2-digit year (for charts with many data points)
      const monthLetters = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      return `${monthLetters[month - 1]}${String(year).slice(-2)}`;
    case 'short':
      // "Nov 24"
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '').replace(' de ', ' ');
    case 'long':
      // "Novembro 2024"
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    case 'medium':
    default:
      // "Nov 2024"
      return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
  }
};

/**
 * Check if a month key represents the current month
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {boolean} True if current month
 */
export const isCurrentMonth = (monthKey) => {
  if (!monthKey) return false;
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return monthKey === currentKey;
};

/**
 * Get days elapsed in current month (for partial month detection)
 * @returns {number} Days elapsed in current month
 */
export const getDaysElapsedInMonth = () => {
  return new Date().getDate();
};

/**
 * Get total days in a month
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {number} Total days in the month
 */
export const getDaysInMonth = (monthKey) => {
  if (!monthKey) return 30;
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

/**
 * Get days between two dates
 */
export const daysBetween = (date1, date2) => {
  const ms = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

/**
 * Check if date is within range
 */
export const isWithinRange = (date, start, end) => {
  if (!start && !end) return true;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
};

// ============================================
// BRAZIL TIMEZONE UTILITIES
// For scheduling and time-sensitive operations
// ============================================

/**
 * Brazil timezone identifier
 * São Paulo is the reference timezone for business operations
 */
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Create a Date object representing a specific Brazil time
 * Converts user-selected date/time (intended as Brazil time) to UTC for storage
 *
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:mm format
 * @returns {Date} Date object representing the specified Brazil time
 *
 * USAGE:
 * - User selects "2025-12-15" and "10:00" meaning 10:00 AM Brazil time
 * - This function creates a Date that, when displayed in Brazil, shows 10:00 AM
 * - When stored as ISO, it will have the correct UTC offset
 */
export const createBrazilDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;

  // Parse the date/time components
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  // Create a date string with explicit Brazil timezone
  // Format: "2025-12-15T10:00:00" interpreted in Brazil timezone
  const brazilDateStr = `${dateStr}T${timeStr}:00`;

  // Use Intl.DateTimeFormat to get the timezone offset for Brazil at that moment
  // This handles daylight saving time automatically
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Create a temporary date to calculate the offset
  // We'll use a date calculation approach that works across browsers
  const tempDate = new Date(year, month - 1, day, hour, minute, 0);

  // Get the Brazil time representation of this UTC date
  const brazilParts = formatter.formatToParts(tempDate);
  const getPart = (type) => {
    const part = brazilParts.find(p => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };

  const brazilHour = getPart('hour');
  const brazilMinute = getPart('minute');
  const brazilDay = getPart('day');

  // Calculate the offset in minutes
  const localMinutes = tempDate.getHours() * 60 + tempDate.getMinutes();
  const brazilMinutes = brazilHour * 60 + brazilMinute;

  // Account for day difference if timezone crosses midnight
  let offsetMinutes = localMinutes - brazilMinutes;
  if (brazilDay !== tempDate.getDate()) {
    // Day is different, adjust by 24 hours
    if (brazilDay < tempDate.getDate()) {
      offsetMinutes -= 24 * 60;
    } else {
      offsetMinutes += 24 * 60;
    }
  }

  // Create the final date by applying the offset
  // We want the date that, when displayed in Brazil, shows the user's input
  const finalDate = new Date(year, month - 1, day, hour, minute, 0);
  finalDate.setMinutes(finalDate.getMinutes() + offsetMinutes);

  return finalDate;
};

/**
 * Format a Date to Brazil timezone for display
 *
 * @param {Date} date - Date object (in any timezone)
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date/time string in Brazil timezone
 */
export const formatBrazilTime = (date, options = {}) => {
  if (!date || isNaN(date.getTime())) return '';

  const defaultOptions = {
    timeZone: BRAZIL_TIMEZONE,
    ...options
  };

  return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(date);
};

/**
 * Format a Date to Brazil timezone with date and time
 *
 * @param {Date} date - Date object
 * @returns {object} { date: 'DD/MM/YYYY', time: 'HH:mm' }
 */
export const formatBrazilDateTime = (date) => {
  if (!date || isNaN(date.getTime())) return { date: '', time: '' };

  const dateStr = formatBrazilTime(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const timeStr = formatBrazilTime(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return { date: dateStr, time: timeStr };
};

/**
 * Get current time in Brazil timezone
 *
 * @returns {object} { date: 'YYYY-MM-DD', time: 'HH:mm', display: 'DD/MM/YYYY HH:mm' }
 */
export const getBrazilNow = () => {
  const now = new Date();

  // Get parts in Brazil timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);

  const getPart = (type) => parts.find(p => p.type === type)?.value || '';

  const date = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  const time = `${getPart('hour')}:${getPart('minute')}`;
  const display = formatBrazilTime(now, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return { date, time, display };
};

/**
 * Check if a Brazil datetime is in the future
 *
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:mm format
 * @returns {boolean} True if the Brazil time is in the future
 */
export const isBrazilTimeFuture = (dateStr, timeStr) => {
  const scheduledDate = createBrazilDateTime(dateStr, timeStr);
  if (!scheduledDate) return false;
  return scheduledDate > new Date();
};
