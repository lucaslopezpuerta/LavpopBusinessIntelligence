/**
 * Brazilian CPF (Cadastro de Pessoas Físicas) Utilities
 *
 * Normalizes and validates Brazilian CPF numbers for consistent data matching
 * across sales.csv, customer.csv, and rfm.csv.
 *
 * CPF Structure:
 *   - 11 numeric digits: XXX.XXX.XXX-YY
 *   - First 9 digits = base number
 *   - Last 2 digits = check digits (mod-11 algorithm)
 *
 * Common POS issues handled:
 *   - Missing leading zeros (e.g., "1234567890" → "01234567890")
 *   - Extra digits (truncated to last 11)
 *   - Non-numeric characters (stripped)
 *
 * @version 1.0.0
 * @since 2025-12-03
 */

// Known invalid CPF patterns (all same digit)
const INVALID_PATTERNS = [
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
];

/**
 * Remove all non-digit characters from CPF
 * @param {string} cpf - Raw CPF input
 * @returns {string} Digits only
 */
export function cleanCpf(cpf) {
  if (!cpf) return '';
  return String(cpf).replace(/\D/g, '');
}

/**
 * Normalize CPF to exactly 11 digits
 *
 * Handles common POS data quality issues:
 * - Pads with leading zeros if < 11 digits
 * - Takes last 11 digits if > 11 digits
 *
 * @param {string} cpf - Raw CPF input (any format)
 * @returns {string} 11-digit normalized CPF, or empty string if invalid
 *
 * @example
 * normalizeCpf("1234567890")     // "01234567890" (padded)
 * normalizeCpf("12345678901")    // "12345678901" (unchanged)
 * normalizeCpf("123.456.789-01") // "12345678901" (cleaned)
 * normalizeCpf("5512345678901")  // "12345678901" (truncated to last 11)
 * normalizeCpf("")               // "" (empty)
 */
export function normalizeCpf(cpf) {
  const digits = cleanCpf(cpf);

  if (!digits) return '';

  // Pad with leading zeros if too short
  if (digits.length < 11) {
    return digits.padStart(11, '0');
  }

  // Take last 11 digits if too long
  if (digits.length > 11) {
    return digits.slice(-11);
  }

  return digits;
}

/**
 * Calculate CPF check digits using mod-11 algorithm
 * @param {string} base - First 9 digits of CPF
 * @returns {string} Two check digits
 */
function calculateCheckDigits(base) {
  if (base.length !== 9) return '';

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(base[i], 10) * (10 - i);
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  // Second check digit
  sum = 0;
  const base10 = base + digit1;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(base10[i], 10) * (11 - i);
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  return `${digit1}${digit2}`;
}

/**
 * Validate CPF format and check digits
 *
 * Validation levels:
 * - Basic: 11 digits, not all same digit
 * - Full: Also validates mod-11 check digits
 *
 * @param {string} cpf - CPF to validate (any format)
 * @param {object} options - Validation options
 * @param {boolean} options.strict - If true, validate check digits (default: false)
 * @returns {boolean} True if valid
 *
 * @example
 * isValidCpf("12345678909")              // true (basic validation)
 * isValidCpf("12345678909", {strict: true}) // true/false (full validation)
 * isValidCpf("11111111111")              // false (all same digit)
 * isValidCpf("123")                      // false (too short)
 */
export function isValidCpf(cpf, options = {}) {
  const { strict = false } = options;

  const normalized = normalizeCpf(cpf);

  // Must have exactly 11 digits after normalization
  if (normalized.length !== 11) {
    return false;
  }

  // Reject known invalid patterns (all same digit)
  if (INVALID_PATTERNS.includes(normalized)) {
    return false;
  }

  // Basic validation passed
  if (!strict) {
    return true;
  }

  // Strict validation: check mod-11 digits
  const base = normalized.slice(0, 9);
  const providedCheck = normalized.slice(9);
  const calculatedCheck = calculateCheckDigits(base);

  return providedCheck === calculatedCheck;
}

/**
 * Get validation error message for invalid CPF
 * @param {string} cpf - Raw CPF input
 * @param {object} options - Validation options
 * @param {boolean} options.strict - If true, validate check digits
 * @returns {string|null} Error message or null if valid
 */
export function getCpfValidationError(cpf, options = {}) {
  const { strict = false } = options;

  if (!cpf) {
    return 'CPF não informado';
  }

  const digits = cleanCpf(cpf);

  if (digits.length === 0) {
    return 'CPF não contém dígitos';
  }

  if (digits.length < 11) {
    return `CPF muito curto (${digits.length} dígitos)`;
  }

  const normalized = normalizeCpf(cpf);

  if (INVALID_PATTERNS.includes(normalized)) {
    return 'CPF inválido (dígitos repetidos)';
  }

  if (strict) {
    const base = normalized.slice(0, 9);
    const providedCheck = normalized.slice(9);
    const calculatedCheck = calculateCheckDigits(base);

    if (providedCheck !== calculatedCheck) {
      return 'CPF inválido (dígito verificador)';
    }
  }

  return null;
}

/**
 * Format CPF for display: XXX.XXX.XXX-XX
 * @param {string} cpf - Normalized CPF (11 digits)
 * @returns {string} Formatted CPF
 *
 * @example
 * formatCpfDisplay("12345678901") // "123.456.789-01"
 */
export function formatCpfDisplay(cpf) {
  const normalized = normalizeCpf(cpf);

  if (normalized.length !== 11) {
    return cpf || '';
  }

  return `${normalized.slice(0, 3)}.${normalized.slice(3, 6)}.${normalized.slice(6, 9)}-${normalized.slice(9)}`;
}

/**
 * Extract and normalize CPF from a data row
 * Searches multiple possible column names for compatibility
 *
 * @param {object} row - Data row object
 * @param {string[]} columns - Column names to search (in priority order)
 * @returns {string} Normalized CPF or empty string
 *
 * @example
 * extractCpf(row, ['Doc_Cliente', 'Documento', 'CPF'])
 */
export function extractCpf(row, columns = ['Doc_Cliente', 'Documento', 'doc', 'document', 'CPF', 'cpf']) {
  if (!row) return '';

  for (const col of columns) {
    const value = row[col];
    if (value) {
      const normalized = normalizeCpf(value);
      if (normalized) {
        return normalized;
      }
    }
  }

  return '';
}

/**
 * Create a lookup map from data rows, keyed by normalized CPF
 *
 * @param {Array} rows - Array of data row objects
 * @param {string[]} cpfColumns - Column names to search for CPF
 * @param {Function} mapper - Optional function to transform row data
 * @returns {Object} Map of normalized CPF → row data
 *
 * @example
 * const customerMap = createCpfMap(customers, ['Documento'], row => ({
 *   name: row.Nome,
 *   phone: row.Celular
 * }));
 */
export function createCpfMap(rows, cpfColumns, mapper = null) {
  const map = {};

  rows.forEach(row => {
    const cpf = extractCpf(row, cpfColumns);
    if (cpf) {
      map[cpf] = mapper ? mapper(row) : row;
    }
  });

  return map;
}
