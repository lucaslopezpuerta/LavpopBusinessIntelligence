// NewCampaignModal.jsx v5.2 - DESIGN SYSTEM COMPLIANCE
// Campaign creation wizard modal
// Design System v4.0 compliant
//
// CHANGELOG:
// v5.2 (2026-01-09): Typography & mobile footer fixes
//   - Fixed text-[10px] → text-xs (template category badge)
//   - Improved footer buttons: full-width on mobile, inline on desktop
//   - Better touch targets on navigation buttons
// v5.1 (2026-01-08): AudienceFilterBuilder integration (Phase 8)
//   - Added audienceMode toggle (preset/filter) in Step 1
//   - Integrated AudienceFilterBuilder for custom filtering
//   - Added customFilteredCustomers state
//   - Updated audienceCustomers to handle 'customFiltered' audience
// v5.0 (2026-01-07): Focus ring standardization and glass morphism
//   - Added focus-visible rings to close button and navigation buttons
//   - Added glass morphism to modal container (bg-white/95 backdrop-blur-xl)
//   - Improves keyboard navigation and accessibility
// v4.9 (2025-12-22): Haptic feedback for campaign actions
//   - haptics.heavy() when send button is pressed
//   - haptics.success() on successful send/schedule
//   - haptics.error() on send failure
// v4.8 (2025-12-15): Custom audience support from chart insights
//   - Added 'custom' audience for pre-selected customers from charts
//   - Custom audience only shows when audienceSegments.custom has customers
//   - Supports chart-to-campaign workflow from Customers view
// v4.7 (2025-12-13): Configurable coupon validity for manual campaigns
//   - Added couponValidityDays state (default 7 days)
//   - Added UI selector in Step 2 (5, 7, 10, 14, 21, 30 days)
//   - All validade calculations now use configurable couponValidityDays
//   - Template defaults populate couponValidityDays from discountDefaults
// v4.6 (2025-12-13): Eligibility system integration
//   - Pass campaignType to sendCampaignWithTracking for cooldown enforcement
//   - Display ineligible contacts count and reasons in send results
//   - Filter contacts that are in cooldown period (7 days global, 30 days same type)
// v4.5 (2025-12-11): Template filtering by audience
//   - Templates in Step 2 now filtered by selected audience
//   - Matches same filtering behavior as Messages tab
//   - Shows "Templates recomendados" message when filtered
// v4.4 (2025-12-11): Pre-selection support and header bug fix
//   - Fixed: header rendering bug (was object, now extracts .text)
//   - Added initialTemplate/initialAudience props for pre-population
//   - Auto-advances to Step 2 when template is pre-selected
//   - Supports "Usar este template" flow from Messages tab
// v4.3 (2025-12-11): Design System v3.1 compliance fixes
//   - Added modal border per Design System spec
//   - Fixed close button touch target (44px minimum)
//   - Fixed date/time inputs (text-base for iOS, h-12, rounded-xl)
//   - Added footer background color
//   - Matched audience card colors to AudienceSelector component
// v4.2 (2025-12-10): Added RFM segment audiences
//   - Added VIP, Frequentes, Promissores, Esfriando, Inativos audiences
//   - Organized audiences by category (Retention vs Marketing)
//   - Updated Portuguese terminology
// v4.1 (2025-12-09): Robust error handling for campaign sends
//   - ContentSid validation before sending (required for marketing)
//   - Detailed error breakdown display (by error type)
//   - Partial success handling with clear messaging
//   - Retryable error indicators for user guidance
// v4.0 (2025-12-09): A/B Testing with dynamic discount/coupon selection
//   - Added discount percentage selector (15%, 20%, 25%, 30%)
//   - Added service type selector (Todos, Só Lavagem, Só Secagem)
//   - Dynamic coupon code lookup from couponConfig.js
//   - Real-time coupon preview in campaign creation
//   - Enhanced tracking for discount effectiveness analysis
// v3.1 (2025-12-08): Centralized template configuration
//   - Templates imported from config/messageTemplates.js
//   - Consistent with MessageComposer templates
//   - Better variable handling
// v3.0 (2025-12-08): Campaign effectiveness tracking
//   - Uses sendCampaignWithTracking for contact outcome tracking
//   - Records contacts in contact_tracking + campaign_contacts tables
//   - Stores message_body and target_segments for analytics
// v2.0 (2025-12-08): Supabase backend integration
//   - Uses async functions to save campaigns to backend
//   - Falls back to localStorage if backend unavailable
// v1.1 (2025-12-08): Added campaign scheduling
//   - Option to schedule campaigns for future send
//   - Date/time picker for scheduled campaigns
//   - Scheduled campaigns saved to localStorage
// v1.0 (2025-12-08): Initial implementation
//   - Step-by-step campaign creation wizard
//   - Audience selection, template selection, preview, and send
//   - Integrates with campaignService for sending

import { useState, useMemo, useEffect } from 'react';
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
  Filter
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
// Retention: Based on Churn Risk Levels (Em Risco, Novo, Saudável)
// Marketing: Based on RFM Segments (VIP, Frequente, Promissor, Esfriando, Inativo)
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
  const [couponValidityDays, setCouponValidityDays] = useState(7); // Default 7 days

  // Scheduling state
  const [sendMode, setSendMode] = useState('now'); // 'now' or 'scheduled'
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // v5.1: Audience filter mode state
  const [audienceMode, setAudienceMode] = useState('preset'); // 'preset' | 'filter'
  const [customFilteredCustomers, setCustomFilteredCustomers] = useState([]);

  // Build audiences list - includes custom audience when pre-selected customers exist
  const availableAudiences = useMemo(() => {
    const hasCustom = audienceSegments?.custom?.length > 0;

    if (hasCustom) {
      // Add custom audience at the top when pre-selected customers exist
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

  // Handle initial values when modal opens with pre-selection
  useEffect(() => {
    if (isOpen) {
      // Pre-select audience if provided
      if (initialAudience) {
        setSelectedAudience(initialAudience);
      }
      // Pre-select template if provided
      if (initialTemplate) {
        setSelectedTemplate(initialTemplate);
        // Set discount/service defaults from template
        const defaults = initialTemplate.discountDefaults || {};
        setSelectedDiscount(defaults.discountPercent || null);
        setSelectedServiceType(defaults.serviceType || null);
        setCouponValidityDays(defaults.couponValidityDays || 7);
        // Auto-advance to step 2 if audience is also set, otherwise step 1
        setCurrentStep(initialAudience ? 1 : 0);
      }
    }
  }, [isOpen, initialTemplate, initialAudience]);

  // Get audience customers with valid phones
  // v5.1: Added support for 'customFiltered' from AudienceFilterBuilder
  const audienceCustomers = useMemo(() => {
    if (!audienceSegments || !selectedAudience) return [];

    let customers = [];

    // v5.1: Handle custom filtered customers from AudienceFilterBuilder
    if (selectedAudience === 'customFiltered') {
      // customFilteredCustomers already filtered by AudienceFilterBuilder
      return customFilteredCustomers;
    }

    if (selectedAudience === 'all') {
      customers = audienceSegments.withPhone || [];
    } else {
      customers = audienceSegments[selectedAudience] || [];
    }

    return customers.filter(c => isValidBrazilianMobile(c.phone));
  }, [audienceSegments, selectedAudience, customFilteredCustomers]);

  // Validate audience for campaign (async - loads from backend)
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

  // Filter templates by selected audience (same as Messages tab)
  const filteredTemplates = useMemo(() => {
    if (!selectedAudience) return MESSAGE_TEMPLATES;
    return getTemplatesByAudience(selectedAudience);
  }, [selectedAudience]);

  // Get the selected coupon based on discount and service type
  const selectedCoupon = useMemo(() => {
    if (!selectedTemplate || selectedDiscount === null || !selectedServiceType) return null;
    return getCouponForTemplate(selectedTemplate.id, selectedDiscount, selectedServiceType);
  }, [selectedTemplate, selectedDiscount, selectedServiceType]);

  // Check if this template has coupon/discount configuration
  const hasCouponConfig = useMemo(() => {
    if (!selectedTemplate) return false;
    return selectedTemplate.campaignType !== null;
  }, [selectedTemplate]);

  // Get audience count for each segment
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

  // Extract header text (header can be string or {type, text} object)
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

  // Format message preview with sample data
  const formatPreview = (template, customer = null) => {
    if (!template) return '';

    let body = template.body;
    const validityMs = couponValidityDays * 24 * 60 * 60 * 1000;
    const validade = new Date(Date.now() + validityMs).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const customerName = customer?.name ? getFirstName(customer.name) : 'Cliente';
    const customerWallet = customer?.walletBalance || 0;

    // Use selected values if available, otherwise fallback to template defaults
    const effectiveDiscount = selectedDiscount || template.discountDefaults?.discountPercent || 20;
    const effectiveCoupon = selectedCoupon?.code || template.discountDefaults?.couponCode || 'LAVPOP20';

    // Build replacements based on template variables
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

    // Heavy haptic to signal important action start
    haptics.heavy();

    // Handle scheduled campaigns
    if (sendMode === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        setSendResult({
          success: false,
          error: 'Selecione data e hora para agendar'
        });
        return;
      }

      // Create datetime in Brazil timezone (user input is always Brazil time)
      const scheduledDateTime = createBrazilDateTime(scheduledDate, scheduledTime);
      if (!scheduledDateTime || !isBrazilTimeFuture(scheduledDate, scheduledTime)) {
        setSendResult({
          success: false,
          error: 'A data de agendamento deve ser no futuro (horário de Brasília)'
        });
        return;
      }

      setIsSending(true);

      // Build content variables for scheduled send
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
        // Save scheduled campaign using backend with ContentSid
        await createScheduledCampaignAsync({
          name: selectedTemplate.name,
          templateId: selectedTemplate.id,
          audience: selectedAudience,
          audienceCount: validationStats.ready.length,
          scheduledFor: scheduledDateTime.toISOString(),
          messageBody: formatPreview(selectedTemplate),
          // Meta-approved template configuration
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

      // Create campaign record with full details for analytics
      // Use selected discount/coupon values for A/B testing analysis
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
        // A/B Testing fields for discount effectiveness analysis
        discountPercent: effectiveDiscount,
        couponCode: effectiveCoupon,
        serviceType: effectiveServiceType
      });

      // Prepare recipients with customerId for effectiveness tracking
      const recipientsForTracking = validationStats.ready.map(c => ({
        customerId: c.doc || c.cpf || c.id,
        customerName: c.name,
        phone: c.phone,
        walletBalance: c.walletBalance
      }));

      // Build content variables for Meta template
      // Variables: {{1}}=name, {{2}}=discount/wallet, {{3}}=coupon, {{4}}=expiration
      const validityMs = couponValidityDays * 24 * 60 * 60 * 1000;
      const validade = new Date(Date.now() + validityMs)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      const contentVariables = {
        '1': '{{nome}}', // Will be personalized per recipient
        '2': selectedTemplate.id === 'wallet_reminder'
          ? '{{saldo}}' // Wallet balance - personalized per recipient
          : String(effectiveDiscount || selectedTemplate.discountDefaults?.discountPercent || '20'),
        '3': effectiveCoupon || selectedTemplate.discountDefaults?.couponCode || '',
        '4': validade
      };

      // Validate template has ContentSid before sending
      if (!selectedTemplate.twilioContentSid) {
        setSendResult({
          success: false,
          error: `Template "${selectedTemplate.name}" não possui ContentSid configurado. Configure o template no Twilio antes de enviar.`,
          errorType: 'MISSING_CONTENT_SID'
        });
        setIsSending(false);
        return;
      }

      // Send campaign with effectiveness tracking using Meta-approved template
      // This records contacts in contact_tracking + campaign_contacts
      // Includes eligibility filtering to respect cooldown periods
      const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[selectedTemplate.id] || null;
      const result = await sendCampaignWithTracking(campaign.id, recipientsForTracking, {
        contentSid: selectedTemplate.twilioContentSid, // Use Meta-approved template (REQUIRED)
        contentVariables: contentVariables,
        templateId: selectedTemplate.id, // For error messages
        campaignType: campaignType, // For eligibility filtering (7d global, 30d same type)
        couponValidityDays: couponValidityDays, // For expires_at calculation (v4.7)
        skipWhatsApp: false // Set to true for testing without sending
      });

      // Check if campaign had any success
      const hasSuccess = result.successCount > 0;
      const hasFailed = result.failedCount > 0;
      const hasIneligible = (result.ineligibleCount || 0) > 0;

      // Haptic feedback based on result
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
        // Eligibility info - contacts filtered due to cooldown
        ineligibleCount: result.ineligibleCount || 0,
        ineligibleContacts: result.ineligibleContacts || [],
        // Include detailed error breakdown from summary
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

  const handleClose = () => {
    // Reset state
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
    // v5.1: Reset filter builder state
    setAudienceMode('preset');
    setCustomFilteredCustomers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Nova Campanha WhatsApp
          </h2>
          <button
            onClick={handleClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
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
                    <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-2 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Audience Selection */}
          {currentStep === 0 && (
            <div className="space-y-4">
              {/* v5.1: Mode Selector (Preset vs Filter) */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => {
                    setAudienceMode('preset');
                    // Clear custom filtered when switching to preset
                    if (selectedAudience === 'customFiltered') {
                      setSelectedAudience(null);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    audienceMode === 'preset'
                      ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Segmentos
                </button>
                <button
                  onClick={() => setAudienceMode('filter')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    audienceMode === 'filter'
                      ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filtro Avançado
                </button>
              </div>

              {/* v5.1: Advanced Filter Builder */}
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

              {/* Preset Audiences (existing) */}
              {audienceMode === 'preset' && (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Selecione o público-alvo para sua campanha:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        relative p-4 rounded-xl border-2 text-left transition-all
                        ${isSelected
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : count > 0
                            ? 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                            : 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-purple-600" />
                      )}
                      <div className={`
                        w-8 h-8 rounded-xl flex items-center justify-center mb-2
                        ${audience.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40' :
                          audience.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40' :
                          audience.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40' :
                          audience.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40' :
                          audience.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
                          audience.color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/40' :
                          audience.color === 'green' ? 'bg-green-100 dark:bg-green-900/40' :
                          audience.color === 'gray' ? 'bg-gray-100 dark:bg-gray-700' :
                          audience.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/40' :
                          'bg-slate-100 dark:bg-slate-700'
                        }
                      `}>
                        <Icon className={`
                          w-4 h-4
                          ${audience.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                            audience.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            audience.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                            audience.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                            audience.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            audience.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                            audience.color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' :
                            audience.color === 'green' ? 'text-green-600 dark:text-green-400' :
                            audience.color === 'gray' ? 'text-gray-600 dark:text-gray-400' :
                            'text-slate-600 dark:text-slate-400'
                          }
                        `} />
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {audience.label}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {audience.description}
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                        {count} <span className="text-xs font-normal text-slate-500">clientes</span>
                      </p>
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
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {selectedAudience && filteredTemplates.length < MESSAGE_TEMPLATES.length
                  ? `Templates recomendados para esta audiência (${filteredTemplates.length} de ${MESSAGE_TEMPLATES.length}):`
                  : 'Escolha o template da mensagem:'
                }
              </p>

              <div className="space-y-3">
                {filteredTemplates.map((template) => {
                  const Icon = ICON_MAP[template.icon] || Gift;
                  const isSelected = selectedTemplate?.id === template.id;

                  return (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        // Reset discount/service selections when template changes
                        // Set defaults based on template
                        const defaults = template.discountDefaults || {};
                        setSelectedDiscount(defaults.discountPercent || null);
                        setSelectedServiceType(defaults.serviceType || null);
                        setCouponValidityDays(defaults.couponValidityDays || 7);
                      }}
                      className={`
                        w-full p-4 rounded-xl border-2 text-left transition-all
                        ${isSelected
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                          ${template.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40' :
                            template.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40' :
                            template.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40' :
                            'bg-emerald-100 dark:bg-emerald-900/40'
                          }
                        `}>
                          <Icon className={`
                            w-5 h-5
                            ${template.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                              template.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                              template.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                              'text-emerald-600 dark:text-emerald-400'
                            }
                          `} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {template.name}
                            </h3>
                            <span className={`
                              px-2 py-0.5 text-xs font-medium rounded
                              ${template.category === 'MARKETING'
                                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              }
                            `}>
                              {template.category}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-purple-600 ml-auto" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Discount & Service Configuration (A/B Testing) */}
              {selectedTemplate && hasCouponConfig && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Configuração do Cupom
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Discount Percentage Selector */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                        Desconto
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {discountOptions.map((discount) => (
                          <button
                            key={discount}
                            onClick={() => setSelectedDiscount(discount)}
                            className={`
                              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                              ${selectedDiscount === discount
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500'
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
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                          Válido para
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {serviceOptions.map((service) => (
                            <button
                              key={service}
                              onClick={() => setSelectedServiceType(service)}
                              className={`
                                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                                ${selectedServiceType === service
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500'
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
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      Validade do cupom (dias)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[5, 7, 10, 14, 21, 30].map((days) => (
                        <button
                          key={days}
                          onClick={() => setCouponValidityDays(days)}
                          className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                            ${couponValidityDays === days
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500'
                            }
                          `}
                        >
                          {days} dias
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      Tempo para o cliente usar o cupom e ser rastreado como retorno
                    </p>
                  </div>

                  {/* Coupon Code Preview */}
                  {selectedCoupon && (
                    <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Código do cupom:</p>
                          <p className="text-lg font-bold text-purple-700 dark:text-purple-300 font-mono">
                            {selectedCoupon.code}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Desconto:</p>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {selectedCoupon.discountPercent}% OFF
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {selectedCoupon.description}
                      </p>
                    </div>
                  )}

                  {/* Warning if no coupon found */}
                  {selectedDiscount && selectedServiceType && !selectedCoupon && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Esta combinação de desconto e serviço não tem cupom configurado no POS.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 2 && selectedTemplate && (
            <div className="space-y-4">
              {/* Stats Summary */}
              {validationStats && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {validationStats.stats.readyCount}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Prontos</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {validationStats.stats.blacklistedCount}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Bloqueados</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                      {validationStats.stats.invalidCount}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Inválidos</p>
                  </div>
                </div>
              )}

              {/* Toggle Preview */}
              <button
                onClick={() => setShowPhonePreview(!showPhonePreview)}
                className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                <Smartphone className="w-4 h-4" />
                {showPhonePreview ? 'Ocultar preview' : 'Ver como aparece no celular'}
              </button>

              {/* Phone Preview */}
              {showPhonePreview ? (
                <div className="flex justify-center">
                  <div className="w-[280px] bg-slate-900 rounded-[32px] p-2.5 shadow-xl">
                    <div className="w-16 h-5 bg-slate-900 rounded-full mx-auto mb-1.5" />
                    <div className="bg-[#e5ddd5] rounded-2xl overflow-hidden">
                      <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20" />
                        <div>
                          <p className="text-white font-medium text-xs">Lavpop</p>
                          <p className="text-white/70 text-[10px]">Online</p>
                        </div>
                      </div>
                      <div className="p-3 min-h-[200px]">
                        <div className="bg-white rounded-lg p-2.5 shadow-sm max-w-[90%]">
                          <p className="text-xs font-medium text-slate-900 mb-1">
                            {getHeaderText(selectedTemplate.header)}
                          </p>
                          <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                            {formatPreview(selectedTemplate)}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1.5">
                            {selectedTemplate.footer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Text Preview */
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                    {getHeaderText(selectedTemplate.header)}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {formatPreview(selectedTemplate)}
                  </p>
                  <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    {selectedTemplate.footer}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Send Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {sendResult ? (
                /* Result Display */
                <div className={`p-6 rounded-xl ${
                  sendResult.success
                    ? sendResult.scheduled
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : sendResult.partial
                        ? 'bg-amber-50 dark:bg-amber-900/20'
                        : 'bg-emerald-50 dark:bg-emerald-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="text-center">
                    {sendResult.success ? (
                      sendResult.scheduled ? (
                        <>
                          <Calendar className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                            Campanha Agendada!
                          </h3>
                          <p className="text-blue-600 dark:text-blue-400">
                            Será enviada em {formatBrazilTime(sendResult.scheduledFor, { day: '2-digit', month: '2-digit', year: 'numeric' })} às {formatBrazilTime(sendResult.scheduledFor, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            (Horário de Brasília)
                          </p>
                          <p className="text-sm text-blue-500 dark:text-blue-400 mt-2">
                            {validationStats?.stats?.readyCount || 0} clientes receberão a mensagem
                          </p>
                        </>
                      ) : sendResult.partial ? (
                        <>
                          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-amber-800 dark:text-amber-200 mb-2">
                            Campanha Parcialmente Enviada
                          </h3>
                          <p className="text-amber-600 dark:text-amber-400">
                            ✅ {sendResult.sent} enviadas
                            {sendResult.failed > 0 && ` • ❌ ${sendResult.failed} falharam`}
                            {sendResult.ineligibleCount > 0 && ` • ⏳ ${sendResult.ineligibleCount} em cooldown`}
                          </p>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                            Campanha Enviada!
                          </h3>
                          <p className="text-emerald-600 dark:text-emerald-400">
                            {sendResult.sent} mensagens enviadas com sucesso
                          </p>
                        </>
                      )
                    ) : (
                      <>
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                          Erro ao Enviar
                        </h3>
                        <p className="text-red-600 dark:text-red-400">
                          {sendResult.error}
                        </p>
                        {sendResult.retryable && (
                          <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                            Este erro pode ser temporário. Tente novamente em alguns minutos.
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Detailed Error Breakdown */}
                  {sendResult.summary?.errorsByType && Object.keys(sendResult.summary.errorsByType).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Detalhes das falhas:
                      </p>
                      <div className="space-y-2">
                        {Object.entries(sendResult.summary.errorsByType).map(([type, data]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between text-sm bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg"
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
                    <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <UserMinus className="w-4 h-4 text-blue-500" />
                        Contatos em período de cooldown ({sendResult.ineligibleCount}):
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1.5">
                        {sendResult.ineligibleContacts.slice(0, 10).map((contact, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg"
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
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Confirmar Envio
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Você está prestes a enviar <span className="font-semibold">{validationStats?.stats?.readyCount || 0}</span> mensagens
                      usando o template <span className="font-semibold">{selectedTemplate?.name}</span>.
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-left">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Audiência</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {availableAudiences.find(a => a.id === selectedAudience)?.label}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Template</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {selectedTemplate?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Destinatários</p>
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">
                          {validationStats?.stats?.readyCount || 0} clientes
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Excluídos</p>
                        <p className="font-medium text-amber-600 dark:text-amber-400">
                          {(validationStats?.stats?.blacklistedCount || 0) + (validationStats?.stats?.invalidCount || 0)} clientes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Send Mode Selector */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Quando enviar?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSendMode('now')}
                        className={`
                          flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
                          ${sendMode === 'now'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }
                        `}
                      >
                        <Send className="w-4 h-4" />
                        <span className="font-medium">Enviar Agora</span>
                      </button>
                      <button
                        onClick={() => setSendMode('scheduled')}
                        className={`
                          flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
                          ${sendMode === 'scheduled'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }
                        `}
                      >
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Agendar</span>
                      </button>
                    </div>

                    {/* Scheduling Inputs */}
                    {sendMode === 'scheduled' && (
                      <div className="mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Data
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                min={getBrazilNow().date}
                                className="w-full h-12 pl-10 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Hora
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full h-12 pl-10 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
                          ⏰ Horário de Brasília (São Paulo)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleSend}
                    disabled={isSending || !validationStats?.stats?.readyCount || (sendMode === 'scheduled' && (!scheduledDate || !scheduledTime))}
                    className={`
                      w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl shadow-lg transition-all
                      ${sendMode === 'scheduled'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                      }
                      disabled:from-slate-400 disabled:to-slate-500 text-white
                    `}
                  >
                    {isSending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {sendMode === 'scheduled' ? 'Agendando...' : 'Enviando...'}
                      </>
                    ) : (
                      <>
                        {sendMode === 'scheduled' ? (
                          <>
                            <Calendar className="w-5 h-5" />
                            Agendar Campanha
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Enviar Campanha
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

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={currentStep === 0 ? handleClose : handleBack}
            disabled={isSending}
            className="order-2 sm:order-1 w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 sm:border-0 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="order-1 sm:order-2 w-full sm:w-auto sm:ml-auto min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : sendResult?.success ? (
            <button
              onClick={handleClose}
              className="order-1 sm:order-2 w-full sm:w-auto sm:ml-auto min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <CheckCircle2 className="w-4 h-4" />
              Concluir
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default NewCampaignModal;
