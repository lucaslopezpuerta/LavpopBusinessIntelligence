// AtRiskCustomersTable.jsx v10.6 - PREMIUM GLASS EFFECT
// ✅ Quick filter tabs (Todos/Sem contato/Contactados)
// ✅ Last contact info (date + method display)
// ✅ Batch selection with CustomerSegmentModal
// ✅ Search by name
// ✅ Days-to-churn urgency color gradient
// ✅ Enhanced call/whatsapp buttons (no manual checkbox)
// ✅ Sort persistence (localStorage)
// ✅ Keyboard navigation
// ✅ Descriptive column names
// ✅ Hide checkbox for contacted customers
// ✅ Row swipe actions (call/WhatsApp) work reliably
// ✅ Responsive pagination (10 desktop, 5 mobile)
// ✅ Fills container height when used with flex layout
// ✅ Clickable column headers with chevron sort indicators
//
// CHANGELOG:
// v10.6 (2026-01-23): Premium Glass Effect
//   - Main container: Applied premium glass effect (bg-space-dust/40 + backdrop-blur-xl)
//   - Ring shadows: Light/dark variants for glass depth and stellar glow
//   - Empty state: Updated to glass effect with solid emerald icon
//   - Header border: Subtle glass-compatible border (white/[0.05] dark)
//   - Consistent with RFMScatterPlot.jsx glass pattern
//   - Cosmic compliant: Design System v5.1
// v10.5 (2026-01-23): Avatar Contrast & Header Layout
//   - Fixed avatar contrast: Now uses risk-based colors (amber, red, etc.) instead of invisible white
//   - Moved blocked toggle to header right side for better visibility
//   - Both mobile and desktop avatars now use consistent risk-colored backgrounds
//   - Blocked toggle now has proper title tooltip and larger icons
//
// v10.4 (2026-01-23): Cosmic Precision - Desktop Table Avatars
//   - Desktop table: Added customer avatars with cosmic styling
//   - Contacted customers: Strikethrough on name in both mobile and desktop views
//   - Avatar states: Checkmark for contacted, ban icon for blacklisted, initials for normal
//   - Consistent visual language across all views
//
// v10.3 (2026-01-23): Cosmic Precision - Internal Elements
//   - Filter tabs: Cosmic gradients, stellar borders, refined hover states
//   - Search bar: Stellar focus ring, icon color transition
//   - Blacklist toggle: Redesigned with "Bloqueados" label, clearer count badge
//   - Header icon: Solid style (red bg, white icon) - clean and modern
//   - Pagination: Gradient active state, stellar borders, refined feedback
//   - Mobile cards: Gradient backgrounds, improved touch feedback
//   - Batch action button: Gradient with cosmic shadow
//   - Contacted customers: Green-tinted backgrounds, checkmark badge on avatar
//   - Blacklisted customers: Red-tinted backgrounds for visual clarity
//   - No animations abused - subtle transitions only (200ms)
//   - Cosmic compliant: Design System v5.1
// v10.2 (2026-01-23): Cosmic Precision upgrade
//   - Applied Variant C: Neutral Dashboard Cosmic
//   - Replaced glassmorphism with neutral gradient background
//   - Standardized borders: border-slate-200/80 dark:border-stellar-cyan/10
//   - Removed backdrop-blur for main container (kept gradient transparency)
//   - Updated empty state to use emerald accent-tinted pattern
//   - Cosmic compliant: Design System v5.1
// v10.1 (2026-01-20): Premium Glass Effects
//   - Replaced hard borders with soft glow system
//   - Added ring-1 for subtle edge definition
//   - Added inner top-edge reflection for glass realism
//   - Outer cyan glow in dark mode for layered depth
// v10.0 (2026-01-20): Cosmic Glass Card refactor
//   - Replaced gradient background with glass effect (bg-space-dust/50)
//   - Added backdrop-blur-xl for unified glassmorphism
//   - Softer borders blending with page background
//   - Updated empty and loading states to match glass pattern
// v9.10 (2026-01-15): Column header sorting
//   - NEW: Clickable column headers for sorting (Cliente, Valor, Dias)
//   - NEW: Chevron indicators show current sort column and direction
//   - REMOVED: Dropdown sort selector (replaced by header clicks)
//   - Better UX: Sort by clicking directly on column names
// v9.9 (2026-01-12): Responsive pagination + height fill
//   - NEW: Desktop shows 10 items per page, mobile shows 5
//   - NEW: Component fills available container height with flex layout
//   - NEW: Accepts className prop for container styling
// v9.8 (2026-01-12): Removed swipe view navigation callbacks
//   - REMOVED: onSwipeStart/End props (no longer needed)
//   - Swipe view navigation removed from App.jsx entirely
//   - Row swipe gestures now work without any conflicts
//   - Mobile navigation via bottom nav bar + side menu only
// v9.3 (2026-01-11): UX refinements
//   - CHANGED: Items per page reduced from 10 to 5 for better focus
//   - CHANGED: Hide checkbox for contacted customers (mobile & desktop)
//   - Spacer div maintains layout alignment when checkbox is hidden
// v9.2 (2026-01-11): Green/contacted name text dark mode fix
//   - FIXED: Contacted/blacklisted customer names now have dark:text-slate-400 (mobile card view)
//   - FIXED: Contacted/blacklisted customer names now have dark:text-slate-400 (desktop table view)
// v9.1 (2026-01-11): Dark mode contrast fixes
//   - FIXED: Added dark mode variants to icons (Search, X, ArrowUpDown, ChevronRight)
//   - FIXED: Avatar text colors (text-red-600, text-emerald-600) now have dark variants
//   - FIXED: Days urgency conditional red text now has dark variant
//   - FIXED: "Bloqueado" labels now have proper dark mode contrast
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
import { Phone, MessageCircle, CheckCircle, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Users, Ban, EyeOff, Eye, Search, X, Send } from 'lucide-react';
// Note: ArrowUpDown removed in v9.10 - replaced by clickable column headers with chevrons
import { RISK_LABELS, DAY_THRESHOLDS } from '../utils/customerMetrics';

// Lazy-load heavy modals
const CustomerProfileModal = lazy(() => import('./CustomerProfileModal'));
const CustomerSegmentModal = lazy(() => import('./modals/CustomerSegmentModal'));
import { formatCurrency } from '../utils/formatters';
import { useContactTracking } from '../hooks/useContactTracking';
import { useBlacklist } from '../hooks/useBlacklist';
import { useTheme } from '../contexts/ThemeContext';
import { addCommunicationEntry, getDefaultNotes } from '../utils/communicationLog';
import { isValidBrazilianMobile, normalizePhone } from '../utils/phoneUtils';

const STORAGE_KEY = 'atRiskTable_sortBy';
const STORAGE_KEY_DIR = 'atRiskTable_sortDir';

// Hook for responsive items per page with debounced resize handler
const useItemsPerPage = () => {
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const checkSize = () => {
      // Desktop (lg+): 10 items, Mobile: 5 items
      setItemsPerPage(window.innerWidth >= 1024 ? 10 : 5);
    };

    // Debounce resize events to prevent excessive re-renders
    let timeoutId;
    const debouncedCheckSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkSize, 150);
    };

    checkSize(); // Initial check
    window.addEventListener('resize', debouncedCheckSize);
    return () => {
      window.removeEventListener('resize', debouncedCheckSize);
      clearTimeout(timeoutId);
    };
  }, []);

  return itemsPerPage;
};

// Filter tabs
const FILTER_TABS = {
  all: { label: 'Todos', color: 'slate' },
  notContacted: { label: 'Sem contato', color: 'red' },
  contacted: { label: 'Contactados', color: 'emerald' }
};

// Days urgency thresholds and colors (v3.8.0 - uses DAY_THRESHOLDS)
// Aligned with data-driven thresholds from customerMetrics.js
const getDaysUrgencyColor = (days) => {
  if (days >= DAY_THRESHOLDS.CHURNING) return 'bg-red-600 text-white';      // 60+ days: Critical
  if (days >= DAY_THRESHOLDS.AT_RISK) return 'bg-red-500 text-white';       // 50+ days: At Risk
  if (days >= DAY_THRESHOLDS.MONITOR) return 'bg-orange-500 text-white';    // 40+ days: Monitor
  if (days >= DAY_THRESHOLDS.HEALTHY) return 'bg-amber-500 text-white';     // 30+ days: Overdue
  return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'; // 0-29 days: Normal
};

const AtRiskCustomersTable = ({ customerMetrics, salesData, className = '' }) => {
  const { isDark } = useTheme();

  // Responsive items per page
  const itemsPerPage = useItemsPerPage();

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
  const [sortDirection, setSortDirection] = useState(() => {
    // Restore from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_DIR) || 'desc';
    }
    return 'desc';
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

    // Sort with direction
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'days':
        return filtered.sort((a, b) => multiplier * ((a.daysSinceLastVisit || 0) - (b.daysSinceLastVisit || 0)));
      case 'name':
        return filtered.sort((a, b) => multiplier * (a.name || '').localeCompare(b.name || ''));
      case 'value':
      default:
        return filtered.sort((a, b) => multiplier * ((a.netTotal || 0) - (b.netTotal || 0)));
    }
  }, [allAtRiskCustomers, sortBy, sortDirection, showBlacklisted, filterTab, searchQuery, isBlacklisted, isContacted]);

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

  // Pagination - uses responsive itemsPerPage
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Reset page when items per page changes (screen resize)
  useEffect(() => {
    if (currentPage > Math.ceil(filteredCustomers.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, filteredCustomers.length, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab, searchQuery, showBlacklisted]);

  // Handle column header click for sorting
  const handleColumnSort = useCallback((column) => {
    if (sortBy === column) {
      // Toggle direction if same column
      const newDir = sortDirection === 'desc' ? 'asc' : 'desc';
      setSortDirection(newDir);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_DIR, newDir);
      }
    } else {
      // New column: set to desc (highest first for value/days, Z-A for name)
      setSortBy(column);
      setSortDirection('desc');
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, column);
        localStorage.setItem(STORAGE_KEY_DIR, 'desc');
      }
    }
    setCurrentPage(1);
  }, [sortBy, sortDirection]);

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
      <div className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl
        rounded-2xl p-4
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        text-center text-slate-500 dark:text-slate-400
      `}>
        Carregando clientes...
      </div>
    );
  }

  if (allAtRiskCustomers.length === 0) {
    return (
      <div className={`
        relative
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        border-l-4 border-l-emerald-500 dark:border-l-emerald-400
        rounded-2xl p-8 text-center
      `}>
        <div className="w-16 h-16 bg-emerald-500 dark:bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Excelente trabalho!
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
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

  // Touch handlers for swipe (mobile row actions)
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

    // If more vertical than horizontal, reset and allow normal scroll
    if (deltaY > Math.abs(deltaX) * 0.5) {
      setSwipeState({ id: null, direction: null, offset: 0 });
      return;
    }

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

  // Handle touch cancel (e.g., if user moves finger off screen)
  const handleTouchCancel = useCallback(() => {
    setSwipeState({ id: null, direction: null, offset: 0 });
  }, []);

  const getRiskStyles = (riskLevel) => {
    const riskConfig = RISK_LABELS[riskLevel] || RISK_LABELS['Lost'];
    return {
      borderColorValue: riskConfig.borderColor,
      dot: `bg-${riskConfig.color}-500`,
      label: riskConfig.pt,
      bgClass: riskConfig.bgClass,
      textClass: riskConfig.textClass,
      color: riskConfig.color
    };
  };

  // Get selected customers for modal
  const selectedCustomers = useMemo(() => {
    return filteredCustomers.filter(c => selectedIds.has(c.doc));
  }, [filteredCustomers, selectedIds]);

  return (
    <>
      <div className={`
        relative
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl
        rounded-2xl
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        overflow-hidden h-full flex flex-col
        ${className}
      `}>
        {/* Header - fixed height */}
        <div className={`p-4 sm:p-6 border-b flex-shrink-0 ${isDark ? 'border-white/[0.05]' : 'border-slate-200/60'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Solid icon container */}
              <div className="w-10 h-10 rounded-xl bg-red-500 dark:bg-red-600 flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Clientes em Risco
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {allAtRiskCustomers.length} clientes precisam de atenção
                </p>
              </div>
            </div>

            {/* Header right side - blocked toggle + batch action */}
            <div className="flex items-center gap-3">
              {/* Blocked toggle */}
              {blacklistedInList > 0 && (
                <button
                  onClick={() => setShowBlacklisted(!showBlacklisted)}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-xl border transition-all duration-200
                    ${showBlacklisted
                      ? 'bg-gradient-to-r from-red-500/10 to-red-400/5 dark:from-red-900/40 dark:to-red-900/20 text-red-600 dark:text-red-400 border-red-300/80 dark:border-red-700/50 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-stellar-cyan/15 hover:border-red-300 dark:hover:border-red-700/40 hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400'
                    }
                  `}
                  title={showBlacklisted ? 'Ocultar bloqueados' : 'Mostrar bloqueados'}
                >
                  <Ban className="w-4 h-4" />
                  <span className="hidden sm:inline">Bloqueados</span>
                  <span className={`
                    px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center
                    ${showBlacklisted
                      ? 'bg-red-500/20 text-red-600 dark:text-red-300'
                      : 'bg-slate-200/80 dark:bg-slate-600/50'
                    }
                  `}>
                    {blacklistedInList}
                  </span>
                  {showBlacklisted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              )}
              {/* Batch action button */}
              {selectedIds.size > 0 && (
                <button
                  onClick={handleOpenSegmentModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-red-500/25"
                >
                  <Send className="w-4 h-4" />
                  Contatar {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs + Search + Sort */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200/60 dark:border-stellar-cyan/15 bg-slate-100/50 dark:bg-space-dust/30">
              {Object.entries(FILTER_TABS).map(([key, { label, color }]) => {
                const count = tabCounts[key];
                const isActive = filterTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilterTab(key)}
                    className={`
                      px-3 py-2 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5
                      ${isActive
                        ? key === 'notContacted'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm'
                          : key === 'contacted'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm'
                            : 'bg-gradient-stellar text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-stellar-cyan/10'
                      }
                    `}
                  >
                    {label}
                    <span className={`
                      px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center
                      ${isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200/80 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300'
                      }
                    `}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-stellar-cyan transition-colors duration-200" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-white/80 dark:bg-space-dust/50 border border-slate-200/80 dark:border-stellar-cyan/15 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-stellar-cyan/40 dark:focus:border-stellar-cyan/30 focus:ring-2 focus:ring-stellar-cyan/20 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-stellar-cyan/10 transition-all duration-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Card View - grows to fill space */}
        <div className="lg:hidden p-4 space-y-2 flex-1 overflow-y-auto">
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

                  {/* Card content - uses preventDefault in touch handlers to prevent view navigation conflict */}
                  <div
                    className={`
                      relative flex items-center gap-3 p-3
                      border border-l-4 rounded-xl
                      transition-all duration-200 touch-pan-y
                      active:scale-[0.99]
                      ${contacted
                        ? 'bg-gradient-to-r from-emerald-50/80 to-emerald-25/40 dark:from-emerald-900/30 dark:to-emerald-900/10 border-emerald-200/60 dark:border-emerald-700/30'
                        : blacklisted
                          ? 'bg-gradient-to-r from-red-50/60 to-slate-50 dark:from-red-900/20 dark:to-space-nebula/40 border-red-200/60 dark:border-red-700/30'
                          : 'bg-gradient-to-r from-slate-50 to-white dark:from-space-dust/60 dark:to-space-nebula/40 border-slate-200/60 dark:border-stellar-cyan/10'
                      }
                      ${isSelected ? 'ring-2 ring-stellar-cyan/50 dark:ring-stellar-cyan/40' : ''}
                    `}
                    style={{
                      borderLeftColor: blacklisted ? '#ef4444' : contacted ? '#10b981' : styles.borderColorValue,
                      transform: isSwipingThis ? `translateX(${swipeState.offset}px)` : 'translateX(0)'
                    }}
                    onClick={() => setSelectedCustomer(customer)}
                    onTouchStart={(e) => hasPhone && !contacted && canContact && handleTouchStart(e, customerId)}
                    onTouchMove={(e) => hasPhone && !contacted && canContact && handleTouchMove(e, customerId)}
                    onTouchEnd={() => !contacted && canContact && handleTouchEnd(customer, customerId)}
                    onTouchCancel={handleTouchCancel}
                  >
                    {/* Checkbox - hidden if contacted */}
                    {!contacted ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(customerId, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-300 dark:border-stellar-cyan/30 text-stellar-cyan focus:ring-stellar-cyan/50 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-4 h-4 flex-shrink-0" /> /* Spacer to maintain layout */
                    )}

                    {/* Avatar/Initial */}
                    <div className="relative flex-shrink-0">
                      <div className={`
                        w-9 h-9 rounded-full flex items-center justify-center shadow-sm font-semibold text-xs
                        ${blacklisted
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                          : contacted
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                            : `${styles.bgClass} dark:bg-${styles.color}-900/40 ${styles.textClass} dark:text-${styles.color}-400`
                        }
                      `}>
                        {blacklisted ? <Ban className="w-4 h-4" /> : contacted ? <CheckCircle className="w-4 h-4" /> : (customer.name || '?').charAt(0).toUpperCase()}
                      </div>
                      {/* Risk indicator dot for non-contacted */}
                      {!contacted && !blacklisted && (
                        <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${styles.dot} border-2 border-slate-50 dark:border-slate-700`} />
                      )}
                      {/* Checkmark badge for contacted */}
                      {contacted && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center border-2 border-white dark:border-space-dust shadow-sm">
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Customer info */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${contacted ? 'line-through text-slate-400 dark:text-slate-500' : ''} ${blacklisted && !contacted ? 'text-slate-500 dark:text-slate-400' : ''} ${!blacklisted && !contacted ? 'text-slate-900 dark:text-white' : ''}`}>
                        {customer.name || 'Sem nome'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        {contacted && contactInfo ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {contactInfo.method} há {contactInfo.timeAgo}
                          </span>
                        ) : (
                          <>
                            <span className={`font-medium ${getDaysUrgencyColor(customer.daysSinceLastVisit || 0).includes('text-white') ? 'text-red-600 dark:text-red-400' : ''}`}>
                              {customer.daysSinceLastVisit || 0}d
                            </span>
                            <span>·</span>
                            <span className="font-medium">{formatCurrency(customer.netTotal || 0)}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
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

        {/* Desktop Table View - grows to fill space with sticky headers */}
        <div className="hidden lg:flex lg:flex-col flex-1 overflow-x-auto overflow-y-auto min-h-0" ref={tableRef} onKeyDown={handleKeyDown}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/80 dark:bg-space-dust/60 shadow-sm">
              <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                <th scope="col" className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-lavpop-blue focus:ring-lavpop-blue"
                  />
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleColumnSort('name')}
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-lavpop-blue dark:hover:text-blue-400 group"
                  >
                    <span className={sortBy === 'name' ? 'text-lavpop-blue dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}>
                      Cliente
                    </span>
                    {sortBy === 'name' ? (
                      sortDirection === 'desc' ? (
                        <ChevronDown className="w-3.5 h-3.5 text-lavpop-blue dark:text-blue-400" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-lavpop-blue dark:text-blue-400" />
                      )
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Nível de Risco
                  </span>
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleColumnSort('value')}
                    className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-lavpop-blue dark:hover:text-blue-400 group w-full"
                  >
                    <span className={sortBy === 'value' ? 'text-lavpop-blue dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}>
                      Valor Gasto
                    </span>
                    {sortBy === 'value' ? (
                      sortDirection === 'desc' ? (
                        <ChevronDown className="w-3.5 h-3.5 text-lavpop-blue dark:text-blue-400" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-lavpop-blue dark:text-blue-400" />
                      )
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleColumnSort('days')}
                    className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-lavpop-blue dark:hover:text-blue-400 group w-full"
                  >
                    <span className={sortBy === 'days' ? 'text-lavpop-blue dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}>
                      Dias Ausente
                    </span>
                    {sortBy === 'days' ? (
                      sortDirection === 'desc' ? (
                        <ChevronDown className="w-3.5 h-3.5 text-lavpop-blue dark:text-blue-400" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-lavpop-blue dark:text-blue-400" />
                      )
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
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
                        transition-all duration-200 border-l-4
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                        ${contacted
                          ? 'bg-emerald-50/60 dark:bg-emerald-900/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30'
                          : blacklisted
                            ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-100/40 dark:hover:bg-red-900/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }
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
                      {/* Checkbox - hidden if contacted */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {!contacted ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelect(customerId, e)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-lavpop-blue focus:ring-lavpop-blue"
                          />
                        ) : (
                          <div className="w-4 h-4" /> /* Spacer to maintain layout */
                        )}
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className={`
                              w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm
                              ${blacklisted
                                ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                : contacted
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                  : `${styles.bgClass} dark:bg-${styles.color}-900/40 ${styles.textClass} dark:text-${styles.color}-400`
                              }
                            `}>
                              {blacklisted ? <Ban className="w-4 h-4" /> : contacted ? <CheckCircle className="w-4 h-4" /> : (customer.name || '?').charAt(0).toUpperCase()}
                            </div>
                            {contacted && !blacklisted && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-space-nebula flex items-center justify-center">
                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          {/* Name */}
                          <div className="flex items-center gap-2">
                            <span className={`
                              font-semibold
                              ${contacted ? 'line-through text-slate-400 dark:text-slate-500' : ''}
                              ${blacklisted ? 'text-slate-500 dark:text-slate-400' : ''}
                              ${!contacted && !blacklisted ? 'text-slate-900 dark:text-white' : ''}
                            `}>
                              {customer.name || 'Sem nome'}
                            </span>
                            {blacklisted && (
                              <span className="text-red-500 dark:text-red-400 text-xs" title={blacklistInfo?.reason}>Bloqueado</span>
                            )}
                          </div>
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
                            <span className="text-xs text-slate-500 dark:text-slate-400 italic">Bloqueado</span>
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

        {/* Pagination - fixed height */}
        {totalPages > 1 && (
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t flex-shrink-0 ${isDark ? 'border-white/[0.05] bg-space-dust/20' : 'border-slate-200/60 bg-slate-50/50'}`}>
            <div className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
              {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCustomers.length)} de {filteredCustomers.length}
            </div>
            <div className="flex items-center gap-1.5 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-xl transition-all duration-200 ${currentPage === 1 ? 'bg-slate-100/50 dark:bg-space-dust/30 text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'bg-white/80 dark:bg-space-dust/50 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-stellar-cyan/15 hover:border-stellar-cyan/30 dark:hover:border-stellar-cyan/25 hover:bg-white dark:hover:bg-stellar-cyan/10'}`}
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
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all duration-200 ${pageNum === currentPage ? 'bg-gradient-stellar text-white shadow-md' : 'bg-white/80 dark:bg-space-dust/50 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-stellar-cyan/15 hover:border-stellar-cyan/30 dark:hover:border-stellar-cyan/25 hover:bg-white dark:hover:bg-stellar-cyan/10'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-xl transition-all duration-200 ${currentPage === totalPages ? 'bg-slate-100/50 dark:bg-space-dust/30 text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'bg-white/80 dark:bg-space-dust/50 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-stellar-cyan/15 hover:border-stellar-cyan/30 dark:hover:border-stellar-cyan/25 hover:bg-white dark:hover:bg-stellar-cyan/10'}`}
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
