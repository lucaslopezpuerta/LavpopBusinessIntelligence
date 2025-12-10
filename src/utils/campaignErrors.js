// campaignErrors.js v1.0
// Campaign error classification and handling
//
// Provides structured error handling for WhatsApp campaigns:
// - Error classification (retryable vs permanent)
// - User-friendly error messages (Portuguese)
// - Twilio error code mapping
// - Retry logic configuration

/**
 * Error types for campaign operations
 */
export const ErrorType = {
  // Permanent errors - do not retry
  INVALID_PHONE: 'INVALID_PHONE',
  BLACKLISTED: 'BLACKLISTED',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_NOT_APPROVED: 'TEMPLATE_NOT_APPROVED',
  MISSING_CONTENT_SID: 'MISSING_CONTENT_SID',
  INVALID_VARIABLES: 'INVALID_VARIABLES',
  OPT_OUT: 'OPT_OUT',
  NUMBER_BLOCKED: 'NUMBER_BLOCKED',

  // Retryable errors
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Unknown/general errors
  TWILIO_ERROR: 'TWILIO_ERROR',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Twilio error code to error type mapping
 * See: https://www.twilio.com/docs/api/errors
 */
const TWILIO_ERROR_MAP = {
  // Permanent failures - recipient issues
  21211: { type: ErrorType.INVALID_PHONE, retryable: false },
  21614: { type: ErrorType.INVALID_PHONE, retryable: false },
  63001: { type: ErrorType.INVALID_PHONE, retryable: false },
  63003: { type: ErrorType.NUMBER_BLOCKED, retryable: false },
  63024: { type: ErrorType.OPT_OUT, retryable: false }, // WhatsApp opt-out
  63025: { type: ErrorType.NUMBER_BLOCKED, retryable: false },
  63032: { type: ErrorType.OPT_OUT, retryable: false }, // User blocked business

  // Template issues - permanent
  63016: { type: ErrorType.TEMPLATE_NOT_APPROVED, retryable: false },
  63017: { type: ErrorType.INVALID_VARIABLES, retryable: false },
  63018: { type: ErrorType.TEMPLATE_NOT_FOUND, retryable: false },

  // Rate limiting - retryable with backoff
  20429: { type: ErrorType.RATE_LIMITED, retryable: true },
  63038: { type: ErrorType.RATE_LIMITED, retryable: true },

  // Service issues - retryable
  20500: { type: ErrorType.SERVICE_UNAVAILABLE, retryable: true },
  30001: { type: ErrorType.SERVICE_UNAVAILABLE, retryable: true },
  30002: { type: ErrorType.SERVICE_UNAVAILABLE, retryable: true },
};

/**
 * User-friendly error messages in Portuguese
 */
const ERROR_MESSAGES = {
  [ErrorType.INVALID_PHONE]: 'Número de telefone inválido',
  [ErrorType.BLACKLISTED]: 'Número na lista de bloqueio',
  [ErrorType.TEMPLATE_NOT_FOUND]: 'Template não encontrado no Twilio',
  [ErrorType.TEMPLATE_NOT_APPROVED]: 'Template não aprovado pelo Meta',
  [ErrorType.MISSING_CONTENT_SID]: 'Template não configurado (ContentSid ausente)',
  [ErrorType.INVALID_VARIABLES]: 'Variáveis do template inválidas',
  [ErrorType.OPT_OUT]: 'Cliente optou por não receber mensagens',
  [ErrorType.NUMBER_BLOCKED]: 'Número bloqueou mensagens desta conta',
  [ErrorType.RATE_LIMITED]: 'Limite de envio atingido, aguarde para reenviar',
  [ErrorType.NETWORK_ERROR]: 'Erro de conexão, tente novamente',
  [ErrorType.TIMEOUT]: 'Tempo de resposta excedido',
  [ErrorType.SERVICE_UNAVAILABLE]: 'Serviço temporariamente indisponível',
  [ErrorType.TWILIO_ERROR]: 'Erro na API do Twilio',
  [ErrorType.UNKNOWN]: 'Erro desconhecido'
};

/**
 * Campaign error class with classification
 */
export class CampaignError extends Error {
  constructor(type, message, details = {}) {
    super(message || ERROR_MESSAGES[type] || ERROR_MESSAGES[ErrorType.UNKNOWN]);
    this.name = 'CampaignError';
    this.type = type;
    this.retryable = this.isRetryable(type);
    this.userMessage = ERROR_MESSAGES[type] || message;
    this.details = details;
    this.twilioCode = details.twilioCode || null;
  }

  isRetryable(type) {
    return [
      ErrorType.RATE_LIMITED,
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT,
      ErrorType.SERVICE_UNAVAILABLE
    ].includes(type);
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      retryable: this.retryable,
      details: this.details
    };
  }
}

/**
 * Classify an error from Twilio response
 * @param {object} twilioResponse - Response from Twilio API
 * @returns {CampaignError} Classified error
 */
export function classifyTwilioError(twilioResponse) {
  const { code, message, status } = twilioResponse;

  // Check if we have a mapped error code
  const mapping = TWILIO_ERROR_MAP[code];
  if (mapping) {
    return new CampaignError(mapping.type, message, {
      twilioCode: code,
      twilioMessage: message,
      httpStatus: status
    });
  }

  // Classify by HTTP status if no specific code
  if (status === 429) {
    return new CampaignError(ErrorType.RATE_LIMITED, message, { twilioCode: code });
  }
  if (status >= 500) {
    return new CampaignError(ErrorType.SERVICE_UNAVAILABLE, message, { twilioCode: code });
  }

  // Default to generic Twilio error
  return new CampaignError(ErrorType.TWILIO_ERROR, message, {
    twilioCode: code,
    twilioMessage: message
  });
}

/**
 * Classify a network/fetch error
 * @param {Error} error - Fetch error
 * @returns {CampaignError} Classified error
 */
export function classifyNetworkError(error) {
  const message = error.message?.toLowerCase() || '';

  if (message.includes('timeout') || message.includes('timed out')) {
    return new CampaignError(ErrorType.TIMEOUT, error.message);
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return new CampaignError(ErrorType.NETWORK_ERROR, error.message);
  }

  return new CampaignError(ErrorType.UNKNOWN, error.message);
}

/**
 * Validate campaign configuration before sending
 * @param {object} options - Campaign options
 * @throws {CampaignError} If validation fails
 */
export function validateCampaignConfig(options) {
  const { contentSid, messageBody, templateId } = options;

  // For marketing messages, ContentSid is required
  // Plain text fallback does NOT work for marketing outside 24h window
  if (!contentSid) {
    throw new CampaignError(
      ErrorType.MISSING_CONTENT_SID,
      `Template "${templateId || 'desconhecido'}" não possui ContentSid configurado. ` +
      'Mensagens de marketing requerem templates aprovados pelo Meta.',
      { templateId }
    );
  }

  // Validate ContentSid format (should start with HX)
  if (!contentSid.startsWith('HX')) {
    throw new CampaignError(
      ErrorType.INVALID_VARIABLES,
      `ContentSid inválido: ${contentSid}. Deve começar com "HX".`,
      { contentSid }
    );
  }

  return true;
}

/**
 * Retry configuration for transient errors
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,

  /**
   * Calculate delay with exponential backoff
   * @param {number} attempt - Current attempt (0-based)
   * @returns {number} Delay in milliseconds
   */
  getDelay(attempt) {
    const delay = this.baseDelayMs * Math.pow(2, attempt);
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.min(delay + jitter, this.maxDelayMs);
  }
};

/**
 * Execute a function with retry logic for transient failures
 * @param {Function} fn - Async function to execute
 * @param {object} options - Retry options
 * @returns {Promise<any>} Result of successful execution
 * @throws {CampaignError} If all retries exhausted
 */
export async function withRetry(fn, options = {}) {
  const { maxRetries = RETRY_CONFIG.maxRetries, context = {} } = options;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Classify the error
      const campaignError = error instanceof CampaignError
        ? error
        : classifyNetworkError(error);

      lastError = campaignError;

      // Don't retry permanent errors
      if (!campaignError.retryable) {
        throw campaignError;
      }

      // Don't retry if this was the last attempt
      if (attempt >= maxRetries) {
        campaignError.details.retriesExhausted = true;
        campaignError.details.attempts = attempt + 1;
        throw campaignError;
      }

      // Wait before retrying
      const delay = RETRY_CONFIG.getDelay(attempt);
      console.log(`[CampaignRetry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, {
        error: campaignError.type,
        context
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create a summary of campaign send results for display
 * @param {object} result - Send result from sendCampaignWithTracking
 * @returns {object} Summary for UI display
 */
export function createResultSummary(result) {
  const { successCount, failedCount, errors = [] } = result;

  // Group errors by type
  const errorsByType = {};
  for (const err of errors) {
    const type = err.type || ErrorType.UNKNOWN;
    if (!errorsByType[type]) {
      errorsByType[type] = { count: 0, message: ERROR_MESSAGES[type], customers: [] };
    }
    errorsByType[type].count++;
    if (err.customerId) {
      errorsByType[type].customers.push(err.customerId);
    }
  }

  // Determine overall status
  let status = 'success';
  if (failedCount > 0 && successCount === 0) {
    status = 'failed';
  } else if (failedCount > 0) {
    status = 'partial';
  }

  return {
    status,
    successCount,
    failedCount,
    errorsByType,
    hasRetryableErrors: errors.some(e => e.retryable),
    summary: generateSummaryText(successCount, failedCount, errorsByType)
  };
}

/**
 * Generate human-readable summary text
 */
function generateSummaryText(success, failed, errorsByType) {
  const parts = [];

  if (success > 0) {
    parts.push(`✅ ${success} mensagem(ns) enviada(s)`);
  }

  if (failed > 0) {
    parts.push(`❌ ${failed} falha(s)`);

    // Add specific error reasons
    const reasons = Object.entries(errorsByType)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => `• ${data.message}: ${data.count}`)
      .join('\n');

    if (reasons) {
      parts.push('\nDetalhes:\n' + reasons);
    }
  }

  return parts.join('\n');
}

export default {
  ErrorType,
  CampaignError,
  classifyTwilioError,
  classifyNetworkError,
  validateCampaignConfig,
  withRetry,
  createResultSummary,
  RETRY_CONFIG
};
