// reportConfigs.js v1.0 - PDF Report Template Configurations
// Design System v6.3 compliant color palette and report templates
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - Design System v6.3 color palette
//   - Report templates: Executive Summary, Complete Report, Customer Health
//   - Section configurations with layout specs

/**
 * Design System v6.3 Color Palette for PDF exports
 * All colors are RGB arrays for jsPDF compatibility
 */
export const COLORS = {
  // Stellar Colors (Primary Brand)
  stellarBlue: [45, 56, 138],       // #2d388a - header gradient, deep accents
  stellarCyan: [0, 174, 239],       // #00aeef - primary accent, active states

  // Cosmic Colors (Semantic)
  cosmicGreen: [34, 197, 94],       // #22C55E - success, positive trends
  cosmicAmber: [245, 158, 11],      // #F59E0B - warning, VIP accent
  cosmicRose: [239, 68, 68],        // #EF4444 - danger, critical alerts

  // Segment Colors (RFM)
  segmentVIP: [245, 158, 11],       // Amber - VIP/Champion
  segmentFrequente: [59, 130, 246], // Blue - Frequente/Loyal
  segmentPromissor: [6, 182, 212],  // Cyan - Promissor/Potential
  segmentNovato: [168, 85, 247],    // Purple - Novato/New
  segmentEsfriando: [249, 115, 22], // Orange - Esfriando/At Risk
  segmentInativo: [100, 116, 139],  // Slate - Inativo/Lost

  // Neutrals
  slate900: [15, 23, 42],           // Primary text
  slate700: [51, 65, 85],           // Secondary text
  slate500: [100, 116, 139],        // Muted text
  slate300: [203, 213, 225],        // Borders
  slate100: [241, 245, 249],        // Card backgrounds
  white: [255, 255, 255],           // Pure white
};

/**
 * Segment color mapping for consistent RFM visualization
 */
export const SEGMENT_COLORS = {
  'VIP': COLORS.segmentVIP,
  'Frequente': COLORS.segmentFrequente,
  'Promissor': COLORS.segmentPromissor,
  'Novato': COLORS.segmentNovato,
  'Esfriando': COLORS.segmentEsfriando,
  'Inativo': COLORS.segmentInativo,
  // English fallbacks
  'Champion': COLORS.segmentVIP,
  'Loyal': COLORS.segmentFrequente,
  'Potential': COLORS.segmentPromissor,
  'New': COLORS.segmentNovato,
  'At Risk': COLORS.segmentEsfriando,
  'Lost': COLORS.segmentInativo,
};

/**
 * Risk level colors for churn visualization
 */
export const RISK_COLORS = {
  'Healthy': COLORS.cosmicGreen,
  'Monitor': COLORS.stellarCyan,
  'At Risk': COLORS.cosmicAmber,
  'Churning': COLORS.cosmicRose,
  'New Customer': [168, 85, 247], // Purple
  'Lost': COLORS.slate500,
};

/**
 * Impact/Effort badge colors for action cards
 */
export const IMPACT_COLORS = {
  high: COLORS.cosmicRose,
  medium: COLORS.cosmicAmber,
  low: COLORS.cosmicGreen,
};

/**
 * Executive Summary Report Configuration
 * Single page, board-ready format
 */
export const EXECUTIVE_SUMMARY_CONFIG = {
  id: 'executive-summary',
  name: 'Resumo Executivo',
  pages: 1,
  orientation: 'portrait',
  sections: [
    {
      id: 'hero',
      type: 'hero',
      height: 55,
      showLogo: true,
      showHealthGauge: true,
    },
    {
      id: 'kpis',
      type: 'kpi-grid',
      height: 28,
      columns: 4,
      items: ['mtdRevenue', 'wowChange', 'activeCustomers', 'totalServices'],
    },
    {
      id: 'priority-matrix',
      type: 'mini-gauges',
      height: 25,
      items: ['profitability', 'growth', 'breakEven', 'momentum'],
    },
    {
      id: 'narrative',
      type: 'narrative',
      height: 35,
      maxLines: 5,
    },
    {
      id: 'actions',
      type: 'insight-cards',
      height: 50,
      maxItems: 3,
    },
    {
      id: 'alerts',
      type: 'alerts',
      height: 30,
      maxItems: 2,
    },
  ],
};

/**
 * Complete Business Report Configuration
 * Multi-page comprehensive analysis
 */
export const COMPLETE_REPORT_CONFIG = {
  id: 'complete-report',
  name: 'Relatório Completo',
  pages: 5,
  orientation: 'portrait',
  sections: [
    // Page 1: Executive Overview
    {
      page: 1,
      title: 'Visão Geral Executiva',
      sections: [
        { id: 'hero', type: 'hero', height: 50 },
        { id: 'kpis', type: 'kpi-grid', height: 30 },
        { id: 'narrative', type: 'narrative', height: 40 },
        { id: 'alerts', type: 'alerts', height: 25 },
      ],
    },
    // Page 2: Revenue Analysis
    {
      page: 2,
      title: 'Análise de Receita',
      sections: [
        { id: 'revenue-trend', type: 'sparkline-chart', height: 50 },
        { id: 'service-breakdown', type: 'bar-chart', height: 45 },
        { id: 'wow-comparison', type: 'comparison-table', height: 40 },
        { id: 'revenue-narrative', type: 'narrative', height: 30 },
      ],
    },
    // Page 3: Customer Intelligence
    {
      page: 3,
      title: 'Inteligência de Clientes',
      sections: [
        { id: 'rfm-donut', type: 'donut-chart', height: 55 },
        { id: 'health-metrics', type: 'kpi-grid', height: 25 },
        { id: 'at-risk-table', type: 'table', height: 60, maxRows: 10 },
        { id: 'customer-narrative', type: 'narrative', height: 25 },
      ],
    },
    // Page 4: Operations
    {
      page: 4,
      title: 'Operações',
      sections: [
        { id: 'utilization-gauges', type: 'mini-gauges', height: 35 },
        { id: 'peak-hours', type: 'heatmap', height: 55 },
        { id: 'machine-performance', type: 'bar-chart', height: 45 },
        { id: 'operations-narrative', type: 'narrative', height: 30 },
      ],
    },
    // Page 5: Recommendations & Forecast
    {
      page: 5,
      title: 'Recomendações e Previsões',
      sections: [
        { id: 'forecast', type: 'forecast-chart', height: 45 },
        { id: 'priority-actions', type: 'insight-cards', height: 70 },
        { id: 'next-steps', type: 'checklist', height: 40 },
      ],
    },
  ],
};

/**
 * Customer Health Report Configuration
 * Customer-focused analysis
 */
export const CUSTOMER_HEALTH_CONFIG = {
  id: 'customer-health',
  name: 'Saúde de Clientes',
  pages: 2,
  orientation: 'portrait',
  sections: [
    // Page 1: Overview & Segments
    {
      page: 1,
      title: 'Saúde da Base de Clientes',
      sections: [
        { id: 'health-hero', type: 'health-hero', height: 45 },
        { id: 'segment-donut', type: 'donut-chart', height: 60 },
        { id: 'segment-table', type: 'segment-table', height: 50 },
        { id: 'health-narrative', type: 'narrative', height: 30 },
      ],
    },
    // Page 2: At-Risk & Recommendations
    {
      page: 2,
      title: 'Clientes em Risco e Ações',
      sections: [
        { id: 'risk-distribution', type: 'risk-bars', height: 35 },
        { id: 'at-risk-contacts', type: 'contact-table', height: 80, maxRows: 15 },
        { id: 'retention-actions', type: 'insight-cards', height: 50 },
      ],
    },
  ],
};

/**
 * Page dimensions and margins
 */
export const PAGE_CONFIG = {
  a4: {
    width: 210,
    height: 297,
    margin: 15,
    headerHeight: 22,
    footerHeight: 12,
  },
};

/**
 * Typography settings
 */
export const TYPOGRAPHY = {
  title: { size: 14, weight: 'bold', color: COLORS.slate900 },
  subtitle: { size: 10, weight: 'normal', color: COLORS.slate700 },
  heading: { size: 11, weight: 'bold', color: COLORS.slate900 },
  body: { size: 9, weight: 'normal', color: COLORS.slate700 },
  caption: { size: 7, weight: 'normal', color: COLORS.slate500 },
  kpiValue: { size: 16, weight: 'bold', color: COLORS.stellarBlue },
  kpiLabel: { size: 7, weight: 'normal', color: COLORS.slate500 },
};

/**
 * Get content area dimensions after header/footer
 */
export function getContentArea(pageConfig = PAGE_CONFIG.a4) {
  const { width, height, margin, headerHeight, footerHeight } = pageConfig;
  return {
    x: margin,
    y: headerHeight + 5,
    width: width - (margin * 2),
    height: height - headerHeight - footerHeight - 10,
  };
}

/**
 * Get report configuration by ID
 */
export function getReportConfig(reportId) {
  switch (reportId) {
    case 'executive-summary':
      return EXECUTIVE_SUMMARY_CONFIG;
    case 'complete-report':
      return COMPLETE_REPORT_CONFIG;
    case 'customer-health':
      return CUSTOMER_HEALTH_CONFIG;
    default:
      return EXECUTIVE_SUMMARY_CONFIG;
  }
}

export default {
  COLORS,
  SEGMENT_COLORS,
  RISK_COLORS,
  IMPACT_COLORS,
  PAGE_CONFIG,
  TYPOGRAPHY,
  EXECUTIVE_SUMMARY_CONFIG,
  COMPLETE_REPORT_CONFIG,
  CUSTOMER_HEALTH_CONFIG,
  getContentArea,
  getReportConfig,
};
