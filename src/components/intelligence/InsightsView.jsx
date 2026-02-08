// InsightsView.jsx v3.3 - CATEGORY CASCADE
// Design System v6.4 - Cosmic Precision
//
// CHANGELOG:
// v3.3 (2026-02-07): Category transition rework (Emil Kowalski audit)
//   - Container: exit-only animation (no enter fade), cards own their entrance
//   - Exit: 100ms fade + scale(0.98) via popLayout
//   - Stagger bumped from 40ms to 50ms for visible cascade
//   - Fixes opacity fight between container and card-level animations
// v3.2 (2026-02-07): Animation polish pass
//   - Card stagger entrance via animationDelay prop (50ms per card)
//   - Category filter pills use layoutId sliding indicator
//   - Smoother collapse easing (cubic-bezier)
//   - Empty state: floating Lightbulb with glow backdrop
//   - AI request button: whileTap + rotating Brain loader
//   - Uses SPRING/TWEEN from constants/animations
// v3.1 (2026-02-07): Remove redundant summary stats bar
//   - Category counts already shown in filter pills — summary was duplicate info
// v3.0 (2026-02-07): Cosmic skeletons, accessibility fixes
//   - Hides redundant inner header when collapsible={false} (standalone view)
//   - Replaced animate-pulse skeletons with cosmic-shimmer pattern
//   - Increased category filter pill touch targets
//   - AI request button moved above cards for discoverability
// v2.0 (2026-02-06): Smart modal actions + AI fix
//   - useInsightActions hook for contextual CustomerSegmentModal
//   - handleRequestAI sends only insightType (server gathers context from Supabase)
//   - Handles { skipped: true } response for insufficient data
// v1.0 (2026-02-06): Initial implementation

import React, { useState, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp, Sparkles, Brain } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SPRING, TWEEN } from '../../constants/animations';
import InsightCard from './InsightCard';
import useRecommendations from '../../hooks/useRecommendations';
import { useInsightActions } from '../../hooks/useInsightActions';
import { requestLLMInsight } from '../../utils/recommendationEngine';

const CustomerSegmentModal = lazy(() => import('../modals/CustomerSegmentModal'));

const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'campaign', label: 'Campanhas' },
  { key: 'churn', label: 'Churn' },
  { key: 'alert', label: 'Alertas' },
  { key: 'celebration', label: 'Celebrando' },
  { key: 'ai_insight', label: 'IA' }
];

// CSS grid collapse — content keeps natural height, just clipped (no font distortion)
const COLLAPSE_STYLE_OPEN = { gridTemplateRows: '1fr' };
const COLLAPSE_STYLE_CLOSED = { gridTemplateRows: '0fr' };
const GRID_TRANSITION = 'grid-template-rows 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)';

const InsightsView = ({ data, onNavigate, collapsible = true, isCollapsed: externalCollapsed, onToggle }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [requestingAI, setRequestingAI] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Use external collapse state if collapsible + onToggle provided, else internal
  const isCollapsed = onToggle ? externalCollapsed : internalCollapsed;
  const toggleCollapse = onToggle || (() => setInternalCollapsed(prev => !prev));

  const {
    recommendations,
    loading,
    dismiss,
    snooze,
    action,
    refresh,
    activeCategory,
    setActiveCategory,
    categoryCounts,
    totalCount
  } = useRecommendations(data);

  // Smart actions: opens contextual modals instead of navigating away
  const {
    handleAction: smartAction,
    segmentModal,
    closeSegmentModal,
    contactedIds,
    markContacted,
    handleCreateCampaign
  } = useInsightActions({ data, onNavigate });

  // Wraps smart action with recommendation tracking
  const handleAction = useCallback((rec) => {
    action(rec);
    smartAction(rec);
  }, [action, smartAction]);

  // AI request — server gathers all context from Supabase
  const handleRequestAI = useCallback(async () => {
    if (requestingAI) return;
    setRequestingAI(true);
    setAiError(null);
    try {
      const result = await requestLLMInsight('weekly_summary');
      if (result.skipped) {
        setAiError('Dados insuficientes para gerar analise no momento');
      } else {
        await refresh();
      }
    } catch (err) {
      console.error('AI insight request failed:', err);
      setAiError('Erro ao gerar analise. Tente novamente.');
    } finally {
      setRequestingAI(false);
    }
  }, [requestingAI, refresh]);

  const aiCount = categoryCounts.ai_insight || 0;

  return (
    <>
      <div
        className={`
          rounded-2xl border overflow-hidden
          ${isDark
            ? 'bg-space-dust/60 border-stellar-cyan/10'
            : 'bg-white border-slate-200 shadow-sm'}
        `}
      >
        {/* Header — only shown when collapsible (dashboard widget mode) */}
        {collapsible && (
          <button
            onClick={toggleCollapse}
            className={`
              w-full flex items-center justify-between gap-3 px-5 py-4
              cursor-pointer transition-colors duration-200
              ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-9 h-9 rounded-xl flex items-center justify-center
                ${isDark ? 'bg-stellar-cyan/10' : 'bg-blue-50'}
              `}>
                <Lightbulb className={`w-4.5 h-4.5 ${isDark ? 'text-stellar-cyan' : 'text-blue-600'}`} />
              </div>
              <div className="text-left">
                <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Smart Insights
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {totalCount} {totalCount === 1 ? 'recomendacao ativa' : 'recomendacoes ativas'}
                  {aiCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 ml-1.5">
                      <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                      {aiCount} IA
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
            </div>
          </button>
        )}

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
              <div className={`flex items-center gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide ${collapsible ? '' : 'pt-4'}`}>
                {CATEGORIES.map(cat => {
                  const count = cat.key === 'all' ? totalCount : (categoryCounts[cat.key] || 0);
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
                          layoutId="insightFilterPill"
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

              {/* Request AI Insight button — prominent position above cards */}
              <div className="px-4 pb-3">
                <motion.button
                  onClick={handleRequestAI}
                  disabled={requestingAI}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                  transition={SPRING.SNAPPY}
                  className={`
                    w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium
                    transition-colors duration-200 cursor-pointer
                    ${isDark
                      ? 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/50'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {requestingAI ? (
                    <>
                      <motion.div
                        animate={prefersReducedMotion ? {} : { rotate: 360 }}
                        transition={prefersReducedMotion ? {} : {
                          repeat: Infinity,
                          duration: 2,
                          ease: 'linear'
                        }}
                      >
                        <Brain className="w-3.5 h-3.5" />
                      </motion.div>
                      Gerando analise...
                    </>
                  ) : (
                    <>
                      <Brain className="w-3.5 h-3.5" />
                      Solicitar Analise IA
                    </>
                  )}
                </motion.button>
                {aiError && (
                  <p className={`text-[11px] mt-1.5 text-center ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                    {aiError}
                  </p>
                )}
              </div>

              {/* Recommendation cards — category-keyed group transition */}
              <div className="px-4 pb-4">
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
                            <div className="flex gap-2 pt-1">
                              <div className={`h-7 rounded-lg w-24 ${isDark ? 'bg-slate-700/40' : 'bg-slate-200/50'}`} />
                              <div className={`h-7 rounded-lg w-16 ${isDark ? 'bg-slate-700/30' : 'bg-slate-200/40'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={activeCategory}
                      initial={false}
                      animate={{}}
                      exit={prefersReducedMotion
                        ? { opacity: 0, transition: { duration: 0.08 } }
                        : { opacity: 0, scale: 0.98, transition: { duration: 0.1, ease: 'easeOut' } }
                      }
                      className="space-y-2"
                    >
                      {recommendations.length > 0 ? (
                        <AnimatePresence mode="popLayout">
                          {recommendations.map((rec, index) => (
                            <InsightCard
                              key={rec.fingerprint || rec.id || rec.ruleId}
                              recommendation={rec}
                              onAction={handleAction}
                              onDismiss={dismiss}
                              onSnooze={snooze}
                              animationDelay={prefersReducedMotion ? 0 : index * 0.05}
                            />
                          ))}
                        </AnimatePresence>
                      ) : (
                        // Empty state with floating icon
                        <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          <motion.div
                            className="relative inline-block mb-2"
                            animate={prefersReducedMotion ? {} : { y: [0, -4, 0] }}
                            transition={prefersReducedMotion ? {} : {
                              duration: 3,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                          >
                            {/* Glow behind icon */}
                            <div
                              className={`absolute inset-0 rounded-full blur-xl ${
                                isDark ? 'bg-stellar-cyan/10' : 'bg-blue-100/60'
                              }`}
                              style={{ transform: 'scale(2)' }}
                            />
                            <Lightbulb className="relative w-8 h-8 opacity-40" />
                          </motion.div>
                          <p className="text-sm font-medium">
                            {activeCategory === 'all'
                              ? 'Nenhuma recomendacao no momento'
                              : 'Nenhuma recomendacao nesta categoria'}
                          </p>
                          <p className="text-xs mt-1 opacity-70">
                            Insights aparecem automaticamente quando detectamos padroes nos seus dados
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Smart Action Modal */}
      {segmentModal && (
        <Suspense fallback={null}>
          <CustomerSegmentModal
            isOpen={!!segmentModal}
            onClose={closeSegmentModal}
            title={segmentModal.title}
            subtitle={segmentModal.subtitle}
            color={segmentModal.color}
            customers={segmentModal.customers}
            audienceType={segmentModal.audienceType}
            contactedIds={contactedIds}
            onMarkContacted={markContacted}
            onCreateCampaign={handleCreateCampaign}
            onOpenCustomerProfile={(doc) => onNavigate?.('diretorio')}
          />
        </Suspense>
      )}
    </>
  );
};

export default InsightsView;
