// Campaigns.jsx v2.8.0 - STELLAR CASCADE TRANSITIONS
// Customer Messaging & Campaign Management Tab
// Design System v3.2 compliant
//
// CHANGELOG:
// v2.8.0 (2026-01-27): Stellar Cascade transitions
//   - Added AnimatedView, AnimatedHeader, AnimatedSection wrappers
//   - Content cascades in layered sequence (~250ms total)
// v2.7.0 (2026-01-12): Pull-to-refresh support
//   - Added PullToRefreshWrapper for mobile swipe-to-refresh gesture
//   - Accepts onDataChange prop for refresh callback
// v2.6.0 (2026-01-09): Fix tab navigation - show correct content per tab
//   - CampaignDashboard now only shows on 'overview' tab (was always visible)
//   - Each tab now properly shows its respective content exclusively
//   - Fixes confusion where dashboard was always visible with other sections
// v2.5.1 (2025-12-23): Fix empty render on navigation
//   - Added comprehensive data readiness check (sales + rfm + customer)
//   - Prevents empty tab when derived calculations return null
// v2.5.0 (2025-12-19): Moved Blacklist to Social Media view
//   - Removed BlacklistManager (now in SocialMedia.jsx)
//   - Blacklist logically belongs with WhatsApp messaging
// v2.4.0 (2025-12-17): WhatsApp Business Analytics
//   - Added WhatsApp tab for WABA analytics
//   - Shows conversation costs, delivery metrics
//   - Lazy-loaded WhatsAppAnalytics component
// v2.3.0 (2025-12-16): Full-width layout
//   - REMOVED: Redundant padding (now uses App.jsx padding)
//   - REMOVED: max-w-[1600px] constraint for full-width
//   - Consistent with Dashboard.jsx layout pattern
// v2.2.0 (2025-12-11): Unified campaign creation flow
//   - Messages tab now only browses templates (no direct send)
//   - "Usar este template" opens wizard with template pre-selected
//   - All campaign sending goes through Nova Campanha wizard
// v2.1.1 (2025-12-11): Fixed audience segment filters
//   - Fixed atRisk filter to use English riskLevel keys ('At Risk', 'Churning') not Portuguese
//   - Fixed newCustomers filter to use 'New Customer' key
//   - Fixed healthy filter to use 'Healthy' key
//   - riskLevel is stored as English key, not Portuguese display name
// v2.1.0 (2025-12-10): RFM segment integration
//   - Added RFM segment audiences (VIP, Frequente, Promissor, Esfriando, Inativo)
//   - Now supports both retention-focused (Churn Risk) and marketing-focused (RFM) targeting
// v2.0.0 (2025-12-10): Complete dashboard redesign
//   - Replaced CampaignEffectiveness + CampaignROISection with unified CampaignDashboard
//   - All data now dynamic from Supabase (removed CSV dependency)
//   - Added A/B testing visualization (discount/service comparison)
//   - Added campaign funnel visualization
//   - Dynamic insights based on data patterns
// v1.3.0 (2025-12-08): Added Campaign Effectiveness metrics
//   - CampaignEffectiveness component in overview tab
//   - Shows contact return rates, revenue recovered, method comparison
// v1.2.0 (2025-12-08): Added Nova Campanha wizard
//   - New campaign creation modal with step-by-step wizard
//   - Audience selection, template selection, preview, and send
// v1.1.0 (2025-12-08): Added Blacklist management
//   - New BlacklistManager section for opt-out and undelivered tracking
//   - Twilio sync integration for automatic blacklist updates
// v1.0.0 (2025-12-03): Initial implementation
//   - Campaign overview with KPI summary
//   - Audience targeting based on RFM/risk segments
//   - WhatsApp campaign creation and management
//   - Automation rules for win-back and welcome series
//   - Message template library (Meta-compliant)

import { useState, useMemo, lazy, Suspense } from 'react';
import {
  MessageSquare,
  Plus
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Campaign-specific components
import CampaignList from '../components/campaigns/CampaignList';
import AudienceSelector from '../components/campaigns/AudienceSelector';
import MessageComposer from '../components/campaigns/MessageComposer';
import CampaignSectionNavigation from '../components/campaigns/CampaignSectionNavigation';
import CampaignDashboard from '../components/campaigns/CampaignDashboard';
import { CampaignsLoadingSkeleton } from '../components/ui/Skeleton';

// Lazy-loaded heavy components (60KB + 50KB savings)
const AutomationRules = lazy(() => import('../components/campaigns/AutomationRules'));
const NewCampaignModal = lazy(() => import('../components/campaigns/NewCampaignModal'));

// Loading fallback for lazy components
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
      <div className="w-8 h-8 border-3 border-stellar-cyan border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  </div>
);

// Business logic
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import PullToRefreshWrapper from '../components/ui/PullToRefreshWrapper';
import { AnimatedView, AnimatedHeader, AnimatedSection } from '../components/ui/AnimatedView';

// ==================== HELPER FUNCTIONS ====================

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

const formatPercent = (value) => {
  return `${(value || 0).toFixed(1)}%`;
};

// ==================== MAIN COMPONENT ====================

const Campaigns = ({ data, onDataChange }) => {
  // Theme context for Cosmic Precision styling
  const { isDark } = useTheme();

  const [activeSection, setActiveSection] = useState('overview');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState(null);
  // Pre-selection for wizard (when "Usar este template" is clicked in Messages tab)
  const [initialTemplate, setInitialTemplate] = useState(null);

  // Calculate customer metrics for audience targeting
  const customerMetrics = useMemo(() => {
    if (!data?.sales || !data?.rfm || !data?.customer) return null;
    try {
      return calculateCustomerMetrics(data.sales, data.rfm, data.customer);
    } catch (error) {
      console.error('Customer metrics calculation error:', error);
      return null;
    }
  }, [data?.sales, data?.rfm, data?.customer]);

  // Minimum wallet balance for messaging (R$ 10)
  const MIN_WALLET_BALANCE = 10;

  // Audience segments for targeting
  // Churn Risk Levels stored as English keys: Healthy, Monitor, At Risk, Churning, New Customer, Lost
  // Display names (Portuguese): Saudável, Monitorar, Em Risco, Crítico, Novo, Perdido
  // RFM Segments available in c.segment: VIP, Frequente, Promissor, Novato, Esfriando, Inativo
  const audienceSegments = useMemo(() => {
    if (!customerMetrics?.allCustomers) return null;

    const customers = customerMetrics.allCustomers;

    return {
      // Churn Risk Level based segments (retention focus)
      // Note: riskLevel values are English keys (At Risk, Churning), not Portuguese display names
      atRisk: customers.filter(c => ['At Risk', 'Churning'].includes(c.riskLevel)),
      newCustomers: customers.filter(c => c.riskLevel === 'New Customer'),
      healthy: customers.filter(c => c.riskLevel === 'Healthy'),
      // RFM Segment based segments (marketing focus)
      vip: customers.filter(c => c.segment === 'VIP'),
      frequent: customers.filter(c => c.segment === 'Frequente'),
      promising: customers.filter(c => c.segment === 'Promissor'),
      cooling: customers.filter(c => c.segment === 'Esfriando'),
      inactive: customers.filter(c => c.segment === 'Inativo'),
      // Other segments
      withWallet: customers.filter(c => (c.walletBalance || 0) >= MIN_WALLET_BALANCE),
      withPhone: customers.filter(c => c.phone && c.phone.length >= 10),
      all: customers,
      // Pass threshold for UI display
      walletThreshold: MIN_WALLET_BALANCE
    };
  }, [customerMetrics?.allCustomers]);

  // Handle "Usar este template" from Messages tab
  const handleUseTemplate = (template, audience) => {
    setInitialTemplate(template);
    // Also set the audience if provided
    if (audience) {
      setSelectedAudience(audience);
    }
    setShowNewCampaign(true);
  };

  // Handle modal close - reset initial template
  const handleCloseModal = () => {
    setShowNewCampaign(false);
    // Reset initial values after a brief delay (to avoid flicker)
    setTimeout(() => {
      setInitialTemplate(null);
    }, 300);
  };

  // Check if all required data is loaded (not just sales)
  // This prevents empty renders when derived calculations return null
  const isDataReady = data?.sales && data?.rfm && data?.customer;

  // Loading state - show skeleton until ALL required data is available
  if (!isDataReady) {
    return <CampaignsLoadingSkeleton />;
  }

  return (
    <PullToRefreshWrapper onRefresh={onDataChange}>
      <AnimatedView>
        {/* Header - Cosmic Precision Design v2.1 */}
        <AnimatedHeader className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icon Container - Glassmorphism */}
            <div
              className={`
                w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDark
                  ? 'bg-space-dust/70 border border-stellar-cyan/20'
                  : 'bg-white border border-stellar-blue/10 shadow-md'}
              `}
              style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            >
              <MessageSquare className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-stellar-cyan' : 'text-stellar-blue'}`} />
            </div>
            {/* Title & Subtitle */}
            <div>
              <h1
                className="text-lg sm:text-xl font-bold tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                <span className="text-gradient-stellar">CAMPANHAS</span>
              </h1>
              <p className={`text-xs tracking-wide mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Mensagens, automações e ROI de campanhas
              </p>
            </div>
          </div>

          {/* Create Campaign Button */}
          <button
            onClick={() => setShowNewCampaign(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Campanha</span>
          </button>
        </div>

        </AnimatedHeader>

        {/* Section Navigation */}
        <AnimatedSection>
          <CampaignSectionNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Campaign Analytics Dashboard - Only visible on Overview tab */}
      {activeSection === 'overview' && (
        <CampaignDashboard
          audienceSegments={audienceSegments}
        />
      )}

      {/* Automation Rules Section */}
      {activeSection === 'automations' && (
        <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-stellar-cyan border-t-transparent rounded-full animate-spin" /></div>}>
          <AutomationRules
            audienceSegments={audienceSegments}
          />
        </Suspense>
      )}

      {/* Audience Selector Section */}
      {activeSection === 'audience' && (
        <AudienceSelector
          audienceSegments={audienceSegments}
          selectedAudience={selectedAudience}
          onSelectAudience={setSelectedAudience}
        />
      )}

      {/* Message Templates Section */}
      {activeSection === 'templates' && (
        <MessageComposer
          selectedAudience={selectedAudience}
          audienceSegments={audienceSegments}
          onUseTemplate={handleUseTemplate}
        />
      )}

        {/* Campaign List Section */}
        {activeSection === 'history' && (
          <CampaignList
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        )}
        </AnimatedSection>

        {/* New Campaign Modal */}
      {showNewCampaign && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <NewCampaignModal
            isOpen={showNewCampaign}
            onClose={handleCloseModal}
            audienceSegments={audienceSegments}
            initialTemplate={initialTemplate}
            initialAudience={selectedAudience}
          />
        </Suspense>
      )}

      </AnimatedView>
    </PullToRefreshWrapper>
  );
};

export default Campaigns;
