// GoogleBusinessAnalytics.jsx v1.0
// Google Business Profile Analytics Dashboard
// Design System v4.0 compliant - Google-branded design
//
// v1.0 (2025-12-19): Initial implementation
//   - OAuth flow integration
//   - Rating display with star visualization
//   - Reviews list with reply capability
//   - Historical search/views/actions trends
//   - Follows Instagram/WhatsApp dashboard patterns

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Star,
  Search,
  Eye,
  MousePointer,
  Phone,
  MapPin,
  RefreshCw,
  AlertCircle,
  Loader2,
  ExternalLink,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Database,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Reply,
  CheckCircle,
  XCircle,
  LogIn,
  Send
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

// ==================== UTILITIES ====================

const formatNumber = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return 'agora';
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ==================== GOOGLE DESIGN TOKENS ====================

const GOOGLE_COLORS = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC05',
  green: '#34A853',
  gradient: 'linear-gradient(90deg, #4285F4, #34A853, #FBBC05, #EA4335)'
};

// ==================== SMALL COMPONENTS ====================

const DateFilter = ({ value, onChange }) => {
  const options = [
    { id: 7, label: '7 dias' },
    { id: 30, label: '30 dias' },
    { id: 'all', label: 'Tudo' }
  ];

  return (
    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all min-h-[28px] ${
            value === option.id
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
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
    <span className={`inline-flex items-center gap-0.5 ${compact ? 'text-[10px]' : 'text-xs'} font-semibold ${
      isPositive ? 'text-emerald-400' : 'text-rose-400'
    }`}>
      {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(value)}
    </span>
  );
};

// Star rating display
const StarRating = ({ rating, size = 'md' }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  const starSize = size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={`${starSize} fill-yellow-400 text-yellow-400`} />
      ))}
      {hasHalf && (
        <div className="relative">
          <Star className={`${starSize} text-slate-300 dark:text-slate-600`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={`${starSize} text-slate-300 dark:text-slate-600`} />
      ))}
    </div>
  );
};

// ==================== OAUTH SETUP COMPONENT ====================

const OAuthSetup = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await api.googleBusiness.getOAuthUrl();
      if (result.authUrl) {
        window.location.href = result.authUrl;
      } else {
        console.error('No auth URL returned');
      }
    } catch (err) {
      console.error('OAuth init error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
        <Building2 className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        Conectar Google Business Profile
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
        Para visualizar métricas, avaliações e responder aos clientes, conecte sua conta do Google Business Profile.
      </p>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
      >
        {isConnecting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <LogIn className="w-5 h-5" />
        )}
        {isConnecting ? 'Conectando...' : 'Conectar com Google'}
      </button>
      <p className="text-xs text-slate-400 mt-4">
        Você será redirecionado para o Google para autorizar o acesso.
      </p>
    </div>
  );
};

// ==================== PROFILE HEADER ====================

const ProfileHeader = ({ profile, summary, historyDays, onDaysChange, onRefresh, isSyncing, isLoadingHistory, lastSync }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
    {/* ===== MOBILE LAYOUT ===== */}
    <div className="sm:hidden">
      {/* Row 1: Icon + Business Name + Refresh */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {profile?.name || 'Google Business'}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={profile?.rating || 0} size="sm" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {profile?.rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-xs text-slate-400">({formatNumber(profile?.reviewCount || 0)})</span>
          </div>
        </div>
        <button onClick={onRefresh} disabled={isSyncing} className="w-9 h-9 flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 disabled:opacity-50 text-white rounded-full shadow-md flex-shrink-0">
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {/* Row 2: Address */}
      {profile?.address && (
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{profile.address}</span>
        </p>
      )}
      {/* Row 3: Date filter */}
      <div className="flex items-center justify-between mt-3">
        <DateFilter value={historyDays} onChange={onDaysChange} />
        {lastSync && <span className="text-slate-400 text-[10px]">{formatTimeAgo(lastSync)}</span>}
      </div>
    </div>

    {/* ===== DESKTOP LAYOUT ===== */}
    <div className="hidden sm:flex sm:items-start sm:gap-6">
      {/* Left: Icon */}
      <div className="flex-shrink-0">
        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Building2 className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
        </div>
      </div>

      {/* Center: Business Info */}
      <div className="flex-1 min-w-0">
        {/* Business name row */}
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{profile?.name || 'Google Business'}</h2>
          {profile?.websiteUri && (
            <a href={profile.websiteUri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Rating row */}
        <div className="flex items-center gap-3 mb-3">
          <StarRating rating={profile?.rating || 0} size="md" />
          <span className="text-lg font-bold text-slate-900 dark:text-white">{profile?.rating?.toFixed(1) || '0.0'}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">({formatNumber(profile?.reviewCount || 0)} avaliações)</span>
        </div>

        {/* Address */}
        {profile?.address && (
          <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {profile.address}
          </p>
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
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium text-[11px] sm:text-xs">
              Buscas: {formatNumber(summary.totalSearches)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium text-[11px] sm:text-xs">
              Visualizações: {formatNumber(summary.totalViews)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-medium text-[11px] sm:text-xs">
              Ações: {formatNumber(summary.totalActions)}
            </span>
          </div>
        ) : (
          <span className="text-slate-400">Sem dados</span>
        )}
        {/* Desktop: Sync button and last sync time */}
        <div className="hidden sm:flex items-center gap-2 ml-auto">
          {lastSync && (
            <span className="text-slate-400 text-[10px]">Sync: {formatTimeAgo(lastSync)}</span>
          )}
          <button onClick={onRefresh} disabled={isSyncing} className="px-3 py-1 flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white text-[11px] font-semibold rounded-full shadow-sm transition-all">
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ==================== KPI CARDS ====================

const KPICard = ({ label, value, trend, icon: Icon, gradient }) => (
  <div className={`rounded-xl p-3 bg-gradient-to-br ${gradient}`}>
    <div className="flex items-start justify-between mb-1">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/20">
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      {trend !== undefined && trend !== 0 && (
        <TrendBadge value={trend} compact />
      )}
    </div>
    <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5 text-white/70">
      {label}
    </p>
    <p className="text-lg font-bold leading-none text-white">
      {value}
    </p>
  </div>
);

const KPIGrid = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Buscas Diretas',
      value: formatNumber(metrics?.queriesDirect || 0),
      icon: Search,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Descobertas',
      value: formatNumber(metrics?.queriesIndirect || 0),
      icon: Search,
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      label: 'Views Maps',
      value: formatNumber(metrics?.viewsMaps || 0),
      icon: MapPin,
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      label: 'Views Search',
      value: formatNumber(metrics?.viewsSearch || 0),
      icon: Eye,
      gradient: 'from-teal-500 to-cyan-600'
    },
    {
      label: 'Site Clicks',
      value: formatNumber(metrics?.actionsWebsite || 0),
      icon: Globe,
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      label: 'Ligações',
      value: formatNumber(metrics?.actionsPhone || 0),
      icon: Phone,
      gradient: 'from-rose-500 to-pink-600'
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {kpis.map((kpi, i) => (
        <KPICard key={i} {...kpi} />
      ))}
    </div>
  );
};

// ==================== CHARTS ====================

const ChartCard = ({ title, subtitle, icon: Icon, iconColor = 'text-slate-400', iconBg = 'bg-slate-100 dark:bg-slate-700/50', children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
      {Icon && (
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
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
        searches: (d.queries_direct || 0) + (d.queries_indirect || 0) + (d.queries_chain || 0),
        views: (d.views_maps || 0) + (d.views_search || 0),
        actions: (d.actions_website || 0) + (d.actions_phone || 0) + (d.actions_driving_directions || 0)
      }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-52 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="h-52 flex flex-col items-center justify-center text-slate-400">
        <Database className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Sem dados históricos</p>
        <p className="text-[10px] mt-1">Clique em Atualizar para sincronizar</p>
      </div>
    );
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="searchFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={40} tickFormatter={formatNumber} />
          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={35} tickFormatter={formatNumber} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '11px' }}
            formatter={(value, name) => [formatNumber(value), name === 'searches' ? 'Buscas' : name === 'views' ? 'Visualizações' : 'Ações']}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Area yAxisId="left" type="monotone" dataKey="searches" stroke="#3b82f6" strokeWidth={2} fill="url(#searchFill)" />
          <Bar yAxisId="left" dataKey="views" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={16} />
          <Line yAxisId="right" type="monotone" dataKey="actions" stroke="#f97316" strokeWidth={2} dot={{ r: 2, fill: '#f97316' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const SearchTypesChart = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return [...data]
      .sort((a, b) => new Date(a.bucket_date) - new Date(b.bucket_date))
      .map(d => ({
        date: formatDateShort(d.bucket_date),
        direct: d.queries_direct || 0,
        discovery: d.queries_indirect || 0,
        branded: d.queries_chain || 0
      }));
  }, [data]);

  if (isLoading) return <div className="h-36 flex items-center justify-center"><Loader2 className="w-5 h-5 text-blue-400 animate-spin" /></div>;
  if (!chartData.length) return <div className="h-36 flex items-center justify-center text-slate-400 text-xs">Sem dados</div>;

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-[10px] mb-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Diretas</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Descobertas</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Marca</span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={30} />
            <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px' }} />
            <Bar dataKey="direct" stackId="a" fill="#3b82f6" name="Diretas" />
            <Bar dataKey="discovery" stackId="a" fill="#22c55e" name="Descobertas" />
            <Bar dataKey="branded" stackId="a" fill="#a855f7" name="Marca" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ActionsChart = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return [...data]
      .sort((a, b) => new Date(a.bucket_date) - new Date(b.bucket_date))
      .map(d => ({
        date: formatDateShort(d.bucket_date),
        website: d.actions_website || 0,
        phone: d.actions_phone || 0,
        directions: d.actions_driving_directions || 0
      }));
  }, [data]);

  if (isLoading) return <div className="h-36 flex items-center justify-center"><Loader2 className="w-5 h-5 text-orange-400 animate-spin" /></div>;
  if (!chartData.length) return <div className="h-36 flex items-center justify-center text-slate-400 text-xs">Sem dados</div>;

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-[10px] mb-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Site</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Ligações</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" /> Direções</span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={30} />
            <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px' }} />
            <Bar dataKey="website" stackId="a" fill="#f97316" name="Site" />
            <Bar dataKey="phone" stackId="a" fill="#f43f5e" name="Ligações" />
            <Bar dataKey="directions" stackId="a" fill="#06b6d4" name="Direções" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==================== REVIEWS SECTION ====================

const REVIEWS_PER_PAGE = 5;

const ReviewCard = ({ review, onReply }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(review.review_id, replyText);
      setShowReplyForm(false);
      setReplyText('');
    } catch (err) {
      console.error('Reply error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
      {/* Header: Avatar, Name, Rating, Date */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {review.reviewer_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {review.reviewer_name || 'Anônimo'}
            </span>
            <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(review.create_time)}</span>
          </div>
          <StarRating rating={review.star_rating} size="sm" />
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
          {review.comment}
        </p>
      )}

      {/* Existing Reply */}
      {review.reply_comment && (
        <div className="mt-3 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Reply className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Sua resposta</span>
            {review.reply_update_time && (
              <span className="text-xs text-slate-400">{formatDate(review.reply_update_time)}</span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{review.reply_comment}</p>
        </div>
      )}

      {/* Reply Form */}
      {!review.reply_comment && (
        <div className="mt-3">
          {showReplyForm ? (
            <div className="space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escreva sua resposta..."
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setShowReplyForm(false); setReplyText(''); }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitReply}
                  disabled={isSubmitting || !replyText.trim()}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  {isSubmitting ? 'Enviando...' : 'Responder'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReplyForm(true)}
              className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Responder
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const ReviewsSection = ({ reviews, isLoading, onReply, onLoadMore, hasMore }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = reviews.slice(page * REVIEWS_PER_PAGE, (page + 1) * REVIEWS_PER_PAGE);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (r.star_rating >= 1 && r.star_rating <= 5) {
        dist[r.star_rating]++;
      }
    });
    return dist;
  }, [reviews]);

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.star_rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header with rating summary */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Avaliações</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{avgRating}</span>
                <div>
                  <StarRating rating={parseFloat(avgRating)} size="sm" />
                  <span className="text-xs text-slate-400">{totalReviews} avaliações</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rating bars */}
          <div className="hidden sm:flex flex-col gap-0.5 w-40">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = ratingDistribution[rating];
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 text-slate-400">{rating}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-4 text-slate-400 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[50px] text-center font-medium">
                {page + 1}/{totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews list */}
      <div>
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : !reviews.length ? (
          <div className="p-8 text-center text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma avaliação encontrada</p>
          </div>
        ) : (
          paginatedReviews.map((review) => (
            <ReviewCard key={review.id || review.review_id} review={review} onReply={onReply} />
          ))
        )}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const GoogleBusinessAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [historyDays, setHistoryDays] = useState(30);
  const [historyData, setHistoryData] = useState([]);
  const [lastSync, setLastSync] = useState(null);

  // Calculate summary from history
  const summary = useMemo(() => {
    if (!historyData.length) return null;

    const totalSearches = historyData.reduce((sum, d) =>
      sum + (d.queries_direct || 0) + (d.queries_indirect || 0) + (d.queries_chain || 0), 0);
    const totalViews = historyData.reduce((sum, d) =>
      sum + (d.views_maps || 0) + (d.views_search || 0), 0);
    const totalActions = historyData.reduce((sum, d) =>
      sum + (d.actions_website || 0) + (d.actions_phone || 0) + (d.actions_driving_directions || 0), 0);

    return { totalSearches, totalViews, totalActions, daysTracked: historyData.length };
  }, [historyData]);

  // Latest metrics for KPIs
  const latestMetrics = useMemo(() => {
    if (!historyData.length) return null;
    const latest = [...historyData].sort((a, b) => new Date(b.bucket_date) - new Date(a.bucket_date))[0];
    return {
      queriesDirect: latest.queries_direct || 0,
      queriesIndirect: latest.queries_indirect || 0,
      viewsMaps: latest.views_maps || 0,
      viewsSearch: latest.views_search || 0,
      actionsWebsite: latest.actions_website || 0,
      actionsPhone: latest.actions_phone || 0,
    };
  }, [historyData]);

  const checkAuth = useCallback(async () => {
    try {
      const result = await api.googleBusiness.getOAuthStatus();
      setIsAuthenticated(result.authenticated);
      return result.authenticated;
    } catch (err) {
      console.error('Auth check error:', err);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dashboardData = await api.googleBusiness.getDashboard();
      setProfile(dashboardData.profile);
      setReviews(dashboardData.reviews || []);
    } catch (err) {
      console.error('GBP fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (days) => {
    setIsLoadingHistory(true);
    try {
      const daysToFetch = days === 'all' ? null : days;
      const [historyResult, statusResult] = await Promise.all([
        api.googleBusiness.getHistory(daysToFetch),
        api.googleBusiness.getStatus()
      ]);

      setHistoryData(historyResult.history || []);
      setLastSync(statusResult.lastSync);
    } catch (err) {
      console.error('GBP history error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const authed = await checkAuth();
      if (authed) {
        await Promise.all([fetchData(), fetchHistory(historyDays)]);
      }
      setIsLoading(false);
    };
    init();
  }, [checkAuth, fetchData, fetchHistory, historyDays]);

  const handleDaysChange = (days) => {
    setHistoryDays(days);
    fetchHistory(days);
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    try {
      await api.googleBusiness.triggerSync();
      await Promise.all([fetchData(), fetchHistory(historyDays)]);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReplyToReview = async (reviewId, comment) => {
    const result = await api.googleBusiness.replyToReview(reviewId, comment);
    if (result.success) {
      // Refresh reviews to show the new reply
      await fetchData();
    }
    return result;
  };

  // Show OAuth setup if not authenticated
  if (isAuthenticated === false) {
    return <OAuthSetup />;
  }

  // Loading state
  if (isAuthenticated === null || (isLoading && !profile)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando Google Business...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Erro ao carregar</h3>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button onClick={handleRefresh} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full text-xs font-semibold">
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
        onDaysChange={handleDaysChange}
        onRefresh={handleRefresh}
        isSyncing={isSyncing}
        isLoadingHistory={isLoadingHistory}
        lastSync={lastSync}
      />

      {/* KPI Grid */}
      <KPIGrid metrics={latestMetrics} isLoading={isLoadingHistory} />

      {/* Main Performance Chart */}
      <ChartCard
        title="Desempenho Geral"
        subtitle={`Buscas, visualizações e ações • ${historyDays === 'all' ? 'Todo período' : `${historyDays} dias`}`}
        icon={TrendingUp}
        iconColor="text-blue-500"
        iconBg="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-500/30 dark:to-indigo-500/30"
      >
        <MainChart data={historyData} isLoading={isLoadingHistory} />
      </ChartCard>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCard
          title="Tipos de Busca"
          subtitle="Como clientes encontram você"
          icon={Search}
          iconColor="text-blue-500"
          iconBg="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-500/30 dark:to-indigo-500/30"
        >
          <SearchTypesChart data={historyData} isLoading={isLoadingHistory} />
        </ChartCard>
        <ChartCard
          title="Ações dos Clientes"
          subtitle="O que fazem após ver seu perfil"
          icon={MousePointer}
          iconColor="text-orange-500"
          iconBg="bg-gradient-to-br from-orange-500/20 to-amber-500/20 dark:from-orange-500/30 dark:to-amber-500/30"
        >
          <ActionsChart data={historyData} isLoading={isLoadingHistory} />
        </ChartCard>
      </div>

      {/* Reviews Section */}
      <ReviewsSection
        reviews={reviews}
        isLoading={isLoading}
        onReply={handleReplyToReview}
      />
    </div>
  );
};

export default GoogleBusinessAnalytics;
