// CustomerCard.jsx v6.1 - PREMIUM GRADIENT DESIGN
// Modern card design with gradient accents matching Dashboard/SocialMedia views
// Design System v4.0 compliant
//
// CHANGELOG:
// v6.1 (2025-12-23): Enrollment date and visits fix
//   - Added enrollment date under customer name ("Cliente desde...")
//   - Fixed Visitas metric: now shows unique visits (customer.visits) not raw transactions
// v6.0 (2025-12-23): Complete UX redesign
//   - Risk-based gradient top accent strip (3-stop gradients)
//   - Gradient risk badge with uppercase styling
//   - 2x2 metrics grid (Spending, Visits, Last Visit, Wallet)
//   - Contacted indicator overlay with checkmark
//   - Enhanced hover effects (scale + shadow)
//   - Improved dark mode support
//   - New isContacted prop for visual indicator
// v5.3 (2025-12-03): Phone validation indicators
//   - Added Brazilian mobile phone validation
//   - Shows warning icon for invalid/missing phones
//   - Disables WhatsApp button for invalid numbers
// v5.2 (2025-12-01): Improved card visibility
// v5.1 (2025-12-01): Unified risk pill styling
// v5.0 (2025-11-24): Fixed-size clickable card

import React from 'react';
import {
  Phone,
  MessageCircle,
  Wallet,
  AlertTriangle,
  Calendar,
  Activity,
  DollarSign,
  Check
} from 'lucide-react';
import { formatCurrency } from '../utils/numberUtils';
import { isValidBrazilianMobile, getPhoneValidationError } from '../utils/phoneUtils';

// Risk-based gradient system matching HeroKPICard patterns
const RISK_GRADIENTS = {
  'Healthy': {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    darkGradient: 'dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-700',
    label: 'Saudável',
  },
  'Monitor': {
    gradient: 'from-blue-500 via-indigo-500 to-violet-600',
    darkGradient: 'dark:from-blue-600 dark:via-indigo-600 dark:to-violet-700',
    label: 'Monitorar',
  },
  'At Risk': {
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    darkGradient: 'dark:from-amber-600 dark:via-orange-600 dark:to-rose-600',
    label: 'Em Risco',
  },
  'Churning': {
    gradient: 'from-rose-500 via-red-500 to-pink-600',
    darkGradient: 'dark:from-rose-600 dark:via-red-600 dark:to-pink-700',
    label: 'Crítico',
  },
  'New Customer': {
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    darkGradient: 'dark:from-violet-600 dark:via-purple-600 dark:to-fuchsia-700',
    label: 'Novo',
  },
  'Lost': {
    gradient: 'from-slate-500 via-gray-500 to-zinc-600',
    darkGradient: 'dark:from-slate-600 dark:via-gray-600 dark:to-zinc-700',
    label: 'Perdido',
  },
};

const CustomerCard = ({ customer, onClick, isContacted = false }) => {
  // Get risk styling with fallback
  const risk = RISK_GRADIENTS[customer.riskLevel] || RISK_GRADIENTS['Lost'];

  // Check phone validity - use pre-computed flag if available, otherwise validate
  const hasValidPhone = customer.hasValidPhone !== undefined
    ? customer.hasValidPhone
    : (customer.phone && isValidBrazilianMobile(customer.phone));

  const phoneError = !hasValidPhone && customer.phone
    ? getPhoneValidationError(customer.phone)
    : null;

  const handleCall = (e) => {
    e.stopPropagation();
    if (customer.phone) window.location.href = `tel:${customer.phone}`;
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (hasValidPhone && customer.phone) {
      const cleanPhone = customer.phone.replace(/\D/g, '');
      // Ensure country code for WhatsApp
      const whatsappPhone = cleanPhone.length === 11 ? '55' + cleanPhone : cleanPhone;
      window.open(`https://wa.me/${whatsappPhone}`, '_blank');
    }
  };

  return (
    <div
      onClick={onClick}
      className="
        group relative overflow-hidden
        bg-white dark:bg-slate-800
        rounded-2xl
        border border-slate-200 dark:border-slate-700
        shadow-sm
        transition-all duration-200
        cursor-pointer
        hover:shadow-lg hover:scale-[1.02]
        hover:border-slate-300 dark:hover:border-slate-600
        h-full flex flex-col
      "
    >
      {/* Gradient Accent Header (Top Border Effect) */}
      <div className={`
        h-1.5 w-full
        bg-gradient-to-r ${risk.gradient} ${risk.darkGradient}
      `} />

      {/* Contacted Indicator (subtle overlay) */}
      {isContacted && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col">

        {/* Header: Name + Risk Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight line-clamp-2">
              {customer.name}
            </h3>
            {(customer.registrationDate || customer.firstVisit) && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Cliente desde {(customer.registrationDate || customer.firstVisit).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <span className={`
            shrink-0 inline-flex items-center
            px-2 py-1 rounded-full
            text-[10px] font-bold uppercase tracking-wide
            bg-gradient-to-r ${risk.gradient} ${risk.darkGradient}
            text-white shadow-sm
          `}>
            {risk.label}
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          {customer.phone ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Phone className={`w-4 h-4 shrink-0 ${hasValidPhone ? 'text-slate-400' : 'text-amber-500'}`} />
              <span className="truncate">{customer.phone}</span>
              {!hasValidPhone && (
                <span
                  className="shrink-0"
                  title={phoneError || 'Número inválido para WhatsApp'}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
              <Phone className="w-4 h-4 shrink-0" />
              <span className="italic">Sem telefone</span>
            </div>
          )}
        </div>

        {/* Metrics Grid - 2x2 Layout */}
        <div className="grid grid-cols-2 gap-2 mb-3 flex-1">

          {/* Total Spending */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gasto</span>
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-white">
              {formatCurrency(customer.netTotal || 0)}
            </div>
          </div>

          {/* Visit Count (unique days, not raw transactions) */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Visitas</span>
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-white">
              {customer.visits || customer.transactions || 0}
            </div>
          </div>

          {/* Last Visit */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Última</span>
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-white">
              {customer.daysSinceLastVisit !== undefined ? `${customer.daysSinceLastVisit}d` : 'N/A'}
            </div>
          </div>

          {/* Wallet Balance */}
          <div className={`
            rounded-lg p-2.5
            ${customer.walletBalance > 0
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-50 dark:bg-slate-700/50'
            }
          `}>
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className={`w-3.5 h-3.5 ${customer.walletBalance > 0 ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Carteira</span>
            </div>
            <div className={`text-sm font-bold ${customer.walletBalance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
              {formatCurrency(customer.walletBalance || 0)}
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at Bottom */}
        {customer.phone && (
          <div className="flex gap-2 mt-auto pt-2">
            <button
              onClick={handleCall}
              className="
                flex-1 flex items-center justify-center gap-1.5
                px-3 py-2 rounded-lg
                bg-slate-100 dark:bg-slate-700
                text-slate-700 dark:text-slate-300
                hover:bg-lavpop-blue hover:text-white
                transition-colors font-semibold text-xs
              "
              title="Ligar"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Ligar</span>
            </button>
            <button
              onClick={handleWhatsApp}
              disabled={!hasValidPhone}
              className={`
                flex-1 flex items-center justify-center gap-1.5
                px-3 py-2 rounded-lg
                font-semibold text-xs transition-colors
                ${hasValidPhone
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }
              `}
              title={hasValidPhone ? 'WhatsApp' : (phoneError || 'Número inválido para WhatsApp')}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerCard;
