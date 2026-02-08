// InsightFeed.jsx v1.2 - ANIMATION POLISH
// Design System v6.4 - Variant A with category filters
//
// CHANGELOG:
// v1.2 (2026-02-07): Animation polish pass
//   - Card stagger entrance via animationDelay prop (50ms per card)
//   - Category filter pills use layoutId sliding indicator
//   - Smoother collapse easing (cubic-bezier)
//   - "See more" button with arrow nudge on hover
//   - Uses SPRING from constants/animations
// v1.1 (2026-02-07): Cosmic shimmer skeletons + touch target fixes
//   - Replaced animate-pulse skeletons with skeleton-cosmic pattern
//   - Increased category filter pill touch targets (px-3 py-1.5)
//   - Added cursor-pointer to interactive elements
// v1.0 (2026-02-06): Initial implementation
//   - Category filter tabs (Todos, Campanhas, Churn, Alertas, IA)
//   - Top 5 recommendations display
//   - Collapsible section
//   - AI insights badge count
//   - Empty state

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SPRING } from '../../constants/animations';
import InsightCard from './InsightCard';
import useRecommendations from '../../hooks/useRecommendations';
import { ACTION_TO_TAB } from '../../utils/recommendationEngine';

const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'campaign', label: 'Campanhas' },
  { key: 'churn', label: 'Churn' },
  { key: 'alert', label: 'Alertas' },
  { key: 'ai_insight', label: 'IA' }
];

// CSS grid collapse — content keeps natural height, just clipped (no font distortion)
const COLLAPSE_STYLE_OPEN = { gridTemplateRows: '1fr' };
const COLLAPSE_STYLE_CLOSED = { gridTemplateRows: '0fr' };
const GRID_TRANSITION = 'grid-template-rows 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)';

const InsightFeed = ({ data, onNavigate, maxItems = 5 }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    recommendations,
    loading,
    dismiss,
    snooze,
    action,
    activeCategory,
    setActiveCategory,
    categoryCounts,
    totalCount
  } = useRecommendations(data);

  const handleAction = useCallback((rec) => {
    action(rec);
    if (onNavigate && rec.actionType) {
      const tabId = ACTION_TO_TAB[rec.actionType] || rec.actionType;
      onNavigate(tabId);
    }
  }, [action, onNavigate]);

  const visibleRecs = recommendations.slice(0, maxItems);
  const aiCount = categoryCounts.ai_insight || 0;

  // Empty state
  if (!loading && totalCount === 0) {
    return null; // Don't show widget if no recommendations
  }

  return (
    <div
      className={`
        rounded-2xl border overflow-hidden
        ${isDark
          ? 'bg-space-dust/60 border-stellar-cyan/10'
          : 'bg-white border-slate-200 shadow-sm'}
      `}
    >
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`
          w-full flex items-center justify-between gap-3 px-4 py-3 cursor-pointer
          transition-colors duration-200
          ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}
        `}
      >
        <div className="flex items-center gap-2.5">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${isDark ? 'bg-stellar-cyan/10' : 'bg-blue-50'}
          `}>
            <Lightbulb className={`w-4 h-4 ${isDark ? 'text-stellar-cyan' : 'text-blue-600'}`} />
          </div>
          <div className="text-left">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Smart Insights
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {totalCount} {totalCount === 1 ? 'recomendacao' : 'recomendacoes'}
              {aiCount > 0 && (
                <span className="inline-flex items-center gap-0.5 ml-1.5">
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  {aiCount} IA
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Collapse toggle */}
        <div className={`flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Content — CSS grid collapse (prevents font distortion) */}
      <div
        className="grid"
        style={{
          ...(isCollapsed ? COLLAPSE_STYLE_CLOSED : COLLAPSE_STYLE_OPEN),
          transition: prefersReducedMotion ? 'none' : GRID_TRANSITION
        }}
      >
        <div className="overflow-hidden min-h-0">
            {/* Category filters with layoutId sliding indicator */}
            <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map(cat => {
                const count = categoryCounts[cat.key] || 0;
                if (cat.key !== 'all' && count === 0) return null;
                const isActive = activeCategory === cat.key;

                return (
                  <motion.button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                    transition={SPRING.SNAPPY}
                    className={`
                      relative flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium
                      cursor-pointer
                      ${isActive
                        ? isDark ? 'text-stellar-cyan' : 'text-blue-700'
                        : isDark
                          ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }
                    `}
                  >
                    {/* Sliding active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="feedFilterPill"
                        className={`absolute inset-0 rounded-full ${
                          isDark ? 'bg-stellar-cyan/15' : 'bg-blue-100'
                        }`}
                        initial={false}
                        transition={prefersReducedMotion ? { duration: 0 } : {
                          type: 'spring',
                          bounce: 0.2,
                          duration: 0.4
                        }}
                      />
                    )}
                    <span className="relative z-10">
                      {cat.label}
                      {count > 0 && (
                        <span className="ml-1 opacity-60">{count}</span>
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Recommendation cards — category-keyed group transition */}
            <div className="px-3 pb-3">
              {loading ? (
                // Cosmic shimmer loading skeletons
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={`skeleton-cosmic rounded-xl p-3.5 ${i > 0 ? `skeleton-stagger-${i + 1}` : ''}`}
                    >
                      <div className="flex gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-200/60'}`} />
                        <div className="flex-1 space-y-2">
                          <div className={`h-3.5 rounded w-3/4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-200/60'}`} />
                          <div className={`h-3 rounded w-full ${isDark ? 'bg-slate-700/30' : 'bg-slate-200/40'}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={activeCategory}
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={prefersReducedMotion ? {} : { opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    {visibleRecs.length > 0 ? (
                      <AnimatePresence mode="popLayout">
                        {visibleRecs.map((rec, index) => (
                          <InsightCard
                            key={rec.fingerprint || rec.id || rec.ruleId}
                            recommendation={rec}
                            onAction={handleAction}
                            onDismiss={dismiss}
                            onSnooze={snooze}
                            animationDelay={prefersReducedMotion ? 0 : index * 0.04}
                          />
                        ))}
                      </AnimatePresence>
                    ) : (
                      // Empty state for filtered category
                      <div className={`text-center py-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <p className="text-xs">Nenhuma recomendacao nesta categoria</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* "See more" link with arrow nudge on hover */}
              {!loading && recommendations.length > maxItems && (
                <motion.button
                  onClick={() => onNavigate?.('insights')}
                  whileHover="hover"
                  initial="rest"
                  className={`
                    w-full flex items-center justify-center gap-1 py-2 mt-2 text-xs font-medium rounded-lg
                    transition-colors duration-200 cursor-pointer
                    ${isDark
                      ? 'text-stellar-cyan/70 hover:text-stellar-cyan hover:bg-stellar-cyan/5'
                      : 'text-blue-600/70 hover:text-blue-700 hover:bg-blue-50'}
                  `}
                >
                  <span>Ver todas as {recommendations.length} recomendacoes</span>
                  <motion.span
                    className="inline-block"
                    variants={{
                      rest: { x: 0 },
                      hover: { x: 4 }
                    }}
                    transition={SPRING.SNAPPY}
                  >
                    →
                  </motion.span>
                </motion.button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default InsightFeed;
