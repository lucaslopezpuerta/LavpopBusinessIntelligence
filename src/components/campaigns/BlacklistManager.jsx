// BlacklistManager.jsx v2.0
// WhatsApp blacklist management UI component
// Design System v3.1 compliant
//
// CHANGELOG:
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
  Clock,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from 'lucide-react';
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

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100];

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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

  // Filter blacklist by search
  const filteredBlacklist = useMemo(() => {
    if (!searchQuery.trim()) return blacklist;

    const query = searchQuery.toLowerCase();
    return blacklist.filter(entry =>
      entry.phone.includes(query) ||
      (entry.name || '').toLowerCase().includes(query) ||
      (entry.reason || '').toLowerCase().includes(query)
    );
  }, [blacklist, searchQuery]);

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  // Format last sync time
  const formatLastSync = () => {
    const lastSync = getLastSyncTime();
    if (!lastSync) return 'Nunca sincronizado';

    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays} dias atrás`;
  };

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

        {/* Stats Cards */}
        {!isLoading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldOff className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquareOff className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Opt-outs</span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.byReason?.optOut || 0}</p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Não entregues</span>
                </div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {(stats.byReason?.undelivered || 0) + (stats.byReason?.numberBlocked || 0)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <UserX className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Manual</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.byReason?.manual || 0}</p>
              </div>
            </div>

        {/* Sync Status & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Última sincronização
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatLastSync()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Twilio'}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>

            <button
              onClick={handleExport}
              disabled={blacklist.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>

            <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
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

        {/* Info Box */}
        <InsightBox
          type="info"
          title="Como funciona a blacklist?"
          message="A sincronização com Twilio detecta automaticamente: 1) Mensagens com 'parar', 'quero' (opt-out), 2) Mensagens não entregues ou bloqueadas (erro 63024). Números nesta lista não receberão campanhas."
        />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por telefone, nome ou motivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Blacklist Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Telefone
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Nome
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Motivo
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Data
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedBlacklist.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    {searchQuery ? 'Nenhum resultado encontrado' : 'Blacklist vazia'}
                  </td>
                </tr>
              ) : (
                paginatedBlacklist.map((entry, index) => {
                  const badge = getReasonBadge(entry.reason);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr
                      key={entry.phone}
                      className={`
                        border-b border-slate-100 dark:border-slate-800
                        ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}
                      `}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-mono text-slate-900 dark:text-white">
                            {entry.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {entry.name || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {entry.addedAt ? new Date(entry.addedAt).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemove(entry.phone)}
                          className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
                className="px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            ? 'bg-purple-600 text-white'
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

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Adicionar à Blacklist
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    placeholder="+5554999999999"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Motivo
                  </label>
                  <select
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="opt-out">Opt-out (pediu para parar)</option>
                    <option value="undelivered">Não entregue</option>
                    <option value="number-blocked">Número bloqueado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newPhone.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors"
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
