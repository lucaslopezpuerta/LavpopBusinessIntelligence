// InsightBox.jsx v2.2 - SMOOTH HOVER ANIMATIONS
// Actionable insight box for Intelligence sections
// Design System v6.4 compliant - Variant A with cosmic dark mode
//
// CHANGELOG:
// v2.2 (2026-02-09): Smooth hover animations (KPICard pattern)
//   - Hover: tween (200ms easeOut) replaces spring — eliminates wobble/oscillation
//   - Variants pattern (rest/hover/tap) like KPICard for clean state separation
//   - Entrance spring: SPRING.SMOOTH (300/20) for gentle settle, less overshoot
//   - Entrance travel: y:12 + scale:0.98 (subtler than v2.1)
//   - Hover shadow: dual-layer (ambient + category glow) from KPICard
//   - Non-clickable items: entrance only, no hover/tap variants
// v2.1 (2026-02-09): Animation physics polish
//   - Entrance: SPRING.MEDIUM (350/22) replaces SPRING.QUICK (500/30)
//   - Hover: spring-based (SPRING.SNAPPY) — felt bouncy, replaced in v2.2
// v2.0 (2026-02-09): Cosmic design rewrite
//   - Migrated from dark: prefix to useTheme() pattern (Design System v6.4 compliance)
//   - Glassmorphic icon containers, category-colored left border accent (3px)
//   - Cosmic dark mode colors (space-dust tones)
//   - API fully backward-compatible
// v1.4 (2026-02-05): Focus & interactive improvements (Design System v6.4)
// v1.3 (2025-12-15): Clickable insights support
// v1.2 (2025-11-30): Unified API - supports both single item and array patterns
// v1.1 (2025-11-30): Extracted from Intelligence.jsx
// v1.0 (2025-11-29): Original inline component

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Zap, TrendingUp, Info, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SPRING, TWEEN } from '../../constants/animations';

// Style definitions per type — resolved dynamically via getStyles(isDark)
const getStyles = (isDark) => ({
  success: {
    bg: isDark ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-green-50 border-green-200',
    icon: isDark ? 'text-emerald-400' : 'text-green-600',
    title: isDark ? 'text-emerald-100' : 'text-green-900',
    message: isDark ? 'text-emerald-300/80' : 'text-green-700',
    gradient: isDark ? 'from-emerald-500/90 to-emerald-600/90' : 'from-emerald-500 to-emerald-600',
    accent: '#22c55e',
    borderAccent: isDark ? 'border-l-emerald-400/50' : 'border-l-emerald-400',
    Icon: CheckCircle
  },
  warning: {
    bg: isDark ? 'bg-amber-500/[0.06] border-amber-500/20' : 'bg-amber-50 border-amber-200',
    icon: isDark ? 'text-amber-400' : 'text-amber-600',
    title: isDark ? 'text-amber-100' : 'text-amber-900',
    message: isDark ? 'text-amber-300/80' : 'text-amber-700',
    gradient: isDark ? 'from-amber-500/90 to-amber-600/90' : 'from-amber-500 to-amber-600',
    accent: '#f59e0b',
    borderAccent: isDark ? 'border-l-amber-400/50' : 'border-l-amber-400',
    Icon: AlertCircle
  },
  error: {
    bg: isDark ? 'bg-red-500/[0.06] border-red-500/20' : 'bg-red-50 border-red-200',
    icon: isDark ? 'text-red-400' : 'text-red-600',
    title: isDark ? 'text-red-100' : 'text-red-900',
    message: isDark ? 'text-red-300/80' : 'text-red-700',
    gradient: isDark ? 'from-red-500/90 to-red-600/90' : 'from-red-500 to-red-600',
    accent: '#ef4444',
    borderAccent: isDark ? 'border-l-red-400/50' : 'border-l-red-400',
    Icon: AlertCircle
  },
  info: {
    bg: isDark ? 'bg-stellar-cyan/[0.06] border-stellar-cyan/20' : 'bg-blue-50 border-blue-200',
    icon: isDark ? 'text-stellar-cyan' : 'text-blue-600',
    title: isDark ? 'text-blue-100' : 'text-blue-900',
    message: isDark ? 'text-blue-300/80' : 'text-blue-700',
    gradient: isDark ? 'from-stellar-cyan/90 to-cyan-600/90' : 'from-blue-500 to-blue-600',
    accent: '#00aeef',
    borderAccent: isDark ? 'border-l-stellar-cyan/50' : 'border-l-blue-400',
    Icon: Zap
  },
  action: {
    bg: isDark ? 'bg-purple-500/[0.06] border-purple-500/20' : 'bg-purple-50 border-purple-200',
    icon: isDark ? 'text-purple-400' : 'text-purple-600',
    title: isDark ? 'text-purple-100' : 'text-purple-900',
    message: isDark ? 'text-purple-300/80' : 'text-purple-700',
    gradient: isDark ? 'from-purple-500/90 to-purple-600/90' : 'from-purple-500 to-purple-600',
    accent: '#a855f7',
    borderAccent: isDark ? 'border-l-purple-400/50' : 'border-l-purple-400',
    Icon: TrendingUp
  },
  default: {
    bg: isDark ? 'bg-slate-500/[0.06] border-slate-500/20' : 'bg-slate-50 border-slate-200',
    icon: isDark ? 'text-slate-400' : 'text-slate-600',
    title: isDark ? 'text-slate-100' : 'text-slate-900',
    message: isDark ? 'text-slate-300/80' : 'text-slate-700',
    gradient: isDark ? 'from-slate-500/90 to-slate-600/90' : 'from-slate-500 to-slate-600',
    accent: '#94a3b8',
    borderAccent: isDark ? 'border-l-slate-400/50' : 'border-l-slate-400',
    Icon: Info
  }
});

// Convert hex to rgba for dynamic glow
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Hover variants — tween-based (KPICard pattern), no spring wobble
const getHoverVariants = (accentHex, isDark) => ({
  rest: {
    y: 0,
    scale: 1,
    boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.06)'
  },
  hover: {
    y: -3,
    scale: 1.01,
    boxShadow: isDark
      ? `0 12px 32px rgba(0,0,0,0.35), 0 0 16px ${hexToRgba(accentHex, 0.12)}`
      : '0 10px 28px rgba(0,0,0,0.1)'
  },
  tap: {
    scale: 0.98,
    y: 0
  }
});

// Reduced motion — no visual movement
const hoverReduced = { rest: {}, hover: {}, tap: {} };

/**
 * Single insight item renderer — with cosmic design language
 */
const InsightItem = ({ type, title, text, message, action, onClick, customerCount, className = '', animationDelay = 0 }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const styles = getStyles(isDark);
  const style = styles[type] || styles.default;
  const { Icon } = style;
  const displayMessage = message || text;
  const isClickable = !!onClick;

  const handleClick = (e) => {
    if (isClickable) {
      e.stopPropagation();
      onClick();
    }
  };

  const MotionWrapper = isClickable ? motion.button : motion.div;
  const hoverVariants = isClickable
    ? (prefersReducedMotion ? hoverReduced : getHoverVariants(style.accent, isDark))
    : undefined;

  return (
    <MotionWrapper
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { ...SPRING.SMOOTH, delay: animationDelay } }}
      variants={hoverVariants}
      whileHover={isClickable ? 'hover' : undefined}
      whileTap={isClickable && !prefersReducedMotion ? 'tap' : undefined}
      transition={TWEEN.HOVER}
      className={`
        ${style.bg} border border-l-[3px] ${style.borderAccent} rounded-xl p-3 sm:p-4 text-left w-full ${className}
        ${isClickable
          ? `cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2 ${isDark ? 'focus-visible:ring-offset-space-dust' : 'focus-visible:ring-offset-white'}`
          : ''}
      `}
      role={isClickable ? 'button' : 'alert'}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && handleClick(e) : undefined}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* Glassmorphic icon container */}
        <div className={`
          relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 overflow-hidden
          ${isDark
            ? 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10'
            : `bg-gradient-to-br ${style.gradient}`}
        `}>
          {isDark && (
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{ background: `radial-gradient(circle at center, ${style.accent}, transparent 70%)` }}
            />
          )}
          <Icon
            className={`relative z-10 w-4 h-4 ${isDark ? style.icon : 'text-white'}`}
            aria-hidden="true"
          />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold text-sm sm:text-base ${style.title} mb-0.5 sm:mb-1`}>
              {title}
            </h4>
          )}
          <p className={`text-xs sm:text-sm ${style.message} leading-relaxed`}>
            {displayMessage}
          </p>
          {action && !isClickable && (
            <button
              className={`mt-2 text-xs sm:text-sm font-medium ${style.icon} hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current ${isDark ? 'focus-visible:ring-offset-space-dust' : 'focus-visible:ring-offset-white'} rounded`}
            >
              {action}
            </button>
          )}
        </div>

        {/* Customer count badge and chevron for clickable items */}
        {isClickable && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {customerCount !== undefined && customerCount > 0 && (
              <span className={`
                text-xs font-bold px-2 py-0.5 rounded-full
                ${isDark
                  ? `bg-white/5 ${style.icon}`
                  : `bg-white/60 ${style.icon}`}
              `}>
                {customerCount}
              </span>
            )}
            <ChevronRight className={`w-4 h-4 ${style.icon}`} />
          </div>
        )}
      </div>
    </MotionWrapper>
  );
};

/**
 * Unified InsightBox component
 * Supports two API patterns:
 * 1. Single item: <InsightBox type="success" title="..." message="..." onClick={...} customerCount={5} />
 * 2. Array: <InsightBox insights={[{type, text, onClick, customerCount}, ...]} />
 */
const InsightBox = ({
  // Single item props
  type = 'info',
  title,
  message,
  action,
  onClick,
  customerCount,
  className = '',
  // Array pattern prop
  insights
}) => {
  // Array pattern: render multiple insights with stagger
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
            onClick={insight.onClick}
            customerCount={insight.customerCount}
            animationDelay={index * 0.07}
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
        onClick={onClick}
        customerCount={customerCount}
        className={className}
      />
    );
  }

  // No content
  return null;
};

export default InsightBox;
