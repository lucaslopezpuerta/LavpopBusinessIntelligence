// AudienceSelector.jsx v4.3
// Audience targeting component for campaign creation
// Design System v5.0 compliant - Cosmic Precision + Variant B (Accent Borders)
//
// CHANGELOG:
// v4.3 (2026-01-18): 4-column desktop + font size bump
//   - Grid: 4 columns on desktop (was 3)
//   - Icon container: w-8 h-8 → w-9 h-9
//   - Title: text-xs sm:text-sm → text-sm
//   - Subtitle: text-[10px] sm:text-xs → text-xs
//   - Count: text-lg sm:text-xl → text-xl
// v4.2 (2026-01-18): Compact card layout
//   - Reduced card padding: p-4 → p-3
//   - Smaller icon container: w-11 h-11 → w-8 h-8
//   - Smaller priority badges and selected indicators
//   - Tighter grid gaps: gap-3 sm:gap-4 → gap-2 sm:gap-3
//   - 2 columns on mobile (was 1), 3 on desktop
//   - Smaller count text: text-2xl → text-lg
//   - Removed hover hint to save space
//   - Compact selected summary
// v4.1 (2026-01-18): Semantic accent borders (Variant B pattern)
//   - Added left border accents to maintain semantic category identity
//   - Each audience type has unique left border color (amber, purple, emerald, etc.)
//   - Dark mode uses lighter accent shades (-400) for better visibility
//   - Renamed borderColor → leftBorder for clarity
//   - Updated bgDark values to use space-dust for cosmic compliance
// v4.0 (2026-01-18): Cosmic Precision redesign
//   - Applied Design System v5.0 Cosmic styling
//   - Filter buttons: stellar-cyan accents and cosmic gradients
//   - Audience cards: cosmic borders (dark:border-stellar-cyan/10)
//   - Selected state: stellar-cyan ring with glow effect
//   - Selected summary: cosmic gradient background
//   - Updated dark mode backgrounds (slate-800 → space-dust)
// v3.3 (2026-01-09): Light background KPI cards (Hybrid Card Design)
//   - Migrated stats cards to Design System KPICard with variant="default"
//   - Card bodies now use light backgrounds (bg-white dark:bg-slate-800)
//   - Icon containers retain gradient colors for visual accent
// v3.2 (2026-01-09): Hybrid card design implementation
//   - Added Framer Motion hover animation (y: -2 lift effect)
//   - Updated stats cards to 3-stop gradients
//   - Added haptic feedback on card selection
//   - Premium shadow-lift on card hover
// v3.1 (2026-01-09): Typography & contrast fixes
//   - Fixed text-[10px] → text-xs (12px minimum)
//   - Fixed dark mode contrast (slate-400 → slate-300)
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
import { motion } from 'framer-motion';
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
import KPICard from '../ui/KPICard';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';
import { haptics } from '../../utils/haptics';

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
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-space-dust flex items-center justify-center">
            <Users className="w-6 h-6 text-slate-400 dark:text-stellar-cyan/50 animate-pulse" />
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
      leftBorder: 'border-l-amber-500 dark:border-l-amber-400',
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
      leftBorder: 'border-l-purple-500 dark:border-l-purple-400',
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
      leftBorder: 'border-l-emerald-500 dark:border-l-emerald-400',
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
      leftBorder: 'border-l-yellow-500 dark:border-l-yellow-400',
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
      leftBorder: 'border-l-blue-500 dark:border-l-blue-400',
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
      leftBorder: 'border-l-cyan-500 dark:border-l-cyan-400',
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
      bgDark: 'dark:bg-space-dust/50',
      leftBorder: 'border-l-slate-500 dark:border-l-slate-400',
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
      bgDark: 'dark:bg-space-dust/50',
      leftBorder: 'border-l-gray-500 dark:border-l-gray-400',
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
      leftBorder: 'border-l-green-500 dark:border-l-green-400',
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
      bgDark: 'dark:bg-space-dust/50',
      leftBorder: 'border-l-slate-500 dark:border-l-slate-400',
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
        {/* Stats Dashboard Header - Light background cards with gradient icons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Disponível */}
          <KPICard
            label="WhatsApp"
            value={stats.total.toLocaleString()}
            subtitle="clientes disponíveis"
            icon={Phone}
            color="purple"
            variant="compact"
          />

          {/* Precisam Atenção */}
          <KPICard
            label="Atenção"
            value={stats.needAttention.toLocaleString()}
            subtitle="precisam ação"
            icon={AlertTriangle}
            color="warning"
            variant="compact"
            status="warning"
          />
        </div>

        {/* Discrete Info Hint */}
        <p className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
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
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-400" />
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
                  ? 'bg-gradient-stellar text-white shadow-lg shadow-stellar-cyan/25'
                  : 'bg-white dark:bg-space-dust text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-stellar-cyan/10 hover:border-stellar-cyan/30 dark:hover:border-stellar-cyan/20 hover:shadow-sm'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                categoryFilter === id
                  ? 'bg-white/20'
                  : 'bg-slate-100 dark:bg-space-nebula'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Audience Cards Grid - Compact Selection Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            const isSelected = selectedAudience === audience.id;
            const hasCustomers = audience.count > 0;

            return (
              <motion.button
                key={audience.id}
                whileHover={hasCustomers ? { y: -2 } : undefined}
                whileTap={hasCustomers ? { scale: 0.98 } : undefined}
                transition={{ type: 'tween', duration: 0.2 }}
                onClick={() => {
                  if (hasCustomers) {
                    haptics.light();
                    onSelectAudience(audience.id);
                  }
                }}
                disabled={!hasCustomers}
                className={`
                  relative p-3 rounded-xl border text-left transition-all duration-200 group shadow-sm
                  border-l-4 ${audience.leftBorder}
                  ${isSelected
                    ? 'bg-white dark:bg-space-dust border-t-transparent border-r-transparent border-b-transparent shadow-md ring-2 ring-stellar-cyan ring-offset-2 dark:ring-offset-space-nebula'
                    : hasCustomers
                      ? 'bg-white dark:bg-space-dust border-t-slate-200 border-r-slate-200 border-b-slate-200 dark:border-t-stellar-cyan/10 dark:border-r-stellar-cyan/10 dark:border-b-stellar-cyan/10 hover:shadow-md'
                      : 'bg-slate-50 dark:bg-space-dust/50 border-t-slate-200 border-r-slate-200 border-b-slate-200 dark:border-t-stellar-cyan/5 dark:border-r-stellar-cyan/5 dark:border-b-stellar-cyan/5 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-stellar flex items-center justify-center shadow-md shadow-stellar-cyan/30">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}

                {/* Priority Badge */}
                {audience.priority && !isSelected && (
                  <span className={`
                    absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full shadow-sm
                    ${getPriorityColor(audience.priority)}
                  `}>
                    {audience.priority}
                  </span>
                )}

                {/* Icon with Gradient */}
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${audience.gradient} flex items-center justify-center mb-2 shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5 leading-tight">
                  {audience.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-1">
                  {audience.shortDesc}
                </p>

                {/* Count */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {audience.count.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    clientes
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Summary - Compact */}
        {selectedAudience && (
          <div className="p-3 bg-gradient-to-r from-stellar-cyan/5 to-stellar-blue/5 dark:from-stellar-cyan/10 dark:to-stellar-blue/10 border border-stellar-cyan/20 dark:border-stellar-cyan/15 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-stellar flex items-center justify-center shadow-md shadow-stellar-cyan/25">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                    {allAudiences.find(a => a.id === selectedAudience)?.label}
                  </p>
                  <p className="text-[10px] sm:text-xs text-stellar-cyan">
                    {allAudiences.find(a => a.id === selectedAudience)?.count.toLocaleString()} clientes selecionados
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectAudience(null)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-stellar-cyan font-medium transition-colors"
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
