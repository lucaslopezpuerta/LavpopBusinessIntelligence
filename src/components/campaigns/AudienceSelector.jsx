// AudienceSelector.jsx v3.0
// Audience targeting component for campaign creation
// Design System v4.0 compliant - Enhanced UX
//
// CHANGELOG:
// v3.0 (2025-12-11): Complete UX redesign
//   - Stats dashboard header with gradient backgrounds
//   - Gradient icons matching AutomationRules design
//   - Mobile-first responsive layout
//   - Improved card interactions and hover states
//   - Better visual hierarchy and typography
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
  Target,
  UserCheck,
  Filter
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

  // Calculate stats for header
  const stats = useMemo(() => {
    const retentionCount = (validCounts.atRisk || 0) + (validCounts.newCustomers || 0) + (validCounts.healthy || 0);
    const marketingCount = (validCounts.vip || 0) + (validCounts.frequent || 0) + (validCounts.promising || 0) + (validCounts.cooling || 0) + (validCounts.inactive || 0);
    // Attention: only atRisk and cooling (not inactive - they need win-back, not attention)
    const needAttention = (validCounts.atRisk || 0) + (validCounts.cooling || 0);

    return {
      total: totalValidCount,
      retention: retentionCount,
      marketing: marketingCount,
      needAttention
    };
  }, [validCounts, totalValidCount]);

  // Clear selection when filter changes
  const handleFilterChange = (filterId) => {
    setCategoryFilter(filterId);
    if (selectedAudience) {
      onSelectAudience(null);
    }
  };

  if (!audienceSegments) {
    return (
      <SectionCard
        title="Selecionar Audiência"
        subtitle="Escolha o público-alvo da sua campanha"
        icon={Users}
        color="purple"
      >
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Users className="w-6 h-6 text-slate-400 animate-pulse" />
          </div>
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
      shortDesc: 'Precisam de atenção urgente',
      description: 'Clientes inativos há 30+ dias que podem estar abandonando',
      icon: AlertTriangle,
      count: validCounts.atRisk || 0,
      priority: 'Alta',
      category: 'retention',
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      bgDark: 'dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      ringColor: 'ring-amber-500'
    },
    {
      id: 'newCustomers',
      label: 'Novos Clientes',
      shortDesc: 'Cadastrados recentemente',
      description: 'Clientes com primeira compra nos últimos 30 dias',
      icon: Sparkles,
      count: validCounts.newCustomers || 0,
      priority: 'Média',
      category: 'retention',
      gradient: 'from-purple-500 to-indigo-500',
      bgLight: 'bg-purple-50',
      bgDark: 'dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      ringColor: 'ring-purple-500'
    },
    {
      id: 'healthy',
      label: 'Saudáveis',
      shortDesc: 'Ativos com boa frequência',
      description: 'Clientes que visitam regularmente e estão engajados',
      icon: Heart,
      count: validCounts.healthy || 0,
      priority: 'Baixa',
      category: 'retention',
      gradient: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50',
      bgDark: 'dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      ringColor: 'ring-emerald-500'
    }
  ];

  // Marketing-focused audiences (based on RFM Segments)
  const marketingAudiences = [
    {
      id: 'vip',
      label: 'VIP',
      shortDesc: 'Melhores clientes',
      description: 'Alto valor, alta frequência - seus clientes mais importantes',
      icon: Crown,
      count: validCounts.vip || 0,
      priority: 'Premium',
      category: 'marketing',
      gradient: 'from-yellow-500 to-amber-500',
      bgLight: 'bg-yellow-50',
      bgDark: 'dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      ringColor: 'ring-yellow-500'
    },
    {
      id: 'frequent',
      label: 'Frequentes',
      shortDesc: 'Visitantes regulares',
      description: 'Visitam com frequência consistente',
      icon: Heart,
      count: validCounts.frequent || 0,
      priority: 'Alta',
      category: 'marketing',
      gradient: 'from-blue-500 to-indigo-500',
      bgLight: 'bg-blue-50',
      bgDark: 'dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      ringColor: 'ring-blue-500'
    },
    {
      id: 'promising',
      label: 'Promissores',
      shortDesc: 'Em crescimento',
      description: 'Mostram potencial para se tornarem frequentes',
      icon: TrendingUp,
      count: validCounts.promising || 0,
      priority: 'Média',
      category: 'marketing',
      gradient: 'from-cyan-500 to-teal-500',
      bgLight: 'bg-cyan-50',
      bgDark: 'dark:bg-cyan-900/20',
      borderColor: 'border-cyan-200 dark:border-cyan-800',
      ringColor: 'ring-cyan-500'
    },
    {
      id: 'cooling',
      label: 'Esfriando',
      shortDesc: 'Precisam reengajar',
      description: 'Diminuíram a frequência recentemente',
      icon: Snowflake,
      count: validCounts.cooling || 0,
      priority: 'Alta',
      category: 'marketing',
      gradient: 'from-slate-500 to-blue-500',
      bgLight: 'bg-slate-50',
      bgDark: 'dark:bg-slate-800/50',
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'ring-slate-500'
    },
    {
      id: 'inactive',
      label: 'Inativos',
      shortDesc: 'Sem engajamento',
      description: 'Não visitam há muito tempo',
      icon: Moon,
      count: validCounts.inactive || 0,
      priority: 'Win-back',
      category: 'marketing',
      gradient: 'from-gray-500 to-slate-500',
      bgLight: 'bg-gray-50',
      bgDark: 'dark:bg-gray-800/50',
      borderColor: 'border-gray-200 dark:border-gray-700',
      ringColor: 'ring-gray-500'
    }
  ];

  // Other audiences
  const otherAudiences = [
    {
      id: 'withWallet',
      label: 'Com Saldo',
      shortDesc: `Saldo ≥ R$ ${audienceSegments?.walletThreshold || 10}`,
      description: 'Clientes com crédito na carteira digital',
      icon: Wallet,
      count: validCounts.withWallet || 0,
      priority: 'Média',
      category: 'other',
      gradient: 'from-green-500 to-emerald-500',
      bgLight: 'bg-green-50',
      bgDark: 'dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      ringColor: 'ring-green-500'
    },
    {
      id: 'all',
      label: 'Todos',
      shortDesc: 'Base completa',
      description: 'Todos os clientes com WhatsApp válido',
      icon: Users,
      count: validCounts.all || 0,
      priority: '',
      category: 'other',
      gradient: 'from-slate-500 to-gray-500',
      bgLight: 'bg-slate-50',
      bgDark: 'dark:bg-slate-800/50',
      borderColor: 'border-slate-200 dark:border-slate-700',
      ringColor: 'ring-slate-500'
    }
  ];

  // Combine and filter by category
  const allAudiences = [...retentionAudiences, ...marketingAudiences, ...otherAudiences];
  const audiences = categoryFilter === 'all'
    ? allAudiences
    : categoryFilter === 'retention'
      ? [...retentionAudiences, ...otherAudiences]
      : [...marketingAudiences, ...otherAudiences];

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Premium': return 'bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900';
      case 'Alta': return 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-900';
      case 'Média': return 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white';
      case 'Baixa': return 'bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-900';
      case 'Win-back': return 'bg-gradient-to-r from-purple-400 to-pink-400 text-white';
      default: return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
    }
  };

  return (
    <SectionCard
      title="Selecionar Audiência"
      subtitle="Escolha o público-alvo da sua campanha WhatsApp"
      icon={Users}
      color="purple"
      id="audience-selector"
    >
      <div className="space-y-5">
        {/* Stats Dashboard Header */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Disponível */}
          <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 opacity-80" />
              <span className="text-xs font-medium opacity-90">WhatsApp</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.total.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs opacity-75">clientes disponíveis</p>
          </div>

          {/* Precisam Atenção */}
          <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 opacity-80" />
              <span className="text-xs font-medium opacity-90">Atenção</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.needAttention.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs opacity-75">precisam ação</p>
          </div>
        </div>

        {/* Discrete Info Hint */}
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Phone className="w-3 h-3" />
          Apenas celulares brasileiros válidos
          {audienceSegments?.withPhone?.length > totalValidCount && (
            <span className="text-amber-500 dark:text-amber-400">
              · {audienceSegments.withPhone.length - totalValidCount} filtrados
            </span>
          )}
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Filtrar:
            </span>
          </div>
          {[
            { id: 'all', label: 'Todos', icon: Users, count: allAudiences.length },
            { id: 'retention', label: 'Retenção', icon: UserCheck, count: retentionAudiences.length + otherAudiences.length },
            { id: 'marketing', label: 'Marketing', icon: Target, count: marketingAudiences.length + otherAudiences.length }
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => handleFilterChange(id)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200
                ${categoryFilter === id
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                categoryFilter === id
                  ? 'bg-white/20'
                  : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Audience Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                  relative p-4 rounded-xl border-2 text-left transition-all duration-200 group
                  ${isSelected
                    ? `${audience.bgLight} ${audience.bgDark} ${audience.borderColor} shadow-lg ring-2 ${audience.ringColor} ring-offset-2 dark:ring-offset-slate-900`
                    : hasCustomers
                      ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Priority Badge */}
                {audience.priority && !isSelected && (
                  <span className={`
                    absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm
                    ${getPriorityColor(audience.priority)}
                  `}>
                    {audience.priority}
                  </span>
                )}

                {/* Icon with Gradient */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${audience.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-0.5">
                  {audience.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                  {audience.shortDesc}
                </p>

                {/* Count */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    {audience.count.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    clientes
                  </span>
                  {/* Hover hint - inline to avoid overlap */}
                  {hasCustomers && !isSelected && (
                    <span className="ml-auto text-[10px] text-purple-600 dark:text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Selecionar →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Summary */}
        {selectedAudience && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-800 dark:text-purple-200">
                    {allAudiences.find(a => a.id === selectedAudience)?.label}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {allAudiences.find(a => a.id === selectedAudience)?.count.toLocaleString()} clientes selecionados
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectAudience(null)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-medium"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default AudienceSelector;
