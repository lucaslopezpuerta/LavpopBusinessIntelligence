// InsightsView.jsx v4.0 - CELESTIAL INTELLIGENCE COMMAND
// Design System v6.4 - Cosmic Precision
//
// CHANGELOG:
// v4.0 (2026-02-11): Full redesign — Celestial Intelligence Command
//   - Colors: All inline hex values sourced from colorMapping.js (semanticColors + hexToRgba)
//   - Layout: Glassmorphic category bar with wider pills + backdrop-blur
//   - New: Summary metrics strip (total, urgent, AI counts)
//   - New: Dedicated AI panel (glassmorphic, Brain icon with orbital glow)
//   - New: Priority grouping (urgent 9+ section with Flame header)
//   - Enhanced empty state: Dual-layer glow from semanticColors, glassmorphic AI nudge
// v3.6 (2026-02-10): Web Interface Guidelines pass
// v3.5 (2026-02-10): Audit fixes
// v3.4 (2026-02-09): Visual enhancement pass
// v3.3 (2026-02-07): Category transition rework (Emil Kowalski audit)
// v3.2 (2026-02-07): Animation polish pass
// v3.1 (2026-02-07): Remove redundant summary stats bar
// v3.0 (2026-02-07): Cosmic skeletons, accessibility fixes
// v2.0 (2026-02-06): Smart modal actions + AI fix
// v1.0 (2026-02-06): Initial implementation

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import lazyRetry from '../../utils/lazyRetry';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp, Sparkles, Brain, Flame } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SPRING, TWEEN } from '../../constants/animations';
import InsightCard, { InsightCardSkeleton } from './InsightCard';
import useRecommendations from '../../hooks/useRecommendations';
import { useInsightActions } from '../../hooks/useInsightActions';
import { requestLLMInsight } from '../../utils/recommendationEngine';
import { semanticColors, hexToRgba } from '../../utils/colorMapping';

import { ModalLoadingFallback } from '../ui/Skeleton';
const CustomerSegmentModal = lazyRetry(() => import('../modals/CustomerSegmentModal'));

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
        setAiError('Dados insuficientes para gerar análise no momento');
      } else {
        await refresh();
      }
    } catch (err) {
      console.error('AI insight request failed:', err);
      setAiError('Erro ao gerar análise. Tente novamente.');
    } finally {
      setRequestingAI(false);
    }
  }, [requestingAI, refresh]);

  const aiCount = categoryCounts.ai_insight || 0;

  // Priority grouping
  const urgentRecommendations = useMemo(() =>
    recommendations.filter(r => r.priority >= 9),
    [recommendations]
  );
  const standardRecommendations = useMemo(() =>
    recommendations.filter(r => r.priority < 9),
    [recommendations]
  );
  const urgentCount = urgentRecommendations.length;

  // Accent colors from centralized mapping
  const blueAccent = semanticColors.blue.accentColor[isDark ? 'dark' : 'light'];
  const purpleAccent = semanticColors.profit.accentColor[isDark ? 'dark' : 'light'];

  return (
    <>
      <div
        className={`
          relative rounded-2xl border overflow-hidden
          ${isDark
            ? 'bg-space-dust/60 border-stellar-cyan/10'
            : 'bg-white border-slate-200 shadow-sm'}
        `}
      >
        {/* Top-edge gradient accent line */}
        <div
          className={`absolute top-0 left-0 right-0 h-px ${
            isDark
              ? 'bg-gradient-to-r from-transparent via-stellar-cyan/20 to-transparent'
              : 'bg-gradient-to-r from-transparent via-blue-300/40 to-transparent'
          }`}
        />
        {/* Header — only shown when collapsible (dashboard widget mode) */}
        {collapsible && (
          <button
            type="button"
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
                  {totalCount} {totalCount === 1 ? 'recomendação ativa' : 'recomendações ativas'}
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
              {/* Glassmorphic category filters with layoutId sliding indicator */}
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
                        relative flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold
                        cursor-pointer transition-colors duration-200
                        ${isActive
                          ? isDark ? 'text-stellar-cyan' : 'text-blue-700'
                          : isDark
                            ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }
                      `}
                    >
                      {/* Sliding active indicator — glassmorphic */}
                      {isActive && (
                        <motion.div
                          layoutId="insightFilterPill"
                          className={`absolute inset-0 rounded-xl border ${
                            isDark
                              ? 'bg-gradient-to-br from-stellar-cyan/20 to-stellar-cyan/10 border-stellar-cyan/25'
                              : 'bg-blue-100 border-blue-200/60'
                          }`}
                          style={{
                            backdropFilter: isDark ? 'blur(8px)' : undefined,
                            WebkitBackdropFilter: isDark ? 'blur(8px)' : undefined,
                            boxShadow: isDark ? `inset 0 1px 0 0 ${hexToRgba(blueAccent, 0.1)}` : 'none'
                          }}
                          initial={false}
                          transition={prefersReducedMotion ? { duration: 0 } : {
                            type: 'spring',
                            bounce: 0.2,
                            duration: 0.4
                          }}
                        />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-1.5">
                        {cat.label}
                        {count > 0 && (
                          <span className={`
                            inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-lg text-[10px] font-bold
                            ${isActive
                              ? isDark ? 'bg-stellar-cyan/20 text-stellar-cyan' : 'bg-blue-200/60 text-blue-700'
                              : isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-200/80 text-slate-500'
                            }
                          `}>
                            {count}
                          </span>
                        )}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Summary metrics strip */}
              {!loading && totalCount > 0 && (
                <div className={`flex items-center gap-3 px-4 pb-3 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="inline-flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-stellar-cyan/40' : 'bg-blue-400/50'}`} />
                    {totalCount} ativas
                  </span>
                  {urgentCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Flame className={`w-3 h-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                      {urgentCount} urgentes
                    </span>
                  )}
                  {aiCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className={`w-3 h-3 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                      {aiCount} IA
                    </span>
                  )}
                </div>
              )}

              {/* Dedicated AI Panel — glassmorphic */}
              <div className="px-4 pb-3">
                <div
                  className={`
                    relative rounded-xl border overflow-hidden
                    ${isDark
                      ? 'bg-gradient-to-br from-purple-500/[0.05] via-space-dust to-space-dust border-purple-500/20'
                      : 'bg-gradient-to-br from-purple-50/80 to-indigo-50/60 border-purple-200/50'}
                  `}
                  style={{
                    backdropFilter: isDark ? 'blur(8px)' : undefined,
                    WebkitBackdropFilter: isDark ? 'blur(8px)' : undefined,
                  }}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    {/* Brain icon with orbital glow */}
                    <div className="relative flex-shrink-0">
                      {isDark && (
                        <div
                          className="absolute inset-0 rounded-xl blur-md pointer-events-none"
                          style={{ background: `radial-gradient(circle, ${hexToRgba(purpleAccent, 0.3)}, transparent 70%)`, transform: 'scale(1.8)' }}
                        />
                      )}
                      <div className={`
                        relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden
                        ${isDark
                          ? 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10'
                          : `bg-gradient-to-br ${semanticColors.profit.gradient}`}
                      `}>
                        {isDark && (
                          <div
                            className="absolute inset-0 opacity-25 pointer-events-none"
                            style={{ background: `radial-gradient(circle at center, ${purpleAccent}, transparent 70%)` }}
                          />
                        )}
                        <Brain className={`relative z-10 w-4.5 h-4.5 ${isDark ? 'text-purple-400' : 'text-white'}`} />
                      </div>
                    </div>

                    {/* Title + status */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Análise com IA
                      </h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {requestingAI ? 'Gerando análise...' : aiCount > 0 ? `${aiCount} insights gerados` : 'Pronto para análise'}
                      </p>
                    </div>

                    {/* Action button */}
                    <motion.button
                      type="button"
                      onClick={handleRequestAI}
                      disabled={requestingAI}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                      transition={SPRING.SNAPPY}
                      className={`
                        flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium
                        cursor-pointer transition-all duration-200
                        bg-gradient-to-r ${semanticColors.profit.gradient} text-white
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      style={{
                        boxShadow: isDark ? `0 2px 8px ${hexToRgba(purpleAccent, 0.25)}` : `0 2px 6px ${hexToRgba(purpleAccent, 0.2)}`
                      }}
                    >
                      {requestingAI ? (
                        <Brain className="w-3.5 h-3.5 animate-pulse" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {requestingAI ? 'Gerando...' : 'Gerar'}
                    </motion.button>
                  </div>
                  {aiError && (
                    <div className={`px-3.5 pb-3 -mt-1`}>
                      <p className={`text-[11px] ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                        {aiError}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendation cards — priority grouped */}
              <div className="px-4 pb-4">
                {loading ? (
                  <InsightCardSkeleton count={3} showActions />
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
                        <>
                          {/* Urgent section */}
                          {urgentRecommendations.length > 0 && (
                            <>
                              <div className={`flex items-center gap-2 py-1.5 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                                <Flame className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-semibold tracking-wide uppercase">
                                  Atenção Urgente
                                </span>
                                <span className={`
                                  inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                                  ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'}
                                `}>
                                  {urgentRecommendations.length}
                                </span>
                              </div>
                              <AnimatePresence mode="popLayout">
                                {urgentRecommendations.map((rec, index) => (
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
                            </>
                          )}

                          {/* Divider between urgent and standard */}
                          {urgentRecommendations.length > 0 && standardRecommendations.length > 0 && (
                            <div className={`my-2 h-px ${isDark ? 'bg-stellar-cyan/5' : 'bg-slate-100'}`} />
                          )}

                          {/* Standard section */}
                          <AnimatePresence mode="popLayout">
                            {standardRecommendations.map((rec, index) => (
                              <InsightCard
                                key={rec.fingerprint || rec.id || rec.ruleId}
                                recommendation={rec}
                                onAction={handleAction}
                                onDismiss={dismiss}
                                onSnooze={snooze}
                                animationDelay={prefersReducedMotion ? 0 : (urgentRecommendations.length + index) * 0.05}
                              />
                            ))}
                          </AnimatePresence>
                        </>
                      ) : (
                        /* Enhanced empty state */
                        <div className={`
                          relative text-center py-10 rounded-xl border border-dashed
                          ${isDark
                            ? 'text-slate-500 border-stellar-cyan/10'
                            : 'text-slate-400 border-slate-200'}
                        `}>
                          {/* Dual-layer ambient glow */}
                          <div
                            className="absolute inset-0 rounded-xl pointer-events-none"
                            style={{
                              background: isDark
                                ? `radial-gradient(ellipse at 40% 50%, ${hexToRgba(blueAccent, 0.04)} 0%, transparent 60%), radial-gradient(ellipse at 60% 50%, ${hexToRgba(purpleAccent, 0.03)} 0%, transparent 60%)`
                                : `radial-gradient(ellipse at 40% 50%, ${hexToRgba(blueAccent, 0.05)} 0%, transparent 60%), radial-gradient(ellipse at 60% 50%, ${hexToRgba(purpleAccent, 0.04)} 0%, transparent 60%)`
                            }}
                          />
                          <motion.div
                            className="relative inline-block mb-3"
                            animate={prefersReducedMotion ? {} : {
                              y: [0, -5, 0],
                              rotate: [0, 2, 0, -2, 0]
                            }}
                            transition={prefersReducedMotion ? {} : {
                              duration: 4,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                          >
                            {/* Primary glow */}
                            <div
                              className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                              style={{
                                background: `radial-gradient(circle, ${hexToRgba(blueAccent, isDark ? 0.15 : 0.2)}, transparent 70%)`,
                                transform: 'scale(2.5)'
                              }}
                            />
                            {/* Secondary warm glow */}
                            <div
                              className="absolute inset-0 rounded-full blur-lg pointer-events-none"
                              style={{
                                background: `radial-gradient(circle, ${hexToRgba(purpleAccent, isDark ? 0.1 : 0.15)}, transparent 70%)`,
                                transform: 'scale(1.8) translateX(4px)'
                              }}
                            />
                            <Lightbulb className="relative w-10 h-10 opacity-40" />
                          </motion.div>
                          <p className="text-sm font-medium">
                            {activeCategory === 'all'
                              ? 'Nenhuma recomendação no momento'
                              : 'Nenhuma recomendação nesta categoria'}
                          </p>
                          <p className="text-xs mt-1 opacity-70">
                            Insights aparecem automaticamente quando detectamos padrões nos seus dados
                          </p>
                          {/* Glassmorphic AI nudge pill */}
                          <motion.div
                            className={`
                              inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full text-[11px] font-medium
                              ${isDark
                                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                : 'bg-purple-50 text-purple-600 border border-purple-200/60'}
                            `}
                            style={{
                              backdropFilter: isDark ? 'blur(8px)' : undefined,
                              WebkitBackdropFilter: isDark ? 'blur(8px)' : undefined,
                            }}
                            animate={prefersReducedMotion ? {} : {
                              boxShadow: isDark
                                ? [
                                    `0 0 0px ${hexToRgba(purpleAccent, 0)}`,
                                    `0 0 12px ${hexToRgba(purpleAccent, 0.15)}`,
                                    `0 0 0px ${hexToRgba(purpleAccent, 0)}`
                                  ]
                                : undefined
                            }}
                            transition={prefersReducedMotion ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <Sparkles className="w-3 h-3" />
                            Experimente solicitar uma análise IA acima
                          </motion.div>
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
        <Suspense fallback={<ModalLoadingFallback />}>
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
