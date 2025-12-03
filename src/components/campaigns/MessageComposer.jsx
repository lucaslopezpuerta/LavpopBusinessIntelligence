// MessageComposer.jsx v1.1
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
// v1.1 (2025-12-03): Added CampaignPreview integration
//   - Shows validation stats before sending
//   - Filters invalid phone numbers with detailed breakdown

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Eye,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Copy,
  Sparkles,
  Heart,
  Gift,
  Clock,
  Wallet
} from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import CampaignPreview from '../ui/CampaignPreview';
import { sendBulkWhatsApp, recordCampaignSend, saveCampaign } from '../../utils/campaignService';

// Meta-compliant message templates for laundromat
const MESSAGE_TEMPLATES = [
  {
    id: 'winback_30days',
    name: 'Win-back 30 dias',
    category: 'MARKETING',
    icon: Heart,
    color: 'amber',
    description: 'Para clientes que não visitam há 30+ dias',
    audience: 'atRisk',
    header: 'Sentimos sua falta! 🧺',
    body: `Olá {{1}}!

Faz tempo que não nos vemos. Sabemos que a vida fica corrida, mas suas roupas merecem o melhor cuidado!

Volte à Lavpop e aproveite nossa oferta especial:
🎁 *{{2}}% de desconto* no seu próximo ciclo

Use o cupom *{{3}}* até {{4}}.

Esperamos você! 💙`,
    footer: 'Lavpop - Lavanderia Self-Service',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Quero usar!' },
      { type: 'QUICK_REPLY', text: 'Não tenho interesse' }
    ],
    variables: ['nome_cliente', 'desconto', 'cupom', 'data_validade']
  },
  {
    id: 'welcome_new',
    name: 'Boas-vindas',
    category: 'MARKETING',
    icon: Sparkles,
    color: 'purple',
    description: 'Para novos clientes (primeira visita)',
    audience: 'newCustomers',
    header: 'Bem-vindo à Lavpop! 🎉',
    body: `Olá {{1}}!

Obrigado por escolher a Lavpop! Esperamos que sua primeira experiência tenha sido incrível.

Aqui estão algumas dicas:
✨ Horários de menor movimento: 7h-9h e 14h-16h
💳 Você ganhou *{{2}}* de cashback na sua carteira digital
📱 Baixe nosso app para acompanhar suas lavagens

Na sua próxima visita, use o cupom *BEMVINDO10* e ganhe 10% OFF!

Qualquer dúvida, estamos aqui. 💙`,
    footer: 'Lavpop - Lavanderia Self-Service',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Obrigado!' }
    ],
    variables: ['nome_cliente', 'cashback']
  },
  {
    id: 'wallet_reminder',
    name: 'Lembrete de Saldo',
    category: 'UTILITY',
    icon: Wallet,
    color: 'blue',
    description: 'Para clientes com saldo na carteira',
    audience: 'withWallet',
    header: 'Você tem créditos! 💰',
    body: `Olá {{1}}!

Você sabia que tem *{{2}}* de crédito na sua carteira Lavpop?

Não deixe seu saldo parado! Use seus créditos na próxima lavagem e economize.

🕐 Funcionamos das 7h às 21h, todos os dias.

Te esperamos! 💙`,
    footer: 'Lavpop - Lavanderia Self-Service',
    buttons: [
      { type: 'URL', text: 'Ver minha carteira', url: 'https://lavpop.com.br/carteira' }
    ],
    variables: ['nome_cliente', 'saldo']
  },
  {
    id: 'promo_seasonal',
    name: 'Promoção Sazonal',
    category: 'MARKETING',
    icon: Gift,
    color: 'emerald',
    description: 'Para campanhas promocionais gerais',
    audience: 'all',
    header: '🎁 Promoção Especial!',
    body: `Olá {{1}}!

Temos uma novidade especial para você:

*{{2}}*

🎯 {{3}}
📅 Válido até {{4}}

Aproveite! 💙`,
    footer: 'Lavpop - Lavanderia Self-Service',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Quero saber mais!' }
    ],
    variables: ['nome_cliente', 'titulo_promo', 'descricao', 'data_validade']
  }
];

const MessageComposer = ({ selectedAudience, audienceSegments }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCampaignPreview, setShowCampaignPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [customVariables, setCustomVariables] = useState({});

  // Filter templates by selected audience
  const filteredTemplates = selectedAudience
    ? MESSAGE_TEMPLATES.filter(t => t.audience === selectedAudience || t.audience === 'all')
    : MESSAGE_TEMPLATES;

  // Get audience customers array
  const audienceCustomers = useMemo(() => {
    if (!audienceSegments || !selectedAudience) return [];
    if (selectedAudience === 'all') return audienceSegments.withPhone || [];
    return audienceSegments[selectedAudience]?.filter(c => c.phone) || [];
  }, [audienceSegments, selectedAudience]);

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

      // Save campaign record
      const campaign = saveCampaign({
        name: selectedTemplate.name,
        templateId: selectedTemplate.id,
        audience: selectedAudience,
        audienceCount: validCustomers.length
      });

      // Record send event
      recordCampaignSend(campaign.id, {
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

  // Format template preview with sample data
  const formatPreview = (template) => {
    let body = template.body;
    const sampleData = {
      '{{1}}': 'Maria',
      '{{2}}': selectedAudience === 'withWallet' ? 'R$ 45,00' : '20',
      '{{3}}': 'VOLTE20',
      '{{4}}': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    };

    Object.entries(sampleData).forEach(([key, value]) => {
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
            const Icon = template.icon;
            const isSelected = selectedTemplate?.id === template.id;

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
                    {template.header}
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
                          {selectedTemplate.header}
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
