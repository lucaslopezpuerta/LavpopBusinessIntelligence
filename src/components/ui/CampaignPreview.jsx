// CampaignPreview.jsx v1.1
// Shows campaign audience validation stats before sending
// Displays valid/invalid phone counts with detailed breakdown
//
// CHANGELOG:
// v1.1 (2025-12-08): Added blacklist filtering
//   - Shows blacklisted customers separately from invalid phones
//   - Displays opt-out and undelivered reasons
//   - Excludes blacklisted from send count
// v1.0 (2025-12-03): Initial implementation
//   - Validates phone numbers before campaign send
//   - Shows ready/invalid customer counts
//   - Expandable list of invalid numbers with reasons

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageCircle,
  Users,
  XCircle,
  ShieldOff,
  MessageSquareOff
} from 'lucide-react';
import { validateCampaignAudience } from '../../utils/campaignService';

const CampaignPreview = ({
  customers = [],
  onConfirm,
  onCancel,
  campaignName = 'Campanha',
  isLoading = false
}) => {
  const [showInvalid, setShowInvalid] = useState(false);
  const [showBlacklisted, setShowBlacklisted] = useState(false);
  const [validation, setValidation] = useState({
    ready: [],
    invalid: [],
    blacklisted: [],
    stats: { readyCount: 0, invalidCount: 0, blacklistedCount: 0 }
  });

  // Validate all customers (async)
  useEffect(() => {
    let cancelled = false;
    validateCampaignAudience(customers).then(result => {
      if (!cancelled) setValidation(result);
    });
    return () => { cancelled = true; };
  }, [customers]);

  const { ready, invalid, blacklisted = [], stats } = validation;
  const hasInvalid = invalid.length > 0;
  const hasBlacklisted = blacklisted.length > 0;
  const hasReady = ready.length > 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-500" />
          Pré-visualização: {campaignName}
        </h3>
      </div>

      {/* Stats Summary */}
      <div className="p-4 space-y-4">
        {/* Audience Overview */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Users className="w-4 h-4" />
          <span>Audiência selecionada: <strong className="text-slate-900 dark:text-white">{customers.length}</strong> clientes</span>
        </div>

        {/* Validation Results */}
        <div className="grid grid-cols-3 gap-3">
          {/* Ready to Send */}
          <div className={`rounded-lg p-3 border ${
            hasReady
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className={`w-4 h-4 ${hasReady ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
              <span className={`text-xs font-semibold uppercase ${hasReady ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                Prontos
              </span>
            </div>
            <div className={`text-2xl font-bold ${hasReady ? 'text-green-700 dark:text-green-300' : 'text-slate-500'}`}>
              {stats.readyCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Receberão mensagem
            </div>
          </div>

          {/* Invalid Phones */}
          <div className={`rounded-lg p-3 border ${
            hasInvalid
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${hasInvalid ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
              <span className={`text-xs font-semibold uppercase ${hasInvalid ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                Inválidos
              </span>
            </div>
            <div className={`text-2xl font-bold ${hasInvalid ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500'}`}>
              {stats.invalidCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Telefone inválido
            </div>
          </div>

          {/* Blacklisted */}
          <div className={`rounded-lg p-3 border ${
            hasBlacklisted
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldOff className={`w-4 h-4 ${hasBlacklisted ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
              <span className={`text-xs font-semibold uppercase ${hasBlacklisted ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                Bloqueados
              </span>
            </div>
            <div className={`text-2xl font-bold ${hasBlacklisted ? 'text-red-700 dark:text-red-300' : 'text-slate-500'}`}>
              {stats.blacklistedCount || 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Na blacklist
            </div>
          </div>
        </div>

        {/* Invalid List (Expandable) */}
        {hasInvalid && (
          <div className="border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowInvalid(!showInvalid)}
              className="w-full flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Ver clientes com telefone inválido
              </span>
              {showInvalid ? (
                <ChevronUp className="w-4 h-4 text-amber-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-600" />
              )}
            </button>

            {showInvalid && (
              <div className="max-h-48 overflow-y-auto divide-y divide-amber-100 dark:divide-amber-900/30">
                {invalid.slice(0, 20).map((customer, idx) => (
                  <div
                    key={customer.doc || idx}
                    className="px-3 py-2 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300">
                        {customer.name || `Cliente ${customer.doc?.slice(-4) || idx}`}
                      </span>
                    </div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                      {customer.error || 'Inválido'}
                    </span>
                  </div>
                ))}
                {invalid.length > 20 && (
                  <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                    +{invalid.length - 20} outros clientes
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Blacklisted List (Expandable) */}
        {hasBlacklisted && (
          <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowBlacklisted(!showBlacklisted)}
              className="w-full flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Ver clientes na blacklist
              </span>
              {showBlacklisted ? (
                <ChevronUp className="w-4 h-4 text-red-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-red-600" />
              )}
            </button>

            {showBlacklisted && (
              <div className="max-h-48 overflow-y-auto divide-y divide-red-100 dark:divide-red-900/30">
                {blacklisted.slice(0, 20).map((customer, idx) => (
                  <div
                    key={customer.doc || idx}
                    className="px-3 py-2 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquareOff className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300">
                        {customer.name || `Cliente ${customer.doc?.slice(-4) || idx}`}
                      </span>
                    </div>
                    <span className="text-xs text-red-600 dark:text-red-400 shrink-0 ml-2">
                      {customer.blacklistReason === 'opt-out' ? 'Opt-out' :
                       customer.blacklistReason === 'undelivered' ? 'Não entregue' :
                       customer.blacklistReason === 'number-blocked' ? 'Bloqueado' : 'Blacklist'}
                    </span>
                  </div>
                ))}
                {blacklisted.length > 20 && (
                  <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                    +{blacklisted.length - 20} outros clientes
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No Valid Recipients Warning */}
        {!hasReady && (
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Nenhum destinatário válido
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Todos os clientes selecionados têm telefone inválido para WhatsApp.
              </p>
            </div>
          </div>
        )}

        {/* Info Note */}
        {hasReady && (hasInvalid || hasBlacklisted) && (
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            {hasInvalid && hasBlacklisted
              ? 'Clientes com telefone inválido ou na blacklist não receberão a mensagem.'
              : hasInvalid
                ? 'Apenas clientes com celular brasileiro válido receberão a mensagem.'
                : 'Clientes na blacklist (opt-out ou não entregues) não receberão a mensagem.'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(ready)}
          disabled={!hasReady || isLoading}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            hasReady && !isLoading
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Enviando...
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              Enviar para {stats.readyCount}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CampaignPreview;
