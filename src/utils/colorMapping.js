// colorMapping.js v1.0
// Unified semantic color mapping for Intelligence components
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial implementation
//   - Semantic color roles for business metrics
//   - Weather-specific colors
//   - Confidence level colors
//   - Dark mode support built-in

/**
 * Semantic color mappings for Intelligence dashboard
 * Each color includes all necessary Tailwind classes for consistent styling
 */
export const semanticColors = {
  // Primary business metrics
  revenue: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-100',
    textMuted: 'text-emerald-700 dark:text-emerald-300',
    textSubtle: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    gradient: 'from-emerald-500 to-emerald-600',
    ring: 'ring-emerald-500',
  },
  cost: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    bgGradient: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100',
    textMuted: 'text-red-700 dark:text-red-300',
    textSubtle: 'text-red-600 dark:text-red-400',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    gradient: 'from-red-500 to-red-600',
    ring: 'ring-red-500',
  },
  profit: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-900 dark:text-purple-100',
    textMuted: 'text-purple-700 dark:text-purple-300',
    textSubtle: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    gradient: 'from-purple-500 to-purple-600',
    ring: 'ring-purple-500',
  },

  // Trend indicators
  positive: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-100',
    textMuted: 'text-emerald-700 dark:text-emerald-300',
    textSubtle: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    gradient: 'from-emerald-500 to-emerald-600',
    ring: 'ring-emerald-500',
  },
  negative: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    bgGradient: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100',
    textMuted: 'text-red-700 dark:text-red-300',
    textSubtle: 'text-red-600 dark:text-red-400',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    gradient: 'from-red-500 to-red-600',
    ring: 'ring-red-500',
  },
  neutral: {
    bg: 'bg-slate-50 dark:bg-slate-800',
    bgGradient: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-900 dark:text-white',
    textMuted: 'text-slate-700 dark:text-slate-300',
    textSubtle: 'text-slate-600 dark:text-slate-400',
    icon: 'text-slate-600 dark:text-slate-400',
    iconBg: 'bg-slate-100 dark:bg-slate-700',
    gradient: 'from-slate-500 to-slate-600',
    ring: 'ring-slate-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    bgGradient: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    textMuted: 'text-amber-700 dark:text-amber-300',
    textSubtle: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    gradient: 'from-amber-500 to-amber-600',
    ring: 'ring-amber-500',
  },

  // Weather-specific (semantic colors for weather conditions)
  sunny: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    bgGradient: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    textMuted: 'text-amber-700 dark:text-amber-300',
    textSubtle: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-800/50',
    gradient: 'from-amber-400 to-yellow-500',
    ring: 'ring-amber-500',
    chartColor: '#f59e0b',
  },
  cloudy: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    bgGradient: 'bg-gradient-to-br from-slate-50 via-gray-100 to-slate-50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-900 dark:text-slate-100',
    textMuted: 'text-slate-700 dark:text-slate-300',
    textSubtle: 'text-slate-600 dark:text-slate-400',
    icon: 'text-slate-500 dark:text-slate-400',
    iconBg: 'bg-slate-200 dark:bg-slate-700',
    gradient: 'from-slate-400 to-gray-500',
    ring: 'ring-slate-500',
    chartColor: '#64748b',
  },
  rainy: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    bgGradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    textMuted: 'text-blue-700 dark:text-blue-300',
    textSubtle: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-200 dark:bg-blue-800/50',
    gradient: 'from-blue-400 to-indigo-500',
    ring: 'ring-blue-500',
    chartColor: '#3b82f6',
  },

  // Comfort-based weather categories (thermal comfort classification)
  muggy: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    bgGradient: 'bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-900 dark:text-orange-100',
    textMuted: 'text-orange-700 dark:text-orange-300',
    textSubtle: 'text-orange-600 dark:text-orange-400',
    icon: 'text-orange-500 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-800/50',
    gradient: 'from-orange-400 to-red-500',
    ring: 'ring-orange-500',
    chartColor: '#f97316',
  },
  hot: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    bgGradient: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-900 dark:text-yellow-100',
    textMuted: 'text-yellow-700 dark:text-yellow-300',
    textSubtle: 'text-yellow-600 dark:text-yellow-400',
    icon: 'text-yellow-500 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-800/50',
    gradient: 'from-yellow-400 to-amber-500',
    ring: 'ring-yellow-500',
    chartColor: '#eab308',
  },
  cold: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    bgGradient: 'bg-gradient-to-br from-cyan-50 via-sky-50 to-cyan-50 dark:from-cyan-900/20 dark:via-sky-900/20 dark:to-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-900 dark:text-cyan-100',
    textMuted: 'text-cyan-700 dark:text-cyan-300',
    textSubtle: 'text-cyan-600 dark:text-cyan-400',
    icon: 'text-cyan-500 dark:text-cyan-400',
    iconBg: 'bg-cyan-100 dark:bg-cyan-800/50',
    gradient: 'from-cyan-400 to-sky-500',
    ring: 'ring-cyan-500',
    chartColor: '#06b6d4',
  },
  mild: {
    bg: 'bg-lime-50 dark:bg-lime-900/20',
    bgGradient: 'bg-gradient-to-br from-lime-50 via-green-50 to-lime-50 dark:from-lime-900/20 dark:via-green-900/20 dark:to-lime-900/20',
    border: 'border-lime-200 dark:border-lime-800',
    text: 'text-lime-900 dark:text-lime-100',
    textMuted: 'text-lime-700 dark:text-lime-300',
    textSubtle: 'text-lime-600 dark:text-lime-400',
    icon: 'text-lime-500 dark:text-lime-400',
    iconBg: 'bg-lime-100 dark:bg-lime-800/50',
    gradient: 'from-lime-400 to-green-500',
    ring: 'ring-lime-500',
    chartColor: '#84cc16',
  },
  humid: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    bgGradient: 'bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-50 dark:from-teal-900/20 dark:via-emerald-900/20 dark:to-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    text: 'text-teal-900 dark:text-teal-100',
    textMuted: 'text-teal-700 dark:text-teal-300',
    textSubtle: 'text-teal-600 dark:text-teal-400',
    icon: 'text-teal-500 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-800/50',
    gradient: 'from-teal-400 to-emerald-500',
    ring: 'ring-teal-500',
    chartColor: '#14b8a6',
  },

  // Brand colors
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    textMuted: 'text-blue-700 dark:text-blue-300',
    textSubtle: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    gradient: 'from-blue-500 to-blue-600',
    ring: 'ring-blue-500',
  },
  lavpop: {
    bg: 'bg-lavpop-blue-50 dark:bg-lavpop-blue-900/20',
    bgGradient: 'bg-gradient-to-br from-lavpop-blue-50 to-lavpop-blue-100 dark:from-lavpop-blue-900/30 dark:to-lavpop-blue-800/20',
    border: 'border-lavpop-blue-200 dark:border-lavpop-blue-800',
    text: 'text-lavpop-blue-900 dark:text-lavpop-blue-100',
    textMuted: 'text-lavpop-blue-700 dark:text-lavpop-blue-300',
    textSubtle: 'text-lavpop-blue-600 dark:text-lavpop-blue-400',
    icon: 'text-lavpop-blue dark:text-blue-400',
    iconBg: 'bg-lavpop-blue-100 dark:bg-lavpop-blue-900/40',
    gradient: 'from-lavpop-blue to-blue-600',
    ring: 'ring-lavpop-blue',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    bgGradient: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-900 dark:text-indigo-100',
    textMuted: 'text-indigo-700 dark:text-indigo-300',
    textSubtle: 'text-indigo-600 dark:text-indigo-400',
    icon: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    gradient: 'from-indigo-500 to-indigo-600',
    ring: 'ring-indigo-500',
  },

  // Confidence levels
  high: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  medium: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },

  // Campaign status colors
  excellent: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30',
    gradient: 'from-emerald-500 to-emerald-600',
    label: 'Excelente',
  },
  good: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/30',
    gradient: 'from-blue-500 to-blue-600',
    label: 'Bom',
  },
  fair: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900/30',
    gradient: 'from-amber-500 to-amber-600',
    label: 'Razoavel',
  },
  poor: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    badge: 'bg-red-100 dark:bg-red-900/30',
    gradient: 'from-red-500 to-red-600',
    label: 'Fraco',
  },
};

/**
 * Get semantic color object by type
 * @param {string} type - Color type key
 * @returns {object} Color mapping object
 */
export const getSemanticColor = (type) => {
  return semanticColors[type] || semanticColors.neutral;
};

/**
 * Get color based on numeric value (positive/negative)
 * @param {number} value - Numeric value to evaluate
 * @param {boolean} inverse - If true, negative is good (e.g., cost reduction)
 * @returns {object} Color mapping object
 */
export const getValueColor = (value, inverse = false) => {
  if (value === 0 || value === null || value === undefined) {
    return semanticColors.neutral;
  }
  const isPositive = inverse ? value < 0 : value > 0;
  return isPositive ? semanticColors.positive : semanticColors.negative;
};

/**
 * Get confidence level color
 * @param {number} confidence - Confidence percentage (0-100)
 * @returns {object} Color mapping object with level label
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 70) return { ...semanticColors.high, level: 'high', label: 'Alta' };
  if (confidence >= 40) return { ...semanticColors.medium, level: 'medium', label: 'Media' };
  return { ...semanticColors.low, level: 'low', label: 'Baixa' };
};

/**
 * Get campaign status color
 * @param {string} status - Campaign status (excellent, good, fair, poor)
 * @returns {object} Color mapping object
 */
export const getCampaignStatusColor = (status) => {
  return semanticColors[status] || semanticColors.fair;
};

/**
 * Chart color palette for consistent data visualization
 */
export const chartColors = {
  primary: ['#1a5a8e', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  revenue: '#10b981',
  cost: '#ef4444',
  profit: '#8b5cf6',
  lavpop: '#1a5a8e',

  // Weather chart colors
  weather: {
    sunny: '#f59e0b',
    cloudy: '#64748b',
    rainy: '#3b82f6',
  },

  // Trend colors
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#64748b',
};

export default semanticColors;
