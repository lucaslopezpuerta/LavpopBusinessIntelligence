// AudienceSelector.jsx v1.1
// Audience targeting component for campaign creation
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.1 (2025-12-03): Updated to use Brazilian mobile phone validation
//   - Uses isValidBrazilianMobile from phoneUtils for accurate counts
//   - Filters audiences by valid WhatsApp-capable phones only

import React, { useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  Sparkles,
  Heart,
  Wallet,
  Phone,
  CheckCircle2
} from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';

const AudienceSelector = ({ audienceSegments, selectedAudience, onSelectAudience }) => {
  // Calculate counts with valid Brazilian mobile phones only
  const validCounts = useMemo(() => {
    if (!audienceSegments) return {};

    const countValid = (arr) => arr?.filter(c => isValidBrazilianMobile(c.phone)).length || 0;

    return {
      atRisk: countValid(audienceSegments.atRisk),
      newCustomers: countValid(audienceSegments.newCustomers),
      healthy: countValid(audienceSegments.healthy),
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

  const audiences = [
    {
      id: 'atRisk',
      label: 'Em Risco',
      description: 'Clientes que não visitam há 30+ dias',
      icon: AlertTriangle,
      count: validCounts.atRisk || 0,
      color: 'amber',
      priority: 'Alta',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    {
      id: 'newCustomers',
      label: 'Novos Clientes',
      description: 'Clientes com menos de 30 dias',
      icon: Sparkles,
      count: validCounts.newCustomers || 0,
      color: 'purple',
      priority: 'Média',
      bgGradient: 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      id: 'healthy',
      label: 'Clientes Saudáveis',
      description: 'Clientes ativos e frequentes',
      icon: Heart,
      count: validCounts.healthy || 0,
      color: 'emerald',
      priority: 'Baixa',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'withWallet',
      label: 'Com Saldo na Carteira',
      description: `Clientes com saldo ≥ R$ ${audienceSegments.walletThreshold || 10}`,
      icon: Wallet,
      count: validCounts.withWallet || 0,
      color: 'blue',
      priority: 'Média',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'all',
      label: 'Todos os Clientes',
      description: 'Todos os clientes com WhatsApp válido',
      icon: Users,
      count: validCounts.all || 0,
      color: 'slate',
      priority: '',
      bgGradient: 'from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50',
      borderColor: 'border-slate-200 dark:border-slate-700',
      iconBg: 'bg-slate-100 dark:bg-slate-700',
      iconColor: 'text-slate-600 dark:text-slate-400'
    }
  ];

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
                {audienceSegments.withPhone?.length > totalValidCount && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {' '}({audienceSegments.withPhone.length - totalValidCount} com telefone inválido)
                  </span>
                )}
              </p>
            </div>
          </div>
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
                {audience.priority && (
                  <span className={`
                    absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold rounded-full
                    ${audience.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                      audience.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' :
                      audience.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                      'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}
                    ${isSelected ? 'hidden' : ''}
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
              {audiences.find(a => a.id === selectedAudience)?.label} ({audiences.find(a => a.id === selectedAudience)?.count} clientes)
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Vá para a aba "Mensagens" para criar a campanha
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default AudienceSelector;
