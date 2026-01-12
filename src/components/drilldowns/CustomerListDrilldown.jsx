// CustomerListDrilldown.jsx v3.12 - SWIPE GESTURE CONFLICT FIX (PARENT SIGNAL)
// ✅ Pagination with "Ver mais" button
// ✅ WhatsApp and Call actions
// ✅ Dynamic sorting with controls
// ✅ Risk severity indicators (colored dots)
// ✅ Customer initials avatar
// ✅ Swipe actions on mobile (fixed conflict with view navigation)
// ✅ Enhanced empty state
// ✅ Contact tracking (shared across app with effectiveness tracking)
// ✅ Communication logging (syncs with CustomerProfileModal)
// ✅ Design System v3.1 compliant
// ✅ Brazilian mobile phone validation for WhatsApp
// ✅ Passes customer context for effectiveness tracking
// ✅ Blacklist indicator with toggle to show/hide
//
// CHANGELOG:
// v3.12 (2026-01-12): Fixed swipe gesture conflict using parent signal
//   - Accept onSwipeStart/End props from parent
//   - Call onSwipeStart in handleTouchStart to disable Framer Motion drag
//   - Call onSwipeEnd in handleTouchEnd/Move/Cancel to re-enable
//   - This properly disables view navigation during row swipe
//   - Root cause: Framer Motion uses document-level pointer listeners
// v3.11 (2026-01-11): Tried preventDefault (still didn't work)
//   - e.preventDefault() only blocks React events, not Framer Motion
// v3.10 (2026-01-11): Tried data-swipe-row attribute (didn't work)
// v3.9 (2026-01-11): Tried onPointerDownCapture stopPropagation (didn't work)
// v3.8 (2025-12-14): Blacklist indicator
//   - Shows "Bloqueado" badge for blacklisted customers
//   - Toggle to show/hide blacklisted customers (hidden by default)
//   - Disables all contact actions for blacklisted customers
//   - Uses useBlacklist hook for centralized management
// v3.7 (2025-12-08): Contact context tracking
//   - Passes customer name and risk level when marking as contacted
//   - Uses markContacted for proper effectiveness tracking
//   - Supports campaign effectiveness metrics
// v3.6 (2025-12-03): Phone validation for WhatsApp
//   - Added Brazilian mobile validation before WhatsApp actions
//   - Disables WhatsApp swipe/buttons for invalid numbers
//   - Uses shared phoneUtils for consistent validation
// v3.5 (2025-12-02): Dark mode card background fix
//   - Fixed semi-transparent card bg showing swipe actions through
//   - Changed dark:bg-slate-700/30 to solid dark:bg-slate-700
// v3.4 (2025-12-01): Contact status fix
//   - Fixed: Call/WhatsApp buttons now mark customer as contacted
//   - Consolidated toggleContacted calls in handleCall/handleWhatsApp
//   - Swipe handlers no longer need duplicate toggleContacted
// v3.3 (2025-12-01): Communication logging integration
//   - Added addCommunicationEntry for shared communication log
//   - Call/WhatsApp actions now appear in CustomerProfileModal history
//   - Uses shared communicationLog utility
// v3.2 (2025-12-01): Shared contact tracking
//   - Uses useContactTracking hook for app-wide sync
//   - Contact state persists and syncs across components
//   - Tracks contact method (phone/whatsapp)
// v3.1 (2025-12-01): Layout optimization
//   - Removed redundant left-border accent (dot only)
//   - Optimized button sizes and spacing
//   - Fixed text overflow/wrapping issues
//   - Compact single-line info layout
//   - Desktop: icon-only buttons to save space
// v3.0 (2025-12-01): Major UX enhancements
//   - Risk severity indicator (amber/red dot)
//   - Days since last visit with color coding
//   - Sorting controls (by value, by days absent)
//   - Customer initials avatar
//   - Swipe actions on mobile (left=call, right=whatsapp)
//   - Empty state celebration message
//   - Contact tracking (mark as contacted)
// v2.3 (2025-12-01): Pagination and UX improvements
// v2.2 (2025-12-01): Design System compliance
// v2.1 (2025-12-01): Fixed date formatting bug
// v2.0: Initial SMART LISTS implementation

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Phone, MessageCircle, Check, ChevronDown, ArrowUpDown, PartyPopper, Ban, EyeOff, Eye } from 'lucide-react';
import { useContactTracking } from '../../hooks/useContactTracking';
import { useBlacklist } from '../../hooks/useBlacklist';
import { addCommunicationEntry, getDefaultNotes } from '../../utils/communicationLog';
import { isValidBrazilianMobile, normalizePhone } from '../../utils/phoneUtils';

const ITEMS_PER_PAGE = 5;

// Sort options
const SORT_OPTIONS = {
    value: { label: 'Por valor', key: 'netTotal' },
    days: { label: 'Por dias ausente', key: 'daysSinceLastVisit' },
    name: { label: 'Por nome', key: 'name' }
};

const CustomerListDrilldown = ({ customers = [], type = 'active', onSwipeStart, onSwipeEnd }) => {
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [sortBy, setSortBy] = useState(type === 'atrisk' ? 'days' : 'value');
    const [swipeState, setSwipeState] = useState({ id: null, direction: null, offset: 0 });
    const [showBlacklisted, setShowBlacklisted] = useState(false);
    const touchStartRef = useRef({ x: 0, y: 0 });

    // Shared contact tracking (syncs across app with effectiveness tracking)
    const { isContacted, toggleContacted, markContacted } = useContactTracking();

    // Blacklist management (centralized hook)
    const { isBlacklisted, getBlacklistReason, blacklistCount } = useBlacklist();

    // Helper to get customer context for effectiveness tracking
    const getCustomerContext = useCallback((customerId) => {
        const customer = customers.find(c => c.doc === customerId);
        return {
            customerName: customer?.name || null,
            riskLevel: customer?.riskLevel || null
        };
    }, [customers]);

    // Format date for display
    const formatDate = (date) => {
        if (!date) return null;
        if (date instanceof Date) {
            return date.toLocaleDateString('pt-BR');
        }
        if (typeof date === 'string') {
            const parsed = new Date(date);
            return isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('pt-BR');
        }
        return String(date);
    };

    const formatPhone = (phone) => {
        if (!phone) return null;
        const cleaned = String(phone).replace(/\D/g, '');
        return cleaned.length >= 10 ? cleaned : null;
    };

    // Check if phone is valid for WhatsApp (Brazilian mobile only)
    const hasValidWhatsApp = (phone) => {
        return phone && isValidBrazilianMobile(phone);
    };

    const formatCurrency = (value) => {
        if (!value && value !== 0) return null;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Get customer initials
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Get risk level styling (dot only, no border)
    const getRiskStyle = (customer) => {
        if (type !== 'atrisk') return null;

        if (customer.riskLevel === 'Churning') {
            return { dot: 'bg-red-500' };
        }
        if (customer.riskLevel === 'At Risk') {
            return { dot: 'bg-amber-500' };
        }
        return null;
    };

    // Get days color based on severity
    const getDaysColor = (days) => {
        if (!days) return 'text-slate-500 dark:text-slate-400';
        if (days >= 30) return 'text-red-600 dark:text-red-400 font-semibold';
        if (days >= 14) return 'text-amber-600 dark:text-amber-400 font-medium';
        return 'text-slate-500 dark:text-slate-400';
    };

    // Sort and filter customers
    const sortedCustomers = useMemo(() => {
        // Filter out blacklisted customers if toggle is off
        let filtered = [...customers];
        if (!showBlacklisted) {
            filtered = filtered.filter(c => !isBlacklisted(c.phone));
        }

        switch (sortBy) {
            case 'days':
                return filtered.sort((a, b) => (b.daysSinceLastVisit || 0) - (a.daysSinceLastVisit || 0));
            case 'name':
                return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            case 'value':
            default:
                return filtered.sort((a, b) => (b.netTotal || 0) - (a.netTotal || 0));
        }
    }, [customers, sortBy, showBlacklisted, isBlacklisted]);

    // Count blacklisted customers in this list
    const blacklistedInList = useMemo(() => {
        return customers.filter(c => isBlacklisted(c.phone)).length;
    }, [customers, isBlacklisted]);

    const handleCall = useCallback((e, phone, customerId) => {
        e?.stopPropagation();
        const cleaned = formatPhone(phone);
        if (cleaned) {
            window.location.href = `tel:+55${cleaned}`;
            // Log to communication history (syncs with CustomerProfileModal)
            if (customerId) {
                addCommunicationEntry(customerId, 'call', getDefaultNotes('call'));
                // Mark as contacted with context (for effectiveness tracking)
                if (!isContacted(customerId)) {
                    markContacted(customerId, 'call', getCustomerContext(customerId));
                }
            }
        }
    }, [isContacted, markContacted, getCustomerContext]);

    const handleWhatsApp = useCallback((e, phone, customerId) => {
        e?.stopPropagation();
        // Validate Brazilian mobile before sending
        if (!hasValidWhatsApp(phone)) return;
        const normalized = normalizePhone(phone);
        if (!normalized) return;
        // Remove + for WhatsApp URL
        const whatsappNumber = normalized.replace('+', '');
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const url = isMobileDevice
            ? `https://api.whatsapp.com/send?phone=${whatsappNumber}`
            : `https://web.whatsapp.com/send?phone=${whatsappNumber}`;
        window.open(url, '_blank');
        // Log to communication history (syncs with CustomerProfileModal)
        if (customerId) {
            addCommunicationEntry(customerId, 'whatsapp', getDefaultNotes('whatsapp'));
            // Mark as contacted with context (for effectiveness tracking)
            if (!isContacted(customerId)) {
                markContacted(customerId, 'whatsapp', getCustomerContext(customerId));
            }
        }
    }, [isContacted, markContacted, getCustomerContext]);

    const handleMarkContacted = useCallback((e, customerId) => {
        e?.stopPropagation();
        if (isContacted(customerId)) {
            toggleContacted(customerId);
        } else {
            markContacted(customerId, 'manual', getCustomerContext(customerId));
        }
    }, [isContacted, toggleContacted, markContacted, getCustomerContext]);

    // Touch handlers for swipe
    const handleTouchStart = useCallback((e, customerId) => {
        // Signal parent to disable view navigation while row is being swiped
        onSwipeStart?.();

        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        setSwipeState({ id: customerId, direction: null, offset: 0 });
    }, [onSwipeStart]);

    const handleTouchMove = useCallback((e, customerId) => {
        if (swipeState.id !== customerId) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

        // If more vertical than horizontal, reset and allow normal scroll
        if (deltaY > Math.abs(deltaX) * 0.5) {
            onSwipeEnd?.(); // Re-enable view navigation
            setSwipeState({ id: null, direction: null, offset: 0 });
            return;
        }

        const maxOffset = 64;
        const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
        const direction = offset > 20 ? 'right' : offset < -20 ? 'left' : null;

        setSwipeState({ id: customerId, direction, offset });
    }, [swipeState.id, onSwipeEnd]);

    const handleTouchEnd = useCallback((customer, customerId) => {
        // Signal parent to re-enable view navigation
        onSwipeEnd?.();

        if (!swipeState.direction || !customer.phone) {
            setSwipeState({ id: null, direction: null, offset: 0 });
            return;
        }

        // Trigger call/WhatsApp (handlers also log and mark as contacted with context)
        // WhatsApp only works for valid Brazilian mobiles
        if (swipeState.direction === 'right' && hasValidWhatsApp(customer.phone)) {
            handleWhatsApp(null, customer.phone, customerId);
        } else if (swipeState.direction === 'left') {
            handleCall(null, customer.phone, customerId);
        }

        setSwipeState({ id: null, direction: null, offset: 0 });
    }, [swipeState.direction, handleWhatsApp, handleCall, onSwipeEnd]);

    // Handle touch cancel (e.g., if user moves finger off screen)
    const handleTouchCancel = useCallback(() => {
        onSwipeEnd?.();
        setSwipeState({ id: null, direction: null, offset: 0 });
    }, [onSwipeEnd]);

    // Get type-specific secondary info
    const getSecondaryInfo = (customer) => {
        switch (type) {
            case 'newclients':
                return customer.visitCount
                    ? `${customer.visitCount} visita${customer.visitCount > 1 ? 's' : ''}`
                    : 'Primeira visita';
            case 'atrisk':
                if (customer.daysSinceLastVisit) {
                    return (
                        <span className={getDaysColor(customer.daysSinceLastVisit)}>
                            {customer.daysSinceLastVisit} dias sem visita
                        </span>
                    );
                }
                return customer.lastVisit ? `Última: ${formatDate(customer.lastVisit)}` : 'Sem visita recente';
            case 'active':
                return customer.visitCount
                    ? `${customer.visitCount} visitas`
                    : customer.lastVisit ? `Última: ${formatDate(customer.lastVisit)}` : '';
            default:
                return customer.lastVisit ? `Última: ${formatDate(customer.lastVisit)}` : '';
        }
    };

    // Get tertiary info (customer value)
    const getTertiaryInfo = (customer) => {
        if (customer.netTotal && customer.netTotal > 0) {
            return formatCurrency(customer.netTotal);
        }
        return null;
    };

    const displayList = sortedCustomers.slice(0, visibleCount);
    const hasMore = sortedCustomers.length > visibleCount;
    const remaining = sortedCustomers.length - visibleCount;

    const handleShowMore = () => {
        setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, sortedCustomers.length));
    };

    // Empty state for at-risk customers
    if (customers.length === 0 && type === 'atrisk') {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
                    <PartyPopper className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Parabéns!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                    Todos os seus clientes estão saudáveis. Continue mantendo um bom relacionamento!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Sorting controls - compact */}
            {customers.length > 1 && (
                <div className="flex items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <div className="flex gap-1 flex-wrap">
                            {Object.entries(SORT_OPTIONS).map(([key, option]) => (
                                <button
                                    key={key}
                                    onClick={() => setSortBy(key)}
                                    className={`
                                        px-2 py-0.5 text-xs rounded transition-colors
                                        ${sortBy === key
                                            ? 'bg-lavpop-blue text-white'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }
                                    `}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Blacklist toggle */}
                    {blacklistedInList > 0 && (
                        <button
                            onClick={() => setShowBlacklisted(!showBlacklisted)}
                            className={`
                                flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors
                                ${showBlacklisted
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }
                            `}
                            title={showBlacklisted ? 'Ocultar bloqueados' : `Mostrar ${blacklistedInList} bloqueado${blacklistedInList > 1 ? 's' : ''}`}
                        >
                            {showBlacklisted ? (
                                <Eye className="w-3 h-3" />
                            ) : (
                                <EyeOff className="w-3 h-3" />
                            )}
                            <span>{blacklistedInList}</span>
                            <Ban className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}

            {/* Customer list */}
            <div className="space-y-2">
                {displayList.map((customer, index) => {
                    const riskStyle = getRiskStyle(customer);
                    const customerId = customer.doc || `idx-${index}`;
                    const contacted = isContacted(customerId);
                    const blacklisted = isBlacklisted(customer.phone);
                    const blacklistInfo = blacklisted ? getBlacklistReason(customer.phone) : null;
                    const hasPhone = customer.phone && formatPhone(customer.phone);
                    const canWhatsApp = hasValidWhatsApp(customer.phone);
                    const isSwipingThis = swipeState.id === customerId;
                    const tertiaryInfo = getTertiaryInfo(customer);
                    // Disable contact actions if blacklisted
                    const canContact = !blacklisted;

                    return (
                        <div
                            key={customer.doc || index}
                            className="relative overflow-hidden rounded-xl"
                        >
                            {/* Swipe action backgrounds (mobile only, hide when contacted or blacklisted) */}
                            {hasPhone && !contacted && canContact && (
                                <>
                                    {/* WhatsApp (swipe right) - only for valid Brazilian mobiles */}
                                    {canWhatsApp && (
                                        <div className="md:hidden absolute inset-y-0 left-0 w-16 bg-green-500 flex items-center justify-center">
                                            <MessageCircle className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    {/* Call (swipe left) */}
                                    <div className="md:hidden absolute inset-y-0 right-0 w-16 bg-blue-500 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-white" />
                                    </div>
                                </>
                            )}

                            {/* Card content - uses preventDefault in touch handlers to prevent view navigation conflict */}
                            <div
                                className={`
                                    relative flex items-center gap-2 p-2.5
                                    bg-slate-50 dark:bg-slate-700
                                    border border-slate-200 dark:border-slate-700 rounded-xl
                                    ${contacted ? 'opacity-60' : ''}
                                    ${blacklisted ? 'opacity-70 border-red-200 dark:border-red-900/50' : ''}
                                    transition-transform duration-150 ease-out
                                    touch-pan-y
                                `}
                                style={{
                                    transform: isSwipingThis ? `translateX(${swipeState.offset}px)` : 'translateX(0)'
                                }}
                                onTouchStart={(e) => hasPhone && !contacted && canContact && handleTouchStart(e, customerId)}
                                onTouchMove={(e) => hasPhone && !contacted && canContact && handleTouchMove(e, customerId)}
                                onTouchEnd={() => !contacted && canContact && handleTouchEnd(customer, customerId)}
                                onTouchCancel={handleTouchCancel}
                            >
                                {/* Avatar with initials */}
                                <div className="relative flex-shrink-0">
                                    <div className={`
                                        w-9 h-9 rounded-full flex items-center justify-center
                                        ${blacklisted
                                            ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                            : contacted
                                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                                        }
                                        shadow-sm font-semibold text-xs
                                    `}
                                        title={blacklisted ? (blacklistInfo?.reason || 'Bloqueado') : undefined}
                                    >
                                        {blacklisted ? (
                                            <Ban className="w-4 h-4" />
                                        ) : contacted ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            getInitials(customer.name)
                                        )}
                                    </div>
                                    {/* Risk indicator dot (hide if blacklisted) */}
                                    {riskStyle && !contacted && !blacklisted && (
                                        <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${riskStyle.dot} border-2 border-slate-50 dark:border-slate-700`} />
                                    )}
                                </div>

                                {/* Customer info - compact layout */}
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold truncate ${blacklisted ? 'text-slate-500 dark:text-slate-400' : contacted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                        {customer.name || 'Cliente sem nome'}
                                        {blacklisted ? (
                                            <span className="text-red-500 ml-1.5 text-xs font-normal cursor-help" title={blacklistInfo?.reason || 'Bloqueado'}>Bloqueado</span>
                                        ) : contacted && (
                                            <span className="text-emerald-500 ml-1.5 text-xs font-normal no-underline">Contactado</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {getSecondaryInfo(customer)}
                                        {tertiaryInfo && <span className="text-slate-400 dark:text-slate-500"> · </span>}
                                        {tertiaryInfo && <span className="text-slate-600 dark:text-slate-300 font-medium">{tertiaryInfo}</span>}
                                    </p>
                                </div>

                                {/* Action buttons - 44px touch target (hidden for blacklisted) */}
                                {!blacklisted && (
                                    <div className="flex gap-1 flex-shrink-0">
                                        {/* Mark as contacted */}
                                        <button
                                            onClick={(e) => handleMarkContacted(e, customerId)}
                                            className={`
                                                w-11 h-11 flex items-center justify-center
                                                rounded-lg border transition-colors
                                                ${contacted
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }
                                            `}
                                            title={contacted ? 'Desmarcar' : 'Marcar contactado'}
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>

                                        {hasPhone && (
                                            <>
                                                {/* Call button - hidden on mobile (use swipe) */}
                                                <button
                                                    onClick={(e) => handleCall(e, customer.phone, customerId)}
                                                    className="hidden md:flex w-11 h-11 items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-lavpop-blue dark:text-blue-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                    title="Ligar"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </button>
                                                {/* WhatsApp button - hidden on mobile (use swipe), disabled for invalid numbers */}
                                                <button
                                                    onClick={(e) => handleWhatsApp(e, customer.phone, customerId)}
                                                    disabled={!canWhatsApp}
                                                    className={`hidden md:flex w-11 h-11 items-center justify-center rounded-lg border transition-colors ${
                                                        canWhatsApp
                                                            ? 'bg-white dark:bg-slate-800 text-lavpop-green border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                                    }`}
                                                    title={canWhatsApp ? 'WhatsApp' : 'Número inválido para WhatsApp'}
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Generic empty state */}
                {displayList.length === 0 && type !== 'atrisk' && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3 text-slate-400">
                            <span className="text-xl font-bold">?</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Nenhum cliente encontrado.
                        </p>
                    </div>
                )}
            </div>

            {/* Swipe hint for mobile */}
            {customers.length > 0 && customers.some(c => c.phone && formatPhone(c.phone)) && (
                <p className="md:hidden text-center text-xs text-slate-400 dark:text-slate-500 py-1">
                    Deslize ← para ligar{customers.some(c => hasValidWhatsApp(c.phone)) ? ' ou → para WhatsApp' : ''}
                </p>
            )}

            {/* Pagination - Show More */}
            {hasMore && (
                <button
                    onClick={handleShowMore}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-lavpop-blue dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                >
                    <ChevronDown className="w-4 h-4" />
                    Ver mais {remaining > ITEMS_PER_PAGE ? ITEMS_PER_PAGE : remaining} clientes
                </button>
            )}

            {/* All loaded indicator */}
            {!hasMore && customers.length > ITEMS_PER_PAGE && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-2">
                    Todos os {customers.length} clientes exibidos
                </p>
            )}
        </div>
    );
};

export default CustomerListDrilldown;
