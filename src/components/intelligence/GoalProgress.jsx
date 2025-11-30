// GoalProgress.jsx v1.1
// Goal progress tracking for Intelligence tab
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.1 (2025-11-30): Accessibility fix
//   - Changed text-[10px] to text-xs (min 12px font)
// v1.0 (2025-11-30): Initial implementation
//   - Visual progress rings for key metrics
//   - Compares actual vs target from business settings
//   - Mobile responsive grid
//   - Animated progress indicators

import React from 'react';
import { Target, TrendingUp, Users, Zap } from 'lucide-react';

const ProgressRing = ({
  progress,
  size = 80,
  strokeWidth = 6,
  color = 'blue',
  children
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  const colorClasses = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    amber: 'stroke-amber-500',
    red: 'stroke-red-500',
    purple: 'stroke-purple-500',
    indigo: 'stroke-indigo-500'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClasses[color]} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

const GoalCard = ({
  icon: Icon,
  label,
  current,
  target,
  formatValue,
  color = 'blue',
  suffix = ''
}) => {
  const progress = target > 0 ? (current / target) * 100 : 0;
  const isAchieved = progress >= 100;

  const getProgressColor = () => {
    if (progress >= 100) return 'green';
    if (progress >= 75) return 'blue';
    if (progress >= 50) return 'amber';
    return 'red';
  };

  const progressColor = getProgressColor();

  const bgColors = {
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
    amber: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
    indigo: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20'
  };

  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400',
    indigo: 'text-indigo-600 dark:text-indigo-400'
  };

  return (
    <div
      className={`
        p-4 sm:p-5 rounded-xl
        bg-gradient-to-br ${bgColors[color]}
        border border-gray-200 dark:border-slate-700
      `}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Progress Ring */}
        <ProgressRing
          progress={progress}
          size={64}
          strokeWidth={5}
          color={progressColor}
        >
          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
            {Math.min(progress, 999).toFixed(0)}%
          </span>
        </ProgressRing>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 ${iconColors[color]}`} aria-hidden="true" />
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300">
              {label}
            </span>
          </div>

          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            {formatValue(current)}{suffix}
          </p>

          <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
            Meta: {formatValue(target)}{suffix}
          </p>

          {isAchieved && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
              <Zap className="w-3 h-3" aria-hidden="true" />
              Meta atingida!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const GoalProgress = ({
  currentMonth,
  settings,
  formatCurrency,
  className = ''
}) => {
  // Default targets if not set in settings
  const targets = {
    monthlyRevenue: settings?.targetMonthlyRevenue || 50000,
    monthlyServices: settings?.targetMonthlyServices || 1000,
    avgTicket: settings?.targetAvgTicket || 50
  };

  // Calculate averages
  const avgTicket = currentMonth?.services > 0
    ? currentMonth.revenue / currentMonth.services
    : 0;

  // If no current month data, show placeholder
  if (!currentMonth) {
    return (
      <div className={`p-6 text-center bg-gray-50 dark:bg-slate-800 rounded-xl ${className}`}>
        <Target className="w-8 h-8 text-gray-400 dark:text-slate-500 mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Carregando metas...
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-lavpop-blue dark:text-blue-400" aria-hidden="true" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Progresso das Metas
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <GoalCard
          icon={TrendingUp}
          label="Receita Mensal"
          current={currentMonth.revenue || 0}
          target={targets.monthlyRevenue}
          formatValue={formatCurrency}
          color="blue"
        />

        <GoalCard
          icon={Zap}
          label="Ciclos do Mês"
          current={currentMonth.services || 0}
          target={targets.monthlyServices}
          formatValue={(v) => v.toLocaleString('pt-BR')}
          color="purple"
        />

        <GoalCard
          icon={Users}
          label="Ticket Médio"
          current={avgTicket}
          target={targets.avgTicket}
          formatValue={formatCurrency}
          color="indigo"
        />
      </div>
    </div>
  );
};

export default GoalProgress;
