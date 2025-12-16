// Customers View v5.0 - SIMPLIFIED LAYOUT
// Customer analytics and insights dashboard
// Clean, focused design with RFM hero and integrated table
//
// CHANGELOG:
// v5.0 (2025-12-16): Simplified layout redesign
//   - REMOVED: Sticky navigation bar
//   - REMOVED: Section titles (visual hierarchy via layout)
//   - REMOVED: At-Risk and Health KPI cards (info in header pills)
//   - NEW: HealthPill in header (matches RetentionPulse)
//   - NEW: HeroKPICards for New/Active clients with drilldown
//   - NEW: RFM Scatter Plot full-width hero treatment
//   - NEW: Integrated layout - Table + Charts side by side
// v4.3 (2025-12-16): At-Risk table integration
// v4.2 (2025-12-16): Optimized At-Risk section layout
// v4.1 (2025-12-16): Full-width layout
// v4.0 (2025-12-16): Intelligence Hub Redesign

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { Users as UsersIcon, UserPlus } from 'lucide-react';
import { calculateCustomerMetrics, getRFMCoordinates, getChurnHistogramData, getRetentionCohorts, getAcquisitionTrend } from '../utils/customerMetrics';
import HeroKPICard from '../components/ui/HeroKPICard';
import RetentionPulse from '../components/RetentionPulse';
import HealthPill from '../components/HealthPill';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { formatNumber } from '../utils/formatters';
import { isValidBrazilianMobile } from '../utils/phoneUtils';

// Lazy-load heavy modals and components
const CustomerProfileModal = lazy(() => import('../components/CustomerProfileModal'));
const NewCampaignModal = lazy(() => import('../components/campaigns/NewCampaignModal'));
const KPIDetailModal = lazy(() => import('../components/modals/KPIDetailModal'));
const CustomerTrendDrilldown = lazy(() => import('../components/drilldowns/CustomerTrendDrilldown'));
import { LazyRFMScatterPlot, LazyChurnHistogram, LazyNewClientsChart, ChartLoadingFallback } from '../utils/lazyCharts';
import { useContactTracking } from '../hooks/useContactTracking';

const Customers = ({ data }) => {
  // State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedKPI, setSelectedKPI] = useState(null); // For KPI drilldown modal

  // Campaign modal state
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [preSelectedCustomerIds, setPreSelectedCustomerIds] = useState([]);

  // Contact tracking for charts visualization
  const { contactedIds, pendingContacts, markContacted } = useContactTracking();

  // Derive welcome campaign contacts (campaign_type === 'welcome')
  const welcomeContactedIds = useMemo(() => {
    const ids = new Set();
    Object.entries(pendingContacts).forEach(([customerId, contact]) => {
      if (contact.campaign_type === 'welcome' || contact.campaign_type === 'post_visit') {
        ids.add(customerId);
      }
    });
    return ids;
  }, [pendingContacts]);

  // Derive returned customers (from contacts with status='returned')
  const returnedCustomerIds = useMemo(() => {
    const ids = new Set();
    Object.entries(pendingContacts).forEach(([customerId, contact]) => {
      if (contact.status === 'returned') {
        ids.add(customerId);
      }
    });
    return ids;
  }, [pendingContacts]);

  // 1. Calculate Base Metrics
  const metrics = useMemo(() => {
    if (!data || !data.sales || data.sales.length === 0) return null;
    return calculateCustomerMetrics(data.sales, data.rfm || [], data.customer || []);
  }, [data]);

  // 2. Prepare Intelligence Data
  const intelligence = useMemo(() => {
    if (!metrics) return null;
    return {
      rfm: getRFMCoordinates(metrics.activeCustomers),
      histogram: getChurnHistogramData(metrics.activeCustomers),
      retention: getRetentionCohorts(data.sales),
      acquisition: getAcquisitionTrend(metrics.activeCustomers)
    };
  }, [metrics, data]);

  // 2b. Customer spending map for revenue at risk calculation
  const customerSpending = useMemo(() => {
    if (!metrics?.activeCustomers) return {};
    const map = {};
    metrics.activeCustomers.forEach(c => {
      map[c.doc || c.id] = c.netTotal || 0;
    });
    return map;
  }, [metrics]);

  // 2c. Customer map for ID-to-customer lookups in charts
  const customerMap = useMemo(() => {
    if (!metrics?.allCustomers) return {};
    const map = {};
    metrics.allCustomers.forEach(c => {
      const id = c.doc || c.id;
      map[id] = c;
    });
    return map;
  }, [metrics]);

  // Handler to open customer profile from charts
  const handleOpenCustomerProfile = (customerId) => {
    const customer = customerMap[customerId];
    if (customer) {
      setSelectedCustomer(customer);
    }
  };

  // Handler for marking customer as contacted from charts
  const handleMarkContacted = useCallback((customerId, method) => {
    const customer = customerMap[customerId];
    markContacted(customerId, method, {
      customerName: customer?.name || null,
      riskLevel: customer?.riskLevel || null
    });
  }, [customerMap, markContacted]);

  // Handler for creating a campaign with pre-selected customers from chart modals
  const handleCreateCampaign = useCallback((customerIds) => {
    setPreSelectedCustomerIds(customerIds);
    setCampaignModalOpen(true);
  }, []);

  // Build audience segments for NewCampaignModal (includes pre-selected custom segment)
  const audienceSegments = useMemo(() => {
    if (!metrics?.activeCustomers) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Standard segments
    const atRisk = metrics.activeCustomers.filter(
      c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning'
    );
    const newCustomers = metrics.activeCustomers.filter(
      c => c.firstVisit && c.firstVisit >= thirtyDaysAgo
    );
    const healthy = metrics.activeCustomers.filter(c => c.riskLevel === 'Healthy');
    const withWallet = metrics.activeCustomers.filter(c => (c.walletBalance || 0) >= 10);
    const withPhone = metrics.activeCustomers.filter(c => isValidBrazilianMobile(c.phone));

    // RFM segments
    const vip = metrics.activeCustomers.filter(c => c.segment === 'VIP');
    const frequent = metrics.activeCustomers.filter(c => c.segment === 'Frequent');
    const promising = metrics.activeCustomers.filter(c => c.segment === 'Promising');
    const cooling = metrics.activeCustomers.filter(c => c.segment === 'Cooling');
    const inactive = metrics.activeCustomers.filter(c => c.segment === 'Inactive');

    // Custom segment from pre-selected IDs (if any)
    const custom = preSelectedCustomerIds.length > 0
      ? preSelectedCustomerIds.map(id => customerMap[id]).filter(Boolean)
      : [];

    return {
      atRisk,
      newCustomers,
      healthy,
      withWallet,
      withPhone,
      vip,
      frequent,
      promising,
      cooling,
      inactive,
      custom,
      all: withPhone
    };
  }, [metrics, preSelectedCustomerIds, customerMap]);

  // KPI Card Pills - Calculate contextual metrics for informative pills
  const kpiPills = useMemo(() => {
    if (!metrics) return {};

    // New customers (last 30 days) with welcome coverage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = metrics.activeCustomers.filter(c => c.firstVisit && c.firstVisit >= thirtyDaysAgo);
    const newWithWelcome = newCustomers.filter(c => welcomeContactedIds.has(String(c.doc))).length;
    const welcomePct = newCustomers.length > 0 ? Math.round((newWithWelcome / newCustomers.length) * 100) : 0;

    return {
      welcomePct,
      newCustomersTotal: newCustomers.length
    };
  }, [metrics, welcomeContactedIds]);

  // Calculate New Clients (last 30 days based on first visit)
  const newClientsCount = useMemo(() => {
    if (!metrics?.activeCustomers) return 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return metrics.activeCustomers.filter(c => {
      if (!c.firstVisit) return false;
      return c.firstVisit >= thirtyDaysAgo;
    }).length;
  }, [metrics]);

  // Generate sparkline data (last 7 weeks of new customers)
  const sparklineData = useMemo(() => {
    if (!metrics?.activeCustomers) return {};

    // Generate weekly new customer counts for sparkline
    const weeklyNewCustomers = [];
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const count = metrics.activeCustomers.filter(c => {
        if (!c.firstVisit) return false;
        return c.firstVisit >= weekStart && c.firstVisit < weekEnd;
      }).length;
      weeklyNewCustomers.push(count);
    }

    // Weekly active customer trend (approximate based on last visit)
    const weeklyActive = [];
    for (let i = 6; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const count = metrics.activeCustomers.filter(c => {
        if (!c.lastVisit) return false;
        return c.lastVisit <= weekEnd;
      }).length;
      weeklyActive.push(count);
    }

    return {
      newCustomers: weeklyNewCustomers,
      activeCustomers: weeklyActive
    };
  }, [metrics]);

  // KPI definitions for drilldown
  const kpiDefinitions = useMemo(() => ({
    newClients: {
      id: 'newClients',
      title: 'Novos Clientes',
      subtitle: 'Aquisição nas últimas 8 semanas',
      icon: UserPlus,
      color: 'purple',
      metricType: 'newClients'
    },
    activeClients: {
      id: 'activeClients',
      title: 'Clientes Ativos',
      subtitle: 'Evolução da base ativa',
      icon: UsersIcon,
      color: 'blue',
      metricType: 'activeClients'
    }
  }), []);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavpop-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header with RetentionPulse + HealthPill */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border-l-4 border-purple-500">
            <UsersIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Clientes
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Inteligência e análise comportamental
            </p>
          </div>
        </div>

        {/* Header Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <RetentionPulse data={intelligence?.retention} />
          <HealthPill
            healthRate={metrics.healthRate}
            activeCount={metrics.activeCount}
            atRiskCount={metrics.needsAttentionCount}
          />
        </div>
      </header>

      {/* Hero KPI Cards - New Clients + Active Clients */}
      <div className="grid grid-cols-2 gap-4">
        <HeroKPICard
          title="Novos Clientes"
          shortTitle="Novos"
          value={newClientsCount}
          displayValue={formatNumber(newClientsCount)}
          subtitle="Últimos 30 dias"
          icon={UserPlus}
          color="purple"
          sparklineData={sparklineData.newCustomers}
          onClick={() => setSelectedKPI(kpiDefinitions.newClients)}
          tooltip={kpiPills.newCustomersTotal > 0 ? `${kpiPills.welcomePct}% receberam boas-vindas` : undefined}
        />
        <HeroKPICard
          title="Clientes Ativos"
          shortTitle="Ativos"
          value={metrics.activeCount}
          displayValue={formatNumber(metrics.activeCount)}
          subtitle="Base ativa total"
          icon={UsersIcon}
          color="blue"
          sparklineData={sparklineData.activeCustomers}
          onClick={() => setSelectedKPI(kpiDefinitions.activeClients)}
        />
      </div>

      {/* RFM Scatter Plot - Full Width Hero */}
      <Suspense fallback={<ChartLoadingFallback height="h-[400px]" />}>
        <LazyRFMScatterPlot
          data={intelligence.rfm}
          contactedIds={contactedIds}
          pendingContacts={pendingContacts}
          onOpenCustomerProfile={handleOpenCustomerProfile}
          onMarkContacted={handleMarkContacted}
          onCreateCampaign={handleCreateCampaign}
        />
      </Suspense>

      {/* Integrated Layout: AtRiskTable + Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* At-Risk Customers Table - 3/5 width on desktop, spans 2 rows */}
        {metrics.needsAttentionCount > 0 && (
          <div className="lg:col-span-3 lg:row-span-2">
            <AtRiskCustomersTable
              customerMetrics={metrics}
              salesData={data.sales}
            />
          </div>
        )}

        {/* Secondary Charts - 2/5 width on desktop (or full if no at-risk) */}
        <div className={`${metrics.needsAttentionCount > 0 ? 'lg:col-span-2' : 'lg:col-span-5'}`}>
          <Suspense fallback={<ChartLoadingFallback height="h-48" />}>
            <LazyChurnHistogram
              data={intelligence.histogram}
              contactedIds={contactedIds}
              customerSpending={customerSpending}
              customerMap={customerMap}
              onOpenCustomerProfile={handleOpenCustomerProfile}
              onMarkContacted={handleMarkContacted}
              onCreateCampaign={handleCreateCampaign}
              compact
            />
          </Suspense>
        </div>

        <div className={`${metrics.needsAttentionCount > 0 ? 'lg:col-span-2' : 'lg:col-span-5'}`}>
          <Suspense fallback={<ChartLoadingFallback height="h-48" />}>
            <LazyNewClientsChart
              data={intelligence.acquisition}
              welcomeContactedIds={welcomeContactedIds}
              returnedCustomerIds={returnedCustomerIds}
              customerMap={customerMap}
              onOpenCustomerProfile={handleOpenCustomerProfile}
              onMarkContacted={handleMarkContacted}
              onCreateCampaign={handleCreateCampaign}
              compact
            />
          </Suspense>
        </div>
      </div>

      {/* KPI Drilldown Modal */}
      {selectedKPI && (
        <Suspense fallback={null}>
          <KPIDetailModal
            isOpen={!!selectedKPI}
            onClose={() => setSelectedKPI(null)}
            title={selectedKPI.title}
            subtitle={selectedKPI.subtitle}
            icon={selectedKPI.icon}
            color={selectedKPI.color}
          >
            <CustomerTrendDrilldown
              customers={metrics.activeCustomers}
              metricType={selectedKPI.metricType}
            />
          </KPIDetailModal>
        </Suspense>
      )}

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <CustomerProfileModal
            customer={selectedCustomer}
            sales={data.sales}
            onClose={() => setSelectedCustomer(null)}
          />
        </Suspense>
      )}

      {/* New Campaign Modal - for creating campaigns from chart insights */}
      {campaignModalOpen && audienceSegments && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <NewCampaignModal
            isOpen={campaignModalOpen}
            onClose={() => {
              setCampaignModalOpen(false);
              setPreSelectedCustomerIds([]);
            }}
            audienceSegments={audienceSegments}
            initialAudience={preSelectedCustomerIds.length > 0 ? 'custom' : null}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Customers;
