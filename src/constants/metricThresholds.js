// metricThresholds.js v1.0 - METRIC STATUS THRESHOLDS
// Defines good/warning/critical ranges for KPI status badges
// Plan Item 1.3: Status Color Badges
//
// CHANGELOG:
// v1.0 (2026-01-07): Initial implementation
//   - THRESHOLDS object with ranges for key metrics
//   - getMetricStatus helper function for status determination
//   - Used by KPICard status prop for colored left borders

/**
 * Metric threshold definitions
 * Each metric has three ranges:
 * - good: [min, max] - Green status (optimal performance)
 * - warning: [min, max] - Yellow status (needs attention)
 * - critical: [min, max] - Red status (requires action)
 */
export const THRESHOLDS = {
  // Machine utilization (ideal: 25-85%)
  utilizacao: {
    good: [15, 85],
    warning: [5, 15],
    critical: [0, 5]
  },

  // Machine utilization overflow (too high can cause wear)
  utilizationOverflow: {
    good: [0, 85],
    warning: [85, 95],
    critical: [95, 100]
  },

  // Customer retention pulse (0-10 scale)
  retentionPulse: {
    good: [6, 10],
    warning: [4, 6],
    critical: [0, 4]
  },

  // Campaign ROI percentage
  campaignReturn: {
    good: [15, 100],
    warning: [8, 15],
    critical: [0, 8]
  },

  // Social media engagement rate
  engagementRate: {
    good: [3, 100],
    warning: [1.5, 3],
    critical: [0, 1.5]
  },

  // Month-over-month revenue growth
  momGrowth: {
    good: [5, 100],
    warning: [-5, 5],
    critical: [-100, -5]
  },

  // At-risk customer percentage
  atRiskPercent: {
    good: [0, 10],
    warning: [10, 20],
    critical: [20, 100]
  }
};

/**
 * Determine metric status based on value and threshold
 * @param {string} metric - Key from THRESHOLDS object
 * @param {number} value - Current metric value
 * @returns {'success' | 'warning' | 'danger' | 'neutral'} Status for styling
 */
export const getMetricStatus = (metric, value) => {
  const t = THRESHOLDS[metric];
  if (!t || value === null || value === undefined) return 'neutral';

  // Check if value falls in good range
  if (value >= t.good[0] && value <= t.good[1]) return 'success';

  // Check if value falls in warning range
  if (value >= t.warning[0] && value < t.warning[1]) return 'warning';

  // Otherwise it's in critical range
  return 'danger';
};

export default { THRESHOLDS, getMetricStatus };
