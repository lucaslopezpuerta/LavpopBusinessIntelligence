/**
 * Brazilian Date Utilities
 * Timezone: America/Sao_Paulo
 * Format: DD/MM/YYYY or DD-MM-YYYY
 */

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Parse Brazilian date format (DD/MM/YYYY HH:mm:ss)
 * CRITICAL: Creates date in LOCAL timezone to avoid UTC conversion issues
 */
export const parseBrDate = (str) => {
  if (!str) return new Date('1970-01-01');

  try {
    // Handle DD/MM/YYYY format
    if (str.includes('/')) {
      const [datePart, timePart = '00:00:00'] = str.split(' ');
      const [day, month, year] = datePart.split('/').map(Number);
      
      if (day && month && year) {
        const fullYear = year < 100 ? 2000 + year : year;
        const [hour = 0, minute = 0, second = 0] = timePart.split(':').map(Number);
        
        // Create in LOCAL timezone (not UTC)
        return new Date(fullYear, month - 1, day, hour, minute, second);
      }
    }
    
    // Handle DD-MM-YYYY format (RFM CSV)
    if (str.includes('-') && !str.match(/^\d{4}/)) {
      const [day, month, year] = str.split('-').map(Number);
      if (day && month && year) {
        const fullYear = year < 100 ? 2000 + year : year;
        return new Date(fullYear, month - 1, day);
      }
    }
    
    // Handle ISO format (YYYY-MM-DD)
    if (str.includes('-') && str.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [year, month, day] = str.split(/[-T]/).map(Number);
      return new Date(year, month - 1, day);
    }

    // Fallback
    const directParse = new Date(str);
    if (!isNaN(directParse.getTime())) return directParse;

    return new Date('1970-01-01');
  } catch (e) {
    return new Date('1970-01-01');
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
