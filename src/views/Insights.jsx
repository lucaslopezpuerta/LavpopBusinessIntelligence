// Insights.jsx v1.3 - ANIMATION POLISH
// Full-page AI-powered recommendations and business insights
// Design System v6.4 compliant - Cosmic Precision
//
// CHANGELOG:
// v1.3 (2026-02-07): Animation polish pass
//   - "Calculando insights..." state: pulsing Sparkles icon
// v1.2 (2026-02-07): Help button touch target fix
//   - Increased help button to 44x44px minimum touch target
//   - Visual icon size unchanged (3.5), hit area expanded via padding
// v1.1 (2026-02-06): Help modal explaining how insights work
//   - HelpCircle button in header opens BaseModal
//   - Explains 3 intelligence layers (rules, metrics, AI)
//   - Documents category filters and actions
// v1.0 (2026-02-06): Initial implementation
//   - Standalone view with full header (Cosmic Precision Design v2.1)
//   - Computes customer metrics from sales data
//   - InsightsView section with all recommendations
//   - Pull-to-refresh support
//   - Animated entrance via AnimatedView

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, Target, TrendingUp, Brain, SlidersHorizontal, MousePointerClick } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../contexts/ThemeContext';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { DashboardLoadingSkeleton } from '../components/ui/Skeleton';
import PullToRefreshWrapper from '../components/ui/PullToRefreshWrapper';
import { AnimatedView, AnimatedHeader, AnimatedSection } from '../components/ui/AnimatedView';
import StaleDataIndicator from '../components/ui/StaleDataIndicator';
import { useDataRefresh } from '../contexts/DataFreshnessContext';
import InsightsView from '../components/intelligence/InsightsView';
import BaseModal from '../components/ui/BaseModal';
import { haptics } from '../utils/haptics';

const Insights = ({ data, onDataChange, onNavigate }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const { lastRefreshed, refreshing, triggerRefresh } = useDataRefresh();
  const [showHelpModal, setShowHelpModal] = useState(false);

  const salesData = data?.sales || [];
  const rfmData = data?.rfm || [];
  const customerData = data?.customer || [];

  // Customer metrics for recommendations
  const customerMetrics = useMemo(() => {
    if (!salesData.length) return null;
    return calculateCustomerMetrics(salesData, rfmData, customerData);
  }, [salesData, rfmData, customerData]);

  // Build recommendation data
  const recommendationData = useMemo(() => {
    if (!customerMetrics?.allCustomers) return null;
    const map = {};
    customerMetrics.allCustomers.forEach(c => { map[c.doc || c.id] = c; });
    return {
      customers: customerMetrics.allCustomers,
      sales: salesData,
      customerMap: map
    };
  }, [customerMetrics, salesData]);

  // Data readiness check
  if (!data?.sales?.length) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <PullToRefreshWrapper onRefresh={onDataChange}>
      <AnimatedView>
        {/* Header - Cosmic Precision Design v2.1 */}
        <AnimatedHeader className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Icon Container - Glassmorphism */}
              <div
                className={`
                  w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isDark
                    ? 'bg-space-dust/70 border border-stellar-cyan/20'
                    : 'bg-white border border-stellar-blue/10 shadow-md'}
                `}
                style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              >
                <Sparkles className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-stellar-cyan' : 'text-stellar-blue'}`} />
              </div>
              {/* Title & Subtitle */}
              <div>
                <div className="flex items-center gap-1.5">
                  <h1
                    className="text-lg sm:text-xl font-bold tracking-wider"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    <span className="text-gradient-stellar">INSIGHTS</span>
                  </h1>
                  <button
                    onClick={() => {
                      haptics.tick();
                      setShowHelpModal(true);
                    }}
                    className={`
                      flex items-center justify-center min-w-[44px] min-h-[44px] -m-2 rounded-lg
                      transition-all duration-200 cursor-pointer
                      ${isDark
                        ? 'text-slate-500 hover:text-slate-300'
                        : 'text-slate-400 hover:text-slate-600'}
                    `}
                    aria-label="Ajuda"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className={`text-xs tracking-wide mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Recomendações inteligentes para o seu negócio
                </p>
              </div>
            </div>
            <StaleDataIndicator
              lastUpdated={lastRefreshed}
              isRefreshing={refreshing}
              onRefresh={() => triggerRefresh({ reason: 'manual' })}
            />
          </div>
        </AnimatedHeader>

        {/* Recommendations */}
        {recommendationData ? (
          <AnimatedSection ariaLabel="Recomendações inteligentes">
            <InsightsView
              data={recommendationData}
              onNavigate={onNavigate}
              collapsible={false}
            />
          </AnimatedSection>
        ) : (
          <AnimatedSection ariaLabel="Carregando recomendações">
            <div className={`rounded-2xl border p-8 text-center ${isDark ? 'bg-space-dust/60 border-stellar-cyan/10 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
              <motion.div
                className="inline-block mb-2"
                animate={prefersReducedMotion ? {} : {
                  scale: [1, 1.05, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={prefersReducedMotion ? {} : {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Sparkles className="w-8 h-8" />
              </motion.div>
              <p className="text-sm font-medium">Calculando insights...</p>
              <p className="text-xs mt-1 opacity-70">Analisando dados de clientes e vendas</p>
            </div>
          </AnimatedSection>
        )}
        {/* Help Modal */}
        <BaseModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          title="Como funcionam os Insights"
          subtitle="Recomendações inteligentes"
          icon={Sparkles}
          iconColor="cyan"
          size="small"
          maxWidth="md"
        >
          <div className="px-4 sm:px-6 py-4 space-y-5">
            {/* Layer 1: Rules */}
            <div className="flex gap-3">
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'}
              `}>
                <Target className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h4 className={`font-medium text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Regras de Negócio
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  O sistema monitora padrões conhecidos como <strong>clientes inativos há 25+ dias</strong>,
                  {' '}<strong>VIPs sem visita recente</strong> e <strong>novos clientes que não voltaram</strong>.
                  Quando detecta uma oportunidade, gera uma recomendação automática.
                </p>
              </div>
            </div>

            {/* Layer 2: Metrics */}
            <div className="flex gap-3">
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}
              `}>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h4 className={`font-medium text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Métricas Preditivas
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Algoritmos analisam a <strong>probabilidade de retorno</strong> de cada cliente,
                  detectam <strong>degradação de frequência</strong> em VIPs e monitoram a
                  {' '}<strong>taxa de retenção</strong> geral. Alertas aparecem quando há mudanças significativas.
                </p>
              </div>
            </div>

            {/* Layer 3: AI */}
            <div className="flex gap-3">
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}
              `}>
                <Brain className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className={`font-medium text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Análise com IA
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Use o botão <strong className="text-purple-500">Solicitar Análise IA</strong> para gerar
                  um resumo inteligente dos seus dados. A IA identifica tendências, padrões e oportunidades
                  que as regras automáticas podem não captar.
                </p>
              </div>
            </div>

            {/* How to use */}
            <div className={`
              rounded-xl p-4
              ${isDark ? 'bg-space-nebula border border-stellar-cyan/10' : 'bg-slate-50 border border-slate-200'}
            `}>
              <h4 className={`font-medium text-sm mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Como usar:
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <SlidersHorizontal className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-500'}`} />
                  <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Filtros por Categoria
                    </span>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      Use as abas para filtrar por Campanhas, Churn, Alertas ou IA
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MousePointerClick className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                  <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Ações Diretas
                    </span>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      Cada recomendação tem um botão de ação que te leva direto à próxima etapa
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tip */}
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              As recomendações são atualizadas automaticamente sempre que novos dados são carregados.
              Recomendações ignoradas ou adiadas não voltam a aparecer.
            </p>
          </div>
        </BaseModal>
      </AnimatedView>
    </PullToRefreshWrapper>
  );
};

export default Insights;
