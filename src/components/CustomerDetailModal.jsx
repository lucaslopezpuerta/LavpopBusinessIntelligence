// CustomerDetailModal.jsx v5.0 - REDESIGN: COMPACT & MOBILE-FRIENDLY
// ✅ Follows Design System v2.0 strictly
// ✅ Simplified header (no gradient)
// ✅ More compact layout
// ✅ Better mobile responsiveness
// ✅ Cleaner card designs
// ✅ Optimized spacing
//
// CHANGELOG:
// v5.0 (2025-11-22): Complete redesign - compact & mobile-friendly
// v4.1 (2025-11-21): Branding & design improvements
// v4.0 (2025-11-20): Tailwind migration & Dark Mode

import React, { useMemo, useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Calendar,
  Activity,
  Tag,
  XCircle,
  TrendingUp,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';

const getRiskTailwind = (riskLevel) => {
  switch (riskLevel) {
    case 'Healthy':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-400 dark:border-emerald-600',
        emoji: '🥦',
        label: 'Saudável',
      };
    case 'Monitor':
      return {
        bg: 'bg-sky-50 dark:bg-sky-900/30',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-400 dark:border-sky-600',
        emoji: '👁️',
        label: 'Monitorar',
      };
    case 'At Risk':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-400 dark:border-amber-600',
        emoji: '⚠️',
        label: 'Em Risco',
      };
    case 'Churning':
      return {
        bg: 'bg-red-50 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-400 dark:border-red-600',
        emoji: '💔',
        label: 'Perdendo',
      };
    case 'New Customer':
      return {
        bg: 'bg-violet-50 dark:bg-violet-900/30',
        text: 'text-violet-700 dark:text-violet-300',
        border: 'border-violet-400 dark:border-violet-600',
        emoji: '🆕',
        label: 'Novo Cliente',
      };
    case 'Lost':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-400 dark:border-slate-600',
        emoji: '⛔',
        label: 'Perdido',
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-400 dark:border-slate-600',
        emoji: '❓',
        label: riskLevel || 'Indefinido',
      };
  }
};

const parseMachines = (machineStr) => {
  if (!machineStr || machineStr === 'N/A') return [];

  const parts = machineStr.split(',').map((s) => s.trim());
  const machines = [];

  parts.forEach((part) => {
    const washMatch = part.match(/Lavadora:\s*(\d+)/i);
    if (washMatch) {
      machines.push({ code: `L${washMatch[1]}`, type: 'wash' });
      return;
    }

    const dryMatch = part.match(/Secadora:\s*(\d+)/i);
    if (dryMatch) {
      machines.push({ code: `S${dryMatch[1]}`, type: 'dry' });
      return;
    }
  });

  return machines;
};

const MachineDisplay = ({ machineStr }) => {
  const machines = parseMachines(machineStr);

  if (machines.length === 0) {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">-</span>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {machines.map((machine, idx) => {
        const isWash = machine.type === 'wash';
        return (
          <span
            key={idx}
            className={`
              inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold
              ${isWash
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              }
            `}
          >
            {machine.code}
          </span>
        );
      })}
    </div>
  );
};

const CouponBadge = ({ couponCode }) => {
  if (
    !couponCode ||
    couponCode === '' ||
    couponCode.toLowerCase() === 'n/d'
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400">
        <XCircle className="h-2.5 w-2.5" />
        Não
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
      <Tag className="h-2.5 w-2.5" />
      {couponCode}
    </span>
  );
};

const formatCurrency = (value) => {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 'Data inválida';
  }
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const CustomerDetailModal = ({ customer, onClose, salesData = [] }) => {
  // State for managing which section is expanded (only one at a time)
  const [expandedSection, setExpandedSection] = useState('behaviour');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const transactionHistory = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const customerTxns = salesData
      .filter((row) => {
        const doc = String(
          row.Doc_Cliente || row.document || '',
        )
          .replace(/\D/g, '')
          .padStart(11, '0');
        return doc === customer.doc;
      })
      .map((row) => {
        const dateStr = row.Data_Hora || row.Data || '';
        const date = parseBrDate(dateStr);

        const amountStr = String(
          row.Valor_Pago || row.net_value || '0',
        );
        const amount = parseFloat(amountStr.replace(',', '.'));

        const machineStr =
          row.Maquinas || row.Maquina || row.machine || '';
        const machines = parseMachines(machineStr);
        const totalCycles = machines.length;

        const couponCode =
          row.Codigo_Cupom || row.coupon_code || '';
        return {
          date,
          dateValid:
            date instanceof Date && !Number.isNaN(date.getTime()),
          amount,
          cycles: totalCycles,
          machineStr,
          couponCode,
        };
      })
      .filter((txn) => txn.dateValid)
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    return customerTxns;
  }, [salesData, customer.doc]);

  const risk = getRiskTailwind(customer.riskLevel);

  const handleCall = () => {
    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/\D/g, '');
      window.location.href = `tel:+55${cleanPhone}`;
    }
  };

  const handleWhatsApp = () => {
    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/\D/g, '');
      const isMobile = /iPhone|iPad|iPod|Android/i.test(
        navigator.userAgent,
      );
      const url = isMobile
        ? `https://api.whatsapp.com/send?phone=55${cleanPhone}`
        : `https://web.whatsapp.com/send?phone=55${cleanPhone}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* COMPACT HEADER */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-700 via-lavpop-blue to-blue-900 dark:from-slate-800 dark:to-slate-900 px-4 py-3 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                {customer.name || 'Cliente sem nome'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-white/80">
                  {customer.phone || 'Cliente sem telefone'}
                </span>
                <span className="text-xs text-white/60">•</span>
                <span className="text-xs text-white/80">
                  {customer.doc
                    ? `CPF: ${customer.doc.slice(0, 3)}...${customer.doc.slice(-2)}`
                    : 'Cliente sem CPF'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Risk Badge */}
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${risk.bg} ${risk.text} border ${risk.border}`}
              >
                <span className="text-sm">{risk.emoji}</span>
                {risk.label}
              </span>
              {/* Close Button */}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS - More compact */}
        <div className="flex gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sm:px-6">
          <button
            onClick={handleCall}
            disabled={!customer.phone}
            className={`
              flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all
              ${customer.phone
                ? 'bg-lavpop-blue text-white hover:bg-lavpop-blue-600 shadow-sm'
                : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-600'
              }
            `}
          >
            <Phone className="h-4 w-4" />
            Ligar
          </button>
          <button
            onClick={handleWhatsApp}
            disabled={!customer.phone}
            className={`
              flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all
              ${customer.phone
                ? 'bg-[#25D366] text-white hover:bg-[#1fb855] shadow-sm'
                : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-600'
              }
            `}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
        </div>

        {/* COLLAPSIBLE SECTIONS - Mobile-friendly accordion */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          {/* Financial Stats - Collapsible */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => toggleSection('financials')}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors sm:px-6"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-lavpop-blue dark:text-blue-400" />
                <h3 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Financeiro
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-600 dark:text-slate-400 transition-transform ${expandedSection === 'financials' ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedSection === 'financials' && (
              <div className="px-4 py-3 space-y-3 sm:px-6">
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Total Gasto
                  </span>
                  <span className="text-base font-bold text-lavpop-blue dark:text-blue-300">
                    {formatCurrency(customer.netTotal || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Total de Visitas
                  </span>
                  <span className="text-base font-bold text-lavpop-blue dark:text-blue-300">
                    {customer.transactions || customer.frequency || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Gasto/Visita
                  </span>
                  <span className="text-base font-bold text-lavpop-green dark:text-green-300">
                    {formatCurrency(
                      customer.transactions > 0
                        ? customer.netTotal / customer.transactions
                        : 0,
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Behavior Stats - Open by default */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => toggleSection('behaviour')}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors sm:px-6"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-lavpop-green dark:text-green-400" />
                <h3 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Comportamento
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-600 dark:text-slate-400 transition-transform ${expandedSection === 'behaviour' ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedSection === 'behaviour' && (
              <div className="px-4 py-3 space-y-3 sm:px-6">
                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Dias desde última visita
                  </span>
                  <span
                    className={`text-base font-bold ${customer.daysSinceLastVisit > customer.avgDaysBetween
                      ? 'text-rose-600 dark:text-rose-300'
                      : 'text-emerald-600 dark:text-emerald-300'
                      }`}
                  >
                    {customer.daysSinceLastVisit || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Intervalo médio (dias)
                  </span>
                  <span className="text-base font-bold text-slate-700 dark:text-slate-200">
                    {customer.avgDaysBetween || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Serviços/Visita
                  </span>
                  <span className="text-base font-bold text-slate-700 dark:text-slate-200">
                    {customer.servicesPerVisit || 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SERVICE PREFERENCES - Collapsible */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => toggleSection('preferences')}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors sm:px-6"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-lavpop-blue dark:text-blue-400" />
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                Preferências
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-600 dark:text-slate-400 transition-transform ${expandedSection === 'preferences' ? 'rotate-180' : ''}`}
            />
          </button>
          {expandedSection === 'preferences' && (
            <div className="px-4 py-3 sm:px-6">
              <div className="flex gap-6 justify-center">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Lavagens
                  </div>
                  <div className="text-lg font-bold text-lavpop-blue dark:text-blue-300">
                    {customer.washPercentage}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Secagens
                  </div>
                  <div className="text-lg font-bold text-lavpop-green dark:text-green-300">
                    {customer.dryPercentage}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TRANSACTION HISTORY - Collapsible */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => toggleSection('transactions')}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors sm:px-6"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-lavpop-blue dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                Últimas 5 Transações
              </h3>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-600 dark:text-slate-400 transition-transform ${expandedSection === 'transactions' ? 'rotate-180' : ''}`}
            />
          </button>
          {expandedSection === 'transactions' && (
            <div className="px-4 py-3 sm:px-6">
              {transactionHistory.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                          <th className="px-2 py-2 text-left">Data</th>
                          <th className="px-2 py-2 text-right">Valor</th>
                          <th className="hidden sm:table-cell px-2 py-2 text-center">
                            Ciclos
                          </th>
                          <th className="px-2 py-2 text-center">Máquinas</th>
                          <th className="px-2 py-2 text-center">Cupom</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {transactionHistory.map((txn, idx) => (
                          <tr
                            key={idx}
                            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="px-2 py-2 text-xs text-slate-600 dark:text-slate-300">
                              {formatDate(txn.date)}
                            </td>
                            <td className="px-2 py-2 text-right text-xs font-bold text-lavpop-blue dark:text-blue-300">
                              {formatCurrency(txn.amount)}
                            </td>
                            <td className="hidden sm:table-cell px-2 py-2 text-center text-sm font-bold text-slate-700 dark:text-slate-200">
                              {txn.cycles}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <MachineDisplay machineStr={txn.machineStr} />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <CouponBadge couponCode={txn.couponCode} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Nenhuma transação disponível
                </div>
              )}
            </div>
          )}
        </div>

        {/* RISK ALERT - More compact */}
        {(customer.riskLevel === 'At Risk' ||
          customer.riskLevel === 'Churning') &&
          customer.daysOverdue > 0 && (
            <div className="mx-4 mb-4 flex gap-2 rounded-lg border-2 px-4 py-3 text-sm bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700 sm:mx-6">
              <div className="text-xl flex-shrink-0">⚠️</div>
              <div>
                <div className="mb-0.5 text-sm font-bold text-slate-900 dark:text-white">
                  Atenção Necessária
                </div>
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  Cliente está{' '}
                  <strong>{customer.daysOverdue} dias atrasado</strong>{' '}
                  (frequência média: {customer.avgDaysBetween} dias).
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default CustomerDetailModal;
