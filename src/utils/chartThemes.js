// chartThemes.js v1.0
// Centralized chart theme configurations for Nivo and Recharts
// Design System v3.0 compliant with dark mode support
//
// CHANGELOG:
// v1.0 (2025-11-29): Initial implementation
//   - bilavnovaNivoTheme for Nivo charts with dark mode
//   - Color palettes matching Tailwind config

// Bilavnova brand colors (matching tailwind.config.js)
export const CHART_COLORS = {
  lavpopBlue: '#1a5a8e',
  lavpopGreen: '#55b03b',
  // Semantic colors
  success: '#10b981',   // green-500
  warning: '#f59e0b',   // amber-500
  error: '#ef4444',     // red-500
  info: '#3b82f6',      // blue-500
  purple: '#8b5cf6',    // violet-500
  // Weather colors
  sunny: '#eab308',     // yellow-500
  cloudy: '#3b82f6',    // blue-500
  rainy: '#6366f1',     // indigo-500
};

// Color palette for bar/pie charts
export const CHART_PALETTE = {
  light: ['#1a5a8e', '#55b03b', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'],
  dark: ['#3b82f6', '#4ade80', '#a78bfa', '#fbbf24', '#f87171', '#22d3ee'],
};

/**
 * Get Nivo theme configuration based on dark mode
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {object} Nivo theme configuration
 */
export const getBilavnovaNivoTheme = (isDark) => ({
  // Background
  background: isDark ? '#0f172a' : '#ffffff',

  // Text colors
  textColor: isDark ? '#e2e8f0' : '#475569',
  fontSize: 12,

  // Axis styling
  axis: {
    domain: {
      line: {
        stroke: isDark ? '#475569' : '#cbd5e1',
        strokeWidth: 1,
      },
    },
    ticks: {
      line: {
        stroke: isDark ? '#475569' : '#cbd5e1',
        strokeWidth: 1,
      },
      text: {
        fill: isDark ? '#94a3b8' : '#64748b',
        fontSize: 11,
      },
    },
    legend: {
      text: {
        fill: isDark ? '#e2e8f0' : '#1e293b',
        fontSize: 12,
        fontWeight: 500,
      },
    },
  },

  // Grid styling
  grid: {
    line: {
      stroke: isDark ? '#1e293b' : '#f1f5f9',
      strokeWidth: 1,
    },
  },

  // Legend styling
  legends: {
    title: {
      text: {
        fill: isDark ? '#e2e8f0' : '#1e293b',
        fontSize: 12,
        fontWeight: 600,
      },
    },
    text: {
      fill: isDark ? '#94a3b8' : '#64748b',
      fontSize: 11,
    },
    ticks: {
      line: {
        stroke: isDark ? '#475569' : '#cbd5e1',
        strokeWidth: 1,
      },
      text: {
        fill: isDark ? '#94a3b8' : '#64748b',
        fontSize: 10,
      },
    },
  },

  // Tooltip styling
  tooltip: {
    container: {
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#e2e8f0' : '#1e293b',
      fontSize: 12,
      borderRadius: '8px',
      boxShadow: isDark
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '12px 16px',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    },
  },

  // Labels styling
  labels: {
    text: {
      fill: isDark ? '#ffffff' : '#ffffff',
      fontSize: 11,
      fontWeight: 500,
    },
  },

  // Annotations
  annotations: {
    text: {
      fill: isDark ? '#e2e8f0' : '#1e293b',
      fontSize: 13,
      fontWeight: 500,
    },
    link: {
      stroke: isDark ? '#475569' : '#94a3b8',
      strokeWidth: 1,
    },
    outline: {
      stroke: isDark ? '#475569' : '#94a3b8',
      strokeWidth: 2,
    },
    symbol: {
      fill: isDark ? '#3b82f6' : '#1a5a8e',
    },
  },
});

/**
 * Get chart colors based on dark mode
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {string[]} Array of chart colors
 */
export const getChartPalette = (isDark) =>
  isDark ? CHART_PALETTE.dark : CHART_PALETTE.light;

export default getBilavnovaNivoTheme;
