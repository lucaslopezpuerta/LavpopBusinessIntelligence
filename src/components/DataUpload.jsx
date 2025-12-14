// DataUpload.jsx v1.2
// Upload component for manual CSV data imports
//
// Features:
//   - Drag & drop file upload
//   - Auto-detects file type (sales vs customer)
//   - Shows upload progress with stages
//   - Displays results (inserted, skipped, errors)
//   - Refresh computed metrics button (for both file types)
//   - Auto-triggers app data refresh after successful upload
//   - Upload order guidance
//
// CHANGELOG:
// v1.2 (2025-12-13): Improved metric refresh flow
//   - Show "Sync Metrics" button for BOTH sales and customer uploads
//   - Added upload order guidance in help section
//   - Both file types affect computed columns
// v1.1 (2025-12-13): Auto-refresh after upload
//   - Added onDataChange prop for app-wide data refresh
//   - Triggers refresh after successful upload to sync dashboards

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X
} from 'lucide-react';
import {
  detectFileType,
  uploadSalesCSV,
  uploadCustomerCSV,
  refreshCustomerMetrics
} from '../utils/supabaseUploader';

const DataUpload = ({ onDataChange }) => {
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

      // Auto-trigger app-wide data refresh after successful upload
      if (uploadResult.success && uploadResult.inserted > 0 && onDataChange) {
        console.log('[DataUpload] Triggering app data refresh after successful upload');
        // Use setTimeout to allow UI to update first
        setTimeout(() => {
          onDataChange(`upload_${fileType}`);
        }, 500);
      }
    } catch (err) {
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
      setRefreshResult(result);
    } catch (err) {
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavpop-blue to-blue-600 flex items-center justify-center shadow-lg shadow-lavpop-blue/25">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Importar Dados
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload de arquivos CSV para o banco de dados
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200
          ${dragActive
            ? 'border-lavpop-blue bg-blue-50 dark:bg-blue-900/20'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
          }
          ${!file && !uploading ? 'cursor-pointer hover:border-lavpop-blue hover:bg-blue-50/50 dark:hover:bg-blue-900/10' : ''}
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
        />

        <AnimatePresence mode="wait">
          {!file ? (
            // Empty state - ready for upload
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                Arraste um arquivo CSV aqui
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                ou clique para selecionar
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4" />
                  sales.csv
                </span>
                <span className="flex items-center gap-1">
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
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center
                    ${typeInfo?.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                    ${typeInfo?.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}
                    ${typeInfo?.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' : ''}
                  `}>
                    {TypeIcon && (
                      <TypeIcon className={`w-7 h-7
                        ${typeInfo?.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : ''}
                        ${typeInfo?.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                        ${typeInfo?.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : ''}
                      `} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    {typeInfo && (
                      <span className={`
                        inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium
                        ${typeInfo.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                        ${typeInfo.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : ''}
                        ${typeInfo.color === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : ''}
                      `}>
                        {typeInfo.label}
                      </span>
                    )}
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Progress */}
              {uploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {progress.phase === 'parsing' ? 'Processando arquivo...' : 'Enviando para o banco...'}
                    </span>
                    <span className="text-sm text-slate-500">
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-lavpop-blue to-blue-600"
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
                      flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200
                      flex items-center justify-center gap-2
                      ${fileType === 'unknown'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700'
                        : 'bg-gradient-to-r from-lavpop-blue to-blue-600 text-white hover:shadow-lg hover:shadow-lavpop-blue/25'
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
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Tipo de arquivo nao reconhecido
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
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
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }
            `}
          >
            <div className="flex items-start gap-4">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${result.success
                  ? 'bg-emerald-100 dark:bg-emerald-900/40'
                  : 'bg-red-100 dark:bg-red-900/40'
                }
              `}>
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${result.success ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
                  {result.success ? 'Upload concluido!' : 'Erro no upload'}
                </h3>

                {result.success && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.inserted}</p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                        {result.updated !== undefined ? 'Novos' : 'Inseridos'}
                      </p>
                    </div>
                    {/* Show "Updated" column for smart customer upsert */}
                    {result.updated !== undefined ? (
                      <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.updated}</p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Atualizados</p>
                      </div>
                    ) : (
                      <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">{result.total}</p>
                        <p className="text-xs text-slate-500">Total linhas</p>
                      </div>
                    )}
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{result.skipped || 0}</p>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Ignorados</p>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                        {result.updated !== undefined ? result.total : (result.duplicates || 0)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {result.updated !== undefined ? 'Total linhas' : 'Duplicados'}
                      </p>
                    </div>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg max-h-32 overflow-auto">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Erros:</p>
                    {result.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        +{result.errors.length - 5} mais erros...
                      </p>
                    )}
                  </div>
                )}

                {/* Actions after success */}
                {result.success && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-lg text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                    >
                      Importar outro arquivo
                    </button>
                    {/* Show sync button for BOTH file types - computed columns depend on both */}
                    <button
                      onClick={handleRefreshMetrics}
                      disabled={refreshing}
                      className="px-4 py-2 bg-gradient-to-r from-lavpop-blue to-blue-600 rounded-lg text-sm font-medium text-white hover:shadow-lg hover:shadow-lavpop-blue/25 transition-all flex items-center gap-2 disabled:opacity-50"
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
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {refreshResult.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-800 dark:text-blue-200">
                    Metricas atualizadas: {refreshResult.updated} clientes
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-red-800 dark:text-red-200">
                    Erro: {refreshResult.error}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 space-y-6">
        {/* Upload Order */}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
            Ordem de Upload Recomendada
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">1</span>
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-emerald-700 dark:text-emerald-300">customer.csv</span>
            </div>
            <span className="text-slate-400">→</span>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">2</span>
              <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-700 dark:text-blue-300">sales.csv</span>
            </div>
            <span className="text-slate-400">→</span>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">3</span>
              <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-700 dark:text-purple-300">Sincronizar</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Clientes primeiro, depois vendas. Clique em "Sincronizar Metricas" apos o ultimo upload para atualizar colunas computadas (risk_level, rfm_segment, etc).
          </p>
        </div>

        {/* File formats */}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
            Formatos aceitos
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-slate-900 dark:text-white">sales.csv</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Arquivo de vendas do POS. Colunas: Data_Hora, Valor_Venda, Doc_Cliente, Maquinas, etc.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-slate-900 dark:text-white">customer.csv</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Arquivo de clientes. Colunas: Documento, Nome, Telefone, Email, Saldo_Carteira, etc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;
