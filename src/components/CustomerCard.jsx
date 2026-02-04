// CustomerCard.jsx v6.10 - ADD COMMUNICATION LOGGING
// Premium card design with risk-based ambient glow and action buttons
// Design System v5.0 compliant - Cosmic Precision + Premium Effects
//
// CHANGELOG:
// v6.10 (2026-02-03): Add communication logging
//   - Added addCommunicationEntry() calls to match CustomerProfileModal behavior
//   - Button actions now appear in customer's communication history
// v6.9 (2026-02-03): Buttons replace swipe
//   - Removed swipe-to-action gesture (card too narrow for reliable swipe)
//   - Action buttons now visible on all screen sizes
//   - Added min-h-[44px] for proper mobile touch targets
//   - Better UX: immediate discoverability, easier tap interaction
// v6.4 (2026-01-18): Subtle action buttons
//   - Redesigned buttons as ghost/outline style
//   - Transparent backgrounds with subtle borders
//   - Reduced height: h-10 → h-9
//   - Reduced visual weight: font-semibold → font-medium
//   - Soft hover fills instead of solid fills
//   - Buttons no longer compete with customer information
//   - Focus rings for accessibility
//   - Design System v5.0 compliant: stellar-cyan borders in dark mode
// v6.3 (2026-01-18): Deep Space Premium redesign
//   - Risk-based ambient glow effect (shadow-[0_0_20px_...])
//   - Glassmorphism metric boxes with inner depth
//   - Bolder typography: customer name text-lg, values text-base
//   - Premium hover: glow intensification + subtle lift
//   - Refined risk badge with better visual weight
//   - Action buttons: solid fills, inverted colors (dark/light), no glow
//   - Added backdrop-blur for glass effect
// v6.2 (2026-01-18): Cosmic Precision upgrade
//   - Applied Design System v5.0 cosmic patterns
//   - Container: dark:bg-space-dust, dark:border-stellar-cyan/10
//   - Metrics: dark:bg-space-void/50 backgrounds
//   - Buttons: cosmic styling with stellar-cyan borders and hover effects
//   - Dividers: dark:border-stellar-cyan/10
//   - Fixed text-[10px] → text-xs (minimum 12px per Design System)
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

import React, { useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
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
import { useContactTracking } from '../hooks/useContactTracking';
import { addCommunicationEntry, getDefaultNotes } from '../utils/communicationLog';

// Risk-based gradient system with ambient glow colors
const RISK_GRADIENTS = {
  'Healthy': {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    darkGradient: 'dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-700',
    label: 'Saudável',
    glow: 'rgba(16, 185, 129, 0.15)',      // emerald glow
    glowHover: 'rgba(16, 185, 129, 0.25)',
  },
  'Monitor': {
    gradient: 'from-blue-500 via-indigo-500 to-violet-600',
    darkGradient: 'dark:from-blue-600 dark:via-indigo-600 dark:to-violet-700',
    label: 'Monitorar',
    glow: 'rgba(99, 102, 241, 0.15)',      // indigo glow
    glowHover: 'rgba(99, 102, 241, 0.25)',
  },
  'At Risk': {
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    darkGradient: 'dark:from-amber-600 dark:via-orange-600 dark:to-rose-600',
    label: 'Em Risco',
    glow: 'rgba(245, 158, 11, 0.15)',      // amber glow
    glowHover: 'rgba(245, 158, 11, 0.25)',
  },
  'Churning': {
    gradient: 'from-rose-500 via-red-500 to-pink-600',
    darkGradient: 'dark:from-rose-600 dark:via-red-600 dark:to-pink-700',
    label: 'Crítico',
    glow: 'rgba(239, 68, 68, 0.15)',       // red glow
    glowHover: 'rgba(239, 68, 68, 0.3)',
  },
  'New Customer': {
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    darkGradient: 'dark:from-violet-600 dark:via-purple-600 dark:to-fuchsia-700',
    label: 'Novo',
    glow: 'rgba(139, 92, 246, 0.15)',      // violet glow
    glowHover: 'rgba(139, 92, 246, 0.25)',
  },
  'Lost': {
    gradient: 'from-slate-500 via-gray-500 to-zinc-600',
    darkGradient: 'dark:from-slate-600 dark:via-gray-600 dark:to-zinc-700',
    label: 'Perdido',
    glow: 'rgba(100, 116, 139, 0.1)',      // slate glow (subtle)
    glowHover: 'rgba(100, 116, 139, 0.15)',
  },
};

const CustomerCard = ({ customer, onClick, isContacted = false }) => {
  // Contact tracking (syncs across app with effectiveness tracking)
  const { isContacted: isContactedHook, markContacted } = useContactTracking();
  const customerId = customer.doc || customer.id;
  const contacted = isContacted || isContactedHook(customerId);

  // Customer context for effectiveness tracking
  const customerContext = {
    customerName: customer.name || null,
    riskLevel: customer.riskLevel || null
  };

  // Get risk styling with fallback
  const risk = RISK_GRADIENTS[customer.riskLevel] || RISK_GRADIENTS['Lost'];

  // Check phone validity - use pre-computed flag if available, otherwise validate
  const hasValidPhone = customer.hasValidPhone !== undefined
    ? customer.hasValidPhone
    : (customer.phone && isValidBrazilianMobile(customer.phone));

  const phoneError = !hasValidPhone && customer.phone
    ? getPhoneValidationError(customer.phone)
    : null;

  const handleCall = useCallback((e) => {
    if (e) e.stopPropagation();
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
      // Log to communication history (appears in CustomerProfileModal)
      addCommunicationEntry(customer.doc || customerId, 'call', getDefaultNotes('call'));
      // Mark as contacted with context (for effectiveness tracking)
      if (customerId && !contacted) {
        markContacted(customerId, 'call', customerContext);
      }
    }
  }, [customer.phone, customer.doc, customerId, contacted, markContacted, customerContext]);

  const handleWhatsApp = useCallback((e) => {
    if (e) e.stopPropagation();
    if (hasValidPhone && customer.phone) {
      const cleanPhone = customer.phone.replace(/\D/g, '');
      // Ensure country code for WhatsApp
      const whatsappPhone = cleanPhone.length === 11 ? '55' + cleanPhone : cleanPhone;
      window.open(`https://wa.me/${whatsappPhone}`, '_blank');
      // Log to communication history (appears in CustomerProfileModal)
      addCommunicationEntry(customer.doc || customerId, 'whatsapp', getDefaultNotes('whatsapp'));
      // Mark as contacted with context (for effectiveness tracking)
      if (customerId && !contacted) {
        markContacted(customerId, 'whatsapp', customerContext);
      }
    }
  }, [hasValidPhone, customer.phone, customer.doc, customerId, contacted, markContacted, customerContext]);

  return (
    <div className="relative rounded-2xl h-full">
      {/* Card content */}
      <motion.div
        className={`
          group relative overflow-hidden
          bg-white dark:bg-space-dust
          backdrop-blur-sm
          rounded-2xl
          border border-slate-200/80 dark:border-stellar-cyan/15
          transition-all duration-300 ease-out
          cursor-pointer
          sm:hover:scale-[1.02]
          h-full flex flex-col
        `}
        onClick={onClick}
        style={{
          boxShadow: `0 4px 20px -4px ${risk.glow}, 0 0 0 1px transparent`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 8px 32px -4px ${risk.glowHover}, 0 0 0 1px ${risk.glow}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 4px 20px -4px ${risk.glow}, 0 0 0 1px transparent`;
        }}
      >
      {/* Gradient Accent Header - Thicker for more presence */}
      <div className={`
        h-2 w-full
        bg-gradient-to-r ${risk.gradient} ${risk.darkGradient}
        shadow-sm
      `} />

      {/* Contacted Indicator - Premium Badge */}
      {contacted && (
        <div className="absolute top-4 right-4 z-10">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-white/30 dark:ring-emerald-400/20">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col">

        {/* Header: Name + Risk Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug line-clamp-2 tracking-tight">
              {customer.name}
            </h3>
            {(customer.registrationDate || customer.firstVisit) && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Cliente desde {(customer.registrationDate || customer.firstVisit).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <span className={`
            shrink-0 inline-flex items-center
            px-2.5 py-1 rounded-lg
            text-[11px] font-bold uppercase tracking-wider
            bg-gradient-to-r ${risk.gradient} ${risk.darkGradient}
            text-white shadow-md
            ring-1 ring-white/20
          `}>
            {risk.label}
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-3 pb-3 border-b border-slate-100 dark:border-stellar-cyan/10">
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
            <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-400">
              <Phone className="w-4 h-4 shrink-0" />
              <span className="italic">Sem telefone</span>
            </div>
          )}
        </div>

        {/* Metrics Grid - 2x2 Layout with Glassmorphism */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 flex-1">

          {/* Total Spending */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-space-void/60 dark:to-space-void/40 rounded-xl p-3 border border-slate-200/50 dark:border-stellar-cyan/10 shadow-inner dark:shadow-[inset_0_1px_1px_rgba(0,174,239,0.05)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-emerald-500/15 dark:bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gasto</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(customer.netTotal || 0)}
            </div>
          </div>

          {/* Visit Count (unique days, not raw transactions) */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-space-void/60 dark:to-space-void/40 rounded-xl p-3 border border-slate-200/50 dark:border-stellar-cyan/10 shadow-inner dark:shadow-[inset_0_1px_1px_rgba(0,174,239,0.05)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-blue-500/15 dark:bg-blue-500/20 flex items-center justify-center">
                <Activity className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Visitas</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {customer.visits || customer.transactions || 0}
            </div>
          </div>

          {/* Last Visit */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-space-void/60 dark:to-space-void/40 rounded-xl p-3 border border-slate-200/50 dark:border-stellar-cyan/10 shadow-inner dark:shadow-[inset_0_1px_1px_rgba(0,174,239,0.05)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-purple-500/15 dark:bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Última</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {customer.daysSinceLastVisit !== undefined ? `${customer.daysSinceLastVisit}d` : 'N/A'}
            </div>
          </div>

          {/* Wallet Balance - Special treatment when positive */}
          <div className={`
            rounded-xl p-3 border shadow-inner
            ${customer.walletBalance > 0
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-900/30 dark:to-emerald-900/20 border-emerald-300/60 dark:border-emerald-500/30 dark:shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]'
              : 'bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-space-void/60 dark:to-space-void/40 border-slate-200/50 dark:border-stellar-cyan/10 dark:shadow-[inset_0_1px_1px_rgba(0,174,239,0.05)]'
            }
          `}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${customer.walletBalance > 0 ? 'bg-emerald-500/20 dark:bg-emerald-500/30' : 'bg-slate-400/15 dark:bg-slate-500/20'}`}>
                <Wallet className={`w-3 h-3 ${customer.walletBalance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Carteira</span>
            </div>
            <div className={`text-base font-bold tabular-nums ${customer.walletBalance > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
              {formatCurrency(customer.walletBalance || 0)}
            </div>
          </div>
        </div>

        {/* Action Buttons - Visible on all screen sizes */}
        {customer.phone && (
          <div className="flex gap-2 mt-auto pt-3">
            <button
              onClick={handleCall}
              className="
                flex-1 flex items-center justify-center gap-2
                min-h-[44px] rounded-lg
                bg-transparent
                border border-slate-300 dark:border-stellar-cyan/20
                text-slate-600 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-space-dust
                hover:border-slate-400 dark:hover:border-stellar-cyan/30
                active:scale-[0.97]
                focus:outline-none focus:ring-2 focus:ring-slate-400/50 dark:focus:ring-stellar-cyan/30
                transition-all duration-150 font-medium text-sm
              "
              title="Ligar"
            >
              <Phone className="w-4 h-4" />
              <span>Ligar</span>
            </button>
            <button
              onClick={handleWhatsApp}
              disabled={!hasValidPhone}
              className={`
                flex-1 flex items-center justify-center gap-2
                min-h-[44px] rounded-lg
                font-medium text-sm transition-all duration-150
                active:scale-[0.97]
                ${hasValidPhone
                  ? `bg-transparent
                     border border-emerald-400/60 dark:border-emerald-500/30
                     text-emerald-600 dark:text-emerald-400
                     hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                     hover:border-emerald-500 dark:hover:border-emerald-500/50
                     focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-500/30`
                  : `bg-slate-100/50 dark:bg-space-void/30
                     border border-transparent
                     text-slate-400 dark:text-slate-400
                     cursor-not-allowed opacity-60`
                }
              `}
              title={hasValidPhone ? 'WhatsApp' : (phoneError || 'Número inválido para WhatsApp')}
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        )}

      </div>
      </motion.div>
    </div>
  );
};

export default CustomerCard;
