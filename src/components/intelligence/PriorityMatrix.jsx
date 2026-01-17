// PriorityMatrix.jsx v1.9
// Priority Matrix component - Replaces Health Score with actionable insights
// Shows 4 business dimensions scored 0-10 with focus on weakest area
// Design System v5.0 compliant - Cosmic Precision + Starfield + Deep Space
//
// CHANGELOG:
// v1.9 (2026-01-17): Collapsible recommended actions
//   - Made "Ações Recomendadas" section collapsible (retracted by default)
//   - Added ChevronDown icon with rotation animation
//   - Added action count badge in header
//   - Smooth expand/collapse animation with max-height transition
//   - Cosmic-styled container with gradient background
// v1.8 (2026-01-17): Desktop readability improvements
//   - Increased font sizes for desktop (sm: breakpoint)
//   - DimensionCard: label, status, rawValue all larger on desktop
//   - ActionItem: title (sm:text-base), description (sm:text-sm), context (sm:text-sm)
//   - Score Badge: label (sm:text-base), score (sm:text-3xl)
//   - Priority Alert: title (sm:text-base), subtitle (sm:text-sm), icon sizes
//   - Actions header: text and icon sizes increased
// v1.7 (2026-01-17): Deeper space backgrounds
//   - Changed all dark:via/to from space-nebula to space-void (deepest cosmic)
//   - Increased accent opacity (900/30 instead of 900/20) for better visibility
//   - DimensionCard, ActionItem, Score Badge, Priority Alert all darker
//   - Starfield effect more visible against darker background
// v1.6 (2026-01-17): Starfield background enhancement
//   - Added useTheme import for dark mode detection
//   - Added starfield background in dark mode (opacity-50)
//   - Premium cosmic aesthetic for Priority Matrix section
// v1.5 (2026-01-17): Cosmic Precision upgrade
//   - Applied Variant C: Neutral Dashboard Cosmic
//   - Updated Tooltip: dark:bg-space-dust, dark:border-stellar-cyan/10
//   - Updated DimensionCard: cosmic gradient backgrounds
//   - Updated ActionItem: cosmic gradient pattern
//   - Updated Overall Score Badge: cosmic-enhanced indigo/purple
//   - Updated Priority Focus Alert: cosmic-enhanced red/orange
//   - Updated all internal borders to stellar-cyan/10
//   - Updated hover states to use space-dust
//   - Cosmic compliant: Design System v5.0
// v1.4 (2026-01-07): Fixed tooltip positioning
//   - FIXED: Desktop tooltip now uses fixed positioning via portal
//   - FIXED: Added scroll listener to hide tooltip on scroll
//   - Tooltip no longer clipped by parent overflow
// v1.3 (2025-12-28): Mobile compatibility improvements
//   - Tooltip: tap-to-toggle with backdrop overlay and close button on mobile
//   - Touch targets: minimum 44px for interactive elements
//   - Action items: stack impact/effort tags vertically on mobile
//   - DimensionCard: improved spacing and readability on small screens
// v1.2 (2025-12-28): Full context implementation
//   - Added Tooltip component for dimension explanations
//   - Dimension cards now show info icon with hover tooltip
//   - Actions show context field explaining the comparison basis
//   - Data range badges show timeframe for each dimension
//   - Overall score tooltip explains weighting formula
// v1.1 (2025-12-28): Enhanced context and explanations
//   - Added dimension explanations (what it measures, how to interpret)
//   - Added data range context for each metric
//   - Added comparison context to actions ("vs mês anterior", etc.)
//   - Info tooltips for better comprehension
// v1.0 (2025-12-28): Initial implementation
//   - 4 dimensions: Profitability, Growth, Break-even, Momentum
//   - Visual 2x2 grid with score indicators
//   - Priority focus section highlighting weakest dimension
//   - Up to 3 actionable recommendations with impact/effort tags

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Target, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, ArrowRight, Gauge, BarChart3, Zap, Activity, Info, HelpCircle, X, ChevronDown } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useTheme } from '../../contexts/ThemeContext';

// Mobile-friendly Tooltip component with tap-to-toggle and backdrop
// Uses fixed positioning with viewport-relative coords for proper display

const Tooltip = ({ children, content, howToRead, dataRange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const isMobile = useIsMobile();

  // Close on escape key
  useEffect(() => {
    if (!isVisible) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsVisible(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible]);

  // Hide on scroll (desktop)
  useEffect(() => {
    if (!isVisible || isMobile) return;
    const handleScroll = () => setIsVisible(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, isMobile]);

  // Close tooltip
  const closeTooltip = useCallback(() => setIsVisible(false), []);

  // Update coordinates when showing tooltip
  const showTooltip = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.left, width: rect.width });
    }
    setIsVisible(true);
  }, []);

  // Desktop tooltip content - rendered via portal with fixed positioning
  const desktopTooltipContent = isVisible && !isMobile && ReactDOM.createPortal(
    <div
      className="fixed z-[9999] w-64 p-3 bg-white dark:bg-space-dust rounded-xl shadow-xl border border-slate-200 dark:border-stellar-cyan/10 text-left pointer-events-none"
      style={{
        top: coords.top - 8,
        left: coords.left + coords.width / 2,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {/* Arrow */}
      <div
        className="absolute w-2 h-2 bg-white dark:bg-space-dust transform rotate-45 border-slate-200 dark:border-stellar-cyan/10 border-r border-b"
        style={{ bottom: '-4px', left: '50%', marginLeft: '-4px' }}
      />

      <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">
        {content}
      </p>

      {howToRead && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
            Como interpretar:
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {howToRead}
          </p>
        </div>
      )}

      {dataRange && (
        <div className="pt-2 border-t border-slate-100 dark:border-stellar-cyan/10">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Dados: {dataRange}
          </p>
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <>
      {/* Backdrop overlay for mobile - closes tooltip on tap outside */}
      {isVisible && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={closeTooltip}
          aria-hidden="true"
        />
      )}

      <div className="relative inline-block">
        <button
          ref={buttonRef}
          type="button"
          className="p-2 -m-1 hover:bg-slate-100 dark:hover:bg-space-dust rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          onMouseEnter={!isMobile ? showTooltip : undefined}
          onMouseLeave={!isMobile ? closeTooltip : undefined}
          onClick={() => isMobile ? setIsVisible(!isVisible) : showTooltip()}
          aria-label="Mais informações"
          aria-expanded={isVisible}
        >
          {children}
        </button>

        {/* Mobile: Fixed modal in center of screen */}
        {isVisible && isMobile && (
          <div className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 p-4 bg-white dark:bg-space-dust rounded-xl shadow-2xl border border-slate-200 dark:border-stellar-cyan/10 text-left">
            <button
              type="button"
              onClick={closeTooltip}
              className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 dark:hover:bg-space-dust rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <p className="text-base text-slate-700 dark:text-slate-200 mb-3 pr-8">
              {content}
            </p>

            {howToRead && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Como interpretar:
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {howToRead}
                </p>
              </div>
            )}

            {dataRange && (
              <div className="pt-3 border-t border-slate-100 dark:border-stellar-cyan/10">
                <p className="text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Dados: {dataRange}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Desktop tooltip rendered via portal */}
        {desktopTooltipContent}
      </div>
    </>
  );
};

// Color mappings for score levels
const getScoreColor = (score) => {
  if (score >= 8) return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500' };
  if (score >= 6) return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500' };
  if (score >= 4) return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500' };
  return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-500' };
};

// Status color for dimension status text
const getStatusColor = (color) => {
  switch (color) {
    case 'positive': return 'text-emerald-600 dark:text-emerald-400';
    case 'neutral': return 'text-blue-600 dark:text-blue-400';
    case 'warning': return 'text-amber-600 dark:text-amber-400';
    case 'negative': return 'text-red-600 dark:text-red-400';
    default: return 'text-slate-600 dark:text-slate-400';
  }
};

// Dimension icons
const DIMENSION_ICONS = {
  profitability: Gauge,
  growth: TrendingUp,
  breakEven: BarChart3,
  momentum: Activity
};

// Dimension labels
const DIMENSION_LABELS = {
  profitability: 'Lucratividade',
  growth: 'Crescimento',
  breakEven: 'Break-even',
  momentum: 'Momentum'
};

// Impact/effort tags
const ImpactTag = ({ impact }) => {
  const colors = {
    high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  };
  const labels = { high: 'Alto impacto', medium: 'Médio impacto', low: 'Baixo impacto' };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[impact]}`}>
      {labels[impact]}
    </span>
  );
};

const EffortTag = ({ effort }) => {
  const colors = {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  };
  const labels = { low: 'Fácil', medium: 'Moderado', high: 'Complexo' };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[effort]}`}>
      {labels[effort]}
    </span>
  );
};

// Dimension card component - mobile-optimized
const DimensionCard = ({ dimKey, dimension, isPriority }) => {
  const Icon = DIMENSION_ICONS[dimKey];
  const label = DIMENSION_LABELS[dimKey];
  const scoreColors = getScoreColor(dimension.score);
  const statusColor = getStatusColor(dimension.color);

  // Dimension has explanation, howToRead, and dataRange from calculations
  const hasExplanation = dimension.explanation;

  return (
    <div className={`
      relative p-3 sm:p-4 rounded-xl border-2 transition-all
      ${isPriority
        ? 'border-red-400 dark:border-red-500 bg-gradient-to-br from-red-50/60 via-white to-white dark:from-red-900/30 dark:via-space-void dark:to-space-void ring-2 ring-red-200 dark:ring-red-800/50'
        : 'bg-gradient-to-br from-slate-50/60 via-white to-white dark:from-space-dust/60 dark:via-space-void dark:to-space-void border-slate-200/80 dark:border-stellar-cyan/10'
      }
    `}>
      {/* Priority indicator */}
      {isPriority && (
        <div className="absolute -top-2.5 left-3 sm:-top-3 sm:left-4 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-white bg-red-500 rounded-full shadow-sm">
          Foco
        </div>
      )}

      {/* Header with icon, label, info tooltip, and score */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 sm:w-8 sm:h-8 rounded-lg ${scoreColors.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${scoreColors.text}`} />
          </div>
          <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 truncate">
            {label}
          </span>
          {/* Info tooltip */}
          {hasExplanation && (
            <Tooltip
              content={dimension.explanation}
              howToRead={dimension.howToRead}
              dataRange={dimension.dataRange}
            >
              <HelpCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400 hover:text-indigo-500 transition-colors" />
            </Tooltip>
          )}
        </div>

        {/* Score - larger touch target area */}
        <div className="text-right flex-shrink-0">
          <span className={`text-xl sm:text-2xl font-bold ${scoreColors.text}`}>
            {dimension.score.toFixed(1)}
          </span>
          <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">/10</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5">
        {dimension.color === 'positive' && <CheckCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-500" />}
        {dimension.color === 'warning' && <AlertTriangle className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-500" />}
        {dimension.color === 'negative' && <TrendingDown className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-red-500" />}
        <span className={`text-sm sm:text-base ${statusColor}`}>
          {dimension.status}
        </span>
      </div>

      {/* Raw value indicator */}
      {dimension.rawValue !== undefined && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-stellar-cyan/10">
          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {dimension.rawLabel}: {dimension.rawValue >= 0 ? '+' : ''}{dimension.rawValue.toFixed(1)}{dimension.rawUnit}
          </span>
        </div>
      )}
    </div>
  );
};

// Action item component - mobile-optimized layout
const ActionItem = ({ action, index }) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-slate-50/60 via-white to-white dark:from-space-dust/60 dark:via-space-void dark:to-space-void rounded-xl border border-slate-200/80 dark:border-stellar-cyan/10 active:bg-slate-100 dark:active:bg-space-dust/60 transition-colors">
      {/* Step number */}
      <div className="flex-shrink-0 w-7 h-7 sm:w-7 sm:h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
        <span className="text-sm sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
          {index + 1}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 block mb-1.5">
          {action.title}
        </span>

        {/* Tags - stack on mobile, inline on desktop */}
        <div className={`flex gap-1.5 mb-2 ${isMobile ? 'flex-col items-start' : 'flex-row flex-wrap items-center'}`}>
          <ImpactTag impact={action.impact} />
          <EffortTag effort={action.effort} />
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {action.description}
        </p>

        {/* Context - shows comparison basis or data source */}
        {action.context && (
          <p className="text-xs sm:text-sm text-indigo-500 dark:text-indigo-400 mt-2 flex items-start gap-1.5 leading-relaxed">
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
            <span>{action.context}</span>
          </p>
        )}
      </div>

      {/* Arrow - hidden on mobile to save space */}
      <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1 hidden sm:block" />
    </div>
  );
};

const PriorityMatrix = ({
  dimensions,
  priority,
  actions,
  overallScore,
  dataContext // NEW: { currentMonth, previousMonth, year, growthWindow }
}) => {
  const { isDark } = useTheme();
  const [actionsExpanded, setActionsExpanded] = useState(false);

  if (!dimensions || !priority) return null;

  return (
    <SectionCard
      title="Prioridades do Negócio"
      subtitle={dataContext ? `Análise baseada em dados de ${dataContext.currentMonth} ${dataContext.year}` : "Análise das 4 dimensões principais do seu negócio"}
      icon={Target}
      id="priority-matrix-section"
      color="purple"
    >
      {/* Starfield container */}
      <div className="relative">
        {/* Starfield background - dark mode only */}
        {isDark && (
          <div className="absolute inset-0 bg-starfield opacity-50 rounded-xl pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10 space-y-5 sm:space-y-6">
        {/* Overall Score Badge with explanation tooltip */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-white dark:from-indigo-900/30 dark:via-purple-900/20 dark:to-space-void rounded-xl border border-indigo-200/80 dark:border-stellar-cyan/15">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
            <span className="text-sm sm:text-base font-medium text-indigo-800 dark:text-indigo-200">
              Score Geral do Negócio
            </span>
            <Tooltip
              content="Média ponderada das 4 dimensões. Quanto maior, melhor a saúde geral do negócio."
              howToRead="Peso: Lucratividade 35%, Crescimento 25%, Break-even 25%, Momentum 15%."
              dataRange={dataContext?.currentMonth ? `${dataContext.currentMonth} ${dataContext.year}` : null}
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400 hover:text-indigo-600 transition-colors" />
            </Tooltip>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-2xl sm:text-3xl font-bold ${getScoreColor(overallScore).text}`}>
              {overallScore.toFixed(1)}
            </span>
            <span className="text-sm sm:text-base text-slate-400 dark:text-slate-500">/10</span>
          </div>
        </div>

        {/* 2x2 Dimension Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <DimensionCard
            dimKey="profitability"
            dimension={dimensions.profitability}
            isPriority={priority.key === 'profitability'}
          />
          <DimensionCard
            dimKey="growth"
            dimension={dimensions.growth}
            isPriority={priority.key === 'growth'}
          />
          <DimensionCard
            dimKey="breakEven"
            dimension={dimensions.breakEven}
            isPriority={priority.key === 'breakEven'}
          />
          <DimensionCard
            dimKey="momentum"
            dimension={dimensions.momentum}
            isPriority={priority.key === 'momentum'}
          />
        </div>

        {/* Priority Focus Alert */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-red-50/60 via-orange-50/40 to-white dark:from-red-900/30 dark:via-orange-900/20 dark:to-space-void rounded-xl border border-red-200/80 dark:border-red-800/60">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 flex items-center justify-center">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-red-800 dark:text-red-200">
                Foco Principal: {priority.label}
              </h3>
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                Esta é sua dimensão mais fraca - priorize ações aqui
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Actions - Collapsible */}
        {actions && actions.length > 0 && (
          <div className="bg-gradient-to-br from-slate-50/40 via-white to-white dark:from-space-dust/40 dark:via-space-void dark:to-space-void rounded-xl border border-slate-200/80 dark:border-stellar-cyan/10">
            <button
              type="button"
              onClick={() => setActionsExpanded(!actionsExpanded)}
              className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-space-dust/30 rounded-xl transition-colors"
              aria-expanded={actionsExpanded}
              aria-controls="recommended-actions-content"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
                  Ações Recomendadas
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                  {actions.length}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${actionsExpanded ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              id="recommended-actions-content"
              className={`overflow-hidden transition-all duration-300 ease-in-out ${actionsExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="px-3 pb-3 sm:px-4 sm:pb-4 space-y-2">
                {actions.map((action, index) => (
                  <ActionItem key={index} action={action} index={index} />
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </SectionCard>
  );
};

export default PriorityMatrix;
