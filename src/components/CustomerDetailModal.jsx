// CustomerDetailModal.jsx v4.0 - TAILWIND MIGRATION
// ✅ Replaced inline styles with Tailwind classes
// ✅ Added dark mode support
// ✅ Responsive grid layout
// ✅ Preserved all logic
//
// CHANGELOG:
// v4.0 (2025-11-20): Tailwind migration & Dark Mode
// v3.0 (2025-11-20): Tailwind version (initial attempt)

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
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-400 dark:border-emerald-700',
        emoji: '🟢',
        label: 'Saudável',
      };
    case 'Monitor':
      return {
        bg: 'bg-sky-50 dark:bg-sky-900/20',
        text: 'text-sky-700 dark:text-sky-400',
        border: 'border-sky-400 dark:border-sky-700',
        emoji: '🔵',
        label: 'Monitorar',
      };
    case 'At Risk':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-400 dark:border-amber-700',
        emoji: '⚠️',
        label: 'Em Risco',
      };
    case 'Churning':
      return {
        bg: 'bg-rose-50 dark:bg-rose-900/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-400 dark:border-rose-700',
        emoji: '🚨',
        label: 'Perdendo',
      };
    case 'New Customer':
      return {
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        text: 'text-violet-700 dark:text-violet-400',
        border: 'border-violet-400 dark:border-violet-700',
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
    <div className="flex flex-wrap justify-center gap-[3px]">
      {machines.map((machine, idx) => {
        const isWash = machine.type === 'wash';
        return (
          <span
            key={idx}
            className={`
              inline-flex items-center rounded px-[6px] py-[2px] text-[10px] font-bold border
              ${isWash
                ? 'bg-sky-100 text-[#0c4a6e] border-sky-300 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
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
      <span className="inline-flex items-center gap-[3px] rounded border border-slate-300 bg-slate-100 px-2 py-[3px] text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400">
        <XCircle className="h-[10px] w-[10px]" />
        Não
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-[3px] rounded border border-emerald-300 bg-emerald-100 px-2 py-[3px] text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300">
      <Tag className="h-[10px] w-[10px]" />
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
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between rounded-t-2xl px-5 py-4 text-white bg-gradient-to-r from-slate-900 to-lavpop-blue"
        >
          <div className="flex-1">
            <h2 className="mb-0.5 text-xl font-bold leading-tight text-white">
              {customer.name || 'Cliente sem nome'}
            </h2>
            <div className="text-[12px] text-white/90">
              {customer.phone || 'Sem telefone'} •{' '}
              {customer.doc
                ? `CPF: ${customer.doc.slice(0, 3)}...${customer.doc.slice(-2)}`
                : 'Sem CPF'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Risk badge */}
            <div
              className={`
                flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-bold
                ${risk.bg} ${risk.text} ${risk.border}
              `}
            >
              <span>{risk.emoji}</span>
              <span>{risk.label}</span>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 bg-white/25 text-white transition hover:bg-white/40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 border-b border-slate-200 dark:border-slate-700 px-5 py-3 bg-white dark:bg-slate-800">
          <button
            onClick={handleCall}
            disabled={!customer.phone}
            className={`
              flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition
              ${customer.phone
                ? 'border-lavpop-blue text-lavpop-blue hover:bg-lavpop-blue hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white'
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
              flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition
              ${customer.phone
                ? 'border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white'
                : 'cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-600'}
            `}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
        </div>

        {/* TWO-COLUMN STATS GRID */}
        <div className="grid gap-3 border-b border-slate-200 dark:border-slate-700 px-5 py-4 md:grid-cols-2 bg-white dark:bg-slate-800">
          {/* Financial */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-4">
            <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
              💰 Resumo Financeiro
            </h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500 dark:text-slate-400">
                  Total Gasto
                </span>
                <span className="text-[16px] font-bold text-lavpop-blue dark:text-blue-400">
                  {formatCurrency(customer.netTotal || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500 dark:text-slate-400">
                  Total de Visitas
                </span>
                <span className="text-[16px] font-bold text-lavpop-blue dark:text-blue-400">
                  {customer.transactions ||
                    customer.frequency ||
                    0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500 dark:text-slate-400">
                  Gasto/Visita
                </span>
                <span className="text-[16px] font-bold text-lavpop-green dark:text-green-400">
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
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-4">
            <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
              📊 Comportamento
            </h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500 dark:text-slate-400">
                  Dias desde última visita
                </span>
                <span
                  className={`text-[16px] font-bold ${customer.daysSinceLastVisit > customer.avgDaysBetween
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                >
                  {customer.daysSinceLastVisit || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500 dark:text-slate-400">
                  Intervalo médio (dias)
                </span>
                <span className="text-[16px] font-bold text-slate-700 dark:text-slate-300">
                  {customer.avgDaysBetween || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500 dark:text-slate-400">
                  Serviços/Visita
                </span>
                <span className="text-[16px] font-bold text-slate-800 dark:text-slate-200">
                  {customer.servicesPerVisit || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SERVICE PREFERENCES */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-3 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-lavpop-blue dark:text-blue-400" />
            <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
              Preferências
            </span>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="mb-[2px] text-[10px] text-slate-500 dark:text-slate-400">
                Lavagens
              </div>
              <div className="text-[16px] font-bold text-lavpop-blue dark:text-blue-400">
                {customer.washPercentage}%
              </div>
            </div>
            <div className="text-center">
              <div className="mb-[2px] text-[10px] text-slate-500 dark:text-slate-400">
                Secagens
              </div>
              <div className="text-[16px] font-bold text-lavpop-green dark:text-green-400">
                {customer.dryPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* TRANSACTION HISTORY (Last 5) */}
        <div className="px-5 py-4 bg-white dark:bg-slate-800">
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-lavpop-blue dark:text-blue-400">
            <Calendar className="h-4 w-4" />
            Últimas 5 Transações
          </h3>

          {transactionHistory.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    <th className="px-2 py-2 text-center">Data</th>
                    <th className="px-2 py-2 text-center">Valor</th>
                    <th className="px-2 py-2 text-center">Ciclos</th>
                    <th className="px-2 py-2 text-center">Máquinas</th>
                    <th className="px-2 py-2 text-center">Cupom</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((txn, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <td className="px-2 py-2 text-center text-[11px] text-slate-600 dark:text-slate-400">
                        {formatDate(txn.date)}
                      </td>
                      <td className="px-2 py-2 text-center text-[12px] font-bold text-lavpop-blue dark:text-blue-400">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="px-2 py-2 text-center text-[14px] font-bold text-lavpop-blue dark:text-blue-400">
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
          ) : (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhuma transação disponível
            </div>
          )}
        </div>

        {/* RISK ALERT */}
        {(customer.riskLevel === 'At Risk' ||
          customer.riskLevel === 'Churning') &&
          customer.daysOverdue > 0 && (
            <div className="mx-5 mb-4 flex gap-3 rounded-lg border-2 px-4 py-3 text-sm bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-700 text-slate-800 dark:text-slate-200">
              <div className="text-xl flex-shrink-0">⚠️</div>
              <div>
                <div className="mb-1 text-[14px] font-bold text-slate-900 dark:text-white">
                  Atenção Necessária
                </div>
                <div className="text-[13px] leading-snug">
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
