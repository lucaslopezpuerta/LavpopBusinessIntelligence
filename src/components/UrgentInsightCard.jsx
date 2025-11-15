// UrgentInsightCard.jsx v1.0
// Auto-generates the most urgent business insight based on rules
// Shows top priority alert with icon and actionable message

import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  Activity,
  CheckCircle,
  Info
} from 'lucide-react';

const UrgentInsightCard = ({ businessMetrics, customerMetrics }) => {
  const insight = useMemo(() => {
    if (!businessMetrics || !customerMetrics) return null;

    const insights = [];
    const wow = businessMetrics.weekOverWeek || {};
    const weekly = businessMetrics.weekly || {};

    // Rule 1: Revenue decline >20%
    if (wow.netRevenue !== null && wow.netRevenue < -20) {
      insights.push({
        severity: 'critical',
        icon: TrendingDown,
        message: `Receita caiu ${Math.abs(wow.netRevenue).toFixed(1)}% vs semana passada`,
        action: 'Verificar causas e ajustar estratégia',
        color: '#dc2626',
        bgColor: '#fee2e2'
      });
    }

    // Rule 2: Revenue growth >15%
    if (wow.netRevenue !== null && wow.netRevenue > 15) {
      insights.push({
        severity: 'positive',
        icon: TrendingUp,
        message: `Receita cresceu ${wow.netRevenue.toFixed(1)}% vs semana passada`,
        action: 'Continue o bom trabalho!',
        color: '#16a34a',
        bgColor: '#dcfce7'
      });
    }

    // Rule 3: At-Risk customers >30% of active base
    const atRiskRate = customerMetrics.activeCount > 0 
      ? (customerMetrics.atRiskCount / customerMetrics.activeCount) * 100 
      : 0;
    if (atRiskRate > 30) {
      insights.push({
        severity: 'warning',
        icon: AlertTriangle,
        message: `${customerMetrics.atRiskCount} clientes em risco (${atRiskRate.toFixed(0)}% da base)`,
        action: 'Considere campanha de retenção',
        color: '#f59e0b',
        bgColor: '#fef3c7'
      });
    }

    // Rule 4: Utilization <15% (low - aligned with Operations THRESHOLDS.good)
    if (weekly.totalUtilization !== null && weekly.totalUtilization < 15) {
      insights.push({
        severity: 'critical',
        icon: Activity,
        message: `Utilização crítica: ${Math.round(weekly.totalUtilization)}% esta semana`,
        action: 'Considere promoção urgente ou marketing',
        color: '#dc2626',
        bgColor: '#fee2e2'
      });
    }

    // Rule 4b: Utilization 15-25% (fair - aligned with Operations THRESHOLDS)
    if (weekly.totalUtilization !== null && weekly.totalUtilization >= 15 && weekly.totalUtilization < 25) {
      insights.push({
        severity: 'warning',
        icon: Activity,
        message: `Utilização razoável: ${Math.round(weekly.totalUtilization)}% esta semana`,
        action: 'Considere aumentar divulgação',
        color: '#f59e0b',
        bgColor: '#fef3c7'
      });
    }

    // Rule 5: Utilization >25% (excellent - aligned with Operations THRESHOLDS.excellent)
    if (weekly.totalUtilization !== null && weekly.totalUtilization > 25) {
      insights.push({
        severity: 'positive',
        icon: CheckCircle,
        message: `Excelente utilização: ${Math.round(weekly.totalUtilization)}% esta semana`,
        action: 'Continue o bom trabalho!',
        color: '#16a34a',
        bgColor: '#dcfce7'
      });
    }

    // Rule 6: Customer health rate <60%
    const healthRate = customerMetrics.healthRate || 0;
    if (healthRate < 60) {
      insights.push({
        severity: 'warning',
        icon: Users,
        message: `Taxa de saúde dos clientes: ${Math.round(healthRate)}%`,
        action: 'Focar em reativação de clientes',
        color: '#f59e0b',
        bgColor: '#fef3c7'
      });
    }

    // Rule 7: Services decline >15%
    if (wow.totalServices !== null && wow.totalServices < -15) {
      insights.push({
        severity: 'critical',
        icon: TrendingDown,
        message: `Ciclos caíram ${Math.abs(wow.totalServices).toFixed(1)}% vs semana passada`,
        action: 'Investigar queda na demanda',
        color: '#dc2626',
        bgColor: '#fee2e2'
      });
    }

    // Priority: critical > warning > positive > info
    const priority = { critical: 1, warning: 2, positive: 3, info: 4 };
    insights.sort((a, b) => priority[a.severity] - priority[b.severity]);

    // Return top insight or default message
    return insights.length > 0 ? insights[0] : {
      severity: 'info',
      icon: Info,
      message: 'Tudo funcionando normalmente',
      action: 'Sem alertas urgentes no momento',
      color: '#10306B',
      bgColor: '#e3f2fd'
    };
  }, [businessMetrics, customerMetrics]);

  if (!insight) return null;

  const Icon = insight.icon;

  return (
    <div style={{
      background: insight.bgColor,
      borderRadius: '12px',
      border: `2px solid ${insight.color}20`,
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        {/* Icon */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon style={{ width: '28px', height: '28px', color: insight.color }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: insight.color,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: '0.5rem'
          }}>
            {insight.severity === 'critical' && 'ALERTA URGENTE'}
            {insight.severity === 'warning' && 'ATENÇÃO'}
            {insight.severity === 'positive' && 'DESTAQUE'}
            {insight.severity === 'info' && 'INFORMAÇÃO'}
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#10306B',
            marginBottom: '0.5rem',
            lineHeight: '1.3'
          }}>
            {insight.message}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            💡 {insight.action}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrgentInsightCard;
