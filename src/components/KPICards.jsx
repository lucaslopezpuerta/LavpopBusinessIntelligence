// KPICards.jsx v3.3.1 - Safer data access with fallbacks
// Fixed undefined data access when the viewMode prop is missing
// ✅ Supports both "complete" and "current" week views
// ✅ Safe fallback to weekly metrics if currentWeek unavailable
// ✅ Comprehensive error logging
//
// CHANGELOG:
// v3.3.1 (2025-11-19): HOTFIX
//   - Added safety checks for missing viewMode prop
//   - Added fallbacks for undefined currentWeek data
//   - Fixed utilization/wash/dry services access
//   - More detailed error logging
// v3.3 (2025-11-19): HYBRID VIEW SUPPORT

//businessMetrics.weekly              // LAST COMPLETE WEEK (Sun-Sat just ended)
//businessMetrics.currentWeek         // CURRENT PARTIAL WEEK (Sun-Today)
//businessMetrics.previousWeekly      // TWO WEEKS AGO


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

const KPICards = ({ businessMetrics, customerMetrics, salesData, viewMode = 'complete' }) => {
  const newClientsData = useMemo(() => {
    console.log('\n=== NEW CUSTOMERS CALCULATION (KPICards v3.3.1 HOTFIX) ===');
    console.log('View mode:', viewMode);
    
    if (!salesData || salesData.length === 0) {
      console.warn('⚠️ No sales data available');
      return { count: 0, weekOverWeek: null };
    }
    
    if (!businessMetrics?.windows) {
      console.warn('⚠️ No business metrics windows available');
      return { count: 0, weekOverWeek: null };
    }

    // ✅ HOTFIX: Safe window selection with fallback
    let currentWindow;
    if (viewMode === 'current' && businessMetrics.windows.currentWeek) {
      currentWindow = businessMetrics.windows.currentWeek;
      console.log('Using current week window');
    } else if (businessMetrics.windows.weekly) {
      currentWindow = businessMetrics.windows.weekly;
      console.log('Using complete week window (fallback or explicit)');
    } else {
      console.error('❌ No valid windows available!');
      return { count: 0, weekOverWeek: null };
    }
    
    const previousWindow = businessMetrics.windows.previousWeekly;
    
    if (!previousWindow) {
      console.error('❌ No previous window available!');
      return { count: 0, weekOverWeek: null };
    }
    
    console.log('Date windows retrieved:', {
      viewMode,
      currentWindow: {
        start: currentWindow.start ? currentWindow.start.toISOString() : 'MISSING!',
        end: currentWindow.end ? currentWindow.end.toISOString() : 'MISSING!',
        startDate: currentWindow.startDate,
        endDate: currentWindow.endDate,
        daysElapsed: currentWindow.daysElapsed
      },
      previousWindow: {
        start: previousWindow.start ? previousWindow.start.toISOString() : 'MISSING!',
        end: previousWindow.end ? previousWindow.end.toISOString() : 'MISSING!',
        startDate: previousWindow.startDate,
        endDate: previousWindow.endDate
      }
    });
    
    // ✅ Validate that Date objects exist
    if (!currentWindow.start || !currentWindow.end || !previousWindow.start || !previousWindow.end) {
      console.error('❌ CRITICAL: Date objects missing from windows!');
      console.error('Please update to businessMetrics v2.7 or later.');
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

    let currentPeriodNew = 0;
    let lastPeriodNew = 0;
    
    Object.values(customerFirstPurchase).forEach(firstDate => {
      if (firstDate >= currentWindow.start && firstDate <= currentWindow.end) {
        currentPeriodNew++;
      } else if (firstDate >= previousWindow.start && firstDate <= previousWindow.end) {
        lastPeriodNew++;
      }
    });
    
    console.log('New customers found:', {
      currentPeriod: currentPeriodNew,
      previousPeriod: lastPeriodNew
    });

    let periodOverPeriodChange = null;
    if (lastPeriodNew > 0) {
      periodOverPeriodChange = ((currentPeriodNew - lastPeriodNew) / lastPeriodNew) * 100;
    } else if (currentPeriodNew > 0) {
      periodOverPeriodChange = 100;
    }
    
    console.log('Period-over-period calculation:', {
      change: periodOverPeriodChange ? `${periodOverPeriodChange.toFixed(1)}%` : 'N/A'
    });
    
    console.log('=== END NEW CUSTOMERS CALCULATION ===\n');

    return {
      count: currentPeriodNew,
      weekOverWeek: periodOverPeriodChange
    };
  }, [salesData, businessMetrics?.windows, viewMode]);

  if (!businessMetrics || !customerMetrics) {
    return (
      <div style={{ color: '#6b7280', padding: '1rem' }}>
        Carregando KPIs...
      </div>
    );
  }
  
  console.log('\n=== KPI CARDS RENDER (v3.3.1 HOTFIX) ===');
  console.log('View Mode:', viewMode);
  console.log('Business Metrics Keys:', Object.keys(businessMetrics));
  console.log('Has weekly (LAST COMPLETE WEEK (Sun-Sat just ended)):', !!businessMetrics.weekly);
  console.log('Has currentWeek (CURRENT PARTIAL WEEK (Sun-Today)):', !!businessMetrics.currentWeek);

  // ✅ HOTFIX: Safe data source selection with detailed logging
  let metricsSource;
  if (viewMode === 'current') {
    if (businessMetrics.currentWeek) {
      metricsSource = businessMetrics.currentWeek;
      console.log('✅ Using currentWeek metrics');
    } else {
      console.warn('⚠️ currentWeek not available, falling back to weekly');
      metricsSource = businessMetrics.weekly;
    }
  } else {
    metricsSource = businessMetrics.weekly;
    console.log('✅ Using weekly metrics');
  }
  
  if (!metricsSource) {
    console.error('❌ CRITICAL: No metrics source available!');
    console.error('businessMetrics:', businessMetrics);
    return (
      <div style={{ color: '#dc2626', padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}>
        ⚠️ Erro ao carregar métricas. Verifique o console (F12) para detalhes.
      </div>
    );
  }
  
  const wow = businessMetrics.weekOverWeek || {};
  
  console.log('Metrics Source Data:', {
    netRevenue: metricsSource.netRevenue,
    totalServices: metricsSource.totalServices,
    totalUtilization: metricsSource.totalUtilization,
    washServices: metricsSource.washServices,
    dryServices: metricsSource.dryServices,
    activeDays: metricsSource.activeDays
  });
  
  console.log('Week-over-Week Data:', {
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
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
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

  // ✅ Get appropriate subtitle based on view mode
  const getTimeSubtitle = () => {
    if (viewMode === 'current' && businessMetrics.windows?.currentWeek) {
      const days = businessMetrics.windows.currentWeek.daysElapsed || 1;
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    return '7 dias';
  };

  // ✅ HOTFIX: Safe access with fallbacks
  const washCount = metricsSource.washServices || 0;
  const dryCount = metricsSource.dryServices || 0;
  const totalServices = washCount + dryCount;
  const washPercent = totalServices > 0 ? ((washCount / totalServices) * 100).toFixed(0) : 0;
  const dryPercent = totalServices > 0 ? ((dryCount / totalServices) * 100).toFixed(0) : 0;

  const kpis = [
    {
      id: 'revenue',
      title: 'Receita Líquida',
      value: formatCurrency(metricsSource.netRevenue),
      trend: getTrendData(wow.netRevenue),
      subtitle: getTimeSubtitle(),
      icon: Activity,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'services',
      title: 'Total de Ciclos',
      value: formatNumber(metricsSource.totalServices),
      trend: getTrendData(wow.totalServices),
      subtitle: getTimeSubtitle(),
      icon: Activity,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'utilization',
      title: 'Utilização Geral',
      value: `${Math.round(metricsSource.totalUtilization || 0)}%`,
      trend: getTrendData(wow.utilization),
      subtitle: getTimeSubtitle(),
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
      subtitle: getTimeSubtitle(),
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

            {/* Value */}
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

              {/* WoW Badge */}
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
