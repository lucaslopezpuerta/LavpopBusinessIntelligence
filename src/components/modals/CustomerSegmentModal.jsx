// CustomerSegmentModal.jsx v4.0 - COSMIC PRECISION UPGRADE
// Premium modal with glassmorphism, staggered animations, and cosmic theming
// Design System v5.1 compliant - Variant D (Glassmorphism)
//
// CHANGELOG:
// v4.0 (2026-01-28): Cosmic Precision Design System upgrade
//   - Applied Variant D glassmorphism (space-dust/95, stellar-cyan borders)
//   - Added useTheme() for reliable dark mode theming
//   - Premium header with gradient icon box and glow effects
//   - Campaign sections with cosmic card styling
//   - Filter controls converted to animated toggle pills
//   - Customer list with staggered entrance animations (STAGGER.FAST)
//   - Gradient avatars and animated checkmarks (SPRING.BOUNCY)
//   - Enhanced swipe handle with drag feedback (moved to handle area only)
//   - EmptyState component integration
//   - All animations respect prefers-reduced-motion
//   - Premium hover states with lift/shadow effects
//   - Fixed: daysSinceFirstVisit now displays for FirstVisitConversion customers
// v3.1 (2026-01-28): Mobile full-screen and safe area fix
//   - Changed to bottom-sheet style on mobile (items-end, rounded-t-2xl)
//   - Uses h-[100dvh] for proper full-screen on mobile (dynamic viewport height)
//   - pt-safe now works with new CSS definition (max with Android fallback)
// v3.0 (2026-01-27): Animation standardization
//   - Uses MODAL constants from animations.js
//   - Added useReducedMotion hook for accessibility
//   - Consistent animation timing with other modals
// v2.9 (2026-01-27): Toast notifications
//   - Replaced browser alert() with useToast() for user feedback
//   - Success/warning/error toasts for automation and campaign actions
//   - Removed emoji prefixes (toast icons handle visual feedback)
// v2.8 (2026-01-12): Refactored to useScrollLock hook
//   - Replaced inline scroll lock useEffect with shared useScrollLock hook
//   - Reduces code duplication across modals
// v2.7 (2026-01-12): Full-screen safe area compliance
//   - Added pt-safe to modal container for top notch/Dynamic Island on mobile
//   - Full-screen mobile modals now respect both top and bottom safe areas
// v2.6 (2026-01-12): iOS-compatible scroll lock
//   - Upgraded scroll lock to fixed position method for iOS Safari
//   - Preserves scroll position when modal closes
// v2.5 (2026-01-11): Separated selection count
//   - CHANGED: Checkbox + "Selecionar todos" label separated from count
//   - CHANGED: Count always shows number (0 / 36) even when none selected
//   - Layout: [☐] Selecionar todos   0 / 36   |   [☐](17) [☐](2)
// v2.4 (2026-01-11): Compact single-row filter layout
// v2.3 (2026-01-11): Explicit checkbox filter UX
// v2.2 (2026-01-11): Clear filter visibility UX (superseded)
// v2.1 (2026-01-11): Mobile UX polish
//   - CHANGED: Campaign sections expanded by default (user preference)
//   - IMPROVED: Filter controls redesigned as compact pill buttons
//   - IMPROVED: Manual campaign section with modern dropdown and blue accent theme
//   - IMPROVED: Better visual hierarchy and touch targets on mobile
// v2.0 (2026-01-11): Full-screen mobile layout for better list scrolling
//   - CHANGED: Modal is now full-screen on mobile (< sm breakpoint)
//   - CHANGED: Campaign sections collapsible on mobile to maximize list space
//   - IMPROVED: Customer list now takes flex-1 with proper min-height
//   - IMPROVED: Sticky filter controls for easier access while scrolling
//   - IMPROVED: max-h-[95vh] on mobile for more vertical space
// v1.9 (2026-01-11): Mobile UX improvements
//   - FIXED: text-[10px] violations → text-xs (12px minimum for accessibility)
//   - IMPROVED: Swipe threshold 120→80px for easier mobile dismiss
//   - ADDED: Haptic feedback on selections and actions
//   - IMPROVED: Touch targets for checkboxes (wrapped in larger tap area)
//   - ADDED: Safe area padding for notched devices (safe-area-pb)
// v1.8 (2026-01-07): Focus ring standardization and glass morphism
//   - Added focus-visible rings to close button and navigation buttons
//   - Changed checkboxes from focus: to focus-visible: for better keyboard UX
//   - Added glass morphism to modal container (bg-white/95 backdrop-blur-xl)
// v1.7 (2025-12-18): Added swipe-to-close gesture for mobile
//   - NEW: Swipe down to close modal on mobile
//   - Uses useSwipeToClose hook for gesture handling
//   - Visual feedback during drag
// v1.6 (2025-12-16): Standardized z-index system
//   - Uses z-50 (MODAL_PRIMARY) from shared z-index constants
//   - Consistent layering: primary modals (50) < child modals (60)
// v1.5 (2025-12-15): Fixed contacted status display + default filter
//   - hideContacted now defaults to true (better for campaign targeting)
//   - Backend updated to include 'queued' status in contacted check
// v1.4 (2025-12-15): Removed WhatsApp/Call buttons
//   - Modal now focused on campaign/automation actions only
//   - Individual contact actions available via customer profile modal
// v1.3 (2025-12-15): Fixed duplicate contact_tracking records bug
//   - Removed onMarkContacted call after handleIncludeInAutomation
//   - That call was creating a second "Contato Manual" record with wrong data
//   - Now dispatches 'contact-tracking-changed' event to refresh UI instead
// v1.2 (2025-12-15): Portal rendering + phone field fixes
//   - Uses React Portal to render at document.body (fixes modal inside chart containers)
//   - Fixed phone field to check both 'phone' and 'telefone' (different data sources)
//   - Added blacklist count to toggle label like AtRiskCustomersTable
// v1.1 (2025-12-15): Implemented automation and manual campaign integration
//   - Added real API call to include customers in automation queue
//   - Added integration with existing manual campaigns
//   - Uses contact_tracking with priority_source for automation queue
// v1.0 (2025-12-15): Initial implementation
//   - Two-track campaign integration (automated + manual)
//   - Selection modes: Select All + individual checkboxes
//   - Filter toggles: hide contacted, hide blacklisted
//   - Click customer name to open profile modal

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Check, ChevronRight, ChevronDown,
  Plus, RefreshCw
} from 'lucide-react';
import { MODAL, SPRING, STAGGER } from '../../constants/animations';
import { useBlacklist } from '../../hooks/useBlacklist';
import { useActiveCampaigns } from '../../hooks/useActiveCampaigns';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { normalizePhone } from '../../utils/phoneUtils';
import { api } from '../../utils/apiService';
import { haptics } from '../../utils/haptics';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { HapticCheckbox } from '../ui/HapticCheckbox';
import { Badge } from '../ui/badge';
import CosmicDropdown from '../ui/CosmicDropdown';
import EmptyState from '../ui/EmptyState';

// Items per page for pagination
const ITEMS_PER_PAGE = 10;

// Cosmic color mapping for gradient icon boxes
const colorMapCosmic = {
  green: {
    light: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    dark: 'bg-gradient-to-br from-emerald-500/90 to-emerald-700/90'
  },
  blue: {
    light: 'bg-gradient-to-br from-blue-400 to-blue-600',
    dark: 'bg-gradient-to-br from-stellar-cyan/90 to-blue-600/90'
  },
  purple: {
    light: 'bg-gradient-to-br from-purple-400 to-purple-600',
    dark: 'bg-gradient-to-br from-purple-500/90 to-purple-700/90'
  },
  cyan: {
    light: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
    dark: 'bg-gradient-to-br from-stellar-cyan/90 to-cyan-600/90'
  },
  amber: {
    light: 'bg-gradient-to-br from-amber-400 to-amber-600',
    dark: 'bg-gradient-to-br from-amber-500/90 to-amber-700/90'
  },
  red: {
    light: 'bg-gradient-to-br from-red-400 to-red-600',
    dark: 'bg-gradient-to-br from-red-500/90 to-red-700/90'
  },
  slate: {
    light: 'bg-gradient-to-br from-slate-400 to-slate-600',
    dark: 'bg-gradient-to-br from-slate-500/90 to-slate-700/90'
  }
};

// Customer list stagger animation variants
const customerListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      ...STAGGER.FAST,
      when: 'beforeChildren'
    }
  }
};

// Individual customer card animation
const customerCardVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING.QUICK
  }
};

// Checkmark animation for selections
const checkmarkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: SPRING.BOUNCY
  }
};

/**
 * CustomerSegmentModal - displays filtered customer lists with campaign integration
 */
const CustomerSegmentModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon = Users,
  color = 'slate',
  customers = [],
  audienceType = 'atRisk',
  contactedIds = new Set(),
  onOpenCustomerProfile,
  onCreateCampaign,
  onMarkContacted
}) => {
  // State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [hideContacted, setHideContacted] = useState(true);  // v1.5: Default true for campaign targeting
  const [hideBlacklisted, setHideBlacklisted] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedManualCampaign, setSelectedManualCampaign] = useState('');
  const [isAddingToAutomation, setIsAddingToAutomation] = useState(false);
  const [campaignSectionCollapsed, setCampaignSectionCollapsed] = useState(false); // v2.1: Expanded by default

  // Hooks
  const { isBlacklisted, getBlacklistReason } = useBlacklist();
  const { getCampaignsForAudience, isLoading: campaignsLoading } = useActiveCampaigns();
  const { success, warning, error: showError } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();

  // Swipe-to-close for mobile (threshold lowered for easier mobile dismiss)
  const { handlers: swipeHandlers, style: swipeStyle, isDragging, progress } = useSwipeToClose({
    onClose,
    threshold: 80,
    resistance: 0.5,
  });

  // Get matching campaigns for this audience type
  const { automated, manual } = useMemo(() => {
    return getCampaignsForAudience(audienceType);
  }, [audienceType, getCampaignsForAudience]);

  // Filter customers based on toggles
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    if (hideContacted) {
      filtered = filtered.filter(c => !contactedIds.has(String(c.id || c.doc)));
    }

    if (hideBlacklisted) {
      // Check both phone and telefone fields (different data sources use different names)
      filtered = filtered.filter(c => {
        const phone = c.phone || c.telefone;
        return !isBlacklisted(phone);
      });
    }

    return filtered;
  }, [customers, hideContacted, hideBlacklisted, contactedIds, isBlacklisted]);

  // Stats
  const stats = useMemo(() => {
    const total = customers.length;
    const contacted = customers.filter(c => contactedIds.has(String(c.id || c.doc))).length;
    const notContacted = total - contacted;
    const blacklisted = customers.filter(c => {
      const phone = c.phone || c.telefone;
      return isBlacklisted(phone);
    }).length;

    return { total, contacted, notContacted, blacklisted };
  }, [customers, contactedIds, isBlacklisted]);

  // Paginated display list
  const displayList = useMemo(() => {
    return filteredCustomers.slice(0, visibleCount);
  }, [filteredCustomers, visibleCount]);

  const hasMore = filteredCustomers.length > visibleCount;
  const remaining = filteredCustomers.length - visibleCount;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setVisibleCount(ITEMS_PER_PAGE);
      setSelectedManualCampaign('');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // iOS-compatible scroll lock - prevents body scroll while modal is open
  useScrollLock(isOpen);

  // Selection handlers with haptic feedback
  const toggleSelectAll = useCallback(() => {
    haptics.light();
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id || c.doc)));
    }
  }, [filteredCustomers, selectedIds.size]);

  const toggleSelect = useCallback((customerId) => {
    haptics.light();
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

  // Campaign handlers
  const handleIncludeInAutomation = useCallback(async (automationId) => {
    if (selectedIds.size === 0) return;

    setIsAddingToAutomation(true);
    try {
      // Create priority queue entries for selected customers
      // This marks them for immediate processing by the automation
      const customerIds = Array.from(selectedIds);
      const automation = automated.find(a => a.id === automationId);
      const automationName = automation?.name || automationId;

      // Record each customer as priority for this automation
      // Uses contact_tracking with priority_source for scheduler processing
      // campaign_id format: AUTO_{rule_id} to match automation campaign tracking
      const results = await Promise.allSettled(
        customerIds.map(async (customerId) => {
          const customer = customers.find(c => (c.id || c.doc) === customerId);
          return api.contacts.create({
            customer_id: customerId,
            customer_name: customer?.name || customer?.nome || null,
            contact_method: 'whatsapp',
            campaign_id: `AUTO_${automationId}`,
            campaign_name: `Auto: ${automationName}`,
            campaign_type: automation?.campaign_type || null,
            risk_level: customer?.riskLevel || customer?.risk_level || null,
            phone: customer?.phone || customer?.telefone || null,
            status: 'queued',
            priority_source: 'manual_inclusion',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        haptics.success();
        success(`${successCount} clientes incluídos na fila de "${automationName}"${failedCount > 0 ? ` (${failedCount} falharam)` : ''}`);
        setSelectedIds(new Set());
        // Note: Don't call onMarkContacted here - it creates a duplicate record!
        // The contact_tracking entry was already created by api.contacts.create above.
        // Just dispatch event to refresh UI
        window.dispatchEvent(new CustomEvent('contact-tracking-changed'));
      } else {
        haptics.warning();
        warning('Não foi possível incluir os clientes na automação');
      }
    } catch (err) {
      console.error('Failed to add to automation:', err);
      showError('Erro ao incluir clientes na automação: ' + err.message);
    } finally {
      setIsAddingToAutomation(false);
    }
  }, [selectedIds, automated, customers]);

  const handleAddToManualCampaign = useCallback(async () => {
    if (selectedIds.size === 0 || !selectedManualCampaign) return;

    setIsAddingToAutomation(true);
    try {
      // Add customers to the selected manual campaign
      const customerIds = Array.from(selectedIds);
      const campaign = manual.find(c => c.id === selectedManualCampaign);
      const campaignName = campaign?.name || 'Campanha';

      // Record each customer as a campaign contact
      const results = await Promise.allSettled(
        customerIds.map(async (customerId) => {
          const customer = customers.find(c => (c.id || c.doc) === customerId);
          return api.campaignContacts.record({
            campaignId: selectedManualCampaign,
            customerId: customerId,
            customerName: customer?.name || null,
            phone: (customer?.phone || customer?.telefone) ? normalizePhone(customer.phone || customer.telefone) : null,
            contactMethod: 'whatsapp',
            status: 'queued'
          });
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        haptics.success();
        success(`${successCount} clientes adicionados à campanha "${campaignName}"${failedCount > 0 ? ` (${failedCount} falharam)` : ''}`);
        setSelectedIds(new Set());
        setSelectedManualCampaign('');
        onMarkContacted?.(customerIds[0], 'campaign');
      } else {
        haptics.warning();
        warning('Não foi possível adicionar os clientes à campanha');
      }
    } catch (err) {
      console.error('Failed to add to campaign:', err);
      showError('Erro ao adicionar clientes à campanha: ' + err.message);
    } finally {
      setIsAddingToAutomation(false);
    }
  }, [selectedIds, selectedManualCampaign, manual, customers, onMarkContacted]);

  const handleCreateNewCampaign = useCallback(() => {
    if (selectedIds.size === 0) return;
    onCreateCampaign?.(Array.from(selectedIds));
    onClose();
  }, [selectedIds, onCreateCampaign, onClose]);

  // Customer row click
  const handleCustomerClick = useCallback((customer) => {
    onOpenCustomerProfile?.(customer.id || customer.doc);
  }, [onOpenCustomerProfile]);

  // Format helpers
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const maskPhone = (phone) => {
    if (!phone) return '****';
    const cleaned = String(phone).replace(/\D/g, '');
    return `****${cleaned.slice(-4)}`;
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - scrollable to ensure modal can always be closed */}
          <motion.div
            {...(prefersReducedMotion ? MODAL.BACKDROP_REDUCED : MODAL.BACKDROP)}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          >
            {/* Centering wrapper - full-screen on mobile, centered on desktop */}
            <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
              {/* Modal Container - Full-screen on mobile, constrained on desktop */}
              <motion.div
                role="dialog"
                aria-modal="true"
                {...(prefersReducedMotion ? MODAL.CONTENT_REDUCED : MODAL.CONTENT)}
                onClick={(e) => e.stopPropagation()}
                className={`
                  relative w-full sm:max-w-2xl
                  ${isDark ? 'bg-space-dust/95' : 'bg-white/95'}
                  backdrop-blur-xl
                  rounded-t-2xl sm:rounded-2xl
                  shadow-2xl
                  border-0 sm:border
                  ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
                  flex flex-col h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:my-4
                  pt-safe sm:pt-0
                `}
                style={swipeStyle}
              >
              {/* Swipe handle area - only this region triggers swipe-to-close (prevents conflict with list scrolling) */}
              <div
                {...swipeHandlers}
                className="lg:hidden flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-pan-x"
              >
                <motion.div
                  className={`h-1.5 rounded-full transition-colors ${
                    isDragging
                      ? isDark ? 'bg-stellar-cyan/60' : 'bg-slate-400'
                      : isDark ? 'bg-stellar-cyan/20' : 'bg-slate-300'
                  }`}
                  animate={{
                    width: isDragging ? 64 : 48,
                    opacity: isDragging ? 1 : 0.8
                  }}
                  transition={prefersReducedMotion ? { duration: 0 } : SPRING.QUICK}
                />
              </div>

              {/* Header */}
              <div className={`
                flex items-center justify-between p-4 sm:p-5
                border-b ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
                bg-gradient-to-r ${isDark ? 'from-space-nebula to-space-dust' : 'from-slate-50 to-white'}
              `}>
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center
                    ${isDark
                      ? `${colorMapCosmic[color]?.dark || colorMapCosmic.slate.dark} shadow-lg`
                      : colorMapCosmic[color]?.light || colorMapCosmic.slate.light
                    }
                    transition-all duration-200
                  `}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {title}
                    </h2>
                    <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {subtitle || `${stats.total} clientes | ${stats.notContacted} sem contato`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    haptics.light();
                    onClose();
                  }}
                  className={`
                    p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full
                    transition-all duration-200
                    ${isDark
                      ? 'text-slate-400 hover:bg-stellar-cyan/10 hover:text-stellar-cyan'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40
                  `}
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Campaign Integration Section - Collapsible on mobile */}
              <div className={`
                border-b ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
                ${isDark ? 'bg-space-nebula/50' : 'bg-slate-50/80'}
              `}>
                {/* Collapse toggle - mobile only */}
                <button
                  onClick={() => setCampaignSectionCollapsed(!campaignSectionCollapsed)}
                  className={`
                    sm:hidden w-full px-4 py-3 flex items-center justify-between text-left
                    ${isDark ? 'text-slate-400' : 'text-slate-500'}
                  `}
                >
                  <span className={`text-xs font-bold uppercase ${isDark ? 'text-stellar-cyan/70' : 'text-slate-500'}`}>
                    Campanhas & Automações
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      campaignSectionCollapsed ? '' : 'rotate-180'
                    } ${isDark ? 'text-stellar-cyan/50' : 'text-slate-400'}`}
                  />
                </button>

                {/* Campaign content - always visible on desktop, collapsible on mobile */}
                <div className={`px-4 sm:px-5 pb-3 sm:py-3 space-y-3 ${
                  campaignSectionCollapsed ? 'hidden sm:block' : 'block'
                }`}>
                  {/* Automated Campaigns */}
                  {automated.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold uppercase mb-2 ${isDark ? 'text-purple-400' : 'text-slate-500'}`}>
                        Automações
                      </p>
                      <div className="space-y-2">
                        {automated.map(rule => (
                          <div
                            key={rule.id}
                            className={`
                              flex items-center justify-between rounded-xl px-4 py-3 border
                              transition-all duration-200
                              ${isDark
                                ? 'bg-space-dust/60 border-purple-500/20 hover:border-purple-500/40'
                                : 'bg-white border-slate-200 hover:border-purple-300'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/15' : 'bg-purple-100'}`}>
                                <RefreshCw className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                              </div>
                              <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                {rule.name}
                              </span>
                              <span className={`
                                text-xs px-2 py-0.5 rounded-full
                                ${isDark
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-emerald-100 text-emerald-700'
                                }
                              `}>
                                Ativa
                              </span>
                            </div>
                            <button
                              onClick={() => handleIncludeInAutomation(rule.id)}
                              disabled={selectedIds.size === 0 || isAddingToAutomation}
                              className={`
                                text-xs font-medium flex items-center gap-1 min-h-[44px] px-3 -mr-3 rounded-lg
                                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                ${isDark
                                  ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/15'
                                  : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                                }
                              `}
                            >
                              {isAddingToAutomation ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              Incluir Selecionados
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual Campaigns - Cosmic card layout with stellar accent */}
                  <div className={`
                    rounded-xl p-4 border
                    ${isDark
                      ? 'bg-stellar-cyan/5 border-stellar-cyan/20'
                      : 'bg-blue-50/50 border-blue-100'
                    }
                  `}>
                    <p className={`
                      text-xs font-bold uppercase mb-3 flex items-center gap-1.5
                      ${isDark ? 'text-stellar-cyan' : 'text-blue-600'}
                    `}>
                      <Users className="w-3.5 h-3.5" />
                      Campanhas Manuais
                    </p>
                    {/* Dropdown row - using CosmicDropdown */}
                    <div className="mb-3">
                      <CosmicDropdown
                        value={selectedManualCampaign}
                        onChange={setSelectedManualCampaign}
                        options={[
                          { value: '', label: 'Selecionar Campanha...' },
                          ...manual.map(campaign => ({
                            value: campaign.id,
                            label: campaign.name
                          }))
                        ]}
                        className="w-full"
                      />
                    </div>
                    {/* Action buttons row */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={handleAddToManualCampaign}
                        disabled={selectedIds.size === 0 || !selectedManualCampaign}
                        className={`
                          flex-1 min-h-[44px] text-sm font-semibold rounded-xl
                          transition-all duration-200
                          flex items-center justify-center gap-2
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40
                          ${selectedIds.size > 0 && selectedManualCampaign
                            ? isDark
                              ? 'bg-gradient-to-r from-stellar-blue to-stellar-cyan text-white hover:shadow-lg hover:shadow-stellar-cyan/20'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                            : isDark
                              ? 'bg-space-void/50 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }
                        `}
                        whileTap={selectedIds.size > 0 && selectedManualCampaign && !prefersReducedMotion ? { scale: 0.98 } : undefined}
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar à Campanha
                      </motion.button>
                      {onCreateCampaign && (
                        <motion.button
                          onClick={handleCreateNewCampaign}
                          disabled={selectedIds.size === 0}
                          className={`
                            min-h-[44px] px-4 text-sm font-medium rounded-xl
                            border transition-all duration-200
                            flex items-center gap-1.5
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40
                            ${selectedIds.size > 0
                              ? isDark
                                ? 'bg-space-dust text-stellar-cyan border-stellar-cyan/30 hover:bg-stellar-cyan/10 hover:border-stellar-cyan/50'
                                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                              : isDark
                                ? 'bg-space-void/50 text-slate-500 border-slate-700 cursor-not-allowed'
                                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            }
                          `}
                          whileTap={selectedIds.size > 0 && !prefersReducedMotion ? { scale: 0.98 } : undefined}
                        >
                          <Plus className="w-4 h-4" />
                          Nova
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Controls - Compact single-row layout with cosmic styling */}
              <div className={`
                px-3 sm:px-5 py-3
                border-b ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
                ${isDark ? 'bg-space-nebula/30' : 'bg-slate-50/50'}
              `}>
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Selection toggle + count (separated) */}
                  <div className="flex items-center gap-3">
                    {/* Checkbox + label with animated checkmark */}
                    <motion.button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 min-h-[36px] group"
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    >
                      <motion.div
                        className={`
                          w-5 h-5 rounded-md border-2 flex items-center justify-center
                          transition-colors duration-150
                          ${selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0
                            ? isDark ? 'border-stellar-cyan bg-stellar-cyan' : 'border-blue-500 bg-blue-500'
                            : selectedIds.size > 0
                              ? isDark ? 'border-stellar-cyan bg-stellar-cyan' : 'border-blue-500 bg-blue-500'
                              : isDark ? 'border-slate-500 group-hover:border-stellar-cyan/60' : 'border-slate-300 group-hover:border-blue-400'
                          }
                        `}
                      >
                        <AnimatePresence>
                          {selectedIds.size > 0 && (
                            <motion.div
                              variants={prefersReducedMotion ? undefined : checkmarkVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                            >
                              <Check className="w-3.5 h-3.5 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        Selecionar todos
                      </span>
                    </motion.button>
                    {/* Count - always visible, separated */}
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {selectedIds.size}
                      <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}> / {filteredCustomers.length}</span>
                    </span>
                  </div>

                  {/* Right: Filter toggle pills */}
                  <div className="flex items-center gap-2">
                    {/* Contacted toggle pill */}
                    <motion.button
                      onClick={() => {
                        haptics.light();
                        setHideContacted(!hideContacted);
                      }}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                        border transition-all duration-200
                        ${!hideContacted
                          ? isDark
                            ? 'bg-stellar-cyan/20 text-stellar-cyan border-stellar-cyan/30'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                          : isDark
                            ? 'bg-space-dust text-slate-400 border-stellar-cyan/10 hover:border-stellar-cyan/20'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300'
                        }
                      `}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                    >
                      <motion.div
                        initial={false}
                        animate={{ scale: !hideContacted ? 1 : 0.8, opacity: !hideContacted ? 1 : 0.5 }}
                        transition={prefersReducedMotion ? { duration: 0 } : SPRING.QUICK}
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                      <span className="hidden sm:inline">Contactados</span>
                      <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>({stats.contacted})</span>
                    </motion.button>

                    {/* Blacklisted toggle pill */}
                    <motion.button
                      onClick={() => {
                        haptics.light();
                        setHideBlacklisted(!hideBlacklisted);
                      }}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                        border transition-all duration-200
                        ${!hideBlacklisted
                          ? isDark
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-red-100 text-red-700 border-red-200'
                          : isDark
                            ? 'bg-space-dust text-slate-400 border-stellar-cyan/10 hover:border-red-500/20'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300'
                        }
                      `}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                    >
                      <motion.div
                        initial={false}
                        animate={{ scale: !hideBlacklisted ? 1 : 0.8, opacity: !hideBlacklisted ? 1 : 0.5 }}
                        transition={prefersReducedMotion ? { duration: 0 } : SPRING.QUICK}
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                      <span className="hidden sm:inline">Bloqueados</span>
                      <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>({stats.blacklisted})</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Customer List - Scrollable with safe area padding for notched devices */}
              {/* min-h-0 is critical for flex-1 overflow to work properly */}
              <div className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 pb-safe custom-scrollbar ${isDark ? 'bg-space-dust/30' : ''}`}>
                {displayList.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Nenhum cliente encontrado"
                    description={
                      (hideContacted && stats.contacted > 0) || (hideBlacklisted && stats.blacklisted > 0)
                        ? "Ajuste os filtros para ver mais clientes"
                        : undefined
                    }
                    action={
                      (hideContacted || hideBlacklisted)
                        ? () => { setHideContacted(false); setHideBlacklisted(false); }
                        : undefined
                    }
                    actionLabel="Limpar Filtros"
                    size="md"
                  />
                ) : (
                  <motion.div
                    className="space-y-2"
                    variants={prefersReducedMotion ? undefined : customerListVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {displayList.map((customer) => {
                      const customerId = customer.id || customer.doc;
                      const customerPhone = customer.phone || customer.telefone;
                      const isSelected = selectedIds.has(customerId);
                      const isCustomerContacted = contactedIds.has(String(customerId));
                      const isCustomerBlacklisted = isBlacklisted(customerPhone);

                      return (
                        <motion.div
                          key={customerId}
                          variants={prefersReducedMotion ? undefined : customerCardVariants}
                          className={`
                            flex items-center gap-3 p-3 sm:p-4 rounded-xl border
                            transition-all duration-200
                            ${isSelected
                              ? isDark
                                ? 'bg-stellar-cyan/10 border-stellar-cyan/30'
                                : 'bg-blue-50 border-blue-200'
                              : isDark
                                ? 'bg-space-dust/50 border-stellar-cyan/10 hover:border-stellar-cyan/20 hover:bg-space-dust/70'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }
                          `}
                          whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
                        >
                          {/* Checkbox with larger tap area for mobile */}
                          <div className="flex items-center justify-center w-10 h-10 -m-2 flex-shrink-0">
                            <motion.div
                              initial={false}
                              animate={{ scale: isSelected ? 1.05 : 1 }}
                              transition={prefersReducedMotion ? { duration: 0 } : SPRING.QUICK}
                            >
                              <HapticCheckbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(customerId)}
                                className={isDark ? 'border-stellar-cyan/30 data-[state=checked]:bg-stellar-cyan' : ''}
                              />
                            </motion.div>
                          </div>

                          {/* Avatar - Gradient cosmic style */}
                          <div className={`
                            w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0
                            ${isDark
                              ? 'bg-gradient-to-br from-stellar-blue/80 to-stellar-cyan/80'
                              : 'bg-gradient-to-br from-slate-300 to-slate-400'
                            }
                          `}>
                            <span className="text-xs font-bold text-white">
                              {getInitials(customer.name)}
                            </span>
                          </div>

                          {/* Customer Info - Clickable */}
                          <div
                            className="flex-1 min-w-0 cursor-pointer group"
                            onClick={() => handleCustomerClick(customer)}
                          >
                            <div className="flex items-center gap-2">
                              <p className={`
                                text-sm font-semibold truncate transition-colors duration-150
                                ${isDark
                                  ? 'text-white group-hover:text-stellar-cyan'
                                  : 'text-slate-800 group-hover:text-blue-600'
                                }
                              `}>
                                {customer.name || 'Cliente'}
                              </p>
                              {isCustomerContacted && (
                                <Badge variant="contacted" className="gap-0.5">
                                  <Check className="w-3 h-3" />
                                  Contactado
                                </Badge>
                              )}
                              {isCustomerBlacklisted && (
                                <Badge variant="blacklisted">
                                  Bloqueado
                                </Badge>
                              )}
                            </div>
                            <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span>{maskPhone(customerPhone)}</span>
                              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {formatCurrency(customer.netTotal || customer.y)}
                              </span>
                              {customer.daysSinceLastVisit !== undefined && (
                                <span className={customer.daysSinceLastVisit >= 30 ? 'text-red-500 font-medium' : ''}>
                                  {customer.daysSinceLastVisit}d
                                </span>
                              )}
                              {customer.daysSinceFirstVisit !== undefined && customer.daysSinceLastVisit === undefined && (
                                <span className={customer.daysSinceFirstVisit >= 30 ? 'text-red-500 font-medium' : ''}>
                                  {customer.daysSinceFirstVisit}d
                                </span>
                              )}
                              {customer.x !== undefined && !customer.daysSinceLastVisit && !customer.daysSinceFirstVisit && (
                                <span className={customer.x >= 30 ? 'text-red-500 font-medium' : ''}>
                                  {customer.x}d
                                </span>
                              )}
                            </div>
                          </div>

                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Show More Button - mobile-friendly touch target with cosmic styling */}
                {hasMore && (
                  <div className="mt-4 text-center">
                    <motion.button
                      onClick={() => {
                        haptics.light();
                        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
                      }}
                      className={`
                        inline-flex items-center gap-2 px-6 min-h-[48px]
                        text-sm font-semibold rounded-xl
                        border transition-all duration-200
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40
                        ${isDark
                          ? 'bg-space-dust text-stellar-cyan border-stellar-cyan/20 hover:border-stellar-cyan/40 hover:bg-stellar-cyan/10'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300'
                        }
                      `}
                      whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    >
                      <ChevronRight className="w-4 h-4 rotate-90" />
                      Mostrar Mais ({remaining})
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CustomerSegmentModal;
