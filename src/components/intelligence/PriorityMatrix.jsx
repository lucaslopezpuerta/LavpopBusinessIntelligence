// PriorityMatrix.jsx v3.5.0 - SOLID COLOR BADGES
// Matriz de Prioridades - Visual Command Center com Gauges Radiais
// Design System v5.1 compliant - Premium Glass with Radial Gauges
//
// CHANGELOG:
// v3.5.0 (2026-01-28): Solid color badges for WCAG AA compliance
//   - Priority score badge now uses solid colors
//   - Removed unused bg property from getScoreColorEnhanced (dead code)
// v3.4.0 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Radial gauge, mini arc, and card animations disabled when user prefers reduced motion
// v3.3.1 (2026-01-24): Removed colored left border
// v3.3.0 (2026-01-24): Compact dimension cards
//   - Reduced card padding (p-3/p-2.5 from p-5/p-4)
//   - Smaller arc size (70/60 from 80/70)
//   - Reduced text sizes and margins throughout
//   - Tighter vertical spacing
// v3.2.0 (2026-01-24): Visual simplification
//   - Standard background for hero score section (removed purple tint)
//   - Removed icon badges from dimension cards (arc only)
//   - Removed icon from priority focus alert
// v3.1.0 (2026-01-24): Padding and consistency refinements
//   - Refined mini arc gauge padding in dimension cards
//   - Removed colored background from overall score status (coherence)
//   - Simplified hero status to match dimension card pattern
// v3.0.0 (2026-01-24): Major visual redesign - "Visual Command Center"
//   - Added radial gauge for overall score (hero section)
//   - Added mini arc gauges for each dimension card
//   - Enhanced color-coded glows based on score
//   - Added Framer Motion mount animations for arcs
//   - Added gradient orb background for depth
//   - Redesigned dimension cards with centered layout
//   - Enhanced priority alert with animated stripe
//   - Improved visual hierarchy with hero score as focal point
// v2.1.0 (2026-01-24): Simplificação e localização
// v2.0.0 (2026-01-24): Premium Glass upgrade
// v1.x: Previous versions

import React, { useEffect, useCallback, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Activity, HelpCircle, X } from 'lucide-react';
import { useMediaQuery, useIsMobile } from '../../hooks/useMediaQuery';
import { useTheme } from '../../contexts/ThemeContext';
import useReducedMotion from '../../hooks/useReducedMotion';

// Radial Gauge Component for Overall Score
const RadialGauge = ({ score, maxScore = 10, size = 180, strokeWidth = 14, isDark, prefersReducedMotion = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / maxScore) * circumference;
  const scoreColors = getScoreColorEnhanced(score, isDark);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#1e293b' : '#e2e8f0'}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scoreColors.ring}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={prefersReducedMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, ease: "easeOut", delay: 0.3 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter="url(#glow)"
        />
      </svg>

      {/* Inner content */}
      <div className={`
        absolute inset-0 flex flex-col items-center justify-center
        rounded-full m-4
        ${isDark ? 'bg-gradient-to-br from-space-dust to-space-nebula' : 'bg-gradient-to-br from-slate-50 to-white'}
      `}>
        <motion.span
          className={`text-4xl lg:text-5xl font-bold ${scoreColors.text}`}
          initial={prefersReducedMotion ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.8 }}
        >
          {score.toFixed(1)}
        </motion.span>
        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          de {maxScore}
        </span>
      </div>
    </div>
  );
};

// Mini Arc Component for Dimension Cards
const MiniArc = ({ score, isDark, size = 70, prefersReducedMotion = false }) => {
  const scoreColors = getScoreColorEnhanced(score, isDark);
  const arcRadius = size * 0.35;
  const startX = size * 0.15;
  const endX = size * 0.85;
  const centerY = size * 0.5;

  return (
    <svg width={size} height={size * 0.55} viewBox={`0 0 ${size} ${size * 0.55}`}>
      <defs>
        <filter id="miniGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background arc */}
      <path
        d={`M ${startX},${centerY} A ${arcRadius},${arcRadius} 0 0,1 ${endX},${centerY}`}
        stroke={isDark ? '#334155' : '#e2e8f0'}
        strokeWidth="5"
        fill="none"
      />

      {/* Progress arc */}
      <motion.path
        d={`M ${startX},${centerY} A ${arcRadius},${arcRadius} 0 0,1 ${endX},${centerY}`}
        stroke={scoreColors.ring}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        initial={prefersReducedMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: score / 10 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, delay: 0.4, ease: "easeOut" }}
        filter="url(#miniGlow)"
      />
    </svg>
  );
};

// Enhanced score colors with glow (bg property removed - was unused dead code)
const getScoreColorEnhanced = (score, isDark) => {
  if (score >= 8) return {
    ring: '#10b981',
    text: isDark ? 'text-emerald-400' : 'text-emerald-600',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]'
  };
  if (score >= 6) return {
    ring: '#3b82f6',
    text: isDark ? 'text-blue-400' : 'text-blue-600',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]'
  };
  if (score >= 4) return {
    ring: '#f59e0b',
    text: isDark ? 'text-amber-400' : 'text-amber-600',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]'
  };
  return {
    ring: '#ef4444',
    text: isDark ? 'text-red-400' : 'text-red-600',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]'
  };
};

// Status color for dimension status text
const getStatusColor = (color, isDark) => {
  switch (color) {
    case 'positive': return isDark ? 'text-emerald-400' : 'text-emerald-600';
    case 'neutral': return isDark ? 'text-blue-400' : 'text-blue-600';
    case 'warning': return isDark ? 'text-amber-400' : 'text-amber-600';
    case 'negative': return isDark ? 'text-red-400' : 'text-red-600';
    default: return isDark ? 'text-slate-400' : 'text-slate-600';
  }
};

// Dimension labels
const DIMENSION_LABELS = {
  profitability: 'Lucratividade',
  growth: 'Crescimento',
  breakEven: 'Ponto de Equilíbrio',
  momentum: 'Tendência'
};

// Tooltip component
const Tooltip = ({ children, content, howToRead, dataRange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!isVisible) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsVisible(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || isMobile) return;
    const handleScroll = () => setIsVisible(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, isMobile]);

  const closeTooltip = useCallback(() => setIsVisible(false), []);

  const showTooltip = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.left, width: rect.width });
    }
    setIsVisible(true);
  }, []);

  const desktopTooltipContent = isVisible && !isMobile && ReactDOM.createPortal(
    <div
      className={`
        fixed z-[9999] w-64 p-3 rounded-xl shadow-xl text-left pointer-events-none
        ${isDark ? 'bg-space-dust/95' : 'bg-white/95'}
        backdrop-blur-md
        ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
      `}
      style={{
        top: coords.top - 8,
        left: coords.left + coords.width / 2,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <p className={`text-sm mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{content}</p>
      {howToRead && (
        <div className="mb-2">
          <p className={`text-xs font-semibold mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Como interpretar:</p>
          <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{howToRead}</p>
        </div>
      )}
      {dataRange && (
        <div className={`pt-2 border-t ${isDark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
          <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
            <Activity className="w-3 h-3" />Dados: {dataRange}
          </p>
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <>
      {isVisible && isMobile && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={closeTooltip} aria-hidden="true" />
      )}
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          type="button"
          className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          onMouseEnter={!isMobile ? showTooltip : undefined}
          onMouseLeave={!isMobile ? closeTooltip : undefined}
          onClick={() => isMobile ? setIsVisible(!isVisible) : showTooltip()}
          aria-label="Mais informações"
        >
          {children}
        </button>
        {isVisible && isMobile && (
          <div className={`fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 p-4 rounded-xl shadow-2xl ${isDark ? 'bg-space-dust/95' : 'bg-white/95'} backdrop-blur-md ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}`}>
            <button type="button" onClick={closeTooltip} className="absolute top-3 right-3 p-1.5 rounded-full" aria-label="Fechar">
              <X className="w-4 h-4" />
            </button>
            <p className={`text-base mb-3 pr-8 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{content}</p>
            {howToRead && (
              <div className="mb-3">
                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Como interpretar:</p>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{howToRead}</p>
              </div>
            )}
          </div>
        )}
        {desktopTooltipContent}
      </div>
    </>
  );
};

// Dimension card component with mini arc
const DimensionCard = ({ dimKey, dimension, isPriority, isDark, isDesktop, index, prefersReducedMotion = false }) => {
  const label = DIMENSION_LABELS[dimKey];
  const scoreColors = getScoreColorEnhanced(dimension.score, isDark);
  const statusColor = getStatusColor(dimension.color, isDark);

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.2 + (index * 0.1), ease: "easeOut" }}
      className={`
        relative rounded-xl ${isDesktop ? 'p-3' : 'p-2.5'} flex flex-col items-center text-center
        ${isPriority
          ? `${isDark ? 'bg-gradient-to-br from-red-900/40 via-red-900/30 to-space-dust/60' : 'bg-gradient-to-br from-red-50 via-red-50/80 to-white'}
             ring-2 ${isDark ? 'ring-red-500/40' : 'ring-red-300'}
             shadow-lg ${isDark ? 'shadow-red-500/20' : ''}`
          : `${isDark ? 'bg-space-dust/60' : 'bg-white'}
             ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
             shadow-md`
        }
      `}
    >
      {/* Priority badge */}
      {isPriority && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={`
            px-2.5 py-1 rounded-full
            bg-gradient-to-r from-red-500 to-rose-500
            text-white text-xs font-bold
            shadow-lg animate-pulse
            ${isDark && 'shadow-red-500/50'}
          `}>
            Foco
          </div>
        </div>
      )}

      {/* Info tooltip */}
      {dimension.explanation && (
        <div className="absolute top-2 right-2">
          <Tooltip content={dimension.explanation} howToRead={dimension.howToRead} dataRange={dimension.dataRange}>
            <HelpCircle className={`w-4 h-4 ${isDark ? 'text-slate-500 hover:text-purple-400' : 'text-slate-400 hover:text-purple-500'}`} />
          </Tooltip>
        </div>
      )}

      {/* Mini arc */}
      <div className="mt-1">
        <MiniArc score={dimension.score} isDark={isDark} size={isDesktop ? 70 : 60} prefersReducedMotion={prefersReducedMotion} />
      </div>

      {/* Score */}
      <div className="mt-1">
        <span className={`${isDesktop ? 'text-xl' : 'text-lg'} font-bold ${scoreColors.text}`}>
          {dimension.score.toFixed(1)}
        </span>
        <span className={`text-xs ml-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/10</span>
      </div>

      {/* Label */}
      <h4 className={`${isDesktop ? 'text-xs' : 'text-[11px]'} font-semibold mt-1 mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        {label}
      </h4>

      {/* Status */}
      <div className="flex items-center gap-1">
        {dimension.color === 'positive' && <CheckCircle className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} aria-hidden="true" />}
        {dimension.color === 'warning' && <AlertTriangle className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} aria-hidden="true" />}
        {dimension.color === 'negative' && <TrendingDown className={`w-3 h-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} aria-hidden="true" />}
        <span className={`${isDesktop ? 'text-xs' : 'text-[11px]'} ${statusColor}`}>{dimension.status}</span>
      </div>
    </motion.div>
  );
};

const PriorityMatrix = ({
  dimensions,
  priority,
  overallScore,
  dataContext,
  className = ''
}) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (!dimensions || !priority) return null;

  const scoreColors = getScoreColorEnhanced(overallScore, isDark);

  return (
    <div
      id="priority-matrix-section"
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(147,51,234,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-purple-500 dark:bg-purple-600 flex items-center justify-center shadow-sm shrink-0">
          <Target className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h3 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Prioridades do Negócio
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {dataContext ? `${dataContext.currentMonth} ${dataContext.year}` : 'Análise das 4 dimensões'}
          </p>
        </div>
      </div>

      {/* Hero Section - Overall Score */}
      <motion.div
        initial={prefersReducedMotion ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
        className={`
          relative rounded-2xl p-6 lg:p-8 mb-5
          ${isDark ? 'bg-space-dust/60' : 'bg-white'}
          ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
          shadow-md overflow-hidden
        `}
      >

        <div className="relative z-10 flex flex-col items-center">
          <p className={`text-sm font-medium mb-4 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
            Pontuação Geral
          </p>

          <RadialGauge
            score={overallScore}
            size={isDesktop ? 200 : 160}
            strokeWidth={isDesktop ? 16 : 12}
            isDark={isDark}
            prefersReducedMotion={prefersReducedMotion}
          />

          <div className="flex items-center gap-1.5 mt-4">
            {overallScore >= 8 && <CheckCircle className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} aria-hidden="true" />}
            {overallScore >= 6 && overallScore < 8 && <TrendingUp className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} aria-hidden="true" />}
            {overallScore >= 4 && overallScore < 6 && <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} aria-hidden="true" />}
            {overallScore < 4 && <TrendingDown className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} aria-hidden="true" />}
            <span className={`text-sm font-semibold ${scoreColors.text}`}>
              {overallScore >= 8 ? 'Excelente' : overallScore >= 6 ? 'Bom' : overallScore >= 4 ? 'Atenção' : 'Crítico'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Dimension Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <DimensionCard
          dimKey="profitability"
          dimension={dimensions.profitability}
          isPriority={priority.key === 'profitability'}
          isDark={isDark}
          isDesktop={isDesktop}
          index={0}
          prefersReducedMotion={prefersReducedMotion}
        />
        <DimensionCard
          dimKey="growth"
          dimension={dimensions.growth}
          isPriority={priority.key === 'growth'}
          isDark={isDark}
          isDesktop={isDesktop}
          index={1}
          prefersReducedMotion={prefersReducedMotion}
        />
        <DimensionCard
          dimKey="breakEven"
          dimension={dimensions.breakEven}
          isPriority={priority.key === 'breakEven'}
          isDark={isDark}
          isDesktop={isDesktop}
          index={2}
          prefersReducedMotion={prefersReducedMotion}
        />
        <DimensionCard
          dimKey="momentum"
          dimension={dimensions.momentum}
          isPriority={priority.key === 'momentum'}
          isDark={isDark}
          isDesktop={isDesktop}
          index={3}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Priority Focus Alert */}
      <motion.div
        initial={prefersReducedMotion ? false : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.6 }}
        className={`
          p-4 rounded-xl relative overflow-hidden
          ${isDark ? 'bg-red-900/20' : 'bg-red-50/80'}
          ring-1 ${isDark ? 'ring-red-500/30' : 'ring-red-200'}
        `}
      >
        {/* Animated stripe */}
        <div className={`
          absolute left-0 top-0 bottom-0 w-1
          bg-gradient-to-b from-red-500 via-rose-500 to-red-500
        `} />

        <div className="flex items-center gap-4 ml-2">
          <div className="flex-1 min-w-0">
            <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold ${isDark ? 'text-red-200' : 'text-red-800'}`}>
              Foco Prioritário: {priority.label}
            </h4>
            <p className={`${isDesktop ? 'text-sm' : 'text-xs'} mt-0.5 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              Área mais crítica - requer atenção imediata
            </p>
          </div>

          <div className={`
            px-3 py-1.5 rounded-lg shrink-0
            bg-red-600 dark:bg-red-500
          `}>
            <span className="text-sm font-bold text-white">
              {dimensions[priority.key].score.toFixed(1)}
            </span>
            <span className="text-xs text-white/80">/10</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PriorityMatrix;
