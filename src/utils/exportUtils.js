// exportUtils.js v1.4
// PDF export following Bilavnova Design System
//
// CHANGELOG:
// v1.4 (2025-12-17): Complete Report & Executive Summary
//   - Added exportCompleteReport() - Multi-page comprehensive report
//   - Added exportExecutiveSummary() - Single-page executive summary
//   - Auto-generated insights based on data analysis
//   - Revenue trend mini-charts
//   - Professional executive formatting
// v1.3 (2025-12-17): Design System compliance
//   - Brand colors (#1a5a8e, #10b981)
//   - Non-redundant layout (chart OR table, not both)
//   - Cleaner visual hierarchy
//   - Gradient header matching app design
// v1.2 (2025-12-17): Charts and branding
// v1.1 (2025-12-17): Fixed jspdf-autotable import
// v1.0 (2025-12-17): Initial implementation

import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Bilavnova Design System Colors (from Design System.md)
const COLORS = {
  // Primary brand
  lavpopBlue: [26, 90, 142],      // #1a5a8e
  lavpopGreen: [16, 185, 129],    // #10b981

  // Gradients (for visual appeal)
  blueGradientStart: [26, 90, 142],
  blueGradientEnd: [37, 99, 235],

  // Neutrals
  slate900: [15, 23, 42],
  slate700: [51, 65, 85],
  slate500: [100, 116, 139],
  slate300: [203, 213, 225],
  slate100: [241, 245, 249],
  white: [255, 255, 255],
};

// Segment colors (matching app RFM colors)
const SEGMENT_COLORS = {
  'VIP': [16, 185, 129],         // Green (lavpop-green)
  'Frequente': [59, 130, 246],   // Blue
  'Promissor': [168, 85, 247],   // Purple
  'Novato': [251, 146, 60],      // Orange
  'Esfriando': [251, 191, 36],   // Yellow/Amber
  'Inativo': [239, 68, 68],      // Red
};

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
 * Export to CSV
 */
export function exportToCSV(data, filename, options = {}) {
  if (!data || data.length === 0) throw new Error('Nenhum dado para exportar');

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

function formatValue(value, type) {
  if (value === null || value === undefined) return '';
  switch (type) {
    case 'currency':
      return typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value;
    case 'percent':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value;
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
    default:
      return value;
  }
}

/**
 * Draw Bilavnova branded header
 */
function drawHeader(doc, title, pageWidth, margin) {
  // Gradient header bar (simulated with two rects)
  doc.setFillColor(...COLORS.lavpopBlue);
  doc.rect(0, 0, pageWidth, 20, 'F');

  // Accent line
  doc.setFillColor(...COLORS.lavpopGreen);
  doc.rect(0, 20, pageWidth, 2, 'F');

  // Brand name
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('LAVPOP', margin, 9);

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
 * Draw footer
 */
function drawFooter(doc, pageNum, totalPages, pageWidth, pageHeight, margin) {
  const y = pageHeight - 10;

  doc.setDrawColor(...COLORS.slate300);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 4, pageWidth - margin, y - 4);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate500);
  doc.text('Nova Lopez Lavanderia Ltda.', margin, y);
  doc.text(`${pageNum}/${totalPages}`, pageWidth / 2, y, { align: 'center' });
  doc.text('lavpop.com.br', pageWidth - margin, y, { align: 'right' });
}

/**
 * Draw horizontal bar chart (for KPIs)
 */
function drawBarChart(doc, data, x, y, width, labelKey, valueKey) {
  const maxValue = Math.max(...data.map(d => parseInt(d[valueKey]) || 0), 1);
  const barHeight = 6;
  const gap = 4;
  const labelWidth = 50;
  const barAreaWidth = width - labelWidth - 25;

  data.forEach((item, i) => {
    const value = parseInt(item[valueKey]) || 0;
    const barWidth = Math.max((value / maxValue) * barAreaWidth, 2);
    const barY = y + (i * (barHeight + gap));

    // Label
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slate700);
    doc.text(String(item[labelKey]).substring(0, 18), x, barY + barHeight - 1);

    // Bar background
    doc.setFillColor(...COLORS.slate100);
    doc.roundedRect(x + labelWidth, barY, barAreaWidth, barHeight, 1, 1, 'F');

    // Bar fill (use segment color if available)
    const color = SEGMENT_COLORS[item[labelKey]] || COLORS.lavpopBlue;
    doc.setFillColor(...color);
    doc.roundedRect(x + labelWidth, barY, barWidth, barHeight, 1, 1, 'F');

    // Value
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(String(value), x + labelWidth + barAreaWidth + 3, barY + barHeight - 1);
    doc.setFont('helvetica', 'normal');
  });

  return y + (data.length * (barHeight + gap)) + 8;
}

/**
 * Draw donut/ring chart (for segments)
 */
function drawDonutChart(doc, data, centerX, centerY, outerRadius, labelKey, valueKey) {
  const total = data.reduce((sum, item) => sum + (parseInt(item[valueKey]) || 0), 0);
  if (total === 0) return centerY + outerRadius + 10;

  const innerRadius = outerRadius * 0.55;
  let startAngle = -Math.PI / 2;

  // Draw segments
  data.forEach((item) => {
    const value = parseInt(item[valueKey]) || 0;
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

      // Outer arc triangle
      const points = [
        [centerX + innerRadius * Math.cos(a1), centerY + innerRadius * Math.sin(a1)],
        [centerX + outerRadius * Math.cos(a1), centerY + outerRadius * Math.sin(a1)],
        [centerX + outerRadius * Math.cos(a2), centerY + outerRadius * Math.sin(a2)],
        [centerX + innerRadius * Math.cos(a2), centerY + innerRadius * Math.sin(a2)],
      ];

      // Draw as two triangles
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
      centerX, centerY,
      centerX + innerRadius * 0.95 * Math.cos(a1), centerY + innerRadius * 0.95 * Math.sin(a1),
      centerX + innerRadius * 0.95 * Math.cos(a2), centerY + innerRadius * 0.95 * Math.sin(a2),
      'F'
    );
  }

  // Center text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.lavpopBlue);
  doc.text(String(total), centerX, centerY + 2, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  doc.text('clientes', centerX, centerY + 7, { align: 'center' });

  // Legend (to the right)
  const legendX = centerX + outerRadius + 12;
  let legendY = centerY - outerRadius + 5;
  doc.setFontSize(8);

  data.forEach((item) => {
    const value = parseInt(item[valueKey]) || 0;
    if (value === 0) return;

    const color = SEGMENT_COLORS[item[labelKey]] || COLORS.slate500;
    const pct = ((value / total) * 100).toFixed(0);

    // Color dot
    doc.setFillColor(...color);
    doc.circle(legendX + 2, legendY - 1.5, 2, 'F');

    // Label and value
    doc.setTextColor(...COLORS.slate700);
    doc.text(`${item[labelKey]}`, legendX + 7, legendY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(`${value} (${pct}%)`, legendX + 7, legendY + 5);
    doc.setFont('helvetica', 'normal');

    legendY += 13;
  });

  return centerY + outerRadius + 10;
}

/**
 * Export to PDF with Design System styling
 */
export function exportToPDF(options) {
  const {
    title = 'Relatório',
    data,
    columns,
    filename = 'relatorio',
    orientation = 'portrait',
    summary,
    showChart = false,
    chartType = 'bar'
  } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 30;

  drawHeader(doc, title, pageWidth, margin);

  // Summary cards (if provided)
  if (summary && summary.items && summary.items.length > 0) {
    const cardWidth = (pageWidth - (margin * 2) - ((summary.items.length - 1) * 5)) / summary.items.length;

    summary.items.forEach((item, i) => {
      const cardX = margin + (i * (cardWidth + 5));

      // Card background
      doc.setFillColor(...COLORS.slate100);
      doc.roundedRect(cardX, yPos, cardWidth, 16, 2, 2, 'F');

      // Label
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.slate500);
      doc.text(item.label, cardX + 4, yPos + 6);

      // Value
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.lavpopBlue);
      doc.text(String(item.value), cardX + 4, yPos + 13);
      doc.setFont('helvetica', 'normal');
    });

    yPos += 22;
  }

  // Chart OR Table (not both - avoid redundancy)
  if (showChart && data && data.length > 0 && data.length <= 10) {
    // Show chart only (no table) for small datasets
    if (chartType === 'pie') {
      yPos = drawDonutChart(doc, data, margin + 35, yPos + 30, 25, 'segment', 'count');
    } else if (chartType === 'bar') {
      yPos = drawBarChart(doc, data, margin, yPos + 5, pageWidth - (margin * 2), 'metric', 'value');
    }
  } else if (data && data.length > 0 && columns && columns.length > 0) {
    // Table for larger datasets or non-chart exports
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
        fillColor: COLORS.lavpopBlue,
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
      columnStyles: columns.reduce((acc, col, i) => {
        acc[i] = {};
        if (col.width) acc[i].cellWidth = col.width;
        if (col.align) acc[i].halign = col.align;
        return acc;
      }, {}),
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawHeader(doc, title, pageWidth, margin);
        }
      }
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

/**
 * Calculate business insights from data
 */
function calculateInsights(data) {
  const { customers = [], rfm = [], sales = [] } = data;
  const insights = [];

  // Total revenue
  let totalRevenue = 0;
  let recentRevenue = 0;
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
  let previousRevenue = 0;

  sales.forEach(s => {
    const value = parseFloat(String(s.Valor_Venda || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    totalRevenue += value;

    if (s.Data_Hora) {
      try {
        const parts = s.Data_Hora.split(' ')[0].split('/');
        const saleDate = new Date(parts[2], parts[1] - 1, parts[0]);
        if (saleDate.getTime() >= thirtyDaysAgo) {
          recentRevenue += value;
        } else if (saleDate.getTime() >= sixtyDaysAgo) {
          previousRevenue += value;
        }
      } catch { /* ignore */ }
    }
  });

  // Revenue trend
  if (previousRevenue > 0 && recentRevenue > 0) {
    const change = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
    if (change > 0) {
      insights.push(`Receita cresceu ${change.toFixed(1)}% nos últimos 30 dias`);
    } else if (change < -5) {
      insights.push(`⚠️ Receita caiu ${Math.abs(change).toFixed(1)}% vs. mês anterior`);
    }
  }

  // At-risk customers
  const atRisk = rfm.filter(c => c.segment === 'Esfriando' || c.segment === 'Inativo');
  if (atRisk.length > 0 && rfm.length > 0) {
    const pct = ((atRisk.length / rfm.length) * 100).toFixed(0);
    insights.push(`${atRisk.length} clientes em risco de churn (${pct}% da base)`);
  }

  // VIP contribution
  const vips = rfm.filter(c => c.segment === 'VIP');
  if (vips.length > 0) {
    let vipRevenue = 0;
    vips.forEach(v => {
      vipRevenue += parseFloat(String(v.Monetary || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    });
    if (totalRevenue > 0) {
      const vipPct = ((vipRevenue / totalRevenue) * 100).toFixed(0);
      insights.push(`Segmento VIP representa ${vipPct}% da receita total`);
    }
  }

  // New customers
  const newCustomers = rfm.filter(c => c.segment === 'Novato');
  if (newCustomers.length > 0) {
    insights.push(`${newCustomers.length} novos clientes no período recente`);
  }

  // Average ticket
  if (sales.length > 0) {
    const avgTicket = totalRevenue / sales.length;
    insights.push(`Ticket médio: R$ ${avgTicket.toFixed(2)}`);
  }

  return insights;
}

/**
 * Get daily revenue for trend chart
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
      const value = parseFloat(String(s.Valor_Venda || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + value;
    } catch { /* ignore */ }
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
 * Draw a mini sparkline chart
 */
function drawSparkline(doc, data, x, y, width, height, color = COLORS.lavpopBlue) {
  if (!data || data.length < 2) return;

  const values = data.map(d => d.revenue || 0);
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
}

/**
 * Export Complete Report - Multi-page comprehensive PDF
 */
export function exportCompleteReport(data, filename = 'lavpop-relatorio-completo') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 30;

  const customers = data?.customers || [];
  const rfm = data?.rfm || [];
  const sales = data?.sales || [];

  // ========== PAGE 1: COVER ==========
  drawHeader(doc, 'Relatório Completo', pageWidth, margin);

  // Report metadata
  yPos = 40;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.slate900);
  doc.text('Business Intelligence', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  const now = new Date();
  doc.text(`Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, yPos, { align: 'center' });

  // Summary cards
  yPos += 25;
  const cardData = [
    { label: 'Clientes', value: customers.length.toLocaleString('pt-BR') },
    { label: 'Transações', value: sales.length.toLocaleString('pt-BR') },
    { label: 'Segmentos RFM', value: '6' },
  ];
  const cardWidth = (pageWidth - margin * 2 - 10) / 3;

  cardData.forEach((card, i) => {
    const cardX = margin + (i * (cardWidth + 5));
    doc.setFillColor(...COLORS.slate100);
    doc.roundedRect(cardX, yPos, cardWidth, 25, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.slate500);
    doc.text(card.label, cardX + cardWidth / 2, yPos + 9, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.lavpopBlue);
    doc.text(card.value, cardX + cardWidth / 2, yPos + 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  // ========== PAGE 2: RFM SEGMENTATION ==========
  doc.addPage();
  drawHeader(doc, 'Segmentação RFM', pageWidth, margin);
  yPos = 35;

  // Calculate segment data
  const segmentData = {};
  rfm.forEach(c => {
    const seg = c.segment || 'Desconhecido';
    if (!segmentData[seg]) segmentData[seg] = { count: 0, totalValue: 0 };
    segmentData[seg].count++;
    const value = parseFloat(String(c.Monetary || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    segmentData[seg].totalValue += value;
  });

  const segmentOrder = ['VIP', 'Frequente', 'Promissor', 'Novato', 'Esfriando', 'Inativo'];
  const segmentArray = segmentOrder
    .filter(seg => segmentData[seg])
    .map(seg => ({
      segment: seg,
      count: segmentData[seg].count,
      totalValue: segmentData[seg].totalValue
    }));

  // Draw donut chart
  if (segmentArray.length > 0) {
    yPos = drawDonutChart(doc, segmentArray, margin + 40, yPos + 35, 28, 'segment', 'count');
  }

  // Segment table
  yPos += 10;
  const total = rfm.length || 1;
  const segmentTableData = segmentArray.map(s => [
    s.segment,
    s.count.toString(),
    `${((s.count / total) * 100).toFixed(1)}%`,
    `R$ ${(s.count > 0 ? s.totalValue / s.count : 0).toFixed(2)}`,
    `R$ ${s.totalValue.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Segmento', 'Clientes', '% Total', 'Ticket Médio', 'Receita Total']],
    body: segmentTableData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: COLORS.lavpopBlue, textColor: COLORS.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.slate100 },
  });

  // ========== PAGE 3: AT-RISK CUSTOMERS ==========
  doc.addPage();
  drawHeader(doc, 'Clientes em Risco', pageWidth, margin);
  yPos = 35;

  const atRiskCustomers = rfm
    .filter(c => c.segment === 'Esfriando' || c.segment === 'Inativo')
    .slice(0, 25); // Top 25

  if (atRiskCustomers.length > 0) {
    const atRiskData = atRiskCustomers.map(c => [
      (c['client name'] || '').substring(0, 25),
      c['phone number'] || '',
      c.Recency || '—',
      c.segment
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Nome', 'Telefone', 'Dias s/ Visita', 'Segmento']],
      body: atRiskData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: COLORS.lavpopBlue, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLORS.slate100 },
      columnStyles: {
        3: { halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const segment = data.cell.raw;
          if (segment === 'Inativo') {
            data.cell.styles.textColor = [239, 68, 68];
          } else if (segment === 'Esfriando') {
            data.cell.styles.textColor = [251, 191, 36];
          }
        }
      }
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.slate500);
    doc.text('Nenhum cliente em risco identificado.', pageWidth / 2, yPos + 20, { align: 'center' });
  }

  // ========== PAGE 4: RECENT TRANSACTIONS ==========
  doc.addPage();
  drawHeader(doc, 'Transações Recentes', pageWidth, margin);
  yPos = 35;

  const recentSales = sales.slice(0, 30); // Most recent 30

  if (recentSales.length > 0) {
    const salesData = recentSales.map(s => [
      s.Data_Hora || '',
      (s.Nome_Cliente || '').substring(0, 20),
      s.Valor_Venda || '',
      s.Meio_de_Pagamento || ''
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Data/Hora', 'Cliente', 'Valor', 'Pagamento']],
      body: salesData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: COLORS.lavpopBlue, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLORS.slate100 },
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

/**
 * Export Executive Summary - Single-page board-ready PDF
 */
export function exportExecutiveSummary(data, filename = 'lavpop-resumo-executivo') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 30;

  const customers = data?.customers || [];
  const rfm = data?.rfm || [];
  const sales = data?.sales || [];

  // Header
  drawHeader(doc, 'Resumo Executivo', pageWidth, margin);

  // Date range
  yPos = 32;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate500);
  const now = new Date();
  doc.text(`Período: ${now.toLocaleDateString('pt-BR')}`, margin, yPos);

  // ========== KPI CARDS ROW ==========
  yPos = 40;

  // Calculate KPIs
  let totalRevenue = 0;
  sales.forEach(s => {
    totalRevenue += parseFloat(String(s.Valor_Venda || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  });

  const vipCount = rfm.filter(c => c.segment === 'VIP').length;
  const atRiskCount = rfm.filter(c => c.segment === 'Esfriando' || c.segment === 'Inativo').length;
  const avgTicket = sales.length > 0 ? totalRevenue / sales.length : 0;

  const kpis = [
    { label: 'Receita Total', value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`, color: COLORS.lavpopBlue },
    { label: 'Clientes VIP', value: vipCount.toString(), color: COLORS.lavpopGreen },
    { label: 'Em Risco', value: atRiskCount.toString(), color: [239, 68, 68] },
    { label: 'Ticket Médio', value: `R$ ${avgTicket.toFixed(0)}`, color: COLORS.lavpopBlue },
  ];

  const kpiWidth = (pageWidth - margin * 2 - 15) / 4;
  kpis.forEach((kpi, i) => {
    const kpiX = margin + (i * (kpiWidth + 5));

    // Card background
    doc.setFillColor(...COLORS.slate100);
    doc.roundedRect(kpiX, yPos, kpiWidth, 22, 2, 2, 'F');

    // Colored left border
    doc.setFillColor(...kpi.color);
    doc.rect(kpiX, yPos, 2, 22, 'F');

    // Label
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slate500);
    doc.text(kpi.label, kpiX + 6, yPos + 7);

    // Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, kpiX + 6, yPos + 17);
    doc.setFont('helvetica', 'normal');
  });

  // ========== REVENUE TREND (mini sparkline) ==========
  yPos += 32;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.slate700);
  doc.text('Tendência de Receita (30 dias)', margin, yPos);

  const trendData = getDailyRevenueTrend(sales, 30);
  if (trendData.length >= 2) {
    drawSparkline(doc, trendData, margin, yPos + 4, pageWidth - margin * 2, 20, COLORS.lavpopBlue);
    yPos += 28;
  } else {
    yPos += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.slate500);
    doc.text('Dados insuficientes para tendência', margin, yPos);
    yPos += 8;
  }

  // ========== INSIGHTS SECTION ==========
  yPos += 8;
  doc.setFillColor(...COLORS.lavpopBlue);
  doc.rect(margin, yPos, pageWidth - margin * 2, 0.5, 'F');

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.slate900);
  doc.text('Destaques', margin, yPos);

  yPos += 6;
  const insights = calculateInsights(data);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate700);

  insights.slice(0, 5).forEach((insight, i) => {
    const bullet = insight.startsWith('⚠️') ? '⚠' : '•';
    const text = insight.replace('⚠️ ', '');
    const isWarning = insight.startsWith('⚠️');

    if (isWarning) {
      doc.setTextColor(239, 68, 68);
    } else {
      doc.setTextColor(...COLORS.slate700);
    }
    doc.text(`${bullet} ${text}`, margin + 2, yPos);
    yPos += 6;
  });

  // ========== SEGMENT BREAKDOWN (mini donut + legend) ==========
  yPos += 10;
  doc.setFillColor(...COLORS.lavpopBlue);
  doc.rect(margin, yPos, pageWidth - margin * 2, 0.5, 'F');

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.slate900);
  doc.text('Distribuição de Clientes', margin, yPos);

  // Calculate segment data
  const segmentData = {};
  rfm.forEach(c => {
    const seg = c.segment || 'Desconhecido';
    if (!segmentData[seg]) segmentData[seg] = { count: 0 };
    segmentData[seg].count++;
  });

  const segmentOrder = ['VIP', 'Frequente', 'Promissor', 'Novato', 'Esfriando', 'Inativo'];
  const segmentArray = segmentOrder
    .filter(seg => segmentData[seg])
    .map(seg => ({ segment: seg, count: segmentData[seg].count }));

  if (segmentArray.length > 0) {
    yPos += 10;
    drawDonutChart(doc, segmentArray, margin + 30, yPos + 18, 18, 'segment', 'count');
  }

  // ========== ALERTS SECTION ==========
  yPos += 55;
  doc.setFillColor(...COLORS.lavpopBlue);
  doc.rect(margin, yPos, pageWidth - margin * 2, 0.5, 'F');

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.slate900);
  doc.text('Alertas', margin, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const alerts = [];
  if (atRiskCount > customers.length * 0.2) {
    alerts.push(`Alto índice de churn: ${atRiskCount} clientes em risco`);
  }
  if (vipCount < customers.length * 0.05) {
    alerts.push(`Baixa retenção VIP: apenas ${vipCount} clientes VIP`);
  }
  if (alerts.length === 0) {
    alerts.push('Nenhum alerta crítico no momento');
  }

  const alertColor = alerts[0].includes('Nenhum') ? COLORS.lavpopGreen : [239, 68, 68];
  doc.setTextColor(...alertColor);
  alerts.forEach(alert => {
    doc.text(`• ${alert}`, margin + 2, yPos);
    yPos += 6;
  });

  // ========== RECOMMENDED ACTIONS ==========
  yPos += 8;
  doc.setFillColor(...COLORS.lavpopBlue);
  doc.rect(margin, yPos, pageWidth - margin * 2, 0.5, 'F');

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.slate900);
  doc.text('Próximos Passos', margin, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate700);

  const actions = [];
  if (atRiskCount > 0) {
    actions.push(`Campanha de reativação para ${atRiskCount} clientes em risco`);
  }
  const novatos = rfm.filter(c => c.segment === 'Novato').length;
  if (novatos > 0) {
    actions.push(`Programa de boas-vindas para ${novatos} novos clientes`);
  }
  if (vipCount > 0) {
    actions.push(`Campanha de fidelização para ${vipCount} clientes VIP`);
  }
  if (actions.length === 0) {
    actions.push('Manter estratégia atual de engajamento');
  }

  actions.slice(0, 4).forEach((action, i) => {
    doc.text(`${i + 1}. ${action}`, margin + 2, yPos);
    yPos += 6;
  });

  // Footer
  drawFooter(doc, 1, 1, pageWidth, pageHeight, margin);

  doc.save(`${filename}.pdf`);
}

export default { exportToCSV, exportToPDF, exportCompleteReport, exportExecutiveSummary };
