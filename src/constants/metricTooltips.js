// metricTooltips.js - Plain Portuguese explanations for KPI metrics
// Used by KPICard components to display help tooltips
//
// CHANGELOG:
// v1.0 (2026-01-07): Initial implementation for Plan item 1.2

/**
 * Tooltip content for all KPI metrics in plain Portuguese.
 * Each tooltip should explain:
 * - What the metric measures
 * - How it's calculated (if relevant)
 * - What's considered good/bad (if applicable)
 */
export const METRIC_TOOLTIPS = {
  // Dashboard metrics (KPICardsGrid)
  revenue: 'Receita líquida após descontos. Exclui cancelamentos.',
  cycles: 'Total de ciclos de lavagem + secagem completados.',
  utilization: 'Percentual de tempo que as máquinas ficaram em uso. Ideal: 70-85%.',
  mtdRevenue: 'Receita acumulada do mês até hoje.',
  washPercent: 'Proporção de serviços que foram lavagem.',
  dryPercent: 'Proporção de serviços que foram secagem.',
  atRisk: 'Clientes que não visitaram há mais de 30 dias mas visitaram nos últimos 90.',
  healthRate: 'Percentual de clientes ativos que visitaram nos últimos 30 dias.',

  // Intelligence metrics
  monthRevenue: 'Receita do mês atual. Comparação usa média diária para meses incompletos.',
  prevMonthRevenue: 'Receita total do mês anterior.',
  avgTicket: 'Valor médio gasto por ciclo de serviço.',
  cyclesPerDay: 'Média de ciclos por dia no período selecionado.',

  // Customer metrics
  newCustomers: 'Clientes que fizeram primeira compra nos últimos 30 dias.',
  activeCustomers: 'Clientes com pelo menos 1 visita nos últimos 90 dias.',
  rfmScore: 'Pontuação baseada em Recência (última visita), Frequência (quantas vezes veio) e Monetário (quanto gastou).',
  retentionPulse: 'Índice de 0-10 que mede quantos clientes estão voltando. Acima de 6 é bom.',

  // Weather metrics
  weatherR2: 'Acurácia da previsão. 0.73 = acertamos 7 de cada 10 previsões.',
  weatherImpact: 'Impacto estimado do clima na receita do dia.',

  // Social media metrics
  engagementRate: 'De cada 100 seguidores, quantos curtem ou comentam seus posts.',
  deliveryRate: 'Percentual de mensagens entregues com sucesso.',
  readRate: 'Percentual de mensagens que foram lidas.',
};

export default METRIC_TOOLTIPS;
