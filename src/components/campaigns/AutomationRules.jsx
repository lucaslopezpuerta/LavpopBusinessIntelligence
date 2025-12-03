// AutomationRules.jsx v1.1
// Automation rules configuration for campaigns
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.1 (2025-12-03): Added Brazilian mobile phone validation
//   - Counts only customers with valid WhatsApp numbers
//   - Uses isValidBrazilianMobile from phoneUtils

import React, { useState, useMemo } from 'react';
import {
  Zap,
  Clock,
  AlertTriangle,
  Sparkles,
  Wallet,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Settings,
  Play,
  Pause,
  Info
} from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import InsightBox from '../ui/InsightBox';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';

// Predefined automation rules
const AUTOMATION_RULES = [
  {
    id: 'winback_30',
    name: 'Win-back 30 dias',
    description: 'Enviar mensagem quando cliente não visita há 30 dias',
    icon: AlertTriangle,
    color: 'amber',
    trigger: {
      type: 'days_since_visit',
      value: 30,
      description: 'Última visita há 30+ dias'
    },
    action: {
      template: 'winback_30days',
      channel: 'whatsapp',
      description: 'Enviar cupom de 20% OFF'
    },
    enabled: false,
    priority: 'high',
    estimatedImpact: 'Recuperar 15-20% dos clientes em risco'
  },
  {
    id: 'winback_45',
    name: 'Win-back Crítico',
    description: 'Alerta urgente para clientes prestes a churnar',
    icon: AlertTriangle,
    color: 'red',
    trigger: {
      type: 'days_since_visit',
      value: 45,
      description: 'Última visita há 45+ dias'
    },
    action: {
      template: 'winback_critical',
      channel: 'whatsapp',
      description: 'Enviar cupom de 30% OFF + mensagem urgente'
    },
    enabled: false,
    priority: 'critical',
    estimatedImpact: 'Última chance de recuperação - oferta agressiva'
  },
  {
    id: 'welcome_new',
    name: 'Boas-vindas',
    description: 'Mensagem automática para novos clientes',
    icon: Sparkles,
    color: 'purple',
    trigger: {
      type: 'first_purchase',
      value: 1,
      description: 'Após primeira compra'
    },
    action: {
      template: 'welcome_new',
      channel: 'whatsapp',
      description: 'Enviar boas-vindas + dicas + cupom BEMVINDO10'
    },
    enabled: false,
    priority: 'medium',
    estimatedImpact: 'Aumentar retenção de novos clientes em 25%'
  },
  {
    id: 'wallet_reminder',
    name: 'Lembrete de Saldo',
    description: 'Lembrar clientes com créditos na carteira',
    icon: Wallet,
    color: 'blue',
    trigger: {
      type: 'wallet_balance',
      value: 20,
      description: 'Saldo > R$ 20 e inativo há 14 dias'
    },
    action: {
      template: 'wallet_reminder',
      channel: 'whatsapp',
      description: 'Lembrar sobre saldo disponível'
    },
    enabled: false,
    priority: 'low',
    estimatedImpact: 'Recuperar R$ médio de carteiras inativas'
  },
  {
    id: 'post_visit',
    name: 'Pós-Visita',
    description: 'Agradecer e pedir feedback após visita',
    icon: Calendar,
    color: 'emerald',
    trigger: {
      type: 'hours_after_visit',
      value: 24,
      description: '24 horas após visita'
    },
    action: {
      template: 'post_visit_thanks',
      channel: 'whatsapp',
      description: 'Agradecer + pedir avaliação no Google'
    },
    enabled: false,
    priority: 'medium',
    estimatedImpact: 'Aumentar avaliações positivas no Google Maps'
  }
];

const AutomationRules = ({ audienceSegments, formatCurrency }) => {
  const [rules, setRules] = useState(AUTOMATION_RULES);
  const [expandedRule, setExpandedRule] = useState(null);

  // Toggle rule enabled state
  const toggleRule = (ruleId) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  // Helper: filter customers with valid WhatsApp phones
  const withValidPhone = (customers) => {
    if (!customers) return [];
    return customers.filter(c => isValidBrazilianMobile(c.phone));
  };

  // Get affected customers count for a rule (only valid WhatsApp numbers)
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
        // Post-visit: customers who visited today with valid phone
        return withValidPhone(audienceSegments.all?.filter(c => c.daysSinceLastVisit === 0)).length;
      default:
        return 0;
    }
  };

  // Count enabled rules
  const enabledCount = rules.filter(r => r.enabled).length;

  return (
    <SectionCard
      title="Automações"
      subtitle="Configure campanhas automáticas baseadas em comportamento"
      icon={Zap}
      color="purple"
      id="automation-rules"
    >
      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-xl border ${
          enabledCount > 0
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {enabledCount > 0 ? (
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  <Pause className="w-5 h-5 text-slate-500" />
                </div>
              )}
              <div>
                <p className={`text-sm font-medium ${
                  enabledCount > 0
                    ? 'text-emerald-800 dark:text-emerald-200'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {enabledCount > 0
                    ? `${enabledCount} automação(ões) ativa(s)`
                    : 'Nenhuma automação ativa'}
                </p>
                <p className={`text-xs ${
                  enabledCount > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {enabledCount > 0
                    ? 'Mensagens serão enviadas automaticamente'
                    : 'Ative automações para engajar clientes automaticamente'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <InsightBox
          type="info"
          title="Como funcionam as automações?"
          message="Quando um cliente atinge o gatilho definido (ex: 30 dias sem visita), uma mensagem WhatsApp é enviada automaticamente. O sistema verifica diariamente os clientes elegíveis."
        />

        {/* Automation Rules List */}
        <div className="space-y-4">
          {rules.map((rule) => {
            const Icon = rule.icon;
            const isExpanded = expandedRule === rule.id;
            const affectedCount = getAffectedCount(rule);

            return (
              <div
                key={rule.id}
                className={`
                  border rounded-xl overflow-hidden transition-all duration-200
                  ${rule.enabled
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }
                `}
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${rule.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40' :
                          rule.color === 'red' ? 'bg-red-100 dark:bg-red-900/40' :
                          rule.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40' :
                          rule.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40' :
                          'bg-emerald-100 dark:bg-emerald-900/40'}
                      `}>
                        <Icon className={`
                          w-5 h-5
                          ${rule.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                            rule.color === 'red' ? 'text-red-600 dark:text-red-400' :
                            rule.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            rule.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            'text-emerald-600 dark:text-emerald-400'}
                        `} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {rule.name}
                          </h3>
                          <span className={`
                            px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase
                            ${rule.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                              rule.priority === 'high' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                              rule.priority === 'medium' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                              'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}
                          `}>
                            {rule.priority === 'critical' ? 'Crítico' :
                             rule.priority === 'high' ? 'Alta' :
                             rule.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {rule.description}
                        </p>
                        {affectedCount > 0 && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            {affectedCount} clientes elegíveis agora
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRule(rule.id);
                      }}
                      className={`
                        relative w-12 h-7 rounded-full transition-colors duration-200
                        ${rule.enabled
                          ? 'bg-emerald-500'
                          : 'bg-slate-300 dark:bg-slate-600'
                        }
                      `}
                      aria-label={rule.enabled ? 'Desativar automação' : 'Ativar automação'}
                    >
                      <div className={`
                        absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                        ${rule.enabled ? 'translate-x-6' : 'translate-x-1'}
                      `} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {/* Trigger */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                            Gatilho
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {rule.trigger.description}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                            Ação
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {rule.action.description}
                        </p>
                      </div>
                    </div>

                    {/* Expected Impact */}
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-purple-800 dark:text-purple-200">
                            Impacto Esperado
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {rule.estimatedImpact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98]"
          >
            <Settings className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </div>
    </SectionCard>
  );
};

export default AutomationRules;
