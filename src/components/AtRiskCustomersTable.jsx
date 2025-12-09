// AtRiskCustomersTable.jsx v8.5 - CAMPAIGN CONTEXT TRACKING
// ✅ No horizontal scroll
// ✅ Mobile: Card layout with swipe actions (like CustomerListDrilldown)
// ✅ Desktop: Table with all columns visible
// ✅ No phone numbers displayed
// ✅ Row coloring by risk
// ✅ Uses unified RISK_LABELS from customerMetrics.js
// ✅ Accessible table with scope and aria-labels
// ✅ Focus-visible states for keyboard users
// ✅ Contact tracking (shared across app with backend support)
// ✅ Uses CustomerProfileModal (consolidated from CustomerDetailModal)
// ✅ Pagination (5 items per page with smart navigation)
// ✅ Sorting controls (by value, by days absent, by name)
// ✅ Design System v3.1 compliant header
// ✅ Brazilian mobile phone validation for WhatsApp
// ✅ Passes customer context for effectiveness tracking
//
// CHANGELOG:
// v8.5 (2025-12-08): Campaign context tracking
//   - Passes customer name and risk level when marking as contacted
//   - Enables auto-detect returns via useContactTracking
//   - Supports campaign effectiveness metrics
// v8.4 (2025-12-03): Phone validation for WhatsApp
//   - Added Brazilian mobile validation before WhatsApp actions
//   - Disables WhatsApp swipe/buttons for invalid numbers
//   - Uses shared phoneUtils for consistent validation
// v8.3 (2025-12-02): Dark mode card background fix
//   - Fixed semi-transparent card bg showing swipe actions through
//   - Changed dark:bg-slate-700/30 to solid dark:bg-slate-700
// v8.2 (2025-12-01): Mobile responsive fix
//   - Reduced container padding on mobile (p-4 sm:p-6)
//   - Smart pagination (max 5 pages shown, slides with current)
//   - Smaller page buttons on mobile (w-7 h-7)
//   - Pagination stacks vertically on mobile with reordering
// v8.1 (2025-12-01): Mobile swipe actions
//   - Replaced expandable rows with swipe actions on mobile
//   - Card-based layout on mobile (no table overflow)
//   - Swipe left = call, swipe right = WhatsApp
//   - Tap opens CustomerProfileModal directly
//   - Removed redundant dropdown details
// v8.0 (2025-12-01): Pagination and sorting
//   - Added pagination with page navigation
//   - Added sorting controls (value, days, name)
//   - Shows all at-risk customers with page navigation
//   - Improved header design per Design System
// v7.8 (2025-12-01): Communication logging integration
//   - Added addCommunicationEntry for shared communication log
//   - Call/WhatsApp actions now appear in CustomerProfileModal history
// v7.7 (2025-12-01): Modal consolidation
//   - Replaced CustomerDetailModal with CustomerProfileModal
//   - Unified modal experience across Customers view
//   - CustomerProfileModal has 4 tabs and communication logging
// v7.6 (2025-12-01): Shared contact tracking
//   - Added useContactTracking hook for app-wide sync
//   - Contact state indicator and toggle button
//   - Auto-mark as contacted on call/WhatsApp
// v7.5 (2025-12-01): Design System compliance
//   - Fixed text-[10px] violations (min 12px = text-xs)
// v7.4 (2025-11-30): Expandable mobile rows
//   - Added expandable row details for mobile view
//   - Shows risk level, total spent, and days since last visit
//   - Improved mobile UX with tap-to-expand pattern
// v7.3 (2025-11-30): Focus-visible states
//   - Added focus-visible ring to action buttons
//   - Added focus-visible ring to table rows
//   - Added keyboard handler for row activation
// v7.2 (2025-11-30): Accessibility improvements
//   - Added scope="col" to all table headers
//   - Added aria-label to icon buttons
//   - Added aria-describedby for row context
//   - Keyboard navigation support
// v7.1 (2025-11-29): Design System v3.0 compliance
//   - Removed colorMap, uses borderColor from RISK_LABELS
//   - Centralized color configuration
// v7.0 (2025-11-24): Unified risk labels
//   - Imports RISK_LABELS from customerMetrics.js
//   - Consistent Portuguese translations
// v6.1 (2025-11-22): Mobile view optimization
// v6.0 (2025-11-21): No overflow redesign

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Phone, MessageCircle, CheckCircle, ChevronRight, ChevronLeft, Check, ArrowUpDown, Users } from 'lucide-react';
import CustomerProfileModal from './CustomerProfileModal';
import { RISK_LABELS } from '../utils/customerMetrics';
import { formatCurrency } from '../utils/formatters';
import { useContactTracking } from '../hooks/useContactTracking';
import { addCommunicationEntry, getDefaultNotes } from '../utils/communicationLog';
import { isValidBrazilianMobile, normalizePhone } from '../utils/phoneUtils';

const ITEMS_PER_PAGE = 5;

// Sort options - consistent with CustomerListDrilldown
const SORT_OPTIONS = {
  value: { label: 'Por valor', key: 'netTotal' },
  days: { label: 'Por dias ausente', key: 'daysSinceLastVisit' },
  name: { label: 'Por nome', key: 'name' }
};

const AtRiskCustomersTable = ({ customerMetrics, salesData }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('days'); // Default sort by days absent

  // Swipe state for mobile
  const [swipeState, setSwipeState] = useState({ id: null, direction: null, offset: 0 });
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Get all at-risk customers
  const allAtRiskCustomers = useMemo(() => {
    if (!customerMetrics?.activeCustomers) return [];
    return customerMetrics.activeCustomers.filter(
      c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning'
    );
  }, [customerMetrics]);

  // Shared contact tracking (syncs across app, enables auto-detect returns)
  const { isContacted, toggleContacted, markContacted } = useContactTracking({
    customers: allAtRiskCustomers
  });

  // Sort customers based on selected option
  const sortedCustomers = useMemo(() => {
    const sorted = [...allAtRiskCustomers];
    switch (sortBy) {
      case 'days':
        return sorted.sort((a, b) => (b.daysSinceLastVisit || 0) - (a.daysSinceLastVisit || 0));
      case 'name':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'value':
      default:
        return sorted.sort((a, b) => (b.netTotal || 0) - (a.netTotal || 0));
    }
  }, [allAtRiskCustomers, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedCustomers, currentPage]);

  // Reset to page 1 when sort changes
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  if (!customerMetrics?.activeCustomers) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
        Carregando clientes...
      </div>
    );
  }

  if (allAtRiskCustomers.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-8 text-center border border-emerald-200 dark:border-emerald-800 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-2">
          Excelente trabalho!
        </h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Nenhum cliente em risco no momento
        </p>
      </div>
    );
  }

  // Check if phone is valid for calling (any 10+ digit number)
  const formatPhone = (phone) => {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    return cleaned.length >= 10 ? cleaned : null;
  };

  // Check if phone is valid for WhatsApp (Brazilian mobile only)
  const hasValidWhatsApp = (phone) => {
    return phone && isValidBrazilianMobile(phone);
  };

  // Helper to get customer context for tracking
  const getCustomerContext = useCallback((customerId) => {
    const customer = allAtRiskCustomers.find(c => c.doc === customerId);
    return {
      customerName: customer?.name || null,
      riskLevel: customer?.riskLevel || null
    };
  }, [allAtRiskCustomers]);

  const handleCall = useCallback((e, phone, customerId) => {
    e?.stopPropagation();
    const cleaned = formatPhone(phone);
    if (cleaned) {
      window.location.href = `tel:+55${cleaned}`;
      // Log to communication history (syncs with CustomerProfileModal)
      if (customerId) {
        addCommunicationEntry(customerId, 'call', getDefaultNotes('call'));
      }
      // Mark as contacted when calling (with context for effectiveness tracking)
      if (customerId && !isContacted(customerId)) {
        markContacted(customerId, 'call', getCustomerContext(customerId));
      }
    }
  }, [isContacted, markContacted, getCustomerContext]);

  const handleWhatsApp = useCallback((e, phone, customerId) => {
    e?.stopPropagation();
    // Only proceed if phone is a valid Brazilian mobile
    if (!hasValidWhatsApp(phone)) return;

    const normalized = normalizePhone(phone);
    if (!normalized) return;

    // Remove the + prefix for WhatsApp URL
    const whatsappNumber = normalized.replace('+', '');
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobileDevice
      ? `https://api.whatsapp.com/send?phone=${whatsappNumber}`
      : `https://web.whatsapp.com/send?phone=${whatsappNumber}`;
    window.open(url, '_blank');
    // Log to communication history (syncs with CustomerProfileModal)
    if (customerId) {
      addCommunicationEntry(customerId, 'whatsapp', getDefaultNotes('whatsapp'));
    }
    // Mark as contacted when sending WhatsApp (with context for effectiveness tracking)
    if (customerId && !isContacted(customerId)) {
      markContacted(customerId, 'whatsapp', getCustomerContext(customerId));
    }
  }, [isContacted, markContacted, getCustomerContext]);

  const handleMarkContacted = useCallback((e, customerId) => {
    e.stopPropagation();
    if (isContacted(customerId)) {
      // Use toggleContacted for unmarking
      toggleContacted(customerId);
    } else {
      // Use markContacted with context for marking
      markContacted(customerId, 'manual', getCustomerContext(customerId));
    }
  }, [isContacted, toggleContacted, markContacted, getCustomerContext]);

  // Touch handlers for swipe (mobile)
  const handleTouchStart = useCallback((e, customerId) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setSwipeState({ id: customerId, direction: null, offset: 0 });
  }, []);

  const handleTouchMove = useCallback((e, customerId) => {
    if (swipeState.id !== customerId) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Only swipe if horizontal movement is dominant
    if (deltaY > Math.abs(deltaX) * 0.5) return;

    const maxOffset = 64;
    const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    const direction = offset > 20 ? 'right' : offset < -20 ? 'left' : null;

    setSwipeState({ id: customerId, direction, offset });
  }, [swipeState.id]);

  const handleTouchEnd = useCallback((customer, customerId) => {
    if (!swipeState.direction || !customer.phone) {
      setSwipeState({ id: null, direction: null, offset: 0 });
      return;
    }

    // Trigger call/WhatsApp (handlers also log and mark as contacted with context)
    if (swipeState.direction === 'right' && hasValidWhatsApp(customer.phone)) {
      // Only trigger WhatsApp for valid Brazilian mobile
      handleWhatsApp(null, customer.phone, customerId);
    } else if (swipeState.direction === 'left') {
      // Call works for any valid phone
      handleCall(null, customer.phone, customerId);
    }

    setSwipeState({ id: null, direction: null, offset: 0 });
  }, [swipeState.direction, handleWhatsApp, handleCall]);

  const getRiskStyles = (riskLevel) => {
    const riskConfig = RISK_LABELS[riskLevel] || RISK_LABELS['Lost'];

    return {
      borderColorValue: riskConfig.borderColor,
      badge: `${riskConfig.bgClass} dark:${riskConfig.bgClass.replace('bg-', 'bg-')}/40 ${riskConfig.textClass} dark:${riskConfig.textClass}`,
      dot: `bg-${riskConfig.color}-500`,
      label: riskConfig.pt
    };
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Header - Design System v3.1 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center border-l-4 border-red-500">
              <Users className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Clientes em Risco
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {allAtRiskCustomers.length} clientes precisam de atenção
              </p>
            </div>
          </div>

          {/* Sorting Controls */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
              {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => handleSortChange(key)}
                  className={`
                    px-3 py-1.5 text-xs font-medium transition-all
                    ${sortBy === key
                      ? 'bg-lavpop-blue text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Card View (lg:hidden) */}
        <div className="lg:hidden space-y-2">
          {paginatedCustomers.map((customer, index) => {
            const styles = getRiskStyles(customer.riskLevel);
            const customerId = customer.doc || `idx-${index}`;
            const contacted = isContacted(customerId);
            const hasPhone = customer.phone && formatPhone(customer.phone);
            const canWhatsApp = hasValidWhatsApp(customer.phone);
            const isSwipingThis = swipeState.id === customerId;

            return (
              <div
                key={customer.doc || index}
                className="relative overflow-hidden rounded-xl"
              >
                {/* Swipe action backgrounds (mobile only, hide when contacted) */}
                {hasPhone && !contacted && (
                  <>
                    {/* WhatsApp (swipe right) - only if valid Brazilian mobile */}
                    {canWhatsApp && (
                      <div className="absolute inset-y-0 left-0 w-16 bg-green-500 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {/* Call (swipe left) - any valid phone */}
                    <div className="absolute inset-y-0 right-0 w-16 bg-blue-500 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                  </>
                )}

                {/* Card content */}
                <div
                  className={`
                    relative flex items-center gap-3 p-3
                    bg-slate-50 dark:bg-slate-700
                    border-l-4 rounded-xl
                    ${contacted ? 'opacity-60' : ''}
                    transition-transform duration-150 ease-out
                    touch-pan-y
                  `}
                  style={{
                    borderLeftColor: contacted ? '#10b981' : styles.borderColorValue,
                    transform: isSwipingThis ? `translateX(${swipeState.offset}px)` : 'translateX(0)'
                  }}
                  onClick={() => setSelectedCustomer(customer)}
                  onTouchStart={(e) => hasPhone && !contacted && handleTouchStart(e, customerId)}
                  onTouchMove={(e) => hasPhone && !contacted && handleTouchMove(e, customerId)}
                  onTouchEnd={() => !contacted && handleTouchEnd(customer, customerId)}
                >
                  {/* Risk dot indicator */}
                  <div className="relative flex-shrink-0">
                    <div className={`
                      w-9 h-9 rounded-full flex items-center justify-center
                      ${contacted
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      }
                      shadow-sm font-semibold text-xs
                    `}>
                      {contacted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        (customer.name || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    {/* Risk indicator dot */}
                    {!contacted && (
                      <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${styles.dot} border-2 border-slate-50 dark:border-slate-700`} />
                    )}
                  </div>

                  {/* Customer info */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${contacted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {customer.name || 'Sem nome'}
                      {contacted && <span className="text-emerald-500 ml-1.5 text-xs font-normal no-underline">✓</span>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      <span className={styles.dot.replace('bg-', 'text-').replace('-500', '-600')}>{styles.label === 'Em Risco' ? 'Risco' : styles.label}</span>
                      <span className="text-slate-400 dark:text-slate-500"> · </span>
                      <span className="font-medium">{customer.daysSinceLastVisit || 0}d</span>
                      <span className="text-slate-400 dark:text-slate-500"> · </span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{formatCurrency(customer.netTotal || 0)}</span>
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    {/* Mark as contacted */}
                    <button
                      onClick={(e) => handleMarkContacted(e, customerId)}
                      className={`
                        w-10 h-10 flex items-center justify-center
                        rounded-lg border transition-colors
                        ${contacted
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600'
                        }
                      `}
                      title={contacted ? 'Desmarcar' : 'Marcar contactado'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Chevron indicator */}
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              </div>
            );
          })}

          {/* Swipe hint for mobile */}
          {paginatedCustomers.some(c => c.phone && formatPhone(c.phone)) && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-1">
              Deslize ← para ligar{paginatedCustomers.some(c => hasValidWhatsApp(c.phone)) ? ' ou → para WhatsApp' : ''}
            </p>
          )}
        </div>

        {/* Desktop Table View (hidden lg:block) */}
        <div className="hidden lg:block overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700">
                <th scope="col" className="px-4 py-2 text-left">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Cliente
                  </span>
                </th>
                <th scope="col" className="px-4 py-2 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Risco
                  </span>
                </th>
                <th scope="col" className="px-4 py-2 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Total
                  </span>
                </th>
                <th scope="col" className="px-4 py-2 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Dias
                  </span>
                </th>
                <th scope="col" className="px-4 py-2 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Ações
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer, index) => {
                const styles = getRiskStyles(customer.riskLevel);
                const customerId = customer.doc || `idx-${index}`;
                const contacted = isContacted(customerId);

                return (
                  <tr
                    key={customer.doc || index}
                    tabIndex={0}
                    className={`
                      group cursor-pointer
                      border-b border-slate-100 dark:border-slate-800
                      hover:bg-slate-50 dark:hover:bg-slate-800/50
                      hover:shadow-md
                      transition-all duration-200
                      border-l-4
                      focus-visible:outline-none focus-visible:bg-blue-50 dark:focus-visible:bg-blue-900/20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                      ${contacted ? 'opacity-60' : ''}
                    `}
                    style={{ borderLeftColor: contacted ? '#10b981' : styles.borderColorValue }}
                    onClick={() => setSelectedCustomer(customer)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCustomer(customer);
                      }
                    }}
                  >
                    {/* Cliente */}
                    <td className="px-4 py-2">
                      <div className={`font-semibold text-sm ${contacted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {customer.name || 'Sem nome'}
                        {contacted && <span className="text-emerald-500 ml-1.5 text-xs font-normal no-underline">✓</span>}
                      </div>
                    </td>

                    {/* Risco */}
                    <td className="px-4 py-2 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md">
                        <div className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {styles.label}
                        </span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-2 text-center font-bold text-sm text-blue-600 dark:text-blue-400">
                      {formatCurrency(customer.netTotal || 0)}
                    </td>

                    {/* Dias */}
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                        {customer.daysSinceLastVisit || 0}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        {/* Mark as contacted button */}
                        <button
                          onClick={(e) => handleMarkContacted(e, customerId)}
                          className={`
                            p-2 rounded-lg
                            transition-all duration-200
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                            ${contacted
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 focus-visible:ring-emerald-500'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 focus-visible:ring-slate-500'
                            }
                          `}
                          aria-label={contacted ? 'Desmarcar contactado' : 'Marcar como contactado'}
                          title={contacted ? 'Desmarcar' : 'Marcar contactado'}
                        >
                          <Check className="w-4 h-4" aria-hidden="true" />
                        </button>
                        {customer.phone && formatPhone(customer.phone) && (
                          <>
                            <button
                              onClick={(e) => handleCall(e, customer.phone, customerId)}
                              className="
                                p-2 rounded-lg
                                bg-blue-50 dark:bg-blue-900/20
                                text-blue-600 dark:text-blue-400
                                hover:bg-blue-100 dark:hover:bg-blue-900/40
                                hover:scale-110
                                transition-all duration-200
                                group-hover:shadow-md
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                              "
                              aria-label={`Ligar para ${customer.name || 'cliente'}`}
                              title="Ligar"
                            >
                              <Phone className="w-4 h-4" aria-hidden="true" />
                            </button>
                            {/* WhatsApp button - only for valid Brazilian mobile */}
                            {hasValidWhatsApp(customer.phone) ? (
                              <button
                                onClick={(e) => handleWhatsApp(e, customer.phone, customerId)}
                                className="
                                  p-2 rounded-lg
                                  bg-green-50 dark:bg-green-900/20
                                  text-green-600 dark:text-green-400
                                  hover:bg-green-100 dark:hover:bg-green-900/40
                                  hover:scale-110
                                  transition-all duration-200
                                  group-hover:shadow-md
                                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
                                "
                                aria-label={`Enviar WhatsApp para ${customer.name || 'cliente'}`}
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="
                                  p-2 rounded-lg
                                  bg-slate-100 dark:bg-slate-700
                                  text-slate-400 dark:text-slate-500
                                  cursor-not-allowed
                                "
                                aria-label="WhatsApp indisponível - número inválido"
                                title="Número inválido para WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
              {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, allAtRiskCustomers.length)} de {allAtRiskCustomers.length}
            </div>
            <div className="flex items-center gap-1.5 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`
                  p-1.5 sm:p-2 rounded-lg transition-all
                  ${currentPage === 1
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }
                `}
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`
                        w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all
                        ${pageNum === currentPage
                          ? 'bg-lavpop-blue text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`
                  p-1.5 sm:p-2 rounded-lg transition-all
                  ${currentPage === totalPages
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }
                `}
                aria-label="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <CustomerProfileModal
          customer={selectedCustomer}
          sales={salesData}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </>
  );
};

export default AtRiskCustomersTable;
