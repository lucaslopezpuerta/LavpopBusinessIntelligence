// CustomerSegmentModal.jsx v5.0 - BASEMODAL MIGRATION
// Premium customer segment modal with campaign integration
// Design System v5.1 compliant - Variant D (Glassmorphism)
//
// CHANGELOG:
// v5.0 (2026-01-31): BaseModal migration
//   - Migrated to BaseModal component for consistent UX
//   - Removed duplicate boilerplate (portal, animations, swipe, scroll lock, escape key)
//   - Uses showHeader={false} for custom gradient icon header
//   - Reduced from ~1020 lines to ~700 lines
// v4.1 (2026-01-31): Enhanced drag handle
// v4.0 (2026-01-28): Cosmic Precision Design System upgrade
// v3.1 (2026-01-28): Mobile full-screen and safe area fix
// v3.0 (2026-01-27): Animation standardization
// v2.9 (2026-01-27): Toast notifications
// v2.8 (2026-01-12): Refactored to useScrollLock hook
// v2.7 (2026-01-12): Full-screen safe area compliance
// v2.6 (2026-01-12): iOS-compatible scroll lock
// v2.5 (2026-01-11): Separated selection count
// v2.4 (2026-01-11): Compact single-row filter layout
// v2.3 (2026-01-11): Explicit checkbox filter UX
// v2.1 (2026-01-11): Mobile UX polish
// v2.0 (2026-01-11): Full-screen mobile layout
// v1.9 (2026-01-11): Mobile UX improvements
// v1.8 (2026-01-07): Focus ring standardization
// v1.7 (2025-12-18): Swipe-to-close gesture
// v1.6 (2025-12-16): Standardized z-index system
// v1.5 (2025-12-15): Fixed contacted status display
// v1.4 (2025-12-15): Removed WhatsApp/Call buttons
// v1.3 (2025-12-15): Fixed duplicate contact_tracking records
// v1.2 (2025-12-15): Portal rendering + phone field fixes
// v1.1 (2025-12-15): Automation and manual campaign integration
// v1.0 (2025-12-15): Initial implementation

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Check, ChevronRight, ChevronDown,
  Plus, RefreshCw
} from 'lucide-react';
import { SPRING, STAGGER } from '../../constants/animations';
import { useBlacklist } from '../../hooks/useBlacklist';
import { useActiveCampaigns } from '../../hooks/useActiveCampaigns';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { normalizePhone } from '../../utils/phoneUtils';
import { api } from '../../utils/apiService';
import { haptics } from '../../utils/haptics';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { HapticCheckbox } from '../ui/HapticCheckbox';
import { Badge } from '../ui/badge';
import CosmicDropdown from '../ui/CosmicDropdown';
import EmptyState from '../ui/EmptyState';
import BaseModal from '../ui/BaseModal';

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
  const [hideContacted, setHideContacted] = useState(true);
  const [hideBlacklisted, setHideBlacklisted] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedManualCampaign, setSelectedManualCampaign] = useState('');
  const [isAddingToAutomation, setIsAddingToAutomation] = useState(false);
  const [campaignSectionCollapsed, setCampaignSectionCollapsed] = useState(false);

  // Hooks
  const { isBlacklisted, getBlacklistReason } = useBlacklist();
  const { getCampaignsForAudience, isLoading: campaignsLoading } = useActiveCampaigns();
  const { success, warning, error: showError } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();

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
      const customerIds = Array.from(selectedIds);
      const automation = automated.find(a => a.id === automationId);
      const automationName = automation?.name || automationId;

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
      const customerIds = Array.from(selectedIds);
      const campaign = manual.find(c => c.id === selectedManualCampaign);
      const campaignName = campaign?.name || 'Campanha';

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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      maxWidth="2xl"
      showHeader={false}
      contentClassName="p-0 flex flex-col"
      ariaLabel={title}
    >
      {/* Custom Header with gradient icon */}
      <div className={`
        flex items-center justify-between p-4 sm:p-5
        border-b ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}
        bg-gradient-to-r ${isDark ? 'from-space-nebula to-space-dust' : 'from-slate-50 to-white'}
        flex-shrink-0
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
        flex-shrink-0
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
        flex-shrink-0
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

      {/* Customer List - Scrollable with safe area padding */}
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
    </BaseModal>
  );
};

export default CustomerSegmentModal;
