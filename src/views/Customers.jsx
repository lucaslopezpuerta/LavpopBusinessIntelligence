// Customers View v4.0 - INTELLIGENCE HUB REDESIGN
// Customer analytics and insights dashboard
// Directory moved to separate view for better UX
//
// CHANGELOG:
// v4.0 (2025-12-16): Intelligence Hub Redesign
//   - REMOVED: Directory section (now separate /diretorio route)
//   - NEW: RetentionPulse in header (replaces full chart)
//   - NEW: Asymmetric chart layout (RFM hero + 2 secondary)
//   - NEW: At-Risk Preview mode (compact cards, not full table)
//   - NEW: Sparkline data for KPI cards
//   - UPDATED: Section navigation (removed Diretório)
// v3.4.0 (2025-12-15): Chart-to-campaign integration
//   - NEW: onCreateCampaign handler opens NewCampaignModal with pre-selected customers
//   - NEW: Customers selected from chart modals can be added to new campaigns
//   - NEW: Dynamic custom audience segment for pre-selected customers
// v3.3.0 (2025-12-15): Interactive chart insights
//   - NEW: Charts now have clickable insights that open CustomerSegmentModal
//   - NEW: customerMap prop passed to charts for ID-to-customer lookups
//   - NEW: onOpenCustomerProfile, onMarkContacted, onCreateCampaign handlers

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { Users as UsersIcon, UserPlus, AlertTriangle, Heart, BarChart3, LayoutGrid, ChevronRight } from 'lucide-react';
import { calculateCustomerMetrics, getRFMCoordinates, getChurnHistogramData, getRetentionCohorts, getAcquisitionTrend } from '../utils/customerMetrics';
import SecondaryKPICard from '../components/ui/SecondaryKPICard';
import RetentionPulse from '../components/RetentionPulse';
import { formatNumber, formatPercent, formatCurrency } from '../utils/formatters';
import { isValidBrazilianMobile } from '../utils/phoneUtils';

// Lazy-load heavy modals
const CustomerProfileModal = lazy(() => import('../components/CustomerProfileModal'));
const NewCampaignModal = lazy(() => import('../components/campaigns/NewCampaignModal'));
import CustomerSectionNavigation from '../components/customers/CustomerSectionNavigation';
import { LazyRFMScatterPlot, LazyChurnHistogram, LazyNewClientsChart, ChartLoadingFallback } from '../utils/lazyCharts';
import { useContactTracking } from '../hooks/useContactTracking';

const Customers = ({ data }) => {
  // State
  const [selectedCustomer, setSelectedCustomer] = useState(null);

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

    // At-risk customers (At Risk + Churning) WITHOUT contact
    const atRiskCustomers = metrics.activeCustomers.filter(
      c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning'
    );
    const atRiskWithoutContact = atRiskCustomers.filter(
      c => !contactedIds.has(String(c.doc))
    ).length;

    // New customers (last 30 days) with welcome coverage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = metrics.activeCustomers.filter(c => c.firstVisit && c.firstVisit >= thirtyDaysAgo);
    const newWithWelcome = newCustomers.filter(c => welcomeContactedIds.has(String(c.doc))).length;
    const welcomePct = newCustomers.length > 0 ? Math.round((newWithWelcome / newCustomers.length) * 100) : 0;

    return {
      atRiskWithoutContact,
      welcomePct,
      newCustomersTotal: newCustomers.length
    };
  }, [metrics, contactedIds, welcomeContactedIds]);

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

  // At-Risk Preview Data (top 5 by value, not contacted)
  const atRiskPreview = useMemo(() => {
    if (!metrics) return [];

    return metrics.activeCustomers
      .filter(c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning')
      .filter(c => !contactedIds.has(String(c.doc)))
      .sort((a, b) => b.netTotal - a.netTotal)
      .slice(0, 5);
  }, [metrics, contactedIds]);

  // Calculate total revenue at risk (from preview)
  const revenueAtRisk = useMemo(() => {
    if (!atRiskPreview.length) return 0;
    return atRiskPreview.reduce((sum, c) => sum + (c.netTotal || 0), 0);
  }, [atRiskPreview]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavpop-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fade-in">

      {/* Header with Retention Pulse */}
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

        {/* Retention Pulse Widget */}
        <RetentionPulse data={intelligence?.retention} />
      </header>

      {/* Section Navigation - Sticky */}
      <CustomerSectionNavigation hasAtRisk={metrics.needsAttentionCount > 0} />

      {/* Section 1: Resumo - KPI Cards with Sparklines */}
      <section id="resumo-section" aria-labelledby="resumo-heading">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-lavpop-blue/10 dark:bg-lavpop-blue/20 flex items-center justify-center border-l-4 border-lavpop-blue">
            <LayoutGrid className="w-5 h-5 text-lavpop-blue" />
          </div>
          <div>
            <h2 id="resumo-heading" className="text-base font-bold text-slate-900 dark:text-white">
              Resumo de Clientes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visão geral da base de clientes
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SecondaryKPICard
            title="Novos Clientes"
            displayValue={formatNumber(newClientsCount)}
            subtitle="Últimos 30 dias"
            icon={UserPlus}
            color="purple"
            sparklineData={sparklineData.newCustomers}
            pill={kpiPills.newCustomersTotal > 0 ? {
              text: `${kpiPills.welcomePct}% boas-vindas`,
              variant: kpiPills.welcomePct >= 80 ? 'success' : 'warning'
            } : undefined}
          />
          <SecondaryKPICard
            title="Clientes Ativos"
            displayValue={formatNumber(metrics.activeCount)}
            subtitle="Não perdidos"
            icon={UsersIcon}
            color="blue"
            sparklineData={sparklineData.activeCustomers}
          />
          <SecondaryKPICard
            title="Em Risco"
            displayValue={formatNumber(metrics.needsAttentionCount)}
            subtitle="Risco + Crítico"
            icon={AlertTriangle}
            color="red"
            pill={kpiPills.atRiskWithoutContact > 0 ? {
              text: `${kpiPills.atRiskWithoutContact} sem contato`,
              variant: 'warning'
            } : undefined}
          />
          <SecondaryKPICard
            title="Taxa de Saúde"
            displayValue={formatPercent(metrics.healthRate)}
            subtitle="Clientes saudáveis"
            icon={Heart}
            color="green"
          />
        </div>
      </section>

      {/* Section 2: Ação Imediata - At-Risk Preview (Compact) */}
      {atRiskPreview.length > 0 && (
        <section id="acao-section" aria-labelledby="acao-heading">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl border border-red-200/50 dark:border-red-800/30 p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 id="acao-heading" className="text-base font-bold text-slate-900 dark:text-white">
                    {metrics.needsAttentionCount} Clientes em Risco
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Receita em risco: {formatCurrency(revenueAtRisk)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCreateCampaign(atRiskPreview.map(c => c.doc))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Contatar Todos
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Cards */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {atRiskPreview.map((customer) => (
                <button
                  key={customer.doc}
                  onClick={() => setSelectedCustomer(customer)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all min-w-[100px]"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center border-2 border-red-200 dark:border-red-800">
                    <span className="text-sm font-bold text-red-700 dark:text-red-300">
                      {customer.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[90px]">
                      {customer.name?.split(' ')[0] || 'Cliente'}
                    </p>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(customer.netTotal)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {customer.daysSinceLastVisit || 0}d
                    </p>
                  </div>
                </button>
              ))}

              {/* Show remaining count */}
              {metrics.needsAttentionCount > 5 && (
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl min-w-[80px] min-h-[120px]">
                  <span className="text-xl font-bold text-slate-600 dark:text-slate-300">
                    +{metrics.needsAttentionCount - 5}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    mais
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Análise - Asymmetric Chart Layout */}
      <section id="analise-section" aria-labelledby="analise-heading">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border-l-4 border-purple-500">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 id="analise-heading" className="text-base font-bold text-slate-900 dark:text-white">
              Análise Comportamental
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Segmentação RFM e tendências de aquisição
            </p>
          </div>
        </div>

        {/* Asymmetric Grid: RFM Hero (60%) + 2 Secondary (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* RFM Scatter Plot - Hero Chart (3/5 width = 60%) */}
          <div className="lg:col-span-3 h-full">
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
          </div>

          {/* Secondary Charts Stack (2/5 width = 40%) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex-1">
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
            <div className="flex-1">
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
        </div>
      </section>

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
