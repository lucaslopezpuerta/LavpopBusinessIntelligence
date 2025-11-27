//nivoTheme.ts V1.0
//Creation

// Global Lavpop BI theme for all Nivo charts
export const lavpopNivoTheme = {
  // Let the card/container control background via Tailwind
  background: 'transparent',

  // Global text & font
  textColor: 'var(--color-text-primary)',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: 11,

  axis: {
    domain: {
      line: {
        stroke: 'var(--color-border)',
        strokeWidth: 1,
      },
    },
    ticks: {
      line: {
        stroke: 'var(--color-border)',
        strokeWidth: 1,
      },
      text: {
        fill: 'var(--color-text-secondary)',
        fontSize: 11,
      },
    },
    legend: {
      text: {
        fill: 'var(--color-text-secondary)',
        fontSize: 12,
        fontWeight: 500,
      },
    },
  },

  grid: {
    line: {
      stroke: 'var(--color-border)',
      strokeWidth: 1,
      strokeDasharray: '3 3',
    },
  },

  legends: {
    text: {
      fill: 'var(--color-text-secondary)',
      fontSize: 11,
    },
    ticks: {
      line: {
        stroke: 'var(--color-border)',
        strokeWidth: 1,
      },
    },
  },

  labels: {
    text: {
      fill: 'var(--color-text-secondary)',
      fontSize: 11,
      fontWeight: 500,
    },
  },

  annotations: {
    text: {
      fontSize: 11,
      fill: 'var(--color-text-primary)',
      outlineWidth: 2,
      outlineColor: 'rgba(15,23,42,0.7)', // fallback if vars fail
    },
    link: {
      stroke: 'var(--color-border)',
      strokeWidth: 1,
      outlineWidth: 0,
    },
    outline: {
      stroke: 'var(--color-border)',
      strokeWidth: 1,
    },
    symbol: {
      fill: 'var(--color-surface)',
      stroke: 'var(--color-border)',
      strokeWidth: 1,
    },
  },

  tooltip: {
    container: {
      background: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      fontSize: 11,
      borderRadius: '0.75rem', // rounded-xl
      boxShadow: 'var(--shadow-md)',
      border: `1px solid var(--color-border)`,
      padding: '0.5rem 0.75rem',
    },
    basic: {
      whiteSpace: 'nowrap',
    },
    chip: {
      borderRadius: '9999px',
    },
  },

  crosshair: {
    line: {
      stroke: 'rgba(148, 163, 184, 0.7)', // slate-400-ish
      strokeWidth: 1,
      strokeDasharray: '4 4',
    },
  },

  // Point / dot defaults for line/scatter
  dots: {
    text: {
      fontSize: 10,
      fill: 'var(--color-text-primary)',
    },
  },

  // For sankey, chords, etc. where border is used heavily
  border: {
    width: 1,
    color: 'var(--color-border)',
  },
};

// Primary Lavpop BI chart color palette
// matches your design system: blue, green, amber, red
export const lavpopChartColors = [
  '#1a5a8e', // lavpop-blue (primary)
  '#55b03b', // lavpop-green (accent)
  '#f59e0b', // amber (warning/neutral)
  '#ef4444', // red (negative)
];

// Optional: risk-specific palette for segmentation charts
export const lavpopRiskColors = {
  churning: '#dc2626',   // risk.churning
  atRisk: '#f59e0b',     // risk["at-risk"]
  monitor: '#1a5a8e',    // risk.monitor
  healthy: '#55b03b',    // risk.healthy
  new: '#9333ea',        // risk.new
  lost: '#6b7280',       // risk.lost
};

// Sequential color scale for utilization heatmap (blue gradient)
// Used for intensity mapping: low activity → high activity
// Aligned with Lavpop brand color (#1a5a8e)
export const lavpopUtilizationScale = [
  '#f3f4f6', // 0% - gray-100 (no data/empty)
  '#dbeafe', // 1-20% - blue-100 (very light blue)
  '#93c5fd', // 21-40% - blue-300 (light blue)
  '#3b82f6', // 41-60% - blue-500 (medium blue)
  '#2563eb', // 61-80% - blue-600 (strong blue)
  '#1a5a8e', // 81-100% - lavpop-blue (dark blue - brand color)
];
