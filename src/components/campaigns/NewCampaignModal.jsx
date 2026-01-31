// NewCampaignModal.jsx v8.0 - BASEMODAL MIGRATION
// Campaign creation wizard modal
// Design System v5.1 compliant - Tier 2 Enhanced
//
// CHANGELOG:
// v8.0 (2026-01-31): BaseModal migration
//   - Migrated to BaseModal component for consistent UX
//   - Removed duplicate boilerplate (portal, animations, swipe, scroll lock)
//   - Uses showHeader={false} for custom wizard header
//   - Uses footer prop for navigation buttons
//   - Preserved wizard state machine and all business logic
//   - Reduced from ~1680 lines to ~1450 lines
// v7.4 (2026-01-31): Enhanced drag handle
// v7.3 (2026-01-31): Enhanced modal transitions
// v7.2 (2026-01-30): Swipe-to-close and escape key support
// v7.1 (2026-01-29): Mode-aware warning badges
// v7.0 (2026-01-29): Orange to yellow color migration
// v6.9-v6.0: Various design updates and cosmic styling

import { useState, useMemo, useEffect, useCallback } from 'react';
import BaseModal from '../ui/BaseModal';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  MessageSquare,
  Send,
  Eye,
  AlertTriangle,
  Sparkles,
  Heart,
  Wallet,
  Gift,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Clock,
  Calendar,
  Sun,
  Crown,
  TrendingUp,
  Snowflake,
  Moon,
  UserMinus,
  UserCheck,
  Filter,
  Megaphone
} from 'lucide-react';
import AudienceFilterBuilder from './AudienceFilterBuilder';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';
import {
  createBrazilDateTime,
  isBrazilTimeFuture,
  formatBrazilTime,
  getBrazilNow
} from '../../utils/dateUtils';
import {
  validateCampaignAudience,
  createScheduledCampaignAsync,
  createCampaignAsync,
  sendCampaignWithTracking
} from '../../utils/campaignService';
import {
  MESSAGE_TEMPLATES,
  SERVICE_TYPE_LABELS,
  getDiscountOptionsForTemplate,
  getServiceOptionsForTemplate,
  getCouponForTemplate,
  getTemplatesByAudience
} from '../../config/messageTemplates';
import { TEMPLATE_CAMPAIGN_TYPE_MAP } from '../../config/couponConfig';
import { haptics } from '../../utils/haptics';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import CosmicDatePicker from '../ui/CosmicDatePicker';
import CosmicTimePicker from '../ui/CosmicTimePicker';

// Icon mapping for templates and audiences
const ICON_MAP = {
  Heart,
  Sparkles,
  Wallet,
  Gift,
  Sun,
  Crown,
  TrendingUp,
  Snowflake,
  Moon,
  AlertTriangle,
  Users,
  UserCheck
};

// Audience options - organized by category
const AUDIENCES = [
  // Retention-focused (Churn Risk)
  {
    id: 'atRisk',
    label: 'Em Risco / Crítico',
    description: 'Clientes que precisam de atenção urgente',
    icon: AlertTriangle,
    color: 'amber',
    category: 'retention'
  },
  {
    id: 'newCustomers',
    label: 'Novos Clientes',
    description: 'Clientes recém-cadastrados',
    icon: Sparkles,
    color: 'purple',
    category: 'retention'
  },
  {
    id: 'healthy',
    label: 'Saudáveis',
    description: 'Clientes ativos com boa frequência',
    icon: Heart,
    color: 'emerald',
    category: 'retention'
  },
  // Marketing-focused (RFM Segments)
  {
    id: 'vip',
    label: 'VIP',
    description: 'Melhores clientes - alto valor',
    icon: Crown,
    color: 'yellow',
    category: 'marketing'
  },
  {
    id: 'frequent',
    label: 'Frequentes',
    description: 'Visitantes regulares e fiéis',
    icon: Heart,
    color: 'blue',
    category: 'marketing'
  },
  {
    id: 'promising',
    label: 'Promissores',
    description: 'Clientes em crescimento',
    icon: TrendingUp,
    color: 'cyan',
    category: 'marketing'
  },
  {
    id: 'cooling',
    label: 'Esfriando',
    description: 'Precisam de reengajamento',
    icon: Snowflake,
    color: 'slate',
    category: 'marketing'
  },
  {
    id: 'inactive',
    label: 'Inativos',
    description: 'Sem engajamento recente - win-back',
    icon: Moon,
    color: 'gray',
    category: 'marketing'
  },
  // Other
  {
    id: 'withWallet',
    label: 'Com Saldo na Carteira',
    description: 'Clientes com saldo ≥ R$ 10',
    icon: Wallet,
    color: 'green',
    category: 'other'
  },
  {
    id: 'all',
    label: 'Todos os Clientes',
    description: 'Todos os clientes com WhatsApp válido',
    icon: Users,
    color: 'slate',
    category: 'other'
  }
];

const STEPS = [
  { id: 'audience', label: 'Audiência', icon: Users },
  { id: 'template', label: 'Mensagem', icon: MessageSquare },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'send', label: 'Enviar', icon: Send }
];

const NewCampaignModal = ({
  isOpen,
  onClose,
  audienceSegments,
  initialTemplate = null,
  initialAudience = null
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [showPhonePreview, setShowPhonePreview] = useState(false);

  // Discount and service type selection for A/B testing
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [couponValidityDays, setCouponValidityDays] = useState(7);

  // Scheduling state
  const [sendMode, setSendMode] = useState('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Audience filter mode state
  const [audienceMode, setAudienceMode] = useState('preset');
  const [customFilteredCustomers, setCustomFilteredCustomers] = useState([]);

  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Handle close - reset state
  const handleClose = useCallback(() => {
    setCurrentStep(0);
    setSelectedAudience(null);
    setSelectedTemplate(null);
    setSelectedDiscount(null);
    setSelectedServiceType(null);
    setSendResult(null);
    setIsSending(false);
    setSendMode('now');
    setScheduledDate('');
    setScheduledTime('');
    setAudienceMode('preset');
    setCustomFilteredCustomers([]);
    onClose();
  }, [onClose]);

  // Build audiences list
  const availableAudiences = useMemo(() => {
    const hasCustom = audienceSegments?.custom?.length > 0;

    if (hasCustom) {
      return [
        {
          id: 'custom',
          label: 'Seleção Manual',
          description: `${audienceSegments.custom.length} clientes pré-selecionados`,
          icon: UserCheck,
          color: 'indigo',
          category: 'custom'
        },
        ...AUDIENCES
      ];
    }

    return AUDIENCES;
  }, [audienceSegments?.custom]);

  // Handle initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialAudience) {
        setSelectedAudience(initialAudience);
      }
      if (initialTemplate) {
        setSelectedTemplate(initialTemplate);
        const defaults = initialTemplate.discountDefaults || {};
        setSelectedDiscount(defaults.discountPercent || null);
        setSelectedServiceType(defaults.serviceType || null);
        setCouponValidityDays(defaults.couponValidityDays || 7);
        setCurrentStep(initialAudience ? 1 : 0);
      }
    }
  }, [isOpen, initialTemplate, initialAudience]);

  // Get audience customers with valid phones
  const audienceCustomers = useMemo(() => {
    if (!audienceSegments || !selectedAudience) return [];

    let customers = [];

    if (selectedAudience === 'customFiltered') {
      return customFilteredCustomers;
    }

    if (selectedAudience === 'all') {
      customers = audienceSegments.withPhone || [];
    } else {
      customers = audienceSegments[selectedAudience] || [];
    }

    return customers.filter(c => isValidBrazilianMobile(c.phone));
  }, [audienceSegments, selectedAudience, customFilteredCustomers]);

  // Validate audience for campaign
  const [validationStats, setValidationStats] = useState(null);
  useEffect(() => {
    if (!audienceCustomers.length) {
      setValidationStats(null);
      return;
    }
    let cancelled = false;
    validateCampaignAudience(audienceCustomers).then(result => {
      if (!cancelled) setValidationStats(result);
    });
    return () => { cancelled = true; };
  }, [audienceCustomers]);

  // Get discount options for selected template
  const discountOptions = useMemo(() => {
    if (!selectedTemplate) return [];
    return getDiscountOptionsForTemplate(selectedTemplate.id);
  }, [selectedTemplate]);

  // Get service type options for selected template
  const serviceOptions = useMemo(() => {
    if (!selectedTemplate) return [];
    return getServiceOptionsForTemplate(selectedTemplate.id);
  }, [selectedTemplate]);

  // Filter templates by selected audience
  const filteredTemplates = useMemo(() => {
    if (!selectedAudience) return MESSAGE_TEMPLATES;
    return getTemplatesByAudience(selectedAudience);
  }, [selectedAudience]);

  // Get the selected coupon
  const selectedCoupon = useMemo(() => {
    if (!selectedTemplate || selectedDiscount === null || !selectedServiceType) return null;
    return getCouponForTemplate(selectedTemplate.id, selectedDiscount, selectedServiceType);
  }, [selectedTemplate, selectedDiscount, selectedServiceType]);

  // Check if template has coupon config
  const hasCouponConfig = useMemo(() => {
    if (!selectedTemplate) return false;
    return selectedTemplate.campaignType !== null;
  }, [selectedTemplate]);

  // Get audience count
  const getAudienceCount = (audienceId) => {
    if (!audienceSegments) return 0;

    let customers = [];
    if (audienceId === 'all') {
      customers = audienceSegments.withPhone || [];
    } else {
      customers = audienceSegments[audienceId] || [];
    }

    return customers.filter(c => isValidBrazilianMobile(c.phone)).length;
  };

  // Format currency helper
  const formatCurrency = (value) => {
    return `R$ ${(value || 0).toFixed(2).replace('.', ',')}`;
  };

  // Extract header text
  const getHeaderText = (header) => {
    if (!header) return '';
    return typeof header === 'object' ? header.text : header;
  };

  // Get first name from full name
  const getFirstName = (fullName) => {
    if (!fullName) return 'Cliente';
    const parts = fullName.trim().split(' ');
    const firstName = parts[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  // Format message preview
  const formatPreview = (template, customer = null) => {
    if (!template) return '';

    let body = template.body;
    const validityMs = couponValidityDays * 24 * 60 * 60 * 1000;
    const validade = new Date(Date.now() + validityMs).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const customerName = customer?.name ? getFirstName(customer.name) : 'Cliente';
    const customerWallet = customer?.walletBalance || 0;

    const effectiveDiscount = selectedDiscount || template.discountDefaults?.discountPercent || 20;
    const effectiveCoupon = selectedCoupon?.code || template.discountDefaults?.couponCode || 'LAVPOP20';

    const replacements = {};
    template.variables?.forEach(v => {
      const pos = v.position;
      switch (v.key) {
        case 'customerName':
          replacements[`{{${pos}}}`] = customerName;
          break;
        case 'discount':
          replacements[`{{${pos}}}`] = String(effectiveDiscount);
          break;
        case 'couponCode':
          replacements[`{{${pos}}}`] = effectiveCoupon;
          break;
        case 'expirationDate':
          replacements[`{{${pos}}}`] = validade;
          break;
        case 'walletBalance':
          replacements[`{{${pos}}}`] = formatCurrency(customerWallet);
          break;
        default:
          replacements[`{{${pos}}}`] = v.fallback || '';
      }
    });

    Object.entries(replacements).forEach(([key, value]) => {
      body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return body;
  };

  // Handle send or schedule campaign
  const handleSend = async () => {
    if (!selectedTemplate || !validationStats?.ready?.length) return;

    haptics.heavy();

    if (sendMode === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        setSendResult({
          success: false,
          error: 'Selecione data e hora para agendar'
        });
        return;
      }

      const scheduledDateTime = createBrazilDateTime(scheduledDate, scheduledTime);
      if (!scheduledDateTime || !isBrazilTimeFuture(scheduledDate, scheduledTime)) {
        setSendResult({
          success: false,
          error: 'A data de agendamento deve ser no futuro (horário de Brasília)'
        });
        return;
      }

      setIsSending(true);

      const validityMs = couponValidityDays * 24 * 60 * 60 * 1000;
      const validade = new Date(Date.now() + validityMs)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      const scheduledContentVars = {
        '1': '{{nome}}',
        '2': selectedTemplate.id === 'wallet_reminder'
          ? '{{saldo}}'
          : String(selectedDiscount || selectedTemplate.discountDefaults?.discountPercent || '20'),
        '3': selectedCoupon?.code || selectedTemplate.discountDefaults?.couponCode || '',
        '4': validade
      };

      try {
        await createScheduledCampaignAsync({
          name: selectedTemplate.name,
          templateId: selectedTemplate.id,
          audience: selectedAudience,
          audienceCount: validationStats.ready.length,
          scheduledFor: scheduledDateTime.toISOString(),
          messageBody: formatPreview(selectedTemplate),
          contentSid: selectedTemplate.twilioContentSid,
          contentVariables: scheduledContentVars,
          discountPercent: selectedDiscount || selectedTemplate.discountDefaults?.discountPercent,
          couponCode: selectedCoupon?.code || selectedTemplate.discountDefaults?.couponCode,
          recipients: validationStats.ready.map(c => ({
            phone: c.phone,
            name: c.name,
            walletBalance: c.walletBalance,
            customerId: c.doc || c.cpf || c.id
          }))
        });

        haptics.success();
        setSendResult({
          success: true,
          scheduled: true,
          scheduledFor: scheduledDateTime
        });
      } catch (error) {
        console.error('Error scheduling campaign:', error);
        haptics.error();
        setSendResult({
          success: false,
          error: 'Erro ao agendar campanha'
        });
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Handle immediate send
    setIsSending(true);
    setSendResult(null);

    try {
      const messageBody = formatPreview(selectedTemplate);
      const effectiveDiscount = selectedDiscount || selectedTemplate.discountDefaults?.discountPercent || null;
      const effectiveCoupon = selectedCoupon?.code || selectedTemplate.discountDefaults?.couponCode || null;
      const effectiveServiceType = selectedServiceType || selectedTemplate.discountDefaults?.serviceType || null;

      const campaign = await createCampaignAsync({
        name: selectedTemplate.name,
        templateId: selectedTemplate.id,
        audience: selectedAudience,
        audienceCount: validationStats.ready.length,
        messageBody: messageBody,
        contactMethod: 'whatsapp',
        targetSegments: {
          segments: [selectedAudience],
          walletMin: selectedAudience === 'withWallet' ? audienceSegments?.walletThreshold || 10 : null
        },
        discountPercent: effectiveDiscount,
        couponCode: effectiveCoupon,
        serviceType: effectiveServiceType
      });

      window.dispatchEvent(new CustomEvent('campaignCreated'));

      const recipientsForTracking = validationStats.ready.map(c => ({
        customerId: c.doc || c.cpf || c.id,
        customerName: c.name,
        phone: c.phone,
        walletBalance: c.walletBalance
      }));

      const validityMs = couponValidityDays * 24 * 60 * 60 * 1000;
      const validade = new Date(Date.now() + validityMs)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      const contentVariables = {
        '1': '{{nome}}',
        '2': selectedTemplate.id === 'wallet_reminder'
          ? '{{saldo}}'
          : String(effectiveDiscount || selectedTemplate.discountDefaults?.discountPercent || '20'),
        '3': effectiveCoupon || selectedTemplate.discountDefaults?.couponCode || '',
        '4': validade
      };

      if (!selectedTemplate.twilioContentSid) {
        setSendResult({
          success: false,
          error: `Template "${selectedTemplate.name}" não possui ContentSid configurado. Configure o template no Twilio antes de enviar.`,
          errorType: 'MISSING_CONTENT_SID'
        });
        setIsSending(false);
        return;
      }

      const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[selectedTemplate.id] || null;
      const result = await sendCampaignWithTracking(campaign.id, recipientsForTracking, {
        contentSid: selectedTemplate.twilioContentSid,
        contentVariables: contentVariables,
        templateId: selectedTemplate.id,
        campaignType: campaignType,
        couponValidityDays: couponValidityDays,
        skipWhatsApp: false
      });

      const hasSuccess = result.successCount > 0;
      const hasFailed = result.failedCount > 0;
      const hasIneligible = (result.ineligibleCount || 0) > 0;

      if (hasSuccess) {
        haptics.success();
      } else {
        haptics.error();
      }

      setSendResult({
        success: hasSuccess,
        partial: hasSuccess && (hasFailed || hasIneligible),
        sent: result.successCount,
        failed: result.failedCount,
        tracked: result.trackedContacts,
        sentVia: result.sentVia,
        ineligibleCount: result.ineligibleCount || 0,
        ineligibleContacts: result.ineligibleContacts || [],
        summary: result.summary,
        errors: result.errors
      });

    } catch (error) {
      console.error('Campaign send error:', error);
      haptics.error();
      setSendResult({
        success: false,
        error: error.userMessage || error.message || 'Erro ao enviar campanha',
        errorType: error.type || 'UNKNOWN',
        retryable: error.retryable || false
      });
    } finally {
      setIsSending(false);
    }
  };

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedAudience !== null;
      case 1: return selectedTemplate !== null;
      case 2: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Footer navigation
  const footer = (
    <div className="flex flex-row gap-2 sm:gap-4">
      <button
        onClick={currentStep === 0 ? handleClose : handleBack}
        disabled={isSending}
        className="flex-1 sm:flex-initial sm:w-auto min-h-[40px] sm:min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-space-dust rounded-lg sm:rounded-xl border border-slate-200 dark:border-stellar-cyan/15 sm:border-0 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40"
      >
        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>{currentStep === 0 ? 'Cancelar' : 'Voltar'}</span>
      </button>

      {currentStep < STEPS.length - 1 ? (
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex-1 sm:flex-initial sm:w-auto sm:ml-auto min-h-[40px] sm:min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 text-xs sm:text-sm bg-gradient-stellar hover:opacity-90 disabled:bg-none disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-semibold rounded-lg sm:rounded-xl shadow-md shadow-stellar-cyan/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40"
        >
          <span>Próximo</span>
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      ) : sendResult?.success ? (
        <button
          onClick={handleClose}
          className="flex-1 sm:flex-initial sm:w-auto sm:ml-auto min-h-[40px] sm:min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg sm:rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Concluir</span>
        </button>
      ) : null}
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      size="full"
      maxWidth="2xl"
      showHeader={false}
      footer={footer}
      contentClassName="p-0"
      ariaLabel="Nova Campanha"
    >
      {/* Custom Header */}
      <div className="bg-white dark:bg-space-dust/95 border-b border-slate-200 dark:border-stellar-cyan/10 rounded-t-none sm:rounded-t-2xl flex-shrink-0">
        <div className="px-3 py-2.5 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-stellar flex items-center justify-center shadow-md shadow-stellar-cyan/20">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
              Nova Campanha
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 sm:p-2.5 -mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg sm:rounded-xl hover:bg-slate-100 dark:hover:bg-space-nebula transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-3 py-2 sm:px-6 sm:py-3 bg-slate-50 dark:bg-space-nebula/50 border-b border-slate-200 dark:border-stellar-cyan/10 flex-shrink-0">
        {/* Mobile: Compact dot progress */}
        <div className="flex sm:hidden items-center justify-center gap-2">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-2.5 h-2.5 rounded-full transition-all
                  ${isActive
                    ? 'w-6 bg-gradient-stellar'
                    : isCompleted
                      ? 'bg-emerald-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }
                `} />
              </div>
            );
          })}
          <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            {STEPS[currentStep].label}
          </span>
        </div>
        {/* Desktop: Full progress with icons */}
        <div className="hidden sm:flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-gradient-stellar text-white shadow-md shadow-stellar-cyan/20'
                    : isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-slate-300 dark:text-stellar-cyan/30" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 lg:p-6 flex-1 overflow-y-auto min-h-0">
        {/* Step 1: Audience Selection */}
        {currentStep === 0 && (
          <div className="space-y-3 sm:space-y-4">
            {/* Mode Selector */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-space-nebula rounded-lg sm:rounded-xl">
              <button
                onClick={() => {
                  setAudienceMode('preset');
                  if (selectedAudience === 'customFiltered') {
                    setSelectedAudience(null);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  audienceMode === 'preset'
                    ? 'bg-white dark:bg-space-dust text-stellar-cyan shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Segmentos
              </button>
              <button
                onClick={() => setAudienceMode('filter')}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  audienceMode === 'filter'
                    ? 'bg-white dark:bg-space-dust text-stellar-cyan shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Filtro
              </button>
            </div>

            {/* Advanced Filter Builder */}
            {audienceMode === 'filter' && (
              <AudienceFilterBuilder
                allCustomers={audienceSegments?.withPhone || []}
                onFilteredCustomers={(customers) => {
                  setCustomFilteredCustomers(customers);
                  if (customers.length > 0) {
                    setSelectedAudience('customFiltered');
                  } else {
                    setSelectedAudience(null);
                  }
                }}
              />
            )}

            {/* Preset Audiences */}
            {audienceMode === 'preset' && (
              <>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Selecione o público-alvo:
                </p>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {availableAudiences.map((audience) => {
                    const Icon = audience.icon;
                    const count = getAudienceCount(audience.id);
                    const isSelected = selectedAudience === audience.id;

                    return (
                      <button
                        key={audience.id}
                        onClick={() => setSelectedAudience(audience.id)}
                        disabled={count === 0}
                        className={`
                          p-2.5 sm:p-4 rounded-lg sm:rounded-xl border-2 text-left transition-all
                          ${isSelected
                            ? 'border-stellar-cyan bg-stellar-cyan/5 dark:bg-stellar-cyan/10 ring-2 ring-stellar-cyan/20'
                            : count > 0
                              ? 'border-slate-200 dark:border-stellar-cyan/15 hover:border-stellar-cyan/50 dark:hover:border-stellar-cyan/30 bg-white dark:bg-space-nebula/50'
                              : 'border-slate-200 dark:border-stellar-cyan/10 opacity-50 cursor-not-allowed bg-slate-50 dark:bg-space-void/50'
                          }
                        `}
                      >
                        <div className="flex items-start gap-2 sm:block">
                          <div className={`
                            w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center sm:mb-2 flex-shrink-0
                            ${audience.color === 'amber' ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400' :
                              audience.color === 'purple' ? 'bg-purple-600 dark:bg-purple-500' :
                              audience.color === 'emerald' ? 'bg-emerald-600 dark:bg-emerald-500' :
                              audience.color === 'blue' ? 'bg-blue-600 dark:bg-blue-500' :
                              audience.color === 'yellow' ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400' :
                              audience.color === 'cyan' ? 'bg-cyan-600 dark:bg-cyan-500' :
                              audience.color === 'green' ? 'bg-green-600 dark:bg-green-500' :
                              audience.color === 'gray' ? 'bg-gray-500 dark:bg-gray-600' :
                              audience.color === 'indigo' ? 'bg-indigo-600 dark:bg-indigo-500' :
                              'bg-slate-500 dark:bg-slate-600'
                            }
                          `}>
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate flex-1">
                                {audience.label}
                              </h3>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-stellar-cyan flex-shrink-0" />
                              )}
                            </div>
                            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {audience.description}
                            </p>
                            <p className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">
                              {count} <span className="text-[10px] sm:text-xs font-normal text-slate-500">clientes</span>
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Template Selection */}
        {currentStep === 1 && (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {selectedAudience && filteredTemplates.length < MESSAGE_TEMPLATES.length
                ? `Templates recomendados (${filteredTemplates.length}/${MESSAGE_TEMPLATES.length}):`
                : 'Escolha o template:'
              }
            </p>

            <div className="space-y-2 sm:space-y-3">
              {filteredTemplates.map((template) => {
                const Icon = ICON_MAP[template.icon] || Gift;
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      const defaults = template.discountDefaults || {};
                      setSelectedDiscount(defaults.discountPercent || null);
                      setSelectedServiceType(defaults.serviceType || null);
                      setCouponValidityDays(defaults.couponValidityDays || 7);
                    }}
                    className={`
                      w-full p-2.5 sm:p-4 rounded-lg sm:rounded-xl border-2 text-left transition-all
                      ${isSelected
                        ? 'border-stellar-cyan bg-stellar-cyan/5 dark:bg-stellar-cyan/10 ring-2 ring-stellar-cyan/20'
                        : 'border-slate-200 dark:border-stellar-cyan/15 hover:border-stellar-cyan/50 dark:hover:border-stellar-cyan/30 bg-white dark:bg-space-nebula/50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0
                        ${template.color === 'amber' ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400' :
                          template.color === 'purple' ? 'bg-purple-600 dark:bg-purple-500' :
                          template.color === 'blue' ? 'bg-blue-600 dark:bg-blue-500' :
                          'bg-emerald-600 dark:bg-emerald-500'
                        }
                      `}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {template.name}
                          </h3>
                          <span className={`
                            px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded flex-shrink-0
                            ${template.category === 'MARKETING'
                              ? 'bg-purple-600 dark:bg-purple-500 text-white'
                              : 'bg-blue-600 dark:bg-blue-500 text-white'
                            }
                          `}>
                            {template.category === 'MARKETING' ? 'MKT' : 'UTIL'}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-stellar-cyan ml-auto flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Discount & Service Configuration */}
            {selectedTemplate && hasCouponConfig && (
              <div className="mt-3 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-stellar-cyan/5 to-stellar-blue/5 dark:from-stellar-cyan/10 dark:to-stellar-blue/10 rounded-lg sm:rounded-xl border border-stellar-cyan/20 dark:border-stellar-cyan/15">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                  <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stellar-cyan" />
                  Cupom
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Discount Percentage Selector */}
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5">
                      Desconto
                    </label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {discountOptions.map((discount) => (
                        <button
                          key={discount}
                          onClick={() => setSelectedDiscount(discount)}
                          className={`
                            px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all
                            ${selectedDiscount === discount
                              ? 'bg-gradient-stellar text-white shadow-md shadow-stellar-cyan/20'
                              : 'bg-white dark:bg-space-dust text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stellar-cyan/20 hover:border-stellar-cyan/50'
                            }
                          `}
                        >
                          {discount}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Service Type Selector */}
                  {serviceOptions.length > 1 && (
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5">
                        Válido para
                      </label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {serviceOptions.map((service) => (
                          <button
                            key={service}
                            onClick={() => setSelectedServiceType(service)}
                            className={`
                              px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all
                              ${selectedServiceType === service
                                ? 'bg-gradient-stellar text-white shadow-md shadow-stellar-cyan/20'
                                : 'bg-white dark:bg-space-dust text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stellar-cyan/20 hover:border-stellar-cyan/50'
                              }
                            `}
                          >
                            {SERVICE_TYPE_LABELS[service]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Coupon Validity Days Selector */}
                <div className="mt-3 sm:mt-4">
                  <label className="block text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5">
                    Validade (dias)
                  </label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {[5, 7, 10, 14, 21, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => setCouponValidityDays(days)}
                        className={`
                          px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all
                          ${couponValidityDays === days
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white dark:bg-space-dust text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stellar-cyan/20 hover:border-emerald-400'
                          }
                        `}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coupon Code Preview */}
                {selectedCoupon && (
                  <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-white dark:bg-space-nebula rounded-md sm:rounded-lg border border-slate-200 dark:border-stellar-cyan/15">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Código:</p>
                        <p className="text-sm sm:text-lg font-bold text-stellar-cyan font-mono">
                          {selectedCoupon.code}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Desconto:</p>
                        <p className="text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedCoupon.discountPercent}% OFF
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning if no coupon found */}
                {selectedDiscount && selectedServiceType && !selectedCoupon && (
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md sm:rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5 sm:gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>Combinação sem cupom configurado no POS.</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 2 && selectedTemplate && (
          <div className="space-y-3 sm:space-y-4">
            {/* Stats Summary */}
            {validationStats && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg sm:rounded-xl text-center border border-emerald-200 dark:border-emerald-700/30">
                  <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {validationStats.stats.readyCount}
                  </p>
                  <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">Prontos</p>
                </div>
                <div className="p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg sm:rounded-xl text-center border border-amber-200 dark:border-amber-700/30">
                  <p className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {validationStats.stats.blacklistedCount}
                  </p>
                  <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">Bloqueados</p>
                </div>
                <div className="p-2 sm:p-3 bg-slate-50 dark:bg-space-nebula rounded-lg sm:rounded-xl text-center border border-slate-200 dark:border-stellar-cyan/10">
                  <p className="text-lg sm:text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {validationStats.stats.invalidCount}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Inválidos</p>
                </div>
              </div>
            )}

            {/* Toggle Preview */}
            <button
              onClick={() => setShowPhonePreview(!showPhonePreview)}
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-stellar-cyan hover:text-stellar-cyan/80 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {showPhonePreview ? 'Ocultar preview' : 'Ver no celular'}
            </button>

            {/* Phone Preview */}
            {showPhonePreview ? (
              <div className="flex justify-center">
                <div className="w-[240px] sm:w-[280px] bg-slate-900 rounded-[24px] sm:rounded-[32px] p-2 sm:p-2.5 shadow-xl">
                  <div className="w-12 sm:w-16 h-4 sm:h-5 bg-slate-900 rounded-full mx-auto mb-1" />
                  <div className="bg-[#e5ddd5] rounded-xl sm:rounded-2xl overflow-hidden">
                    <div className="bg-[#075e54] px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20" />
                      <div>
                        <p className="text-white font-medium text-[10px] sm:text-xs">Lavpop</p>
                        <p className="text-white/70 text-[8px] sm:text-[10px]">Online</p>
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 min-h-[160px] sm:min-h-[200px]">
                      <div className="bg-white rounded-lg p-2 sm:p-2.5 shadow-sm max-w-[90%]">
                        <p className="text-[10px] sm:text-xs font-medium text-slate-900 mb-0.5 sm:mb-1">
                          {getHeaderText(selectedTemplate.header)}
                        </p>
                        <p className="text-[9px] sm:text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                          {formatPreview(selectedTemplate)}
                        </p>
                        <p className="text-[7px] sm:text-[9px] text-slate-400 mt-1 sm:mt-1.5">
                          {selectedTemplate.footer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Text Preview */
              <div className="p-3 sm:p-4 bg-slate-50 dark:bg-space-nebula/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-stellar-cyan/10">
                <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                  {getHeaderText(selectedTemplate.header)}
                </p>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {formatPreview(selectedTemplate)}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200 dark:border-stellar-cyan/10">
                  {selectedTemplate.footer}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Send Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-4 sm:space-y-6">
            {sendResult ? (
              /* Result Display */
              <div className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border ${
                sendResult.success
                  ? sendResult.scheduled
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/30'
                    : sendResult.partial
                      ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/30'
                      : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/30'
                  : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/30'
              }`}>
                <div className="text-center">
                  {sendResult.success ? (
                    sendResult.scheduled ? (
                      <>
                        <Calendar className="w-10 h-10 sm:w-16 sm:h-16 text-blue-500 mx-auto mb-2 sm:mb-4" />
                        <h3 className="text-base sm:text-xl font-bold text-blue-800 dark:text-blue-200 mb-1 sm:mb-2">
                          Campanha Agendada!
                        </h3>
                        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                          {formatBrazilTime(sendResult.scheduledFor, { day: '2-digit', month: '2-digit' })} às {formatBrazilTime(sendResult.scheduledFor, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] sm:text-xs text-blue-500 dark:text-blue-400 mt-0.5 sm:mt-1">
                          {validationStats?.stats?.readyCount || 0} clientes receberão
                        </p>
                      </>
                    ) : sendResult.partial ? (
                      <>
                        <AlertTriangle className="w-10 h-10 sm:w-16 sm:h-16 text-amber-500 mx-auto mb-2 sm:mb-4" />
                        <h3 className="text-base sm:text-xl font-bold text-amber-800 dark:text-amber-200 mb-1 sm:mb-2">
                          Parcialmente Enviada
                        </h3>
                        <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                          ✅ {sendResult.sent}
                          {sendResult.failed > 0 && ` • ❌ ${sendResult.failed}`}
                          {sendResult.ineligibleCount > 0 && ` • ⏳ ${sendResult.ineligibleCount}`}
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-10 h-10 sm:w-16 sm:h-16 text-emerald-500 mx-auto mb-2 sm:mb-4" />
                        <h3 className="text-base sm:text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-1 sm:mb-2">
                          Campanha Enviada!
                        </h3>
                        <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                          {sendResult.sent} mensagens enviadas
                        </p>
                      </>
                    )
                  ) : (
                    <>
                      <AlertCircle className="w-10 h-10 sm:w-16 sm:h-16 text-red-500 mx-auto mb-2 sm:mb-4" />
                      <h3 className="text-base sm:text-xl font-bold text-red-800 dark:text-red-200 mb-1 sm:mb-2">
                        Erro ao Enviar
                      </h3>
                      <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        {sendResult.error}
                      </p>
                      {sendResult.retryable && (
                        <p className="text-[10px] sm:text-sm text-red-500 dark:text-red-400 mt-1 sm:mt-2">
                          Erro temporário. Tente novamente.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Detailed Error Breakdown */}
                {sendResult.summary?.errorsByType && Object.keys(sendResult.summary.errorsByType).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-700/30">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Detalhes das falhas:
                    </p>
                    <div className="space-y-2">
                      {Object.entries(sendResult.summary.errorsByType).map(([type, data]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between text-sm bg-white/50 dark:bg-space-dust/50 p-2 rounded-lg"
                        >
                          <span className="text-slate-600 dark:text-slate-400">
                            {data.message}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-slate-200">
                            {data.count}
                          </span>
                        </div>
                      ))}
                    </div>
                    {sendResult.summary.hasRetryableErrors && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Alguns erros podem ser temporários. Considere reenviar mais tarde.
                      </p>
                    )}
                  </div>
                )}

                {/* Ineligible Contacts (Cooldown) */}
                {sendResult.ineligibleCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700/30">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <UserMinus className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      Contatos em período de cooldown ({sendResult.ineligibleCount}):
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1.5">
                      {sendResult.ineligibleContacts.slice(0, 10).map((contact, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg"
                        >
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {contact.customerName}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 ml-2">
                            — {contact.reason}
                          </span>
                        </div>
                      ))}
                      {sendResult.ineligibleCount > 10 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-1">
                          ... e mais {sendResult.ineligibleCount - 10} contatos
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Estes clientes foram contactados recentemente e serão elegíveis após o período de espera.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Confirmation Display */
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-stellar rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-lg shadow-stellar-cyan/20">
                    <Send className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">
                    Confirmar Envio
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Enviar <span className="font-semibold text-stellar-cyan">{validationStats?.stats?.readyCount || 0}</span> mensagens
                    com <span className="font-semibold">{selectedTemplate?.name}</span>
                  </p>
                </div>

                {/* Summary */}
                <div className="p-3 sm:p-4 bg-slate-50 dark:bg-space-nebula/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-stellar-cyan/10 text-left">
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Audiência</p>
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {availableAudiences.find(a => a.id === selectedAudience)?.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Template</p>
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {selectedTemplate?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Destinatários</p>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">
                        {validationStats?.stats?.readyCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Excluídos</p>
                      <p className="font-medium text-amber-600 dark:text-amber-400">
                        {(validationStats?.stats?.blacklistedCount || 0) + (validationStats?.stats?.invalidCount || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Send Mode Selector */}
                <div className="p-3 sm:p-4 bg-slate-50 dark:bg-space-nebula/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-stellar-cyan/10">
                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
                    Quando enviar?
                  </p>
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={() => setSendMode('now')}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all
                        ${sendMode === 'now'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-stellar-cyan/15 text-slate-600 dark:text-slate-400 hover:border-stellar-cyan/30 dark:hover:border-stellar-cyan/30 bg-white dark:bg-space-nebula/50'
                        }
                      `}
                    >
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium">Agora</span>
                    </button>
                    <button
                      onClick={() => setSendMode('scheduled')}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all
                        ${sendMode === 'scheduled'
                          ? 'border-stellar-cyan bg-stellar-cyan/10 dark:bg-stellar-cyan/20 text-stellar-cyan'
                          : 'border-slate-200 dark:border-stellar-cyan/15 text-slate-600 dark:text-slate-400 hover:border-stellar-cyan/30 dark:hover:border-stellar-cyan/30 bg-white dark:bg-space-nebula/50'
                        }
                      `}
                    >
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium">Agendar</span>
                    </button>
                  </div>

                  {/* Scheduling Inputs */}
                  {sendMode === 'scheduled' && (
                    <div className="mt-3 sm:mt-4">
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                          <label className="block text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">
                            Data
                          </label>
                          <CosmicDatePicker
                            value={scheduledDate}
                            onChange={(date) => setScheduledDate(date)}
                            placeholder="Selecione..."
                            minDate={getBrazilNow().date}
                            dropUp
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">
                            Hora
                          </label>
                          <CosmicTimePicker
                            value={scheduledTime}
                            onChange={(time) => setScheduledTime(time)}
                            placeholder="Selecione..."
                            dropUp
                            rightAlign
                          />
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1.5 sm:mt-2 text-center">
                        Horário de Brasília
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={handleSend}
                  disabled={isSending || !validationStats?.stats?.readyCount || (sendMode === 'scheduled' && (!scheduledDate || !scheduledTime))}
                  className={`
                    w-full flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg transition-all
                    ${sendMode === 'scheduled'
                      ? 'bg-gradient-stellar hover:opacity-90 shadow-stellar-cyan/20'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                    }
                    disabled:from-slate-400 disabled:to-slate-500 disabled:bg-none disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white
                  `}
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{sendMode === 'scheduled' ? 'Agendando...' : 'Enviando...'}</span>
                    </>
                  ) : (
                    <>
                      {sendMode === 'scheduled' ? (
                        <>
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Agendar</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Enviar</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default NewCampaignModal;
