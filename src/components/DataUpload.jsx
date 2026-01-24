// DataUpload.jsx v2.2 - MOBILE-OPTIMIZED DESIGN
// Upload component for manual CSV data imports
//
// Features:
//   - Drag & drop file upload
//   - Auto-detects file type (sales vs customer)
//   - Shows upload progress with stages
//   - Displays results (inserted, skipped, errors)
//   - Refresh computed metrics button (for both file types)
//   - Auto-triggers app data refresh after successful upload
//   - Upload order guidance with visual step flow
//   - Haptic feedback on success/error
//   - Cosmic Precision Design System v5.1 compliant
//
// CHANGELOG:
// v2.2 (2026-01-24): Mobile-optimized design
//   - Mobile-visible down arrows between step flow items
//   - Larger touch targets (min 44px) for all buttons
//   - Improved typography scaling on small screens
//   - Better drop zone sizing for mobile
//   - Compact column tags on mobile
// v2.1 (2026-01-24): Enhanced help section design
//   - Redesigned upload order flow with gradient step cards
//   - Enhanced file format cards with column tags
//   - Left accent stripe on file format cards
//   - Better visual hierarchy and spacing
//   - Improved mobile layout for step flow
// v2.0 (2026-01-24): Cosmic Precision Design update
//   - Added hideHeader prop to support parent view header
//   - Replaced legacy lavpop-blue colors with stellar-blue/stellar-cyan
//   - Updated drop zone with Cosmic styling
//   - Progress bar now uses bg-gradient-stellar
//   - Improved dark mode with space-dust/space-nebula backgrounds
//   - Better visual feedback on drag states
// v1.4 (2025-12-26): Mobile-friendly layout
//   - Upload order section stacks vertically on mobile
//   - Help cards stack properly on small screens
//   - Improved touch targets and spacing
// v1.3 (2025-12-22): Haptic feedback on upload results
//   - haptics.success() on successful upload
//   - haptics.error() on validation/upload errors
// v1.2 (2025-12-13): Improved metric refresh flow
//   - Show "Sync Metrics" button for BOTH sales and customer uploads
//   - Added upload order guidance in help section
//   - Both file types affect computed columns
// v1.1 (2025-12-13): Auto-refresh after upload
//   - Added onDataChange prop for app-wide data refresh
//   - Triggers refresh after successful upload to sync dashboards

import React, { useState, useRef, useCallback } from 'react';
import { haptics } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Users,
  ShoppingCart,
  HelpCircle,
  X,
  CloudUpload,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  detectFileType,
  uploadSalesCSV,
  uploadCustomerCSV,
  refreshCustomerMetrics
} from '../utils/supabaseUploader';

const DataUpload = ({ onDataChange, hideHeader = false }) => {
  const { isDark } = useTheme();

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null); // 'sales' | 'customer' | 'unknown'
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: 'idle' });
  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);

  const inputRef = useRef(null);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process selected file
  const handleFile = async (selectedFile) => {
    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      haptics.error();
      setResult({
        success: false,
        errors: ['Por favor, selecione um arquivo CSV']
      });
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setRefreshResult(null);

    // Read and detect file type
    const text = await selectedFile.text();
    const detected = detectFileType(text);
    setFileType(detected);
  };

  // Start upload
  const handleUpload = async () => {
    if (!file || !fileType || fileType === 'unknown') return;

    setUploading(true);
    setResult(null);
    setRefreshResult(null);

    try {
      const text = await file.text();

      const onProgress = (current, total, phase) => {
        setProgress({ current, total, phase });
      };

      let uploadResult;
      if (fileType === 'sales') {
        uploadResult = await uploadSalesCSV(text, onProgress);
      } else {
        uploadResult = await uploadCustomerCSV(text, onProgress);
      }

      setResult(uploadResult);

      // Haptic feedback based on result
      if (uploadResult.success) {
        haptics.success();
      } else {
        haptics.error();
      }

      // Auto-trigger app-wide data refresh after successful upload
      if (uploadResult.success && uploadResult.inserted > 0 && onDataChange) {
        console.log('[DataUpload] Triggering app data refresh after successful upload');
        // Use setTimeout to allow UI to update first
        setTimeout(() => {
          onDataChange(`upload_${fileType}`);
        }, 500);
      }
    } catch (err) {
      haptics.error();
      setResult({
        success: false,
        errors: [err.message]
      });
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0, phase: 'idle' });
    }
  };

  // Refresh customer metrics
  const handleRefreshMetrics = async () => {
    setRefreshing(true);
    setRefreshResult(null);

    try {
      const result = await refreshCustomerMetrics();
      haptics.success();
      setRefreshResult(result);
    } catch (err) {
      haptics.error();
      setRefreshResult({
        success: false,
        error: err.message
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Reset state
  const handleReset = () => {
    setFile(null);
    setFileType(null);
    setResult(null);
    setRefreshResult(null);
    setProgress({ current: 0, total: 0, phase: 'idle' });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Get file type display info
  const getFileTypeInfo = (type) => {
    switch (type) {
      case 'sales':
        return {
          icon: ShoppingCart,
          label: 'Vendas',
          description: 'Arquivo de transacoes (sales.csv)',
          color: 'blue'
        };
      case 'customer':
        return {
          icon: Users,
          label: 'Clientes',
          description: 'Arquivo de clientes (customer.csv)',
          color: 'emerald'
        };
      default:
        return {
          icon: HelpCircle,
          label: 'Desconhecido',
          description: 'Tipo de arquivo nao identificado',
          color: 'amber'
        };
    }
  };

  const typeInfo = fileType ? getFileTypeInfo(fileType) : null;
  const TypeIcon = typeInfo?.icon;

  return (
    <div className="space-y-6">
      {/* Header - Only show if not hidden by parent */}
      {!hideHeader && (
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center shadow-lg
            bg-gradient-stellar shadow-stellar-cyan/20
          `}>
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Importar Dados
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Upload de arquivos CSV para o banco de dados
            </p>
          </div>
        </div>
      )}

      {/* Drop Zone - Cosmic Precision styled */}
      <div
        className={`
          relative border-2 border-dashed rounded-2xl p-6 sm:p-8 transition-all duration-300
          ${dragActive
            ? isDark
              ? 'border-stellar-cyan bg-stellar-cyan/5 shadow-lg shadow-stellar-cyan/10'
              : 'border-stellar-cyan bg-stellar-cyan/5'
            : isDark
              ? 'border-stellar-cyan/20 bg-space-dust/50'
              : 'border-slate-200 bg-white'
          }
          ${!file && !uploading
            ? isDark
              ? 'cursor-pointer hover:border-stellar-cyan/50 hover:bg-space-dust'
              : 'cursor-pointer hover:border-stellar-blue hover:bg-slate-50'
            : ''
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
          aria-label="Selecionar arquivo CSV"
        />

        <AnimatePresence mode="wait">
          {!file ? (
            // Empty state - ready for upload
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-2 sm:py-0"
            >
              <div className={`
                w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center
                ${isDark ? 'bg-space-nebula' : 'bg-slate-100'}
              `}>
                <CloudUpload className={`w-7 h-7 sm:w-8 sm:h-8 ${isDark ? 'text-stellar-cyan' : 'text-slate-400'}`} />
              </div>
              <p className={`text-base sm:text-lg font-medium mb-1.5 sm:mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                Arraste um arquivo CSV aqui
              </p>
              <p className={`text-sm mb-3 sm:mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ou toque para selecionar
              </p>
              <div className={`flex items-center justify-center gap-3 sm:gap-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4" />
                  sales.csv
                </span>
                <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  customer.csv
                </span>
              </div>
            </motion.div>
          ) : (
            // File selected
            <motion.div
              key="file"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* File info */}
              <div className="flex items-start justify-between mb-5 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`
                    w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0
                    ${typeInfo?.color === 'blue' ? isDark ? 'bg-blue-900/30' : 'bg-blue-100' : ''}
                    ${typeInfo?.color === 'emerald' ? isDark ? 'bg-emerald-900/30' : 'bg-emerald-100' : ''}
                    ${typeInfo?.color === 'amber' ? isDark ? 'bg-amber-900/30' : 'bg-amber-100' : ''}
                  `}>
                    {TypeIcon && (
                      <TypeIcon className={`w-6 h-6 sm:w-7 sm:h-7
                        ${typeInfo?.color === 'blue' ? isDark ? 'text-blue-400' : 'text-blue-600' : ''}
                        ${typeInfo?.color === 'emerald' ? isDark ? 'text-emerald-400' : 'text-emerald-600' : ''}
                        ${typeInfo?.color === 'amber' ? isDark ? 'text-amber-400' : 'text-amber-600' : ''}
                      `} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {file.name}
                    </p>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    {typeInfo && (
                      <span className={`
                        inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium
                        ${typeInfo.color === 'blue' ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700' : ''}
                        ${typeInfo.color === 'emerald' ? isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700' : ''}
                        ${typeInfo.color === 'amber' ? isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700' : ''}
                      `}>
                        {typeInfo.label}
                      </span>
                    )}
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className={`
                      p-2.5 sm:p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center
                      ${isDark ? 'hover:bg-space-nebula text-slate-400' : 'hover:bg-slate-100 text-slate-400'}
                    `}
                    aria-label="Remover arquivo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Progress */}
              {uploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {progress.phase === 'parsing' ? 'Processando arquivo...' : 'Enviando para o banco...'}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-space-nebula' : 'bg-slate-100'}`}>
                    <motion.div
                      className="h-full bg-gradient-stellar"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              {!uploading && !result && (
                <div className="flex gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                    disabled={fileType === 'unknown'}
                    className={`
                      flex-1 min-h-[48px] py-3 sm:py-3 px-4 rounded-xl font-semibold transition-all duration-200
                      flex items-center justify-center gap-2
                      ${fileType === 'unknown'
                        ? isDark
                          ? 'bg-space-nebula text-slate-500 cursor-not-allowed'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-stellar text-white hover:shadow-lg hover:shadow-stellar-cyan/25 active:scale-[0.98]'
                      }
                    `}
                  >
                    <Upload className="w-5 h-5" />
                    Iniciar Upload
                  </button>
                </div>
              )}

              {/* Unknown type warning */}
              {fileType === 'unknown' && !result && (
                <div className={`
                  mt-4 p-4 rounded-xl border
                  ${isDark
                    ? 'bg-amber-900/20 border-amber-800/60'
                    : 'bg-amber-50 border-amber-200'}
                `}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                    <div>
                      <p className={`font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                        Tipo de arquivo nao reconhecido
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-amber-300/80' : 'text-amber-600'}`}>
                        O arquivo deve ser sales.csv (com colunas Data_Hora, Valor_Venda) ou customer.csv (com colunas Documento, Nome).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              p-6 rounded-2xl border
              ${result.success
                ? isDark
                  ? 'bg-emerald-900/20 border-emerald-800/60'
                  : 'bg-emerald-50 border-emerald-200'
                : isDark
                  ? 'bg-red-900/20 border-red-800/60'
                  : 'bg-red-50 border-red-200'
              }
            `}
          >
            <div className="flex items-start gap-4">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${result.success
                  ? isDark ? 'bg-emerald-900/40' : 'bg-emerald-100'
                  : isDark ? 'bg-red-900/40' : 'bg-red-100'
                }
              `}>
                {result.success ? (
                  <CheckCircle2 className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                ) : (
                  <XCircle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${
                  result.success
                    ? isDark ? 'text-emerald-200' : 'text-emerald-800'
                    : isDark ? 'text-red-200' : 'text-red-800'
                }`}>
                  {result.success ? 'Upload concluido!' : 'Erro no upload'}
                </h3>

                {result.success && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`text-center p-3 rounded-lg ${isDark ? 'bg-space-dust/50' : 'bg-white/60'}`}>
                      <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{result.inserted}</p>
                      <p className={`text-xs ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>
                        {result.updated !== undefined ? 'Novos' : 'Inseridos'}
                      </p>
                    </div>
                    {/* Show "Updated" column for smart customer upsert */}
                    {result.updated !== undefined ? (
                      <div className={`text-center p-3 rounded-lg ${isDark ? 'bg-space-dust/50' : 'bg-white/60'}`}>
                        <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{result.updated}</p>
                        <p className={`text-xs ${isDark ? 'text-blue-400/70' : 'text-blue-600/70'}`}>Atualizados</p>
                      </div>
                    ) : (
                      <div className={`text-center p-3 rounded-lg ${isDark ? 'bg-space-dust/50' : 'bg-white/60'}`}>
                        <p className={`text-2xl font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{result.total}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Total linhas</p>
                      </div>
                    )}
                    <div className={`text-center p-3 rounded-lg ${isDark ? 'bg-space-dust/50' : 'bg-white/60'}`}>
                      <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{result.skipped || 0}</p>
                      <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600/70'}`}>Ignorados</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${isDark ? 'bg-space-dust/50' : 'bg-white/60'}`}>
                      <p className={`text-2xl font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {result.updated !== undefined ? result.total : (result.duplicates || 0)}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {result.updated !== undefined ? 'Total linhas' : 'Duplicados'}
                      </p>
                    </div>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className={`mt-3 p-3 rounded-lg max-h-32 overflow-auto ${isDark ? 'bg-space-dust/50' : 'bg-white/60'}`}>
                    <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-red-300' : 'text-red-700'}`}>Erros:</p>
                    {result.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{err}</p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                        +{result.errors.length - 5} mais erros...
                      </p>
                    )}
                  </div>
                )}

                {/* Actions after success */}
                {result.success && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleReset}
                      className={`
                        w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors
                        ${isDark
                          ? 'bg-space-dust border border-emerald-700/50 text-emerald-300 hover:bg-space-nebula'
                          : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'}
                      `}
                    >
                      Importar outro arquivo
                    </button>
                    {/* Show sync button for BOTH file types - computed columns depend on both */}
                    <button
                      onClick={handleRefreshMetrics}
                      disabled={refreshing}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gradient-stellar rounded-lg text-sm font-medium text-white hover:shadow-lg hover:shadow-stellar-cyan/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {refreshing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Sincronizar Metricas
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refresh metrics result */}
      <AnimatePresence>
        {refreshResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`
              p-4 rounded-xl border
              ${refreshResult.success
                ? isDark
                  ? 'bg-blue-900/20 border-blue-800/60'
                  : 'bg-blue-50 border-blue-200'
                : isDark
                  ? 'bg-red-900/20 border-red-800/60'
                  : 'bg-red-50 border-red-200'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {refreshResult.success ? (
                <>
                  <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={isDark ? 'text-blue-200' : 'text-blue-800'}>
                    Metricas atualizadas: {refreshResult.updated} clientes
                  </span>
                </>
              ) : (
                <>
                  <XCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={isDark ? 'text-red-200' : 'text-red-800'}>
                    Erro: {refreshResult.error}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help section - Enhanced Cosmic Precision Design */}
      <div className={`
        rounded-2xl overflow-hidden
        ${isDark ? 'bg-space-dust/30 border border-stellar-cyan/10' : 'bg-gradient-to-br from-slate-50 to-white border border-slate-200'}
      `}>
        {/* Upload Order Section */}
        <div className={`p-4 sm:p-6 ${isDark ? 'border-b border-stellar-cyan/10' : 'border-b border-slate-100'}`}>
          <h3 className={`text-sm font-semibold mb-3 sm:mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Ordem de Upload Recomendada
          </h3>

          {/* Step Flow - Mobile-optimized with visible connectors */}
          <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0">
            {/* Step 1: Customer */}
            <div className={`
              flex-1 flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-r-none
              ${isDark
                ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-900/20 border border-emerald-500/20'
                : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200'}
            `}>
              <div className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-500'}
              `}>
                <span className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-white'}`}>1</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Users className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span className={`font-semibold text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>customer.csv</span>
                </div>
                <p className={`text-[11px] sm:text-xs mt-0.5 ${isDark ? 'text-emerald-400/60' : 'text-emerald-600/70'}`}>
                  Cadastro de clientes
                </p>
              </div>
            </div>

            {/* Arrow connector - Mobile: down, Desktop: right */}
            <div className={`flex items-center justify-center ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
              <ChevronDown className="w-5 h-5 sm:hidden" />
              <ChevronRight className="w-5 h-5 hidden sm:block" />
            </div>

            {/* Step 2: Sales */}
            <div className={`
              flex-1 flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-none
              ${isDark
                ? 'bg-gradient-to-br from-blue-500/10 to-blue-900/20 border border-blue-500/20'
                : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200'}
            `}>
              <div className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDark ? 'bg-blue-500/20' : 'bg-blue-500'}
              `}>
                <span className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-white'}`}>2</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`font-semibold text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>sales.csv</span>
                </div>
                <p className={`text-[11px] sm:text-xs mt-0.5 ${isDark ? 'text-blue-400/60' : 'text-blue-600/70'}`}>
                  Transações de vendas
                </p>
              </div>
            </div>

            {/* Arrow connector - Mobile: down, Desktop: right */}
            <div className={`flex items-center justify-center ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
              <ChevronDown className="w-5 h-5 sm:hidden" />
              <ChevronRight className="w-5 h-5 hidden sm:block" />
            </div>

            {/* Step 3: Sync */}
            <div className={`
              flex-1 flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-l-none
              ${isDark
                ? 'bg-gradient-to-br from-purple-500/10 to-purple-900/20 border border-purple-500/20'
                : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200'}
            `}>
              <div className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDark ? 'bg-purple-500/20' : 'bg-purple-500'}
              `}>
                <span className={`text-sm font-bold ${isDark ? 'text-purple-400' : 'text-white'}`}>3</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`font-semibold text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Sincronizar</span>
                </div>
                <p className={`text-[11px] sm:text-xs mt-0.5 ${isDark ? 'text-purple-400/60' : 'text-purple-600/70'}`}>
                  Atualizar métricas
                </p>
              </div>
            </div>
          </div>

          <p className={`text-[11px] sm:text-xs mt-3 sm:mt-4 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Clique em "Sincronizar Métricas" após o último upload para calcular risk_level, rfm_segment e outras métricas.
          </p>
        </div>

        {/* File Formats Section */}
        <div className="p-4 sm:p-6">
          <h3 className={`text-sm font-semibold mb-3 sm:mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Formatos Aceitos
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Sales CSV Card */}
            <div className={`
              group relative p-4 sm:p-5 rounded-xl transition-all duration-200
              ${isDark
                ? 'bg-space-nebula/60 border border-blue-500/10 hover:border-blue-500/30'
                : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md'}
            `}>
              <div className={`
                absolute top-0 left-0 w-1 h-full rounded-l-xl
                ${isDark ? 'bg-blue-500/40' : 'bg-blue-500'}
              `} />
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`
                  w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isDark ? 'bg-blue-500/15' : 'bg-blue-100'}
                `}>
                  <ShoppingCart className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>sales.csv</h4>
                  <p className={`text-[11px] sm:text-xs mt-0.5 sm:mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Arquivo de vendas do POS
                  </p>
                  <div className={`flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3`}>
                    {['Data_Hora', 'Valor_Venda', 'Doc_Cliente', 'Maquinas'].map((col) => (
                      <span
                        key={col}
                        className={`
                          px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium
                          ${isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}
                        `}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer CSV Card */}
            <div className={`
              group relative p-4 sm:p-5 rounded-xl transition-all duration-200
              ${isDark
                ? 'bg-space-nebula/60 border border-emerald-500/10 hover:border-emerald-500/30'
                : 'bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md'}
            `}>
              <div className={`
                absolute top-0 left-0 w-1 h-full rounded-l-xl
                ${isDark ? 'bg-emerald-500/40' : 'bg-emerald-500'}
              `} />
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`
                  w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'}
                `}>
                  <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>customer.csv</h4>
                  <p className={`text-[11px] sm:text-xs mt-0.5 sm:mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Arquivo de clientes
                  </p>
                  <div className={`flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3`}>
                    {['Documento', 'Nome', 'Telefone', 'Email'].map((col) => (
                      <span
                        key={col}
                        className={`
                          px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium
                          ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}
                        `}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;
