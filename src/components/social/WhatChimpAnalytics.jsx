// WhatChimpAnalytics.jsx v1.7 - USE BACKGROUND REFRESH INDICATOR
// WhatChimp Sync Analytics Dashboard
// Design System v6.4 compliant - Cosmic Precision
//
// CHANGELOG:
// v1.7 (2026-02-05): Use BackgroundRefreshIndicator component
//   - Replaced inline loading overlay with reusable component
//   - Uses new 'overlay' variant for consistent refresh UX
// v1.6 (2026-02-04): Add help modal
//   - Help button explains WhatChimp sync flow
//   - Documents automatic daily sync and manual sync
//   - Explains what data is synced (labels, saldo)
// v1.5 (2026-02-04): Non-blocking background sync
//   - Removed blocking overlay during sync
//   - Sync runs via Netlify Background Function (up to 15 min)
//   - Returns immediately, user can navigate freely
//   - Toast notification indicates sync started
//   - Results visible on next refresh via app_settings.whatchimp_last_sync
// v1.4 (2026-02-04): Use ToastContext for notifications
//   - Replaced custom inline toast with useToast hook
//   - Consistent toast styling across app
// v1.3 (2026-02-04): Add Full Sync button
//   - New "Sincronizar" button (amber/orange) triggers sync_all API
//   - Confirmation modal before starting sync
//   - Toast notification shows sync results
//   - Buttons disabled during sync operation
// v1.2 (2026-02-03): Mobile layout refinements
//   - Sync button now circular and positioned top-right on mobile
//   - Fixed pie chart truncation with fixed-size container
//   - Legend always vertical with compact spacing on mobile
// v1.1 (2026-02-03): Fix number formatting
//   - All integer counts now display without decimals
//   - Fixed: header summary, tooltips, chart legends
// v1.0 (2026-02-03): Initial implementation
//   - Profile header with sync status and refresh button
//   - KPI cards: Total Synced, Created, Updated, Failed
//   - RFM Segment and Risk Level pie charts
//   - Responsive layout (mobile/desktop)
//   - Dark/light theme support

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Zap,
  Users,
  UserPlus,
  RefreshCw,
  AlertCircle,
  Clock,
  HelpCircle,
  CalendarClock,
  Tag,
  Wallet
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import KPICard, { KPIGrid } from '../ui/KPICard';
import { formatNumber } from '../../utils/numberUtils';
import { haptics } from '../../utils/haptics';
import BaseModal from '../ui/BaseModal';
import BackgroundRefreshIndicator from '../ui/BackgroundRefreshIndicator';
import { getHeaders } from '../../utils/apiService';

// ==================== CONSTANTS ====================

// RFM Segment colors (matching label colors in the plan)
const RFM_COLORS = {
  'VIP': '#9333ea',        // purple-500
  'Frequente': '#3b82f6',  // blue-500
  'Promissor': '#10b981',  // emerald-500
  'Novato': '#06b6d4',     // cyan-500
  'Esfriando': '#f59e0b',  // amber-500
  'Inativo': '#94a3b8',    // slate-400
  'Sem Segmento': '#64748b' // slate-500
};

// Risk Level colors
const RISK_COLORS = {
  'Healthy': '#10b981',       // emerald-500
  'At Risk': '#f59e0b',       // amber-500
  'Churning': '#f97316',      // orange-500
  'Lost': '#ef4444',          // red-500
  'New Customer': '#3b82f6',  // blue-500
  'Sem Nível': '#64748b'      // slate-500
};

// ==================== HELPER FUNCTIONS ====================

// Format time ago for last sync
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Nunca sincronizado';

  const now = new Date();
  const syncTime = new Date(timestamp);
  const diffMs = now - syncTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays}d atrás`;
}

// Convert object to array for charts
function objectToChartData(obj, colorMap) {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] || '#64748b'
    }))
    .sort((a, b) => b.value - a.value);
}

// ==================== SUBCOMPONENTS ====================

// Profile Header with sync status and action buttons
const ProfileHeader = ({ lastSync, isLoading, isSyncing, onRefresh, onSync, onHelp, stats, isDark }) => {
  const syncHealth = stats?.failed === 0 ? 'healthy' : stats?.failed < 10 ? 'warning' : 'critical';
  const isDisabled = isLoading || isSyncing;

  return (
    <div className={`
      rounded-2xl p-4 sm:p-5 mb-4 relative
      ${isDark
        ? 'bg-space-dust border border-stellar-cyan/10'
        : 'bg-white border border-slate-200 shadow-sm'}
    `}>
      {/* Mobile buttons - absolute positioned top-right */}
      <div className="sm:hidden absolute top-3 right-3 flex items-center gap-2">
        {/* Mobile refresh button (cyan) */}
        <button
          onClick={() => {
            haptics.tick();
            onRefresh();
          }}
          disabled={isDisabled}
          className={`
            flex items-center justify-center
            w-10 h-10 rounded-full
            transition-all duration-200
            bg-gradient-to-r from-cyan-500 to-teal-500 text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg shadow-cyan-500/25
          `}
          aria-label="Atualizar dados"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Mobile sync button (amber) */}
        <button
          onClick={() => {
            haptics.heavy();
            onSync();
          }}
          disabled={isDisabled}
          className={`
            flex items-center justify-center
            w-10 h-10 rounded-full
            transition-all duration-200
            bg-gradient-to-r from-amber-500 to-orange-500 text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg shadow-amber-500/25
          `}
          aria-label="Sincronizar clientes"
        >
          <Zap className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left side: Avatar and info */}
        <div className="flex items-center gap-3 sm:gap-4 pr-24 sm:pr-0">
          {/* Avatar with gradient ring */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-teal-500 to-blue-600 flex-shrink-0">
            <div className={`w-full h-full rounded-full flex items-center justify-center ${
              isDark ? 'bg-space-dust' : 'bg-white'
            }`}>
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className={`text-base sm:text-xl font-bold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                WhatChimp Sync
              </h2>
              {/* Help button - discrete, next to title */}
              <button
                onClick={() => {
                  haptics.tick();
                  onHelp();
                }}
                className={`
                  flex items-center justify-center
                  w-5 h-5 rounded
                  transition-all duration-200
                  ${isDark
                    ? 'text-slate-500 hover:text-slate-300'
                    : 'text-slate-400 hover:text-slate-600'}
                `}
                aria-label="Ajuda"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Clock className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {formatTimeAgo(lastSync?.timestamp)}
                </span>
              </div>

              {/* Health badge */}
              {stats && (
                <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                  syncHealth === 'healthy'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : syncHealth === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    syncHealth === 'healthy' ? 'bg-emerald-500' : syncHealth === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  {syncHealth === 'healthy' ? 'Saudável' : syncHealth === 'warning' ? 'Atenção' : 'Crítico'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Desktop buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Desktop refresh button (cyan) */}
          <button
            onClick={() => {
              haptics.tick();
              onRefresh();
            }}
            disabled={isDisabled}
            className={`
              flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              min-h-[44px] font-medium text-sm
              transition-all duration-200
              ${isDark
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-400 hover:to-teal-400'
                : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          {/* Desktop sync button (amber) */}
          <button
            onClick={() => {
              haptics.heavy();
              onSync();
            }}
            disabled={isDisabled}
            className={`
              flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              min-h-[44px] font-medium text-sm
              transition-all duration-200
              ${isDark
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label="Sincronizar clientes"
          >
            <Zap className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {stats && (
        <div className={`
          flex flex-wrap gap-2 sm:gap-4 mt-4 pt-4
          border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}
        `}>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-500" />
            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {formatNumber(stats.total, 0)} sincronizados
            </span>
          </div>
          {stats.created > 0 && (
            <div className="flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-teal-500" />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {formatNumber(stats.created, 0)} novos
              </span>
            </div>
          )}
          {stats.failed > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {formatNumber(stats.failed, 0)} falhas
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Custom tooltip for pie charts
const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  return (
    <div className={`
      px-3 py-2 rounded-lg shadow-lg text-sm
      ${isDark ? 'bg-space-dust border border-stellar-cyan/20' : 'bg-white border border-slate-200'}
    `}>
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.payload.color }}
        />
        <span className={isDark ? 'text-white' : 'text-slate-900'}>
          {data.name}
        </span>
      </div>
      <div className={`font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {formatNumber(data.value, 0)} clientes
      </div>
    </div>
  );
};

// Distribution chart section
const DistributionSection = ({ title, data, colors, isDark }) => {
  const chartData = useMemo(() => objectToChartData(data, colors), [data, colors]);
  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData]);

  if (!chartData.length) return null;

  return (
    <div className={`
      rounded-2xl p-4 sm:p-5
      ${isDark
        ? 'bg-space-dust border border-stellar-cyan/10'
        : 'bg-white border border-slate-200 shadow-sm'}
    `}>
      <h3 className={`text-sm font-semibold mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h3>

      <div className="flex flex-row items-center gap-3 sm:gap-4">
        {/* Pie Chart - fixed size on mobile to prevent truncation */}
        <div className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - always vertical, compact on mobile */}
        <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 min-w-0">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className={`${isDark ? 'text-slate-300' : 'text-slate-600'} truncate`}>
                {item.name}
              </span>
              <span className={`font-medium tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatNumber(item.value, 0)}
              </span>
              <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} hidden xs:inline`}>
                ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const WhatChimpAnalytics = () => {
  const { isDark } = useTheme();
  const toast = useToast();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    distribution: { rfm_segments: {}, risk_levels: {}, total: 0 },
    lastSync: null,
    labelMapping: {}
  });

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/whatchimp-api', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'get_stats' })
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar dados');
      }

      const result = await response.json();

      if (result.success) {
        setData({
          distribution: result.distribution || { rfm_segments: {}, risk_levels: {}, total: 0 },
          lastSync: result.lastSync,
          labelMapping: result.labelMapping || {}
        });
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('Failed to fetch WhatChimp stats:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle full sync - triggers background function
  const handleFullSync = useCallback(async () => {
    setShowSyncModal(false);
    setIsSyncing(true);

    try {
      // Call background function - returns 202 immediately
      const response = await fetch('/.netlify/functions/whatchimp-sync-background', {
        method: 'POST',
        headers: getHeaders()
      });

      // Background functions return 202 Accepted
      if (response.status === 202 || response.ok) {
        const totalCustomers = data.lastSync?.total || data.distribution?.total || 0;
        toast.success(
          `Sincronização iniciada! ${formatNumber(totalCustomers, 0)} clientes serão sincronizados em segundo plano. Dados atualizam automaticamente em ~60s.`,
          { duration: 10000 }
        );
        // Auto-refresh after delay (background job takes ~60s for ~1800 customers)
        setTimeout(() => {
          fetchData();
          setIsSyncing(false);
        }, 60000);
        return; // Keep isSyncing=true until timeout
      } else {
        toast.error('Erro ao iniciar sincronização. Tente novamente.');
      }
    } catch (err) {
      console.error('Failed to start sync:', err);
      toast.error(`Erro ao iniciar sincronização: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  }, [data.lastSync?.total, data.distribution?.total, toast, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats - prefer lastSync data (actual synced count) over distribution (Supabase count)
  const stats = useMemo(() => {
    // lastSync.total = actual subscribers synced to WhatChimp
    // distribution.total = customers with phone in Supabase (may include blacklisted, failed, etc.)
    const total = data.lastSync?.total || data.distribution?.total || 0;
    return {
      total,
      created: data.lastSync?.created || 0,
      updated: data.lastSync?.updated || 0,
      failed: data.lastSync?.failed || 0,
      duration: data.lastSync?.duration_seconds || 0
    };
  }, [data]);

  // Error state
  if (error && !data.distribution?.total) {
    return (
      <div className={`
        rounded-2xl p-6 text-center
        ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}
      `}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Erro ao carregar dados
        </h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {error}
        </p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* Profile Header */}
      <ProfileHeader
        lastSync={data.lastSync}
        isLoading={isLoading}
        isSyncing={isSyncing}
        onRefresh={fetchData}
        onSync={() => setShowSyncModal(true)}
        onHelp={() => setShowHelpModal(true)}
        stats={stats}
        isDark={isDark}
      />

      {/* KPI Cards */}
      <KPIGrid columns={4}>
        <KPICard
          label="Clientes Sincronizados"
          mobileLabel="Sincronizados"
          value={formatNumber(stats.total, 0)}
          icon={Users}
          color="cyan"
          variant="default"
          subtitle="Total no WhatChimp"
        />
        <KPICard
          label="Novos Criados"
          mobileLabel="Criados"
          value={formatNumber(stats.created, 0)}
          icon={UserPlus}
          color="emerald"
          variant="default"
          subtitle="Última sincronização"
        />
        <KPICard
          label="Atualizados"
          mobileLabel="Atualizados"
          value={formatNumber(stats.updated, 0)}
          icon={RefreshCw}
          color="blue"
          variant="default"
          subtitle="Labels e saldo"
        />
        <KPICard
          label="Falhas"
          mobileLabel="Falhas"
          value={formatNumber(stats.failed, 0)}
          icon={AlertCircle}
          color={stats.failed > 0 ? 'warning' : 'positive'}
          variant="default"
          subtitle={stats.failed === 0 ? 'Nenhuma falha' : 'Verificar logs'}
          status={stats.failed === 0 ? 'success' : stats.failed < 10 ? 'warning' : 'danger'}
        />
      </KPIGrid>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionSection
          title="Segmentos RFM"
          data={data.distribution?.rfm_segments}
          colors={RFM_COLORS}
          isDark={isDark}
        />
        <DistributionSection
          title="Níveis de Risco"
          data={data.distribution?.risk_levels}
          colors={RISK_COLORS}
          isDark={isDark}
        />
      </div>

      {/* Sync Confirmation Modal */}
      <BaseModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        title="Sincronização Completa"
        subtitle="Sincronizar todos os clientes"
        icon={Zap}
        iconColor="amber"
        size="small"
        maxWidth="md"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSyncModal(false)}
              className={`
                px-4 py-2.5 rounded-xl font-medium text-sm min-h-[44px]
                transition-colors duration-200
                ${isDark
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
              `}
            >
              Cancelar
            </button>
            <button
              onClick={handleFullSync}
              className={`
                px-4 py-2.5 rounded-xl font-medium text-sm min-h-[44px]
                flex items-center gap-2
                transition-all duration-200
                bg-gradient-to-r from-amber-500 to-orange-500 text-white
                hover:from-amber-600 hover:to-orange-600
              `}
            >
              <Zap className="w-4 h-4" />
              Iniciar Sync
            </button>
          </div>
        }
      >
        <div className="px-4 sm:px-6 py-4">
          <p className={`text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Esta ação irá sincronizar <strong>TODOS os {formatNumber(data.distribution?.total || stats.total, 0)} clientes</strong> com o WhatChimp.
          </p>

          <div className={`
            rounded-lg p-3 mb-4
            ${isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'}
          `}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                Tempo estimado: ~15 minutos
              </span>
            </div>
          </div>

          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <p className="font-medium mb-2">O que será atualizado:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Labels de segmento RFM</li>
              <li>Labels de nível de risco</li>
              <li>Saldo da carteira (custom field)</li>
            </ul>
          </div>
        </div>
      </BaseModal>

      {/* Help Modal */}
      <BaseModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Como funciona o WhatChimp"
        subtitle="Sincronização de clientes"
        icon={HelpCircle}
        iconColor="cyan"
        size="small"
        maxWidth="md"
      >
        <div className="px-4 sm:px-6 py-4 space-y-5">
          {/* Automatic Sync */}
          <div className="flex gap-3">
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
              ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'}
            `}>
              <CalendarClock className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h4 className={`font-medium text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sincronização Automática
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Todos os dias às <strong>07:00 (horário de Brasília)</strong>, os dados dos clientes são
                sincronizados automaticamente com o WhatChimp.
              </p>
            </div>
          </div>

          {/* Manual Sync */}
          <div className="flex gap-3">
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
              ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}
            `}>
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className={`font-medium text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sincronização Manual
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Use o botão <strong className="text-amber-500">Sincronizar</strong> para atualizar os dados
                imediatamente. A sincronização roda em segundo plano (~15 min) e você pode continuar
                navegando normalmente.
              </p>
            </div>
          </div>

          {/* What is synced */}
          <div className={`
            rounded-xl p-4
            ${isDark ? 'bg-space-nebula border border-stellar-cyan/10' : 'bg-slate-50 border border-slate-200'}
          `}>
            <h4 className={`font-medium text-sm mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              O que é sincronizado:
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Tag className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                <div>
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Labels RFM
                  </span>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    VIP, Frequente, Promissor, Novato, Esfriando, Inativo
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Tag className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                <div>
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Labels de Risco
                  </span>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Healthy, At Risk, Churning, Lost, New Customer
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Wallet className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-teal-400' : 'text-teal-500'}`} />
                <div>
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Saldo da Carteira
                  </span>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Campo personalizado para campanhas de cashback
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tip */}
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            💡 Use os labels no WhatChimp para criar campanhas segmentadas e mensagens personalizadas.
          </p>
        </div>
      </BaseModal>

      {/* Loading overlay (for stats refresh only) */}
      <BackgroundRefreshIndicator
        isRefreshing={isLoading && !isSyncing && data.distribution?.total > 0}
        variant="overlay"
        message="Atualizando..."
      />
    </div>
  );
};

export default WhatChimpAnalytics;
