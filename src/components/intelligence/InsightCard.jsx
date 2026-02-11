// InsightCard.jsx v3.0 - CELESTIAL INTELLIGENCE COMMAND
// Design System v6.4 - Priority-tiered cards with centralized colorMapping
//
// CHANGELOG:
// v3.0 (2026-02-11): Full redesign — Celestial Intelligence Command
//   - Colors: All hex values sourced from colorMapping.js (insightCategoryMap + semanticColors)
//   - Layout: Left border → bottom gradient accent stripe (animated scaleX entrance)
//   - Priority tiers: Urgent (9+) gets gradient bg + inner highlight + enhanced badge
//   - AI cards: Purple overlay glow via semanticColors.profit.accentColor
//   - Action buttons: Category-colored gradient fill + white text
//   - Confidence: Uses getConfidenceColor() from colorMapping (centralized)
//   - Urgent badge: Pulsing scale + glow animation
// v2.7 (2026-02-10): Web Interface Guidelines pass
// v2.6 (2026-02-10): Audit fixes
// v2.5 (2026-02-09): Visual enhancement pass
// v2.4 (2026-02-07): Motion perf fixes
// v2.3 (2026-02-07): Enhanced card entrance for category cascade
// v2.2 (2026-02-07): Emil Kowalski animation audit
// v2.1 (2026-02-07): Animation polish pass
// v2.0 (2026-02-07): Full accessibility + visual identity rewrite
// v1.2 (2026-02-06): Expandable AI descriptions
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
import {
  semanticColors,
  insightCategoryMap,
  insightCategoryText,
  hexToRgba,
  getConfidenceColor
} from '../../utils/colorMapping';

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

// Resolve category → semantic color entry (all from colorMapping.js)
const getCategoryColors = (category) => {
  const key = insightCategoryMap[category] || 'neutral';
  const sc = semanticColors[key];
  const text = insightCategoryText[category] || insightCategoryText.operational;
  return { semantic: sc, text, gradient: sc.gradient };
};

// Priority background — tiered gradient with inner highlight
const getPriorityStyle = (priority, aiGenerated, accentHex, isDark) => {
  const aiAccent = semanticColors.profit.accentColor[isDark ? 'dark' : 'light'];

  if (aiGenerated) {
    return {
      background: isDark
        ? `linear-gradient(135deg, ${hexToRgba(aiAccent, 0.05)} 0%, transparent 60%)`
        : `linear-gradient(135deg, ${hexToRgba(aiAccent, 0.04)} 0%, transparent 60%)`,
      boxShadow: isDark ? `0 0 20px ${hexToRgba(aiAccent, 0.08)}, inset 0 1px 0 0 ${hexToRgba(aiAccent, 0.08)}` : 'none'
    };
  }
  if (priority >= 9) {
    return {
      background: isDark
        ? `linear-gradient(135deg, ${hexToRgba(accentHex, 0.05)} 0%, transparent 50%)`
        : `linear-gradient(135deg, ${hexToRgba(accentHex, 0.04)} 0%, transparent 50%)`,
      boxShadow: isDark ? `inset 0 1px 0 0 ${hexToRgba(accentHex, 0.12)}` : 'none'
    };
  }
  if (priority >= 5) {
    return {
      boxShadow: isDark ? `inset 0 1px 0 0 ${hexToRgba(accentHex, 0.05)}` : 'none'
    };
  }
  return {};
};

// Hover target factory — returns a whileHover object
const createHoverTarget = (accentHex, isDark) => ({
  y: -2,
  scale: 1.005,
  boxShadow: isDark
    ? `0 8px 24px rgba(0,0,0,0.3), 0 0 16px ${hexToRgba(accentHex, 0.12)}`
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

  const { semantic: sc, text: catText, gradient: catGradient } = getCategoryColors(category);
  const accentHex = isDark ? sc.accentColor.dark : sc.accentColor.light;
  const isHighPriority = priority >= 9;

  // Resolve Lucide icon component from string name
  const IconComponent = (typeof icon === 'string' && ICON_MAP[icon]) || Lightbulb;

  // Memoize hover target
  const hoverTarget = useMemo(() =>
    prefersReducedMotion
      ? undefined
      : createHoverTarget(accentHex, isDark),
    [prefersReducedMotion, accentHex, isDark]
  );

  // Priority-tiered gradient background + inner highlight
  const priorityStyle = useMemo(() =>
    getPriorityStyle(priority, aiGenerated, accentHex, isDark),
    [priority, aiGenerated, accentHex, isDark]
  );

  // Confidence color from centralized mapping
  const confidenceInfo = useMemo(() => {
    if (aiConfidence == null || aiConfidence <= 0) return null;
    return getConfidenceColor(aiConfidence * 100);
  }, [aiConfidence]);

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

  // Card border tier
  const borderTier = isDark
    ? isHighPriority ? 'border-stellar-cyan/20' : priority >= 5 ? 'border-stellar-cyan/10' : 'border-stellar-cyan/5'
    : isHighPriority ? 'border-slate-300 shadow-md' : 'border-slate-200 shadow-sm';

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
        group relative rounded-xl border overflow-hidden
        ${borderTier}
        ${isDark ? 'bg-space-dust/80' : 'bg-white'}
        ${compact ? 'p-3' : 'p-3.5 sm:p-4'}
      `}
      style={priorityStyle}
    >
      {/* Bottom gradient accent stripe */}
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${catGradient}`}
        initial={prefersReducedMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut', delay: animationDelay + 0.1 }}
        style={{ transformOrigin: 'left' }}
      />

      {/* Header row: Icon + Title + AI Badge + Dismiss */}
      <div className="flex items-start gap-2.5">
        {/* Category icon — glassmorphic container */}
        <div className={`
          relative flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 overflow-hidden
          ${isDark
            ? 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm'
            : `bg-gradient-to-br ${catGradient}`}
        `}>
          {isDark && (
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ background: `radial-gradient(circle at center, ${accentHex}, transparent 70%)` }}
            />
          )}
          <IconComponent className={`relative z-10 w-4 h-4 ${isDark ? catText.dark : 'text-white'}`} />
        </div>

        {/* Title + Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className={`font-semibold leading-tight ${compact ? 'text-xs' : 'text-sm'} ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h3>
            {/* Urgent badge with pulsing glow */}
            {isHighPriority && !aiGenerated && (
              <motion.span
                className={`
                  inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0
                  ${isDark ? 'bg-red-500/15 text-red-400 border border-red-400/30' : 'bg-red-50 text-red-600 border border-red-200'}
                `}
                animate={prefersReducedMotion ? {} : {
                  scale: [1, 1.05, 1],
                  boxShadow: isDark
                    ? [
                        `0 0 0px ${hexToRgba(semanticColors.cost.accentColor.dark, 0)}`,
                        `0 0 8px ${hexToRgba(semanticColors.cost.accentColor.dark, 0.3)}`,
                        `0 0 0px ${hexToRgba(semanticColors.cost.accentColor.dark, 0)}`
                      ]
                    : undefined
                }}
                transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame className="w-2.5 h-2.5" />
                Urgente
              </motion.span>
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
                  type="button"
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

          {/* Confidence meter — full-width gradient bar with centralized colors */}
          {!compact && confidenceInfo && (
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Confiança
              </span>
              <div className={`relative flex-1 max-w-[88px] h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700/80' : 'bg-slate-200'}`}>
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${
                    confidenceInfo.level === 'high' ? 'from-emerald-400 to-emerald-500' :
                    confidenceInfo.level === 'medium' ? 'from-amber-400 to-amber-500' : 'from-red-400 to-red-500'
                  }`}
                  initial={prefersReducedMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : TWEEN.PROGRESS}
                  style={{
                    width: `${Math.round(aiConfidence * 100)}%`,
                    transformOrigin: 'left',
                    boxShadow: isDark ? `0 0 8px ${hexToRgba(accentHex, 0.3)}` : 'none'
                  }}
                />
                {[25, 50, 75].map(tick => (
                  <div
                    key={tick}
                    className={`absolute top-0 bottom-0 w-px ${isDark ? 'bg-slate-600/50' : 'bg-slate-300/60'}`}
                    style={{ left: `${tick}%` }}
                  />
                ))}
              </div>
              <span className={`text-[10px] font-medium min-w-[30px] ${
                confidenceInfo.level === 'high'
                  ? isDark ? 'text-cosmic-green' : 'text-emerald-600'
                  : confidenceInfo.level === 'medium'
                    ? isDark ? 'text-amber-400' : 'text-amber-600'
                    : isDark ? 'text-red-400' : 'text-red-600'
              }`}>
                {confidenceInfo.label}
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
            sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100
            ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}
          `}
          aria-label="Ignorar recomendação"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Action row — gradient action button + subtle snooze */}
      {!compact && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {actionLabel && actionType !== 'none' && (
            <motion.button
              onClick={handleAction}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
              transition={SPRING.SNAPPY}
              className={`
                inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium
                transition-all duration-200 cursor-pointer
                bg-gradient-to-r ${catGradient} text-white
              `}
              style={{
                boxShadow: isDark ? `0 2px 8px ${hexToRgba(accentHex, 0.25)}` : `0 2px 6px ${hexToRgba(accentHex, 0.2)}`
              }}
            >
              {actionLabel}
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          )}

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
            sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity cursor-pointer
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

// Shared skeleton for InsightsView and Insights page (prevents duplication)
export const InsightCardSkeleton = ({ count = 3, showActions = false }) => {
  const { isDark } = useTheme();
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-cosmic rounded-xl p-3.5 ${i > 0 ? `skeleton-stagger-${i + 1}` : ''}`}
        >
          <div className="flex gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-200/60'}`} />
            <div className="flex-1 space-y-2">
              <div className={`h-3.5 rounded w-3/4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-200/60'}`} />
              <div className={`h-3 rounded w-full ${isDark ? 'bg-slate-700/30' : 'bg-slate-200/40'}`} />
              {showActions && (
                <div className="flex gap-2 pt-1">
                  <div className={`h-7 rounded-lg w-24 ${isDark ? 'bg-slate-700/40' : 'bg-slate-200/50'}`} />
                  <div className={`h-7 rounded-lg w-16 ${isDark ? 'bg-slate-700/30' : 'bg-slate-200/40'}`} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InsightCard;
