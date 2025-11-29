// Intelligence.jsx v1.1.0 - Business Intelligence Dashboard
// Modern Tailwind + Nivo charts design
// 4 Strategic Sections: Profitability, Weather, Growth, Campaigns
//
// CHANGELOG:
// v1.1.0 (2025-11-29): Design System v3.0 compliance
//   - Removed all emojis from InsightBox titles and text
//   - Removed emojis from status indicators
// v1.0.0 (2025-11-18): Complete redesign with Tailwind + Nivo
//   - Section 1: Rentabilidade (Profitability Analysis)
//   - Section 2: Impacto do Clima (Weather Impact)
//   - Section 3: Crescimento & Tendências (Growth Trends)
//   - Section 4: Efetividade de Campanhas (Campaign ROI)
//   - Business Settings integration
//   - Modern gradient design
//   - Actionable insights

import React, { useState, useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Cloud, 
  CloudRain, 
  Sun,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Settings,
  Calendar,
  Percent
} from 'lucide-react';

import BusinessSettingsModal, { useBusinessSettings } from '../components/BusinessSettingsModal';
import {
  calculateProfitability,
  calculateWeatherImpact,
  calculateGrowthTrends,
  calculateCampaignROI,
  getCurrentMonthMetrics,
  getPreviousMonthMetrics
} from '../utils/intelligenceCalculations';

// ==================== HELPER COMPONENTS ====================

const StatCard = ({ label, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    amber: 'from-amber-500 to-amber-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.direction === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
              {trend.direction === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
              <span className={`text-sm font-medium ${
                trend.direction === 'up' ? 'text-green-600' : 
                trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

const InsightBox = ({ type = 'info', title, message, action }) => {
  const styles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
      message: 'text-green-700',
      Icon: CheckCircle
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-900',
      message: 'text-amber-700',
      Icon: AlertCircle
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      message: 'text-red-700',
      Icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      message: 'text-blue-700',
      Icon: Zap
    }
  };

  const style = styles[type];
  const { Icon } = style;

  return (
    <div className={`${style.bg} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold ${style.title} mb-1`}>{title}</h4>
          )}
          <p className={`text-sm ${style.message} leading-relaxed`}>{message}</p>
          {action && (
            <button className={`mt-2 text-sm font-medium ${style.icon} hover:underline`}>
              {action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle, icon: Icon, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 bg-lavpop-blue-100 rounded-lg">
          <Icon className="w-6 h-6 text-lavpop-primary" />
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
    {action && action}
  </div>
);

// ==================== MAIN COMPONENT ====================

const Intelligence = ({ data }) => {
  const [showSettings, setShowSettings] = useState(false);
  const settings = useBusinessSettings();

  // Calculate all metrics
  const profitability = useMemo(() => {
    if (!data?.sales || !settings) return null;
    try {
      return calculateProfitability(data.sales, settings);
    } catch (error) {
      console.error('Profitability calculation error:', error);
      return null;
    }
  }, [data?.sales, settings]);

  const weatherImpact = useMemo(() => {
    if (!data?.sales || !data?.weather) return null;
    try {
      return calculateWeatherImpact(data.sales, data.weather);
    } catch (error) {
      console.error('Weather impact calculation error:', error);
      return null;
    }
  }, [data?.sales, data?.weather]);

  const growthTrends = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return calculateGrowthTrends(data.sales);
    } catch (error) {
      console.error('Growth trends calculation error:', error);
      return null;
    }
  }, [data?.sales]);

  const campaignROI = useMemo(() => {
    if (!data?.sales || !data?.campaigns) return null;
    try {
      return calculateCampaignROI(data.sales, data.campaigns);
    } catch (error) {
      console.error('Campaign ROI calculation error:', error);
      return null;
    }
  }, [data?.sales, data?.campaigns]);

  const currentMonth = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return getCurrentMonthMetrics(data.sales);
    } catch (error) {
      console.error('Current month calculation error:', error);
      return null;
    }
  }, [data?.sales]);

  const previousMonth = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return getPreviousMonthMetrics(data.sales);
    } catch (error) {
      console.error('Previous month calculation error:', error);
      return null;
    }
  }, [data?.sales]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (!data || !data.sales) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-lavpop-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-lavpop-primary animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Carregando Inteligência de Negócio
          </h3>
          <p className="text-gray-600">
            Preparando análises estratégicas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Hero Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-lavpop-primary to-lavpop-blue-700 text-white text-xs font-bold uppercase tracking-wide rounded-full">
                    Inteligência
                  </span>
                  <span className="text-sm text-gray-500">
                    Análise Estratégica de Negócio
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Business Intelligence
                </h1>
                <p className="text-gray-600 mt-2 max-w-2xl">
                  Insights acionáveis para tomada de decisão: rentabilidade, impacto climático, 
                  tendências de crescimento e efetividade de campanhas.
                </p>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Configurações
                </span>
              </button>
            </div>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Mês Atual"
              value={formatCurrency(currentMonth?.revenue || 0)}
              subtitle={`${currentMonth?.services || 0} ciclos em ${currentMonth?.daysElapsed || 0} dias`}
              icon={Calendar}
              color="blue"
            />
            <StatCard
              label="Mês Anterior"
              value={formatCurrency(previousMonth?.revenue || 0)}
              subtitle={`${previousMonth?.services || 0} ciclos no total`}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              label="Crescimento MoM"
              value={formatPercent(
                currentMonth && previousMonth && previousMonth.revenue > 0
                  ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
                  : 0
              )}
              subtitle={
                currentMonth && previousMonth && previousMonth.revenue > 0 && 
                currentMonth.revenue > previousMonth.revenue
                  ? "Acima do mês anterior"
                  : "Abaixo do mês anterior"
              }
              icon={Percent}
              color={
                currentMonth && previousMonth && previousMonth.revenue > 0 && 
                currentMonth.revenue > previousMonth.revenue
                  ? "green"
                  : "red"
              }
            />
            <StatCard
              label="Status Operacional"
              value={profitability?.isAboveBreakEven ? "Lucrativo" : "Atenção"}
              subtitle={
                profitability?.isAboveBreakEven
                  ? `${formatPercent(profitability.breakEvenBuffer)} acima do break-even`
                  : "Abaixo do ponto de equilíbrio"
              }
              icon={Target}
              color={profitability?.isAboveBreakEven ? "green" : "amber"}
            />
          </div>

          {/* ==================== SECTION 1: PROFITABILITY ==================== */}
          {profitability && (
            <div className="bg-white rounded-2xl shadow-soft p-8 mb-8 animate-slide-up">
              <SectionHeader
                title="Rentabilidade"
                subtitle="Análise de custos vs receita e ponto de equilíbrio"
                icon={DollarSign}
              />
              
              <div className="space-y-6">
                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-1">Receita Bruta</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(profitability.grossRevenue)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      + Cashback aplicado
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">Custos Totais</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(profitability.totalCosts)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Fixos + Manutenção
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-lg bg-gradient-to-br ${
                    profitability.netProfit > 0 
                      ? 'from-green-50 to-green-100' 
                      : 'from-red-50 to-red-100'
                  }`}>
                    <p className={`text-xs font-medium mb-1 ${
                      profitability.netProfit > 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Lucro Líquido
                    </p>
                    <p className={`text-2xl font-bold ${
                      profitability.netProfit > 0 ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {formatCurrency(profitability.netProfit)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      profitability.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {profitability.netProfit > 0 ? 'Positivo' : 'Negativo'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <p className="text-xs font-medium text-purple-700 mb-1">Margem</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatPercent(profitability.profitMargin)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {profitability.daysInPeriod} dias
                    </p>
                  </div>
                </div>

                {/* Break-even Analysis */}
                <div className="p-6 bg-gradient-to-br from-lavpop-blue-50 to-lavpop-blue-100 rounded-xl border border-lavpop-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-lavpop-primary mb-1">
                        Ponto de Equilíbrio
                      </h3>
                      <p className="text-sm text-lavpop-blue-700">
                        Serviços necessários para cobrir custos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-lavpop-blue-700 mb-1">Meta / Realizado</p>
                      <p className="text-2xl font-bold text-lavpop-primary">
                        {profitability.breakEvenServices} / {profitability.actualServices}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="h-4 bg-white/50 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          profitability.isAboveBreakEven 
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600'
                        }`}
                        style={{ 
                          width: `${Math.min((profitability.actualServices / profitability.breakEvenServices) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-lavpop-blue-700 mt-2">
                      <span>0 ciclos</span>
                      <span>{profitability.breakEvenServices} ciclos (break-even)</span>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Custos Fixos</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Período:</span>
                        <span className="font-medium">{profitability.daysInPeriod} dias</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(profitability.fixedCosts)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Manutenção</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Custo:</span>
                        <span className="font-medium">
                          {formatCurrency(profitability.maintenanceCosts)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">% do Total:</span>
                        <span className="font-bold text-gray-900">
                          {formatPercent((profitability.maintenanceCosts / profitability.totalCosts) * 100)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nivo Bar Chart - Revenue vs Costs */}
                <div className="h-64">
                  <ResponsiveBar
                    data={[
                      {
                        category: 'Análise',
                        'Receita': profitability.totalRevenue,
                        'Custos': profitability.totalCosts,
                        'Lucro': Math.max(0, profitability.netProfit)
                      }
                    ]}
                    keys={['Receita', 'Custos', 'Lucro']}
                    indexBy="category"
                    margin={{ top: 20, right: 130, bottom: 50, left: 80 }}
                    padding={0.3}
                    groupMode="grouped"
                    colors={['#55b03b', '#ef4444', '#8b5cf6']}
                    borderRadius={8}
                    axisLeft={{
                      format: value => formatCurrency(value)
                    }}
                    labelTextColor="white"
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    legends={[
                      {
                        dataFrom: 'keys',
                        anchor: 'bottom-right',
                        direction: 'column',
                        translateX: 120,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemTextColor: '#666',
                        symbolSize: 12,
                        symbolShape: 'circle'
                      }
                    ]}
                    animate={true}
                    motionConfig="gentle"
                    theme={{
                      fontSize: 12,
                      textColor: '#666'
                    }}
                  />
                </div>

                {/* Insights */}
                {profitability.isAboveBreakEven ? (
                  <InsightBox
                    type="success"
                    title="Negócio Lucrativo"
                    message={`Você está ${formatPercent(Math.abs(profitability.breakEvenBuffer))} acima do ponto de equilíbrio. Margem de lucro de ${formatPercent(profitability.profitMargin)}. Continue mantendo a eficiência operacional!`}
                  />
                ) : (
                  <InsightBox
                    type="warning"
                    title="Atenção: Abaixo do Break-Even"
                    message={`Você precisa de mais ${profitability.breakEvenServices - profitability.actualServices} serviços para atingir o ponto de equilíbrio. Considere lançar promoções urgentes ou revisar custos fixos nas Configurações.`}
                  />
                )}
              </div>
            </div>
          )}

          {/* ==================== SECTION 2: WEATHER IMPACT ==================== */}
          {weatherImpact && (
            <div className="bg-white rounded-2xl shadow-soft p-8 mb-8 animate-slide-up">
              <SectionHeader
                title="Impacto do Clima"
                subtitle="Como o clima afeta sua receita diária"
                icon={Cloud}
              />
              
              <div className="space-y-6">
                {/* Weather Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 rounded-xl border border-yellow-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-yellow-200 rounded-lg">
                        <Sun className="w-8 h-8 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Dias de Sol</p>
                        <p className="text-3xl font-bold text-yellow-900">
                          {formatCurrency(weatherImpact.sunny.revenue)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-700">Ciclos/dia:</span>
                        <span className="font-semibold text-yellow-900">{Math.round(weatherImpact.sunny.services)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-yellow-700">Total dias:</span>
                        <span className="font-semibold text-yellow-900">{weatherImpact.sunny.days}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-200 rounded-lg">
                        <Cloud className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Dias Nublados</p>
                        <p className="text-3xl font-bold text-blue-900">
                          {formatCurrency(weatherImpact.cloudy.revenue)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Ciclos/dia:</span>
                        <span className="font-semibold text-blue-900">{Math.round(weatherImpact.cloudy.services)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-blue-700">Total dias:</span>
                        <span className="font-semibold text-blue-900">{weatherImpact.cloudy.days}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-blue-700">
                          {formatPercent(weatherImpact.cloudy.impact)} vs sol
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-50 rounded-xl border border-indigo-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-indigo-200 rounded-lg">
                        <CloudRain className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Dias Chuvosos</p>
                        <p className="text-3xl font-bold text-indigo-900">
                          {formatCurrency(weatherImpact.rainy.revenue)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-indigo-700">Ciclos/dia:</span>
                        <span className="font-semibold text-indigo-900">{Math.round(weatherImpact.rainy.services)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-indigo-700">Total dias:</span>
                        <span className="font-semibold text-indigo-900">{weatherImpact.rainy.days}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-bold text-indigo-700">
                          {formatPercent(weatherImpact.rainy.impact)} vs sol
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nivo Bar Chart - Weather Comparison */}
                <div className="h-80">
                  <ResponsiveBar
                    data={[
                      {
                        type: 'Dias de Sol',
                        'Receita Média': weatherImpact.sunny.revenue,
                        color: '#eab308'
                      },
                      {
                        type: 'Dias Nublados',
                        'Receita Média': weatherImpact.cloudy.revenue,
                        color: '#3b82f6'
                      },
                      {
                        type: 'Dias Chuvosos',
                        'Receita Média': weatherImpact.rainy.revenue,
                        color: '#6366f1'
                      }
                    ]}
                    keys={['Receita Média']}
                    indexBy="type"
                    layout="horizontal"
                    margin={{ top: 20, right: 80, bottom: 50, left: 140 }}
                    colors={d => d.data.color}
                    borderRadius={8}
                    padding={0.3}
                    axisLeft={{
                      tickSize: 0,
                      tickPadding: 10
                    }}
                    axisBottom={{
                      format: value => formatCurrency(value),
                      tickRotation: 0
                    }}
                    labelTextColor="white"
                    enableGridY={false}
                    animate={true}
                    motionConfig="gentle"
                    theme={{
                      fontSize: 13,
                      textColor: '#666'
                    }}
                  />
                </div>

                {/* Impact Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Melhor Cenário</h4>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(weatherImpact.bestCaseScenario)}
                      <span className="text-sm font-normal text-blue-700">/dia</span>
                    </p>
                    <p className="text-xs text-blue-700 mt-1">Dias de sol</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-2">Pior Cenário</h4>
                    <p className="text-2xl font-bold text-indigo-900">
                      {formatCurrency(weatherImpact.worstCaseScenario)}
                      <span className="text-sm font-normal text-indigo-700">/dia</span>
                    </p>
                    <p className="text-xs text-indigo-700 mt-1">Dias chuvosos</p>
                  </div>
                </div>

                {/* Actionable Insight */}
                {Math.abs(weatherImpact.rainy.impact) > 20 && (
                  <InsightBox
                    type="warning"
                    title="Alto Impacto de Chuva Detectado"
                    message={`Dias chuvosos reduzem sua receita em ${formatPercent(Math.abs(weatherImpact.rainy.impact))}. Recomendação: Quando a previsão indicar chuva, ative uma campanha promocional via WhatsApp para compensar a queda esperada. Exemplo: "CHUVA15" para 15% de desconto.`}
                  />
                )}

                {Math.abs(weatherImpact.rainy.impact) <= 20 && (
                  <InsightBox
                    type="info"
                    title="Impacto de Clima Moderado"
                    message={`O clima tem impacto moderado no seu negócio (${formatPercent(Math.abs(weatherImpact.rainy.impact))} em dias chuvosos). Isso indica boa resiliência operacional. Continue monitorando para identificar oportunidades de otimização.`}
                  />
                )}
              </div>
            </div>
          )}

          {/* ==================== SECTION 3: GROWTH & TRENDS ==================== */}
          {growthTrends && (
            <div className="bg-white rounded-2xl shadow-soft p-8 mb-8 animate-slide-up">
              <SectionHeader
                title="Crescimento & Tendências"
                subtitle="Análise de crescimento mensal e trajetória de longo prazo"
                icon={TrendingUp}
              />
              
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <p className="text-xs font-medium text-green-700 mb-1 uppercase tracking-wide">
                      Crescimento Médio
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {formatPercent(growthTrends.avgGrowth)}
                    </p>
                    <p className="text-xs text-green-700 mt-1">Últimos 6 meses</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-1 uppercase tracking-wide">
                      Melhor Mês
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {growthTrends.bestMonth.month}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {formatCurrency(growthTrends.bestMonth.revenue)}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                    <p className="text-xs font-medium text-amber-700 mb-1 uppercase tracking-wide">
                      Pior Mês
                    </p>
                    <p className="text-2xl font-bold text-amber-900">
                      {growthTrends.worstMonth.month}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {formatCurrency(growthTrends.worstMonth.revenue)}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg bg-gradient-to-br ${
                    growthTrends.trend === 'increasing' ? 'from-green-50 to-green-100' :
                    growthTrends.trend === 'decreasing' ? 'from-red-50 to-red-100' :
                    'from-gray-50 to-gray-100'
                  }`}>
                    <p className={`text-xs font-medium mb-1 uppercase tracking-wide ${
                      growthTrends.trend === 'increasing' ? 'text-green-700' :
                      growthTrends.trend === 'decreasing' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      Tendência
                    </p>
                    <p className={`text-2xl font-bold ${
                      growthTrends.trend === 'increasing' ? 'text-green-900' :
                      growthTrends.trend === 'decreasing' ? 'text-red-900' :
                      'text-gray-900'
                    }`}>
                      {growthTrends.trend === 'increasing' ? '↗ Crescendo' :
                       growthTrends.trend === 'decreasing' ? '↘ Caindo' :
                       '→ Estável'}
                    </p>
                    <p className={`text-xs mt-1 ${
                      growthTrends.trend === 'increasing' ? 'text-green-700' :
                      growthTrends.trend === 'decreasing' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      {growthTrends.trend === 'increasing' ? 'Últimos 3 meses' :
                       growthTrends.trend === 'decreasing' ? 'Últimos 3 meses' :
                       'Sem mudança clara'}
                    </p>
                  </div>
                </div>

                {/* Nivo Line Chart - Monthly Revenue Trend */}
                <div className="h-96">
                  <ResponsiveLine
                    data={[
                      {
                        id: 'Receita Mensal',
                        data: growthTrends.monthly.slice(-12).map(m => ({
                          x: m.month,
                          y: m.revenue
                        }))
                      }
                    ]}
                    margin={{ top: 20, right: 120, bottom: 80, left: 80 }}
                    xScale={{ type: 'point' }}
                    yScale={{
                      type: 'linear',
                      min: 'auto',
                      max: 'auto',
                      stacked: false,
                      reverse: false
                    }}
                    yFormat={value => formatCurrency(value)}
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Mês',
                      legendOffset: 60,
                      legendPosition: 'middle'
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Receita',
                      legendOffset: -60,
                      legendPosition: 'middle',
                      format: value => formatCurrency(value)
                    }}
                    enablePoints={true}
                    pointSize={10}
                    pointColor={{ from: 'color' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    enablePointLabel={false}
                    pointLabelYOffset={-12}
                    enableArea={true}
                    areaOpacity={0.15}
                    colors={['#1a5a8e']}
                    lineWidth={3}
                    useMesh={true}
                    enableSlices="x"
                    sliceTooltip={({ slice }) => (
                      <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-700 mb-1">
                          {slice.points[0].data.x}
                        </div>
                        <div className="text-sm font-bold text-lavpop-primary">
                          {formatCurrency(slice.points[0].data.y)}
                        </div>
                      </div>
                    )}
                    legends={[
                      {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemBackground: 'rgba(0, 0, 0, .03)',
                              itemOpacity: 1
                            }
                          }
                        ]
                      }
                    ]}
                    theme={{
                      fontSize: 12,
                      textColor: '#666',
                      grid: {
                        line: {
                          stroke: '#e5e7eb',
                          strokeWidth: 1
                        }
                      }
                    }}
                    animate={true}
                    motionConfig="gentle"
                  />
                </div>

                {/* Monthly Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Mês
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Receita
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Ciclos
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Clientes
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Crescimento MoM
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {growthTrends.monthly.slice(-6).reverse().map((month, index) => (
                          <tr key={month.month} className={index === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {month.month}
                              {index === 0 && (
                                <span className="ml-2 text-xs text-blue-600 font-semibold">
                                  Mais recente
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(month.revenue)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">
                              {month.services}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">
                              {month.customerCount}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {month.momGrowth !== null ? (
                                <span className={`inline-flex items-center gap-1 font-semibold ${
                                  month.momGrowth > 0 ? 'text-green-600' :
                                  month.momGrowth < 0 ? 'text-red-600' :
                                  'text-gray-600'
                                }`}>
                                  {month.momGrowth > 0 && <TrendingUp className="w-4 h-4" />}
                                  {month.momGrowth < 0 && <TrendingDown className="w-4 h-4" />}
                                  {formatPercent(month.momGrowth)}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Insights */}
                {growthTrends.trend === 'increasing' && (
                  <InsightBox
                    type="success"
                    title="Tendência de Crescimento Positiva"
                    message={`Seu negócio está crescendo consistentemente com média de ${formatPercent(growthTrends.avgGrowth)} ao mês. Continue investindo em marketing e mantendo a qualidade do serviço para sustentar esse crescimento!`}
                  />
                )}

                {growthTrends.trend === 'decreasing' && (
                  <InsightBox
                    type="warning"
                    title="Atenção: Tendência de Queda"
                    message={`Detectamos queda nos últimos meses. Análise recomendada: verifique se houve aumento de concorrência, problemas operacionais ou mudanças sazonais. Considere lançar campanhas agressivas para reverter a tendência.`}
                  />
                )}

                {growthTrends.trend === 'stable' && (
                  <InsightBox
                    type="info"
                    title="Tendência Estável"
                    message={`Seu negócio mantém receita estável. Para crescer, considere: (1) Campanhas de marketing para novos clientes, (2) Programas de fidelidade para aumentar frequência, (3) Horários promocionais em períodos de baixa utilização.`}
                  />
                )}
              </div>
            </div>
          )}

          {/* ==================== SECTION 4: CAMPAIGN EFFECTIVENESS ==================== */}
          {campaignROI && campaignROI.campaigns && campaignROI.campaigns.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft p-8 mb-8 animate-slide-up">
              <SectionHeader
                title="Efetividade de Campanhas"
                subtitle="ROI e desempenho de cupons de desconto"
                icon={Target}
              />
              
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-1">Total de Campanhas</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {campaignROI.totalCampaigns}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {campaignROI.activeCampaigns} ativas
                    </p>
                  </div>

                  {campaignROI.bestPerforming && (
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <p className="text-xs font-medium text-green-700 mb-1">Melhor Campanha</p>
                      <p className="text-xl font-bold text-green-900">
                        {campaignROI.bestPerforming.code}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        ROI: {formatPercent(campaignROI.bestPerforming.roi)}
                      </p>
                    </div>
                  )}

                  {campaignROI.worstPerforming && (
                    <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                      <p className="text-xs font-medium text-red-700 mb-1">Pior Campanha</p>
                      <p className="text-xl font-bold text-red-900">
                        {campaignROI.worstPerforming.code}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        ROI: {formatPercent(campaignROI.worstPerforming.roi)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Campaign Cards */}
                <div className="space-y-4">
                  {campaignROI.campaigns.map((campaign, index) => {
                    const statusColors = {
                      excellent: 'from-green-500 to-green-600',
                      good: 'from-blue-500 to-blue-600',
                      fair: 'from-amber-500 to-amber-600',
                      poor: 'from-red-500 to-red-600'
                    };

                    const statusBadges = {
                      excellent: { bg: 'bg-green-100', text: 'text-green-800', label: 'Excelente' },
                      good: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Bom' },
                      fair: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Razoável' },
                      poor: { bg: 'bg-red-100', text: 'text-red-800', label: 'Fraco' }
                    };

                    const badge = statusBadges[campaign.status];

                    return (
                      <div 
                        key={campaign.code} 
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {campaign.code}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                                {badge.label}
                              </span>
                              {campaign.isActive && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                  ATIVA
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Desconto: <span className="font-semibold">{campaign.discountPercent}%</span>
                              {' • '}
                              Período: {campaign.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              {' até '}
                              {campaign.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Resgates</p>
                            <p className="text-lg font-bold text-gray-900">
                              {campaign.redemptions}/{campaign.totalCyclesAvailable}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Taxa de Conversão</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatPercent(campaign.redemptionRate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Receita Gerada</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(campaign.totalRevenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Desconto Dado</p>
                            <p className="text-lg font-bold text-red-600">
                              -{formatCurrency(campaign.totalDiscount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">ROI</p>
                            <p className={`text-lg font-bold ${
                              campaign.roi > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {campaign.roi > 0 ? '+' : ''}{formatPercent(campaign.roi)}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-4">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${statusColors[campaign.status]} transition-all duration-500`}
                              style={{ width: `${Math.min(campaign.redemptionRate, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div className={`p-3 rounded-lg ${badge.bg}`}>
                          <p className={`text-sm font-medium ${badge.text}`}>
                            Recomendação: {campaign.recommendation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Overall Insight */}
                <InsightBox
                  type="info"
                  title="Otimização de Campanhas"
                  message="Para maximizar ROI: (1) Cancele cupons com <10% de conversão, (2) Renove cupons com >50% de conversão, (3) Teste descontos entre 15-30% para encontrar o ponto ideal, (4) Use WhatsApp para divulgar cupons específicos em dias de baixa movimento."
                />
              </div>
            </div>
          )}

          {/* No campaigns message */}
          {campaignROI && (!campaignROI.campaigns || campaignROI.campaigns.length === 0) && (
            <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
              <SectionHeader
                title="Efetividade de Campanhas"
                subtitle="ROI e desempenho de cupons de desconto"
                icon={Target}
              />
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma Campanha Encontrada
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Certifique-se de que o arquivo campaigns.csv está disponível e contém dados de cupons.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Settings Modal */}
      <BusinessSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(newSettings) => {
          console.log('Settings saved:', newSettings);
          // Component will auto-reload with new settings via useBusinessSettings hook
        }}
      />
    </>
  );
};

export default Intelligence;
