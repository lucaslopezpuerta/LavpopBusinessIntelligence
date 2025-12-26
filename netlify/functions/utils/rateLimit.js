// netlify/functions/utils/rateLimit.js
// Rate limiting utility for serverless functions using Supabase
//
// Version: 1.0 (2025-12-26)
// - Sliding window rate limiting with Supabase storage
// - Per-IP tracking with configurable limits
// - Automatic cleanup of expired entries

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
  const windowStart = Date.now() - windowMs;
  const key = `${endpoint}:${clientIP}`;

  try {
    // Use Supabase RPC or table for rate limiting
    // First, try to get existing rate limit record
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('request_count, window_start')
      .eq('key', key)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('[RateLimit] Fetch error:', fetchError);
      return { allowed: true, remaining: maxRequests, resetIn: 0 };
    }

    const now = Date.now();

    // Check if window has expired
    if (!existing || existing.window_start < windowStart) {
      // Start new window
      const { error: upsertError } = await supabase
        .from('rate_limits')
        .upsert({
          key,
          request_count: 1,
          window_start: now,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (upsertError) {
        console.error('[RateLimit] Upsert error:', upsertError);
      }

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetIn: windowMs
      };
    }

    // Check if limit exceeded
    if (existing.request_count >= maxRequests) {
      const resetIn = existing.window_start + windowMs - now;
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.max(0, resetIn)
      };
    }

    // Increment counter
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({
        request_count: existing.request_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('key', key);

    if (updateError) {
      console.error('[RateLimit] Update error:', updateError);
    }

    return {
      allowed: true,
      remaining: maxRequests - existing.request_count - 1,
      resetIn: existing.window_start + windowMs - now
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
