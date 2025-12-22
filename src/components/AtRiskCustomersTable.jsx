// AtRiskCustomersTable.jsx v9.0 - UX ENHANCEMENTS
// ✅ Quick filter tabs (Todos/Sem contato/Contactados)
// ✅ Last contact info (date + method display)
// ✅ Batch selection with CustomerSegmentModal
// ✅ Search by name
// ✅ Days-to-churn urgency color gradient
// ✅ Enhanced call/whatsapp buttons (no manual checkbox)
// ✅ Sort persistence (localStorage)
// ✅ Keyboard navigation
// ✅ Descriptive column names
//
// CHANGELOG:
// v9.0 (2025-12-16): Major UX enhancements
//   - NEW: Quick filter tabs (Todos/Sem contato/Contactados)
//   - NEW: Last contact info display (date + method)
//   - NEW: Batch selection with checkboxes + "Contatar Selecionados"
//   - NEW: Search by name filter
//   - NEW: Days-to-churn urgency color gradient
//   - NEW: Sort preference persistence in localStorage
//   - IMPROVED: Enhanced call/whatsapp buttons styling
//   - REMOVED: Manual contact checkbox (redundant with auto-track)
//   - IMPROVED: More descriptive column names
// v8.6 (2025-12-14): Blacklist indicator
// v8.5 (2025-12-08): Campaign context tracking
// v8.4 (2025-12-03): Phone validation for WhatsApp

import React, { useState, useMemo, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { Phone, MessageCircle, CheckCircle, ChevronRight, ChevronLeft, ArrowUpDown, Users, Ban, EyeOff, Eye, Search, X, Send } from 'lucide-react';
import { RISK_LABELS } from '../utils/customerMetrics';

// Lazy-load heavy modals
const CustomerProfileModal = lazy(() => import('./CustomerProfileModal'));
const CustomerSegmentModal = lazy(() => import('./modals/CustomerSegmentModal'));
import { formatCurrency } from '../utils/formatters';
import { useContactTracking } from '../hooks/useContactTracking';
import { useBlacklist } from '../hooks/useBlacklist';
import { addCommunicationEntry, getDefaultNotes } from '../utils/communicationLog';
import { isValidBrazilianMobile, normalizePhone } from '../utils/phoneUtils';

const ITEMS_PER_PAGE = 10;
const STORAGE_KEY = 'atRiskTable_sortBy';

// Sort options
const SORT_OPTIONS = {
  days: { label: 'Dias ausente', key: 'daysSinceLastVisit' },
  value: { label: 'Valor gasto', key: 'netTotal' },
  name: { label: 'Nome', key: 'name' }
};

// Filter tabs
const FILTER_TABS = {
  all: { label: 'Todos', color: 'slate' },
  notContacted: { label: 'Sem contato', color: 'red' },
  contacted: { label: 'Contactados', color: 'emerald' }
};

// Days urgency thresholds and colors
const getDaysUrgencyColor = (days) => {
  if (days >= 45) return 'bg-red-600 text-white';
  if (days >= 35) return 'bg-red-500 text-white';
  if (days >= 30) return 'bg-orange-500 text-white';
  if (days >= 25) return 'bg-amber-500 text-white';
  return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
};

const AtRiskCustomersTable = ({ customerMetrics, salesData }) => {
  // State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(() => {
    // Restore from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || 'days';
    }
    return 'days';
  });
  const [showBlacklisted, setShowBlacklisted] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // Default to "Todos"
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [segmentModalOpen, setSegmentModalOpen] = useState(false);

  // Refs for keyboard navigation
  const tableRef = useRef(null);
  const focusedRowRef = useRef(0);

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
  const { isContacted, pendingContacts, markContacted } = useContactTracking({
    customers: allAtRiskCustomers
  });

  // Blacklist management
  const { isBlacklisted, getBlacklistReason } = useBlacklist();

  // Get contact info for a customer
  const getContactInfo = useCallback((customerId) => {
    const contact = pendingContacts[customerId];
    if (!contact) return null;

    const contactedAt = contact.contacted_at ? new Date(contact.contacted_at) : null;
    if (!contactedAt) return null;

    const now = new Date();
    const diffMs = now - contactedAt;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    let timeAgo;
    if (diffDays > 0) {
      timeAgo = `${diffDays}d`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours}h`;
    } else {
      timeAgo = 'agora';
    }

    const methodLabels = {
      whatsapp: 'WhatsApp',
      call: 'Ligação',
      manual: 'Manual',
      campaign: 'Campanha'
    };

    return {
      timeAgo,
      method: methodLabels[contact.contact_method] || contact.contact_method || 'Contato',
      status: contact.status
    };
  }, [pendingContacts]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = [...allAtRiskCustomers];

    // Blacklist filter
    if (!showBlacklisted) {
      filtered = filtered.filter(c => !isBlacklisted(c.phone));
    }

    // Tab filter
    if (filterTab === 'notContacted') {
      filtered = filtered.filter(c => !isContacted(c.doc));
    } else if (filterTab === 'contacted') {
      filtered = filtered.filter(c => isContacted(c.doc));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c =>
        (c.name || '').toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'days':
        return filtered.sort((a, b) => (b.daysSinceLastVisit || 0) - (a.daysSinceLastVisit || 0));
      case 'name':
        return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'value':
      default:
        return filtered.sort((a, b) => (b.netTotal || 0) - (a.netTotal || 0));
    }
  }, [allAtRiskCustomers, sortBy, showBlacklisted, filterTab, searchQuery, isBlacklisted, isContacted]);

  // Stats for tabs
  const tabCounts = useMemo(() => {
    const baseList = showBlacklisted
      ? allAtRiskCustomers
      : allAtRiskCustomers.filter(c => !isBlacklisted(c.phone));

    return {
      all: baseList.length,
      notContacted: baseList.filter(c => !isContacted(c.doc)).length,
      contacted: baseList.filter(c => isContacted(c.doc)).length
    };
  }, [allAtRiskCustomers, showBlacklisted, isBlacklisted, isContacted]);

  // Count blacklisted
  const blacklistedInList = useMemo(() => {
    return allAtRiskCustomers.filter(c => isBlacklisted(c.phone)).length;
  }, [allAtRiskCustomers, isBlacklisted]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab, searchQuery, showBlacklisted]);

  // Persist sort preference
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newSort);
    }
  };

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.doc)));
    }
  }, [filteredCustomers, selectedIds.size]);

  const toggleSelect = useCallback((customerId, e) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  }, []);

  // Open segment modal with selected customers
  const handleOpenSegmentModal = useCallback(() => {
    if (selectedIds.size === 0) return;
    setSegmentModalOpen(true);
  }, [selectedIds.size]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!tableRef.current) return;

    const rows = tableRef.current.querySelectorAll('tr[tabindex="0"]');
    if (!rows.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedRowRef.current = Math.min(focusedRowRef.current + 1, rows.length - 1);
      rows[focusedRowRef.current]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusedRowRef.current = Math.max(focusedRowRef.current - 1, 0);
      rows[focusedRowRef.current]?.focus();
    }
  }, []);

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

  // Phone helpers
  const formatPhone = (phone) => {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    return cleaned.length >= 10 ? cleaned : null;
  };

  const hasValidWhatsApp = (phone) => {
    return phone && isValidBrazilianMobile(phone);
  };

  // Customer context for tracking
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
      if (customerId) {
        addCommunicationEntry(customerId, 'call', getDefaultNotes('call'));
      }
      if (customerId && !isContacted(customerId)) {
        markContacted(customerId, 'call', getCustomerContext(customerId));
      }
    }
  }, [isContacted, markContacted, getCustomerContext]);

  const handleWhatsApp = useCallback((e, phone, customerId) => {
    e?.stopPropagation();
    if (!hasValidWhatsApp(phone)) return;

    const normalized = normalizePhone(phone);
    if (!normalized) return;

    const whatsappNumber = normalized.replace('+', '');
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobileDevice
      ? `https://api.whatsapp.com/send?phone=${whatsappNumber}`
      : `https://web.whatsapp.com/send?phone=${whatsappNumber}`;
    window.open(url, '_blank');
    if (customerId) {
      addCommunicationEntry(customerId, 'whatsapp', getDefaultNotes('whatsapp'));
    }
    if (customerId && !isContacted(customerId)) {
      markContacted(customerId, 'whatsapp', getCustomerContext(customerId));
    }
  }, [isContacted, markContacted, getCustomerContext]);

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

    if (swipeState.direction === 'right' && hasValidWhatsApp(customer.phone)) {
      handleWhatsApp(null, customer.phone, customerId);
    } else if (swipeState.direction === 'left') {
      handleCall(null, customer.phone, customerId);
    }

    setSwipeState({ id: null, direction: null, offset: 0 });
  }, [swipeState.direction, handleWhatsApp, handleCall]);

  const getRiskStyles = (riskLevel) => {
    const riskConfig = RISK_LABELS[riskLevel] || RISK_LABELS['Lost'];
    return {
      borderColorValue: riskConfig.borderColor,
      dot: `bg-${riskConfig.color}-500`,
      label: riskConfig.pt
    };
  };

  // Get selected customers for modal
  const selectedCustomers = useMemo(() => {
    return filteredCustomers.filter(c => selectedIds.has(c.doc));
  }, [filteredCustomers, selectedIds]);

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

            {/* Batch action button */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleOpenSegmentModal}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                Contatar {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Filter Tabs + Search + Sort */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
              {Object.entries(FILTER_TABS).map(([key, { label, color }]) => {
                const count = tabCounts[key];
                const isActive = filterTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilterTab(key)}
                    className={`
                      px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5
                      ${isActive
                        ? key === 'notContacted'
                          ? 'bg-red-600 text-white'
                          : key === 'contacted'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-lavpop-blue text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }
                    `}
                  >
                    {label}
                    <span className={`
                      px-1.5 py-0.5 rounded-full text-[10px] font-bold
                      ${isActive
                        ? 'bg-white/20'
                        : 'bg-slate-100 dark:bg-slate-600'
                      }
                    `}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavpop-blue/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {/* Sort + Blacklist controls */}
            <div className="flex items-center gap-2 sm:ml-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-300"
              >
                {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {blacklistedInList > 0 && (
                <button
                  onClick={() => setShowBlacklisted(!showBlacklisted)}
                  className={`
                    flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg border transition-colors
                    ${showBlacklisted
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                      : 'text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600 hover:text-slate-600'
                    }
                  `}
                  title={showBlacklisted ? 'Ocultar bloqueados' : `Mostrar ${blacklistedInList} bloqueado${blacklistedInList > 1 ? 's' : ''}`}
                >
                  {showBlacklisted ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{blacklistedInList}</span>
                  <Ban className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-4 space-y-2">
          {paginatedCustomers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Nenhum cliente encontrado
            </div>
          ) : (
            paginatedCustomers.map((customer, index) => {
              const styles = getRiskStyles(customer.riskLevel);
              const customerId = customer.doc || `idx-${index}`;
              const contacted = isContacted(customerId);
              const contactInfo = contacted ? getContactInfo(customerId) : null;
              const blacklisted = isBlacklisted(customer.phone);
              const blacklistInfo = blacklisted ? getBlacklistReason(customer.phone) : null;
              const hasPhone = customer.phone && formatPhone(customer.phone);
              const canWhatsApp = hasValidWhatsApp(customer.phone);
              const isSwipingThis = swipeState.id === customerId;
              const canContact = !blacklisted;
              const isSelected = selectedIds.has(customerId);

              return (
                <div key={customerId} className="relative overflow-hidden rounded-xl">
                  {/* Swipe backgrounds */}
                  {hasPhone && !contacted && canContact && (
                    <>
                      {canWhatsApp && (
                        <div className="absolute inset-y-0 left-0 w-16 bg-green-500 flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                      )}
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
                      ${contacted ? 'opacity-70' : ''}
                      ${blacklisted ? 'opacity-60' : ''}
                      ${isSelected ? 'ring-2 ring-lavpop-blue' : ''}
                      transition-transform duration-150 ease-out touch-pan-y
                    `}
                    style={{
                      borderLeftColor: blacklisted ? '#ef4444' : contacted ? '#10b981' : styles.borderColorValue,
                      transform: isSwipingThis ? `translateX(${swipeState.offset}px)` : 'translateX(0)'
                    }}
                    onClick={() => setSelectedCustomer(customer)}
                    onTouchStart={(e) => hasPhone && !contacted && canContact && handleTouchStart(e, customerId)}
                    onTouchMove={(e) => hasPhone && !contacted && canContact && handleTouchMove(e, customerId)}
                    onTouchEnd={() => !contacted && canContact && handleTouchEnd(customer, customerId)}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelect(customerId, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-lavpop-blue focus:ring-lavpop-blue flex-shrink-0"
                    />

                    {/* Avatar/Initial */}
                    <div className="relative flex-shrink-0">
                      <div className={`
                        w-9 h-9 rounded-full flex items-center justify-center shadow-sm font-semibold text-xs
                        ${blacklisted
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-600'
                          : contacted
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                            : 'bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                        }
                      `}>
                        {blacklisted ? <Ban className="w-4 h-4" /> : (customer.name || '?').charAt(0).toUpperCase()}
                      </div>
                      {!contacted && !blacklisted && (
                        <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${styles.dot} border-2 border-slate-50 dark:border-slate-700`} />
                      )}
                    </div>

                    {/* Customer info */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${blacklisted || contacted ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                        {customer.name || 'Sem nome'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        {contacted && contactInfo ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {contactInfo.method} há {contactInfo.timeAgo}
                          </span>
                        ) : (
                          <>
                            <span className={`font-medium ${getDaysUrgencyColor(customer.daysSinceLastVisit || 0).includes('text-white') ? 'text-red-600' : ''}`}>
                              {customer.daysSinceLastVisit || 0}d
                            </span>
                            <span>·</span>
                            <span className="font-medium">{formatCurrency(customer.netTotal || 0)}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>
                </div>
              );
            })
          )}

          {paginatedCustomers.some(c => c.phone && formatPhone(c.phone)) && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-1">
              Deslize ← para ligar{paginatedCustomers.some(c => hasValidWhatsApp(c.phone)) ? ' ou → para WhatsApp' : ''}
            </p>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-hidden" ref={tableRef} onKeyDown={handleKeyDown}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700">
                <th scope="col" className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-lavpop-blue focus:ring-lavpop-blue"
                  />
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Cliente
                  </span>
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Nível de Risco
                  </span>
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Valor Gasto
                  </span>
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Dias Ausente
                  </span>
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Último Contato
                  </span>
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Ações
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer, index) => {
                  const styles = getRiskStyles(customer.riskLevel);
                  const customerId = customer.doc || `idx-${index}`;
                  const contacted = isContacted(customerId);
                  const contactInfo = contacted ? getContactInfo(customerId) : null;
                  const blacklisted = isBlacklisted(customer.phone);
                  const blacklistInfo = blacklisted ? getBlacklistReason(customer.phone) : null;
                  const isSelected = selectedIds.has(customerId);
                  const daysUrgency = getDaysUrgencyColor(customer.daysSinceLastVisit || 0);

                  return (
                    <tr
                      key={customerId}
                      tabIndex={0}
                      className={`
                        group cursor-pointer
                        border-b border-slate-100 dark:border-slate-800
                        hover:bg-slate-50 dark:hover:bg-slate-800/50
                        transition-all duration-200 border-l-4
                        focus-visible:outline-none focus-visible:bg-blue-50 dark:focus-visible:bg-blue-900/20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                        ${contacted ? 'opacity-70' : ''}
                        ${blacklisted ? 'opacity-60' : ''}
                        ${isSelected ? 'bg-lavpop-blue/5' : ''}
                      `}
                      style={{ borderLeftColor: blacklisted ? '#ef4444' : contacted ? '#10b981' : styles.borderColorValue }}
                      onClick={() => setSelectedCustomer(customer)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCustomer(customer);
                        }
                      }}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelect(customerId, e)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-lavpop-blue focus:ring-lavpop-blue"
                        />
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${blacklisted || contacted ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {customer.name || 'Sem nome'}
                          </span>
                          {blacklisted && (
                            <span className="text-red-500 text-xs" title={blacklistInfo?.reason}>Bloqueado</span>
                          )}
                        </div>
                      </td>

                      {/* Risco */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md">
                          <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {styles.label}
                          </span>
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(customer.netTotal || 0)}
                      </td>

                      {/* Dias - with urgency color */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${daysUrgency}`}>
                          {customer.daysSinceLastVisit || 0} dias
                        </span>
                      </td>

                      {/* Último Contato */}
                      <td className="px-4 py-3 text-center">
                        {contactInfo ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {contactInfo.method} há {contactInfo.timeAgo}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Sem contato
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        {blacklisted ? (
                          <div className="flex items-center justify-center">
                            <span className="text-xs text-slate-400 italic">Bloqueado</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {customer.phone && formatPhone(customer.phone) && (
                              <>
                                <button
                                  onClick={(e) => handleCall(e, customer.phone, customerId)}
                                  className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 hover:scale-105 transition-all font-medium text-xs flex items-center gap-1.5"
                                  title="Ligar"
                                >
                                  <Phone className="w-4 h-4" />
                                  <span className="hidden xl:inline">Ligar</span>
                                </button>
                                {hasValidWhatsApp(customer.phone) ? (
                                  <button
                                    onClick={(e) => handleWhatsApp(e, customer.phone, customerId)}
                                    className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 hover:scale-105 transition-all font-medium text-xs flex items-center gap-1.5"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="hidden xl:inline">WhatsApp</span>
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                                    title="Número inválido"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
              {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} de {filteredCustomers.length}
            </div>
            <div className="flex items-center gap-1.5 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-1.5 sm:p-2 rounded-lg transition-all ${currentPage === 1 ? 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all ${pageNum === currentPage ? 'bg-lavpop-blue text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-1.5 sm:p-2 rounded-lg transition-all ${currentPage === totalPages ? 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <CustomerProfileModal
            customer={selectedCustomer}
            sales={salesData}
            onClose={() => setSelectedCustomer(null)}
          />
        </Suspense>
      )}

      {/* Segment Modal for batch actions */}
      {segmentModalOpen && selectedCustomers.length > 0 && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <CustomerSegmentModal
            isOpen={segmentModalOpen}
            onClose={() => {
              setSegmentModalOpen(false);
              setSelectedIds(new Set());
            }}
            title={`Contatar ${selectedCustomers.length} Cliente${selectedCustomers.length > 1 ? 's' : ''}`}
            subtitle="Clientes em risco selecionados"
            icon={Users}
            color="red"
            customers={selectedCustomers}
            audienceType="atRisk"
            contactedIds={new Set(Object.keys(pendingContacts))}
            onOpenCustomerProfile={(id) => {
              const customer = selectedCustomers.find(c => c.doc === id);
              if (customer) setSelectedCustomer(customer);
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default AtRiskCustomersTable;
