// MessageComposer.jsx v3.0
// WhatsApp message composer with Meta-compliant templates
// Design System v3.1 compliant
//
// Meta WhatsApp Business API Template Rules:
// - Templates must be pre-approved by Meta
// - Variables use {{1}}, {{2}} syntax
// - Header, body, footer structure
// - Max 1024 chars for body
// - Buttons: quick reply or CTA (max 3)
//
// CHANGELOG:
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
import {
  MessageSquare,
  Send,
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
  Sun
} from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import CampaignPreview from '../ui/CampaignPreview';
import { sendBulkWhatsApp, createCampaignAsync, recordCampaignSendAsync } from '../../utils/campaignService';
import { MESSAGE_TEMPLATES, getTemplatesByAudience } from '../../config/messageTemplates';

// Icon mapping for templates
const ICON_MAP = {
  Heart,
  Sparkles,
  Wallet,
  Gift,
  Sun
};

const MessageComposer = ({ selectedAudience, audienceSegments }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCampaignPreview, setShowCampaignPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
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

  // Handle send button click - show preview first
  const handleSendClick = () => {
    if (!selectedTemplate || audienceCustomers.length === 0) return;
    setShowCampaignPreview(true);
    setSendResult(null);
  };

  // Handle confirm from CampaignPreview
  const handleConfirmSend = async (validCustomers) => {
    if (!selectedTemplate || validCustomers.length === 0) return;

    setIsSending(true);

    try {
      // Format message with sample data for now (in production, personalize per customer)
      const messageBody = formatPreview(selectedTemplate);

      // Send bulk WhatsApp
      const result = await sendBulkWhatsApp(
        validCustomers,
        messageBody,
        selectedTemplate.id
      );

      // Save campaign record using backend
      const campaign = await createCampaignAsync({
        name: selectedTemplate.name,
        templateId: selectedTemplate.id,
        audience: selectedAudience,
        audienceCount: validCustomers.length
      });

      // Record send event using backend
      await recordCampaignSendAsync(campaign.id, {
        recipients: validCustomers.length,
        successCount: result.results?.success?.length || 0,
        failedCount: result.results?.failed?.length || 0
      });

      setSendResult({
        success: true,
        sent: result.results?.success?.length || validCustomers.length,
        failed: result.results?.failed?.length || 0
      });

      // Close preview after short delay
      setTimeout(() => {
        setShowCampaignPreview(false);
        setSelectedTemplate(null);
      }, 3000);

    } catch (error) {
      console.error('Failed to send campaign:', error);
      setSendResult({
        success: false,
        error: error.message || 'Erro ao enviar campanha'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle cancel from CampaignPreview
  const handleCancelSend = () => {
    setShowCampaignPreview(false);
    setSendResult(null);
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

  return (
    <SectionCard
      title="Mensagens & Templates"
      subtitle="Templates aprovados pela Meta para WhatsApp Business"
      icon={MessageSquare}
      color="purple"
      id="message-composer"
    >
      <div className="space-y-6">
        {/* Meta Compliance Notice */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Templates Meta WhatsApp Business
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Estes templates seguem as diretrizes da Meta e devem ser submetidos para aprovação antes do primeiro envio.
                Após aprovação, podem ser usados para campanhas em massa.
              </p>
            </div>
          </div>
        </div>

        {/* Audience Summary */}
        {selectedAudience && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Audiência selecionada
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {getAudienceCount()} clientes receberão esta mensagem
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {getAudienceCount()}
              </p>
              <p className="text-xs text-purple-500">destinatários</p>
            </div>
          </div>
        )}

        {/* Template Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = ICON_MAP[template.icon] || Gift;
            const isSelected = selectedTemplate?.id === template.id;
            const headerText = typeof template.header === 'object' ? template.header.text : template.header;

            return (
              <div
                key={template.id}
                className={`
                  relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${isSelected
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 shadow-md'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }
                `}
                onClick={() => setSelectedTemplate(template)}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${template.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40' :
                      template.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40' :
                      template.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40' :
                      'bg-emerald-100 dark:bg-emerald-900/40'}
                  `}>
                    <Icon className={`
                      w-5 h-5
                      ${template.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                        template.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                        template.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                        'text-emerald-600 dark:text-emerald-400'}
                    `} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {template.name}
                    </h3>
                    <span className={`
                      text-[10px] font-medium px-1.5 py-0.5 rounded
                      ${template.category === 'MARKETING'
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                        : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}
                    `}>
                      {template.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {template.description}
                </p>

                {/* Preview */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {headerText}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3">
                    {template.body.substring(0, 150)}...
                  </p>
                </div>

                {/* Buttons Preview */}
                {template.buttons && (
                  <div className="flex gap-2 mt-3">
                    {template.buttons.map((btn, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300"
                      >
                        {btn.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Template Preview */}
        {selectedTemplate && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Preview: {selectedTemplate.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  {showPreview ? 'Ocultar Preview' : 'Ver no Celular'}
                </button>
              </div>
            </div>

            {/* Sample Customer Selector */}
            {showPreview && sampleCustomers.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Visualizando como:</p>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
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
                        className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        title="Cliente anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-blue-600 dark:text-blue-400 min-w-[3rem] text-center">
                        {sampleCustomerIndex + 1} / {sampleCustomers.length}
                      </span>
                      <button
                        onClick={nextSampleCustomer}
                        className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
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
                <div className="w-[320px] bg-slate-900 rounded-[36px] p-3 shadow-2xl">
                  {/* Phone Notch */}
                  <div className="w-20 h-6 bg-slate-900 rounded-full mx-auto mb-2" />

                  {/* Screen */}
                  <div className="bg-[#e5ddd5] rounded-2xl overflow-hidden">
                    {/* WhatsApp Header */}
                    <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20" />
                      <div>
                        <p className="text-white font-medium text-sm">Lavpop</p>
                        <p className="text-white/70 text-xs">Online</p>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="p-4 min-h-[300px]">
                      <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%]">
                        <p className="text-sm font-medium text-slate-900 mb-2">
                          {typeof selectedTemplate.header === 'object' ? selectedTemplate.header.text : selectedTemplate.header}
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-line">
                          {formatPreview(selectedTemplate)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {selectedTemplate.footer}
                        </p>

                        {/* Buttons */}
                        {selectedTemplate.buttons && (
                          <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">
                            {selectedTemplate.buttons.map((btn, idx) => (
                              <button
                                key={idx}
                                className="w-full py-2 text-[#075e54] font-medium text-sm border border-[#075e54] rounded-lg"
                              >
                                {btn.text}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-[10px] text-slate-400 text-right mt-2">
                          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleSendClick}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
                disabled={!selectedAudience || isSending}
              >
                <Send className="w-4 h-4" />
                Enviar para {getAudienceCount()} clientes
              </button>
            </div>
          </div>
        )}

        {/* Campaign Preview Modal */}
        {showCampaignPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg animate-fade-in">
              {/* Send Result Overlay */}
              {sendResult && (
                <div className={`mb-4 p-4 rounded-xl border ${
                  sendResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-3">
                    {sendResult.success ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-800 dark:text-green-200">
                            Campanha enviada com sucesso!
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {sendResult.sent} mensagens enviadas
                            {sendResult.failed > 0 && `, ${sendResult.failed} falharam`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-200">
                            Erro ao enviar
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {sendResult.error}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <CampaignPreview
                customers={audienceCustomers}
                onConfirm={handleConfirmSend}
                onCancel={handleCancelSend}
                campaignName={selectedTemplate?.name || 'Campanha'}
                isLoading={isSending}
              />
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default MessageComposer;
