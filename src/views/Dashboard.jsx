// Dashboard.jsx v6.2 - Dark Header + Fixed Customer Detail Modal
// ✅ Dark gradient header so glass widgets are visible
// ✅ Current week banner with real-time metrics and projection
// ✅ Toggle between "Última Semana Completa" and "Semana Atual"
// ✅ Quick Actions in header as icon buttons
// ✅ Google Business / Clima / Instagram widgets in header
// ✅ KPICards respect viewMode
// ✅ AtRiskCustomersTable receives salesData again (fixes last 5 transactions)

import React, { useMemo, useState } from 'react';
import KPICards from '../components/KPICards';
import CurrentWeekBanner from '../components/CurrentWeekBanner';
import WeatherWidget from '../components/WeatherWidget_API';
import SocialMediaWidget from '../components/SocialMediaWidget';
import GoogleBusinessWidget from '../components/GoogleBusinessWidget';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { Calendar, MessageSquare, Settings, BarChart3, CalendarDays } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  blue: '#3b82f6'
};

const Dashboard = ({ data, onNavigate }) => {
  // View mode state: 'complete' (última semana completa) or 'current' (semana atual parcial)
  const [viewMode, setViewMode] = useState('complete');

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
    return calculateCustomerMetrics(data.sales, data.rfm);
  }, [data?.sales, data?.rfm]);

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'schedule':
        console.log('Agenda: Coming soon');
        break;
      case 'campaigns':
        console.log('Campanhas: Coming soon');
        break;
      case 'settings':
        console.log('Configurações: Coming soon');
        break;
      default:
        console.log('Action:', actionId);
    }
  };

  if (!businessMetrics || !customerMetrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 text-base">
        Carregando dashboard...
      </div>
    );
  }

  // Date range label based on view mode
  const getDateRange = () => {
    if (viewMode === 'current') {
      return {
        start: businessMetrics.windows.currentWeek.startDate,
        end: businessMetrics.windows.currentWeek.endDate,
        label: `Semana Atual (${businessMetrics.windows.currentWeek.daysElapsed} dias)`
      };
    }
    return {
      start: businessMetrics.windows.weekly.startDate,
      end: businessMetrics.windows.weekly.endDate,
      label: 'Última Semana Completa'
    };
  };

  const dateRange = getDateRange();

  // Urgent insight banner
  const getTopInsight = () => {
    const weekly = businessMetrics.weekly || {};
    const utilization = Math.round(weekly.totalUtilization || 0);

    if (utilization < 15) {
      return {
        text: `Utilização crítica: ${utilization}% última semana`,
        color: COLORS.primary,
        action: 'Considere promoção urgente ou marketing'
      };
    }

    const atRiskCount = customerMetrics.atRiskCount || 0;
    if (atRiskCount > 15) {
      return {
        text: `${atRiskCount} clientes em risco de churn`,
        color: COLORS.primary,
        action: 'Contatar clientes em risco hoje'
      };
    }

    return null;
  };

  const topInsight = getTopInsight();

  return (
    <div className="max-w-[1920px] mx-auto p-4 space-y-3">
      {/* HEADER BAND - DARK GRADIENT WITH WIDGETS */}
      <div className="w-full rounded-xl bg-gradient-to-b from-slate-950 via-slate-900 to-sky-900 text-white shadow-md p-4 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
          {/* Date Range Card */}
          <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
            <Calendar
              style={{ width: 20, height: 20, color: COLORS.primary }}
            />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 mb-[2px]">
                {dateRange.label}
              </div>
              <div
                className="text-sm font-bold"
                style={{ color: COLORS.primary }}
              >
                {dateRange.start} - {dateRange.end}
              </div>
            </div>
          </div>

          {/* Weather Widget */}
          <div className="flex items-center justify-center">
            <WeatherWidget />
          </div>

          {/* Social Media Widget */}
          <div className="flex items-center justify-center">
            <SocialMediaWidget />
          </div>

          {/* Google Business + Quick Actions */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
            <div className="flex justify-center md:justify-end">
              <GoogleBusinessWidget />
            </div>

            {/* Quick Actions Card (white) */}
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-2 flex items-center justify-around gap-2">
              <button
                onClick={() => handleQuickAction('schedule')}
                className="flex flex-col items-center gap-1 p-2 rounded-md transition-colors hover:bg-slate-100"
              >
                <Calendar
                  style={{ width: 20, height: 20, color: COLORS.primary }}
                />
                <span className="text-[10px] font-semibold text-slate-500">
                  Agenda
                </span>
              </button>

              <button
                onClick={() => handleQuickAction('campaigns')}
                className="flex flex-col items-center gap-1 p-2 rounded-md transition-colors hover:bg-slate-100"
              >
                <MessageSquare
                  style={{ width: 20, height: 20, color: COLORS.accent }}
                />
                <span className="text-[10px] font-semibold text-slate-500">
                  Campanhas
                </span>
              </button>

              <button
                onClick={() => handleQuickAction('settings')}
                className="flex flex-col items-center gap-1 p-2 rounded-md transition-colors hover:bg-slate-100"
              >
                <Settings
                  style={{ width: 20, height: 20, color: COLORS.gray }}
                />
                <span className="text-[10px] font-semibold text-slate-500">
                  Config
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CURRENT WEEK BANNER */}
      <CurrentWeekBanner businessMetrics={businessMetrics} />

      {/* VIEW MODE TOGGLE + TOP INSIGHT */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        {/* Toggle Buttons */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode('complete')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors ${
              viewMode === 'complete'
                ? 'bg-[#1a5a8e] text-white'
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
                ? 'bg-[#55b03b] text-white'
                : 'bg-transparent text-slate-500'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Semana Atual ({businessMetrics.windows.currentWeek.daysElapsed} dias)
          </button>
        </div>

        {/* Top Insight (if any) */}
        {topInsight && (
          <div
            className="flex-1 min-w-[300px] rounded-lg border-l-4 px-4 py-2"
            style={{
              borderColor: topInsight.color,
              background: `${topInsight.color}15`
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
      <KPICards
        businessMetrics={businessMetrics}
        customerMetrics={customerMetrics}
        salesData={data.sales}
        viewMode={viewMode}
      />

      {/* AT-RISK CUSTOMERS TABLE (salesData wired back in) */}
      <AtRiskCustomersTable
        customerMetrics={customerMetrics}
        salesData={data.sales}
      />
    </div>
  );
};

export default Dashboard;
