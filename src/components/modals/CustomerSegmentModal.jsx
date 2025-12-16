// CustomerSegmentModal.jsx v1.6
// Clean modal for displaying filtered customer lists with campaign integration
// Design System v4.0 compliant
//
// CHANGELOG:
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
  X, Users, Check, ChevronRight,
  Plus, RefreshCw
} from 'lucide-react';
import { useBlacklist } from '../../hooks/useBlacklist';
import { useActiveCampaigns } from '../../hooks/useActiveCampaigns';
import { normalizePhone } from '../../utils/phoneUtils';
import { api } from '../../utils/apiService';

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

  // Hooks
  const { isBlacklisted, getBlacklistReason } = useBlacklist();
  const { getCampaignsForAudience, isLoading: campaignsLoading } = useActiveCampaigns();

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
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id || c.doc)));
    }
  }, [filteredCustomers, selectedIds.size]);

  const toggleSelect = useCallback((customerId) => {
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
        alert(`✅ ${successCount} clientes incluídos na fila de "${automationName}"${failedCount > 0 ? ` (${failedCount} falharam)` : ''}`);
        setSelectedIds(new Set());
        // Note: Don't call onMarkContacted here - it creates a duplicate record!
        // The contact_tracking entry was already created by api.contacts.create above.
        // Just dispatch event to refresh UI
        window.dispatchEvent(new CustomEvent('contact-tracking-changed'));
      } else {
        alert('❌ Não foi possível incluir os clientes na automação');
      }
    } catch (error) {
      console.error('Failed to add to automation:', error);
      alert('Erro ao incluir clientes na automação: ' + error.message);
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
        alert(`✅ ${successCount} clientes adicionados à campanha "${campaignName}"${failedCount > 0 ? ` (${failedCount} falharam)` : ''}`);
        setSelectedIds(new Set());
        setSelectedManualCampaign('');
        onMarkContacted?.(customerIds[0], 'campaign');
      } else {
        alert('❌ Não foi possível adicionar os clientes à campanha');
      }
    } catch (error) {
      console.error('Failed to add to campaign:', error);
      alert('Erro ao adicionar clientes à campanha: ' + error.message);
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          >
            {/* Centering wrapper with min-height to ensure scroll works */}
            <div className="min-h-full flex items-center justify-center p-4">
              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh] my-4"
              >
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
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Campaign Integration Section */}
              <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                {/* Automated Campaigns */}
                {automated.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
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
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                              Ativa
                            </span>
                          </div>
                          <button
                            onClick={() => handleIncludeInAutomation(rule.id)}
                            disabled={selectedIds.size === 0 || isAddingToAutomation}
                            className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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

                {/* Manual Campaigns */}
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                    Campanhas Manuais
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedManualCampaign}
                      onChange={(e) => setSelectedManualCampaign(e.target.value)}
                      className="flex-1 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200"
                    >
                      <option value="">Selecionar Campanha...</option>
                      {manual.map(campaign => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddToManualCampaign}
                      disabled={selectedIds.size === 0 || !selectedManualCampaign}
                      className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Adicionar
                    </button>
                    {onCreateCampaign && (
                      <button
                        onClick={handleCreateNewCampaign}
                        disabled={selectedIds.size === 0}
                        className="px-3 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Nova
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="px-4 sm:px-5 py-2 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                {/* Select All */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Todos ({selectedIds.size}/{filteredCustomers.length})
                  </span>
                </label>

                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />

                {/* Hide Contacted Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideContacted}
                    onChange={(e) => setHideContacted(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Ocultar Contactados{stats.contacted > 0 && ` (${stats.contacted})`}
                  </span>
                </label>

                {/* Hide Blacklisted Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideBlacklisted}
                    onChange={(e) => setHideBlacklisted(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Ocultar Bloqueados{stats.blacklisted > 0 && ` (${stats.blacklisted})`}
                  </span>
                </label>
              </div>

              {/* Customer List - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
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
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(customerId)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                          />

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
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-full">
                                  <Check className="w-2.5 h-2.5" />
                                  Contactado
                                </span>
                              )}
                              {isCustomerBlacklisted && (
                                <span className="text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded-full">
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

                {/* Show More Button */}
                {hasMore && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
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
