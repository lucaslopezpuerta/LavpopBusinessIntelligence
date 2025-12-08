/**
 * Brazilian Phone Number Utilities
 *
 * Validates and normalizes Brazilian mobile phone numbers for WhatsApp campaigns.
 *
 * Valid format: +55 AA 9 NNNNNNNN (13 digits without +)
 *   - Country code: always 55
 *   - Area code (DDD): 2 digits, both 1-9 (no leading 0)
 *   - Mobile prefix: always 9
 *   - Number: 8 digits
 *
 * @version 1.1.0
 * @since 2025-12-03
 *
 * CHANGELOG:
 * v1.1.0 (2025-12-08): Added legacy format support
 *   - Handles 10-digit numbers (adds missing 9 prefix)
 *   - Handles 12-digit numbers with 55 prefix (adds missing 9)
 *   - Handles whatsapp: prefix from Twilio
 *   - normalizePhoneStrict() added for validation-only use
 */

// Brazilian mobile phone pattern: 55 + [1-9][1-9] + 9 + 8 digits
const BR_MOBILE_PATTERN = /^55[1-9]{2}9\d{8}$/;

/**
 * Normalize a phone number to digits only
 * Handles whatsapp: prefix from Twilio
 * @param {string} phone - Raw phone input
 * @returns {string} Digits only
 */
export function cleanPhone(phone) {
  if (!phone) return '';
  // Remove whatsapp: prefix if present (from Twilio)
  const withoutPrefix = String(phone).replace(/^whatsapp:/i, '');
  return withoutPrefix.replace(/\D/g, '');
}

/**
 * Validate if a phone number is a valid Brazilian mobile
 * @param {string} phone - Phone number (any format)
 * @returns {boolean} True if valid Brazilian mobile
 */
export function isValidBrazilianMobile(phone) {
  let digits = cleanPhone(phone);

  // If 11 digits (AA9NNNNNNNN), prepend country code 55
  if (digits.length === 11) {
    digits = '55' + digits;
  }

  return BR_MOBILE_PATTERN.test(digits);
}

/**
 * Normalize phone to +55XXXXXXXXXXX format
 * Handles legacy formats by adding missing 9 prefix when needed
 * Returns null if invalid
 *
 * @param {string} phone - Raw phone input
 * @param {boolean} strict - If true, don't add missing 9 prefix (default: false)
 * @returns {string|null} Normalized phone or null if invalid
 *
 * @example
 * normalizePhone("54996923504")     // "+5554996923504"
 * normalizePhone("5554996923504")   // "+5554996923504"
 * normalizePhone("+5554996923504")  // "+5554996923504"
 * normalizePhone("5496923504")      // "+5554996923504" (adds 9 prefix)
 * normalizePhone("555496923504")    // "+5554996923504" (adds 9 prefix)
 * normalizePhone("whatsapp:+5554996923504") // "+5554996923504"
 * normalizePhone("5509912345678")   // null (invalid area code)
 */
export function normalizePhone(phone, strict = false) {
  if (!phone) return null;

  let digits = cleanPhone(phone);

  // Handle different length formats
  switch (digits.length) {
    case 13:
      // Already full format: 55 AA 9 NNNNNNNN
      if (!digits.startsWith('55')) return null;
      break;

    case 12:
      // 55 AA NNNNNNNN - missing 9 prefix
      if (digits.startsWith('55') && !strict) {
        // Insert 9 after area code: 55 AA -> 55 AA 9
        digits = digits.slice(0, 4) + '9' + digits.slice(4);
      } else {
        return null;
      }
      break;

    case 11:
      // AA 9 NNNNNNNN - missing country code
      digits = '55' + digits;
      break;

    case 10:
      // AA NNNNNNNN - missing country code AND 9 prefix
      if (!strict) {
        // Add 55 and insert 9: AA -> 55 AA 9
        digits = '55' + digits.slice(0, 2) + '9' + digits.slice(2);
      } else {
        return null;
      }
      break;

    default:
      return null;
  }

  // Validate against Brazilian mobile pattern
  if (!BR_MOBILE_PATTERN.test(digits)) {
    return null;
  }

  return '+' + digits;
}

/**
 * Strict version of normalizePhone - only accepts already valid formats
 * Does NOT add missing 9 prefix
 *
 * @param {string} phone - Raw phone input
 * @returns {string|null} Normalized phone or null if invalid
 */
export function normalizePhoneStrict(phone) {
  return normalizePhone(phone, true);
}

/**
 * Format phone for display: +55 54 99692-3504
 * @param {string} phone - Normalized phone (+5554996923504)
 * @returns {string} Formatted phone
 */
export function formatPhoneDisplay(phone) {
  if (!phone) return '';

  const digits = cleanPhone(phone);

  if (digits.length === 13) {
    // +55 AA 9NNNN-NNNN
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 11) {
    // AA 9NNNN-NNNN
    return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Get validation error message for invalid phone
 * @param {string} phone - Raw phone input
 * @returns {string|null} Error message or null if valid
 */
export function getPhoneValidationError(phone) {
  if (!phone) return 'Telefone não informado';

  const digits = cleanPhone(phone);

  if (digits.length < 10) {
    return 'Número muito curto';
  }

  if (digits.length > 13) {
    return 'Número muito longo';
  }

  // Check for country code
  let normalized = digits;
  if (digits.length === 11) {
    normalized = '55' + digits;
  }

  // Check area code (DDD)
  const areaCode = normalized.slice(2, 4);
  if (areaCode[0] === '0') {
    return `DDD inválido (${areaCode}) - não pode começar com 0`;
  }

  // Check mobile prefix
  const mobilePrefix = normalized.slice(4, 5);
  if (mobilePrefix !== '9') {
    return `Não é celular - deve começar com 9 após DDD`;
  }

  if (!BR_MOBILE_PATTERN.test(normalized)) {
    return 'Formato inválido para celular brasileiro';
  }

  return null;
}

/**
 * Filter customers to only those with valid WhatsApp numbers
 * @param {Array} customers - Array of customer objects
 * @param {string} phoneField - Field name containing phone (default: 'phone')
 * @returns {Array} Filtered customers with valid phones
 */
export function filterValidPhones(customers, phoneField = 'phone') {
  return customers.filter(c => {
    const phone = c[phoneField];
    return phone && isValidBrazilianMobile(phone);
  });
}

/**
 * Get campaign-ready recipients from customers
 * Normalizes phones and filters invalid ones
 *
 * @param {Array} customers - Array of customer objects
 * @returns {Object} { valid: [], invalid: [], stats: {} }
 */
export function getCampaignRecipients(customers) {
  const valid = [];
  const invalid = [];

  customers.forEach(c => {
    const normalized = normalizePhone(c.phone);

    if (normalized) {
      valid.push({
        ...c,
        phone: normalized,
        originalPhone: c.phone
      });
    } else {
      invalid.push({
        ...c,
        error: getPhoneValidationError(c.phone)
      });
    }
  });

  return {
    valid,
    invalid,
    stats: {
      total: customers.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      validRate: customers.length > 0
        ? Math.round((valid.length / customers.length) * 100)
        : 0
    }
  };
}
