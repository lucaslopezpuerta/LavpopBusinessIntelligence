// AudienceSelector.jsx v2.0
// Audience targeting component for campaign creation
// Design System v3.1 compliant
//
// CHANGELOG:
// v2.0 (2025-12-10): Portuguese RFM segment integration
//   - Added RFM-based segments (VIP, Frequente, Promissor, Esfriando, Inativo)
//   - Updated Portuguese terminology for all segments
//   - Organized into "Retenção" (Churn Risk) and "Marketing" (RFM) categories
// v1.1 (2025-12-03): Updated to use Brazilian mobile phone validation
//   - Uses isValidBrazilianMobile from phoneUtils for accurate counts
//   - Filters audiences by valid WhatsApp-capable phones only

import React, { useMemo, useState } from 'react';
import {
  Users,
  AlertTriangle,
  Sparkles,
  Heart,
  Wallet,
  Phone,
  CheckCircle2,
  Crown,
  TrendingUp,
  Snowflake,
  Moon,
  Target
} from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';

const AudienceSelector = ({ audienceSegments, selectedAudience, onSelectAudience }) => {
  // Category filter: 'all', 'retention', 'marketing'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Calculate counts with valid Brazilian mobile phones only
  const validCounts = useMemo(() => {
    if (!audienceSegments) return {};

    const countValid = (arr) => arr?.filter(c => isValidBrazilianMobile(c.phone)).length || 0;

    return {
      // Churn Risk Level segments (Retention focus)
      atRisk: countValid(audienceSegments.atRisk),
      newCustomers: countValid(audienceSegments.newCustomers),
      healthy: countValid(audienceSegments.healthy),
      // RFM Segments (Marketing focus)
      vip: countValid(audienceSegments.vip),
      frequent: countValid(audienceSegments.frequent),
      promising: countValid(audienceSegments.promising),
      cooling: countValid(audienceSegments.cooling),
      inactive: countValid(audienceSegments.inactive),
      // Other
      withWallet: countValid(audienceSegments.withWallet),
      all: countValid(audienceSegments.withPhone)
    };
  }, [audienceSegments]);

  // Total customers with valid WhatsApp
  const totalValidCount = validCounts.all || 0;

  if (!audienceSegments) {
    return (
      <SectionCard
        title="Selecionar Audiência"
        subtitle="Escolha o público-alvo da sua campanha"
        icon={Users}
        color="purple"
      >
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          Carregando dados de clientes...
        </div>
      </SectionCard>
    );
  }

  // Retention-focused audiences (based on Churn Risk Levels)
  const retentionAudiences = [
    {
      id: 'atRisk',
      label: 'Em Risco / Crítico',
      description: 'Clientes que precisam de atenção urgente',
      icon: AlertTriangle,
      count: validCounts.atRisk || 0,
      color: 'amber',
      priority: 'Alta',
      category: 'retention',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    {
      id: 'newCustomers',
      label: 'Novos Clientes',
      description: 'Clientes recém-cadastrados',
      icon: Sparkles,
      count: validCounts.newCustomers || 0,
      color: 'purple',
      priority: 'Média',
      category: 'retention',
      bgGradient: 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      id: 'healthy',
      label: 'Saudáveis',
      description: 'Clientes ativos com boa frequência',
      icon: Heart,
      count: validCounts.healthy || 0,
      color: 'emerald',
      priority: 'Baixa',
      category: 'retention',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    }
  ];

  // Marketing-focused audiences (based on RFM Segments)
  const marketingAudiences = [
    {
      id: 'vip',
      label: 'VIP',
      description: 'Melhores clientes - alto valor',
      icon: Crown,
      count: validCounts.vip || 0,
      color: 'yellow',
      priority: 'Premium',
      category: 'marketing',
      bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      id: 'frequent',
      label: 'Frequentes',
      description: 'Visitantes regulares e fiéis',
      icon: Heart,
      count: validCounts.frequent || 0,
      color: 'blue',
      priority: 'Alta',
      category: 'marketing',
      bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'promising',
      label: 'Promissores',
      description: 'Clientes em crescimento',
      icon: TrendingUp,
      count: validCounts.promising || 0,
      color: 'cyan',
      priority: 'Média',
      category: 'marketing',
      bgGradient: 'from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20',
      borderColor: 'border-cyan-200 dark:border-cyan-800',
      iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
      iconColor: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      id: 'cooling',
      label: 'Esfriando',
      description: 'Precisam de reengajamento',
      icon: Snowflake,
      count: validCounts.cooling || 0,
      color: 'slate',
      priority: 'Alta',
      category: 'marketing',
      bgGradient: 'from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20',
      borderColor: 'border-slate-200 dark:border-slate-700',
      iconBg: 'bg-slate-100 dark:bg-slate-700',
      iconColor: 'text-slate-600 dark:text-slate-400'
    },
    {
      id: 'inactive',
      label: 'Inativos',
      description: 'Sem engajamento recente',
      icon: Moon,
      count: validCounts.inactive || 0,
      color: 'gray',
      priority: 'Win-back',
      category: 'marketing',
      bgGradient: 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50',
      borderColor: 'border-gray-200 dark:border-gray-700',
      iconBg: 'bg-gray-100 dark:bg-gray-700',
      iconColor: 'text-gray-600 dark:text-gray-400'
    }
  ];

  // Other audiences
  const otherAudiences = [
    {
      id: 'withWallet',
      label: 'Com Saldo na Carteira',
      description: `Clientes com saldo ≥ R$ ${audienceSegments?.walletThreshold || 10}`,
      icon: Wallet,
      count: validCounts.withWallet || 0,
      color: 'green',
      priority: 'Média',
      category: 'other',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'all',
      label: 'Todos os Clientes',
      description: 'Todos os clientes com WhatsApp válido',
      icon: Users,
      count: validCounts.all || 0,
      color: 'slate',
      priority: '',
      category: 'other',
      bgGradient: 'from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50',
      borderColor: 'border-slate-200 dark:border-slate-700',
      iconBg: 'bg-slate-100 dark:bg-slate-700',
      iconColor: 'text-slate-600 dark:text-slate-400'
    }
  ];

  // Combine and filter by category
  const allAudiences = [...retentionAudiences, ...marketingAudiences, ...otherAudiences];
  const audiences = categoryFilter === 'all'
    ? allAudiences
    : categoryFilter === 'retention'
      ? [...retentionAudiences, ...otherAudiences]
      : [...marketingAudiences, ...otherAudiences];

  return (
    <SectionCard
      title="Selecionar Audiência"
      subtitle="Escolha o público-alvo da sua campanha WhatsApp"
      icon={Users}
      color="purple"
      id="audience-selector"
    >
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Apenas clientes com celular brasileiro válido
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {totalValidCount} clientes disponíveis para mensagens WhatsApp
                {audienceSegments?.withPhone?.length > totalValidCount && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {' '}({audienceSegments.withPhone.length - totalValidCount} com telefone inválido)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            Filtrar:
          </span>
          {[
            { id: 'all', label: 'Todos', icon: Users },
            { id: 'retention', label: 'Retenção', icon: AlertTriangle },
            { id: 'marketing', label: 'Marketing (RFM)', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCategoryFilter(id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${categoryFilter === id
                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Audience Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            const isSelected = selectedAudience === audience.id;
            const hasCustomers = audience.count > 0;

            return (
              <button
                key={audience.id}
                onClick={() => hasCustomers && onSelectAudience(audience.id)}
                disabled={!hasCustomers}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all duration-200
                  ${isSelected
                    ? `bg-gradient-to-br ${audience.bgGradient} ${audience.borderColor} shadow-md ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900`
                    : hasCustomers
                      ? `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm`
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                )}

                {/* Priority Badge */}
                {audience.priority && !isSelected && (
                  <span className={`
                    absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold rounded-full
                    ${audience.priority === 'Premium' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                      audience.priority === 'Alta' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                      audience.priority === 'Média' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                      audience.priority === 'Baixa' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                      audience.priority === 'Win-back' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' :
                      'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}
                  `}>
                    {audience.priority}
                  </span>
                )}

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl ${audience.iconBg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${audience.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {audience.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {audience.description}
                </p>

                {/* Count */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {audience.count}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    clientes
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Summary */}
        {selectedAudience && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <span className="font-semibold">Audiência selecionada:</span>{' '}
              {allAudiences.find(a => a.id === selectedAudience)?.label} ({allAudiences.find(a => a.id === selectedAudience)?.count} clientes)
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Clique em "Nova Campanha" ou vá para a aba "Mensagens" para enviar
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default AudienceSelector;
