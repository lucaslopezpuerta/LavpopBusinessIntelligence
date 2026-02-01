// pdfSectionBuilders.js v1.0 - Modular PDF Section Renderers
// Professional visualizations for business reports
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - Hero section with logo and health gauge
//   - KPI grid with colored borders
//   - Narrative sections with accent bars
//   - Insight/action cards with impact badges
//   - Alert boxes with severity styling
//   - Mini gauge (arc) visualizations
//   - Enhanced donut chart
//   - Sparkline trend charts

import { COLORS, SEGMENT_COLORS, IMPACT_COLORS } from './reportConfigs';

/**
 * Logo base64 - will be loaded dynamically
 * Using color logo from src/assets
 */
let logoBase64 = null;

/**
 * Load and cache logo as base64
 * @returns {Promise<string|null>} Base64 string or null
 */
export async function loadLogo() {
  if (logoBase64) return logoBase64;

  try {
    // Try to load from the assets path
    const response = await fetch('/src/assets/Logo Files/png/Color logo - no background.png');
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          logoBase64 = reader.result;
          resolve(logoBase64);
        };
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    console.warn('Could not load logo for PDF export:', e);
  }

  return null;
}

/**
 * Draw branded header bar
 * @param {jsPDF} doc - jsPDF instance
 * @param {string} title - Report title
 * @param {number} pageWidth - Page width in mm
 * @param {number} margin - Page margin in mm
 */
export function drawHeader(doc, title, pageWidth, margin) {
  // Gradient header bar (stellarBlue)
  doc.setFillColor(...COLORS.stellarBlue);
  doc.rect(0, 0, pageWidth, 20, 'F');

  // Accent line (stellarCyan)
  doc.setFillColor(...COLORS.stellarCyan);
  doc.rect(0, 20, pageWidth, 2, 'F');

  // Brand name
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('BILAVNOVA', margin, 9);

  // Subtitle
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 240);
  doc.text('Business Intelligence', margin, 15);

  // Report title (centered)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text(title, pageWidth / 2, 12, { align: 'center' });

  // Date (right)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 240);
  const now = new Date();
  doc.text(now.toLocaleDateString('pt-BR'), pageWidth - margin, 9, { align: 'right' });
  doc.text(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), pageWidth - margin, 15, { align: 'right' });
}

/**
 * Draw footer with page numbers
 */
export function drawFooter(doc, pageNum, totalPages, pageWidth, pageHeight, margin) {
  const y = pageHeight - 10;

  doc.setDrawColor(...COLORS.slate300);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 4, pageWidth - margin, y - 4);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate500);
  doc.text('Bilavnova Business Intelligence', margin, y);
  doc.text(`${pageNum}/${totalPages}`, pageWidth / 2, y, { align: 'center' });
  doc.text('bilavnova.com', pageWidth - margin, y, { align: 'right' });
}

/**
 * Draw hero section with health gauge
 * @param {jsPDF} doc
 * @param {Object} config - { title, subtitle, healthScore, healthLabel }
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Content width
 * @param {number} [height=50] - Section height
 * @returns {number} Next Y position
 */
export async function drawHeroSection(doc, config, x, y, width, height = 50) {
  const { title, subtitle, healthScore, healthLabel } = config;

  // Background card
  doc.setFillColor(...COLORS.slate100);
  doc.roundedRect(x, y, width, height, 3, 3, 'F');

  // Health gauge in center
  if (healthScore !== null && healthScore !== undefined) {
    const gaugeX = x + width / 2;
    const gaugeY = y + 25;
    const gaugeRadius = 18;

    drawMiniGauge(doc, healthScore, healthLabel || 'Saúde do Negócio', gaugeX - gaugeRadius, gaugeY - gaugeRadius, gaugeRadius * 2);
  }

  // Title below gauge
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.slate900);
  doc.text(title || 'Resumo Executivo', x + width / 2, y + height - 8, { align: 'center' });

  if (subtitle) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.slate500);
    doc.text(subtitle, x + width / 2, y + height - 3, { align: 'center' });
  }

  return y + height + 5;
}

/**
 * Draw KPI grid (4 cards in a row)
 * @param {jsPDF} doc
 * @param {Array} kpis - Array of { label, value, trend, trendLabel, color }
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Content width
 * @returns {number} Next Y position
 */
export function drawKPIGrid(doc, kpis, x, y, width) {
  const cardWidth = (width - 15) / 4;
  const cardHeight = 22;
  const gap = 5;

  kpis.slice(0, 4).forEach((kpi, i) => {
    const cardX = x + (i * (cardWidth + gap));

    // Card background
    doc.setFillColor(...COLORS.slate100);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, 'F');

    // Colored left border
    const color = kpi.color || COLORS.stellarBlue;
    doc.setFillColor(...color);
    doc.rect(cardX, y, 2, cardHeight, 'F');

    // Label
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slate500);
    doc.text(kpi.label, cardX + 6, y + 7);

    // Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(String(kpi.value), cardX + 6, y + 17);
    doc.setFont('helvetica', 'normal');

    // Trend indicator (if present)
    if (kpi.trend !== undefined && kpi.trend !== null) {
      const trendColor = kpi.trend >= 0 ? COLORS.cosmicGreen : COLORS.cosmicRose;
      const trendText = `${kpi.trend >= 0 ? '↑' : '↓'} ${Math.abs(kpi.trend).toFixed(1)}%`;
      doc.setFontSize(6);
      doc.setTextColor(...trendColor);
      doc.text(trendText, cardX + cardWidth - 4, y + 17, { align: 'right' });
    }
  });

  return y + cardHeight + 5;
}

/**
 * Draw narrative section with accent bar
 * @param {jsPDF} doc
 * @param {Object} config - { title, content, accentColor }
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Content width
 * @returns {number} Next Y position
 */
export function drawNarrativeSection(doc, config, x, y, width) {
  const { title, content, accentColor = COLORS.stellarBlue } = config;
  const text = content;

  // Accent bar
  doc.setFillColor(...accentColor);
  doc.rect(x, y, 2, 8, 'F');

  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.slate900);
  doc.text(title, x + 6, y + 6);

  // Text content
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate700);

  // Word wrap text
  const maxWidth = width - 10;
  const lines = doc.splitTextToSize(text, maxWidth);
  const lineHeight = 4.5;

  let textY = y + 14;
  lines.slice(0, 6).forEach(line => {
    doc.text(line, x + 6, textY);
    textY += lineHeight;
  });

  return textY + 5;
}

/**
 * Draw insight/action cards
 * @param {jsPDF} doc
 * @param {Array} actions - Array of { title, description, impact, effort }
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Content width
 * @returns {number} Next Y position
 */
export function drawInsightCards(doc, actions, x, y, width) {
  const cardHeight = 25;
  const gap = 4;
  let currentY = y;

  actions.slice(0, 3).forEach((action, i) => {
    // Card background
    doc.setFillColor(...COLORS.slate100);
    doc.roundedRect(x, currentY, width, cardHeight, 2, 2, 'F');

    // Icon/number
    doc.setFillColor(...COLORS.stellarCyan);
    doc.circle(x + 8, currentY + cardHeight / 2, 4, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(String(i + 1), x + 8, currentY + cardHeight / 2 + 1, { align: 'center' });

    // Title
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.slate900);
    doc.text(action.title, x + 16, currentY + 8);

    // Description
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.slate700);
    const descLines = doc.splitTextToSize(action.description, width - 60);
    doc.text(descLines[0], x + 16, currentY + 14);
    if (descLines[1]) {
      doc.text(descLines[1].substring(0, 60) + (descLines[1].length > 60 ? '...' : ''), x + 16, currentY + 19);
    }

    // Impact/Effort badges
    if (action.impact) {
      const badgeX = x + width - 35;
      const impactColor = IMPACT_COLORS[action.impact] || COLORS.slate500;

      doc.setFillColor(...impactColor);
      doc.roundedRect(badgeX, currentY + 4, 15, 7, 1, 1, 'F');
      doc.setFontSize(5);
      doc.setTextColor(...COLORS.white);
      doc.text(action.impact === 'high' ? 'Alto' : action.impact === 'medium' ? 'Médio' : 'Baixo', badgeX + 7.5, currentY + 8.5, { align: 'center' });
    }

    if (action.effort) {
      const badgeX = x + width - 18;
      const effortColor = action.effort === 'low' ? COLORS.cosmicGreen : action.effort === 'medium' ? COLORS.cosmicAmber : COLORS.cosmicRose;

      doc.setFillColor(...effortColor);
      doc.roundedRect(badgeX, currentY + 4, 15, 7, 1, 1, 'F');
      doc.setFontSize(5);
      doc.setTextColor(...COLORS.white);
      doc.text(action.effort === 'low' ? 'Fácil' : action.effort === 'medium' ? 'Médio' : 'Difícil', badgeX + 7.5, currentY + 8.5, { align: 'center' });
    }

    currentY += cardHeight + gap;
  });

  return currentY;
}

/**
 * Draw alert section
 * @param {jsPDF} doc
 * @param {Array} alerts - Array of { title, message, severity }
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Content width
 * @returns {number} Next Y position
 */
export function drawAlertSection(doc, alerts, x, y, width) {
  const alertHeight = 18;
  const gap = 3;
  let currentY = y;

  alerts.slice(0, 2).forEach(alert => {
    // Severity color
    let bgColor, borderColor;
    switch (alert.severity) {
      case 'critical':
        bgColor = [254, 226, 226]; // red-100
        borderColor = COLORS.cosmicRose;
        break;
      case 'warning':
        bgColor = [254, 243, 199]; // amber-100
        borderColor = COLORS.cosmicAmber;
        break;
      default:
        bgColor = [219, 234, 254]; // blue-100
        borderColor = COLORS.stellarCyan;
    }

    // Alert box
    doc.setFillColor(...bgColor);
    doc.roundedRect(x, currentY, width, alertHeight, 2, 2, 'F');

    // Left border
    doc.setFillColor(...borderColor);
    doc.rect(x, currentY, 2, alertHeight, 'F');

    // Title
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...borderColor);
    doc.text(alert.title, x + 6, currentY + 6);

    // Message
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.slate700);
    const msgLines = doc.splitTextToSize(alert.message, width - 12);
    doc.text(msgLines[0], x + 6, currentY + 12);
    if (msgLines[1]) {
      doc.text(msgLines[1].substring(0, 80), x + 6, currentY + 16);
    }

    currentY += alertHeight + gap;
  });

  return currentY;
}

/**
 * Draw mini arc gauge
 * @param {jsPDF} doc
 * @param {number} value - Gauge value (0-10 by default)
 * @param {string} label - Label text below gauge
 * @param {number} x - X position (left edge of gauge area)
 * @param {number} y - Y position (top edge of gauge area)
 * @param {number} size - Width/height of gauge area
 * @param {number} [maxValue=10] - Maximum value
 */
export function drawMiniGauge(doc, value, label, x, y, size, maxValue = 10) {
  const radius = size / 2;
  const centerX = x + radius;
  const centerY = y + radius;

  // Calculate angle (180 degrees = full gauge)
  const percentage = Math.min(value / maxValue, 1);
  const startAngle = Math.PI;
  const endAngle = Math.PI + (Math.PI * percentage);

  // Background arc (gray)
  doc.setDrawColor(...COLORS.slate300);
  doc.setLineWidth(3);
  drawArc(doc, centerX, centerY, radius * 0.8, Math.PI, 2 * Math.PI);

  // Value arc (colored by score)
  let arcColor;
  if (percentage >= 0.7) {
    arcColor = COLORS.cosmicGreen;
  } else if (percentage >= 0.5) {
    arcColor = COLORS.cosmicAmber;
  } else {
    arcColor = COLORS.cosmicRose;
  }

  doc.setDrawColor(...arcColor);
  doc.setLineWidth(3);
  drawArc(doc, centerX, centerY, radius * 0.8, startAngle, endAngle);

  // Center value
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...arcColor);
  doc.text(value.toFixed(1), centerX, centerY + 2, { align: 'center' });

  // Label below
  if (label) {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.slate500);
    doc.text(label, centerX, centerY + radius * 0.8 + 5, { align: 'center' });
  }
}

/**
 * Draw arc helper (approximated with line segments)
 */
function drawArc(doc, cx, cy, radius, startAngle, endAngle, segments = 30) {
  const angleStep = (endAngle - startAngle) / segments;

  for (let i = 0; i < segments; i++) {
    const a1 = startAngle + (i * angleStep);
    const a2 = startAngle + ((i + 1) * angleStep);

    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);
    const x2 = cx + radius * Math.cos(a2);
    const y2 = cy + radius * Math.sin(a2);

    doc.line(x1, y1, x2, y2);
  }
}

/**
 * Draw enhanced donut chart with legend
 * @param {jsPDF} doc
 * @param {Array} data - Array of { segment, count }
 * @param {number} centerX - Center X position
 * @param {number} centerY - Center Y position
 * @param {number} radius - Outer radius
 * @param {string} labelKey - Key for segment label
 * @param {string} valueKey - Key for segment value
 * @param {boolean} [showLegend=true] - Whether to show legend
 * @returns {number} Bottom Y position
 */
export function drawEnhancedDonut(doc, data, centerX, centerY, radius, labelKey = 'segment', valueKey = 'count', showLegend = true) {
  const x = centerX;
  const y = centerY;

  const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  if (total === 0) return y + radius * 2 + 10;

  const innerRadius = radius * 0.55;
  let startAngle = -Math.PI / 2;

  // Draw segments
  data.forEach((item) => {
    const value = item[valueKey] || 0;
    if (value === 0) return;

    const sliceAngle = (value / total) * 2 * Math.PI;
    const color = SEGMENT_COLORS[item[labelKey]] || COLORS.slate500;
    doc.setFillColor(...color);

    // Draw arc segments as triangles
    const steps = Math.max(10, Math.ceil(sliceAngle * 15));
    const stepAngle = sliceAngle / steps;

    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (i * stepAngle);
      const a2 = startAngle + ((i + 1) * stepAngle);

      const points = [
        [x + innerRadius * Math.cos(a1), y + innerRadius * Math.sin(a1)],
        [x + radius * Math.cos(a1), y + radius * Math.sin(a1)],
        [x + radius * Math.cos(a2), y + radius * Math.sin(a2)],
        [x + innerRadius * Math.cos(a2), y + innerRadius * Math.sin(a2)],
      ];

      doc.triangle(points[0][0], points[0][1], points[1][0], points[1][1], points[2][0], points[2][1], 'F');
      doc.triangle(points[0][0], points[0][1], points[2][0], points[2][1], points[3][0], points[3][1], 'F');
    }

    startAngle += sliceAngle;
  });

  // Center circle (white)
  doc.setFillColor(...COLORS.white);
  for (let i = 0; i < 20; i++) {
    const a1 = (i / 20) * 2 * Math.PI;
    const a2 = ((i + 1) / 20) * 2 * Math.PI;
    doc.triangle(
      x, y,
      x + innerRadius * 0.95 * Math.cos(a1), y + innerRadius * 0.95 * Math.sin(a1),
      x + innerRadius * 0.95 * Math.cos(a2), y + innerRadius * 0.95 * Math.sin(a2),
      'F'
    );
  }

  // Center text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.stellarBlue);
  doc.text(String(total), x, y + 2, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  doc.text('clientes', x, y + 7, { align: 'center' });

  // Legend (to the right)
  if (showLegend) {
    const legendX = x + radius + 12;
    let legendY = y - radius + 5;

    data.forEach((item) => {
      const value = item[valueKey] || 0;
      if (value === 0) return;

      const color = SEGMENT_COLORS[item[labelKey]] || COLORS.slate500;
      const pct = ((value / total) * 100).toFixed(0);

      // Color dot
      doc.setFillColor(...color);
      doc.circle(legendX + 2, legendY - 1.5, 2, 'F');

      // Label and value
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.slate700);
      doc.text(item[labelKey], legendX + 7, legendY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...color);
      doc.text(`${value} (${pct}%)`, legendX + 7, legendY + 5);
      doc.setFont('helvetica', 'normal');

      legendY += 13;
    });
  }

  return y + radius + 10;
}

/**
 * Draw sparkline trend chart
 * @param {jsPDF} doc
 * @param {Array} data - Array of values or { date, value }
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Chart width
 * @param {number} height - Chart height
 * @param {Array} [color] - RGB color array
 */
export function drawSparklineChart(doc, data, x, y, width, height, color = COLORS.stellarBlue) {

  if (!data || data.length < 2) return;

  const values = data.map(d => typeof d === 'object' ? d.value || d.revenue || 0 : d);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;
  const stepX = width / (values.length - 1);

  // Draw line
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);

  for (let i = 0; i < values.length - 1; i++) {
    const x1 = x + (i * stepX);
    const y1 = y + height - ((values[i] - minVal) / range * height);
    const x2 = x + ((i + 1) * stepX);
    const y2 = y + height - ((values[i + 1] - minVal) / range * height);
    doc.line(x1, y1, x2, y2);
  }

  // End point dot
  const lastX = x + width;
  const lastY = y + height - ((values[values.length - 1] - minVal) / range * height);
  doc.setFillColor(...color);
  doc.circle(lastX, lastY, 1.5, 'F');
}

/**
 * Draw horizontal bar chart
 * @param {jsPDF} doc
 * @param {Array} data - Array of items
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Chart width
 * @param {string} labelKey - Key for item label
 * @param {string} valueKey - Key for item value
 * @param {number} [labelWidth=50] - Width reserved for labels
 * @returns {number} Next Y position
 */
export function drawBarChart(doc, data, x, y, width, labelKey = 'label', valueKey = 'value', labelWidth = 50) {
  const maxValue = Math.max(...data.map(d => d[valueKey] || 0), 1);
  const barHeight = 6;
  const gap = 4;
  const barAreaWidth = width - labelWidth - 25;
  let currentY = y;

  data.forEach((item) => {
    const value = item[valueKey] || 0;
    const barWidth = Math.max((value / maxValue) * barAreaWidth, 2);
    const label = item[labelKey] || '';
    const color = item.color || SEGMENT_COLORS[label] || COLORS.stellarBlue;

    // Label
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slate700);
    doc.text(String(label).substring(0, 18), x, currentY + barHeight - 1);

    // Bar background
    doc.setFillColor(...COLORS.slate100);
    doc.roundedRect(x + labelWidth, currentY, barAreaWidth, barHeight, 1, 1, 'F');

    // Bar fill
    doc.setFillColor(...color);
    doc.roundedRect(x + labelWidth, currentY, barWidth, barHeight, 1, 1, 'F');

    // Value
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(String(value), x + labelWidth + barAreaWidth + 3, currentY + barHeight - 1);
    doc.setFont('helvetica', 'normal');

    currentY += barHeight + gap;
  });

  return currentY + 5;
}

/**
 * Draw section title with accent line
 * @param {jsPDF} doc
 * @param {string} title - Section title
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} [width] - Optional width for accent line (unused if not provided)
 * @returns {number} Next Y position
 */
export function drawSectionTitle(doc, title, x, y, width) {
  // Accent line (optional)
  if (width) {
    doc.setFillColor(...COLORS.stellarBlue);
    doc.rect(x, y, width, 0.5, 'F');
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.slate900);
  doc.text(title, x, y + 6);

  return y + 10;
}

export default {
  loadLogo,
  drawHeader,
  drawFooter,
  drawHeroSection,
  drawKPIGrid,
  drawNarrativeSection,
  drawInsightCards,
  drawAlertSection,
  drawMiniGauge,
  drawEnhancedDonut,
  drawSparklineChart,
  drawBarChart,
  drawSectionTitle,
};
