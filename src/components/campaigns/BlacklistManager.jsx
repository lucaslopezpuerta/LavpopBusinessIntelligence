// BlacklistManager.jsx v3.7
// WhatsApp blacklist management UI component
// Design System v4.0 compliant
//
// CHANGELOG:
// v3.7 (2025-12-19): Mobile layout reorganization
//   - Filter: moved under search bar on mobile
//   - Sync time: now next to sync button (was separate row)
//   - Removed duplicate mobile action buttons section
//   - Cleaner mobile layout with better visual hierarchy
// v3.6 (2025-12-19): Mobile filter layout fix
//   - Filter: 5-column grid on mobile (no scrolling)
//   - Short labels on mobile (N/Entreg, Bloq.)
//   - Filter pills: own row on mobile (was cramped with sync button)
//   - Sync button: shows label on mobile (was icon-only)
//   - Pagination: 5/10/25 options (was 25/50/100)
// v3.5 (2025-12-19): Table refinement and branding consistency
//   - Table headers: bg-slate-50, uppercase tracking-wide, icon hints
//   - All columns: center-aligned text (headers + cells)
//   - Column hover: red-600 on sortable headers
//   - Row hover: red-50/50 tint for brand consistency
//   - Badges: consistent text-xs size (Design System min 12px)
//   - Delete button: rounded-lg with hover background
//   - Empty cells: em-dash (—) instead of hyphen
//   - Mobile text: text-xs (was text-[11px])
// v3.4 (2025-12-19): Pagination branding consistency
//   - Page number active state: red-600 (matches blacklist red theme)
//   - Select focus ring: red-500 (matches blacklist red theme)
// v3.3 (2025-12-19): Sorting, filtering, and sync time consistency
//   - Single sync time display (like Instagram/WhatsApp)
//   - Added table sorting (phone, name, reason, date)
//   - Added filter by reason (all, opt-out, undelivered, manual)
//   - Improved table design and mobile compatibility
//   - Mobile: card-based layout instead of table rows
// v3.2 (2025-12-19): Scheduled sync support
//   - Displays next scheduled sync time (every 4 hours)
//   - Fetches blacklist_last_sync from app_settings
// v3.1 (2025-12-15): Design System compliance fixes
//   - Modal redesigned with gradient header (per Design System modals)
//   - Table header styled with bg-slate-50 background
//   - Added search clear button (X)
//   - Improved mobile button layout (stack vertically)
//   - Added tooltips to stats cards
//   - Improved info hint contrast
//   - Added row hover state to table
// v3.0 (2025-12-11): Complete UX redesign
//   - Stats dashboard header with gradient backgrounds
//   - Simplified to 2 main stat cards (Total, Opt-outs)
//   - Discrete info hint instead of large banner
//   - Mobile-first responsive layout
//   - Improved visual hierarchy
// v2.0 (2025-12-08): Supabase backend integration
//   - Uses async functions to fetch from backend
//   - Falls back to localStorage if backend unavailable
//   - Loading states for initial data fetch
// v1.1 (2025-12-08): Added pagination
//   - Configurable items per page (25, 50, 100)
//   - Page navigation controls
//   - Page info display
// v1.0 (2025-12-08): Initial implementation
//   - Displays blacklist with reason badges
//   - Manual add/remove functionality
//   - Twilio sync button with progress
//   - CSV import/export

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ShieldOff,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Phone,
  AlertTriangle,
  MessageSquareOff,
  UserX,
  XCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import SectionCard from '../ui/SectionCard';
import InsightBox from '../ui/InsightBox';
import {
  getBlacklistArray,
  getBlacklistStats,
  getBlacklistAsync,
  getBlacklistStatsAsync,
  addToBlacklistAsync,
  removeFromBlacklistAsync,
  syncWithTwilio,
  exportBlacklistCSV,
  importBlacklistAsync,
  buildCustomerNameMap,
  getLastSyncTime
} from '../../utils/blacklistService';
import { api } from '../../utils/apiService';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25];

// Reason filter options (with short labels for mobile)
const REASON_FILTERS = [
  { id: 'all', label: 'Todos', short: 'Todos' },
  { id: 'opt-out', label: 'Opt-out', short: 'Opt-out' },
  { id: 'undelivered', label: 'Não entregue', short: 'N/Entreg' },
  { id: 'number-blocked', label: 'Bloqueado', short: 'Bloq.' },
  { id: 'manual', label: 'Manual', short: 'Manual' }
];

// ==================== REASON FILTER COMPONENT ====================

const ReasonFilter = ({ value, onChange }) => (
  <>
    {/* Mobile: Grid layout */}
    <div className="sm:hidden grid grid-cols-5 gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
      {REASON_FILTERS.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`px-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all text-center ${
            value === option.id
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {option.short}
        </button>
      ))}
    </div>
    {/* Desktop: Pill layout */}
    <div className="hidden sm:inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 gap-0.5">
      {REASON_FILTERS.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            value === option.id
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </>
);

// ==================== DISTRIBUTION BAR CHART ====================

const CHART_COLORS = {
  'opt-out': '#ef4444',      // red-500
  'number-blocked': '#f97316', // orange-500
  'undelivered': '#f59e0b',  // amber-500
  'manual': '#64748b',       // slate-500
  'other': '#94a3b8'         // slate-400
};

const CHART_LABELS = {
  'opt-out': 'Opt-out',
  'number-blocked': 'Bloqueado',
  'undelivered': 'Não entregue',
  'manual': 'Manual',
  'other': 'Outro'
};

const DistributionChart = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-[120px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const data = [
    { key: 'opt-out', value: stats.byReason?.optOut || 0 },
    { key: 'number-blocked', value: stats.byReason?.numberBlocked || 0 },
    { key: 'undelivered', value: stats.byReason?.undelivered || 0 },
    { key: 'manual', value: stats.byReason?.manual || 0 }
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center text-slate-400 text-sm">
        Sem dados para exibir
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-medium text-slate-900 dark:text-white">
          {CHART_LABELS[item.key] || item.key}
        </p>
        <p className="text-slate-500 dark:text-slate-400">
          {item.value} {item.value === 1 ? 'entrada' : 'entradas'}
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="key"
          tickFormatter={(key) => CHART_LABELS[key] || key}
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={CHART_COLORS[entry.key] || CHART_COLORS.other} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const BlacklistManager = ({ customerData }) => {
  const [blacklist, setBlacklist] = useState([]);
  const [stats, setStats] = useState({ total: 0, byReason: {}, bySource: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newReason, setNewReason] = useState('manual');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [scheduledSyncTime, setScheduledSyncTime] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting state
  const [sortColumn, setSortColumn] = useState('reason'); // 'phone', 'name', 'reason', 'date'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Reason filter state
  const [reasonFilter, setReasonFilter] = useState('all');

  // Refresh blacklist data (async)
  const refreshData = useCallback(async () => {
    try {
      const [entries, statsData] = await Promise.all([
        getBlacklistAsync(),
        getBlacklistStatsAsync()
      ]);
      setBlacklist(entries);
      setStats(statsData);
      setCurrentPage(1); // Reset to first page on refresh

      // Fetch scheduled sync time from app_settings
      try {
        const settings = await api.settings.get();
        setScheduledSyncTime(settings?.blacklist_last_sync || null);
      } catch (settingsErr) {
        console.warn('Could not fetch scheduled sync time:', settingsErr);
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error);
      // Fallback to localStorage
      setBlacklist(getBlacklistArray());
      setStats(getBlacklistStats());
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await refreshData();
      setIsLoading(false);
    };
    loadData();
  }, [refreshData]);

  // Filter and sort blacklist
  const filteredBlacklist = useMemo(() => {
    let result = [...blacklist];

    // Apply reason filter
    if (reasonFilter !== 'all') {
      result = result.filter(entry => entry.reason === reasonFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(entry =>
        entry.phone.includes(query) ||
        (entry.name || '').toLowerCase().includes(query) ||
        (entry.reason || '').toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const reasonOrder = { 'opt-out': 0, 'number-blocked': 1, 'undelivered': 2, 'manual': 3 };
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'phone':
          comparison = a.phone.localeCompare(b.phone);
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'reason':
          comparison = (reasonOrder[a.reason] ?? 99) - (reasonOrder[b.reason] ?? 99);
          break;
        case 'date':
          comparison = new Date(a.addedAt || 0) - new Date(b.addedAt || 0);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [blacklist, searchQuery, reasonFilter, sortColumn, sortDirection]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, reasonFilter]);

  // Toggle sort column
  const handleSort = useCallback((column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  // Get sort icon for column header
  const getSortIcon = (column) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3" />
      : <ArrowDown className="w-3 h-3" />;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredBlacklist.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredBlacklist.length);
  const paginatedBlacklist = filteredBlacklist.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((newValue) => {
    setItemsPerPage(newValue);
    setCurrentPage(1);
  }, []);

  // Handle Twilio sync
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      // Build customer name map for enrichment
      const nameMap = buildCustomerNameMap(customerData || []);

      const result = await syncWithTwilio({
        customerMap: nameMap
      });

      setSyncResult(result);
      await refreshData();
    } catch (error) {
      setSyncResult({
        success: false,
        errors: [error.message]
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle add to blacklist
  const handleAdd = async () => {
    if (!newPhone.trim()) return;

    const success = await addToBlacklistAsync(newPhone, {
      name: newName.trim(),
      reason: newReason,
      source: 'manual'
    });

    if (success) {
      setNewPhone('');
      setNewName('');
      setNewReason('manual');
      setShowAddModal(false);
      await refreshData();
    }
  };

  // Handle remove from blacklist
  const handleRemove = async (phone) => {
    if (window.confirm(`Remover ${phone} da blacklist?`)) {
      await removeFromBlacklistAsync(phone);
      await refreshData();
    }
  };

  // Handle CSV export
  const handleExport = () => {
    const csv = exportBlacklistCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blacklist_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle CSV import
  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Parse CSV to entries array
        const lines = e.target.result.split('\n').filter(l => l.trim());
        const entries = [];

        // Skip header row if present
        const startIndex = lines[0]?.toLowerCase().includes('phone') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length >= 2) {
            entries.push({
              name: parts[0]?.replace(/"/g, '').trim() || '',
              phone: parts[1]?.replace(/"/g, '').trim() || '',
              reason: parts[2]?.replace(/"/g, '').trim() || 'csv-import'
            });
          }
        }

        const result = await importBlacklistAsync(entries, true);
        alert(`Importado: ${result.imported || entries.length} entradas`);
        await refreshData();
      } catch (error) {
        alert('Erro ao importar: ' + error.message);
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      alert('Erro ao ler arquivo');
      setIsImporting(false);
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };

  // Format time relative to now (like Instagram/WhatsApp pattern)
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

  // Get effective last sync time (prefer scheduled over manual)
  const lastSync = scheduledSyncTime || getLastSyncTime();

  // Get reason badge style
  const getReasonBadge = (reason) => {
    switch (reason) {
      case 'opt-out':
        return {
          label: 'Opt-out',
          className: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
          icon: MessageSquareOff
        };
      case 'undelivered':
        return {
          label: 'Não entregue',
          className: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
          icon: AlertTriangle
        };
      case 'number-blocked':
        return {
          label: 'Bloqueado',
          className: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
          icon: XCircle
        };
      case 'manual':
      default:
        return {
          label: 'Manual',
          className: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
          icon: UserX
        };
    }
  };

  return (
    <SectionCard
      title="Blacklist WhatsApp"
      subtitle="Gerenciar números bloqueados para campanhas"
      icon={ShieldOff}
      color="red"
      id="blacklist-manager"
    >
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="ml-3 text-slate-500 dark:text-slate-400">Carregando blacklist...</span>
          </div>
        )}

        {/* Stats Dashboard Header */}
        {!isLoading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Stats Cards - 2 columns on mobile, first column on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:col-span-1">
                {/* Total Bloqueados */}
                <div
                  className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg"
                  title="Total de números que não receberão mensagens de campanhas"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldOff className="w-4 h-4 opacity-80" />
                    <span className="text-xs font-medium opacity-90">Bloqueados</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                  <p className="text-[10px] sm:text-xs opacity-75">na blacklist</p>
                </div>

                {/* Opt-outs */}
                <div
                  className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg"
                  title="Clientes que pediram para não receber mais mensagens"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquareOff className="w-4 h-4 opacity-80" />
                    <span className="text-xs font-medium opacity-90">Opt-outs</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.byReason?.optOut || 0}</p>
                  <p className="text-[10px] sm:text-xs opacity-75">pediram para parar</p>
                </div>
              </div>

              {/* Distribution Chart - full width on mobile, 2 columns on desktop */}
              <div className="sm:col-span-2 p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Distribuição por Motivo
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {stats.total} total
                  </span>
                </div>
                <DistributionChart stats={stats} isLoading={isLoading} />
              </div>
            </div>

            {/* Info Hint - Improved contrast */}
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-3 h-3 text-blue-500" />
              Sincroniza opt-outs e não entregues do Twilio automaticamente
              {(stats.byReason?.undelivered || 0) + (stats.byReason?.numberBlocked || 0) > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  · {(stats.byReason?.undelivered || 0) + (stats.byReason?.numberBlocked || 0)} não entregues
                </span>
              )}
            </p>

        {/* Action Bar - Mobile: stacked, Desktop: inline */}
        <div className="flex flex-col gap-3">
          {/* Mobile: Sync + Action buttons row */}
          <div className="sm:hidden flex items-center gap-2">
            {/* Sync button with time */}
            <div className="flex items-center gap-2">
              {lastSync && <span className="text-slate-400 text-xs">{formatTimeAgo(lastSync)}</span>}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-9 h-9 flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-500 disabled:opacity-50 text-white rounded-full shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Add button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 text-white text-sm font-semibold rounded-full shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              disabled={blacklist.length === 0}
              className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-full disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Import */}
            <label className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-full cursor-pointer">
              <Upload className="w-4 h-4" />
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={isImporting} />
            </label>
          </div>

          {/* Desktop: All controls in one row */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <ReasonFilter value={reasonFilter} onChange={setReasonFilter} />

            <div className="flex items-center gap-2">
              {lastSync && (
                <span className="text-slate-400 text-[10px]">Sync: {formatTimeAgo(lastSync)}</span>
              )}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-3 py-1.5 flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:opacity-50 text-white text-xs font-semibold rounded-full shadow-sm transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Atualizar'}
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 flex items-center gap-1.5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 dark:from-slate-600 dark:to-slate-700 dark:hover:from-slate-500 dark:hover:to-slate-600 text-white text-xs font-semibold rounded-full shadow-sm transition-all"
              >
                <Plus className="w-3 h-3" />
                Adicionar
              </button>

              <button
                onClick={handleExport}
                disabled={blacklist.length === 0}
                className="px-3 py-1.5 flex items-center gap-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
                Exportar
              </button>

              <label className="px-3 py-1.5 flex items-center gap-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                <Upload className="w-3 h-3" />
                {isImporting ? 'Importando...' : 'Importar'}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </div>
          </div>

        </div>

        {/* Sync Result */}
        {syncResult && (
          <InsightBox
            type={syncResult.success ? 'success' : 'error'}
            title={syncResult.success ? 'Sincronização concluída' : 'Erro na sincronização'}
            message={
              syncResult.success
                ? `Processadas ${syncResult.totalProcessed || 0} mensagens. Novos: ${syncResult.newOptOuts || 0} opt-outs, ${syncResult.newUndelivered || 0} não entregues.`
                : syncResult.errors?.join(', ') || 'Erro desconhecido'
            }
          />
        )}


        {/* Search with clear button */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por telefone, nome ou motivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile: Filter under search bar */}
        <div className="sm:hidden">
          <ReasonFilter value={reasonFilter} onChange={setReasonFilter} />
        </div>

        {/* Blacklist Table */}
        <div className="-mx-2 sm:mx-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th
                  onClick={() => handleSort('phone')}
                  className="text-center py-2.5 px-3 sm:px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors w-[130px] sm:w-[180px]"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="sm:hidden">Tel.</span>
                    <span className="hidden sm:inline">Telefone</span>
                    {getSortIcon('phone')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="hidden sm:table-cell text-center py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Nome
                    {getSortIcon('name')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('reason')}
                  className="text-center py-2.5 px-3 sm:px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors w-[100px] sm:w-[140px]"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Motivo
                    {getSortIcon('reason')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="hidden sm:table-cell text-center py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors w-[110px]"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Data
                    {getSortIcon('date')}
                  </div>
                </th>
                <th className="text-center py-2.5 px-2 sm:px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide w-[50px]">
                  <span className="sr-only">Ação</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedBlacklist.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    {searchQuery || reasonFilter !== 'all' ? 'Nenhum resultado encontrado' : 'Blacklist vazia'}
                  </td>
                </tr>
              ) : (
                paginatedBlacklist.map((entry) => {
                  const badge = getReasonBadge(entry.reason);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr
                      key={entry.phone}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <div className="flex flex-col gap-0.5 items-center">
                          <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">
                            {entry.phone}
                          </span>
                          {/* Mobile: show name under phone */}
                          {entry.name && (
                            <span className="sm:hidden text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                              {entry.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell py-3 px-4 text-center">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {entry.name || <span className="text-slate-400">—</span>}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className={`inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">{badge.label}</span>
                        </span>
                      </td>
                      <td className="hidden sm:table-cell py-3 px-4 text-center">
                        <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                          {entry.addedAt ? new Date(entry.addedAt).toLocaleDateString('pt-BR') : <span className="text-slate-400">—</span>}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-center">
                        <button
                          onClick={() => handleRemove(entry.phone)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                          title="Remover da blacklist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredBlacklist.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Mostrar</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400">por página</span>
            </div>

            {/* Page info */}
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando {startIndex + 1}-{endIndex} de {filteredBlacklist.length} entradas
              {filteredBlacklist.length !== blacklist.length && (
                <span className="text-slate-400 dark:text-slate-500"> (filtrado de {blacklist.length})</span>
              )}
            </div>

            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Primeira página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`
                          w-8 h-8 rounded-lg text-sm font-medium transition-colors
                          ${currentPage === pageNum
                            ? 'bg-red-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }
                        `}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Próxima página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Modal - Design System compliant with gradient header */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
              {/* Gradient Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600">
                <div className="flex items-center gap-3">
                  <ShieldOff className="w-5 h-5 text-white/80" />
                  <h3 className="text-lg font-bold text-white">
                    Adicionar à Blacklist
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    placeholder="+5554999999999"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Motivo
                  </label>
                  <select
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="opt-out">Opt-out (pediu para parar)</option>
                    <option value="undelivered">Não entregue</option>
                    <option value="number-blocked">Número bloqueado</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newPhone.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-red-400 disabled:to-rose-400 text-white text-sm font-semibold rounded-lg shadow-lg shadow-red-500/25 transition-all"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </SectionCard>
  );
};

export default BlacklistManager;
