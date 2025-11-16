// KPICards.jsx v2.1 - FIXED NEW CLIENTS CALCULATION
// ✅ Fixed new clients count (now uses normalized CPF like NewClientsChart)
// ✅ Enhanced brand colors (Lavpop blue #1a5a8e and green #55b03b)
// ✅ 9 cards total with WoW indicators
// ✅ Portuguese labels
//
// CHANGELOG:
// v2.1 (2025-11-15): Fixed new clients calculation with CPF normalization
// v2.0 (2025-11-15): Added wash, dry, new clients metrics to main KPI grid

import React, { useMemo } from 'react';
import { Activity, Users, AlertCircle, Heart, Droplet, Flame, UserPlus } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',     // Lavpop blue
  accent: '#55b03b',      // Lavpop green
  red: '#dc2626',
  amber: '#f59e0b',
  blue: '#3b82f6',
  gray: '#6b7280'
};

/**
 * Normalize document number (CPF) - pad to 11 digits
 */
function normalizeDoc(doc) {
  if (!doc) return '';
  const cleaned = String(doc).replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned.length <= 11) {
    return cleaned.padStart(11, '0');
  }
  return cleaned;
}

const KPICards = ({ businessMetrics, customerMetrics, salesData }) => {
  // Calculate new clients for current week with FIXED normalization
  const newClientsData = useMemo(() => {
    if (!salesData || salesData.length === 0) return { count: 0, weekOverWeek: null };

    // Get current week boundaries (using same logic as businessMetrics)
    const currentDate = new Date();
    let lastSaturday = new Date(currentDate);
    const daysFromSaturday = (currentDate.getDay() + 1) % 7;
    lastSaturday.setDate(lastSaturday.getDate() - daysFromSaturday);
    lastSaturday.setHours(23, 59, 59, 999);
    
    let startSunday = new Date(lastSaturday);
    startSunday.setDate(startSunday.getDate() - 6);
    startSunday.setHours(0, 0, 0, 0);

    // Previous week
    let prevWeekEnd = new Date(startSunday);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    prevWeekEnd.setHours(23, 59, 59, 999);
    
    let prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekStart.getDate() - 6);
    prevWeekStart.setHours(0, 0, 0, 0);

    // Track first purchase per customer with NORMALIZED CPF
    const customerFirstPurchase = {};
    
    salesData.forEach(row => {
      const dateStr = row.Data || row.data || row.date;
      if (!dateStr) return;
      
      // Parse DD/MM/YYYY format
      const [day, month, year] = dateStr.split('/');
      const saleDate = new Date(year, month - 1, day);
      
      // ✅ FIXED: Normalize CPF like NewClientsChart does
      const cpf = normalizeDoc(row.Doc_Cliente || row.doc || row.cpf);
      if (!cpf) return;
      
      if (!customerFirstPurchase[cpf] || saleDate < customerFirstPurchase[cpf]) {
        customerFirstPurchase[cpf] = saleDate;
      }
    });

    // Count new clients in each window
    let currentWeekNew = 0;
    let lastWeekNew = 0;
    
    Object.values(customerFirstPurchase).forEach(firstDate => {
      if (firstDate >= startSunday && firstDate <= lastSaturday) {
        currentWeekNew++;
      } else if (firstDate >= prevWeekStart && firstDate <= prevWeekEnd) {
        lastWeekNew++;
      }
    });

    // Calculate week-over-week change
    let weekOverWeekChange = null;
    if (lastWeekNew > 0) {
      weekOverWeekChange = ((currentWeekNew - lastWeekNew) / lastWeekNew) * 100;
    } else if (currentWeekNew > 0) {
      weekOverWeekChange = 100; // If we have new clients this week but none last week
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
        label: 'estável'
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

  // Calculate wash/dry percentages
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
      icon: Activity,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'services',
      title: 'Total de Ciclos',
      value: formatNumber(weekly.totalServices || 0),
      trend: getTrendData(wow.totalServices),
      icon: Activity,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'utilization',
      title: 'Utilização Geral',
      value: `${Math.round(weekly.totalUtilization || 0)}%`,
      trend: getTrendData(wow.utilization),
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        
        return (
          <div
            key={kpi.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '1.25rem',
              transition: 'all 0.2s',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Trend Badge (Top Right) */}
            {kpi.trend?.show && (
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                fontSize: '16px',
                fontWeight: '700',
                color: kpi.trend.color,
                background: `${kpi.trend.color}15`,
                padding: '4px 10px',
                borderRadius: '6px',
                letterSpacing: '0.5px'
              }}>
                {kpi.trend.text}
              </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ 
                fontSize: '11px',
                fontWeight: '700',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                margin: 0,
                marginBottom: '0.75rem'
              }}>
                {kpi.title}
              </h3>
              
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: kpi.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon style={{ width: '24px', height: '24px', color: kpi.color }} />
              </div>
            </div>

            {/* Value */}
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ 
                fontSize: '32px',
                fontWeight: '700',
                color: kpi.color,
                lineHeight: '1.1'
              }}>
                {kpi.value}
              </div>
            </div>

            {/* Trend Label or Subtitle */}
            {kpi.trend?.show ? (
              <div style={{ 
                fontSize: '12px',
                color: '#9ca3af',
                fontWeight: '500'
              }}>
                {kpi.trend.label}
              </div>
            ) : kpi.subtitle && (
              <div style={{ 
                fontSize: '13px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {kpi.subtitle}
              </div>
            )}
          </div>
        );
      })}

      {/* Responsive Override */}
      <style jsx>{`
        @media (max-width: 1200px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default KPICards;
