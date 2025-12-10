// NewCampaignModal.jsx v4.1
// Campaign creation wizard modal
// Design System v3.1 compliant
//
// CHANGELOG:
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

import { useState, useMemo } from 'react';
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
  Sun
} from 'lucide-react';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';
import {
  sendBulkWhatsApp,
  validateCampaignAudience,
  createScheduledCampaignAsync,
  createCampaignAsync,
  sendCampaignWithTracking
} from '../../utils/campaignService';
import {
  MESSAGE_TEMPLATES,
  getTemplatesByAudience,
  SERVICE_TYPE_LABELS,
  getDiscountOptionsForTemplate,
  getServiceOptionsForTemplate,
  getCouponForTemplate
} from '../../config/messageTemplates';
import { TEMPLATE_CAMPAIGN_TYPE_MAP } from '../../config/couponConfig';

// Icon mapping for templates
const ICON_MAP = {
  Heart,
  Sparkles,
  Wallet,
  Gift,
  Sun
};

// Audience options
const AUDIENCES = [
  {
    id: 'atRisk',
    label: 'Em Risco',
    description: 'Clientes que não visitam há 30+ dias',
    icon: AlertTriangle,
    color: 'amber'
  },
  {
    id: 'newCustomers',
    label: 'Novos Clientes',
    description: 'Clientes com primeira visita recente',
    icon: Sparkles,
    color: 'purple'
  },
  {
    id: 'healthy',
    label: 'Clientes Saudáveis',
    description: 'Clientes ativos e frequentes',
    icon: Heart,
    color: 'emerald'
  },
  {
    id: 'withWallet',
    label: 'Com Saldo na Carteira',
    description: 'Clientes com saldo ≥ R$ 10',
    icon: Wallet,
    color: 'blue'
  },
  {
    id: 'all',
    label: 'Todos os Clientes',
    description: 'Todos os clientes com WhatsApp válido',
    icon: Users,
    color: 'slate'
  }
];

const STEPS = [
  { id: 'audience', label: 'Audiência', icon: Users },
  { id: 'template', label: 'Mensagem', icon: MessageSquare },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'send', label: 'Enviar', icon: Send }
];

const NewCampaignModal = ({ isOpen, onClose, audienceSegments }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [showPhonePreview, setShowPhonePreview] = useState(false);

  // Discount and service type selection for A/B testing
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState(null);

  // Scheduling state
  const [sendMode, setSendMode] = useState('now'); // 'now' or 'scheduled'
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Get audience customers with valid phones
  const audienceCustomers = useMemo(() => {
    if (!audienceSegments || !selectedAudience) return [];

    let customers = [];
    if (selectedAudience === 'all') {
      customers = audienceSegments.withPhone || [];
    } else {
      customers = audienceSegments[selectedAudience] || [];
    }

    return customers.filter(c => isValidBrazilianMobile(c.phone));
  }, [audienceSegments, selectedAudience]);

  // Validate audience for campaign
  const validationStats = useMemo(() => {
    if (!audienceCustomers.length) return null;
    return validateCampaignAudience(audienceCustomers);
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
    const validade = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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

    // Handle scheduled campaigns
    if (sendMode === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        setSendResult({
          success: false,
          error: 'Selecione data e hora para agendar'
        });
        return;
      }

      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        setSendResult({
          success: false,
          error: 'A data de agendamento deve ser no futuro'
        });
        return;
      }

      setIsSending(true);

      // Build content variables for scheduled send
      const validade = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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

        setSendResult({
          success: true,
          scheduled: true,
          scheduledFor: scheduledDateTime
        });
      } catch (error) {
        console.error('Error scheduling campaign:', error);
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
      const validade = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
      const result = await sendCampaignWithTracking(campaign.id, recipientsForTracking, {
        contentSid: selectedTemplate.twilioContentSid, // Use Meta-approved template (REQUIRED)
        contentVariables: contentVariables,
        templateId: selectedTemplate.id, // For error messages
        skipWhatsApp: false // Set to true for testing without sending
      });

      // Check if campaign had any success
      const hasSuccess = result.successCount > 0;
      const hasFailed = result.failedCount > 0;

      setSendResult({
        success: hasSuccess,
        partial: hasSuccess && hasFailed,
        sent: result.successCount,
        failed: result.failedCount,
        tracked: result.trackedContacts,
        sentVia: result.sentVia,
        // Include detailed error breakdown from summary
        summary: result.summary,
        errors: result.errors
      });

    } catch (error) {
      console.error('Campaign send error:', error);
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Nova Campanha WhatsApp
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Selecione o público-alvo para sua campanha:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AUDIENCES.map((audience) => {
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
                        w-8 h-8 rounded-lg flex items-center justify-center mb-2
                        ${audience.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40' :
                          audience.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40' :
                          audience.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40' :
                          audience.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40' :
                          'bg-slate-100 dark:bg-slate-700'
                        }
                      `}>
                        <Icon className={`
                          w-4 h-4
                          ${audience.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                            audience.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            audience.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                            audience.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
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
            </div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Escolha o template da mensagem:
              </p>

              <div className="space-y-3">
                {MESSAGE_TEMPLATES.map((template) => {
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
                              px-2 py-0.5 text-[10px] font-medium rounded
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
                            {selectedTemplate.header}
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
                    {selectedTemplate.header}
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
                            Será enviada em {sendResult.scheduledFor.toLocaleDateString('pt-BR')} às {sendResult.scheduledFor.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                            ✅ {sendResult.sent} enviadas • ❌ {sendResult.failed} falharam
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
                          {AUDIENCES.find(a => a.id === selectedAudience)?.label}
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
                      <div className="mt-4 grid grid-cols-2 gap-3">
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
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
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
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={currentStep === 0 ? handleClose : handleBack}
            disabled={isSending}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : sendResult?.success ? (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
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
