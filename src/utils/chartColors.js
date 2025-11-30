// chartColors.js v1.0
// Centralized chart color configuration for Recharts and Nivo
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial implementation
//   - Theme-aware color getters
//   - Gradient definitions
//   - Semantic color mappings
//   - Consistent across all chart components

/**
 * Get theme-aware chart colors
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {Object} Color configuration object
 */
export const getChartColors = (isDark) => ({
  // Primary brand colors
  primary: isDark ? '#3b82f6' : '#1a5a8e',       // Blue
  secondary: isDark ? '#4ade80' : '#10b981',     // Green
  accent: isDark ? '#a78bfa' : '#8b5cf6',        // Purple

  // Grid & Axis
  grid: isDark ? '#1e293b' : '#f1f5f9',          // slate-800 / slate-100
  axis: isDark ? '#334155' : '#e2e8f0',          // slate-700 / slate-200
  axisLine: isDark ? '#334155' : '#e2e8f0',      // slate-700 / slate-200
  tickText: isDark ? '#94a3b8' : '#64748b',      // slate-400 / slate-500
  labelText: isDark ? '#e2e8f0' : '#1e293b',     // slate-200 / slate-800
  yAxisLabel: isDark ? '#cbd5e1' : '#475569',    // slate-300 / slate-600

  // Tooltip
  tooltipBg: isDark ? '#1e293b' : '#ffffff',
  tooltipBorder: isDark ? '#334155' : '#e2e8f0',
  tooltipText: isDark ? '#f1f5f9' : '#1e293b',

  // Cursor
  cursorFill: isDark ? '#1e293b40' : '#f1f5f940',

  // Semantic colors
  success: isDark ? '#4ade80' : '#10b981',       // Green
  warning: isDark ? '#fbbf24' : '#f59e0b',       // Amber
  error: isDark ? '#f87171' : '#ef4444',         // Red
  info: isDark ? '#60a5fa' : '#3b82f6',          // Blue
});

/**
 * Gradient definitions for bars/areas
 */
export const chartGradients = {
  // Wash services (blue gradient)
  wash: {
    id: 'washGradient',
    start: '#3b82f6',  // blue-500
    end: '#1d4ed8',    // blue-700
  },
  // Dry services (green gradient)
  dry: {
    id: 'dryGradient',
    start: '#4ade80',  // green-400
    end: '#16a34a',    // green-600
  },
  // Revenue (lavpop blue gradient)
  revenue: {
    id: 'revenueGradient',
    start: '#1a5a8e',  // lavpop-blue
    end: '#154872',    // lavpop-blue-600
  },
  // Utilization (purple gradient)
  utilization: {
    id: 'utilizationGradient',
    start: '#8b5cf6',  // violet-500
    end: '#6d28d9',    // violet-700
  },
  // Cost/negative (red gradient)
  cost: {
    id: 'costGradient',
    start: '#f87171',  // red-400
    end: '#dc2626',    // red-600
  },
};

/**
 * Data series colors (for multi-series charts)
 */
export const seriesColors = {
  light: [
    '#1a5a8e',  // lavpop-blue
    '#10b981',  // emerald-500
    '#8b5cf6',  // violet-500
    '#f59e0b',  // amber-500
    '#ef4444',  // red-500
    '#06b6d4',  // cyan-500
    '#ec4899',  // pink-500
    '#84cc16',  // lime-500
  ],
  dark: [
    '#3b82f6',  // blue-500
    '#4ade80',  // green-400
    '#a78bfa',  // violet-400
    '#fbbf24',  // amber-400
    '#f87171',  // red-400
    '#22d3ee',  // cyan-400
    '#f472b6',  // pink-400
    '#a3e635',  // lime-400
  ],
};

/**
 * Get series colors for a given theme
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {string[]} Array of colors
 */
export const getSeriesColors = (isDark) => isDark ? seriesColors.dark : seriesColors.light;

/**
 * Comparison line colors (for previous period overlays)
 */
export const comparisonColors = {
  prevWash: '#93c5fd',   // blue-300
  prevDry: '#fdba74',    // orange-300
  prevRevenue: '#a5b4fc', // indigo-300
};

/**
 * Risk level colors (for customer segmentation)
 */
export const riskColors = {
  healthy: '#10b981',    // emerald-500
  monitor: '#3b82f6',    // blue-500
  atRisk: '#f59e0b',     // amber-500
  churning: '#ef4444',   // red-500
  newCustomer: '#8b5cf6', // violet-500
  lost: '#6b7280',       // gray-500
};

/**
 * Weather impact colors
 */
export const weatherColors = {
  sunny: '#fbbf24',      // amber-400
  cloudy: '#60a5fa',     // blue-400
  rainy: '#6366f1',      // indigo-500
};

/**
 * Generate SVG gradient definition for Recharts
 * @param {Object} gradient - Gradient config with id, start, end
 * @returns {JSX.Element} SVG linearGradient element
 */
export const createGradientDef = (gradient) => (
  `<linearGradient id="${gradient.id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="${gradient.start}" stopOpacity="1" />
    <stop offset="100%" stopColor="${gradient.end}" stopOpacity="1" />
  </linearGradient>`
);

/**
 * Common chart margins
 */
export const chartMargins = {
  default: { top: 20, right: 20, bottom: 20, left: 20 },
  withYAxisLabel: { top: 20, right: 20, bottom: 20, left: 40 },
  compact: { top: 10, right: 10, bottom: 10, left: 10 },
  mobile: { top: 10, right: 10, bottom: 20, left: 10 },
};

/**
 * Common chart heights
 */
export const chartHeights = {
  small: 200,
  medium: 300,
  large: 400,
  extraLarge: 500,
};

export default {
  getChartColors,
  chartGradients,
  seriesColors,
  getSeriesColors,
  comparisonColors,
  riskColors,
  weatherColors,
  createGradientDef,
  chartMargins,
  chartHeights,
};
