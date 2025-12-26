// UploadHistoryTab.jsx v1.1 - MOBILE-FRIENDLY
// Display upload history from Supabase upload_history table
//
// Features:
//   - Shows recent uploads (last 7 days)
//   - Columns: Date, Type, Records, Status, Duration
//   - Clear history button
//   - Auto-refresh after parent upload
//
// CHANGELOG:
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
  CloudUpload
} from 'lucide-react';
import { getSupabaseClient } from '../utils/supabaseClient';

const UploadHistoryTab = ({ refreshTrigger }) => {
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

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'success':
        return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
      case 'partial':
        return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
      default:
        return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
    }
  };

  // Get file type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'sales':
        return { icon: ShoppingCart, color: 'text-blue-500' };
      case 'customers':
        return { icon: Users, color: 'text-emerald-500' };
      default:
        return { icon: CloudUpload, color: 'text-slate-400' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-lavpop-blue animate-spin" />
        <span className="ml-2 text-slate-500">Carregando historico...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">Erro ao carregar historico</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 rounded-lg text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {history.length} registro{history.length !== 1 ? 's' : ''} no histórico
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchHistory}
            className="p-2.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-2.5 sm:py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {clearing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <CloudUpload className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum upload registrado ainda</p>
          <p className="text-sm mt-1">Os uploads aparecerao aqui automaticamente</p>
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
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              {/* Header row - type, status, date */}
              <div className="flex items-start gap-3">
                {/* Type icon */}
                <div className={`w-10 h-10 rounded-lg ${statusInfo.bg} flex items-center justify-center flex-shrink-0`}>
                  <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white capitalize">
                      {record.file_type === 'sales' ? 'Vendas' : 'Clientes'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {record.status === 'success' ? 'Sucesso' : record.status === 'partial' ? 'Parcial' : 'Falha'}
                    </span>
                    {record.source === 'automated' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        Auto
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <span>{formatDate(record.uploaded_at)}</span>
                    {record.file_name && (
                      <span className="truncate max-w-[150px]">{record.file_name}</span>
                    )}
                  </div>
                </div>

                {/* Duration - always visible */}
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-slate-500 text-sm">{formatDuration(record.duration_ms)}</p>
                  <p className="text-xs text-slate-400">tempo</p>
                </div>
              </div>

              {/* Stats row - always visible on all screens */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{record.records_inserted || 0}</p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">inseridos</p>
                  </div>
                  {record.records_updated > 0 ? (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="font-semibold text-blue-600 dark:text-blue-400">{record.records_updated}</p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70">atualizados</p>
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <p className="font-semibold text-amber-600 dark:text-amber-400">{record.records_skipped || 0}</p>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/70">ignorados</p>
                    </div>
                  )}
                  <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="font-semibold text-slate-600 dark:text-slate-400">{record.records_total || 0}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">total</p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {record.errors && record.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Erros:</p>
                  <div className="text-xs text-red-500 dark:text-red-400 space-y-0.5">
                    {record.errors.slice(0, 3).map((err, i) => (
                      <p key={i} className="truncate">{err}</p>
                    ))}
                    {record.errors.length > 3 && (
                      <p className="text-red-400">+{record.errors.length - 3} mais...</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default UploadHistoryTab;
