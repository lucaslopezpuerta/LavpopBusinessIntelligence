// Campaigns.jsx v2.4.0 - WhatsApp Analytics
// Customer Messaging & Campaign Management Tab
// Design System v3.2 compliant
//
// CHANGELOG:
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

// UI components
import InsightBox from '../components/ui/InsightBox';

// Campaign-specific components
import CampaignList from '../components/campaigns/CampaignList';
import AudienceSelector from '../components/campaigns/AudienceSelector';
import MessageComposer from '../components/campaigns/MessageComposer';
import CampaignSectionNavigation from '../components/campaigns/CampaignSectionNavigation';
import BlacklistManager from '../components/campaigns/BlacklistManager';
import CampaignDashboard from '../components/campaigns/CampaignDashboard';

// Lazy-loaded heavy components (60KB + 50KB savings)
const AutomationRules = lazy(() => import('../components/campaigns/AutomationRules'));
const NewCampaignModal = lazy(() => import('../components/campaigns/NewCampaignModal'));
const WhatsAppAnalytics = lazy(() => import('../components/campaigns/WhatsAppAnalytics'));

// Loading fallback for lazy components
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
      <div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  </div>
);

// Business logic
import { calculateCustomerMetrics } from '../utils/customerMetrics';

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

const Campaigns = ({ data }) => {
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

  // Loading state
  if (!data || !data.sales) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border-l-4 border-purple-500">
            <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Campanhas
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
      </header>

      {/* Section Navigation */}
      <CampaignSectionNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Campaign Analytics Dashboard - Main overview section */}
      {activeSection === 'overview' && (
        <CampaignDashboard
          audienceSegments={audienceSegments}
        />
      )}

      {/* WhatsApp Business Analytics Section */}
      {activeSection === 'whatsapp' && (
        <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div>}>
          <WhatsAppAnalytics />
        </Suspense>
      )}

      {/* Automation Rules Section */}
      {activeSection === 'automations' && (
        <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div>}>
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

      {/* Blacklist Manager Section */}
      {activeSection === 'blacklist' && (
        <BlacklistManager
          customerData={customerMetrics?.allCustomers || []}
        />
      )}

      {/* Campaign List Section */}
      {activeSection === 'history' && (
        <CampaignList
          formatCurrency={formatCurrency}
          formatPercent={formatPercent}
        />
      )}

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

    </div>
  );
};

export default Campaigns;
