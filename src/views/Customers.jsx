// Customers View v5.14 - Layout Optimization
// Customer analytics and insights dashboard
// Clean, focused design with logical information flow
//
// CHANGELOG:
// v5.14 (2026-01-15): Layout optimization
//   - MOVED: VisitHeatmap relocated to Section 2, paired with AcquisitionCard
//   - CHANGED: AcquisitionCard + VisitHeatmap now side-by-side (1/2 + 1/2)
//   - CHANGED: RFMScatterPlot now full width in Section 5
//   - Better information flow: acquisition + visit patterns together at top
// v5.13 (2026-01-15): Unified AcquisitionCard component
//   - NEW: AcquisitionCard replaces CleanKPICard + NewClientsChart
//   - Eliminates redundant "total" display (hero metric is the single source)
//   - Hero section: Large metric with animated sparkline
//   - Status pills: Welcome %, week trend, return rate
//   - Integrated bar chart with same touch interactions
//   - Action CTA for pending welcomes (conditional)
//   - Soft Dashboard aesthetic with subtle purple gradient
// v5.12 (2026-01-15): Fix ChurnHistogram layout when FrequencyAlert hidden
//   - FIXED: ChurnHistogram now expands to full width when FrequencyDegradationAlert is not shown
//   - Dynamic grid: lg:grid-cols-2 when both shown, single column when only ChurnHistogram
//   - Prevents half-width chart when alert condition not met
// v5.11 (2026-01-15): Story-driven layout reorganization
//   - RESTRUCTURED: Layout now follows user's information journey:
//     1. Overview (Header + HealthPill)
//     2. Acquisition (Novos KPI + NewClientsChart)
//     3. Conversion (FirstVisitConversion + RetentionCard)
//     4. Risk Management (FrequencyAlert + ChurnHistogram + AtRiskTable)
//     5. Deep Dive (RFM Scatter + VisitHeatmap)
//   - REMOVED: "Clientes Ativos" KPI card (redundant with HealthPill breakdown)
//   - MOVED: NewClientsChart up to pair with acquisition KPI
//   - MOVED: RetentionCard up to pair with FirstVisitConversionCard
//   - MOVED: RFM Scatter to bottom (detailed analytics section)
//   - GROUPED: All risk-related components together
// v5.10 (2026-01-14): Phase 15 - Fix welcome campaign comparison data source
//   - NEW: api.contacts.getWelcomeHistory() fetches ALL historical welcome contacts
//   - FIXED: Welcome comparison now uses welcomeHistoryIds (all history) instead of
//     welcomeContactedIds (pending only) for accurate conversion analysis
//   - Verified: Core metrics (82%, 31/38, 6 pending) match verification script
// v5.9 (2026-01-13): Phase 14 - New customer behavior components
//   - NEW: FirstVisitConversionCard - Track 1st→2nd visit conversion rate
//   - NEW: FrequencyDegradationAlert - Early warning for slipping visit patterns
//   - NEW: getFirstVisitConversion() and getFrequencyDegradation() functions
//   - NEW: Welcome campaign comparison (with/without lift)
//   - NEW: Action buttons for pending customers and modal integration
// v5.8 (2026-01-13): Enhanced HealthPill with trend and breakdown
//   - NEW: Health rate trend indicator (current vs 30 days ago)
//   - NEW: Risk breakdown (Healthy/Monitor/At Risk/Churning/New)
//   - NEW: "Ver Clientes em Risco" action button opens modal
//   - NEW: CustomerSegmentModal for at-risk customers
// v5.7 (2026-01-13): Removed RetentionPulse header pill
//   - REMOVED: RetentionPulse component from header (showed 53% from old algorithm)
//   - REMOVED: getRetentionCohorts() usage (replaced by getRetentionMetrics)
//   - RetentionCard (38%) is now the sole retention metric display
//   - HealthPill remains for quick health status
// v5.6 (2026-01-12): State-of-the-art Visit Heatmap
//   - NEW: VisitHeatmap component with 7×15 grid (8h-23h business hours)
//   - NEW: Segment toggle: Todos | Fiéis (VIP+Frequente) | Novos (Novato)
//   - NEW: Non-linear quantile color scale to highlight bottlenecks
//   - Insight: "Do loyalists prefer quiet Tuesday mornings while new users crowd weekends?"
// v5.5 (2026-01-12): Pull-to-refresh support
//   - Added PullToRefreshWrapper for mobile swipe-to-refresh gesture
//   - Accepts onDataChange prop for refresh callback
// v5.4 (2026-01-12): Removed swipe view navigation callbacks
//   - REMOVED: onChildSwipeStart/End props (no longer needed)
//   - Mobile navigation now exclusively via bottom nav bar + side menu
//   - Row swipe actions (call/WhatsApp) work without conflicts
// v5.2 (2026-01-09): Fix mobile sheet callback chain
//   - FIXED: handleOpenCustomerProfile now wrapped in useCallback with [customerMap] dependency
//   - This ensures stable callback reference for MobileTooltipSheet "Ver Perfil" button
//   - Root cause: unstable callback caused modal not to open from mobile bottom sheet
// v5.1 (2025-12-23): Fixed empty tab rendering
//   - Replaced tiny spinner with CustomersLoadingSkeleton
//   - Prevents "empty tab" appearance during data loading
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

import React, { useState, useMemo, useCallback, useEffect, Suspense, lazy } from 'react';
import { Users as UsersIcon, UserPlus, Crown, Sparkles, AlertTriangle, Mail, UserX, TrendingDown } from 'lucide-react';
import { calculateCustomerMetrics, getRFMCoordinates, getChurnHistogramData, getRetentionMetrics, getAcquisitionTrend, getHealthTrend, getFirstVisitConversion, getFrequencyDegradation } from '../utils/customerMetrics';
// Note: CleanKPICard replaced by AcquisitionCard in v5.13
import HealthPill from '../components/HealthPill';
import RetentionCard from '../components/RetentionCard';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { formatNumber } from '../utils/formatters';
import { isValidBrazilianMobile } from '../utils/phoneUtils';

// Lazy-load heavy modals and components
const CustomerProfileModal = lazy(() => import('../components/CustomerProfileModal'));
const NewCampaignModal = lazy(() => import('../components/campaigns/NewCampaignModal'));
const KPIDetailModal = lazy(() => import('../components/modals/KPIDetailModal'));
const CustomerTrendDrilldown = lazy(() => import('../components/drilldowns/CustomerTrendDrilldown'));
const CustomerSegmentModal = lazy(() => import('../components/modals/CustomerSegmentModal'));
const FirstVisitConversionCard = lazy(() => import('../components/FirstVisitConversionCard'));
const FrequencyDegradationAlert = lazy(() => import('../components/FrequencyDegradationAlert'));
import { LazyRFMScatterPlot, LazyChurnHistogram, LazyNewClientsChart, LazyVisitHeatmap, LazyAcquisitionCard, ChartLoadingFallback } from '../utils/lazyCharts';
import { useContactTracking } from '../hooks/useContactTracking';
import { api } from '../utils/apiService';
import { CustomersLoadingSkeleton } from '../components/ui/Skeleton';
import PullToRefreshWrapper from '../components/ui/PullToRefreshWrapper';

const Customers = ({ data, onDataChange }) => {
  // State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedKPI, setSelectedKPI] = useState(null); // For KPI drilldown modal

  // Campaign modal state
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [preSelectedCustomerIds, setPreSelectedCustomerIds] = useState([]);

  // Retention re-engage modal state
  const [retentionModalOpen, setRetentionModalOpen] = useState(false);
  const [retentionModalSegment, setRetentionModalSegment] = useState(null); // 'loyalists' | 'new'
  const [retentionModalCustomers, setRetentionModalCustomers] = useState([]);

  // Health at-risk modal state (from HealthPill)
  const [healthAtRiskModalOpen, setHealthAtRiskModalOpen] = useState(false);

  // First visit conversion modal states
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [welcomeModalCustomers, setWelcomeModalCustomers] = useState([]);
  const [lostCustomersModalOpen, setLostCustomersModalOpen] = useState(false);
  const [lostCustomersModalData, setLostCustomersModalData] = useState([]);

  // Frequency degradation modal state
  const [degradationModalOpen, setDegradationModalOpen] = useState(false);
  const [degradationModalCustomers, setDegradationModalCustomers] = useState([]);

  // Welcome history IDs (ALL historical welcome contacts for conversion analysis)
  const [welcomeHistoryIds, setWelcomeHistoryIds] = useState(new Set());

  // Contact tracking for charts visualization
  const { contactedIds, pendingContacts, markContacted } = useContactTracking();

  // Fetch ALL historical welcome contacts for accurate conversion analysis
  // This is different from pendingContacts which only has active pending/queued contacts
  useEffect(() => {
    const loadWelcomeHistory = async () => {
      try {
        const records = await api.contacts.getWelcomeHistory();
        setWelcomeHistoryIds(new Set(records.map(r => r.customer_id)));
      } catch (err) {
        console.error('Failed to load welcome history:', err);
      }
    };
    loadWelcomeHistory();
  }, []);

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

    // Build customerMap first for retention metrics
    const tempCustomerMap = {};
    metrics.allCustomers.forEach(c => {
      const id = c.doc || c.id;
      tempCustomerMap[id] = c;
    });

    return {
      rfm: getRFMCoordinates(metrics.activeCustomers),
      histogram: getChurnHistogramData(metrics.activeCustomers),
      retentionMetrics: getRetentionMetrics(data.sales, tempCustomerMap),
      acquisition: getAcquisitionTrend(metrics.activeCustomers),
      // Phase 14: New customer behavior insights
      // Use welcomeHistoryIds (ALL historical) instead of welcomeContactedIds (pending only)
      // This ensures accurate welcome campaign effectiveness measurement
      firstVisitConversion: getFirstVisitConversion(data.sales, tempCustomerMap, welcomeHistoryIds),
      frequencyDegradation: getFrequencyDegradation(data.sales, tempCustomerMap, {
        focusSegments: ['VIP', 'Frequente']
      })
    };
  }, [metrics, data, welcomeHistoryIds]);

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

  // 2d. Health trend calculation (current vs 30 days ago)
  const healthTrend = useMemo(() => {
    if (!metrics || !data?.sales) return { current: 0, previous: 0, trend: 0 };
    return getHealthTrend(metrics, data.sales, data.rfm || [], data.customer || []);
  }, [metrics, data]);

  // 2e. At-risk customers list for HealthPill modal
  const atRiskCustomers = useMemo(() => {
    if (!metrics?.activeCustomers) return [];
    return metrics.activeCustomers
      .filter(c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning')
      .sort((a, b) => (b.netTotal || 0) - (a.netTotal || 0)); // Sort by revenue (highest first)
  }, [metrics]);

  // Handler to open customer profile from charts
  // Wrapped in useCallback for stable reference (required for mobile sheet callback chain)
  const handleOpenCustomerProfile = useCallback((customerId) => {
    const customer = customerMap[customerId];
    if (customer) {
      setSelectedCustomer(customer);
    }
  }, [customerMap]);

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

  // Handler for opening retention segment modal (from RetentionCard re-engage buttons)
  const handleOpenRetentionSegment = useCallback((segment, customers) => {
    setRetentionModalSegment(segment);
    setRetentionModalCustomers(customers);
    setRetentionModalOpen(true);
  }, []);

  // Handler for opening at-risk modal from HealthPill
  const handleOpenAtRiskModal = useCallback(() => {
    setHealthAtRiskModalOpen(true);
  }, []);

  // Handlers for FirstVisitConversionCard
  const handleSendWelcomeToCustomers = useCallback((customers) => {
    setWelcomeModalCustomers(customers);
    setWelcomeModalOpen(true);
  }, []);

  const handleOpenLostCustomersModal = useCallback((customers) => {
    setLostCustomersModalData(customers);
    setLostCustomersModalOpen(true);
  }, []);

  // Handler for FrequencyDegradationAlert
  const handleContactDegradingCustomers = useCallback((customers) => {
    setDegradationModalCustomers(customers);
    setDegradationModalOpen(true);
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
    return <CustomersLoadingSkeleton />;
  }

  return (
    <PullToRefreshWrapper onRefresh={onDataChange}>
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
          <HealthPill
            healthRate={metrics.healthRate}
            activeCount={metrics.activeCount}
            atRiskCount={metrics.needsAttentionCount}
            trend={healthTrend.trend}
            breakdown={{
              healthy: metrics.healthyCount,
              monitor: metrics.monitorCount,
              atRisk: metrics.atRiskCount,
              churning: metrics.churningCount,
              newCustomer: metrics.newCustomerCount
            }}
            atRiskCustomers={atRiskCustomers}
            onOpenAtRiskModal={handleOpenAtRiskModal}
          />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: ACQUISITION + VISIT PATTERNS
          "How are we getting new customers?" + "When do they visit?"
          Side-by-side: AcquisitionCard + VisitHeatmap
          ═══════════════════════════════════════════════════════════════════ */}
      <section aria-label="Aquisição e Padrões de Visita">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Acquisition Card - New customer metrics + daily chart */}
          <Suspense fallback={<ChartLoadingFallback height="h-96" />}>
            <LazyAcquisitionCard
              data={intelligence.acquisition}
              totalNewCustomers={newClientsCount}
              sparklineData={sparklineData.newCustomers}
              welcomeContactedIds={welcomeContactedIds}
              returnedCustomerIds={returnedCustomerIds}
              customerMap={customerMap}
              onOpenCustomerProfile={handleOpenCustomerProfile}
              onMarkContacted={handleMarkContacted}
              onCreateCampaign={handleCreateCampaign}
              onOpenKPIDrilldown={() => setSelectedKPI(kpiDefinitions.newClients)}
            />
          </Suspense>

          {/* Visit Heatmap - Day × Hour patterns */}
          <Suspense fallback={<ChartLoadingFallback height="h-96" />}>
            <LazyVisitHeatmap
              salesData={data.sales}
              customerMap={customerMap}
            />
          </Suspense>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: NEW CUSTOMER CONVERSION
          "Are new customers becoming regulars?"
          ═══════════════════════════════════════════════════════════════════ */}
      <section aria-label="Conversão de Novos Clientes">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stage 1: Initial conversion (1st → 2nd visit) */}
          <Suspense fallback={<ChartLoadingFallback height="h-64" />}>
            <FirstVisitConversionCard
              data={intelligence.firstVisitConversion}
              onSendWelcome={handleSendWelcomeToCustomers}
              onOpenLostCustomers={handleOpenLostCustomersModal}
            />
          </Suspense>

          {/* Stage 2: Ongoing retention (sustained engagement) */}
          <RetentionCard
            data={intelligence.retentionMetrics}
            onOpenSegmentModal={handleOpenRetentionSegment}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: RISK MANAGEMENT
          "Who needs attention right now?"
          ═══════════════════════════════════════════════════════════════════ */}
      <section aria-label="Gestão de Risco">
        {/* Early warning alerts + distribution chart */}
        {(() => {
          const showDegradationAlert = intelligence.frequencyDegradation?.count >= 3 || intelligence.frequencyDegradation?.priorityCount >= 1;
          return (
            <div className={`grid grid-cols-1 ${showDegradationAlert ? 'lg:grid-cols-2' : ''} gap-6 mb-6`}>
              {/* Frequency Degradation Alert - Conditional early warning */}
              {showDegradationAlert && (
                <Suspense fallback={<ChartLoadingFallback height="h-64" />}>
                  <FrequencyDegradationAlert
                    data={intelligence.frequencyDegradation}
                    maxPreview={3}
                    onContactCustomers={handleContactDegradingCustomers}
                    onOpenCustomerProfile={handleOpenCustomerProfile}
                  />
                </Suspense>
              )}

              {/* Churn Histogram - Days since last visit distribution */}
              <Suspense fallback={<ChartLoadingFallback height="h-64" />}>
                <LazyChurnHistogram
                  data={intelligence.histogram}
                  contactedIds={contactedIds}
                  customerSpending={customerSpending}
                  customerMap={customerMap}
                  onOpenCustomerProfile={handleOpenCustomerProfile}
                  onMarkContacted={handleMarkContacted}
                  onCreateCampaign={handleCreateCampaign}
                />
              </Suspense>
            </div>
          );
        })()}

        {/* At-Risk Customers Table - Full width action list */}
        {metrics.needsAttentionCount > 0 && (
          <AtRiskCustomersTable
            customerMetrics={metrics}
            salesData={data.sales}
          />
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5: DEEP DIVE ANALYTICS
          "Customer segmentation for power users"
          ═══════════════════════════════════════════════════════════════════ */}
      <section aria-label="Análise Detalhada">
        {/* RFM Scatter Plot - Full width customer segmentation */}
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
      </section>

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

      {/* Retention Re-engage Modal - for overdue customers from RetentionCard */}
      {retentionModalOpen && retentionModalCustomers.length > 0 && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <CustomerSegmentModal
            isOpen={retentionModalOpen}
            onClose={() => {
              setRetentionModalOpen(false);
              setRetentionModalSegment(null);
              setRetentionModalCustomers([]);
            }}
            title={retentionModalSegment === 'loyalists' ? 'Clientes Fiéis Atrasados' : 'Clientes Novos Atrasados'}
            subtitle="Clientes que não voltaram há 21+ dias"
            icon={retentionModalSegment === 'loyalists' ? Crown : Sparkles}
            color={retentionModalSegment === 'loyalists' ? 'amber' : 'purple'}
            customers={retentionModalCustomers}
            audienceType="retention"
            contactedIds={contactedIds}
            onOpenCustomerProfile={handleOpenCustomerProfile}
            onMarkContacted={handleMarkContacted}
            onCreateCampaign={handleCreateCampaign}
          />
        </Suspense>
      )}

      {/* Health At-Risk Modal - for at-risk customers from HealthPill */}
      {healthAtRiskModalOpen && atRiskCustomers.length > 0 && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <CustomerSegmentModal
            isOpen={healthAtRiskModalOpen}
            onClose={() => setHealthAtRiskModalOpen(false)}
            title="Clientes em Risco"
            subtitle="Clientes que precisam de atenção imediata"
            icon={AlertTriangle}
            color="red"
            customers={atRiskCustomers}
            audienceType="atRisk"
            contactedIds={contactedIds}
            onOpenCustomerProfile={handleOpenCustomerProfile}
            onMarkContacted={handleMarkContacted}
            onCreateCampaign={handleCreateCampaign}
          />
        </Suspense>
      )}

      {/* Welcome Modal - for new customers without welcome campaign */}
      {welcomeModalOpen && welcomeModalCustomers.length > 0 && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <CustomerSegmentModal
            isOpen={welcomeModalOpen}
            onClose={() => {
              setWelcomeModalOpen(false);
              setWelcomeModalCustomers([]);
            }}
            title="Enviar Boas-vindas"
            subtitle="Novos clientes sem campanha de boas-vindas"
            icon={Mail}
            color="purple"
            customers={welcomeModalCustomers}
            audienceType="welcome"
            contactedIds={contactedIds}
            onOpenCustomerProfile={handleOpenCustomerProfile}
            onMarkContacted={handleMarkContacted}
            onCreateCampaign={handleCreateCampaign}
          />
        </Suspense>
      )}

      {/* Lost Customers Modal - first-time visitors who didn't return */}
      {lostCustomersModalOpen && lostCustomersModalData.length > 0 && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <CustomerSegmentModal
            isOpen={lostCustomersModalOpen}
            onClose={() => {
              setLostCustomersModalOpen(false);
              setLostCustomersModalData([]);
            }}
            title="Clientes Não Retornaram"
            subtitle="Primeira visita há 30+ dias sem retorno"
            icon={UserX}
            color="red"
            customers={lostCustomersModalData}
            audienceType="newCustomers"
            contactedIds={contactedIds}
            onOpenCustomerProfile={handleOpenCustomerProfile}
            onMarkContacted={handleMarkContacted}
            onCreateCampaign={handleCreateCampaign}
          />
        </Suspense>
      )}

      {/* Frequency Degradation Modal - customers with slipping visit patterns */}
      {degradationModalOpen && degradationModalCustomers.length > 0 && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <CustomerSegmentModal
            isOpen={degradationModalOpen}
            onClose={() => {
              setDegradationModalOpen(false);
              setDegradationModalCustomers([]);
            }}
            title="Clientes Esfriando"
            subtitle="Intervalos de visita aumentando"
            icon={TrendingDown}
            color="amber"
            customers={degradationModalCustomers}
            audienceType="atRisk"
            contactedIds={contactedIds}
            onOpenCustomerProfile={handleOpenCustomerProfile}
            onMarkContacted={handleMarkContacted}
            onCreateCampaign={handleCreateCampaign}
          />
        </Suspense>
      )}
      </div>
    </PullToRefreshWrapper>
  );
};

export default Customers;
