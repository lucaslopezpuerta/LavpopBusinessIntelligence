// NewCampaignModal.jsx v6.6 - COMPACT SCHEDULING UX
// Campaign creation wizard modal
// Design System v5.0 compliant - Variant D (Glassmorphism Cosmic)
//
// CHANGELOG:
// v6.6 (2026-01-18): Compact scheduling step
//   - Removed pb-48 padding from scheduling inputs (was 192px of empty space)
//   - Added dropUp prop to CosmicDatePicker and CosmicTimePicker
//   - Pickers now open upward, eliminating gap between inputs and button
// v6.5 (2026-01-18): Safe area compliance + Portal rendering
//   - Added createPortal to render modal to document.body (fixes backdrop not covering entire screen)
//   - Fixed top gap issue on mobile (h-[95vh] → h-full)
//   - Added pt-safe to header wrapper for notch/Dynamic Island support
//   - Header background extends into safe area (same pattern as CustomerProfileModal)
// v6.4 (2026-01-18): Full-screen mobile modal
//   - Modal slides up from bottom on mobile (items-end, rounded-t-2xl)
//   - Content area uses flex-1 for proper scrolling in full-screen mode
//   - Fixed checkmark icon positioning on audience cards (inline vs absolute)
//   - Fixed date/time picker truncation with overflow-visible on scheduler
// v6.3 (2026-01-18): Mobile UX Overhaul
//   - Reduced padding throughout for mobile (p-3 sm:p-4 lg:p-6)
//   - Compact progress steps with dot indicators on mobile
//   - Audience cards: 1 column on mobile, compact layout
//   - Template cards: reduced spacing and smaller icons on mobile
//   - Coupon config: responsive grid with stacked layout on mobile
//   - Preview stats: 3 cols on mobile with smaller text
//   - Send confirmation: tighter spacing, smaller icons
//   - Fixed pickers with rightAlign to prevent off-screen overflow
//   - Footer: compact buttons with better touch targets
// v6.2 (2026-01-18): CosmicTimePicker integration
//   - Replaced native time input with CosmicTimePicker in scheduler
//   - Full cosmic styling for all date/time inputs
// v6.1 (2026-01-18): Deep space backgrounds + CosmicDatePicker
//   - Audience cards: space-nebula/50 (available), space-void/50 (disabled)
//   - Template cards: space-nebula/50 for deeper contrast
//   - Send mode buttons: space-nebula/50 unselected state
//   - Replaced native date input with CosmicDatePicker in scheduler
//   - Consistent cosmic styling throughout
// v6.0 (2026-01-18): Cosmic Precision redesign
//   - Applied Design System v5.0 Variant D (Glassmorphism Cosmic)
//   - Modal: space-dust background with stellar-cyan borders
//   - Progress steps: stellar gradient for active state
//   - Audience/template cards: cosmic borders and backgrounds
//   - Send mode buttons: cosmic gradient styling
//   - Clean, professional aesthetic without over-animation
// v5.5 (2026-01-12): Refactored to useScrollLock hook
//   - Replaced inline scroll lock useEffect with shared useScrollLock hook
//   - Reduces code duplication across modals
// v5.4 (2026-01-12): Safe area compliance
//   - Added pb-safe to footer navigation for iPhone home indicator
// v5.3 (2026-01-12): iOS-compatible scroll lock
//   - Added body scroll lock to prevent background scrolling
//   - Preserves scroll position when modal closes
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
import { createPortal } from 'react-dom';
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
import { useScrollLock } from '../../hooks/useScrollLock';
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

  // iOS-compatible scroll lock - prevents body scroll while modal is open
  useScrollLock(isOpen);

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

  // Portal rendering ensures fixed positioning works correctly
  // (avoids issues with parent transforms/filters affecting backdrop)
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 dark:backdrop-blur-sm">
      <div className="w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-white dark:bg-space-dust/95 dark:backdrop-blur-xl rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 dark:border-stellar-cyan/15 animate-fade-in flex flex-col">
        {/* Header wrapper with safe area - extends background into notch/Dynamic Island */}
        <div className="bg-white dark:bg-space-dust/95 pt-safe sm:pt-0 border-b border-slate-200 dark:border-stellar-cyan/10 rounded-t-none sm:rounded-t-2xl">
          {/* Header content */}
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

        {/* Progress Steps - Dot indicators on mobile, full on desktop */}
        <div className="px-3 py-2 sm:px-6 sm:py-3 bg-slate-50 dark:bg-space-nebula/50 border-b border-slate-200 dark:border-stellar-cyan/10">
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

        {/* Content - Flex-1 fills available space in full-screen mobile mode */}
        <div className="p-3 sm:p-4 lg:p-6 flex-1 overflow-y-auto min-h-0">
          {/* Step 1: Audience Selection */}
          {currentStep === 0 && (
            <div className="space-y-3 sm:space-y-4">
              {/* v5.1: Mode Selector (Preset vs Filter) */}
              <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-space-nebula rounded-lg sm:rounded-xl">
                <button
                  onClick={() => {
                    setAudienceMode('preset');
                    // Clear custom filtered when switching to preset
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
                            w-3.5 h-3.5 sm:w-4 sm:h-4
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
                        // Reset discount/service selections when template changes
                        // Set defaults based on template
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
                          ${template.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' :
                            template.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                            template.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            'bg-emerald-100 dark:bg-emerald-900/30'
                          }
                        `}>
                          <Icon className={`
                            w-4 h-4 sm:w-5 sm:h-5
                            ${template.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                              template.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                              template.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                              'text-emerald-600 dark:text-emerald-400'
                            }
                          `} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {template.name}
                            </h3>
                            <span className={`
                              px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded flex-shrink-0
                              ${template.category === 'MARKETING'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
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

              {/* Discount & Service Configuration (A/B Testing) */}
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
              {/* Stats Summary - Compact on mobile */}
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

              {/* Phone Preview - Smaller on mobile */}
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
                /* Result Display - Compact on mobile */
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
                /* Confirmation Display - Compact on mobile */
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

                  {/* Summary - 2x2 grid on mobile, same on desktop */}
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

                  {/* Send Mode Selector - More compact on mobile */}
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

                    {/* Scheduling Inputs - pickers drop up to avoid overflow */}
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

                  {/* Action Button - More compact on mobile */}
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

        {/* Footer Navigation - Compact on mobile with safe area */}
        <div className="px-3 py-2.5 sm:px-6 sm:py-4 pb-safe border-t border-slate-200 dark:border-stellar-cyan/10 bg-slate-50 dark:bg-space-nebula/50 flex flex-row gap-2 sm:gap-4">
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
      </div>
    </div>,
    document.body
  );
};

export default NewCampaignModal;
