// MessageComposer.jsx v5.4 - ACCESSIBILITY
// WhatsApp message template browser and preview
// Design System v4.0 compliant - Hybrid Card Design
//
// CHANGELOG:
// v5.4 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Template card hover/tap animations disabled when user prefers reduced motion
//
// Meta WhatsApp Business API Template Rules:
// - Templates must be pre-approved by Meta
// - Variables use {{1}}, {{2}} syntax
// - Header, body, footer structure
// - Max 1024 chars for body
// - Buttons: quick reply or CTA (max 3)
//
// CHANGELOG:
// v5.3 (2026-01-09): Light background KPI cards (Hybrid Card Design)
//   - Migrated stats cards to Design System KPICard with variant="default"
//   - Card bodies now use light backgrounds (bg-white dark:bg-slate-800)
//   - Icon containers retain gradient colors for visual accent
// v5.2 (2026-01-09): Hybrid card design implementation
//   - Added Framer Motion hover animation (y: -2 lift effect)
//   - Updated stats cards to 3-stop gradients
//   - Added haptic feedback on template selection
//   - Premium shadow-lift on card hover
// v5.1 (2026-01-09): Typography & contrast fixes
//   - Fixed text-[10px]/text-[11px] → text-xs (12px minimum)
//   - Fixed dark mode contrast (slate-400 → slate-300)
// v5.0 (2025-12-11): Complete UX redesign
//   - Stats dashboard header with gradient backgrounds
//   - Gradient icons matching AutomationRules design
//   - Mobile-first responsive layout
//   - Improved template cards with better visual hierarchy
//   - Enhanced preview section with phone mockup
// v4.0 (2025-12-11): Removed send functionality (now handled by wizard)
//   - Removed sendBulkWhatsApp and direct sending capability
//   - Added "Usar este template" button that triggers onUseTemplate callback
//   - This tab is now for browsing/previewing templates only
//   - All campaign sending goes through Nova Campanha wizard
// v3.0 (2025-12-08): Centralized template configuration
//   - Templates imported from config/messageTemplates.js
//   - Consistent with NewCampaignModal templates
//   - Better variable handling with formatTemplateBody
// v2.0 (2025-12-08): Supabase backend integration
//   - Uses async functions to save campaigns to backend
//   - Falls back to localStorage if backend unavailable
// v1.2 (2025-12-08): Personalized preview with real customer data
//   - Preview shows real customer names and data from selected audience
//   - Sample customer selector to cycle through audience
//   - Realistic message preview based on actual customer values
// v1.1 (2025-12-03): Added CampaignPreview integration
//   - Shows validation stats before sending
//   - Filters invalid phone numbers with detailed breakdown

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Heart,
  Gift,
  Wallet,
  ChevronLeft,
  ChevronRight,
  User,
  Sun,
  Wand2,
  Users,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import KPICard from '../ui/KPICard';
import { MESSAGE_TEMPLATES, getTemplatesByAudience } from '../../config/messageTemplates';
import { haptics } from '../../utils/haptics';
import useReducedMotion from '../../hooks/useReducedMotion';
import { TWEEN } from '../../constants/animations';

// Icon mapping for templates
const ICON_MAP = {
  Heart,
  Sparkles,
  Wallet,
  Gift,
  Sun
};

// Template category colors
const CATEGORY_STYLES = {
  MARKETING: {
    gradient: 'from-purple-500 to-indigo-500',
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800'
  },
  UTILITY: {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800'
  }
};

const MessageComposer = ({ selectedAudience, audienceSegments, onUseTemplate }) => {
  const prefersReducedMotion = useReducedMotion();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sampleCustomerIndex, setSampleCustomerIndex] = useState(0);

  // Filter templates by selected audience
  const filteredTemplates = selectedAudience
    ? getTemplatesByAudience(selectedAudience)
    : MESSAGE_TEMPLATES;

  // Get audience customers array
  const audienceCustomers = useMemo(() => {
    if (!audienceSegments || !selectedAudience) return [];
    if (selectedAudience === 'all') return audienceSegments.withPhone || [];
    return audienceSegments[selectedAudience]?.filter(c => c.phone) || [];
  }, [audienceSegments, selectedAudience]);

  // Get sample customer for preview (prioritize customers with names)
  const sampleCustomers = useMemo(() => {
    // Prioritize customers with names for better preview
    const withNames = audienceCustomers.filter(c => c.name && c.name.trim());
    const sorted = [...withNames, ...audienceCustomers.filter(c => !c.name || !c.name.trim())];
    return sorted.slice(0, 10); // Keep top 10 for cycling
  }, [audienceCustomers]);

  const currentSampleCustomer = sampleCustomers[sampleCustomerIndex] || null;

  // Navigate sample customers
  const nextSampleCustomer = useCallback(() => {
    setSampleCustomerIndex(prev => (prev + 1) % Math.max(1, sampleCustomers.length));
  }, [sampleCustomers.length]);

  const prevSampleCustomer = useCallback(() => {
    setSampleCustomerIndex(prev => (prev - 1 + sampleCustomers.length) % Math.max(1, sampleCustomers.length));
  }, [sampleCustomers.length]);

  // Get audience count
  const getAudienceCount = () => {
    return audienceCustomers.length;
  };

  // Handle "Usar este template" button - opens wizard with template pre-selected
  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    if (onUseTemplate) {
      onUseTemplate(selectedTemplate, selectedAudience);
    }
  };

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Get first name from full name
  const getFirstName = (fullName) => {
    if (!fullName) return 'Cliente';
    const parts = fullName.trim().split(' ');
    // Capitalize first letter
    const firstName = parts[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  // Format template preview with real customer data
  const formatPreview = (template, customer = currentSampleCustomer) => {
    let body = template.body;
    const validade = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    // Use real customer data when available
    const customerName = customer?.name ? getFirstName(customer.name) : 'Cliente';
    const customerWallet = customer?.walletBalance || 0;

    // Build replacements based on template variables
    const replacements = {};
    template.variables?.forEach(v => {
      const pos = v.position;
      switch (v.key) {
        case 'customerName':
          replacements[`{{${pos}}}`] = customerName;
          break;
        case 'discount':
          replacements[`{{${pos}}}`] = v.fallback || '20';
          break;
        case 'couponCode':
          replacements[`{{${pos}}}`] = v.fallback || 'LAVPOP20';
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

  // Stats for header
  const stats = useMemo(() => {
    const marketingCount = MESSAGE_TEMPLATES.filter(t => t.category === 'MARKETING').length;
    const utilityCount = MESSAGE_TEMPLATES.filter(t => t.category === 'UTILITY').length;
    return {
      total: MESSAGE_TEMPLATES.length,
      filtered: filteredTemplates.length,
      marketing: marketingCount,
      utility: utilityCount,
      audience: getAudienceCount()
    };
  }, [filteredTemplates.length, audienceCustomers.length]);

  return (
    <SectionCard
      title="Mensagens & Templates"
      subtitle="Templates aprovados pela Meta para WhatsApp Business"
      icon={MessageSquare}
      color="purple"
      id="message-composer"
    >
      <div className="space-y-5">
        {/* Stats Dashboard Header - Light background cards with gradient icons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Templates Disponíveis */}
          <KPICard
            label="Templates"
            value={stats.filtered}
            subtitle={selectedAudience ? 'compatíveis' : 'disponíveis'}
            icon={FileText}
            color="purple"
            variant="compact"
          />

          {/* Destinatários */}
          <KPICard
            label="Audiência"
            value={stats.audience.toLocaleString()}
            subtitle="destinatários"
            icon={Users}
            color="whatsappTeal"
            variant="compact"
          />
        </div>

        {/* Discrete Meta Compliance Hint */}
        <p className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3" />
          Templates pré-aprovados pela Meta para WhatsApp Business
        </p>

        {/* Audience Summary */}
        {selectedAudience && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-800 dark:text-purple-200">
                    Audiência selecionada
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {getAudienceCount().toLocaleString()} clientes receberão esta mensagem
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {getAudienceCount().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Template Cards - Selection Cards with Light Background + Ring */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = ICON_MAP[template.icon] || Gift;
            const isSelected = selectedTemplate?.id === template.id;
            const headerText = typeof template.header === 'object' ? template.header.text : template.header;
            const categoryStyle = CATEGORY_STYLES[template.category] || CATEGORY_STYLES.MARKETING;

            return (
              <motion.div
                key={template.id}
                whileHover={prefersReducedMotion ? {} : { y: -2 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                transition={prefersReducedMotion ? { duration: 0 } : TWEEN.HOVER}
                className={`
                  relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group shadow-sm
                  ${isSelected
                    ? 'bg-white dark:bg-slate-800 border-transparent shadow-md ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                  }
                `}
                onClick={() => {
                  haptics.light();
                  setSelectedTemplate(template);
                }}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {template.name}
                    </h3>
                    <span className={`
                      inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                      ${categoryStyle.bg} ${categoryStyle.text}
                    `}>
                      {template.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                  {template.description}
                </p>

                {/* Preview */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {headerText}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {template.body.substring(0, 150)}...
                  </p>
                </div>

                {/* Buttons Preview */}
                {template.buttons && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {template.buttons.map((btn, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        {btn.text}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Selected Template Preview */}
        {selectedTemplate && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CATEGORY_STYLES[selectedTemplate.category]?.gradient || 'from-purple-500 to-indigo-500'} flex items-center justify-center shadow-lg`}>
                  {(() => {
                    const Icon = ICON_MAP[selectedTemplate.icon] || Gift;
                    return <Icon className="w-5 h-5 text-white" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preview da mensagem
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${showPreview
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }
                `}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <Smartphone className="w-4 h-4" />
                {showPreview ? 'Ocultar' : 'Ver no Celular'}
              </button>
            </div>

            {/* Sample Customer Selector */}
            {showPreview && sampleCustomers.length > 0 && (
              <div className="mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Visualizando como:</p>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                        {currentSampleCustomer?.name ? getFirstName(currentSampleCustomer.name) : 'Cliente'}
                        {currentSampleCustomer?.walletBalance > 0 && (
                          <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
                            (Saldo: {formatCurrency(currentSampleCustomer.walletBalance)})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {sampleCustomers.length > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={prevSampleCustomer}
                        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        title="Cliente anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-blue-600 dark:text-blue-400 min-w-[3rem] text-center font-medium">
                        {sampleCustomerIndex + 1} / {sampleCustomers.length}
                      </span>
                      <button
                        onClick={nextSampleCustomer}
                        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        title="Próximo cliente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Phone Preview */}
            {showPreview && (
              <div className="flex justify-center">
                <div className="w-full max-w-[320px] bg-slate-900 rounded-[36px] p-3 shadow-2xl">
                  {/* Phone Notch */}
                  <div className="w-20 h-6 bg-slate-900 rounded-full mx-auto mb-2" />

                  {/* Screen */}
                  <div className="bg-[#e5ddd5] rounded-2xl overflow-hidden">
                    {/* WhatsApp Header */}
                    <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">L</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Lavpop</p>
                        <p className="text-white/70 text-xs">Online</p>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="p-4 min-h-[300px]">
                      <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%]">
                        <p className="text-sm font-semibold text-slate-900 mb-2">
                          {typeof selectedTemplate.header === 'object' ? selectedTemplate.header.text : selectedTemplate.header}
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {formatPreview(selectedTemplate)}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {selectedTemplate.footer}
                        </p>

                        {/* Buttons */}
                        {selectedTemplate.buttons && (
                          <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">
                            {selectedTemplate.buttons.map((btn, idx) => (
                              <button
                                key={idx}
                                className="w-full py-2 text-[#075e54] font-medium text-sm border border-[#075e54] rounded-lg hover:bg-[#075e54]/5 transition-colors"
                              >
                                {btn.text}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-slate-400 text-right mt-2">
                          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              {/* Info about wizard */}
              <div className="flex-1 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  <strong>Dica:</strong> Clique em "Usar este template" para abrir o assistente onde você poderá configurar desconto, cupom e agendar o envio.
                </p>
              </div>

              {/* Use Template Button */}
              <button
                onClick={handleUseTemplate}
                disabled={!onUseTemplate}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none whitespace-nowrap"
              >
                <Wand2 className="w-4 h-4" />
                Usar este template
              </button>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default MessageComposer;
