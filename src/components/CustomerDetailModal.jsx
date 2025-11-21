// CustomerDetailModal.jsx v4.1 - BRANDING & DESIGN IMPROVEMENTS
// ✅ Enhanced Lavpop branding
// ✅ Rounded corners (rounded-2xl)
// ✅ Improved dark mode colors
// ✅ Better visual hierarchy
// ✅ Preserved all logic
//
// CHANGELOG:
// v4.1 (2025-11-21): Branding & design improvements
// v4.0 (2025-11-20): Tailwind migration & Dark Mode

import React, { useMemo } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Calendar,
  Activity,
  Tag,
  XCircle,
} from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';

const getRiskTailwind = (riskLevel) => {
  switch (riskLevel) {
    case 'Healthy':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-400 dark:border-emerald-600',
        emoji: '🟢',
        label: 'Saudável',
      };
    case 'Monitor':
      return {
        bg: 'bg-sky-50 dark:bg-sky-900/30',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-400 dark:border-sky-600',
        emoji: '🔵',
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
        bg: 'bg-rose-50 dark:bg-rose-900/30',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-400 dark:border-rose-600',
        emoji: '🚨',
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
      <span className="text-[11px] text-slate-500 dark:text-slate-400">
        -
      </span>
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
              inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold border
              ${isWash
                ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700'
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
      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
        <XCircle className="h-2.5 w-2.5" />
        Não
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300">
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

  const risk = getRiskTailwind(customer.riskLevel);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:px-4 sm:py-4"
      onClick={onClose}
    >
      <div
        className="w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-3xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER - Enhanced Branding */}
        <div className="relative overflow-hidden rounded-t-3xl flex-shrink-0">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-lavpop-blue to-blue-700 opacity-100"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-lavpop-green rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 text-white">
            <div className="flex-1 min-w-0">
              <h2 className="mb-1 text-xl sm:text-2xl font-extrabold leading-tight text-white truncate">
                {customer.name || 'Cliente sem nome'}
              </h2>
              <div className="text-xs sm:text-sm text-white/90 font-medium truncate">
                {customer.phone || 'Sem telefone'} •{' '}
                {customer.doc
                  ? `CPF: ${customer.doc.slice(0, 3)}...${customer.doc.slice(-2)}`
                  : 'Sem CPF'}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 ml-3">
              {/* Risk badge */}
              <div
                className={`
                  hidden sm:flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-extrabold shadow-lg
                  ${risk.bg} ${risk.text} ${risk.border}
                `}
              >
                <span className="text-lg">{risk.emoji}</span>
                <span>{risk.label}</span>
              </div>

              {/* Mobile Risk Badge (Icon Only) */}
              <div className={`sm:hidden w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${risk.bg} ${risk.border} shadow-lg`}>
                {risk.emoji}
              </div>

              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/40 bg-white/20 text-white transition hover:bg-white/30 hover:scale-110 backdrop-blur-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-20">
          <button
            onClick={handleCall}
            disabled={!customer.phone}
            className={`
              flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all
              ${customer.phone
                ? 'border-lavpop-blue text-lavpop-blue hover:bg-lavpop-blue hover:text-white hover:scale-105 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white shadow-sm'
                : 'cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-600'}
            `}
          >
            <Phone className="h-4 w-4" />
            Ligar
          </button>

          <button
            onClick={handleWhatsApp}
            disabled={!customer.phone}
            className={`
              flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all
              ${customer.phone
                ? 'border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white hover:scale-105 shadow-sm'
                : 'cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-600'}
            `}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
        </div>

        {/* TWO-COLUMN STATS GRID */}
        <div className="grid gap-4 border-b border-slate-200 dark:border-slate-700 px-6 py-5 md:grid-cols-2 bg-white dark:bg-slate-800">
          {/* Financial */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700/30 p-5 border border-slate-200 dark:border-slate-600">
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="text-lg">💰</span>
              Resumo Financeiro
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Total Gasto
                </span>
                <span className="text-lg font-extrabold text-lavpop-blue dark:text-blue-300">
                  {formatCurrency(customer.netTotal || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Total de Visitas
                </span>
                <span className="text-lg font-extrabold text-lavpop-blue dark:text-blue-300">
                  {customer.transactions ||
                    customer.frequency ||
                    0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Gasto/Visita
                </span>
                <span className="text-lg font-extrabold text-lavpop-green dark:text-green-300">
                  {formatCurrency(
                    customer.transactions > 0
                      ? customer.netTotal / customer.transactions
                      : 0,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Behavior */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700/30 p-5 border border-slate-200 dark:border-slate-600">
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="text-lg">📊</span>
              Comportamento
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Dias desde última visita
                </span>
                <span
                  className={`text-lg font-extrabold ${customer.daysSinceLastVisit > customer.avgDaysBetween
                    ? 'text-rose-600 dark:text-rose-300'
                    : 'text-emerald-600 dark:text-emerald-300'
                    }`}
                >
                  {customer.daysSinceLastVisit || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Intervalo médio (dias)
                </span>
                <span className="text-lg font-extrabold text-slate-700 dark:text-slate-200">
                  {customer.avgDaysBetween || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Serviços/Visita
                </span>
                <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                  {customer.servicesPerVisit || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SERVICE PREFERENCES */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-lavpop-blue dark:text-blue-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Preferências
            </span>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <div className="mb-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Lavagens
              </div>
              <div className="text-xl font-extrabold text-lavpop-blue dark:text-blue-300">
                {customer.washPercentage}%
              </div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Secagens
              </div>
              <div className="text-xl font-extrabold text-lavpop-green dark:text-green-300">
                {customer.dryPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* TRANSACTION HISTORY (Last 5) */}
        <div className="px-6 py-5 bg-white dark:bg-slate-800">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-lavpop-blue dark:text-blue-300">
            <Calendar className="h-5 w-5" />
            Últimas 5 Transações
          </h3>

          {transactionHistory.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-700/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <th className="px-3 py-3 text-center">Data</th>
                    <th className="px-3 py-3 text-center">Valor</th>
                    <th className="px-3 py-3 text-center">Ciclos</th>
                    <th className="px-3 py-3 text-center">Máquinas</th>
                    <th className="px-3 py-3 text-center">Cupom</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((txn, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-3 py-3 text-center text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        {formatDate(txn.date)}
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-bold text-lavpop-blue dark:text-blue-300">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-extrabold text-lavpop-blue dark:text-blue-300">
                        {txn.cycles}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <MachineDisplay machineStr={txn.machineStr} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <CouponBadge couponCode={txn.couponCode} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhuma transação disponível
            </div>
          )}
        </div>

        {/* RISK ALERT */}
        {(customer.riskLevel === 'At Risk' ||
          customer.riskLevel === 'Churning') &&
          customer.daysOverdue > 0 && (
            <div className="mx-6 mb-5 flex gap-3 rounded-2xl border-2 px-5 py-4 text-sm bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700 text-slate-800 dark:text-slate-200">
              <div className="text-2xl flex-shrink-0">⚠️</div>
              <div>
                <div className="mb-1 text-base font-extrabold text-slate-900 dark:text-white">
                  Atenção Necessária
                </div>
                <div className="text-sm leading-relaxed">
                  Cliente está{' '}
                  <strong>{customer.daysOverdue} dias atrasado</strong>{' '}
                  (frequência média:{' '}
                  {customer.avgDaysBetween} dias).
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default CustomerDetailModal;
