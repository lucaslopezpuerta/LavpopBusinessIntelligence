// CustomerSegmentModal.jsx v3.0 - ANIMATION STANDARDIZATION
// Clean modal for displaying filtered customer lists with campaign integration
// Design System v5.1 compliant
//
// CHANGELOG:
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
import { MODAL } from '../../constants/animations';
import { useBlacklist } from '../../hooks/useBlacklist';
import { useActiveCampaigns } from '../../hooks/useActiveCampaigns';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { normalizePhone } from '../../utils/phoneUtils';
import { api } from '../../utils/apiService';
import { haptics } from '../../utils/haptics';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useToast } from '../../contexts/ToastContext';

// Items per page for pagination
const ITEMS_PER_PAGE = 10;

// Color mapping for accent backgrounds
const colorMap = {
  green: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
  amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
  red: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
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
            <div className="min-h-full flex items-center justify-center p-0 sm:p-4">
              {/* Modal Container - Full-screen on mobile, constrained on desktop */}
              <motion.div
                role="dialog"
                aria-modal="true"
                {...(prefersReducedMotion ? MODAL.CONTENT_REDUCED : MODAL.CONTENT)}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full sm:max-w-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl
                           rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-white/20 dark:border-slate-700/50
                           flex flex-col h-full sm:h-auto max-h-full sm:max-h-[85vh] sm:my-4
                           pt-safe sm:pt-0"
                style={swipeStyle}
                {...swipeHandlers}
              >
              {/* Swipe handle indicator (mobile only) */}
              <div className="lg:hidden flex justify-center pt-2 pb-1">
                <div
                  className={`w-10 h-1 rounded-full transition-colors ${
                    isDragging ? 'bg-slate-400 dark:bg-slate-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.slate}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {subtitle || `${stats.total} clientes • ${stats.notContacted} sem contato`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    haptics.light();
                    onClose();
                  }}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Campaign Integration Section - Collapsible on mobile */}
              <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {/* Collapse toggle - mobile only */}
                <button
                  onClick={() => setCampaignSectionCollapsed(!campaignSectionCollapsed)}
                  className="sm:hidden w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    Campanhas & Automações
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      campaignSectionCollapsed ? '' : 'rotate-180'
                    }`}
                  />
                </button>

                {/* Campaign content - always visible on desktop, collapsible on mobile */}
                <div className={`px-4 sm:px-5 pb-3 sm:py-3 space-y-3 ${
                  campaignSectionCollapsed ? 'hidden sm:block' : 'block'
                }`}>
                  {/* Automated Campaigns */}
                  {automated.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                        Automações
                      </p>
                      <div className="space-y-2">
                        {automated.map(rule => (
                          <div
                            key={rule.id}
                            className="flex items-center justify-between bg-white dark:bg-slate-700 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-600"
                          >
                            <div className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {rule.name}
                              </span>
                              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                                Ativa
                              </span>
                            </div>
                            <button
                              onClick={() => handleIncludeInAutomation(rule.id)}
                              disabled={selectedIds.size === 0 || isAddingToAutomation}
                              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 min-h-[44px] px-3 -mr-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
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

                  {/* Manual Campaigns - Modern card layout with blue accent */}
                  <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-900/50">
                    <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-2.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Campanhas Manuais
                    </p>
                    {/* Dropdown row */}
                    <div className="relative mb-2.5">
                      <select
                        value={selectedManualCampaign}
                        onChange={(e) => setSelectedManualCampaign(e.target.value)}
                        className={`w-full text-sm rounded-xl px-4 min-h-[48px] appearance-none cursor-pointer
                                  transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                                  ${selectedManualCampaign
                                    ? 'bg-blue-600 text-white font-medium border-blue-600 dark:border-blue-500'
                                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600'
                                  }`}
                      >
                        <option value="" className="text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700">
                          Selecionar Campanha...
                        </option>
                        {manual.map(campaign => (
                          <option key={campaign.id} value={campaign.id} className="text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700">
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors ${
                        selectedManualCampaign ? 'text-white/80' : 'text-blue-400'
                      }`} />
                    </div>
                    {/* Action buttons row */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddToManualCampaign}
                        disabled={selectedIds.size === 0 || !selectedManualCampaign}
                        className="flex-1 min-h-[44px] text-sm font-semibold bg-blue-600 text-white rounded-xl
                                 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                                 dark:focus-visible:ring-offset-slate-800 transition-colors
                                 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar à Campanha
                      </button>
                      {onCreateCampaign && (
                        <button
                          onClick={handleCreateNewCampaign}
                          disabled={selectedIds.size === 0}
                          className="min-h-[44px] px-4 text-sm font-medium
                                   bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400
                                   border border-blue-200 dark:border-blue-800 rounded-xl
                                   hover:bg-blue-50 dark:hover:bg-blue-900/30
                                   disabled:opacity-40 disabled:cursor-not-allowed
                                   focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                                   dark:focus-visible:ring-offset-slate-800 transition-colors
                                   flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          Nova
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Controls - Compact single-row layout with clear grouping */}
              <div className="px-3 sm:px-5 py-2.5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Selection toggle + count (separated) */}
                  <div className="flex items-center gap-3">
                    {/* Checkbox + label */}
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 min-h-[36px] group"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0
                          ? 'border-blue-500 bg-blue-500'
                          : selectedIds.size > 0
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-300 dark:border-slate-500 group-hover:border-blue-400'
                      }`}>
                        {selectedIds.size > 0 && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Selecionar todos
                      </span>
                    </button>
                    {/* Count - always visible, separated */}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {selectedIds.size}
                      <span className="text-slate-400 dark:text-slate-500 font-normal"> / {filteredCustomers.length}</span>
                    </span>
                  </div>

                  {/* Right: Include filters as compact checkboxes */}
                  <div className="flex items-center gap-3">
                    {/* Contacted checkbox */}
                    <button
                      onClick={() => {
                        haptics.light();
                        setHideContacted(!hideContacted);
                      }}
                      className="flex items-center gap-1.5 group"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        !hideContacted
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 dark:border-slate-500 group-hover:border-blue-400'
                      }`}>
                        {!hideContacted && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${!hideContacted ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                        <span className="hidden sm:inline">Contactados </span>
                        <span className="text-slate-400 dark:text-slate-500">({stats.contacted})</span>
                      </span>
                    </button>

                    {/* Blacklisted checkbox */}
                    <button
                      onClick={() => {
                        haptics.light();
                        setHideBlacklisted(!hideBlacklisted);
                      }}
                      className="flex items-center gap-1.5 group"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        !hideBlacklisted
                          ? 'border-red-500 bg-red-500'
                          : 'border-slate-300 dark:border-slate-500 group-hover:border-red-400'
                      }`}>
                        {!hideBlacklisted && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${!hideBlacklisted ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                        <span className="hidden sm:inline">Bloqueados </span>
                        <span className="text-slate-400 dark:text-slate-500">({stats.blacklisted})</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer List - Scrollable with safe area padding for notched devices */}
              {/* min-h-0 is critical for flex-1 overflow to work properly */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 pb-safe custom-scrollbar">
                {displayList.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Nenhum cliente encontrado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayList.map((customer) => {
                      const customerId = customer.id || customer.doc;
                      const customerPhone = customer.phone || customer.telefone;
                      const isSelected = selectedIds.has(customerId);
                      const isCustomerContacted = contactedIds.has(String(customerId));
                      const isCustomerBlacklisted = isBlacklisted(customerPhone);

                      return (
                        <div
                          key={customerId}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600/50'
                          }`}
                        >
                          {/* Checkbox with larger tap area for mobile */}
                          <label className="flex items-center justify-center w-10 h-10 -m-2 cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(customerId)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                            />
                          </label>

                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                              {getInitials(customer.name)}
                            </span>
                          </div>

                          {/* Customer Info - Clickable */}
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleCustomerClick(customer)}
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400">
                                {customer.name || 'Cliente'}
                              </p>
                              {isCustomerContacted && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" />
                                  Contactado
                                </span>
                              )}
                              {isCustomerBlacklisted && (
                                <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded-full">
                                  Bloqueado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span>{maskPhone(customerPhone)}</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {formatCurrency(customer.netTotal || customer.y)}
                              </span>
                              {customer.daysSinceLastVisit !== undefined && (
                                <span className={customer.daysSinceLastVisit >= 30 ? 'text-red-500 font-medium' : ''}>
                                  {customer.daysSinceLastVisit}d
                                </span>
                              )}
                              {customer.x !== undefined && !customer.daysSinceLastVisit && (
                                <span className={customer.x >= 30 ? 'text-red-500 font-medium' : ''}>
                                  {customer.x}d
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Show More Button - mobile-friendly touch target */}
                {hasMore && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => {
                        haptics.light();
                        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
                      }}
                      className="inline-flex items-center gap-2 px-6 min-h-[48px] text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                    >
                      <ChevronRight className="w-4 h-4 rotate-90" />
                      Mostrar Mais ({remaining})
                    </button>
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
