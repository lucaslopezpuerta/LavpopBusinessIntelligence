// Campaigns.jsx v1.3.0
// Customer Messaging & Campaign Management Tab
// Design System v3.1 compliant
//
// CHANGELOG:
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
//   - Moved CampaignROISection from Intelligence tab
//   - Audience targeting based on RFM/risk segments
//   - WhatsApp campaign creation and management
//   - Automation rules for win-back and welcome series
//   - Message template library (Meta-compliant)

import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Target,
  Users,
  Zap,
  AlertTriangle,
  Plus
} from 'lucide-react';

// UI components
import KPICard, { KPIGrid } from '../components/ui/KPICard';
import SectionCard from '../components/ui/SectionCard';
import InsightBox from '../components/ui/InsightBox';

// Section components
import CampaignROISection from '../components/intelligence/CampaignROISection';

// Campaign-specific components
import CampaignList from '../components/campaigns/CampaignList';
import AudienceSelector from '../components/campaigns/AudienceSelector';
import MessageComposer from '../components/campaigns/MessageComposer';
import AutomationRules from '../components/campaigns/AutomationRules';
import CampaignSectionNavigation from '../components/campaigns/CampaignSectionNavigation';
import BlacklistManager from '../components/campaigns/BlacklistManager';
import NewCampaignModal from '../components/campaigns/NewCampaignModal';
import CampaignEffectiveness from '../components/campaigns/CampaignEffectiveness';

// Business logic
import { calculateCampaignROI } from '../utils/intelligenceCalculations';
import { calculateCustomerMetrics } from '../utils/customerMetrics';

// ==================== MAIN COMPONENT ====================

const Campaigns = ({ data }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState(null);

  // Calculate campaign metrics
  const campaignROI = useMemo(() => {
    if (!data?.sales || !data?.campaigns) return null;
    try {
      return calculateCampaignROI(data.sales, data.campaigns);
    } catch (error) {
      console.error('Campaign ROI calculation error:', error);
      return null;
    }
  }, [data?.sales, data?.campaigns]);

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
  const audienceSegments = useMemo(() => {
    if (!customerMetrics?.allCustomers) return null;

    const customers = customerMetrics.allCustomers;

    return {
      atRisk: customers.filter(c => ['At Risk', 'Churning'].includes(c.riskLevel)),
      newCustomers: customers.filter(c => c.riskLevel === 'New Customer'),
      healthy: customers.filter(c => c.riskLevel === 'Healthy'),
      withWallet: customers.filter(c => (c.walletBalance || 0) >= MIN_WALLET_BALANCE),
      withPhone: customers.filter(c => c.phone && c.phone.length >= 10),
      all: customers,
      // Pass threshold for UI display
      walletThreshold: MIN_WALLET_BALANCE
    };
  }, [customerMetrics?.allCustomers]);

  // Format helpers
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

  // Calculate summary metrics
  const summaryMetrics = {
    totalCampaigns: campaignROI?.totalCampaigns || 0,
    activeCampaigns: campaignROI?.activeCampaigns || 0,
    totalReach: audienceSegments?.withPhone?.length || 0,
    atRiskCount: audienceSegments?.atRisk?.length || 0,
    newCustomersCount: audienceSegments?.newCustomers?.length || 0,
    averageROI: campaignROI?.summary?.overallROI || 0
  };

  return (
    <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fade-in">

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

      {/* Actionable Insight */}
      {audienceSegments?.atRisk?.length > 5 && (
        <InsightBox
          type="warning"
          title={`${audienceSegments.atRisk.length} Clientes em Risco`}
          message={`Você tem clientes que não visitam há mais de 30 dias. Uma campanha de win-back via WhatsApp pode recuperar até 20% deles. Clique em "Nova Campanha" para começar.`}
        />
      )}

      {/* Quick Stats KPIs */}
      <section aria-labelledby="campaign-stats-heading">
        <h2 id="campaign-stats-heading" className="sr-only">Resumo de Campanhas</h2>
        <KPIGrid columns={4}>
          <KPICard
            label="Campanhas Ativas"
            value={summaryMetrics.activeCampaigns}
            subtitle={`${summaryMetrics.totalCampaigns} total`}
            icon={Target}
            color="purple"
            variant="gradient"
          />
          <KPICard
            label="Alcance WhatsApp"
            value={summaryMetrics.totalReach}
            subtitle="clientes com telefone"
            icon={Users}
            color="blue"
            variant="gradient"
          />
          <KPICard
            label="Clientes em Risco"
            value={summaryMetrics.atRiskCount}
            subtitle="precisam de atenção"
            icon={AlertTriangle}
            color="warning"
            variant="gradient"
          />
          <KPICard
            label="ROI Médio"
            value={formatPercent(summaryMetrics.averageROI)}
            subtitle="retorno incremental"
            icon={Zap}
            color={summaryMetrics.averageROI > 0 ? 'positive' : 'negative'}
            variant="gradient"
          />
        </KPIGrid>
      </section>

      {/* Campaign ROI Section (moved from Intelligence) */}
      {activeSection === 'overview' && (
        <>
          <CampaignEffectiveness className="mb-6" />
          <CampaignROISection
            campaignROI={campaignROI}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </>
      )}

      {/* Automation Rules Section */}
      {activeSection === 'automations' && (
        <AutomationRules
          audienceSegments={audienceSegments}
          formatCurrency={formatCurrency}
        />
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
          campaigns={campaignROI?.campaigns || []}
          formatCurrency={formatCurrency}
          formatPercent={formatPercent}
        />
      )}

      {/* New Campaign Modal */}
      <NewCampaignModal
        isOpen={showNewCampaign}
        onClose={() => setShowNewCampaign(false)}
        audienceSegments={audienceSegments}
      />

    </div>
  );
};

export default Campaigns;
