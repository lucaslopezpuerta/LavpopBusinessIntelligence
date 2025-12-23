// logger.js v1.0 - Centralized Logging Utility
// Production-safe logging with development-only debug mode
//
// USAGE:
// import { logger } from './logger';
// logger.debug('Category', 'Message', { optionalData });
// logger.info('Category', 'Message', { optionalData });
// logger.warn('Category', 'Message', { optionalData });
// logger.error('Category', 'Message', error);
//
// Debug logs only appear in development mode (import.meta.env.DEV)
// Info, warn, and error logs always appear

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Debug log - only shows in development mode
   * Use for verbose debugging information that shouldn't appear in production
   */
  debug: (category, message, data) => {
    if (isDev) {
      if (data !== undefined) {
        console.log(`[${category}]`, message, data);
      } else {
        console.log(`[${category}]`, message);
      }
    }
  },

  /**
   * Info log - always shows
   * Use for important operational information
   */
  info: (category, message, data) => {
    if (data !== undefined) {
      console.log(`[${category}]`, message, data);
    } else {
      console.log(`[${category}]`, message);
    }
  },

  /**
   * Warning log - always shows
   * Use for fallbacks, degraded functionality, non-critical issues
   */
  warn: (category, message, data) => {
    if (data !== undefined) {
      console.warn(`[${category}]`, message, data);
    } else {
      console.warn(`[${category}]`, message);
    }
  },

  /**
   * Error log - always shows
   * Use for errors, exceptions, failed operations
   */
  error: (category, message, error) => {
    if (error !== undefined) {
      console.error(`[${category}]`, message, error);
    } else {
      console.error(`[${category}]`, message);
    }
  }
};

export default logger;
