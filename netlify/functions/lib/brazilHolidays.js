// brazilHolidays.js v1.0 (CommonJS version for Netlify functions)
// Brazilian holiday detection for Caxias do Sul, RS
//
// Includes:
// - National fixed holidays
// - Rio Grande do Sul state holiday (Revolução Farroupilha)
// - Easter-based moveable holidays (Carnaval, Sexta-Feira Santa, Corpus Christi)
//
// Used by revenue prediction model to add holiday features

// ============== FIXED HOLIDAYS ==============
// Format: 'MM-DD': 'Holiday Name'

const FIXED_HOLIDAYS = {
  '01-01': 'Confraternização Universal',
  '04-21': 'Tiradentes',
  '05-01': 'Dia do Trabalho',
  '09-07': 'Independência do Brasil',
  '09-20': 'Revolução Farroupilha',  // RS state holiday
  '10-12': 'Nossa Senhora Aparecida',
  '11-02': 'Finados',
  '11-15': 'Proclamação da República',
  '11-20': 'Consciência Negra',
  '12-25': 'Natal'
};

// ============== EASTER-BASED HOLIDAYS ==============
// Offset in days from Easter Sunday

const EASTER_OFFSETS = {
  '-48': 'Carnaval (segunda)',
  '-47': 'Carnaval (terça)',
  '-46': 'Quarta-Feira de Cinzas',
  '-2': 'Sexta-Feira Santa',
  '60': 'Corpus Christi'
};

// ============== EASTER CALCULATION ==============

/**
 * Calculate Easter Sunday for a given year using the Anonymous Gregorian algorithm
 * (also known as the "Meeus/Jones/Butcher" algorithm)
 *
 * @param {number} year - The year to calculate Easter for
 * @returns {Date} Easter Sunday date
 */
function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Format date as YYYY-MM-DD string
 */
function formatDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============== PUBLIC API ==============

/**
 * Check if a date is a Brazilian holiday
 *
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Object} { isHoliday: boolean, name: string|null, type: 'fixed'|'moveable'|null }
 */
function isHoliday(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isHoliday: false, name: null, type: null };
  }

  const monthDay = dateStr.slice(5); // MM-DD
  const year = parseInt(dateStr.slice(0, 4), 10);

  // Check fixed holidays
  if (FIXED_HOLIDAYS[monthDay]) {
    return {
      isHoliday: true,
      name: FIXED_HOLIDAYS[monthDay],
      type: 'fixed'
    };
  }

  // Check Easter-based holidays
  const easter = getEasterSunday(year);

  for (const [offset, name] of Object.entries(EASTER_OFFSETS)) {
    const holidayDate = new Date(easter);
    holidayDate.setDate(holidayDate.getDate() + parseInt(offset, 10));
    const holidayStr = formatDateStr(holidayDate);

    if (holidayStr === dateStr) {
      return {
        isHoliday: true,
        name,
        type: 'moveable'
      };
    }
  }

  return { isHoliday: false, name: null, type: null };
}

/**
 * Check if the day before a date is a holiday (holiday eve effect)
 * Holiday eves often have different business patterns
 *
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Object} { isHolidayEve: boolean, holidayName: string|null }
 */
function isHolidayEve(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isHolidayEve: false, holidayName: null };
  }

  // Calculate tomorrow's date
  const date = new Date(dateStr + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  const tomorrowStr = formatDateStr(date);

  const holidayInfo = isHoliday(tomorrowStr);

  return {
    isHolidayEve: holidayInfo.isHoliday,
    holidayName: holidayInfo.name
  };
}

/**
 * Get all holidays in a date range
 * Useful for batch processing or UI display
 *
 * @param {string} startDate - Start date YYYY-MM-DD
 * @param {string} endDate - End date YYYY-MM-DD
 * @returns {Array} Array of { date, name, type }
 */
function getHolidaysInRange(startDate, endDate) {
  const holidays = [];
  const current = new Date(startDate + 'T12:00:00Z');
  const end = new Date(endDate + 'T12:00:00Z');

  while (current <= end) {
    const dateStr = formatDateStr(current);
    const holidayInfo = isHoliday(dateStr);

    if (holidayInfo.isHoliday) {
      holidays.push({
        date: dateStr,
        name: holidayInfo.name,
        type: holidayInfo.type
      });
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return holidays;
}

/**
 * Get Easter Sunday date for a year
 * Exported for testing and other calendar calculations
 *
 * @param {number} year - Year
 * @returns {string} Easter Sunday in YYYY-MM-DD format
 */
function getEasterDate(year) {
  return formatDateStr(getEasterSunday(year));
}

// ============== CLOSED DAYS ==============

/**
 * Days when the laundromat is closed
 * Format: 'MM-DD'
 */
const CLOSED_DAYS = {
  '12-25': 'Natal',
  '01-01': 'Ano Novo'
};

/**
 * Check if a date is a closed day (laundromat not operating)
 *
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Object} { isClosed: boolean, reason: string|null }
 */
function isClosedDay(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isClosed: false, reason: null };
  }

  const monthDay = dateStr.slice(5); // MM-DD

  if (CLOSED_DAYS[monthDay]) {
    return {
      isClosed: true,
      reason: CLOSED_DAYS[monthDay]
    };
  }

  return { isClosed: false, reason: null };
}

// ============== EXPORTS ==============

module.exports = {
  isHoliday,
  isHolidayEve,
  isClosedDay,
  getHolidaysInRange,
  getEasterDate
};
