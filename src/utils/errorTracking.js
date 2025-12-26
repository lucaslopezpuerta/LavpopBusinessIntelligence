// errorTracking.js - Sentry error tracking integration
// Version: 1.0 (2025-12-26)
//
// Provides centralized error tracking for production monitoring.
// Only active in production builds to avoid development noise.
//
// Usage:
//   import { initErrorTracking, captureError, captureMessage } from './errorTracking';
//
//   // Initialize once at app startup
//   initErrorTracking();
//
//   // Capture errors
//   captureError(error, { component: 'Dashboard', action: 'loadData' });
//
//   // Capture messages/events
//   captureMessage('User exported data', 'info', { format: 'csv' });

import * as Sentry from '@sentry/react';

// Environment detection
const IS_PRODUCTION = import.meta.env.PROD;
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

// Track initialization state
let isInitialized = false;

/**
 * Initialize Sentry error tracking
 * Only activates in production with a valid DSN
 */
export function initErrorTracking() {
  // Skip if already initialized
  if (isInitialized) {
    return;
  }

  // Only initialize in production with a valid DSN
  if (!IS_PRODUCTION) {
    console.info('[ErrorTracking] Disabled in development mode');
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('[ErrorTracking] VITE_SENTRY_DSN not configured - error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,

      // Environment tag
      environment: IS_PRODUCTION ? 'production' : 'development',

      // Release version (from package.json via Vite)
      release: `lavpop-bi@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

      // Sample rates
      tracesSampleRate: 0.1,      // 10% of transactions for performance
      replaysSessionSampleRate: 0, // No session replays (privacy)
      replaysOnErrorSampleRate: 0, // No error replays (privacy)

      // Filter out noisy errors
      ignoreErrors: [
        // Browser extensions
        /extensions\//i,
        /^chrome-extension:\/\//,
        /^moz-extension:\/\//,

        // Network errors (handled by app)
        'Network request failed',
        'Failed to fetch',
        'Load failed',
        'NetworkError',

        // User-initiated actions
        'ResizeObserver loop',
        'AbortError',

        // Third-party script errors
        /Script error\.?/,
        /Blocked a frame with origin/,
      ],

      // Don't send PII
      beforeSend(event) {
        // Remove sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            // Redact API keys from URLs
            if (breadcrumb.data?.url) {
              breadcrumb.data.url = redactSensitiveData(breadcrumb.data.url);
            }
            return breadcrumb;
          });
        }

        // Remove sensitive request data
        if (event.request?.data) {
          event.request.data = '[REDACTED]';
        }

        return event;
      },

      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
    });

    isInitialized = true;
    console.info('[ErrorTracking] Sentry initialized');

  } catch (error) {
    console.error('[ErrorTracking] Failed to initialize Sentry:', error);
  }
}

/**
 * Capture an error with optional context
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context (component, action, etc.)
 */
export function captureError(error, context = {}) {
  // Always log to console
  console.error('[Error]', error, context);

  if (!isInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    // Add context as tags and extra data
    if (context.component) {
      scope.setTag('component', context.component);
    }
    if (context.action) {
      scope.setTag('action', context.action);
    }

    // Add all context as extra data
    scope.setExtras(context);

    Sentry.captureException(error);
  });
}

/**
 * Capture a message/event
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 * @param {Object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!isInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);
    scope.setExtras(context);
    Sentry.captureMessage(message);
  });
}

/**
 * Set user context for error tracking
 * @param {Object} user - User info (id, email, etc.)
 */
export function setUser(user) {
  if (!isInitialized) {
    return;
  }

  if (user) {
    Sentry.setUser({
      id: user.id,
      // Don't include email/name for privacy
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add a breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb) {
  if (!isInitialized) {
    return;
  }

  Sentry.addBreadcrumb({
    category: breadcrumb.category || 'app',
    message: breadcrumb.message,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  });
}

/**
 * Create a custom Sentry ErrorBoundary wrapper
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Redact sensitive data from strings
 * @param {string} str - String to redact
 * @returns {string} Redacted string
 */
function redactSensitiveData(str) {
  if (!str) return str;

  return str
    // API keys
    .replace(/apikey=[^&]+/gi, 'apikey=[REDACTED]')
    .replace(/key=[^&]+/gi, 'key=[REDACTED]')
    .replace(/token=[^&]+/gi, 'token=[REDACTED]')
    // Supabase keys
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT_REDACTED]');
}

// Export Sentry for advanced usage
export { Sentry };
