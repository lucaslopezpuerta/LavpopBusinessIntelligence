// pdfInsightGenerator.js v1.0 - Narrative & Insight Generation for PDF Reports
// Generates business narratives and actionable insights in Portuguese
//
// CHANGELOG:
// v1.0 (2026-01-31): Initial implementation
//   - Revenue narrative generation
//   - Customer health narrative
//   - Operations narrative
//   - Headlines in [Number] + [Impact] + [Context] format
//   - Alert generation with severity levels

import { formatCurrency } from './numberUtils';
import { calculatePriorityMatrix } from './intelligenceCalculations';

/**
 * Month names in Portuguese
 */
const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

const MONTH_NAMES_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

/**
 * Get current month context for narratives
 */
function getMonthContext() {
  const now = new Date();
  return {
    currentMonth: MONTH_NAMES[now.getMonth()],
    currentMonthShort: MONTH_NAMES_SHORT[now.getMonth()],
    previousMonth: MONTH_NAMES[(now.getMonth() + 11) % 12],
    previousMonthShort: MONTH_NAMES_SHORT[(now.getMonth() + 11) % 12],
    year: now.getFullYear(),
    day: now.getDate(),
  };
}

/**
 * Generate revenue narrative paragraph in Portuguese
 * Creates a story about revenue performance
 *
 * @param {Object} metrics - Business metrics from calculateBusinessMetrics
 * @param {Object} profitability - Profitability data
 * @returns {string} Narrative paragraph
 */
export function generateRevenueNarrative(metrics, profitability) {
  if (!metrics) return 'Dados de receita não disponíveis para análise.';

  const ctx = getMonthContext();
  const parts = [];

  // MTD Revenue opening
  const mtd = metrics.monthToDate;
  if (mtd && mtd.grossRevenue > 0) {
    const formattedRevenue = formatCurrency(mtd.grossRevenue);
    parts.push(`Em ${ctx.currentMonth} de ${ctx.year}, a operação registrou ${formattedRevenue} em receita bruta até o dia ${ctx.day}.`);

    // YoY comparison
    if (mtd.yearOverYearChange !== null && mtd.yearOverYearChange !== 0) {
      const direction = mtd.yearOverYearChange > 0 ? 'crescimento' : 'queda';
      const pct = Math.abs(mtd.yearOverYearChange).toFixed(1);
      parts.push(`Isso representa ${direction} de ${pct}% comparado ao mesmo período de ${ctx.year - 1}.`);
    }
  }

  // WoW analysis
  const wow = metrics.weekOverWeek;
  if (wow && metrics.weekly) {
    const weeklyRevenue = formatCurrency(metrics.weekly.netRevenue);

    if (Math.abs(wow.netRevenue) > 5) {
      const direction = wow.netRevenue > 0 ? 'cresceu' : 'caiu';
      const pct = Math.abs(wow.netRevenue).toFixed(1);
      parts.push(`A receita semanal de ${weeklyRevenue} ${direction} ${pct}% vs. a semana anterior.`);
    }
  }

  // Profitability insight
  if (profitability) {
    if (profitability.profitMargin > 15) {
      parts.push(`A margem de lucro de ${profitability.profitMargin.toFixed(1)}% está em nível saudável.`);
    } else if (profitability.profitMargin > 0) {
      parts.push(`A margem de lucro de ${profitability.profitMargin.toFixed(1)}% tem espaço para melhoria.`);
    } else {
      parts.push(`A operação está operando com margem negativa de ${Math.abs(profitability.profitMargin).toFixed(1)}%, requerendo atenção imediata.`);
    }
  }

  return parts.join(' ');
}

/**
 * Generate customer health narrative paragraph
 *
 * @param {Object} customerMetrics - From calculateCustomerMetrics
 * @param {Object} retentionMetrics - From getRetentionMetrics
 * @returns {string} Narrative paragraph
 */
export function generateCustomerNarrative(customerMetrics, retentionMetrics) {
  if (!customerMetrics) return 'Dados de clientes não disponíveis para análise.';

  const parts = [];

  // Active customer base
  const activeCount = customerMetrics.activeCount || 0;
  const totalCount = customerMetrics.totalCustomers || 0;
  const healthRate = customerMetrics.healthRate || 0;

  parts.push(`A base de clientes conta com ${totalCount.toLocaleString('pt-BR')} cadastros, dos quais ${activeCount.toLocaleString('pt-BR')} estão ativos.`);

  // Health rate interpretation
  if (healthRate > 60) {
    parts.push(`Com ${healthRate.toFixed(0)}% de saúde, a base está em bom estado.`);
  } else if (healthRate > 40) {
    parts.push(`A taxa de saúde de ${healthRate.toFixed(0)}% indica que parte significativa da base precisa de atenção.`);
  } else {
    parts.push(`A taxa de saúde de ${healthRate.toFixed(0)}% é preocupante e requer ação imediata de retenção.`);
  }

  // At-risk customers
  const atRiskCount = customerMetrics.needsAttentionCount || 0;
  if (atRiskCount > 0) {
    const pct = ((atRiskCount / activeCount) * 100).toFixed(0);
    parts.push(`Há ${atRiskCount} clientes em risco de churn (${pct}% da base ativa).`);
  }

  // Retention insights
  if (retentionMetrics && retentionMetrics.overall) {
    const rate = retentionMetrics.overall.rate30;
    if (rate > 0) {
      parts.push(`A taxa de retenção de 30 dias está em ${rate}%.`);
    }
  }

  return parts.join(' ');
}

/**
 * Generate operations narrative paragraph
 *
 * @param {Object} metrics - Business metrics
 * @param {Object} serviceBreakdown - Service breakdown data
 * @returns {string} Narrative paragraph
 */
export function generateOperationsNarrative(metrics, serviceBreakdown) {
  if (!metrics) return 'Dados operacionais não disponíveis para análise.';

  const parts = [];

  // Utilization
  if (metrics.weekly) {
    const util = metrics.weekly.totalUtilization || 0;
    const services = metrics.weekly.totalServices || 0;

    if (util > 70) {
      parts.push(`A operação está com alta utilização de ${util.toFixed(0)}%, indicando forte demanda.`);
    } else if (util > 50) {
      parts.push(`A utilização de ${util.toFixed(0)}% está em nível moderado, com espaço para crescimento.`);
    } else {
      parts.push(`A utilização de ${util.toFixed(0)}% indica capacidade ociosa significativa.`);
    }

    parts.push(`Foram realizados ${services.toLocaleString('pt-BR')} serviços na última semana completa.`);
  }

  // Service breakdown
  if (serviceBreakdown) {
    const { wash, dry } = serviceBreakdown;

    if (wash && dry) {
      const washPct = ((wash.services / (wash.services + dry.services)) * 100).toFixed(0);
      parts.push(`A distribuição é de ${washPct}% lavagens e ${100 - washPct}% secagens.`);

      // Decline detection
      if (wash.growth !== null && wash.growth < -10) {
        parts.push(`Serviços de lavagem caíram ${Math.abs(wash.growth).toFixed(0)}% vs. mês anterior.`);
      }
      if (dry.growth !== null && dry.growth < -10) {
        parts.push(`Serviços de secagem caíram ${Math.abs(dry.growth).toFixed(0)}% vs. mês anterior.`);
      }
    }
  }

  return parts.join(' ');
}

/**
 * Generate data-driven headlines in [Number] + [Impact] + [Context] format
 *
 * @param {Object} data - All available data
 * @returns {Array} Array of headline objects { text, type, value }
 */
export function generateHeadlines(data) {
  const headlines = [];
  const { metrics, profitability, customerMetrics, retentionMetrics } = data;

  // Revenue headline
  if (metrics?.monthToDate) {
    const mtd = metrics.monthToDate;
    if (mtd.yearOverYearChange > 10) {
      headlines.push({
        text: `+${mtd.yearOverYearChange.toFixed(0)}% de crescimento YoY em receita`,
        type: 'positive',
        value: mtd.yearOverYearChange,
      });
    } else if (mtd.yearOverYearChange < -10) {
      headlines.push({
        text: `${mtd.yearOverYearChange.toFixed(0)}% de queda YoY em receita`,
        type: 'negative',
        value: mtd.yearOverYearChange,
      });
    }
  }

  // Profitability headline
  if (profitability) {
    if (profitability.profitMargin > 20) {
      headlines.push({
        text: `${profitability.profitMargin.toFixed(0)}% de margem de lucro - excelente`,
        type: 'positive',
        value: profitability.profitMargin,
      });
    } else if (profitability.profitMargin < 5) {
      headlines.push({
        text: `Margem de ${profitability.profitMargin.toFixed(1)}% abaixo do ideal`,
        type: 'warning',
        value: profitability.profitMargin,
      });
    }
  }

  // Customer health headline
  if (customerMetrics) {
    const atRisk = customerMetrics.needsAttentionCount || 0;
    if (atRisk > 10) {
      headlines.push({
        text: `${atRisk} clientes em risco de churn`,
        type: 'warning',
        value: atRisk,
      });
    }

    const newCustomers = customerMetrics.newCustomerCount || 0;
    if (newCustomers > 5) {
      headlines.push({
        text: `${newCustomers} novos clientes no período`,
        type: 'positive',
        value: newCustomers,
      });
    }
  }

  // Retention headline
  if (retentionMetrics?.overall) {
    const rate = retentionMetrics.overall.rate30;
    const trend = retentionMetrics.trend?.overall || 0;

    if (trend > 5) {
      headlines.push({
        text: `Retenção subiu ${trend.toFixed(0)}pp para ${rate}%`,
        type: 'positive',
        value: trend,
      });
    } else if (trend < -5) {
      headlines.push({
        text: `Retenção caiu ${Math.abs(trend).toFixed(0)}pp para ${rate}%`,
        type: 'negative',
        value: trend,
      });
    }
  }

  // Sort by absolute value (most impactful first)
  headlines.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return headlines.slice(0, 5);
}

/**
 * Generate alert conditions
 *
 * @param {Object} data - All available data
 * @returns {Array} Array of alerts { title, message, severity }
 */
export function generateAlerts(data) {
  const alerts = [];
  const { metrics, profitability, customerMetrics, priorityMatrix } = data;

  // Critical: Negative profit margin
  if (profitability && profitability.profitMargin < 0) {
    alerts.push({
      title: 'Margem Negativa',
      message: `Operação com prejuízo de ${Math.abs(profitability.profitMargin).toFixed(1)}%. Revise custos imediatamente.`,
      severity: 'critical',
    });
  }

  // Critical: Below break-even
  if (profitability && profitability.breakEvenBuffer < -20) {
    alerts.push({
      title: 'Abaixo do Break-even',
      message: `Faltam ${Math.abs(profitability.breakEvenBuffer).toFixed(0)}% para atingir o ponto de equilíbrio.`,
      severity: 'critical',
    });
  }

  // Warning: High churn risk
  if (customerMetrics) {
    const atRiskPct = (customerMetrics.needsAttentionCount / customerMetrics.activeCount) * 100;
    if (atRiskPct > 30) {
      alerts.push({
        title: 'Alto Risco de Churn',
        message: `${atRiskPct.toFixed(0)}% da base ativa está em risco. Implemente campanhas de retenção.`,
        severity: 'warning',
      });
    }
  }

  // Warning: Declining revenue
  if (metrics?.weekOverWeek?.netRevenue < -15) {
    alerts.push({
      title: 'Queda de Receita',
      message: `Receita semanal caiu ${Math.abs(metrics.weekOverWeek.netRevenue).toFixed(0)}%. Investigue causas.`,
      severity: 'warning',
    });
  }

  // Warning: Low utilization
  if (metrics?.weekly?.totalUtilization < 30) {
    alerts.push({
      title: 'Baixa Utilização',
      message: `Utilização de apenas ${metrics.weekly.totalUtilization.toFixed(0)}%. Considere promoções.`,
      severity: 'warning',
    });
  }

  // Info: Priority matrix weakest dimension
  if (priorityMatrix?.priority) {
    const priority = priorityMatrix.priority;
    if (priority.score < 5) {
      alerts.push({
        title: `Foco: ${priority.label}`,
        message: `Dimensão ${priority.label} está ${priority.status.toLowerCase()} (${priority.score.toFixed(1)}/10).`,
        severity: 'info',
      });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts.slice(0, 4);
}

/**
 * Main orchestrator - Generate all PDF insights
 *
 * @param {Object} data - All available data from the app
 * @returns {Object} Complete insights package
 */
export function generatePDFInsights(data) {
  const {
    metrics,
    profitability,
    customerMetrics,
    retentionMetrics,
    serviceBreakdown,
    growthTrends,
    currentMonth,
    previousMonth,
  } = data;

  // Calculate priority matrix if we have the data
  let priorityMatrix = null;
  if (profitability && growthTrends && currentMonth && previousMonth) {
    priorityMatrix = calculatePriorityMatrix(
      profitability,
      growthTrends,
      currentMonth,
      previousMonth,
      serviceBreakdown
    );
  }

  return {
    // Narratives
    revenueNarrative: generateRevenueNarrative(metrics, profitability),
    customerNarrative: generateCustomerNarrative(customerMetrics, retentionMetrics),
    operationsNarrative: generateOperationsNarrative(metrics, serviceBreakdown),

    // Headlines
    headlines: generateHeadlines({ metrics, profitability, customerMetrics, retentionMetrics }),

    // Alerts
    alerts: generateAlerts({ metrics, profitability, customerMetrics, priorityMatrix }),

    // Priority Matrix (for gauges and actions)
    priorityMatrix,

    // Actions (from priority matrix)
    actions: priorityMatrix?.actions || [],

    // Context
    generatedAt: new Date().toISOString(),
    monthContext: getMonthContext(),
  };
}

export default {
  generateRevenueNarrative,
  generateCustomerNarrative,
  generateOperationsNarrative,
  generateHeadlines,
  generateAlerts,
  generatePDFInsights,
};
