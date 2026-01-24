// UploadHistoryTab.jsx v2.1 - MOBILE-OPTIMIZED DESIGN
// Display upload history from Supabase upload_history table
//
// Features:
//   - Shows recent uploads (last 50 records)
//   - Visual status indicators with gradient backgrounds
//   - Enhanced card design with left accent stripe
//   - Stat grid with semantic colors
//   - Clear history button
//   - Auto-refresh after parent upload
//   - Cosmic Precision Design System v5.1 compliant
//
// CHANGELOG:
// v2.1 (2026-01-24): Mobile-optimized design
//   - Larger touch targets (min 44px) for all buttons
//   - Better typography scaling on small screens
//   - Compact stat numbers on mobile
//   - Improved card padding and spacing
//   - Responsive icon badge sizes
// v2.0 (2026-01-24): Cosmic Precision Design update
//   - Added useTheme hook for proper dark mode styling
//   - Enhanced card design with left accent stripes
//   - Replaced lavpop-blue with stellar-cyan
//   - Improved visual hierarchy and spacing
//   - Better empty state design
//   - Stat pills with gradient backgrounds
// v1.1 (2025-12-26): Mobile-friendly layout
//   - History cards show full stats on mobile (no hidden columns)
//   - Compact stat grid that adapts to screen size
//   - Improved touch targets for buttons
// v1.0: Initial implementation
//
// Requires: upload_history table in Supabase (see docs/upload_history.sql)

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  RefreshCw,
  ShoppingCart,
  Users,
  CloudUpload,
  History
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getSupabaseClient } from '../utils/supabaseClient';

const UploadHistoryTab = ({ refreshTrigger }) => {
  const { isDark } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(false);

  // Fetch upload history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const client = await getSupabaseClient();
      if (!client) {
        setError('Supabase nao configurado');
        return;
      }

      const { data, error: fetchError } = await client
        .from('upload_history')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        // Table might not exist yet
        if (fetchError.code === '42P01') {
          setError('Tabela upload_history nao existe. Execute o SQL de migracao.');
          return;
        }
        throw fetchError;
      }

      setHistory(data || []);
    } catch (err) {
      console.error('[UploadHistory] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Refresh when parent triggers
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchHistory();
    }
  }, [refreshTrigger, fetchHistory]);

  // Clear all history
  const handleClearHistory = async () => {
    if (!window.confirm('Limpar todo o historico de uploads?')) return;

    try {
      setClearing(true);
      const client = await getSupabaseClient();
      if (!client) return;

      await client.from('upload_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setHistory([]);
    } catch (err) {
      console.error('[UploadHistory] Clear error:', err);
      setError(err.message);
    } finally {
      setClearing(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Get status icon and color (theme-aware)
  const getStatusInfo = (status) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle2,
          color: isDark ? 'text-emerald-400' : 'text-emerald-600',
          bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-100',
          accent: isDark ? 'bg-emerald-500/40' : 'bg-emerald-500'
        };
      case 'partial':
        return {
          icon: AlertTriangle,
          color: isDark ? 'text-amber-400' : 'text-amber-600',
          bg: isDark ? 'bg-amber-500/15' : 'bg-amber-100',
          accent: isDark ? 'bg-amber-500/40' : 'bg-amber-500'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: isDark ? 'text-red-400' : 'text-red-600',
          bg: isDark ? 'bg-red-500/15' : 'bg-red-100',
          accent: isDark ? 'bg-red-500/40' : 'bg-red-500'
        };
      default:
        return {
          icon: Clock,
          color: isDark ? 'text-slate-400' : 'text-slate-500',
          bg: isDark ? 'bg-slate-700/50' : 'bg-slate-100',
          accent: isDark ? 'bg-slate-500/40' : 'bg-slate-400'
        };
    }
  };

  // Get file type icon (theme-aware)
  const getTypeIcon = (type) => {
    switch (type) {
      case 'sales':
        return {
          icon: ShoppingCart,
          color: isDark ? 'text-blue-400' : 'text-blue-600',
          bg: isDark ? 'bg-blue-500/15' : 'bg-blue-100'
        };
      case 'customers':
        return {
          icon: Users,
          color: isDark ? 'text-emerald-400' : 'text-emerald-600',
          bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'
        };
      default:
        return {
          icon: CloudUpload,
          color: isDark ? 'text-slate-400' : 'text-slate-500',
          bg: isDark ? 'bg-slate-700/50' : 'bg-slate-100'
        };
    }
  };

  if (loading) {
    return (
      <div className={`
        flex flex-col items-center justify-center py-12 sm:py-16 rounded-2xl
        ${isDark ? 'bg-space-dust/30' : 'bg-slate-50'}
      `}>
        <RefreshCw className={`w-7 h-7 sm:w-8 sm:h-8 animate-spin ${isDark ? 'text-stellar-cyan' : 'text-stellar-blue'}`} />
        <span className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Carregando histórico...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`
        p-4 sm:p-6 rounded-2xl border
        ${isDark
          ? 'bg-red-900/20 border-red-500/20'
          : 'bg-red-50 border-red-200'}
      `}>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`
            w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
            ${isDark ? 'bg-red-500/15' : 'bg-red-100'}
          `}>
            <XCircle className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm sm:text-base ${isDark ? 'text-red-300' : 'text-red-800'}`}>
              Erro ao carregar histórico
            </p>
            <p className={`text-xs sm:text-sm mt-1 break-words ${isDark ? 'text-red-400/80' : 'text-red-600'}`}>{error}</p>
            <button
              onClick={fetchHistory}
              className={`
                mt-3 sm:mt-4 px-4 min-h-[44px] sm:min-h-0 sm:py-2 rounded-lg text-sm font-medium transition-colors
                ${isDark
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'}
              `}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`
        flex items-center justify-between gap-2 p-3 sm:p-4 rounded-xl
        ${isDark ? 'bg-space-dust/30 border border-stellar-cyan/10' : 'bg-slate-50 border border-slate-200'}
      `}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={`
            w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0
            ${isDark ? 'bg-space-nebula' : 'bg-white border border-slate-200'}
          `}>
            <History className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-stellar-cyan' : 'text-stellar-blue'}`} />
          </div>
          <div className="min-w-0">
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {history.length} registro{history.length !== 1 ? 's' : ''}
            </span>
            <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>
              Histórico de uploads
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={fetchHistory}
            className={`
              w-10 h-10 sm:w-9 sm:h-9 rounded-lg transition-colors flex items-center justify-center
              ${isDark
                ? 'hover:bg-space-nebula text-slate-400 hover:text-stellar-cyan'
                : 'hover:bg-white text-slate-400 hover:text-stellar-blue border border-transparent hover:border-slate-200'}
            `}
            title="Atualizar"
            aria-label="Atualizar histórico"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              disabled={clearing}
              className={`
                h-10 sm:h-9 px-2.5 sm:px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
                flex items-center justify-center gap-1.5
                ${isDark
                  ? 'text-red-400 hover:bg-red-500/15'
                  : 'text-red-600 hover:bg-red-50'}
              `}
            >
              {clearing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <div className={`
          text-center py-12 sm:py-16 rounded-2xl
          ${isDark ? 'bg-space-dust/30 border border-stellar-cyan/10' : 'bg-slate-50 border border-slate-200'}
        `}>
          <div className={`
            w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center
            ${isDark ? 'bg-space-nebula' : 'bg-white border border-slate-200'}
          `}>
            <CloudUpload className={`w-7 h-7 sm:w-8 sm:h-8 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          </div>
          <p className={`font-medium text-sm sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Nenhum upload registrado ainda
          </p>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Os uploads aparecerão aqui automaticamente
          </p>
        </div>
      )}

      {/* History list */}
      <AnimatePresence>
        {history.map((record, index) => {
          const statusInfo = getStatusInfo(record.status);
          const typeInfo = getTypeIcon(record.file_type);
          const StatusIcon = statusInfo.icon;
          const TypeIcon = typeInfo.icon;

          return (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.03 }}
              className={`
                relative overflow-hidden rounded-xl border
                ${isDark
                  ? 'bg-space-dust/40 border-stellar-cyan/10'
                  : 'bg-white border-slate-200'}
              `}
            >
              {/* Left accent stripe */}
              <div className={`absolute top-0 left-0 w-1 h-full ${statusInfo.accent}`} />

              <div className="p-3 sm:p-4 pl-4 sm:pl-5">
                {/* Header row - type, status, date */}
                <div className="flex items-start gap-2.5 sm:gap-3">
                  {/* Type icon */}
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${typeInfo.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className={`font-semibold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {record.file_type === 'sales' ? 'Vendas' : 'Clientes'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {record.status === 'success' ? 'Sucesso' : record.status === 'partial' ? 'Parcial' : 'Falha'}
                      </span>
                      {record.source === 'automated' && (
                        <span className={`
                          px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium
                          ${isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-100 text-purple-600'}
                        `}>
                          Auto
                        </span>
                      )}
                    </div>
                    <div className={`flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-1 sm:mt-1.5 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {formatDate(record.uploaded_at)}
                      </span>
                      {record.file_name && (
                        <span className="truncate max-w-[120px] sm:max-w-[150px] opacity-75">{record.file_name}</span>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className={`
                    text-right flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg
                    ${isDark ? 'bg-space-nebula' : 'bg-slate-50'}
                  `}>
                    <p className={`font-semibold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}>
                      {formatDuration(record.duration_ms)}
                    </p>
                    <p className={`text-[9px] sm:text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>duração</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className={`mt-3 sm:mt-4 pt-3 sm:pt-4 border-t ${isDark ? 'border-stellar-cyan/10' : 'border-slate-100'}`}>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                    <div className={`p-2 sm:p-2.5 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                      <p className={`font-bold text-base sm:text-lg ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {record.records_inserted || 0}
                      </p>
                      <p className={`text-[9px] sm:text-[10px] font-medium ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>
                        inseridos
                      </p>
                    </div>
                    {record.records_updated > 0 ? (
                      <div className={`p-2 sm:p-2.5 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                        <p className={`font-bold text-base sm:text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {record.records_updated}
                        </p>
                        <p className={`text-[9px] sm:text-[10px] font-medium ${isDark ? 'text-blue-400/70' : 'text-blue-600/70'}`}>
                          atualizados
                        </p>
                      </div>
                    ) : (
                      <div className={`p-2 sm:p-2.5 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                        <p className={`font-bold text-base sm:text-lg ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {record.records_skipped || 0}
                        </p>
                        <p className={`text-[9px] sm:text-[10px] font-medium ${isDark ? 'text-amber-400/70' : 'text-amber-600/70'}`}>
                          ignorados
                        </p>
                      </div>
                    )}
                    <div className={`p-2 sm:p-2.5 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                      <p className={`font-bold text-base sm:text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {record.records_total || 0}
                      </p>
                      <p className={`text-[9px] sm:text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        total
                      </p>
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {record.errors && record.errors.length > 0 && (
                  <div className={`mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t ${isDark ? 'border-stellar-cyan/10' : 'border-slate-100'}`}>
                    <p className={`text-[11px] sm:text-xs font-semibold mb-1.5 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      Erros encontrados:
                    </p>
                    <div className={`
                      text-[11px] sm:text-xs space-y-1 p-2 sm:p-2.5 rounded-lg
                      ${isDark ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-600'}
                    `}>
                      {record.errors.slice(0, 3).map((err, i) => (
                        <p key={i} className="truncate">• {err}</p>
                      ))}
                      {record.errors.length > 3 && (
                        <p className={isDark ? 'text-red-400/70' : 'text-red-500'}>
                          +{record.errors.length - 3} mais erros...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default UploadHistoryTab;
