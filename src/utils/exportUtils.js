// exportUtils.js v3.0 - NARRATIVE-DRIVEN PDF EXPORTS
// Professional business reports with data storytelling
// Completely rewritten for Design System v6.3
//
// CHANGELOG:
// v3.0 (2026-01-31): Complete rewrite
//   - Removed all legacy code
//   - Uses modular section builders from pdfSectionBuilders.js
//   - Uses insight generation from pdfInsightGenerator.js
//   - Design System v6.3 colors throughout
//   - Three report types: Executive Summary, Complete Report, Customer Health

import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { COLORS, SEGMENT_COLORS, PAGE_CONFIG } from './reportConfigs';
import {
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
} from './pdfSectionBuilders';
import { generatePDFInsights } from './pdfInsightGenerator';
import { formatCurrency } from './numberUtils';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Download file helper
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format value for CSV export
 */
function formatValue(value, type) {
  if (value === null || value === undefined) return '';
  switch (type) {
    case 'currency':
      return typeof value === 'number'
        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : value;
    case 'percent':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value;
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
    default:
      return value;
  }
}

/**
 * Parse sale value from Brazilian format
 */
function parseSaleValue(value) {
  return parseFloat(String(value || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}

/**
 * Get daily revenue trend data for sparkline charts
 */
function getDailyRevenueTrend(sales, days = 30) {
  const dailyMap = {};
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

  sales.forEach(s => {
    if (!s.Data_Hora) return;
    try {
      const parts = s.Data_Hora.split(' ')[0].split('/');
      const saleDate = new Date(parts[2], parts[1] - 1, parts[0]);
      if (saleDate.getTime() < cutoff) return;

      const dateKey = s.Data_Hora.split(' ')[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + parseSaleValue(s.Valor_Venda);
    } catch {
      // Skip invalid dates
    }
  });

  return Object.entries(dailyMap)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => {
      const [da, ma, ya] = a.date.split('/');
      const [db, mb, yb] = b.date.split('/');
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });
}

/**
 * Calculate segment data from RFM array
 */
function calculateSegmentData(rfm) {
  const segmentData = {};
  rfm.forEach(c => {
    const seg = c.segment || 'Desconhecido';
    if (!segmentData[seg]) segmentData[seg] = { count: 0, totalValue: 0 };
    segmentData[seg].count++;
    segmentData[seg].totalValue += parseSaleValue(c.Monetary);
  });

  const segmentOrder = ['VIP', 'Frequente', 'Promissor', 'Novato', 'Esfriando', 'Inativo'];
  return segmentOrder
    .filter(seg => segmentData[seg])
    .map(seg => ({
      segment: seg,
      count: segmentData[seg].count,
      totalValue: segmentData[seg].totalValue,
    }));
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Export data to CSV file
 */
export function exportToCSV(data, filename, options = {}) {
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  const { columns } = options;
  let exportData = data;
  let headers = null;

  if (columns && columns.length > 0) {
    headers = columns.map(col => col.label || col.key);
    exportData = data.map(row => {
      const newRow = {};
      columns.forEach(col => {
        newRow[col.label || col.key] = formatValue(row[col.key], col.type);
      });
      return newRow;
    });
  }

  const csv = Papa.unparse(exportData, { header: true, columns: headers });
  downloadFile('\uFEFF' + csv, `${filename}.csv`, 'text/csv;charset=utf-8');
}

// ============================================================================
// SIMPLE PDF EXPORT (for tables)
// ============================================================================

/**
 * Export data to simple PDF with table
 */
export function exportToPDF(options) {
  const {
    title = 'Relatório',
    data,
    columns,
    filename = 'relatorio',
    orientation = 'portrait',
    summary,
  } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = PAGE_CONFIG.a4.margin;
  let yPos = 30;

  // Header
  drawHeader(doc, title, pageWidth, margin);

  // Summary cards
  if (summary?.items?.length > 0) {
    const cardWidth = (pageWidth - (margin * 2) - ((summary.items.length - 1) * 5)) / summary.items.length;

    summary.items.forEach((item, i) => {
      const cardX = margin + (i * (cardWidth + 5));

      doc.setFillColor(...COLORS.slate100);
      doc.roundedRect(cardX, yPos, cardWidth, 16, 2, 2, 'F');

      doc.setFontSize(7);
      doc.setTextColor(...COLORS.slate500);
      doc.text(item.label, cardX + 4, yPos + 6);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.stellarBlue);
      doc.text(String(item.value), cardX + 4, yPos + 13);
      doc.setFont('helvetica', 'normal');
    });

    yPos += 22;
  }

  // Data table
  if (data?.length > 0 && columns?.length > 0) {
    const tableData = data.map(row => {
      const newRow = {};
      columns.forEach(col => {
        newRow[col.key] = formatValue(row[col.key], col.type);
      });
      return newRow;
    });

    autoTable(doc, {
      startY: yPos,
      head: [columns.map(col => col.label || col.key)],
      body: tableData.map(row => columns.map(col => row[col.key])),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: COLORS.slate300,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COLORS.stellarBlue,
        textColor: COLORS.white,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 8,
      },
      bodyStyles: {
        textColor: COLORS.slate700,
      },
      alternateRowStyles: {
        fillColor: COLORS.slate100,
      },
      didDrawPage: (hookData) => {
        if (hookData.pageNumber > 1) {
          drawHeader(doc, title, pageWidth, margin);
        }
      },
    });
  }

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages, pageWidth, pageHeight, margin);
  }

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// EXECUTIVE SUMMARY (1 page)
// ============================================================================

/**
 * Export Executive Summary - Single-page board-ready PDF with narratives
 */
export async function exportExecutiveSummary(data, filename = 'bilavnova-resumo-executivo') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = PAGE_CONFIG.a4.margin;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Extract data
  const rfm = data?.rfm || [];
  const sales = data?.sales || [];
  const metrics = data?.metrics || null;
  const profitability = data?.profitability || null;
  const customerMetrics = data?.customerMetrics || null;
  const retentionMetrics = data?.retentionMetrics || null;
  const serviceBreakdown = data?.serviceBreakdown || null;
  const growthTrends = data?.growthTrends || null;
  const currentMonth = data?.currentMonth || null;
  const previousMonth = data?.previousMonth || null;

  // Generate insights
  const insights = generatePDFInsights({
    metrics,
    profitability,
    customerMetrics,
    retentionMetrics,
    serviceBreakdown,
    growthTrends,
    currentMonth,
    previousMonth,
  });

  // Calculate health score
  let healthScore = 6.5;
  if (insights.priorityMatrix?.overallScore) {
    healthScore = insights.priorityMatrix.overallScore;
  } else if (customerMetrics?.healthRate) {
    healthScore = customerMetrics.healthRate / 10;
  }

  // ========== HERO SECTION ==========
  yPos = await drawHeroSection(doc, {
    title: 'Resumo Executivo',
    subtitle: 'Business Intelligence',
    healthScore,
    healthLabel: 'Saúde do Negócio',
  }, margin, yPos, contentWidth);

  // ========== KPI GRID ==========
  let totalRevenue = 0;
  sales.forEach(s => {
    totalRevenue += parseSaleValue(s.Valor_Venda);
  });

  const activeCount = customerMetrics?.activeCount || rfm.filter(c => c.segment !== 'Inativo').length;
  const totalServices = metrics?.weekly?.totalServices || sales.length;
  const wowChange = metrics?.weekOverWeek?.netRevenue ?? null;

  const kpiItems = [
    {
      label: 'Receita MTD',
      value: formatCurrency(metrics?.monthToDate?.grossRevenue || totalRevenue),
      trend: metrics?.monthToDate?.yearOverYearChange ?? null,
    },
    {
      label: 'Var. Semanal',
      value: wowChange !== null ? `${wowChange >= 0 ? '+' : ''}${wowChange.toFixed(1)}%` : '—',
      trend: wowChange,
    },
    {
      label: 'Clientes Ativos',
      value: activeCount.toLocaleString('pt-BR'),
      trend: null,
    },
    {
      label: 'Serviços',
      value: totalServices.toLocaleString('pt-BR'),
      trend: null,
    },
  ];

  yPos = drawKPIGrid(doc, kpiItems, margin, yPos + 5, contentWidth);

  // ========== PRIORITY MATRIX GAUGES ==========
  if (insights.priorityMatrix?.dimensions) {
    yPos += 8;
    drawSectionTitle(doc, 'Matriz de Prioridades', margin, yPos);
    yPos += 8;

    const gaugeWidth = (contentWidth - 15) / 4;
    const dims = insights.priorityMatrix.dimensions;
    const gauges = [
      { label: 'Rentabilidade', score: dims.profitability?.score || 0 },
      { label: 'Crescimento', score: dims.growth?.score || 0 },
      { label: 'Break-even', score: dims.breakEven?.score || 0 },
      { label: 'Momentum', score: dims.momentum?.score || 0 },
    ];

    gauges.forEach((g, i) => {
      drawMiniGauge(doc, g.score, g.label, margin + (i * (gaugeWidth + 5)), yPos, gaugeWidth - 5);
    });

    yPos += 30;
  }

  // ========== NARRATIVE ==========
  if (insights.revenueNarrative || insights.customerNarrative) {
    yPos += 5;
    const narrative = [insights.revenueNarrative, insights.customerNarrative].filter(Boolean).join(' ');
    yPos = drawNarrativeSection(doc, { title: 'Análise do Período', content: narrative }, margin, yPos, contentWidth);
  }

  // ========== ACTIONS ==========
  if (insights.actions?.length > 0) {
    yPos += 5;
    yPos = drawInsightCards(doc, insights.actions.slice(0, 3), margin, yPos, contentWidth);
  }

  // ========== ALERTS ==========
  if (insights.alerts?.length > 0) {
    yPos += 5;
    yPos = drawAlertSection(doc, insights.alerts.slice(0, 2), margin, yPos, contentWidth);
  }

  // ========== SEGMENT DONUT (if space) ==========
  if (yPos < pageHeight - 80 && rfm.length > 0) {
    yPos += 8;
    drawSectionTitle(doc, 'Distribuição de Clientes', margin, yPos);
    yPos += 5;

    const segmentArray = calculateSegmentData(rfm);
    if (segmentArray.length > 0) {
      drawEnhancedDonut(doc, segmentArray, margin + 35, yPos + 22, 18, 'segment', 'count');
    }
  }

  // Footer
  drawFooter(doc, 1, 1, pageWidth, pageHeight, margin);

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// COMPLETE REPORT (5 pages)
// ============================================================================

/**
 * Export Complete Report - Multi-page comprehensive PDF with narratives
 */
export async function exportCompleteReport(data, filename = 'bilavnova-relatorio-completo') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = PAGE_CONFIG.a4.margin;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Extract data
  const customers = data?.customers || [];
  const rfm = data?.rfm || [];
  const sales = data?.sales || [];
  const metrics = data?.metrics || null;
  const profitability = data?.profitability || null;
  const customerMetrics = data?.customerMetrics || null;
  const retentionMetrics = data?.retentionMetrics || null;
  const serviceBreakdown = data?.serviceBreakdown || null;
  const growthTrends = data?.growthTrends || null;
  const currentMonth = data?.currentMonth || null;
  const previousMonth = data?.previousMonth || null;

  // Generate insights
  const insights = generatePDFInsights({
    metrics,
    profitability,
    customerMetrics,
    retentionMetrics,
    serviceBreakdown,
    growthTrends,
    currentMonth,
    previousMonth,
  });

  // Calculate totals
  let totalRevenue = 0;
  sales.forEach(s => {
    totalRevenue += parseSaleValue(s.Valor_Venda);
  });

  const segmentArray = calculateSegmentData(rfm);

  // Health score
  let healthScore = 6.5;
  if (insights.priorityMatrix?.overallScore) {
    healthScore = insights.priorityMatrix.overallScore;
  } else if (customerMetrics?.healthRate) {
    healthScore = customerMetrics.healthRate / 10;
  }

  // ==================== PAGE 1: EXECUTIVE OVERVIEW ====================
  yPos = await drawHeroSection(doc, {
    title: 'Relatório Completo',
    subtitle: 'Business Intelligence',
    healthScore,
    healthLabel: 'Saúde do Negócio',
  }, margin, yPos, contentWidth);

  const kpiItems = [
    { label: 'Clientes', value: customers.length.toLocaleString('pt-BR'), trend: null },
    { label: 'Transações', value: sales.length.toLocaleString('pt-BR'), trend: null },
    { label: 'Receita Total', value: formatCurrency(totalRevenue), trend: null },
    { label: 'Segmentos RFM', value: '6', trend: null },
  ];

  yPos = drawKPIGrid(doc, kpiItems, margin, yPos + 5, contentWidth);

  if (insights.revenueNarrative) {
    yPos += 8;
    yPos = drawNarrativeSection(doc, { title: 'Visão Geral', content: insights.revenueNarrative }, margin, yPos, contentWidth);
  }

  if (insights.alerts?.length > 0) {
    yPos += 5;
    yPos = drawAlertSection(doc, insights.alerts.slice(0, 3), margin, yPos, contentWidth);
  }

  drawFooter(doc, 1, 5, pageWidth, pageHeight, margin);

  // ==================== PAGE 2: REVENUE ANALYSIS ====================
  doc.addPage();
  drawHeader(doc, 'Análise de Receita', pageWidth, margin);
  yPos = 35;

  const trendData = getDailyRevenueTrend(sales, 30);
  if (trendData.length >= 2) {
    drawSectionTitle(doc, 'Tendência de Receita (30 dias)', margin, yPos);
    yPos += 5;
    drawSparklineChart(doc, trendData.map(d => d.revenue), margin, yPos, contentWidth, 35, COLORS.stellarBlue);
    yPos += 45;
  }

  if (serviceBreakdown) {
    drawSectionTitle(doc, 'Receita por Serviço', margin, yPos);
    yPos += 8;

    const serviceData = [
      { label: 'Lavagem', value: serviceBreakdown.wash?.revenue || 0 },
      { label: 'Secagem', value: serviceBreakdown.dry?.revenue || 0 },
    ];

    drawBarChart(doc, serviceData, margin, yPos, contentWidth, 'label', 'value');
    yPos += 40;
  }

  if (insights.operationsNarrative) {
    yPos += 5;
    yPos = drawNarrativeSection(doc, { title: 'Análise Operacional', content: insights.operationsNarrative }, margin, yPos, contentWidth);
  }

  drawFooter(doc, 2, 5, pageWidth, pageHeight, margin);

  // ==================== PAGE 3: CUSTOMER INTELLIGENCE ====================
  doc.addPage();
  drawHeader(doc, 'Inteligência de Clientes', pageWidth, margin);
  yPos = 35;

  if (segmentArray.length > 0) {
    drawSectionTitle(doc, 'Distribuição RFM', margin, yPos);
    yPos += 5;
    drawEnhancedDonut(doc, segmentArray, margin + 40, yPos + 30, 28, 'segment', 'count');
    yPos += 75;
  }

  const activeCount = customerMetrics?.activeCount || rfm.filter(c => c.segment !== 'Inativo').length;
  const atRiskCount = customerMetrics?.needsAttentionCount || rfm.filter(c => ['Esfriando', 'Inativo'].includes(c.segment)).length;
  const healthRate = customerMetrics?.healthRate || ((activeCount / (rfm.length || 1)) * 100);

  const healthKpis = [
    { label: 'Clientes Ativos', value: activeCount.toLocaleString('pt-BR'), trend: null },
    { label: 'Em Risco', value: atRiskCount.toLocaleString('pt-BR'), trend: null },
    { label: 'Taxa de Saúde', value: `${healthRate.toFixed(0)}%`, trend: null },
  ];

  yPos = drawKPIGrid(doc, healthKpis, margin, yPos, contentWidth);

  if (insights.customerNarrative) {
    yPos += 8;
    yPos = drawNarrativeSection(doc, { title: 'Saúde da Base', content: insights.customerNarrative }, margin, yPos, contentWidth);
  }

  drawFooter(doc, 3, 5, pageWidth, pageHeight, margin);

  // ==================== PAGE 4: AT-RISK CUSTOMERS ====================
  doc.addPage();
  drawHeader(doc, 'Clientes em Risco', pageWidth, margin);
  yPos = 35;

  const atRiskCustomers = rfm
    .filter(c => ['Esfriando', 'Inativo'].includes(c.segment))
    .slice(0, 25);

  if (atRiskCustomers.length > 0) {
    drawSectionTitle(doc, `${atRiskCustomers.length} Clientes Requerem Atenção`, margin, yPos);
    yPos += 8;

    const atRiskData = atRiskCustomers.map(c => [
      (c['client name'] || '').substring(0, 25),
      c['phone number'] || '',
      c.Recency || '—',
      c.segment,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Nome', 'Telefone', 'Dias s/ Visita', 'Segmento']],
      body: atRiskData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: COLORS.stellarBlue, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLORS.slate100 },
      columnStyles: { 3: { halign: 'center' } },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          const seg = hookData.cell.raw;
          if (seg === 'Inativo') hookData.cell.styles.textColor = COLORS.cosmicRose;
          else if (seg === 'Esfriando') hookData.cell.styles.textColor = COLORS.cosmicAmber;
        }
      },
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.slate500);
    doc.text('Nenhum cliente em risco identificado.', pageWidth / 2, yPos + 20, { align: 'center' });
  }

  drawFooter(doc, 4, 5, pageWidth, pageHeight, margin);

  // ==================== PAGE 5: RECOMMENDATIONS ====================
  doc.addPage();
  drawHeader(doc, 'Recomendações e Próximos Passos', pageWidth, margin);
  yPos = 35;

  if (insights.priorityMatrix?.dimensions) {
    drawSectionTitle(doc, 'Matriz de Prioridades', margin, yPos);
    yPos += 8;

    const gaugeWidth = (contentWidth - 15) / 4;
    const dims = insights.priorityMatrix.dimensions;
    const gauges = [
      { label: 'Rentabilidade', score: dims.profitability?.score || 0 },
      { label: 'Crescimento', score: dims.growth?.score || 0 },
      { label: 'Break-even', score: dims.breakEven?.score || 0 },
      { label: 'Momentum', score: dims.momentum?.score || 0 },
    ];

    gauges.forEach((g, i) => {
      drawMiniGauge(doc, g.score, g.label, margin + (i * (gaugeWidth + 5)), yPos, gaugeWidth - 5);
    });

    yPos += 35;
  }

  if (insights.actions?.length > 0) {
    drawSectionTitle(doc, 'Ações Prioritárias', margin, yPos);
    yPos += 5;
    yPos = drawInsightCards(doc, insights.actions.slice(0, 4), margin, yPos, contentWidth);
  }

  if (insights.headlines?.length > 0) {
    yPos += 10;
    drawSectionTitle(doc, 'Destaques do Período', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    insights.headlines.slice(0, 5).forEach((h) => {
      const color = h.type === 'positive' ? COLORS.cosmicGreen :
                    h.type === 'negative' ? COLORS.cosmicRose :
                    h.type === 'warning' ? COLORS.cosmicAmber : COLORS.slate700;
      doc.setTextColor(...color);
      doc.text(`• ${h.text}`, margin + 2, yPos);
      yPos += 6;
    });
  }

  drawFooter(doc, 5, 5, pageWidth, pageHeight, margin);

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// CUSTOMER HEALTH REPORT (2 pages)
// ============================================================================

/**
 * Export Customer Health Report - Customer-focused analysis
 */
export async function exportCustomerHealthReport(data, filename = 'bilavnova-saude-clientes') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = PAGE_CONFIG.a4.margin;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Extract data
  const rfm = data?.rfm || [];
  const customerMetrics = data?.customerMetrics || null;
  const retentionMetrics = data?.retentionMetrics || null;

  // Generate insights
  const insights = generatePDFInsights({ customerMetrics, retentionMetrics });

  // Calculate segment data
  const segmentArray = calculateSegmentData(rfm);

  // Health score
  const healthRate = customerMetrics?.healthRate || 50;
  const healthScore = healthRate / 10;

  // ==================== PAGE 1: OVERVIEW & SEGMENTS ====================
  yPos = await drawHeroSection(doc, {
    title: 'Saúde de Clientes',
    subtitle: 'Análise de Segmentos',
    healthScore,
    healthLabel: 'Saúde da Base',
  }, margin, yPos, contentWidth);

  if (segmentArray.length > 0) {
    yPos += 5;
    drawEnhancedDonut(doc, segmentArray, margin + 40, yPos + 30, 28, 'segment', 'count');
    yPos += 75;
  }

  // Segment table
  const total = rfm.length || 1;
  const tableData = segmentArray.map(s => [
    s.segment,
    s.count.toString(),
    `${((s.count / total) * 100).toFixed(1)}%`,
    formatCurrency(s.count > 0 ? s.totalValue / s.count : 0),
    formatCurrency(s.totalValue),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Segmento', 'Clientes', '% Total', 'Ticket Médio', 'Receita Total']],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: COLORS.stellarBlue, textColor: COLORS.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.slate100 },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  if (insights.customerNarrative) {
    yPos = drawNarrativeSection(doc, { title: 'Análise da Base', content: insights.customerNarrative }, margin, yPos, contentWidth);
  }

  drawFooter(doc, 1, 2, pageWidth, pageHeight, margin);

  // ==================== PAGE 2: AT-RISK & ACTIONS ====================
  doc.addPage();
  drawHeader(doc, 'Clientes em Risco e Ações', pageWidth, margin);
  yPos = 35;

  // Segment bar chart
  const barData = segmentArray.map(s => ({ label: s.segment, value: s.count }));
  if (barData.length > 0) {
    drawSectionTitle(doc, 'Distribuição por Segmento', margin, yPos);
    yPos += 8;
    drawBarChart(doc, barData, margin, yPos, contentWidth, 'label', 'value');
    yPos += 55;
  }

  // At-risk table
  const atRiskCustomers = rfm
    .filter(c => ['Esfriando', 'Inativo'].includes(c.segment))
    .slice(0, 15);

  if (atRiskCustomers.length > 0) {
    drawSectionTitle(doc, `Clientes em Risco (${atRiskCustomers.length})`, margin, yPos);
    yPos += 8;

    const atRiskData = atRiskCustomers.map(c => [
      (c['client name'] || '').substring(0, 20),
      c['phone number'] || '',
      c.Recency || '—',
      c.segment,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Nome', 'Telefone', 'Dias', 'Segmento']],
      body: atRiskData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: COLORS.stellarBlue, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLORS.slate100 },
      columnStyles: { 3: { halign: 'center' } },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          const seg = hookData.cell.raw;
          if (seg === 'Inativo') hookData.cell.styles.textColor = COLORS.cosmicRose;
          else if (seg === 'Esfriando') hookData.cell.styles.textColor = COLORS.cosmicAmber;
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Retention actions
  if (insights.actions?.length > 0) {
    const retentionActions = insights.actions
      .filter(a => /cliente|retenção|churn/i.test(a.title || ''))
      .slice(0, 3);

    if (retentionActions.length > 0) {
      yPos = drawInsightCards(doc, retentionActions, margin, yPos, contentWidth);
    }
  }

  drawFooter(doc, 2, 2, pageWidth, pageHeight, margin);

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  exportToCSV,
  exportToPDF,
  exportExecutiveSummary,
  exportCompleteReport,
  exportCustomerHealthReport,
};
