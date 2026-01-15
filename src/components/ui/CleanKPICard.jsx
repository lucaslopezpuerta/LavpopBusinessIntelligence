// CleanKPICard.jsx v1.1
// Minimal white-background KPI card with accent color sparkline
// Based on modern dashboard design patterns
//
// Features:
// - Clean white background (dark mode: slate-800)
// - Full-width sparkline covering card area
// - Accent color left border
// - Coherent icon and trend colors
// - Compact footprint for secondary metrics
//
// CHANGELOG:
// v1.1 (2026-01-13): Full-width sparkline + accent left border
// v1.0 (2026-01-13): Initial implementation

import React, { useMemo, useId, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { haptics } from '../../utils/haptics';

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

// Smooth hover animation
const hoverAnimation = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  hover: { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }
};

const hoverTransition = { type: 'tween', duration: 0.2, ease: 'easeOut' };

// Full-width sparkline that covers entire card bottom
const FullSparkline = ({ data, color = '#6366f1', id }) => {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Use percentage-based coordinates for full responsiveness
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 80 - 10; // 80% height range, 10% padding
      return `${x},${y}`;
    });

    return {
      line: `M${points.join(' L')}`,
      area: `M0,100 L${points.join(' L')} L100,100 Z`
    };
  }, [data]);

  if (!pathData) return null;

  const gradientId = `sparkline-fill-${id}`;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d={pathData.area}
        fill={`url(#${gradientId})`}
      />
      {/* Line */}
      <path
        d={pathData.line}
        fill="none"
        stroke={color}
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ strokeWidth: '2px' }}
      />
    </svg>
  );
};

// Trend indicator
const TrendIndicator = ({ value, color }) => {
  if (value === 0 || value === null || value === undefined) return null;

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <span className="inline-flex items-center gap-1" style={{ color }}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-sm font-semibold">
        {isPositive ? '+' : ''}{value}%
      </span>
    </span>
  );
};

const CleanKPICard = ({
  title,
  value,
  displayValue,
  subtitle,
  trend,
  icon: Icon,
  color = 'indigo', // accent color key
  onClick,
  sparklineData,
  className = '',
}) => {
  const uniqueId = useId();
  const isDark = useDarkMode();

  // Color mapping for accent colors (includes left border with dark mode support)
  const colorMap = {
    indigo: {
      icon: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      border: 'border-l-4 border-l-indigo-500 dark:border-l-indigo-400',
      sparkline: '#6366f1',
      sparklineDark: '#818cf8',
      trend: '#6366f1',
    },
    purple: {
      icon: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      border: 'border-l-4 border-l-purple-500 dark:border-l-purple-400',
      sparkline: '#9333ea',
      sparklineDark: '#a855f7',
      trend: '#9333ea',
    },
    blue: {
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-l-4 border-l-blue-500 dark:border-l-blue-400',
      sparkline: '#3b82f6',
      sparklineDark: '#60a5fa',
      trend: '#3b82f6',
    },
    emerald: {
      icon: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      border: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400',
      sparkline: '#10b981',
      sparklineDark: '#34d399',
      trend: '#10b981',
    },
    amber: {
      icon: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      border: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
      sparkline: '#f59e0b',
      sparklineDark: '#fbbf24',
      trend: '#f59e0b',
    },
    rose: {
      icon: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      border: 'border-l-4 border-l-rose-500 dark:border-l-rose-400',
      sparkline: '#f43f5e',
      sparklineDark: '#fb7185',
      trend: '#f43f5e',
    },
  };

  const colors = colorMap[color] || colorMap.indigo;
  const isClickable = !!onClick;

  const handleClick = useCallback(() => {
    if (isClickable) {
      haptics.light();
      onClick();
    }
  }, [isClickable, onClick]);

  const handleKeyDown = useCallback((e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      haptics.light();
      onClick();
    }
  }, [isClickable, onClick]);

  return (
    <motion.div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      initial="rest"
      whileHover="hover"
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      variants={hoverAnimation}
      transition={hoverTransition}
      className={`
        relative
        bg-white dark:bg-slate-800
        rounded-xl
        border border-slate-200 dark:border-slate-700
        ${colors.border}
        p-4
        overflow-hidden
        ${isClickable ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2' : ''}
        ${className}
      `}
    >
      {/* Full-width sparkline background */}
      {sparklineData && sparklineData.length >= 2 && (
        <FullSparkline
          data={sparklineData}
          color={isDark ? colors.sparklineDark : colors.sparkline}
          id={uniqueId}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Title */}
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
          {title}
        </p>

        {/* Value */}
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
          {displayValue}
        </p>

        {/* Subtitle + Trend */}
        <div className="flex items-center gap-2">
          {subtitle && (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {subtitle}
            </span>
          )}
          {trend?.show && (
            <TrendIndicator value={trend.value} color={colors.trend} />
          )}
        </div>
      </div>

      {/* Icon in top-right */}
      {Icon && (
        <div className={`absolute top-4 right-4 p-2 rounded-lg ${colors.iconBg}`}>
          <Icon className={`w-4 h-4 ${colors.icon}`} />
        </div>
      )}
    </motion.div>
  );
};

export default CleanKPICard;
