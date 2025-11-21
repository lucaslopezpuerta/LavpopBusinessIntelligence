// Dashboard.jsx v7.0 - Hybrid (Dark Header + Light Content)
// - Uses primary #0c4a6e and accent #4ac02a
// - Dark gradient header with aligned widgets
// - Current week banner
// - View mode toggle (Última Semana Completa / Semana Atual)
// - KPI cards + At-risk customers table

import React, { useMemo, useState } from 'react';
import KPICards from '../components/KPICards';
import CurrentWeekBanner from '../components/CurrentWeekBanner';
import WeatherWidget from '../components/WeatherWidget_API';
import SocialMediaWidget from '../components/SocialMediaWidget';
import GoogleBusinessWidget from '../components/GoogleBusinessWidget';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import {
  Calendar,
  MessageSquare,
  Settings,
  BarChart3,
  CalendarDays,
} from 'lucide-react';

const BRAND = {
  primary: '#0c4a6e',
  accent: '#4ac02a',
};

const Dashboard = ({ data, onNavigate }) => {
  const [viewMode, setViewMode] = useState('complete'); // 'complete' | 'current'

  const businessMetrics = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return calculateBusinessMetrics(data.sales);
    } catch (err) {
      console.error('Business metrics error:', err);
      return null;
    }
  }, [data?.sales]);

  const customerMetrics = useMemo(() => {
    if (!data?.sales || !data?.rfm) return null;
    try {
      return calculateCustomerMetrics(data.sales, data.rfm);
    } catch (err) {
      console.error('Customer metrics error:', err);
      return null;
    }
  }, [data?.sales, data?.rfm]);

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'schedule':
        console.log('Agenda: (placeholder)');
        break;
      case 'campaigns':
        console.log('Campanhas: (placeholder)');
        break;
      case 'settings':
        console.log('Configurações: (placeholder)');
        break;
      default:
        console.log('Action:', actionId);
    }
  };

  if (!businessMetrics || !customerMetrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-base">
          Carregando dashboard...
        </div>
      </div>
    );
  }

  const getDateRange = () => {
    if (viewMode === 'current' && businessMetrics?.windows?.currentWeek) {
      return {
        start: businessMetrics.windows.currentWeek.startDate,
        end: businessMetrics.windows.currentWeek.endDate,
        label: `Semana Atual (${businessMetrics.windows.currentWeek.daysElapsed} dias)`,
      };
    }

    return {
      start: businessMetrics.windows.weekly?.startDate,
      end: businessMetrics.windows.weekly?.endDate,
      label: 'Última Semana Completa',
    };
  };

  const dateRange = getDateRange();

  const getTopInsight = () => {
    const weekly = businessMetrics.weekly || {};
    const utilization = Math.round(weekly.totalUtilization || 0);

    if (utilization < 15) {
      return {
        text: `Utilização crítica: ${utilization}% na última semana`,
        color: BRAND.primary,
        action: 'Considere promoção urgente ou campanhas de marketing.',
      };
    }

    const atRiskCount = customerMetrics.atRiskCount || 0;
    if (atRiskCount > 15) {
      return {
        text: `${atRiskCount} clientes em risco de churn`,
        color: BRAND.primary,
        action: 'Priorize o contato com clientes em risco hoje.',
      };
    }

    return null;
  };

  const topInsight = getTopInsight();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-4 space-y-4">
        {/* HEADER BAND - Dark gradient + widgets */}
        <div className="w-full rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-[#0c4a6e] text-white shadow-lg">
          <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-stretch">
            {/* Left: Date range card */}
            <div className="flex-1">
              <div className="h-full flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3">
                <Calendar className="w-5 h-5" style={{ color: BRAND.primary }} />
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 mb-0.5">
                    {dateRange.label}
                  </div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: BRAND.primary }}
                  >
                    {dateRange.start} - {dateRange.end}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: widget row */}
            <div className="flex flex-1 flex-wrap items-stretch justify-end gap-3">
              <div className="flex items-center">
                <WeatherWidget />
              </div>
              <div className="flex items-center">
                <SocialMediaWidget />
              </div>
              <div className="flex items-center">
                <GoogleBusinessWidget />
              </div>

              {/* Quick Actions */}
              <div className="hidden sm:flex items-center">
                <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2">
                  <button
                    onClick={() => handleQuickAction('schedule')}
                    className="flex flex-col items-center gap-1 rounded-md p-2 text-[10px] font-semibold text-slate-500 transition-colors hover:bg-slate-100"
                  >
                    <Calendar
                      className="w-5 h-5"
                      style={{ color: BRAND.primary }}
                    />
                    <span>Agenda</span>
                  </button>

                  <button
                    onClick={() => handleQuickAction('campaigns')}
                    className="flex flex-col items-center gap-1 rounded-md p-2 text-[10px] font-semibold text-slate-500 transition-colors hover:bg-slate-100"
                  >
                    <MessageSquare
                      className="w-5 h-5"
                      style={{ color: BRAND.accent }}
                    />
                    <span>Campanhas</span>
                  </button>

                  <button
                    onClick={() => handleQuickAction('settings')}
                    className="flex flex-col items-center gap-1 rounded-md p-2 text-[10px] font-semibold text-slate-500 transition-colors hover:bg-slate-100"
                  >
                    <Settings className="w-5 h-5 text-slate-500" />
                    <span>Config</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CURRENT WEEK BANNER */}
        <CurrentWeekBanner businessMetrics={businessMetrics} />

        {/* VIEW MODE TOGGLE + TOP INSIGHT */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Toggle buttons */}
          <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('complete')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors ${
                viewMode === 'complete'
                  ? 'bg-[#0c4a6e] text-white'
                  : 'bg-transparent text-slate-500'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Última Semana Completa
            </button>
            <button
              onClick={() => setViewMode('current')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors ${
                viewMode === 'current'
                  ? 'bg-[#4ac02a] text-white'
                  : 'bg-transparent text-slate-500'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Semana Atual
              {businessMetrics?.windows?.currentWeek?.daysElapsed != null && (
                <span className="text-[11px] opacity-80">
                  ({businessMetrics.windows.currentWeek.daysElapsed} dias)
                </span>
              )}
            </button>
          </div>

          {/* Top insight banner */}
          {topInsight && (
            <div
              className="flex-1 min-w-[260px] rounded-lg px-4 py-2 border-l-4"
              style={{
                borderColor: topInsight.color,
                background: `${topInsight.color}12`,
              }}
            >
              <div
                className="text-[13px] font-semibold mb-0.5"
                style={{ color: topInsight.color }}
              >
                {topInsight.text}
              </div>
              <div className="text-[12px] text-slate-600">
                {topInsight.action}
              </div>
            </div>
          )}
        </div>

        {/* KPI CARDS */}
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Visão Geral da Semana
          </div>
          <KPICards
            businessMetrics={businessMetrics}
            customerMetrics={customerMetrics}
            salesData={data.sales}
            viewMode={viewMode}
          />
        </div>

        {/* AT-RISK CUSTOMERS TABLE */}
        <AtRiskCustomersTable
          customerMetrics={customerMetrics}
          salesData={data.sales}
        />
      </div>
    </div>
  );
};

export default Dashboard;
