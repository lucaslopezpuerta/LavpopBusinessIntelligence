// CustomerProfileModal.jsx v3.5 - SERVICE BREAKDOWN TEXT CONTRAST
// Comprehensive customer profile modal for Customer Directory
// Now the ONLY customer modal (CustomerDetailModal deprecated)
//
// CHANGELOG:
// v3.5 (2026-01-11): Service breakdown & empty state text contrast
//   - FIXED: "X serviços" text in Lavagem/Secagem cards
//   - FIXED: Loading/empty state text in Communication History
//   - FIXED: Timestamp text in Communication Log entries
//   - Changed text-slate-400/500 → text-slate-500/600 dark:text-slate-400
//   - Improves readability in both light and dark modes
// v3.4 (2026-01-11): Dark mode icon contrast fixes
//   - FIXED: Removed duplicate dark:text-blue-400 class on tab navigation (4 instances)
//   - FIXED: Added dark mode variants to section header icons:
//     * Wallet icon: dark:text-green-400
//     * Target icon: dark:text-red-400
//     * BarChart3 icon: dark:text-green-400
//     * AlertTriangle (phone warning): dark:text-amber-400
// v3.3 (2026-01-11): Risk card styling consistency fix
//   - FIXED: Risk level mini-card now uses light 50-level backgrounds
//   - FIXED: Added proper dark mode support (dark:bg-*-900/20)
//   - NEW: RISK_CARD_STYLES and RISK_CARD_TEXT constants for consistent styling
//   - Matches opacity/style of other mini-cards in modal
// v3.2 (2026-01-11): Fix async communication log handling
//   - FIXED: TypeError: communicationLog.map is not a function
//   - Root cause: getCommunicationLog is async but was called synchronously
//   - Initialize state with empty array (useEffect loads from backend)
//   - Removed redundant setCommunicationLog calls from action handlers
//   - Event listener already handles log updates via dispatched events
// v3.1 (2026-01-11): Bug fixes from mobile UX audit
//   - FIXED: Body scroll lock now works on iOS (position:fixed approach)
//   - FIXED: Card title contrast improved (text-slate-400 → text-slate-500)
//   - FIXED: Removed redundant WhatsApp button in Communication History
//   - FIXED: Add button no longer shows + twice (removed duplicate text)
//   - FIXED: Contacted indicator consolidated - removed header pill, keep toggle only
// v3.0 (2026-01-11): Complete mobile UX transformation
//   - FIXED: All text sizes now WCAG compliant (min 12px)
//   - FIXED: All touch targets now 44px minimum
//   - NEW: Full-screen layout on mobile (no margins/rounded corners)
//   - NEW: Swipe-to-close gesture with handle indicator
//   - NEW: Floating action bar for quick contact on mobile
//   - NEW: Lucide icons in tab navigation
//   - NEW: Haptic feedback on all interactive elements
//   - IMPROVED: Badge layout with better spacing
//   - IMPROVED: Content scrolling with safe area support
// v2.11 (2026-01-07): Focus ring standardization for accessibility
//   - Added focus-visible rings to close button, tabs, and action buttons
//   - Added glass morphism to modal container (bg-white/95 backdrop-blur-xl)
//   - Improves keyboard navigation UX
// v2.10 (2025-12-22): Lock body scroll when modal is open
//   - Prevents parent page from scrolling while modal is visible
//   - Restores original overflow on close
// v2.9 (2025-12-22): Added Recarga badge in transaction history
//   - parseMachines now detects "recarga" credit top-up transactions
//   - Shows amber "Recarga" badge instead of empty space
// v2.8 (2025-12-22): Fixed visits vs transactions distinction
//   - Behavior tab now uses customer.visits (unique days)
//   - Financial tab keeps customer.transactions (raw rows)
// v2.7 (2025-12-22): Added lifetime cycles trend chart
//   - Click customer name to expand/collapse trend panel
//   - Uses new CustomerCyclesTrend component
//   - Smooth animation with framer-motion
// v2.6 (2025-12-22): Added haptic feedback on tabs, actions, and close
// v2.5 (2025-12-16): Standardized z-index system
//   - Uses Z_INDEX.MODAL_CHILD from shared constants
//   - Consistent layering: primary modals (50) < child modals (60)
// v2.4 (2025-12-16): UX consistency with CustomerSegmentModal
//   - Added Escape key handler to close modal
//   - Added click-outside (backdrop) to close modal
//   - Added portal rendering via createPortal for proper z-index stacking
//   - Consistent close behavior across all modals
// v2.3 (2025-12-15): Z-index fix for modal stacking
//   - Changed z-50 to z-[1100] to appear above CustomerSegmentModal (z-[1050])
// v2.2 (2025-12-14): Blacklist indicator
//   - Shows "Bloqueado" badge for blacklisted customers (takes precedence over contacted)
//   - Disables all contact actions (Call, WhatsApp, Email) for blacklisted
//   - Shows blacklist reason discreetly on hover
//   - Uses useBlacklist hook for centralized blacklist management
// v2.1 (2025-12-14): Mask CPF for privacy
//   - Added maskCpf() helper: 12345678901 → 123.***.***-01
//   - CPF now displays masked in Personal Information section
// v2.0 (2025-12-12): Backend communication log integration
//   - Uses getCommunicationLogAsync to fetch from comm_logs table
//   - Merges backend data with localStorage for complete history
//   - Shows campaign context when communication was from a campaign
//   - Loading state while fetching backend data
// v1.9 (2025-12-10): Use shared dateUtils for consistent timezone handling
//   - Removed duplicate parseBrDate function
//   - Now imports parseBrDate from dateUtils.js
//   - Ensures Brazil timezone consistency across all components
// v1.8 (2025-12-08): Contact context tracking
//   - Passes customer name and risk level when marking as contacted
//   - Uses markContacted for proper effectiveness tracking
//   - Supports campaign effectiveness metrics
// v1.7 (2025-12-03): Phone validation for WhatsApp
//   - Added Brazilian mobile validation before WhatsApp actions
//   - Shows warning indicator for invalid phone numbers
//   - Disables WhatsApp buttons when phone is invalid
//   - Tooltip explains validation error
// v1.6 (2025-12-01): Badge redesign for better visibility
//   - High contrast risk pills with solid colors (RISK_PILL_STYLES)
//   - Segment displayed as gradient pill matching avatar colors
//   - Removed pulsing dot from risk pill for cleaner look
//   - Unified shadow-sm on all header pills
// v1.5 (2025-12-01): Header UX improvements
//   - Segment-based avatar icons with color gradients
//   - Removed redundant "Retorno %" from header (exists in Behavior tab)
//   - Moved contacted toggle to Communication History section header
//   - Mobile users can now toggle contacted status
// v1.4 (2025-12-01): Shared communication logging
//   - Uses shared communicationLog utility for cross-component sync
//   - Listens for communicationLogUpdate events from other components
//   - Communication history updates in real-time when actions happen elsewhere
// v1.3 (2025-12-01): Shared contact tracking
//   - Added useContactTracking hook for app-wide sync
//   - Contact indicator in header
//   - Auto-mark as contacted on call/WhatsApp/Email
// v1.2 (2025-11-30): Performance improvements
//   - Replaced window resize listener with useIsMobile hook (matchMedia)
// v1.1 (2025-11-29): Design System v3.0 compliance
//   - Replaced emojis with lucide-react icons in communication log
//   - Removed emojis from select options
// v1.0 (2025-11-24): Initial implementation
//   - Tab 1: Profile & Contact (personal info, wallet, communication log)
//   - Tab 2: Financial Summary (lifetime value, revenue breakdown)
//   - Tab 3: Behavior & Risk (visit patterns, risk assessment, preferences)
//   - Tab 4: Transaction History (last 10 transactions)
//   - Communication logging via localStorage
//   - Quick contact actions (Call, WhatsApp, Email)

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Z_INDEX } from '../constants/zIndex';
import { useReducedMotion } from '../hooks/useReducedMotion';
import CustomerCyclesTrend from './drilldowns/CustomerCyclesTrend';
import {
    X,
    Phone,
    MessageCircle,
    Mail,
    Calendar,
    Wallet,
    DollarSign,
    TrendingUp,
    Activity,
    AlertCircle,
    Clock,
    User,
    FileText,
    BarChart3,
    Target,
    Plus,
    Check,
    Crown,
    Heart,
    Sparkles,
    Rocket,
    Eye,
    Moon,
    AlertTriangle,
    Shield,
    Pause,
    UserMinus,
    Ban,
    ChevronDown,
} from 'lucide-react';

// Segment-based avatar configuration
// Maps RFM segments to icons and gradient colors for visual recognition
// Portuguese segment names (VIP, Frequente, Promissor, Novato, Esfriando, Inativo)
// These are DISTINCT from Churn Risk Level names to avoid confusion
const SEGMENT_AVATARS = {
    // Portuguese RFM segments (v3.4.0 - current)
    'VIP': { icon: Crown, from: 'from-amber-400', to: 'to-yellow-500', text: 'text-amber-900' },
    'Frequente': { icon: Heart, from: 'from-blue-500', to: 'to-indigo-600', text: 'text-white' },
    'Promissor': { icon: TrendingUp, from: 'from-cyan-400', to: 'to-blue-500', text: 'text-white' },
    'Novato': { icon: Sparkles, from: 'from-purple-500', to: 'to-violet-600', text: 'text-white' },
    'Esfriando': { icon: Eye, from: 'from-orange-400', to: 'to-amber-500', text: 'text-orange-900' },
    'Inativo': { icon: UserMinus, from: 'from-gray-500', to: 'to-slate-600', text: 'text-white' },
    // English legacy support
    'Champion': { icon: Crown, from: 'from-amber-400', to: 'to-yellow-500', text: 'text-amber-900' },
    'Loyal': { icon: Heart, from: 'from-blue-500', to: 'to-indigo-600', text: 'text-white' },
    'Potential': { icon: TrendingUp, from: 'from-cyan-400', to: 'to-blue-500', text: 'text-white' },
    'New': { icon: Sparkles, from: 'from-purple-500', to: 'to-violet-600', text: 'text-white' },
    'At Risk': { icon: AlertTriangle, from: 'from-red-500', to: 'to-rose-600', text: 'text-white' },
    'AtRisk': { icon: AlertTriangle, from: 'from-red-500', to: 'to-rose-600', text: 'text-white' },
    'Lost': { icon: UserMinus, from: 'from-gray-500', to: 'to-slate-600', text: 'text-white' },
    'Unclassified': { icon: User, from: 'from-slate-400', to: 'to-slate-500', text: 'text-white' },
    // Default fallback for any unmatched segment
    'default': { icon: User, from: 'from-lavpop-blue', to: 'to-blue-600', text: 'text-white' },
};

// High contrast risk pill styling - solid colors with white text for visibility
// Colors follow Design System v3.1 Status Indicators:
//   Info (Monitor) → blue, Warning (At Risk) → amber, Error (Churning) → red
const RISK_PILL_STYLES = {
    'Healthy': 'bg-emerald-500 text-white',
    'Monitor': 'bg-blue-500 text-white',
    'At Risk': 'bg-amber-500 text-white',
    'Churning': 'bg-red-600 text-white',
    'New Customer': 'bg-purple-500 text-white',
    'Lost': 'bg-slate-500 text-white',
};

// Light background styles for risk mini-cards with proper dark mode support
// Uses subtle 50-level colors for consistency with other mini-cards
const RISK_CARD_STYLES = {
    'Healthy': 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50',
    'Monitor': 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50',
    'At Risk': 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50',
    'Churning': 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50',
    'New Customer': 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50',
    'Lost': 'bg-slate-50 dark:bg-slate-700/20 border border-slate-200 dark:border-slate-600/50',
};

// Text colors for risk mini-cards with dark mode support
const RISK_CARD_TEXT = {
    'Healthy': 'text-green-700 dark:text-green-400',
    'Monitor': 'text-blue-700 dark:text-blue-400',
    'At Risk': 'text-amber-700 dark:text-amber-400',
    'Churning': 'text-red-700 dark:text-red-400',
    'New Customer': 'text-purple-700 dark:text-purple-400',
    'Lost': 'text-slate-700 dark:text-slate-400',
};
import { formatCurrency } from '../utils/numberUtils';
import { RISK_LABELS } from '../utils/customerMetrics';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useContactTracking } from '../hooks/useContactTracking';
import { addCommunicationEntry, getCommunicationLog, getCommunicationLogAsync, getDefaultNotes } from '../utils/communicationLog';
import { isValidBrazilianMobile, getPhoneValidationError } from '../utils/phoneUtils';
import { parseBrDate } from '../utils/dateUtils';
import { useBlacklist } from '../hooks/useBlacklist';
import { useSwipeToClose } from '../hooks/useSwipeToClose';
import { haptics } from '../utils/haptics';

const CustomerProfileModal = ({ customer, onClose, sales }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showCyclesTrend, setShowCyclesTrend] = useState(false);
    // Initialize empty, useEffect loads from backend asynchronously
    const [communicationLog, setCommunicationLog] = useState([]);
    const [isLoadingLog, setIsLoadingLog] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [noteMethod, setNoteMethod] = useState('call');
    // Use matchMedia hook instead of resize listener
    const isMobile = useMediaQuery('(max-width: 639px)');
    const prefersReducedMotion = useReducedMotion();

    // Swipe-to-close gesture for mobile
    const { handlers: swipeHandlers, style: swipeStyle, isDragging } = useSwipeToClose({
        onClose,
        threshold: 80,
        resistance: 0.5,
    });

    // Load communication log from backend (comm_logs table) on mount
    useEffect(() => {
        let mounted = true;

        const loadBackendLog = async () => {
            try {
                const log = await getCommunicationLogAsync(customer.doc);
                if (mounted) {
                    setCommunicationLog(log);
                }
            } catch (error) {
                console.warn('Failed to load backend communication log:', error);
                // Keep localStorage data on error
            } finally {
                if (mounted) {
                    setIsLoadingLog(false);
                }
            }
        };

        loadBackendLog();

        return () => {
            mounted = false;
        };
    }, [customer.doc]);

    // Shared contact tracking (syncs across app with effectiveness tracking)
    const { isContacted, toggleContacted, markContacted } = useContactTracking();
    const customerId = customer.doc || customer.id;
    const contacted = isContacted(customerId);

    // Customer context for effectiveness tracking
    const customerContext = {
        customerName: customer.name || null,
        riskLevel: customer.riskLevel || null
    };

    // Phone validation for WhatsApp
    const hasValidPhone = customer.hasValidPhone !== undefined
        ? customer.hasValidPhone
        : (customer.phone && isValidBrazilianMobile(customer.phone));
    const phoneError = !hasValidPhone && customer.phone
        ? getPhoneValidationError(customer.phone)
        : null;

    // Blacklist check (takes precedence over contacted status)
    const { isBlacklisted, getBlacklistReason } = useBlacklist();

    // Escape key handler - consistent with CustomerSegmentModal
    useEffect(() => {
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [onClose]);

    // Lock body scroll when modal is open (iOS-compatible)
    useEffect(() => {
        // Save current scroll position and styles
        const scrollY = window.scrollY;
        const originalStyles = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            top: document.body.style.top,
            left: document.body.style.left,
            right: document.body.style.right,
            width: document.body.style.width,
        };

        // Lock scrolling - position:fixed prevents iOS scroll-through
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';

        return () => {
            // Restore original styles
            document.body.style.overflow = originalStyles.overflow;
            document.body.style.position = originalStyles.position;
            document.body.style.top = originalStyles.top;
            document.body.style.left = originalStyles.left;
            document.body.style.right = originalStyles.right;
            document.body.style.width = originalStyles.width;
            // Restore scroll position
            window.scrollTo(0, scrollY);
        };
    }, []);

    // Click-outside handler
    const handleBackdropClick = useCallback((e) => {
        // Only close if clicking the backdrop itself, not the modal content
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // Toggle cycles trend panel
    const toggleCyclesTrend = useCallback(() => {
        haptics.light();
        setShowCyclesTrend(prev => !prev);
    }, []);

    const blacklisted = isBlacklisted(customer.phone);
    const blacklistInfo = blacklisted ? getBlacklistReason(customer.phone) : null;

    // Listen for communication log updates from other components
    useEffect(() => {
        const handleLogUpdate = async (event) => {
            // Only update if it's for this customer
            if (event.detail?.customerId === customer.doc) {
                // Fetch fresh data from backend to ensure consistency
                try {
                    const log = await getCommunicationLogAsync(customer.doc);
                    setCommunicationLog(log);
                } catch (error) {
                    console.warn('Failed to refresh communication log:', error);
                    // Keep current state on error (already an array)
                }
            }
        };

        window.addEventListener('communicationLogUpdate', handleLogUpdate);
        return () => window.removeEventListener('communicationLogUpdate', handleLogUpdate);
    }, [customer.doc]);

    // Add communication entry (manual form submission)
    const addCommunication = () => {
        if (!newNote.trim()) return;

        // Use shared utility (will dispatch event for sync)
        // Event listener will update communicationLog state automatically
        addCommunicationEntry(customer.doc, noteMethod, newNote);
        setNewNote('');
    };

    // Get risk configuration
    const riskConfig = RISK_LABELS[customer.riskLevel] || RISK_LABELS['Lost'];

    // Quick actions - use shared utility for communication logging
    // Event listener updates communicationLog state automatically via dispatched event
    const handleCall = () => {
        if (customer.phone) {
            window.location.href = `tel:${customer.phone}`;
            // Auto-log call attempt (uses shared utility, dispatches event)
            addCommunicationEntry(customer.doc, 'call', getDefaultNotes('call'));
            // Mark as contacted with context (for effectiveness tracking)
            if (customerId && !contacted) {
                markContacted(customerId, 'call', customerContext);
            }
        }
    };

    const handleWhatsApp = () => {
        if (hasValidPhone && customer.phone) {
            const cleanPhone = customer.phone.replace(/\D/g, '');
            // Ensure country code for WhatsApp
            const whatsappPhone = cleanPhone.length === 11 ? '55' + cleanPhone : cleanPhone;
            window.open(`https://wa.me/${whatsappPhone}`, '_blank');
            // Auto-log WhatsApp (uses shared utility, dispatches event)
            addCommunicationEntry(customer.doc, 'whatsapp', getDefaultNotes('whatsapp'));
            // Mark as contacted with context (for effectiveness tracking)
            if (customerId && !contacted) {
                markContacted(customerId, 'whatsapp', customerContext);
            }
        }
    };

    const handleEmail = () => {
        if (customer.email) {
            window.location.href = `mailto:${customer.email}`;
            // Auto-log email (uses shared utility, dispatches event)
            addCommunicationEntry(customer.doc, 'email', getDefaultNotes('email'));
            // Mark as contacted with context (for effectiveness tracking)
            if (customerId && !contacted) {
                markContacted(customerId, 'email', customerContext);
            }
        }
    };

    const handleMarkContacted = () => {
        if (contacted) {
            toggleContacted(customerId);
        } else {
            markContacted(customerId, 'manual', customerContext);
        }
    };

    // parseBrDate now imported from dateUtils.js for consistent timezone handling

    // Mask CPF for privacy: 12345678901 → 123.***.***-01
    const maskCpf = (cpf) => {
        if (!cpf) return '-';
        const clean = String(cpf).replace(/\D/g, '');
        if (clean.length !== 11) return cpf; // Return as-is if not valid CPF length
        return `${clean.slice(0, 3)}.***.***-${clean.slice(-2)}`;
    };

    // Helper for parsing machines - extracts machine codes (e.g., "Lavadora:3" -> "L3")
    // Also detects "Recarga" (credit top-up) transactions
    const parseMachines = (machineStr) => {
        if (!machineStr || machineStr === 'N/A') return [];

        // Check for Recarga (credit top-up) first
        if (machineStr.toLowerCase().includes('recarga')) {
            return [{ code: 'Recarga', type: 'recarga' }];
        }

        const parts = machineStr.split(',').map((s) => s.trim());
        const machines = [];

        parts.forEach((part) => {
            const washMatch = part.match(/Lavadora:\s*(\d+)/i);
            if (washMatch) {
                machines.push({ code: `L${washMatch[1]}`, type: 'wash' });
                return;
            }

            const dryMatch = part.match(/Secadora:\s*(\d+)/i);
            if (dryMatch) {
                machines.push({ code: `S${dryMatch[1]}`, type: 'dry' });
                return;
            }
        });

        return machines;
    };

    // Transaction History Logic (Copied from CustomerDetailModal for consistency)
    const transactionHistory = useMemo(() => {
        if (!sales || sales.length === 0) return [];

        return sales
            .filter((row) => {
                const doc = String(row.Doc_Cliente || row.document || '').replace(/\D/g, '').padStart(11, '0');
                return doc === customer.doc;
            })
            .map((row) => {
                const dateStr = row.Data_Hora || row.Data || '';
                const date = parseBrDate(dateStr);
                const amountStr = String(row.Valor_Pago || row.net_value || '0');
                const amount = parseFloat(amountStr.replace(',', '.'));
                const machineStr = row.Maquinas || row.Maquina || row.machine || '';
                const machines = parseMachines(machineStr);

                return {
                    date,
                    dateValid: date instanceof Date && !Number.isNaN(date.getTime()),
                    amount,
                    cycles: machines.length,
                    machineStr,
                    machines
                };
            })
            .filter((txn) => txn.dateValid)
            .sort((a, b) => b.date - a.date)
            .slice(0, 5); // Limit to last 5 transactions
    }, [sales, customer.doc, isMobile]);

    // Calculate revenue breakdown
    const revenueBreakdown = useMemo(() => {
        const washPct = parseFloat(customer.washPercentage) || 0;
        const dryPct = parseFloat(customer.dryPercentage) || 0;
        return {
            wash: customer.washRevenue || 0,
            dry: customer.dryRevenue || 0,
            washPct,
            dryPct,
        };
    }, [customer]);

    // Portal rendering for proper z-index stacking
    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-0 sm:p-4 animate-fade-in"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-profile-title"
        >
            <div
                className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-none sm:rounded-2xl shadow-2xl max-w-2xl w-full h-full sm:h-auto max-h-full sm:max-h-[90vh] overflow-hidden flex flex-col border-0 sm:border border-white/20 dark:border-slate-700/50"
                onClick={(e) => e.stopPropagation()}
                style={swipeStyle}
                {...swipeHandlers}
            >
                {/* Swipe handle indicator (mobile only) */}
                <div className="sm:hidden flex justify-center pt-2 pb-1">
                    <div
                        className={`w-10 h-1 rounded-full transition-colors ${
                            isDragging ? 'bg-slate-400 dark:bg-slate-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        aria-hidden="true"
                    />
                </div>
                {/* Header - Simplified with Segment Avatar */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 px-4 py-3 sm:px-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            {/* Segment-based Avatar */}
                            {(() => {
                                const avatarConfig = SEGMENT_AVATARS[customer.segment] || SEGMENT_AVATARS['default'];
                                const AvatarIcon = avatarConfig.icon;
                                return (
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarConfig.from} ${avatarConfig.to} flex items-center justify-center ${avatarConfig.text} shadow-md`}>
                                        <AvatarIcon className="w-5 h-5" />
                                    </div>
                                );
                            })()}
                            <div className="flex-1 min-w-0">
                                <button
                                    onClick={toggleCyclesTrend}
                                    className="flex items-center gap-1.5 group text-left"
                                    title="Ver histórico de ciclos"
                                >
                                    <h2 id="customer-profile-title" className="text-base sm:text-xl font-bold text-slate-800 dark:text-white truncate group-hover:text-lavpop-blue dark:group-hover:text-blue-400 transition-colors">
                                        {customer.name}
                                    </h2>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-lavpop-blue dark:group-hover:text-blue-400 transition-all flex-shrink-0 ${showCyclesTrend ? 'rotate-180' : ''}`} />
                                </button>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {/* Blacklist indicator */}
                                    {blacklisted && (
                                        <div
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-red-600 text-white shadow-sm cursor-help"
                                            title={blacklistInfo?.reason || 'Bloqueado'}
                                        >
                                            <Ban className="w-3 h-3" />
                                            Bloqueado
                                        </div>
                                    )}
                                    {/* Risk status pill - high contrast */}
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase shadow-sm ${RISK_PILL_STYLES[customer.riskLevel] || 'bg-slate-500 text-white'}`}>
                                        {riskConfig.pt}
                                    </div>
                                    {/* Segment pill - gradient matching avatar */}
                                    {(() => {
                                        const segConfig = SEGMENT_AVATARS[customer.segment] || SEGMENT_AVATARS['default'];
                                        return (
                                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${segConfig.from} ${segConfig.to} ${segConfig.text} shadow-sm`}>
                                                {customer.segment}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            {/* Quick Actions - desktop only (contacted toggle moved to Communication History) */}
                            {/* Hide all actions if blacklisted */}
                            {!blacklisted && (
                                <div className="hidden sm:flex gap-2">
                                    {customer.phone && (
                                        <>
                                            {/* Call button */}
                                            <button
                                                onClick={handleCall}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-lavpop-blue hover:text-white transition-colors text-xs font-semibold border border-slate-200 dark:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                                            >
                                                <Phone className="w-3 h-3" />
                                                <span className="hidden min-[500px]:inline">Ligar</span>
                                            </button>
                                            {/* WhatsApp button - disabled if phone is invalid */}
                                            <button
                                                onClick={handleWhatsApp}
                                                disabled={!hasValidPhone}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                                                    hasValidPhone
                                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white border-green-200 dark:border-green-800 cursor-pointer'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600 cursor-not-allowed'
                                                }`}
                                                title={hasValidPhone ? 'WhatsApp' : (phoneError || 'Número inválido para WhatsApp')}
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                <span className="hidden min-[500px]:inline">WhatsApp</span>
                                            </button>
                                        </>
                                    )}
                                    {/* Email button */}
                                    {customer.email && (
                                        <button
                                            onClick={handleEmail}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-colors text-xs font-semibold border border-blue-200 dark:border-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                                        >
                                            <Mail className="w-3 h-3" />
                                            <span className="hidden min-[500px]:inline">Email</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => { haptics.light(); onClose(); }}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors ml-2 sm:ml-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                            aria-label="Fechar"
                        >
                            <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Expandable Cycles Trend Panel */}
                <AnimatePresence>
                    {showCyclesTrend && (
                        <motion.div
                            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeInOut' }}
                            className="border-b border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                            <CustomerCyclesTrend
                                sales={sales}
                                customerDoc={customer.doc}
                                onCollapse={toggleCyclesTrend}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tab Navigation - No horizontal scroll, icons + text */}
                <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex px-2 sm:px-4">
                        <button
                            onClick={() => { haptics.tick(); setActiveTab('profile'); }}
                            className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 rounded-t-lg ${activeTab === 'profile'
                                ? 'border-lavpop-blue text-lavpop-blue dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            <span className="hidden sm:inline">Perfil</span>
                            <span className="sm:hidden">Perfil</span>
                        </button>
                        <button
                            onClick={() => { haptics.tick(); setActiveTab('financial'); }}
                            className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 rounded-t-lg ${activeTab === 'financial'
                                ? 'border-lavpop-blue text-lavpop-blue dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            <DollarSign className="w-4 h-4" />
                            <span className="hidden sm:inline">Financeiro</span>
                            <span className="sm:hidden">Finan.</span>
                        </button>
                        <button
                            onClick={() => { haptics.tick(); setActiveTab('behavior'); }}
                            className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 rounded-t-lg ${activeTab === 'behavior'
                                ? 'border-lavpop-blue text-lavpop-blue dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            <Activity className="w-4 h-4" />
                            <span className="hidden sm:inline">Comportamento</span>
                            <span className="sm:hidden">Comport.</span>
                        </button>
                        <button
                            onClick={() => { haptics.tick(); setActiveTab('history'); }}
                            className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 rounded-t-lg ${activeTab === 'history'
                                ? 'border-lavpop-blue text-lavpop-blue dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">Histórico</span>
                            <span className="sm:hidden">Hist.</span>
                        </button>
                    </div>
                </div>

                {/* Tab Content - Optimized Padding with safe area for floating action bar */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-24 sm:pb-4 custom-scrollbar">
                    {/* TAB 1: Profile & Contact */}
                    {activeTab === 'profile' && (
                        <div className="space-y-3 sm:space-y-4">
                            {/* Personal Information */}
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
                                    Informações Pessoais
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">CPF</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-white">{maskCpf(customer.doc)}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Telefone</div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-semibold text-slate-800 dark:text-white">{customer.phone || 'N/A'}</span>
                                            {customer.phone && !hasValidPhone && (
                                                <span title={phoneError || 'Número inválido para WhatsApp'}>
                                                    <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Email</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-white truncate">{customer.email || 'N/A'}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Cadastro</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-white">
                                            {customer.firstVisit ? customer.firstVisit.toLocaleDateString('pt-BR') : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Wallet & Incentives */}
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    Carteira & Cashback
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border-2 border-green-200 dark:border-green-800">
                                        <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-1">Saldo Disponível</div>
                                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {formatCurrency(customer.walletBalance || 0)}
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Segmento RFM</div>
                                        <div className="text-base font-bold text-slate-800 dark:text-white truncate">
                                            {customer.segment}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Communication Log */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
                                        Histórico de Comunicação
                                    </h3>
                                    {/* Contacted Toggle - visible on all devices */}
                                    <button
                                        onClick={handleMarkContacted}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${contacted
                                            ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600'
                                            }`}
                                    >
                                        <Check className="w-3 h-3" />
                                        {contacted ? 'Contactado' : 'Marcar contactado'}
                                    </button>
                                </div>

                                {/* Add New Entry */}
                                <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 mb-2 border border-slate-200 dark:border-slate-600">
                                    <div className="flex flex-wrap gap-1.5">
                                        <select
                                            value={noteMethod}
                                            onChange={(e) => setNoteMethod(e.target.value)}
                                            className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0"
                                        >
                                            <option value="call">Ligação</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="email">Email</option>
                                            <option value="note">Nota</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            placeholder="Adicionar nota..."
                                            className="flex-1 min-w-0 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                                            onKeyPress={(e) => e.key === 'Enter' && addCommunication()}
                                        />
                                        <button
                                            onClick={addCommunication}
                                            className="px-3 py-1.5 bg-lavpop-blue text-white rounded-lg font-semibold text-xs hover:bg-blue-600 transition-colors flex items-center gap-1.5 flex-shrink-0"
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span className="hidden sm:inline">Adicionar</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Communication History */}
                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    {isLoadingLog ? (
                                        <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                                            <div className="animate-pulse">Carregando histórico...</div>
                                        </div>
                                    ) : communicationLog.length === 0 ? (
                                        <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                                            Nenhuma comunicação registrada
                                        </div>
                                    ) : (
                                        communicationLog.map((entry, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-600 flex-shrink-0">
                                                            {entry.method === 'call' && <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                                            {entry.method === 'whatsapp' && <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />}
                                                            {entry.method === 'email' && <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                                                            {entry.method === 'note' && <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-semibold text-slate-800 dark:text-white">
                                                                {entry.notes}
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {new Date(entry.date).toLocaleString('pt-BR')}
                                                                </span>
                                                                {/* Show campaign badge if from a campaign */}
                                                                {entry.campaign_name && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                                        {entry.campaign_name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Financial Summary */}
                    {activeTab === 'financial' && (
                        <div className="space-y-3 sm:space-y-4">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
                                Resumo Financeiro
                            </h3>

                            {/* Lifetime Value */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border-2 border-blue-200 dark:border-blue-800">
                                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-0.5">Total Gasto</div>
                                    <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                        {formatCurrency(customer.netTotal)}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Ticket Médio</div>
                                    <div className="text-base font-bold text-slate-800 dark:text-white">
                                        {formatCurrency(customer.netTotal / customer.transactions)}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Transações</div>
                                    <div className="text-base font-bold text-slate-800 dark:text-white">
                                        {customer.transactions}
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Breakdown */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Breakdown por Serviço</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-3 border border-sky-200 dark:border-sky-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase">Lavagem</div>
                                            <div className="text-xs font-bold text-sky-700 dark:text-sky-300">{revenueBreakdown.washPct}%</div>
                                        </div>
                                        <div className="text-lg font-bold text-sky-700 dark:text-sky-300">
                                            {formatCurrency(revenueBreakdown.wash)}
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{customer.washServices} serviços</div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Secagem</div>
                                            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{revenueBreakdown.dryPct}%</div>
                                        </div>
                                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                            {formatCurrency(revenueBreakdown.dry)}
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{customer.dryServices} serviços</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: Behavior & Risk */}
                    {activeTab === 'behavior' && (
                        <div className="space-y-3 sm:space-y-4">
                            {/* Visit Pattern */}
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
                                    Padrão de Visitas
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Total Visitas</div>
                                        <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{customer.visits}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Média Entre Visitas</div>
                                        <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                                            {customer.avgDaysBetween || 'N/A'}d
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Última Visita</div>
                                        <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                                            {customer.daysSinceLastVisit}d
                                        </div>
                                    </div>
                                    {customer.daysOverdue > 0 && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800">
                                            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-0.5">Atraso</div>
                                            <div className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-300">
                                                {customer.daysOverdue}d
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Risk Assessment */}
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    Avaliação de Risco
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`${RISK_CARD_STYLES[customer.riskLevel] || RISK_CARD_STYLES['Lost']} rounded-lg p-3`}>
                                        <div className={`text-xs font-bold ${RISK_CARD_TEXT[customer.riskLevel] || RISK_CARD_TEXT['Lost']} uppercase mb-0.5`}>Nível de Risco</div>
                                        <div className={`text-base sm:text-lg font-bold ${RISK_CARD_TEXT[customer.riskLevel] || RISK_CARD_TEXT['Lost']}`}>{riskConfig.pt}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Probabilidade de Retorno</div>
                                        <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{customer.returnLikelihood}%</div>
                                    </div>
                                </div>

                                {/* Recommended Action - Hidden on mobile */}
                                <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800 hidden sm:block">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                                        <div>
                                            <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-0.5">Ação Recomendada</div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400">
                                                {customer.riskLevel === 'Churning' && 'Contato urgente necessário! Cliente em risco crítico de churn.'}
                                                {customer.riskLevel === 'At Risk' && 'Agendar contato em breve. Oferecer promoção ou incentivo.'}
                                                {customer.riskLevel === 'Monitor' && 'Monitorar comportamento. Considerar campanha de engajamento.'}
                                                {customer.riskLevel === 'Healthy' && 'Cliente saudável. Manter relacionamento e qualidade.'}
                                                {customer.riskLevel === 'New Customer' && 'Cliente novo. Garantir boa primeira experiência.'}
                                                {customer.riskLevel === 'Lost' && 'Cliente perdido. Campanha de reativação necessária.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Preferences */}
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-lavpop-green dark:text-green-400" />
                                    Preferências de Serviço
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="bg-white dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-600 hidden sm:block">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Serviços/Visita</div>
                                        <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{customer.servicesPerVisit}</div>
                                    </div>
                                    <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-2.5 border border-sky-200 dark:border-sky-800">
                                        <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase mb-0.5">Preferência Lavagem</div>
                                        <div className="text-base sm:text-lg font-bold text-sky-700 dark:text-sky-300">{customer.washPercentage}%</div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 border border-emerald-200 dark:border-emerald-800">
                                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-0.5">Preferência Secagem</div>
                                        <div className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300">{customer.dryPercentage}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: Transaction History - ULTRA COMPACT */}
                    {activeTab === 'history' && (
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
                                Últimas 5 Transações
                            </h3>

                            {/* Transaction History Table */}
                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                <table className="w-full">
                                    <thead className="bg-slate-200 dark:bg-slate-700 text-xs sm:text-xs uppercase text-slate-700 dark:text-slate-300 font-semibold">
                                        <tr>
                                            <th className="px-2 py-2 sm:px-3 text-center">Data</th>
                                            <th className="px-2 py-2 sm:px-3 text-center">Serviços</th>
                                            <th className="px-2 py-2 sm:px-3 text-center min-[400px]:table-cell hidden">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {transactionHistory.length > 0 ? (
                                            transactionHistory.map((tx, i) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-2 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap">
                                                        <div className="text-center">
                                                            <div className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                                                                {tx.date.toLocaleDateString('pt-BR')}
                                                            </div>
                                                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                                                {tx.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 sm:px-3 sm:py-2.5">
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {tx.machines.map((m, idx) => (
                                                                <span key={idx} className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs sm:text-xs font-semibold ${
                                                                    m.type === 'recarga'
                                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                                        : m.type === 'dry'
                                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                                            : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                                                                    }`}>
                                                                    {m.code}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 sm:px-3 sm:py-2.5 text-center font-bold text-slate-700 dark:text-slate-200 text-xs min-[400px]:table-cell hidden">
                                                        {formatCurrency(tx.amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-3 py-6 text-center text-slate-600 dark:text-slate-400 text-sm">
                                                    Nenhuma transação encontrada
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Quick Actions - Fixed bottom bar */}
                {!blacklisted && (customer.phone || customer.email) && (
                    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[70]
                                    bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl
                                    border-t border-slate-200 dark:border-slate-700
                                    px-4 py-3 pb-safe flex gap-2">
                        {customer.phone && (
                            <>
                                <button
                                    onClick={() => { haptics.light(); handleCall(); }}
                                    className="flex-1 min-h-[44px] flex items-center justify-center gap-2
                                             bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200
                                             rounded-xl font-semibold text-sm
                                             hover:bg-lavpop-blue hover:text-white transition-colors
                                             focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue"
                                >
                                    <Phone className="w-5 h-5" />
                                    Ligar
                                </button>
                                <button
                                    onClick={() => { haptics.light(); handleWhatsApp(); }}
                                    disabled={!hasValidPhone}
                                    className={`flex-1 min-h-[44px] flex items-center justify-center gap-2
                                             rounded-xl font-semibold text-sm transition-colors
                                             focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
                                             ${hasValidPhone
                                                 ? 'bg-green-500 text-white hover:bg-green-600'
                                                 : 'bg-slate-200 dark:bg-slate-600 text-slate-400 cursor-not-allowed'
                                             }`}
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    WhatsApp
                                </button>
                            </>
                        )}
                        {customer.email && (
                            <button
                                onClick={() => { haptics.light(); handleEmail(); }}
                                className="flex-1 min-h-[44px] flex items-center justify-center gap-2
                                         bg-blue-500 text-white rounded-xl font-semibold text-sm
                                         hover:bg-blue-600 transition-colors
                                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                                <Mail className="w-5 h-5" />
                                Email
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default CustomerProfileModal;
