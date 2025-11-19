// KPICards.jsx v3.2 - DASHBOARD VALIDATION WITH COMPREHENSIVE LOGGING
// ✅ FIXED: Works with businessMetrics v2.6 (includes Date objects)
// ✅ Comprehensive console logging for validation
// ✅ Uses shared date windows from businessMetrics (consistent with other KPIs)
// ✅ WoW badges in bottom-right (no overlap)
// ✅ Responsive grid with media queries
// ✅ All font sizes consistent
//
// CHANGELOG:
// v3.2 (2025-11-19): VALIDATION RELEASE
//   - Added comprehensive console logging for all KPIs
//   - Added New Customers calculation debugging
//   - Validates date window access
//   - Logs all week-over-week calculations
//   - Reports any data inconsistencies
// v3.1 (2025-11-16): Fixed New Customers WoW to use shared date windows
// v3.0 (2025-11-16): Responsive grid + bottom-right badges
// v2.4 (2025-11-15): Perfect font consistency

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
    console.log('\n=== NEW CUSTOMERS CALCULATION (KPICards v3.2) ===');
    
    if (!salesData || salesData.length === 0) {
      console.warn('⚠️ No sales data available');
      return { count: 0, weekOverWeek: null };
    }
    
    if (!businessMetrics?.windows) {
      console.warn('⚠️ No business metrics windows available');
      return { count: 0, weekOverWeek: null };
    }

    // ✅ USE SAME DATE WINDOWS AS ALL OTHER KPIS
    const currentWeek = businessMetrics.windows.weekly;
    const previousWeek = businessMetrics.windows.previousWeekly;
    
    console.log('Date windows retrieved:', {
      currentWeek: {
        start: currentWeek.start ? currentWeek.start.toISOString() : 'MISSING!',
        end: currentWeek.end ? currentWeek.end.toISOString() : 'MISSING!',
        startDate: currentWeek.startDate,
        endDate: currentWeek.endDate
      },
      previousWeek: {
        start: previousWeek.start ? previousWeek.start.toISOString() : 'MISSING!',
        end: previousWeek.end ? previousWeek.end.toISOString() : 'MISSING!',
        startDate: previousWeek.startDate,
        endDate: previousWeek.endDate
      }
    });
    
    // ✅ Validate that Date objects exist
    if (!currentWeek.start || !currentWeek.end || !previousWeek.start || !previousWeek.end) {
      console.error('❌ CRITICAL: Date objects missing from windows!');
      console.error('This means businessMetrics.js is not returning start/end Date objects.');
      console.error('Please update to businessMetrics v2.6 or later.');
      return { count: 0, weekOverWeek: null };
    }

    const customerFirstPurchase = {};
    let parsedCount = 0;
    let validDateCount = 0;
    let validCPFCount = 0;
    
    salesData.forEach(row => {
      const dateStr = row.Data || row.Data_Hora || row.date;
      if (!dateStr) return;
      
      parsedCount++;
      const saleDate = parseBrDate(dateStr);
      if (!saleDate) return;
      
      validDateCount++;
      const cpf = normalizeDoc(row.Doc_Cliente || row.document || row.doc);
      if (!cpf) return;
      
      validCPFCount++;
      if (!customerFirstPurchase[cpf] || saleDate < customerFirstPurchase[cpf]) {
        customerFirstPurchase[cpf] = saleDate;
      }
    });
    
    console.log('Sales data parsing:', {
      totalRows: salesData.length,
      rowsWithDates: parsedCount,
      validDates: validDateCount,
      validCPFs: validCPFCount,
      uniqueCustomers: Object.keys(customerFirstPurchase).length
    });

    let currentWeekNew = 0;
    let lastWeekNew = 0;
    let currentWeekCustomers = [];
    let lastWeekCustomers = [];
    
    Object.entries(customerFirstPurchase).forEach(([cpf, firstDate]) => {
      if (firstDate >= currentWeek.start && firstDate <= currentWeek.end) {
        currentWeekNew++;
        currentWeekCustomers.push({ cpf, date: firstDate.toISOString().split('T')[0] });
      } else if (firstDate >= previousWeek.start && firstDate <= previousWeek.end) {
        lastWeekNew++;
        lastWeekCustomers.push({ cpf, date: firstDate.toISOString().split('T')[0] });
      }
    });
    
    console.log('New customers found:', {
      currentWeek: currentWeekNew,
      previousWeek: lastWeekNew,
      currentWeekSample: currentWeekCustomers.slice(0, 3),
      previousWeekSample: lastWeekCustomers.slice(0, 3)
    });

    let weekOverWeekChange = null;
    if (lastWeekNew > 0) {
      weekOverWeekChange = ((currentWeekNew - lastWeekNew) / lastWeekNew) * 100;
    } else if (currentWeekNew > 0) {
      weekOverWeekChange = 100;
    }
    
    console.log('Week-over-week calculation:', {
      change: weekOverWeekChange ? `${weekOverWeekChange.toFixed(1)}%` : 'N/A',
      formula: `((${currentWeekNew} - ${lastWeekNew}) / ${lastWeekNew}) × 100`
    });
    
    console.log('=== END NEW CUSTOMERS CALCULATION ===\n');

    return {
      count: currentWeekNew,
      weekOverWeek: weekOverWeekChange
    };
  }, [salesData, businessMetrics?.windows]);

  if (!businessMetrics || !customerMetrics) {
    return (
      <div style={{ color: '#6b7280', padding: '1rem' }}>
        Carregando KPIs...
      </div>
    );
  }
  
  console.log('\n=== KPI CARDS RENDER (v3.2) ===');
  console.log('Business Metrics Available:', !!businessMetrics);
  console.log('Customer Metrics Available:', !!customerMetrics);

  const weekly = businessMetrics.weekly || {};
  const wow = businessMetrics.weekOverWeek || {};
  
  console.log('Current Week Metrics:', {
    netRevenue: weekly.netRevenue,
    totalServices: weekly.totalServices,
    utilization: weekly.totalUtilization,
    washServices: weekly.washServices,
    dryServices: weekly.dryServices
  });
  
  console.log('Week-over-Week Changes:', {
    revenue: wow.netRevenue,
    services: wow.totalServices,
    utilization: wow.utilization,
    wash: wow.washServices,
    dry: wow.dryServices
  });
  
  const activeCount = customerMetrics.activeCount || 0;
  const atRiskCount = customerMetrics.atRiskCount || 0;
  const healthRate = customerMetrics.healthRate || 0;
  
  console.log('Customer Metrics:', {
    active: activeCount,
    atRisk: atRiskCount,
    healthRate: `${healthRate.toFixed(1)}%`
  });
  
  console.log('=== END KPI CARDS RENDER ===\n');

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
      subtitle: 'Esta semana',
      icon: Activity,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'services',
      title: 'Total de Ciclos',
      value: formatNumber(weekly.totalServices || 0),
      trend: getTrendData(wow.totalServices),
      subtitle: 'Esta semana',
      icon: Activity,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'utilization',
      title: 'Utilização Geral',
      value: `${Math.round(weekly.totalUtilization || 0)}%`,
      trend: getTrendData(wow.utilization),
      subtitle: 'Esta semana',
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
      // Responsive grid: 9 cols on ultra-wide (>1400px), 3x3 on desktop (>768px), 1 col on mobile
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '0.75rem',
      marginBottom: '0.75rem'
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
              padding: '0.875rem',
              transition: 'all 0.2s',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
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
            {/* Header with Title and Icon */}
            <div style={{ marginBottom: '0.625rem' }}>
              <h3 style={{ 
                fontSize: '10px',
                fontWeight: '700',
                color: COLORS.gray,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: 0,
                marginBottom: '0.5rem'
              }}>
                {kpi.title}
              </h3>
              
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: kpi.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon style={{ width: '19px', height: '19px', color: kpi.color }} />
              </div>
            </div>

            {/* Value - No overlap with badge now */}
            <div style={{ marginBottom: '0.375rem', flex: 1 }}>
              <div style={{ 
                fontSize: '26px',
                fontWeight: '700',
                color: kpi.color,
                lineHeight: '1.1'
              }}>
                {kpi.value}
              </div>
            </div>

            {/* Footer: Subtitle + WoW Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <div style={{ 
                fontSize: '11px',
                color: '#9ca3af',
                fontWeight: '500'
              }}>
                {kpi.subtitle}
              </div>

              {/* ✅ WoW Badge - Bottom Right (no overlap) */}
              {kpi.trend?.show && (
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: kpi.trend.color,
                  background: `${kpi.trend.color}15`,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  letterSpacing: '0.3px',
                  whiteSpace: 'nowrap'
                }}>
                  {kpi.trend.text}
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Responsive Grid Styles */}
      <style>{`
        /* Ultra-wide screens: 9 columns */
        @media (min-width: 1600px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(9, 1fr) !important;
          }
        }
        
        /* Desktop (1080p): 3x3 grid */
        @media (min-width: 992px) and (max-width: 1599px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        
        /* Tablet: 2 columns */
        @media (min-width: 768px) and (max-width: 991px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        /* Mobile: 1 column */
        @media (max-width: 767px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default KPICards;
