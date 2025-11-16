// KPICards.jsx v2.4 - PERFECT FONT CONSISTENCY
// ✅ All titles exactly 11px
// ✅ All values exactly 28px (reduced from 32px)
// ✅ WoW badges reduced to 14px (from 16px)
// ✅ All subtitles exactly 12px
// ✅ Consistent spacing throughout
//
// CHANGELOG:
// v2.4 (2025-11-15): Perfect font consistency, reduced sizes
// v2.3 (2025-11-15): Fixed date field to include Data_Hora

import React, { useMemo } from 'react';
import { Activity, Users, AlertCircle, Heart, Droplet, Flame, UserPlus } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  red: '#dc2626',
  amber: '#f59e0b',
  blue: '#3b82f6',
  gray: '#6b7280'
};

function normalizeDoc(doc) {
  if (!doc) return '';
  const cleaned = String(doc).replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned.length <= 11) {
    return cleaned.padStart(11, '0');
  }
  return cleaned;
}

const KPICards = ({ businessMetrics, customerMetrics, salesData }) => {
  const newClientsData = useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return { count: 0, weekOverWeek: null };
    }

    const currentDate = new Date();
    let lastSaturday = new Date(currentDate);
    const daysFromSaturday = (currentDate.getDay() + 1) % 7;
    lastSaturday.setDate(lastSaturday.getDate() - daysFromSaturday);
    lastSaturday.setHours(23, 59, 59, 999);
    
    let startSunday = new Date(lastSaturday);
    startSunday.setDate(startSunday.getDate() - 6);
    startSunday.setHours(0, 0, 0, 0);

    let prevWeekEnd = new Date(startSunday);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    prevWeekEnd.setHours(23, 59, 59, 999);
    
    let prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekStart.getDate() - 6);
    prevWeekStart.setHours(0, 0, 0, 0);

    const customerFirstPurchase = {};
    
    salesData.forEach(row => {
      const dateStr = row.Data || row.Data_Hora || row.date;
      if (!dateStr) return;
      
      const saleDate = parseBrDate(dateStr);
      if (!saleDate) return;
      
      const cpf = normalizeDoc(row.Doc_Cliente || row.document || row.doc);
      if (!cpf) return;
      
      if (!customerFirstPurchase[cpf] || saleDate < customerFirstPurchase[cpf]) {
        customerFirstPurchase[cpf] = saleDate;
      }
    });

    let currentWeekNew = 0;
    let lastWeekNew = 0;
    
    Object.values(customerFirstPurchase).forEach(firstDate => {
      if (firstDate >= startSunday && firstDate <= lastSaturday) {
        currentWeekNew++;
      } else if (firstDate >= prevWeekStart && firstDate <= prevWeekEnd) {
        lastWeekNew++;
      }
    });

    let weekOverWeekChange = null;
    if (lastWeekNew > 0) {
      weekOverWeekChange = ((currentWeekNew - lastWeekNew) / lastWeekNew) * 100;
    } else if (currentWeekNew > 0) {
      weekOverWeekChange = 100;
    }

    return {
      count: currentWeekNew,
      weekOverWeek: weekOverWeekChange
    };
  }, [salesData]);

  if (!businessMetrics || !customerMetrics) {
    return (
      <div style={{ color: '#6b7280', padding: '1rem' }}>
        Carregando KPIs...
      </div>
    );
  }

  const weekly = businessMetrics.weekly || {};
  const wow = businessMetrics.weekOverWeek || {};
  
  const activeCount = customerMetrics.activeCount || 0;
  const atRiskCount = customerMetrics.atRiskCount || 0;
  const healthRate = customerMetrics.healthRate || 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getTrendData = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return { show: false };
    }
    
    const absValue = Math.abs(value);
    if (absValue < 0.5) {
      return { 
        show: true,
        text: '→', 
        color: COLORS.gray,
        label: 'vs semana passada'
      };
    }
    
    if (value > 0) {
      return { 
        show: true,
        text: `↑${value.toFixed(1)}%`, 
        color: COLORS.accent,
        label: 'vs semana passada'
      };
    }
    
    return { 
      show: true,
      text: `↓${absValue.toFixed(1)}%`, 
      color: COLORS.red,
      label: 'vs semana passada'
    };
  };

  const washCount = weekly.washServices || 0;
  const dryCount = weekly.dryServices || 0;
  const totalServices = washCount + dryCount;
  const washPercent = totalServices > 0 ? ((washCount / totalServices) * 100).toFixed(0) : 0;
  const dryPercent = totalServices > 0 ? ((dryCount / totalServices) * 100).toFixed(0) : 0;

  const kpis = [
    {
      id: 'revenue',
      title: 'Receita Líquida',
      value: formatCurrency(weekly.netRevenue || 0),
      trend: getTrendData(wow.netRevenue),
      subtitle: 'vs semana passada',
      icon: Activity,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'services',
      title: 'Total de Ciclos',
      value: formatNumber(weekly.totalServices || 0),
      trend: getTrendData(wow.totalServices),
      subtitle: 'vs semana passada',
      icon: Activity,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'utilization',
      title: 'Utilização Geral',
      value: `${Math.round(weekly.totalUtilization || 0)}%`,
      trend: getTrendData(wow.utilization),
      subtitle: 'vs semana passada',
      icon: Flame,
      color: COLORS.amber,
      iconBg: '#fef3c7'
    },
    {
      id: 'wash',
      title: 'Lavagens',
      value: formatNumber(washCount),
      subtitle: `${washPercent}% do total`,
      trend: getTrendData(wow.washServices),
      icon: Droplet,
      color: COLORS.blue,
      iconBg: '#dbeafe'
    },
    {
      id: 'dry',
      title: 'Secagens',
      value: formatNumber(dryCount),
      subtitle: `${dryPercent}% do total`,
      trend: getTrendData(wow.dryServices),
      icon: Flame,
      color: COLORS.amber,
      iconBg: '#fef3c7'
    },
    {
      id: 'newclients',
      title: 'Novos Clientes',
      value: formatNumber(newClientsData.count),
      subtitle: 'Esta semana',
      trend: getTrendData(newClientsData.weekOverWeek),
      icon: UserPlus,
      color: COLORS.accent,
      iconBg: '#dcfce7'
    },
    {
      id: 'active',
      title: 'Clientes Ativos',
      value: formatNumber(activeCount),
      subtitle: 'Não perdidos',
      icon: Users,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'atrisk',
      title: 'Clientes em Risco',
      value: formatNumber(atRiskCount),
      subtitle: 'Precisam atenção',
      icon: AlertCircle,
      color: COLORS.red,
      iconBg: '#fee2e2'
    },
    {
      id: 'health',
      title: 'Taxa de Saúde',
      value: `${Math.round(healthRate)}%`,
      subtitle: 'Clientes saudáveis',
      icon: Heart,
      color: COLORS.accent,
      iconBg: '#dcfce7'
    }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '0.875rem',
      marginBottom: '1rem'
    }}>
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        
        return (
          <div
            key={kpi.id}
            style={{
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              padding: '1rem',
              transition: 'all 0.2s',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* ✅ WoW Badge - Consistent 14px */}
            {kpi.trend?.show && (
              <div style={{
                position: 'absolute',
                top: '0.65rem',
                right: '0.65rem',
                fontSize: '14px',
                fontWeight: '700',
                color: kpi.trend.color,
                background: `${kpi.trend.color}15`,
                padding: '3px 8px',
                borderRadius: '5px',
                letterSpacing: '0.3px'
              }}>
                {kpi.trend.text}
              </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: '0.75rem' }}>
              {/* ✅ Title - Consistent 11px */}
              <h3 style={{ 
                fontSize: '11px',
                fontWeight: '700',
                color: COLORS.gray,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: 0,
                marginBottom: '0.65rem'
              }}>
                {kpi.title}
              </h3>
              
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '9px',
                background: kpi.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon style={{ width: '20px', height: '20px', color: kpi.color }} />
              </div>
            </div>

            {/* ✅ Value - Consistent 28px */}
            <div style={{ marginBottom: '0.4rem' }}>
              <div style={{ 
                fontSize: '28px',
                fontWeight: '700',
                color: kpi.color,
                lineHeight: '1.1'
              }}>
                {kpi.value}
              </div>
            </div>

            {/* ✅ Subtitle - Consistent 12px */}
            <div style={{ 
              fontSize: '12px',
              color: '#9ca3af',
              fontWeight: '500'
            }}>
              {kpi.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
