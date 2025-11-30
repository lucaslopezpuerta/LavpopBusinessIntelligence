// KPICardsGrid.jsx v1.1
// Restructured KPI display with visual hierarchy
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.1 (2025-11-30): Prop standardization & responsive fix
//   - Changed iconColor to color for consistency
//   - Improved responsive breakpoints (2→3→4→6 progression)
// v1.0 (2025-11-30): Initial implementation
//   - Hero cards for primary metrics (Revenue, Cycles, Utilization)
//   - Secondary cards in 2-column grid
//   - Clean, non-gradient design
//   - Reduced cognitive load (visual hierarchy)
//   - Preserved drill-down functionality

import React, { useState, useMemo } from 'react';
import {
  DollarSign, WashingMachine, Percent, Droplet, Flame,
  UserPlus, TrendingUp, Users, AlertCircle, Heart
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, getTrendData } from '../utils/formatters';
import { parseBrDate } from '../utils/dateUtils';
import HeroKPICard from './ui/HeroKPICard';
import SecondaryKPICard from './ui/SecondaryKPICard';
import KPIDetailModal from './modals/KPIDetailModal';
import FinancialDrilldown from './drilldowns/FinancialDrilldown';
import CustomerListDrilldown from './drilldowns/CustomerListDrilldown';
import MetricExplainerDrilldown from './drilldowns/MetricExplainerDrilldown';

// Helper to normalize document
function normalizeDoc(doc) {
  if (!doc) return '';
  const cleaned = String(doc).replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned.length <= 11) {
    return cleaned.padStart(11, '0');
  }
  return cleaned;
}

const KPICardsGrid = ({
  businessMetrics,
  customerMetrics,
  salesData,
  viewMode = 'complete',
  onNavigate
}) => {
  const [selectedKPI, setSelectedKPI] = useState(null);

  // Calculate new clients data
  const newClientsData = useMemo(() => {
    if (!salesData?.length || !businessMetrics?.windows) {
      return { count: 0, weekOverWeek: null };
    }

    const currentWindow = viewMode === 'current' && businessMetrics.windows.currentWeek
      ? businessMetrics.windows.currentWeek
      : businessMetrics.windows.weekly;

    const previousWindow = businessMetrics.windows.previousWeekly;

    if (!currentWindow?.start || !currentWindow?.end || !previousWindow?.start || !previousWindow?.end) {
      return { count: 0, weekOverWeek: null };
    }

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

    let currentPeriodNew = 0;
    let lastPeriodNew = 0;

    Object.values(customerFirstPurchase).forEach(firstDate => {
      if (firstDate >= currentWindow.start && firstDate <= currentWindow.end) {
        currentPeriodNew++;
      } else if (firstDate >= previousWindow.start && firstDate <= previousWindow.end) {
        lastPeriodNew++;
      }
    });

    let periodOverPeriodChange = null;
    if (lastPeriodNew > 0) {
      periodOverPeriodChange = ((currentPeriodNew - lastPeriodNew) / lastPeriodNew) * 100;
    } else if (currentPeriodNew > 0) {
      periodOverPeriodChange = 100;
    }

    return {
      count: currentPeriodNew,
      weekOverWeek: periodOverPeriodChange
    };
  }, [salesData, businessMetrics?.windows, viewMode]);

  // Loading state
  if (!businessMetrics || !customerMetrics) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Get metrics source based on view mode
  const metricsSource = viewMode === 'current' && businessMetrics.currentWeek
    ? businessMetrics.currentWeek
    : businessMetrics.weekly;

  if (!metricsSource) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Erro ao carregar métricas.
      </div>
    );
  }

  const wow = businessMetrics.weekOverWeek || {};
  const activeCount = customerMetrics.activeCount || 0;
  const atRiskCount = customerMetrics.atRiskCount || 0;
  const healthRate = customerMetrics.healthRate || 0;

  // Service breakdown
  const washCount = metricsSource.washServices || 0;
  const dryCount = metricsSource.dryServices || 0;
  const totalServices = washCount + dryCount;
  const washPercent = totalServices > 0 ? ((washCount / totalServices) * 100).toFixed(0) : 0;
  const dryPercent = totalServices > 0 ? ((dryCount / totalServices) * 100).toFixed(0) : 0;

  // Time subtitle
  const getTimeSubtitle = () => {
    if (viewMode === 'current' && businessMetrics.windows?.currentWeek) {
      const days = businessMetrics.windows.currentWeek.daysElapsed || 1;
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    return '7 dias';
  };

  // Modal handlers
  const handleCardClick = (kpi) => {
    if (kpi.drilldownType) {
      setSelectedKPI(kpi);
    }
  };

  const handleCloseModal = () => setSelectedKPI(null);

  const handleNavigate = (tabId) => {
    handleCloseModal();
    if (onNavigate) onNavigate(tabId);
  };

  // Get customers for drill-down
  const getDrilldownCustomers = (type) => {
    if (!customerMetrics?.activeCustomers) return [];

    switch (type) {
      case 'atrisk':
        return customerMetrics.activeCustomers
          .filter(c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning')
          .sort((a, b) => b.netTotal - a.netTotal);
      case 'newclients':
        return customerMetrics.activeCustomers
          .filter(c => c.totalVisits <= 2)
          .sort((a, b) => b.netTotal - a.netTotal);
      case 'active':
      default:
        return customerMetrics.activeCustomers
          .sort((a, b) => b.netTotal - a.netTotal);
    }
  };

  // Hero KPIs (primary metrics)
  const heroKPIs = [
    {
      id: 'revenue',
      title: 'Receita Líquida',
      value: metricsSource.netRevenue || 0,
      displayValue: formatCurrency(metricsSource.netRevenue),
      trend: getTrendData(wow.netRevenue),
      subtitle: getTimeSubtitle(),
      icon: DollarSign,
      color: 'green',
      drilldownType: 'financial',
      metricType: 'revenue'
    },
    {
      id: 'services',
      title: 'Total de Ciclos',
      value: metricsSource.totalServices || 0,
      displayValue: formatNumber(metricsSource.totalServices),
      trend: getTrendData(wow.totalServices),
      subtitle: getTimeSubtitle(),
      icon: WashingMachine,
      color: 'blue',
      drilldownType: 'financial',
      metricType: 'cycles'
    },
    {
      id: 'utilization',
      title: 'Utilização Geral',
      value: Math.round(metricsSource.totalUtilization || 0),
      displayValue: formatPercent(metricsSource.totalUtilization),
      trend: getTrendData(wow.utilization),
      subtitle: getTimeSubtitle(),
      icon: Percent,
      color: 'purple',
      drilldownType: 'explainer',
      metricType: 'utilization'
    }
  ];

  // Secondary KPIs (compact)
  const secondaryKPIs = [
    {
      id: 'wash',
      title: 'Lavagens',
      displayValue: formatNumber(washCount),
      subtitle: `${washPercent}% do total`,
      trend: getTrendData(wow.washServices),
      icon: Droplet,
      color: 'cyan',
      drilldownType: 'financial',
      metricType: 'cycles'
    },
    {
      id: 'dry',
      title: 'Secagens',
      displayValue: formatNumber(dryCount),
      subtitle: `${dryPercent}% do total`,
      trend: getTrendData(wow.dryServices),
      icon: Flame,
      color: 'orange',
      drilldownType: 'financial',
      metricType: 'cycles'
    },
    {
      id: 'newclients',
      title: 'Novos Clientes',
      displayValue: formatNumber(newClientsData.count),
      subtitle: getTimeSubtitle(),
      trend: getTrendData(newClientsData.weekOverWeek),
      icon: UserPlus,
      color: 'purple',
      drilldownType: 'customer',
      customerType: 'newclients'
    },
    {
      id: 'active',
      title: 'Clientes Ativos',
      displayValue: formatNumber(activeCount),
      subtitle: 'Não perdidos',
      icon: Users,
      color: 'blue',
      drilldownType: 'customer',
      customerType: 'active'
    },
    {
      id: 'atrisk',
      title: 'Em Risco',
      displayValue: formatNumber(atRiskCount),
      subtitle: 'Precisam atenção',
      icon: AlertCircle,
      color: 'red',
      drilldownType: 'customer',
      customerType: 'atrisk'
    },
    {
      id: 'health',
      title: 'Taxa de Saúde',
      displayValue: formatPercent(healthRate),
      subtitle: 'Clientes saudáveis',
      icon: Heart,
      color: 'green',
      drilldownType: 'explainer',
      metricType: 'health'
    }
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Hero KPI Cards - Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {heroKPIs.map(kpi => (
            <HeroKPICard
              key={kpi.id}
              title={kpi.title}
              value={kpi.value}
              displayValue={kpi.displayValue}
              subtitle={kpi.subtitle}
              trend={kpi.trend}
              icon={kpi.icon}
              color={kpi.color}
              onClick={() => handleCardClick(kpi)}
            />
          ))}
        </div>

        {/* Secondary KPI Cards - Compact Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {secondaryKPIs.map(kpi => (
            <SecondaryKPICard
              key={kpi.id}
              title={kpi.title}
              displayValue={kpi.displayValue}
              subtitle={kpi.subtitle}
              trend={kpi.trend}
              icon={kpi.icon}
              color={kpi.color}
              onClick={() => handleCardClick(kpi)}
            />
          ))}
        </div>
      </div>

      {/* Drill-down Modal */}
      <KPIDetailModal
        isOpen={!!selectedKPI}
        onClose={handleCloseModal}
        title={selectedKPI?.title}
      >
        {selectedKPI?.drilldownType === 'financial' && (
          <FinancialDrilldown
            salesData={salesData}
            metricType={selectedKPI.metricType}
            onNavigate={() => handleNavigate('intelligence')}
          />
        )}

        {selectedKPI?.drilldownType === 'customer' && (
          <CustomerListDrilldown
            customers={getDrilldownCustomers(selectedKPI.customerType)}
            type={selectedKPI.customerType}
            onNavigate={() => handleNavigate('customers')}
          />
        )}

        {selectedKPI?.drilldownType === 'explainer' && (
          <MetricExplainerDrilldown
            metricType={selectedKPI.metricType}
          />
        )}
      </KPIDetailModal>
    </>
  );
};

export default KPICardsGrid;
