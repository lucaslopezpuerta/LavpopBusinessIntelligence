// InsightCard.jsx v2.5 - VISUAL ENHANCEMENT
// Design System v6.4 - Variant A (Solid cards) with category colors
//
// CHANGELOG:
// v2.5 (2026-02-09): Visual enhancement pass
//   - Priority-tiered gradient backgrounds (subtle category wash for priority >= 9)
//   - Confidence meter: taller bar (h-1.5), text labels (Baixa/Média/Alta) replace raw %
//   - Action button: category-colored border accent with hover brightening
//   - "Urgente" badge for critical cards (priority >= 9)
//   - AI cards: faint purple radial glow behind icon container
// v2.4 (2026-02-07): Motion perf fixes
//   - Removed permanent will-change:transform (Framer auto-promotes during animation)
//   - Dismiss button: transition-all → transition-colors (prevents CSS/Framer transform fight)
// v2.3 (2026-02-07): Enhanced card entrance for category cascade
//   - Entrance: opacity + y:10 + scale:0.97 → 1 (materializing effect)
// v2.2 (2026-02-07): Emil Kowalski animation audit
//   - Exit: ease-out easing + opacity-only fallback for reduced motion
//   - Dismiss/compact buttons: motion.button with whileTap(0.97)
//   - Confidence meter: TWEEN.PROGRESS (0.45s) replaces TWEEN.CHART (0.8s)
//   - will-change:transform on card root to prevent 1px hover shift
// v2.1 (2026-02-07): Animation polish pass
//   - KPICard-style hover lift with category-colored glow (dark mode)
//   - Action/snooze buttons use motion.button with whileTap feedback
//   - Confidence meter bar animates on mount (TWEEN.CHART 0.8s)
//   - AI badge purple shimmer via CSS class
//   - Accepts animationDelay prop for parent stagger
//   - Uses SPRING.QUICK/SPRING.SNAPPY from constants/animations
// v2.0 (2026-02-07): Full accessibility + visual identity rewrite
//   - Replaced emoji icons with Lucide SVGs in colored icon containers
//   - Always-visible action buttons (no hidden click-to-reveal)
//   - Mobile-friendly dismiss: visible by default, hover-reveal on desktop
//   - Touch targets increased to 44px minimum on all interactive elements
//   - Category-colored left border on every card (stronger for priority >= 9)
//   - Added cursor-pointer to clickable card
// v1.2 (2026-02-06): Expandable AI descriptions
//   - "Ver mais/Ver menos" toggle for AI insights with >180 chars
// v1.1 (2026-02-06): Forward ref for AnimatePresence popLayout
// v1.0 (2026-02-06): Initial implementation

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X, Clock, ChevronRight, Sparkles, Flame,
  Target, Crown, UserPlus, Trophy,
  ShieldAlert, TrendingDown, RefreshCw, AlertTriangle,
  Brain, Lightbulb
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { TWEEN, SPRING } from '../../constants/animations';

// Maps icon name strings from recommendationEngine to Lucide components
const ICON_MAP = {
  'target': Target,
  'crown': Crown,
  'user-plus': UserPlus,
  'trophy': Trophy,
  'shield-alert': ShieldAlert,
  'trending-down': TrendingDown,
  'refresh-cw': RefreshCw,
  'alert-triangle': AlertTriangle,
  'brain': Brain,
  'lightbulb': Lightbulb,
};

const CATEGORY_COLORS = {
  campaign: {
    light: 'text-blue-600', dark: 'text-stellar-cyan',
    gradient: 'from-blue-500 to-blue-600', accent: '#00aeef',
    border: 'border-l-blue-400 dark:border-l-stellar-cyan/40',
    borderStrong: 'border-l-blue-500 dark:border-l-stellar-cyan/70',
  },
  churn: {
    light: 'text-red-600', dark: 'text-red-400',
    gradient: 'from-red-500 to-red-600', accent: '#f87171',
    border: 'border-l-red-300 dark:border-l-red-400/40',
    borderStrong: 'border-l-red-500 dark:border-l-red-400/70',
  },
  alert: {
    light: 'text-amber-600', dark: 'text-amber-400',
    gradient: 'from-amber-500 to-amber-600', accent: '#fbbf24',
    border: 'border-l-amber-300 dark:border-l-amber-400/40',
    borderStrong: 'border-l-amber-500 dark:border-l-amber-400/70',
  },
  celebration: {
    light: 'text-green-600', dark: 'text-cosmic-green',
    gradient: 'from-emerald-500 to-emerald-600', accent: '#00d68f',
    border: 'border-l-green-300 dark:border-l-cosmic-green/40',
    borderStrong: 'border-l-green-500 dark:border-l-cosmic-green/70',
  },
  ai_insight: {
    light: 'text-purple-600', dark: 'text-purple-400',
    gradient: 'from-purple-500 to-purple-600', accent: '#a78bfa',
    border: 'border-l-purple-300 dark:border-l-purple-400/40',
    borderStrong: 'border-l-purple-500 dark:border-l-purple-400/70',
  },
  operational: {
    light: 'text-slate-600', dark: 'text-slate-400',
    gradient: 'from-slate-500 to-slate-600', accent: '#94a3b8',
    border: 'border-l-slate-300 dark:border-l-slate-400/40',
    borderStrong: 'border-l-slate-400 dark:border-l-slate-400/70',
  }
};

// Convert hex to rgba for dynamic glow colors
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Confidence label mapping
const getConfidenceLabel = (confidence) =>
  confidence > 0.7 ? 'Alta' : confidence > 0.4 ? 'Média' : 'Baixa';

// Priority background gradient — subtle category wash for high-priority cards
const getPriorityBackground = (isHighPriority, aiGenerated, accentHex, isDark) => {
  if (aiGenerated) {
    return {
      background: isDark
        ? `linear-gradient(135deg, rgba(167,139,250,0.04) 0%, transparent 60%)`
        : `linear-gradient(135deg, rgba(167,139,250,0.06) 0%, transparent 60%)`
    };
  }
  if (isHighPriority) {
    return {
      background: isDark
        ? `linear-gradient(135deg, ${hexToRgba(accentHex, 0.04)} 0%, transparent 60%)`
        : `linear-gradient(135deg, ${hexToRgba(accentHex, 0.06)} 0%, transparent 60%)`
    };
  }
  return {};
};

// Hover target factory — returns a whileHover object (not variant)
const createHoverTarget = (accentHex, isDark) => ({
  y: -2,
  scale: 1.005,
  boxShadow: isDark
    ? `0 8px 24px rgba(0,0,0,0.3), 0 0 16px ${hexToRgba(accentHex, 0.1)}`
    : '0 8px 24px rgba(0,0,0,0.08)'
});

const InsightCard = React.forwardRef(({ recommendation, onAction, onDismiss, onSnooze, compact = false, animationDelay = 0 }, ref) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  const {
    icon,
    title,
    description,
    actionLabel,
    actionType,
    category = 'campaign',
    aiGenerated,
    aiConfidence,
    priority
  } = recommendation;

  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.campaign;
  const isHighPriority = priority >= 9;

  // Resolve Lucide icon component from string name
  const IconComponent = (typeof icon === 'string' && ICON_MAP[icon]) || Lightbulb;

  // Memoize hover target (direct object for whileHover, not variant)
  const hoverTarget = useMemo(() =>
    prefersReducedMotion
      ? undefined
      : createHoverTarget(colors.accent, isDark),
    [prefersReducedMotion, colors.accent, isDark]
  );

  // Priority-tiered gradient background
  const priorityBg = useMemo(() =>
    getPriorityBackground(isHighPriority, aiGenerated, colors.accent, isDark),
    [isHighPriority, aiGenerated, colors.accent, isDark]
  );

  const handleAction = () => {
    onAction?.(recommendation);
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    onDismiss?.(recommendation);
  };

  const handleSnooze = (e) => {
    e.stopPropagation();
    onSnooze?.(recommendation);
  };

  const borderClass = isHighPriority ? colors.borderStrong : colors.border;

  // Confidence bar glow color (dark mode only)
  const confidenceGlow = aiConfidence > 0.7
    ? 'rgba(0,214,143,0.4)' : aiConfidence > 0.4
    ? 'rgba(251,191,36,0.4)' : 'rgba(248,113,113,0.4)';

  return (
    <motion.div
      ref={ref}
      layout={prefersReducedMotion ? false : 'position'}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { ...SPRING.QUICK, delay: animationDelay } }}
      exit={prefersReducedMotion
        ? { opacity: 0, transition: { duration: 0.12, ease: 'easeOut' } }
        : { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: 'easeOut' } }
      }
      whileHover={hoverTarget}
      transition={TWEEN.HOVER}
      className={`
        group relative rounded-xl border border-l-[3px] cursor-pointer
        ${borderClass}
        ${isDark
          ? 'bg-space-dust/80 border-stellar-cyan/10'
          : 'bg-white border-slate-200 shadow-sm'}
        ${compact ? 'p-3' : 'p-3.5 sm:p-4'}
      `}
      style={priorityBg}
    >
      {/* Header row: Icon + Title + AI Badge + Dismiss */}
      <div className="flex items-start gap-2.5">
        {/* Category icon — glassmorphic container (matches KPICard pattern) */}
        <div className={`
          relative flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 overflow-hidden
          ${isDark
            ? 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm'
            : `bg-gradient-to-br ${colors.gradient}`}
        `}>
          {isDark && (
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ background: `radial-gradient(circle at center, ${colors.accent}, transparent 70%)` }}
            />
          )}
          <IconComponent className={`relative z-10 w-4 h-4 ${isDark ? colors.dark : 'text-white'}`} />
        </div>

        {/* Title + Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className={`font-semibold leading-tight ${compact ? 'text-xs' : 'text-sm'} ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h3>
            {/* Priority badge for critical cards */}
            {isHighPriority && !aiGenerated && (
              <span className={`
                inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0
                ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}
              `}>
                <Flame className="w-2.5 h-2.5" />
                Urgente
              </span>
            )}
            {/* AI Badge with shimmer */}
            {aiGenerated && (
              <span className={`
                inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ai-badge-shimmer
                ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}
              `}>
                <Sparkles className="w-2.5 h-2.5" />
                IA
              </span>
            )}
          </div>

          {/* Description — AI insights expandable, regular get 2-line clamp */}
          {!compact && description && (
            <div>
              <p className={`mt-1 text-xs leading-relaxed ${
                !expanded && aiGenerated ? 'line-clamp-4' : !aiGenerated ? 'line-clamp-2' : ''
              } ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {description}
              </p>
              {aiGenerated && description.length > 180 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                  className={`text-[10px] mt-0.5 font-medium ${
                    isDark ? 'text-stellar-cyan/70 hover:text-stellar-cyan' : 'text-blue-500 hover:text-blue-700'
                  }`}
                >
                  {expanded ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </div>
          )}

          {/* Confidence meter — animated bar fill with text label */}
          {!compact && aiConfidence != null && aiConfidence > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Confianca
              </span>
              <div className={`relative flex-1 max-w-[88px] h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700/80' : 'bg-slate-200'}`}>
                <motion.div
                  className={`h-full rounded-full ${
                    aiConfidence > 0.7 ? 'bg-cosmic-green' :
                    aiConfidence > 0.4 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  initial={prefersReducedMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : TWEEN.PROGRESS}
                  style={{
                    width: `${Math.round(aiConfidence * 100)}%`,
                    transformOrigin: 'left',
                    boxShadow: isDark ? `0 0 6px ${confidenceGlow}` : 'none'
                  }}
                />
                {/* Segment tick marks */}
                {[25, 50, 75].map(tick => (
                  <div
                    key={tick}
                    className={`absolute top-0 bottom-0 w-px ${isDark ? 'bg-slate-600/50' : 'bg-slate-300/60'}`}
                    style={{ left: `${tick}%` }}
                  />
                ))}
              </div>
              <span className={`text-[10px] font-medium min-w-[30px] ${
                aiConfidence > 0.7
                  ? isDark ? 'text-cosmic-green' : 'text-emerald-600'
                  : aiConfidence > 0.4
                    ? isDark ? 'text-amber-400' : 'text-amber-600'
                    : isDark ? 'text-red-400' : 'text-red-600'
              }`}>
                {getConfidenceLabel(aiConfidence)}
              </span>
            </div>
          )}
        </div>

        {/* Dismiss button — visible on mobile, hover-reveal on desktop */}
        <motion.button
          onClick={handleDismiss}
          whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
          transition={SPRING.SNAPPY}
          className={`
            flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] -m-2 rounded-lg
            transition-colors duration-200 cursor-pointer
            sm:opacity-0 sm:group-hover:opacity-100
            ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}
          `}
          aria-label="Ignorar recomendacao"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Action row — always visible (not hidden behind click) */}
      {!compact && (actionLabel || true) && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {/* Action button with tap/hover micro-interaction */}
          {actionLabel && actionType !== 'none' && (
            <motion.button
              onClick={handleAction}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
              transition={SPRING.SNAPPY}
              className={`
                inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium
                transition-colors duration-200 cursor-pointer border
                ${isDark
                  ? 'bg-stellar-cyan/10 text-stellar-cyan border-stellar-cyan/20 hover:bg-stellar-cyan/20 hover:border-stellar-cyan/35'
                  : 'bg-blue-50 text-blue-700 border-blue-200/60 hover:bg-blue-100 hover:border-blue-300'}
              `}
            >
              {actionLabel}
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          )}

          {/* Snooze button with tap micro-interaction */}
          <motion.button
            onClick={handleSnooze}
            whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
            transition={SPRING.SNAPPY}
            className={`
              inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[11px]
              transition-colors duration-200 cursor-pointer
              ${isDark
                ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
            `}
          >
            <Clock className="w-3 h-3" />
            Depois
          </motion.button>
        </div>
      )}

      {/* Compact mode: action arrow */}
      {compact && actionType !== 'none' && (
        <motion.button
          onClick={handleAction}
          whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
          transition={SPRING.SNAPPY}
          className={`
            absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center
            min-w-[44px] min-h-[44px] -mr-2 rounded-lg
            sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer
            ${isDark ? 'text-stellar-cyan hover:bg-stellar-cyan/10' : 'text-blue-600 hover:bg-blue-50'}
          `}
          aria-label={actionLabel || 'Ver detalhes'}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );
});

InsightCard.displayName = 'InsightCard';

export default InsightCard;
