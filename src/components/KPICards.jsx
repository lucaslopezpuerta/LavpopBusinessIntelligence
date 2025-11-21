// KPICards.jsx v4.0 - TAILWIND MIGRATION + DARK MODE
// ✅ Full Tailwind CSS implementation
// ✅ Dark mode support with smooth transitions
// ✅ Responsive grid (1/2/3/9 columns)
// ✅ All math/metrics logic preserved
// ✅ Consistent with Lavpop Design System v2.0

import React, { useMemo } from 'react';
import { Activity, Users, AlertCircle, Heart, Droplet, Flame, UserPlus } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';

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
    console.log('\n=== NEW CUSTOMERS CALCULATION (KPICards v4.0) ===');
    console.log('View mode:', viewMode);
    
    if (!salesData || salesData.length === 0) {
      console.warn('⚠️ No sales data available');
      return { count: 0, weekOverWeek: null };
    }
    
    if (!businessMetrics?.windows) {
      console.warn('⚠️ No business metrics windows available');
      return { count: 0, weekOverWeek: null };
    }

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
    
    if (!currentWindow.start || !currentWindow.end || !previousWindow.start || !previousWindow.end) {
      console.error('❌ CRITICAL: Date objects missing from windows!');
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
      <div className="text-slate-600 dark:text-slate-400 p-4">
        Carregando KPIs...
      </div>
    );
  }
  
  console.log('\n=== KPI CARDS RENDER (v4.0) ===');
  console.log('View Mode:', viewMode);

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
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">
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
  
  const activeCount = customerMetrics.activeCount || 0;
  const atRiskCount = customerMetrics.atRiskCount || 0;
  const healthRate = customerMetrics.healthRate || 0;
  
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
    const isPositive = value > 0;
    const isNegative = value < 0;
    
    return {
      show: true,
      text: `${isPositive ? '+' : ''}${absValue.toFixed(1)}%`,
      color: isPositive ? '#55b03b' : isNegative ? '#dc2626' : '#6b7280'
    };
  };

  const getTimeSubtitle = () => {
    if (viewMode === 'current' && businessMetrics.windows?.currentWeek) {
      const days = businessMetrics.windows.currentWeek.daysElapsed || 1;
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    return '7 dias';
  };

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
      colorClass: 'text-lavpop-blue',
      bgClass: 'bg-lavpop-blue-100 dark:bg-lavpop-blue-900/30'
    },
    {
      id: 'services',
      title: 'Total de Ciclos',
      value: formatNumber(metricsSource.totalServices),
      trend: getTrendData(wow.totalServices),
      subtitle: getTimeSubtitle(),
      icon: Activity,
      colorClass: 'text-lavpop-blue',
      bgClass: 'bg-lavpop-blue-100 dark:bg-lavpop-blue-900/30'
    },
    {
      id: 'utilization',
      title: 'Utilização Geral',
      value: `${Math.round(metricsSource.totalUtilization || 0)}%`,
      trend: getTrendData(wow.utilization),
      subtitle: getTimeSubtitle(),
      icon: Flame,
      colorClass: 'text-amber-600 dark:text-amber-500',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30'
    },
    {
      id: 'wash',
      title: 'Lavagens',
      value: formatNumber(washCount),
      subtitle: `${washPercent}% do total`,
      trend: getTrendData(wow.washServices),
      icon: Droplet,
      colorClass: 'text-blue-600 dark:text-blue-500',
      bgClass: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      id: 'dry',
      title: 'Secagens',
      value: formatNumber(dryCount),
      subtitle: `${dryPercent}% do total`,
      trend: getTrendData(wow.dryServices),
      icon: Flame,
      colorClass: 'text-amber-600 dark:text-amber-500',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30'
    },
    {
      id: 'newclients',
      title: 'Novos Clientes',
      value: formatNumber(newClientsData.count),
      subtitle: getTimeSubtitle(),
      trend: getTrendData(newClientsData.weekOverWeek),
      icon: UserPlus,
      colorClass: 'text-lavpop-green',
      bgClass: 'bg-lavpop-green-100 dark:bg-lavpop-green-900/30'
    },
    {
      id: 'active',
      title: 'Clientes Ativos',
      value: formatNumber(activeCount),
      subtitle: 'Não perdidos',
      icon: Users,
      colorClass: 'text-lavpop-blue',
      bgClass: 'bg-lavpop-blue-100 dark:bg-lavpop-blue-900/30'
    },
    {
      id: 'atrisk',
      title: 'Clientes em Risco',
      value: formatNumber(atRiskCount),
      subtitle: 'Precisam atenção',
      icon: AlertCircle,
      colorClass: 'text-red-600 dark:text-red-500',
      bgClass: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      id: 'health',
      title: 'Taxa de Saúde',
      value: `${Math.round(healthRate)}%`,
      subtitle: 'Clientes saudáveis',
      icon: Heart,
      colorClass: 'text-lavpop-green',
      bgClass: 'bg-lavpop-green-100 dark:bg-lavpop-green-900/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9 gap-3 mb-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        
        return (
          <div
            key={kpi.id}
            className="
              bg-white dark:bg-slate-800 
              rounded-xl 
              border border-slate-200 dark:border-slate-700 
              p-3.5 
              transition-all duration-200 
              hover:shadow-lg hover:-translate-y-0.5
              flex flex-col
            "
          >
            {/* Header */}
            <div className="mb-2.5">
              <h3 className="
                text-[10px] 
                font-bold 
                text-slate-600 dark:text-slate-400 
                uppercase 
                tracking-wider 
                mb-2
              ">
                {kpi.title}
              </h3>
              
              <div className={`
                w-9 h-9 
                rounded-lg 
                ${kpi.bgClass}
                flex items-center justify-center
              `}>
                <Icon className={`w-5 h-5 ${kpi.colorClass}`} />
              </div>
            </div>

            {/* Value */}
            <div className="mb-1.5 flex-1">
              <div className={`
                text-[26px] 
                font-bold 
                ${kpi.colorClass}
                leading-none
              `}>
                {kpi.value}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-500 font-medium">
                {kpi.subtitle}
              </div>

              {/* WoW Badge */}
              {kpi.trend?.show && (
                <div 
                  className="
                    text-xs 
                    font-bold 
                    px-1.5 
                    py-0.5 
                    rounded 
                    tracking-wide
                    whitespace-nowrap
                  "
                  style={{
                    color: kpi.trend.color,
                    backgroundColor: `${kpi.trend.color}15`
                  }}
                >
                  {kpi.trend.text}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
