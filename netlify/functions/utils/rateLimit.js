// netlify/functions/utils/rateLimit.js
// Rate limiting utility for serverless functions using Supabase
//
// Version: 2.0 (2026-02-07)
// - Atomic rate limiting via check_rate_limit() RPC (fixes TOCTOU race)
// - Single DB round-trip per check (INSERT ON CONFLICT with row lock)
//
// Version: 1.0 (2025-12-26)
// - Sliding window rate limiting with Supabase storage
// - Per-IP tracking with configurable limits

const { createClient } = require('@supabase/supabase-js');

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  // Default: 100 requests per minute per IP
  windowMs: 60 * 1000,  // 1 minute window
  maxRequests: 100,      // Max requests per window

  // Stricter limits for sensitive endpoints
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 20
  },

  // Looser limits for read-only endpoints
  relaxed: {
    windowMs: 60 * 1000,
    maxRequests: 200
  }
};

// Get client IP from Netlify function event
function getClientIP(event) {
  // Netlify forwards the real IP in x-forwarded-for
  const forwarded = event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'];
  if (forwarded) {
    // Take the first IP (client), not proxy IPs
    return forwarded.split(',')[0].trim();
  }
  // Fallback to Netlify client IP header
  return event.headers['client-ip'] || event.headers['Client-Ip'] || 'unknown';
}

// Initialize Supabase client for rate limiting
function getRateLimitSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.warn('[RateLimit] Supabase not configured - rate limiting disabled');
    return null;
  }

  return createClient(url, key);
}

/**
 * Check and update rate limit for a request
 * @param {Object} event - Netlify function event
 * @param {string} endpoint - Endpoint identifier (e.g., 'supabase-api', 'twilio-whatsapp')
 * @param {string} limitType - 'default', 'strict', or 'relaxed'
 * @returns {Object} { allowed: boolean, remaining: number, resetIn: number }
 */
async function checkRateLimit(event, endpoint = 'default', limitType = 'default') {
  const supabase = getRateLimitSupabase();

  // If Supabase not available, allow request (fail open)
  if (!supabase) {
    return { allowed: true, remaining: 999, resetIn: 0 };
  }

  const config = RATE_LIMIT_CONFIG[limitType] || RATE_LIMIT_CONFIG;
  const { windowMs, maxRequests } = config;

  const clientIP = getClientIP(event);
  const key = `${endpoint}:${clientIP}`;

  try {
    // Atomic rate limit check — single DB round-trip with row-level lock
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_window_ms: windowMs,
      p_max_requests: maxRequests
    });

    if (error) {
      console.error('[RateLimit] RPC error:', error);
      return { allowed: true, remaining: maxRequests, resetIn: 0 };
    }

    return {
      allowed: data.allowed,
      remaining: data.remaining,
      resetIn: data.reset_in
    };
  } catch (error) {
    console.error('[RateLimit] Error:', error);
    // Fail open - allow request if rate limiting fails
    return { allowed: true, remaining: maxRequests, resetIn: 0 };
  }
}

/**
 * Generate rate limit headers
 * @param {Object} result - Result from checkRateLimit
 * @param {Object} config - Rate limit configuration used
 * @returns {Object} Headers to include in response
 */
function getRateLimitHeaders(result, limitType = 'default') {
  const config = RATE_LIMIT_CONFIG[limitType] || RATE_LIMIT_CONFIG;
  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000))
  };
}

/**
 * Rate limit response generator
 * @param {Object} headers - Existing response headers
 * @param {Object} result - Result from checkRateLimit
 * @returns {Object} Netlify function response
 */
function rateLimitResponse(headers, result) {
  return {
    statusCode: 429,
    headers: {
      ...headers,
      ...getRateLimitHeaders(result),
      'Retry-After': String(Math.ceil(result.resetIn / 1000))
    },
    body: JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(result.resetIn / 1000)
    })
  };
}

module.exports = {
  checkRateLimit,
  getRateLimitHeaders,
  rateLimitResponse,
  getClientIP,
  RATE_LIMIT_CONFIG
};
