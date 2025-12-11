// AutomationRules.jsx v4.0
// Automation rules configuration for campaigns
// Design System v3.1 compliant - Mobile-first redesign
//
// CHANGELOG:
// v4.0 (2025-12-11): Complete UX redesign
//   - Mobile-first responsive design
//   - Cleaner card layout with better visual hierarchy
//   - Progressive disclosure for advanced settings
//   - Improved status indicators and feedback
//   - Better grouping of related settings
//   - Sticky save button on mobile
//   - Enhanced accessibility
// v3.0 (2025-12-11): Enhanced automation controls
// v2.0 (2025-12-08): Supabase backend integration
// v1.2 (2025-12-08): Fixed persistence bug
// v1.1 (2025-12-03): Added Brazilian mobile phone validation

import { useState, useCallback, useEffect } from 'react';
import {
  Zap,
  Clock,
  AlertTriangle,
  Sparkles,
  Wallet,
  Calendar,
  Play,
  Pause,
  Info,
  Check,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Gift,
  Users,
  MessageCircle,
  Settings2,
  HelpCircle
} from 'lucide-react';
import { getBrazilNow } from '../../utils/dateUtils';
import SectionCard from '../ui/SectionCard';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';
import { getAutomationRules, saveAutomationRules, getAutomationRulesAsync, saveAutomationRulesAsync } from '../../utils/campaignService';

// Available coupon codes (must match POS system)
const COUPON_OPTIONS = [
  { code: 'VOLTE15', discount: 15, label: 'VOLTE15 (15%)' },
  { code: 'VOLTE20', discount: 20, label: 'VOLTE20 (20%)' },
  { code: 'VOLTE25', discount: 25, label: 'VOLTE25 (25%)' },
  { code: 'VOLTE30', discount: 30, label: 'VOLTE30 (30%)' },
  { code: 'BEM10', discount: 10, label: 'BEM10 (10%)' },
  { code: 'BEM15', discount: 15, label: 'BEM15 (15%)' },
  { code: 'BEM20', discount: 20, label: 'BEM20 (20%)' },
  { code: 'LAVA20', discount: 20, label: 'LAVA20 (20% lavagem)' },
  { code: 'LAVA25', discount: 25, label: 'LAVA25 (25% lavagem)' },
  { code: 'SECA20', discount: 20, label: 'SECA20 (20% secagem)' },
  { code: 'SECA25', discount: 25, label: 'SECA25 (25% secagem)' }
];

// Predefined automation rules
const AUTOMATION_RULES = [
  {
    id: 'winback_30',
    name: 'Win-back 30 dias',
    shortDesc: 'Reengaja clientes inativos há 30 dias',
    icon: AlertTriangle,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-900/20',
    trigger: {
      type: 'days_since_visit',
      value: 30,
      label: '30+ dias sem visita'
    },
    action: {
      template: 'winback_discount',
      channel: 'whatsapp',
      label: 'Cupom de desconto'
    },
    enabled: false,
    cooldown_days: 30,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: 'VOLTE20',
    discount_percent: 20,
    coupon_validity_days: 7,
    hasCoupon: true
  },
  {
    id: 'winback_45',
    name: 'Win-back Urgente',
    shortDesc: 'Última chance para clientes prestes a churnar',
    icon: AlertTriangle,
    color: 'red',
    gradient: 'from-red-500 to-rose-500',
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-900/20',
    trigger: {
      type: 'days_since_visit',
      value: 45,
      label: '45+ dias sem visita'
    },
    action: {
      template: 'winback_critical',
      channel: 'whatsapp',
      label: 'Oferta agressiva'
    },
    enabled: false,
    cooldown_days: 21,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: 'VOLTE30',
    discount_percent: 30,
    coupon_validity_days: 7,
    hasCoupon: true
  },
  {
    id: 'welcome_new',
    name: 'Boas-vindas',
    shortDesc: 'Recepção automática para novos clientes',
    icon: Sparkles,
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-500',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-900/20',
    trigger: {
      type: 'first_purchase',
      value: 1,
      label: 'Primeira compra'
    },
    action: {
      template: 'welcome_new',
      channel: 'whatsapp',
      label: 'Boas-vindas + cupom'
    },
    enabled: false,
    cooldown_days: 365,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: 'BEM10',
    discount_percent: 10,
    coupon_validity_days: 14,
    hasCoupon: true
  },
  {
    id: 'wallet_reminder',
    name: 'Lembrete de Saldo',
    shortDesc: 'Avisa clientes com créditos esquecidos',
    icon: Wallet,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-900/20',
    trigger: {
      type: 'wallet_balance',
      value: 20,
      label: 'Saldo > R$ 20'
    },
    action: {
      template: 'wallet_reminder',
      channel: 'whatsapp',
      label: 'Lembrete de saldo'
    },
    enabled: false,
    cooldown_days: 14,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: null,
    discount_percent: null,
    coupon_validity_days: null,
    hasCoupon: false
  },
  {
    id: 'post_visit',
    name: 'Pós-Visita',
    shortDesc: 'Agradece e pede avaliação no Google',
    icon: Calendar,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-900/20',
    trigger: {
      type: 'hours_after_visit',
      value: 24,
      label: '24h após visita'
    },
    action: {
      template: 'post_visit_thanks',
      channel: 'whatsapp',
      label: 'Feedback + Google'
    },
    enabled: false,
    cooldown_days: 7,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: null,
    discount_percent: null,
    coupon_validity_days: null,
    hasCoupon: false
  }
];

// Tooltip component for help icons - mobile friendly with fixed positioning
const Tooltip = ({ text }) => (
  <div className="group relative inline-flex items-center ml-1">
    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
    <div className="fixed sm:absolute bottom-auto sm:bottom-full left-4 right-4 sm:left-0 sm:right-auto top-1/2 sm:top-auto sm:mb-2 -translate-y-1/2 sm:translate-y-0 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 sm:w-52 z-[100] shadow-xl leading-relaxed pointer-events-none">
      {text}
      <div className="hidden sm:block absolute top-full left-4 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
    </div>
  </div>
);

// Status pill component
const StatusPill = ({ enabled, sendCount, maxSends, validUntil }) => {
  const now = new Date();
  const isExpired = validUntil && new Date(validUntil) < now;
  const isAtLimit = maxSends && sendCount >= maxSends;

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
        Encerrada
      </span>
    );
  }

  if (isAtLimit) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
        Limite atingido
      </span>
    );
  }

  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        Ativa
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
      Inativa
    </span>
  );
};

// Input field component for consistency
const InputField = ({ label, tooltip, children, className = '' }) => (
  <div className={className}>
    <label className="flex items-center text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
      {label}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
    {children}
  </div>
);

const AutomationRules = ({ audienceSegments }) => {
  const [rules, setRules] = useState(AUTOMATION_RULES);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRule, setExpandedRule] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load rules on mount
  useEffect(() => {
    const loadRules = async () => {
      setIsLoading(true);
      try {
        const savedRules = await getAutomationRulesAsync();
        const savedMap = new Map(savedRules.map(r => [r.id, r]));

        setRules(AUTOMATION_RULES.map(defaultRule => {
          const saved = savedMap.get(defaultRule.id);
          if (saved) {
            return {
              ...defaultRule,
              enabled: saved.enabled ?? defaultRule.enabled,
              cooldown_days: saved.cooldown_days ?? defaultRule.cooldown_days,
              valid_until: saved.valid_until ?? defaultRule.valid_until,
              max_total_sends: saved.max_total_sends ?? defaultRule.max_total_sends,
              total_sends_count: saved.total_sends_count ?? defaultRule.total_sends_count,
              coupon_code: saved.coupon_code ?? defaultRule.coupon_code,
              discount_percent: saved.discount_percent ?? defaultRule.discount_percent,
              coupon_validity_days: saved.coupon_validity_days ?? defaultRule.coupon_validity_days
            };
          }
          return defaultRule;
        }));
      } catch (error) {
        console.error('Error loading automation rules:', error);
        const savedRules = getAutomationRules();
        const savedMap = new Map(savedRules.map(r => [r.id, r]));

        setRules(AUTOMATION_RULES.map(defaultRule => {
          const saved = savedMap.get(defaultRule.id);
          return saved ? { ...defaultRule, ...saved } : defaultRule;
        }));
      } finally {
        setIsLoading(false);
      }
    };
    loadRules();
  }, []);

  const toggleRule = useCallback((ruleId) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  const updateRuleField = useCallback((ruleId, field, value) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, [field]: value } : rule
    ));
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  const updateCouponCode = useCallback((ruleId, couponCode) => {
    const couponOption = COUPON_OPTIONS.find(c => c.code === couponCode);
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? {
        ...rule,
        coupon_code: couponCode,
        discount_percent: couponOption?.discount ?? rule.discount_percent
      } : rule
    ));
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    const rulesToSave = rules.map(r => ({
      id: r.id,
      name: r.name,
      enabled: r.enabled,
      trigger: r.trigger,
      action: r.action,
      cooldown_days: r.cooldown_days,
      valid_until: r.valid_until,
      max_total_sends: r.max_total_sends,
      coupon_code: r.coupon_code,
      discount_percent: r.discount_percent,
      coupon_validity_days: r.coupon_validity_days
    }));

    try {
      await saveAutomationRulesAsync(rulesToSave);
    } catch (error) {
      console.error('Error saving automation rules:', error);
      saveAutomationRules(rulesToSave);
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setHasChanges(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  }, [rules]);

  const withValidPhone = (customers) => {
    if (!customers) return [];
    return customers.filter(c => isValidBrazilianMobile(c.phone));
  };

  const getAffectedCount = (rule) => {
    if (!audienceSegments) return 0;

    switch (rule.trigger.type) {
      case 'days_since_visit':
        if (rule.trigger.value === 30) return withValidPhone(audienceSegments.atRisk).length;
        if (rule.trigger.value === 45) return withValidPhone(audienceSegments.atRisk?.filter(c => c.daysSinceLastVisit >= 45)).length;
        return 0;
      case 'first_purchase':
        return withValidPhone(audienceSegments.newCustomers).length;
      case 'wallet_balance':
        return withValidPhone(audienceSegments.withWallet).length;
      case 'hours_after_visit':
        return withValidPhone(audienceSegments.all?.filter(c => c.daysSinceLastVisit === 0)).length;
      default:
        return 0;
    }
  };

  const enabledCount = rules.filter(r => r.enabled).length;
  const totalSent = rules.reduce((sum, r) => sum + (r.total_sends_count || 0), 0);

  if (isLoading) {
    return (
      <SectionCard
        title="Automações"
        subtitle="Configure campanhas automáticas"
        icon={Zap}
        color="purple"
        id="automation-rules"
      >
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando automações...</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Automações"
      subtitle="Engaje clientes automaticamente"
      icon={Zap}
      color="purple"
      id="automation-rules"
    >
      <div className="space-y-6">
        {/* Stats Header */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className={`p-4 rounded-xl ${enabledCount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-center gap-2 mb-1">
              {enabledCount > 0 ? (
                <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Pause className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ativas</span>
            </div>
            <p className={`text-2xl font-bold ${enabledCount > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
              {enabledCount}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Enviados</span>
            </div>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {totalSent}
            </p>
          </div>

          <div className="hidden sm:block p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Settings2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {rules.length}
            </p>
          </div>
        </div>

        {/* How it works - collapsible */}
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <Info className="w-4 h-4" />
            <span>Como funcionam as automações?</span>
            <ChevronDown className="w-4 h-4 ml-auto transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 text-sm text-purple-700 dark:text-purple-300">
            <p>Quando um cliente atinge o gatilho definido (ex: 30 dias sem visita), uma mensagem WhatsApp é enviada automaticamente. O sistema verifica diariamente e respeita o intervalo configurado entre envios.</p>
          </div>
        </details>

        {/* Rules List */}
        <div className="space-y-3">
          {rules.map((rule) => {
            const Icon = rule.icon;
            const isExpanded = expandedRule === rule.id;
            const affectedCount = getAffectedCount(rule);
            const isAdvancedOpen = showAdvanced[rule.id];

            return (
              <div
                key={rule.id}
                className={`
                  rounded-2xl border transition-all duration-300 overflow-hidden
                  ${rule.enabled
                    ? 'border-emerald-200 dark:border-emerald-800 shadow-sm shadow-emerald-100 dark:shadow-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-700'
                  }
                  ${isExpanded ? 'ring-2 ring-purple-500/20' : ''}
                `}
              >
                {/* Card Header */}
                <div
                  className={`p-4 cursor-pointer transition-colors ${rule.enabled ? `${rule.bgLight} ${rule.bgDark}` : 'bg-white dark:bg-slate-800'}`}
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${rule.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title row with toggle */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                          {rule.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRule(rule.id);
                            }}
                            className={`
                              relative w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all duration-300
                              ${rule.enabled
                                ? 'bg-emerald-500 shadow-inner'
                                : 'bg-slate-300 dark:bg-slate-600'
                              }
                            `}
                            aria-label={rule.enabled ? 'Desativar' : 'Ativar'}
                          >
                            <div className={`
                              absolute top-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center
                              ${rule.enabled ? 'left-6 sm:left-7' : 'left-1'}
                            `}>
                              {rule.enabled ? (
                                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                              ) : (
                                <span className="w-1.5 h-0.5 sm:w-2 bg-slate-400 rounded-full" />
                              )}
                            </div>
                          </button>
                          {/* Expand indicator */}
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Status pill and description */}
                      <div className="flex items-center gap-2 mb-2">
                        <StatusPill
                          enabled={rule.enabled}
                          sendCount={rule.total_sends_count}
                          maxSends={rule.max_total_sends}
                          validUntil={rule.valid_until}
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-snug">
                        {rule.shortDesc}
                      </p>

                      {/* Quick Stats */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] sm:text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {rule.trigger.label}
                        </span>
                        {affectedCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {affectedCount} elegíveis
                          </span>
                        )}
                        {rule.total_sends_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {rule.total_sends_count} enviados
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                    <div className="p-4 space-y-5">
                      {/* Main Settings */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Settings2 className="w-4 h-4" />
                          Configurações
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Cooldown */}
                          <InputField
                            label="Intervalo entre envios"
                            tooltip="Quantos dias esperar antes de enviar novamente para o mesmo cliente"
                          >
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="365"
                                value={rule.cooldown_days || 14}
                                onChange={(e) => updateRuleField(rule.id, 'cooldown_days', parseInt(e.target.value) || 14)}
                                className="w-full h-11 pl-4 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">dias</span>
                            </div>
                          </InputField>

                          {/* Stop Date */}
                          <InputField
                            label="Data de encerramento"
                            tooltip="A automação para automaticamente após esta data"
                          >
                            <input
                              type="date"
                              value={rule.valid_until ? rule.valid_until.split('T')[0] : ''}
                              onChange={(e) => updateRuleField(rule.id, 'valid_until', e.target.value ? new Date(e.target.value + 'T23:59:59-03:00').toISOString() : null)}
                              min={getBrazilNow().date}
                              placeholder="Sem limite"
                              className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </InputField>
                        </div>

                        {/* Coupon Settings - only for rules with coupons */}
                        {rule.hasCoupon && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
                              <Gift className="w-4 h-4" />
                              Cupom de Desconto
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Coupon Code */}
                              <InputField
                                label="Código do cupom"
                                tooltip="Deve existir no sistema POS"
                              >
                                <select
                                  value={rule.coupon_code || ''}
                                  onChange={(e) => updateCouponCode(rule.id, e.target.value)}
                                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                                >
                                  <option value="">Selecionar cupom</option>
                                  {COUPON_OPTIONS.map(opt => (
                                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                                  ))}
                                </select>
                              </InputField>

                              {/* Coupon Validity */}
                              <InputField
                                label="Validade do cupom"
                                tooltip="Por quantos dias o cupom será válido"
                              >
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={rule.coupon_validity_days || 7}
                                    onChange={(e) => updateRuleField(rule.id, 'coupon_validity_days', parseInt(e.target.value) || 7)}
                                    className="w-full h-11 pl-4 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">dias</span>
                                </div>
                              </InputField>
                            </div>

                            {/* Coupon Preview */}
                            {rule.coupon_code && (
                              <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                  <strong>{rule.coupon_code}</strong> • {rule.discount_percent}% de desconto • Válido por {rule.coupon_validity_days || 7} dias
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Advanced Settings Toggle */}
                      <button
                        onClick={() => setShowAdvanced(prev => ({ ...prev, [rule.id]: !prev[rule.id] }))}
                        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      >
                        {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Configurações avançadas
                      </button>

                      {/* Advanced Settings */}
                      {isAdvancedOpen && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                          <InputField
                            label="Limite máximo de envios"
                            tooltip="A automação para após atingir este número total de envios"
                          >
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                placeholder="Sem limite"
                                value={rule.max_total_sends || ''}
                                onChange={(e) => updateRuleField(rule.id, 'max_total_sends', e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full h-11 pl-4 pr-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">mensagens</span>
                            </div>
                          </InputField>

                          {/* Progress bar if limit is set */}
                          {rule.max_total_sends && (
                            <div>
                              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                                <span>Progresso</span>
                                <span>{rule.total_sends_count || 0} / {rule.max_total_sends}</span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, ((rule.total_sends_count || 0) / rule.max_total_sends) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Summary */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          <strong className="text-slate-700 dark:text-slate-300">Resumo:</strong>{' '}
                          {rule.enabled ? 'Enviando' : 'Quando ativada, enviará'} {rule.action.label.toLowerCase()} via WhatsApp para clientes com {rule.trigger.label.toLowerCase()}.
                          {rule.cooldown_days && ` Intervalo de ${rule.cooldown_days} dias entre mensagens.`}
                          {rule.valid_until && ` Encerra em ${new Date(rule.valid_until).toLocaleDateString('pt-BR')}.`}
                          {rule.max_total_sends && ` Limite de ${rule.max_total_sends} envios.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky Save Button */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900">
          <div className="flex items-center justify-between gap-4">
            {/* Status Messages */}
            <div className="flex-1 min-w-0">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 animate-fade-in">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">Salvo com sucesso!</span>
                </div>
              )}
              {hasChanges && !saveSuccess && (
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  Alterações não salvas
                </span>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || (!hasChanges && !enabledCount)}
              className={`
                flex items-center gap-2 px-6 py-3 font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98] whitespace-nowrap
                ${hasChanges
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/25'
                }
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
              `}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">{hasChanges ? 'Salvar' : 'Salvar'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default AutomationRules;
