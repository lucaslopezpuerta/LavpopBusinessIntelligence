// NewCampaignModal.jsx v1.1
// Campaign creation wizard modal
// Design System v3.1 compliant
//
// CHANGELOG:
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
  Calendar
} from 'lucide-react';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';
import {
  sendBulkWhatsApp,
  saveCampaign,
  recordCampaignSend,
  validateCampaignAudience
} from '../../utils/campaignService';

// Storage key for scheduled campaigns
const SCHEDULED_CAMPAIGNS_KEY = 'lavpop_scheduled_campaigns';

/**
 * Save a scheduled campaign to localStorage
 */
function saveScheduledCampaign(campaign) {
  try {
    const stored = localStorage.getItem(SCHEDULED_CAMPAIGNS_KEY);
    const campaigns = stored ? JSON.parse(stored) : [];
    campaigns.push({
      ...campaign,
      id: `SCHED_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'scheduled'
    });
    localStorage.setItem(SCHEDULED_CAMPAIGNS_KEY, JSON.stringify(campaigns));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all scheduled campaigns
 */
export function getScheduledCampaigns() {
  try {
    const stored = localStorage.getItem(SCHEDULED_CAMPAIGNS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Message templates (same as MessageComposer)
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
    body: `Olá {{nome}}!

Faz tempo que não nos vemos. Sabemos que a vida fica corrida, mas suas roupas merecem o melhor cuidado!

Volte à Lavpop e aproveite nossa oferta especial:
🎁 *20% de desconto* no seu próximo ciclo

Use o cupom *VOLTE20* até {{validade}}.

Esperamos você! 💙`,
    footer: 'Lavpop - Lavanderia Self-Service'
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
    body: `Olá {{nome}}!

Obrigado por escolher a Lavpop! Esperamos que sua primeira experiência tenha sido incrível.

Aqui estão algumas dicas:
✨ Horários de menor movimento: 7h-9h e 14h-16h
💳 Você ganhou cashback na sua carteira digital
📱 Baixe nosso app para acompanhar suas lavagens

Na sua próxima visita, use o cupom *BEMVINDO10* e ganhe 10% OFF!

Qualquer dúvida, estamos aqui. 💙`,
    footer: 'Lavpop - Lavanderia Self-Service'
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
    body: `Olá {{nome}}!

Você sabia que tem *{{saldo}}* de crédito na sua carteira Lavpop?

Não deixe seu saldo parado! Use seus créditos na próxima lavagem e economize.

🕐 Funcionamos das 7h às 21h, todos os dias.

Te esperamos! 💙`,
    footer: 'Lavpop - Lavanderia Self-Service'
  },
  {
    id: 'promo_seasonal',
    name: 'Promoção Geral',
    category: 'MARKETING',
    icon: Gift,
    color: 'emerald',
    description: 'Para campanhas promocionais gerais',
    audience: 'all',
    header: '🎁 Promoção Especial!',
    body: `Olá {{nome}}!

Temos uma novidade especial para você:

*Promoção de Fim de Ano*

🎯 20% de desconto em todos os serviços
📅 Válido até 31/12

Aproveite! 💙`,
    footer: 'Lavpop - Lavanderia Self-Service'
  }
];

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

  // Format message preview with sample data
  const formatPreview = (template, customer = null) => {
    if (!template) return '';

    let body = template.body;
    const validade = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

    // Use real customer data if available, otherwise sample
    const replacements = {
      '{{nome}}': customer?.name || 'Cliente',
      '{{saldo}}': customer?.walletBalance
        ? `R$ ${customer.walletBalance.toFixed(2).replace('.', ',')}`
        : 'R$ 45,00',
      '{{validade}}': validade
    };

    Object.entries(replacements).forEach(([key, value]) => {
      body = body.replace(new RegExp(key, 'g'), value);
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

      // Save scheduled campaign
      const saved = saveScheduledCampaign({
        name: selectedTemplate.name,
        templateId: selectedTemplate.id,
        audience: selectedAudience,
        audienceCount: validationStats.ready.length,
        scheduledFor: scheduledDateTime.toISOString(),
        messageBody: formatPreview(selectedTemplate),
        recipients: validationStats.ready.map(c => ({
          phone: c.phone,
          name: c.name
        }))
      });

      setIsSending(false);

      if (saved) {
        setSendResult({
          success: true,
          scheduled: true,
          scheduledFor: scheduledDateTime
        });
      } else {
        setSendResult({
          success: false,
          error: 'Erro ao agendar campanha'
        });
      }
      return;
    }

    // Handle immediate send
    setIsSending(true);
    setSendResult(null);

    try {
      const messageBody = formatPreview(selectedTemplate);

      const result = await sendBulkWhatsApp(
        validationStats.ready,
        messageBody,
        selectedTemplate.id
      );

      // Save campaign record
      const campaign = saveCampaign({
        name: selectedTemplate.name,
        templateId: selectedTemplate.id,
        audience: selectedAudience,
        audienceCount: validationStats.ready.length
      });

      // Record send event
      recordCampaignSend(campaign.id, {
        recipients: validationStats.ready.length,
        successCount: result.results?.success?.length || validationStats.ready.length,
        failedCount: result.results?.failed?.length || 0
      });

      setSendResult({
        success: true,
        sent: result.results?.success?.length || validationStats.ready.length,
        failed: result.results?.failed?.length || 0
      });

    } catch (error) {
      console.error('Campaign send error:', error);
      setSendResult({
        success: false,
        error: error.message || 'Erro ao enviar campanha'
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
                  const Icon = template.icon;
                  const isSelected = selectedTemplate?.id === template.id;

                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
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
                <div className={`p-6 rounded-xl text-center ${
                  sendResult.success
                    ? sendResult.scheduled
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'bg-emerald-50 dark:bg-emerald-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
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
                    ) : (
                      <>
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                          Campanha Enviada!
                        </h3>
                        <p className="text-emerald-600 dark:text-emerald-400">
                          {sendResult.sent} mensagens enviadas com sucesso
                          {sendResult.failed > 0 && `, ${sendResult.failed} falharam`}
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
                    </>
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
