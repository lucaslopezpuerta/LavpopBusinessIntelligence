// InstagramAnalytics.jsx v3.10 - REFRESH OVERLAY
// Instagram Business Analytics Dashboard
// Design System v6.4 compliant
//
// CHANGELOG:
// v3.10 (2026-02-05): Refresh overlay (Design System v6.4)
//   - Added BackgroundRefreshIndicator overlay during sync
//   - Consistent refresh UX across social analytics screens
// v3.9 (2026-01-29): Mode-aware badge colors for better light mode contrast
//   - Summary stat badges now use amber-50/amber-800 in light mode
//   - Dark mode retains solid amber-500 with white text
// v3.8 (2026-01-29): Orange to yellow color migration
//   - Updated orange-600/orange-500 to yellow-600/yellow-500 in summary stat pills
// v3.7 (2026-01-29): Solid color badges for WCAG AA compliance
//   - Summary stat pills now use solid colors with white text
//   - Follower growth badge now uses solid colors with white text
// v3.6 (2026-01-09): Light background KPI cards (Hybrid Card Design)
//   - Migrated to Design System KPICard with variant="default"
//   - Card bodies now use light backgrounds (bg-white dark:bg-slate-800)
//   - Icon containers retain gradient colors for visual accent
//   - Removed local KPICard component in favor of Design System
// v3.5 (2026-01-09): Design System v4.0 compliance
//   - Fixed 15 typography violations (text-[10px]/text-[11px] → text-xs)
//   - Added Framer Motion hover to KPICard component
//   - Dark mode contrast fixes
// v3.4 (2025-12-22): Added haptic feedback on interactive elements
// v3.3 (2025-12-19): Date filter consistency
//   - Changed options to 7/30/Tudo (matching WhatsApp)
//   - "Tudo" fetches all available data (no 365-day limit)
// v3.2 (2025-12-18): Date filter consistency with WhatsApp
//   - Changed labels from "7d/14d/30d" to "7 dias/14 dias/Tudo"
//   - "Tudo" shows all available history
// v3.1 (2025-12-18): Smart Instagram links
//   - Desktop: opens Instagram website
//   - Mobile: opens Instagram app via deep link (instagram://)
//   - Applied to profile and post links
// v3.0 (2025-12-18): Instagram design overhaul
//   - Compact KPI cards with better contrast
//   - Posts section 2/3 width, comments 1/3
//   - Comments with pagination (no scroll)
//   - Instagram-like visual language
//   - Mobile: 3-column posts grid
//
// v2.0 (2025-12-18): Layout refactor
// v1.6 (2025-12-18): Design System compliance

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { haptics } from '../../utils/haptics';
import {
  Instagram,
  Users,
  Eye,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Loader2,
  Heart,
  MessageCircle,
  ExternalLink,
  Image,
  Video,
  Grid3X3,
  ArrowUp,
  ArrowDown,
  Database,
  Activity,
  Play,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MousePointer,
  BarChart3,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

import { api } from '../../utils/apiService';
import KPICard, { KPIGrid as DesignSystemKPIGrid } from '../ui/KPICard';
import BackgroundRefreshIndicator from '../ui/BackgroundRefreshIndicator';

// ==================== UTILITIES ====================

// Detect mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get Instagram link - app deep link on mobile, web on desktop
const getInstagramProfileUrl = (username, webUrl) => {
  if (isMobileDevice() && username) {
    return `instagram://user?username=${username}`;
  }
  return webUrl || `https://www.instagram.com/${username}`;
};

const getInstagramPostUrl = (permalink, mediaId) => {
  if (isMobileDevice() && mediaId) {
    return `instagram://media?id=${mediaId}`;
  }
  return permalink;
};

const formatNumber = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}min`;
  return 'agora';
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// ==================== INSTAGRAM DESIGN TOKENS ====================

const IG_COLORS = {
  pink: '#E1306C',
  purple: '#833AB4',
  orange: '#F77737',
  yellow: '#FCAF45',
  gradient: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)'
};

// ==================== SMALL COMPONENTS ====================

const DateFilter = ({ value, onChange }) => {
  const options = [
    { id: 7, label: '7 dias' },
    { id: 30, label: '30 dias' },
    { id: 'all', label: 'Tudo' }
  ];

  const handleChange = useCallback((id) => {
    haptics.tick();
    onChange(id);
  }, [onChange]);

  return (
    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => handleChange(option.id)}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all min-h-[28px] ${
            value === option.id
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const TrendBadge = ({ value, compact = false }) => {
  if (value === undefined || value === null) return null;
  const isPositive = value > 0;
  const isZero = value === 0;

  if (isZero) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
      isPositive ? 'text-emerald-400' : 'text-rose-400'
    }`}>
      {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(value)}
    </span>
  );
};

// ==================== PROFILE HEADER ====================

const ProfileHeader = ({ profile, summary, historyDays, onDaysChange, onRefresh, isSyncing, isLoadingHistory, lastSync }) => (
  <div className="bg-white dark:bg-space-dust rounded-2xl border border-slate-200 dark:border-stellar-cyan/10 p-4 sm:p-5">
    {/* ===== MOBILE LAYOUT ===== */}
    <div className="sm:hidden">
      {/* Row 1: Avatar + Username + Refresh */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex-shrink-0">
          {profile?.picture ? (
            <img src={profile.picture} alt={profile.username} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800" />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-800">
              <Instagram className="w-5 h-5 text-slate-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">@{profile?.username || 'instagram'}</h2>
            {profile?.username && (
              <a href={getInstagramProfileUrl(profile.username, profile.url)} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs mt-0.5">
            <span className="text-slate-600 dark:text-slate-400"><strong className="text-slate-900 dark:text-white">{formatNumber(profile?.posts || 0)}</strong> posts</span>
            <span className="text-slate-600 dark:text-slate-400"><strong className="text-slate-900 dark:text-white">{formatNumber(profile?.followers || 0)}</strong> seg.</span>
          </div>
        </div>
        <button onClick={() => { haptics.light(); onRefresh(); }} disabled={isSyncing} className="w-9 h-9 flex items-center justify-center bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 disabled:opacity-50 text-white rounded-full shadow-md flex-shrink-0">
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {/* Row 2: Bio */}
      {profile?.bio && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">{profile.bio}</p>}
      {/* Row 3: Date filter */}
      <div className="flex items-center justify-between mt-3">
        <DateFilter value={historyDays} onChange={onDaysChange} />
        {lastSync && <span className="text-slate-400 text-xs">{formatTimeAgo(lastSync)}</span>}
      </div>
    </div>

    {/* ===== DESKTOP LAYOUT ===== */}
    <div className="hidden sm:flex sm:items-start sm:gap-6">
      {/* Left: Large Avatar */}
      <div className="flex-shrink-0">
        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
          {profile?.picture ? (
            <img src={profile.picture} alt={profile.username} className="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-800" />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-[3px] border-white dark:border-slate-800">
              <Instagram className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {/* Center: Profile Info */}
      <div className="flex-1 min-w-0">
        {/* Username row */}
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">@{profile?.username || 'instagram'}</h2>
          {profile?.username && (
            <a href={getInstagramProfileUrl(profile.username, profile.url)} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Stats row - Instagram style */}
        <div className="flex items-center gap-6 mb-3">
          <div className="text-center">
            <span className="block text-lg font-bold text-slate-900 dark:text-white">{formatNumber(profile?.posts || 0)}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">publicações</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-slate-900 dark:text-white">{formatNumber(profile?.followers || 0)}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">seguidores</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-slate-900 dark:text-white">{formatNumber(profile?.following || 0)}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">seguindo</span>
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl line-clamp-2">{profile.bio}</p>
        )}
      </div>

      {/* Right: Date filter */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <DateFilter value={historyDays} onChange={onDaysChange} />
      </div>
    </div>

    {/* ===== SUMMARY BAR (shared) ===== */}
    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {historyDays === 'all' ? 'Todo período' : `${historyDays} dias`}
        </span>
        {isLoadingHistory ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : summary ? (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-600 dark:bg-purple-500 text-white font-medium text-xs">
              Alcance: {formatNumber(summary.totalReach)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-medium text-xs">
              Views: {formatNumber(summary.totalViews)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400 font-medium text-xs">
              Interações: {formatNumber(summary.totalInteractions)}
            </span>
          </div>
        ) : (
          <span className="text-slate-400">Sem dados</span>
        )}
        {/* Desktop: Sync button and last sync time */}
        <div className="hidden sm:flex items-center gap-2 ml-auto">
          {lastSync && (
            <span className="text-slate-400 text-xs">Sync: {formatTimeAgo(lastSync)}</span>
          )}
          <button onClick={() => { haptics.light(); onRefresh(); }} disabled={isSyncing} className="px-3 py-1.5 flex items-center gap-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 hover:from-pink-600 hover:via-rose-600 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-full shadow-sm transition-all">
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ==================== COMPACT KPI CARDS ====================
// Uses Design System KPICard with variant="default" (light background)
// Icon containers retain gradient colors for visual accent

const InstagramKPIGrid = ({ insights, latestHistory, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Map trend value to KPICard trend format
  const formatTrend = (value) => {
    if (value === undefined || value === null || value === 0) return null;
    return { value };
  };

  return (
    <DesignSystemKPIGrid columns={6} className="grid-cols-3 sm:grid-cols-6 gap-2" animate={false}>
      <KPICard
        label="Alcance"
        value={formatNumber(insights?.reach || 0)}
        trend={formatTrend(latestHistory?.reach_change)}
        icon={Eye}
        color="purple"
        variant="compact"
      />
      <KPICard
        label="Views"
        value={formatNumber(insights?.views || 0)}
        trend={formatTrend(latestHistory?.views_change)}
        icon={Play}
        color="blue"
        variant="compact"
      />
      <KPICard
        label="Vis. Perfil"
        value={formatNumber(insights?.profileViews || 0)}
        icon={Users}
        color="whatsappTeal"
        variant="compact"
      />
      <KPICard
        label="Engajamento"
        value={`${(insights?.engagementRate || 0).toFixed(1)}%`}
        icon={TrendingUp}
        color="cost"
        variant="compact"
      />
      <KPICard
        label="Interações"
        value={formatNumber(insights?.totalInteractions || 0)}
        trend={formatTrend(latestHistory?.interactions_change)}
        icon={Activity}
        color="warning"
        variant="compact"
      />
      <KPICard
        label="Cliques"
        value={formatNumber(insights?.websiteClicks || 0)}
        icon={MousePointer}
        color="neutral"
        variant="compact"
      />
    </DesignSystemKPIGrid>
  );
};

// ==================== CHARTS ====================

const ChartCard = ({ title, subtitle, icon: Icon, iconColor = 'text-slate-400', iconBg = 'bg-slate-100 dark:bg-slate-700/50', children, className = '' }) => (
  <div className={`bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-stellar-cyan/10 overflow-hidden ${className}`}>
    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
      {Icon && (
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
    <div className="p-3">
      {children}
    </div>
  </div>
);

const MainChart = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return [...data]
      .sort((a, b) => new Date(a.bucket_date) - new Date(b.bucket_date))
      .map(d => ({
        date: formatDateShort(d.bucket_date),
        reach: d.reach || 0,
        views: d.views || 0,
        interactions: d.total_interactions || 0
      }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-52 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="h-52 flex flex-col items-center justify-center text-slate-400">
        <Database className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Sem dados históricos</p>
        <p className="text-xs mt-1">Clique em Atualizar para sincronizar</p>
      </div>
    );
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={40} tickFormatter={formatNumber} />
          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={35} tickFormatter={formatNumber} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '11px' }}
            formatter={(value, name) => [formatNumber(value), name === 'reach' ? 'Alcance' : name === 'views' ? 'Views' : 'Interações']}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Area yAxisId="left" type="monotone" dataKey="reach" stroke="#a855f7" strokeWidth={2} fill="url(#reachFill)" />
          <Bar yAxisId="left" dataKey="views" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={16} />
          <Line yAxisId="right" type="monotone" dataKey="interactions" stroke="#f97316" strokeWidth={2} dot={{ r: 2, fill: '#f97316' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const FollowerChart = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return [...data]
      .sort((a, b) => new Date(a.bucket_date) - new Date(b.bucket_date))
      .map(d => ({
        date: formatDateShort(d.bucket_date),
        followers: d.followers || 0
      }));
  }, [data]);

  const growth = useMemo(() => {
    if (chartData.length < 2) return 0;
    return chartData[chartData.length - 1].followers - chartData[0].followers;
  }, [chartData]);

  if (isLoading) return <div className="h-36 flex items-center justify-center"><Loader2 className="w-5 h-5 text-pink-400 animate-spin" /></div>;
  if (!chartData.length) return <div className="h-36 flex items-center justify-center text-slate-400 text-xs">Sem dados</div>;

  return (
    <div>
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-2 text-white ${
        growth >= 0 ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-red-600 dark:bg-red-500'
      }`}>
        {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {growth >= 0 ? '+' : ''}{formatNumber(growth)} no período
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="followerFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={40} tickFormatter={formatNumber} domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', fontSize: '10px' }}
              formatter={(value) => [formatNumber(value), 'Seguidores']}
            />
            <Area type="monotone" dataKey="followers" stroke="#ec4899" strokeWidth={2} fill="url(#followerFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const EngagementChart = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return [...data]
      .sort((a, b) => new Date(a.bucket_date) - new Date(b.bucket_date))
      .map(d => ({
        date: formatDateShort(d.bucket_date),
        likes: d.likes || 0,
        comments: d.comments || 0,
        shares: d.shares || 0,
        saves: d.saves || 0,
        total: d.total_interactions || 0
      }));
  }, [data]);

  const hasBreakdown = chartData.some(d => d.likes > 0 || d.comments > 0 || d.shares > 0 || d.saves > 0);
  const hasAnyData = chartData.some(d => d.total > 0);

  if (isLoading) return <div className="h-36 flex items-center justify-center"><Loader2 className="w-5 h-5 text-orange-400 animate-spin" /></div>;

  if (!hasAnyData) {
    return (
      <div className="h-36 flex flex-col items-center justify-center text-slate-400">
        <Activity className="w-6 h-6 mb-1 opacity-50" />
        <p className="text-xs">Sem interações</p>
      </div>
    );
  }

  // Show total interactions if no breakdown
  if (!hasBreakdown) {
    return (
      <div>
        <p className="text-xs text-slate-400 mb-2">Total de interações</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={30} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', fontSize: '10px' }}
                formatter={(value) => [formatNumber(value), 'Interações']}
              />
              <Bar dataKey="total" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-xs mb-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500" /> Curtidas</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Coment.</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Compart.</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Salvos</span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={30} />
            <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px' }} />
            <Bar dataKey="likes" stackId="a" fill="#ec4899" name="Curtidas" />
            <Bar dataKey="comments" stackId="a" fill="#3b82f6" name="Comentários" />
            <Bar dataKey="shares" stackId="a" fill="#a855f7" name="Compartilh." />
            <Bar dataKey="saves" stackId="a" fill="#f59e0b" name="Salvos" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==================== POSTS GRID (2/3 width) ====================

const PostCard = ({ post }) => {
  const TypeIcon = post.type === 'VIDEO' ? Video : post.type === 'CAROUSEL_ALBUM' ? Grid3X3 : Image;

  return (
    <a
      href={getInstagramPostUrl(post.permalink, post.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700"
    >
      {(post.thumbnail || post.mediaUrl) ? (
        <img src={post.thumbnail || post.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center"><Image className="w-5 h-5 text-slate-400" /></div>
      )}

      <div className="absolute top-1 right-1 bg-black/50 rounded p-0.5">
        <TypeIcon className="w-2.5 h-2.5 text-white" />
      </div>

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <span className="flex items-center gap-0.5 text-white text-xs font-medium">
          <Heart className="w-3 h-3" /> {formatNumber(post.likes)}
        </span>
        <span className="flex items-center gap-0.5 text-white text-xs font-medium">
          <MessageCircle className="w-3 h-3" /> {formatNumber(post.comments)}
        </span>
      </div>
    </a>
  );
};

const PostsSection = ({ media, isLoading }) => (
  <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-stellar-cyan/10 overflow-hidden h-full flex flex-col">
    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-rose-500/20 text-pink-500 dark:from-pink-500/30 dark:to-rose-500/30">
        <Grid3X3 className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Postagens Recentes</h3>
        <p className="text-xs text-slate-400">{media.length} posts</p>
      </div>
    </div>
    <div className="p-3 flex-1">
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !media.length ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
          <Image className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs">Nenhuma postagem</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
          {media.slice(0, 18).map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  </div>
);

// ==================== COMMENTS WITH PAGINATION ====================

const COMMENTS_PER_PAGE = 6;

const CommentsSection = ({ comments, isLoading }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);
  const paginatedComments = comments.slice(page * COMMENTS_PER_PAGE, (page + 1) * COMMENTS_PER_PAGE);

  return (
    <div className="bg-white dark:bg-space-dust rounded-xl border border-slate-200 dark:border-stellar-cyan/10 overflow-hidden h-full flex flex-col min-h-[400px]">
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-stellar-cyan/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-500 dark:from-blue-500/30 dark:to-indigo-500/30">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Comentários</h3>
            <p className="text-xs text-slate-400">{comments.length} recentes</p>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { haptics.tick(); setPage(p => Math.max(0, p - 1)); }}
              disabled={page === 0}
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[50px] text-center font-medium">
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => { haptics.tick(); setPage(p => Math.min(totalPages - 1, p + 1)); }}
              disabled={page === totalPages - 1}
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-col justify-between flex-1">
            {[...Array(COMMENTS_PER_PAGE)].map((_, i) => (
              <div key={i} className="flex gap-2 py-2">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : !comments.length ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageCircle className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">Sem comentários</p>
          </div>
        ) : (
          <div className="flex flex-col justify-between flex-1">
            {paginatedComments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5 py-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {comment.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">@{comment.username}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatTimeAgo(comment.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const InstagramAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [insights, setInsights] = useState(null);
  const [media, setMedia] = useState([]);
  const [comments, setComments] = useState([]);

  const [historyDays, setHistoryDays] = useState(30);
  const [historyData, setHistoryData] = useState([]);
  const [lastSync, setLastSync] = useState(null);

  // Calculate summary from history
  // Note: Only depends on historyData to avoid race conditions when filter changes
  const summary = useMemo(() => {
    if (!historyData.length) return null;

    const totalReach = historyData.reduce((sum, d) => sum + (d.reach || 0), 0);
    const totalViews = historyData.reduce((sum, d) => sum + (d.views || 0), 0);
    const totalInteractions = historyData.reduce((sum, d) => sum + (d.total_interactions || 0), 0);

    return {
      totalReach,
      totalViews,
      totalInteractions,
      daysTracked: historyData.length
    };
  }, [historyData]);

  const latestHistory = useMemo(() => {
    if (!historyData.length) return null;
    return [...historyData].sort((a, b) => new Date(b.bucket_date) - new Date(a.bucket_date))[0];
  }, [historyData]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashboardData, commentsData] = await Promise.all([
        api.instagram.getDashboard(),
        api.instagram.getComments(20)
      ]);
      setProfile(dashboardData.profile);
      setInsights(dashboardData.insights);
      setMedia(dashboardData.media || []);
      setComments(commentsData.comments || []);
    } catch (err) {
      console.error('Instagram fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (days) => {
    setIsLoadingHistory(true);
    try {
      // 'all' means fetch all available history (null = no limit)
      const daysToFetch = days === 'all' ? null : days;
      const [historyResult, statusResult] = await Promise.all([
        api.instagram.getHistory(daysToFetch),
        api.instagram.getStatus()
      ]);

      setHistoryData(historyResult.history || []);
      setLastSync(statusResult.lastSync);
    } catch (err) {
      console.error('Instagram history error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchHistory(historyDays);
  }, [fetchData, fetchHistory, historyDays]);

  const handleRefresh = async () => {
    setIsSyncing(true);
    try {
      await api.instagram.triggerSync();
      await Promise.all([fetchData(), fetchHistory(historyDays)]);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (error && !profile) {
    return (
      <div className="bg-white dark:bg-space-dust rounded-2xl border border-slate-200 dark:border-stellar-cyan/10 p-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Erro ao carregar</h3>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button onClick={handleRefresh} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full text-xs font-semibold">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        summary={summary}
        historyDays={historyDays}
        onDaysChange={setHistoryDays}
        onRefresh={handleRefresh}
        isSyncing={isSyncing}
        isLoadingHistory={isLoadingHistory}
        lastSync={lastSync}
      />

      {/* KPI Grid - Light background cards with gradient icons */}
      <InstagramKPIGrid insights={insights} latestHistory={latestHistory} isLoading={isLoading} />

      {/* Main Chart */}
      <ChartCard
        title="Visibilidade & Engajamento"
        subtitle={`Alcance, views e interações • ${historyDays === 'all' ? 'Todo período' : `${historyDays} dias`}`}
        icon={Sparkles}
        iconColor="text-purple-500"
        iconBg="bg-gradient-to-br from-purple-500/20 to-violet-500/20 dark:from-purple-500/30 dark:to-violet-500/30"
      >
        <MainChart data={historyData} isLoading={isLoadingHistory} />
      </ChartCard>

      {/* Secondary Charts - Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCard
          title="Seguidores"
          subtitle="Evolução no período"
          icon={Users}
          iconColor="text-pink-500"
          iconBg="bg-gradient-to-br from-pink-500/20 to-rose-500/20 dark:from-pink-500/30 dark:to-rose-500/30"
        >
          <FollowerChart data={historyData} isLoading={isLoadingHistory} />
        </ChartCard>
        <ChartCard
          title="Engajamento"
          subtitle="Interações por tipo"
          icon={BarChart3}
          iconColor="text-orange-500"
          iconBg="bg-gradient-to-br from-orange-500/20 to-amber-500/20 dark:from-orange-500/30 dark:to-amber-500/30"
        >
          <EngagementChart data={historyData} isLoading={isLoadingHistory} />
        </ChartCard>
      </div>

      {/* Posts (2/3) & Comments (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <PostsSection media={media} isLoading={isLoading} />
        </div>
        <CommentsSection comments={comments} isLoading={isLoading} />
      </div>

      {/* Refresh overlay (during sync only) */}
      <BackgroundRefreshIndicator
        isRefreshing={isSyncing}
        variant="overlay"
        message="Atualizando Instagram..."
      />
    </div>
  );
};

export default InstagramAnalytics;
