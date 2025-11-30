// InsightBox.jsx v1.2
// Actionable insight box for Intelligence sections
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.2 (2025-11-30): Unified API - supports both single item and array patterns
//   - Single item: <InsightBox type="success" title="..." message="..." />
//   - Array: <InsightBox insights={[{type, text}, ...]} />
// v1.1 (2025-11-30): Extracted from Intelligence.jsx
//   - Added aria-hidden to decorative icons
//   - Improved responsive styling
// v1.0 (2025-11-29): Original inline component

import React from 'react';
import { CheckCircle, AlertCircle, Zap, TrendingUp, Info } from 'lucide-react';

const STYLES = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-900 dark:text-green-100',
    message: 'text-green-700 dark:text-green-300',
    Icon: CheckCircle
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
    message: 'text-amber-700 dark:text-amber-300',
    Icon: AlertCircle
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    message: 'text-red-700 dark:text-red-300',
    Icon: AlertCircle
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    message: 'text-blue-700 dark:text-blue-300',
    Icon: Zap
  },
  action: {
    bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    title: 'text-purple-900 dark:text-purple-100',
    message: 'text-purple-700 dark:text-purple-300',
    Icon: TrendingUp
  },
  default: {
    bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    icon: 'text-slate-600 dark:text-slate-400',
    title: 'text-slate-900 dark:text-slate-100',
    message: 'text-slate-700 dark:text-slate-300',
    Icon: Info
  }
};

/**
 * Single insight item renderer
 */
const InsightItem = ({ type, title, text, message, action, className = '' }) => {
  const style = STYLES[type] || STYLES.default;
  const { Icon } = style;
  const displayMessage = message || text; // Support both 'message' and 'text' props

  return (
    <div
      className={`${style.bg} border rounded-xl p-3 sm:p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <Icon
          className={`w-4 h-4 sm:w-5 sm:h-5 ${style.icon} flex-shrink-0 mt-0.5`}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold text-sm sm:text-base ${style.title} mb-0.5 sm:mb-1`}>
              {title}
            </h4>
          )}
          <p className={`text-xs sm:text-sm ${style.message} leading-relaxed`}>
            {displayMessage}
          </p>
          {action && (
            <button
              className={`mt-2 text-xs sm:text-sm font-medium ${style.icon} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded`}
            >
              {action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Unified InsightBox component
 * Supports two API patterns:
 * 1. Single item: <InsightBox type="success" title="..." message="..." />
 * 2. Array: <InsightBox insights={[{type, text}, {type, text}]} />
 */
const InsightBox = ({
  // Single item props
  type = 'info',
  title,
  message,
  action,
  className = '',
  // Array pattern prop
  insights
}) => {
  // Array pattern: render multiple insights
  if (insights && Array.isArray(insights) && insights.length > 0) {
    return (
      <div className={`mt-4 space-y-2 ${className}`}>
        {insights.map((insight, index) => (
          <InsightItem
            key={index}
            type={insight.type}
            text={insight.text}
            title={insight.title}
            message={insight.message}
            action={insight.action}
          />
        ))}
      </div>
    );
  }

  // Single item pattern: render one insight
  if (message || title) {
    return (
      <InsightItem
        type={type}
        title={title}
        message={message}
        action={action}
        className={className}
      />
    );
  }

  // No content
  return null;
};

export default InsightBox;
