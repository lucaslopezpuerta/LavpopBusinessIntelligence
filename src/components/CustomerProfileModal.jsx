// CustomerProfileModal.jsx v4.9 - MOBILE SAFE AREA COMPLIANCE
// Comprehensive customer profile modal for Customer Directory
// Design System v5.1 compliant - Variant D (Glassmorphism Cosmic)
//
// CHANGELOG:
// v4.9 (2026-01-28): Bottom action bar safe area fix
//   - Increased content pb-20 → pb-28 to fully clear action bar + Android nav
//   - Action bar uses pb-safe (48px on Android via --native-safe-area-bottom)
//   - Prevents content from hiding behind floating action buttons
// v4.8 (2026-01-28): Mobile full-screen and safe area fix
//   - Uses h-[100dvh] for proper full-screen on mobile (dynamic viewport height)
//   - Changed rounded-none to rounded-t-2xl for bottom-sheet style
//   - pt-safe now works with new CSS definition (max with Android fallback)
// v4.7 (2026-01-27): Animation standardization
//   - Added Framer Motion entrance animations using MODAL constants
//   - Replaced CSS animate-fade-in with motion.div for backdrop
//   - Added proper exit animations via AnimatePresence
//   - Uses existing useReducedMotion hook for accessibility
// v4.6 (2026-01-18): Improved card label contrast in dark mode
//   - Changed all card titles from dark:text-slate-400 to dark:text-slate-300
//   - Better readability for CPF, Telefone, Email, Desde, Segmento RFM, etc.
// v4.5 (2026-01-18): Prominent WhatsApp button
//   - Changed desktop WhatsApp from ghost to solid cosmic-green
//   - Now matches mobile floating bar prominence
//   - Added subtle shadow for depth (shadow-cosmic-green/25)
// v4.4 (2026-01-18): Cosmic action buttons design
//   - Header buttons: stellar-cyan (call), cosmic-green (WhatsApp), stellar-blue (email)
//   - Mobile floating bar: Same cosmic color scheme
//   - Uses new cosmic-green (#00d68f) from Design System v5.1
// v4.3 (2026-01-18): Service sparklines in Financial tab
//   - NEW: MiniSparkline inline component for 6-month service trends
//   - Added sparklines to Lavagem/Secagem cards filling empty space
//   - Uses washSparkline/drySparkline data from customerMetrics.js v3.13.0
//   - Sparklines show service count trend with gradient fill
// v4.2 (2026-01-18): Balanced mobile layout
//   - FIXED: Text was too small (9-10px) and space was wasted
//   - Now uses flexbox with h-full and flex-1 to fill viewport properly
//   - Minimum text size increased to 11px for labels, 12px+ for values
//   - Larger cards with p-3 padding and rounded-xl corners
//   - Profile tab: 2x2 grid for personal info, larger wallet cards
//   - Financial tab: Hero total card, larger service breakdown
//   - Behavior tab: 2x2 grid for visit stats, proper spacing
//   - Communication log fills remaining space with scrollable entries
//   - All value text now text-lg to text-xl for readability
// v4.0 (2026-01-18): Cosmic Design System v5.0 overhaul
//   - Full glassmorphism styling with space-dust/space-nebula backgrounds
//   - Stellar-cyan accent colors throughout (borders, active states, icons)
//   - Updated header with cosmic gradient and improved safe area handling
//   - Redesigned tabs with stellar-cyan active indicators
//   - Glassmorphism content cards with subtle borders
//   - Ghost-style action buttons (transparent bg, subtle borders)
//   - Enhanced mobile floating action bar with cosmic styling
//   - Improved dark mode contrast and visual hierarchy
//   - Framer Motion animations preserved
// v3.7 (2026-01-12): Fix header safe area gradient in dark mode
//   - Moved pt-safe from container to header wrapper
//   - Header gradient now extends into safe area (no color mismatch)
//   - Swipe handle now sits on header gradient background
// v3.6 (2026-01-12): Full-screen safe area compliance
//   - Added pt-safe to modal container for top notch/Dynamic Island on mobile
//   - Full-screen mobile modals now respect both top and bottom safe areas
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
import { MODAL } from '../constants/animations';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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

// MiniSparkline - Inline SVG sparkline for service trend visualization
// Displays last 6 months of data as a smooth area chart
const MiniSparkline = ({ data, color = 'sky', height = 32, className = '' }) => {
    const width = 80;
    const padding = 2;

    // Handle empty or all-zero data
    const hasData = data && data.length > 0 && data.some(v => v > 0);
    if (!hasData) {
        return (
            <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">Sem dados</span>
            </div>
        );
    }

    const maxVal = Math.max(...data, 1); // Avoid division by zero
    const points = data.map((val, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((val / maxVal) * (height - 2 * padding));
        return `${x},${y}`;
    });

    // Build path for line and area
    const linePath = `M ${points.join(' L ')}`;
    const areaPath = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;

    // Color mapping
    const colorMap = {
        sky: { stroke: '#0ea5e9', fill: 'url(#sparkline-sky)' },
        emerald: { stroke: '#10b981', fill: 'url(#sparkline-emerald)' },
    };
    const colorConfig = colorMap[color] || colorMap.sky;

    return (
        <svg width={width} height={height} className={className}>
            <defs>
                <linearGradient id="sparkline-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="sparkline-emerald" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={colorConfig.fill} />
            <path d={linePath} fill="none" stroke={colorConfig.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dot on the last point */}
            {points.length > 0 && (() => {
                const lastPoint = points[points.length - 1].split(',');
                return (
                    <circle cx={lastPoint[0]} cy={lastPoint[1]} r="2.5" fill={colorConfig.stroke} />
                );
            })()}
        </svg>
    );
};

const CustomerProfileModal = ({ customer, onClose, sales }) => {
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
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="customer-profile-title"
            >
                {/* Backdrop */}
                <motion.div
                    {...(prefersReducedMotion ? MODAL.BACKDROP_REDUCED : MODAL.BACKDROP)}
                    className="absolute inset-0 bg-black/50 dark:bg-black/70 dark:backdrop-blur-sm"
                    onClick={handleBackdropClick}
                />

                {/* Modal Content */}
                <motion.div
                    {...(prefersReducedMotion ? MODAL.CONTENT_REDUCED : MODAL.CONTENT)}
                    className="relative bg-white dark:bg-space-dust/95 dark:backdrop-blur-xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col border-0 sm:border border-slate-200 dark:border-stellar-cyan/15"
                    onClick={(e) => e.stopPropagation()}
                    style={swipeStyle}
                    {...swipeHandlers}
                >
                {/* Header wrapper with safe area - cosmic gradient background */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-space-nebula dark:to-space-dust pt-safe sm:pt-0 border-b border-slate-200 dark:border-stellar-cyan/10 rounded-t-2xl">
                    {/* Swipe handle indicator (mobile only) */}
                    <div className="sm:hidden flex justify-center pt-2 pb-1">
                        <div
                            className={`w-10 h-1 rounded-full transition-colors ${
                                isDragging ? 'bg-slate-400 dark:bg-stellar-cyan/50' : 'bg-slate-300 dark:bg-stellar-cyan/20'
                            }`}
                            aria-hidden="true"
                        />
                    </div>
                    {/* Header content */}
                    <div className="px-4 py-3 sm:px-5">
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
                                    <h2 id="customer-profile-title" className="text-base sm:text-xl font-bold text-slate-800 dark:text-white truncate group-hover:text-stellar-cyan transition-colors">
                                        {customer.name}
                                    </h2>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-stellar-cyan transition-all flex-shrink-0 ${showCyclesTrend ? 'rotate-180' : ''}`} />
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
                            {/* v4.4: Cosmic design with stellar-cyan (call), cosmic-green (WhatsApp), stellar-blue (email) */}
                            {!blacklisted && (
                                <div className="hidden sm:flex gap-2">
                                    {customer.phone && (
                                        <>
                                            {/* Call button - Stellar cyan cosmic style */}
                                            <button
                                                onClick={handleCall}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stellar-cyan/10 dark:bg-stellar-cyan/15 text-stellar-cyan border border-stellar-cyan/30 dark:border-stellar-cyan/25 hover:bg-stellar-cyan/20 dark:hover:bg-stellar-cyan/25 hover:border-stellar-cyan/50 transition-all text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                                <span className="hidden min-[500px]:inline">Ligar</span>
                                            </button>
                                            {/* WhatsApp button - Solid cosmic green (primary action) */}
                                            <button
                                                onClick={handleWhatsApp}
                                                disabled={!hasValidPhone}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-green/40 ${
                                                    hasValidPhone
                                                        ? 'bg-cosmic-green text-white border-cosmic-green hover:bg-cosmic-green/90 shadow-sm shadow-cosmic-green/25 cursor-pointer'
                                                        : 'bg-slate-100/50 dark:bg-space-void/30 text-slate-400 dark:text-slate-500 border-transparent cursor-not-allowed opacity-60'
                                                }`}
                                                title={hasValidPhone ? 'WhatsApp' : (phoneError || 'Número inválido para WhatsApp')}
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                <span className="hidden min-[500px]:inline">WhatsApp</span>
                                            </button>
                                        </>
                                    )}
                                    {/* Email button - Stellar blue cosmic style */}
                                    {customer.email && (
                                        <button
                                            onClick={handleEmail}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stellar-blue/10 dark:bg-blue-500/15 text-stellar-blue dark:text-blue-400 border border-stellar-blue/30 dark:border-blue-500/25 hover:bg-stellar-blue/20 dark:hover:bg-blue-500/25 hover:border-stellar-blue/50 dark:hover:border-blue-500/50 transition-all text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-blue/40"
                                        >
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="hidden min-[500px]:inline">Email</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => { haptics.light(); onClose(); }}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-space-nebula rounded-lg transition-colors ml-2 sm:ml-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40"
                            aria-label="Fechar"
                        >
                            <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
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
                            className="border-b border-slate-200 dark:border-stellar-cyan/10 overflow-hidden"
                        >
                            <CustomerCyclesTrend
                                sales={sales}
                                customerDoc={customer.doc}
                                onCollapse={toggleCyclesTrend}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tab Navigation - shadcn Tabs with cosmic styling */}
                <Tabs defaultValue="profile" className="flex flex-col flex-1 min-h-0" onValueChange={() => haptics.tick()}>
                    <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b border-slate-200 dark:border-stellar-cyan/10 bg-white dark:bg-space-dust/50 h-auto p-0 px-2 sm:px-4">
                        <TabsTrigger
                            value="profile"
                            className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-stellar-cyan data-[state=active]:text-stellar-cyan data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <User className="w-4 h-4" />
                            <span className="hidden sm:inline">Perfil</span>
                            <span className="sm:hidden">Perfil</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="financial"
                            className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-stellar-cyan data-[state=active]:text-stellar-cyan data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <DollarSign className="w-4 h-4" />
                            <span className="hidden sm:inline">Financeiro</span>
                            <span className="sm:hidden">Finan.</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="behavior"
                            className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-stellar-cyan data-[state=active]:text-stellar-cyan data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <Activity className="w-4 h-4" />
                            <span className="hidden sm:inline">Comportamento</span>
                            <span className="sm:hidden">Comport.</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-stellar-cyan data-[state=active]:text-stellar-cyan data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">Histórico</span>
                            <span className="sm:hidden">Hist.</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab Content - Fill viewport on mobile, safe area for floating action bar */}
                    {/* pb-28 (112px) = action bar height (56px) + Android nav safe area (48px) + 8px buffer */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-28 sm:pb-4 custom-scrollbar">
                        {/* TAB 1: Profile & Contact - Flex layout to fill space on mobile */}
                        <TabsContent value="profile" className="mt-0">
                        <div className="flex flex-col h-full gap-3 sm:gap-4">
                            {/* Personal Information - 2x2 grid on mobile */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-stellar-cyan" />
                                    Informações Pessoais
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-lg p-2.5 border border-slate-200 dark:border-stellar-cyan/10">
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-0.5">CPF</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-white">{maskCpf(customer.doc)}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-lg p-2.5 border border-slate-200 dark:border-stellar-cyan/10">
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-0.5">Telefone</div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-semibold text-slate-800 dark:text-white">{customer.phone || 'N/A'}</span>
                                            {customer.phone && !hasValidPhone && (
                                                <span title={phoneError || 'Número inválido para WhatsApp'}>
                                                    <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-lg p-2.5 border border-slate-200 dark:border-stellar-cyan/10">
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-0.5">Email</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-white truncate">{customer.email || 'N/A'}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-lg p-2.5 border border-slate-200 dark:border-stellar-cyan/10">
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-0.5">Desde</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-white">
                                            {customer.firstVisit ? customer.firstVisit.toLocaleDateString('pt-BR') : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Wallet & Incentives */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                    Carteira & Cashback
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-500/20">
                                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Saldo Disponível</div>
                                        <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                            {formatCurrency(customer.walletBalance || 0)}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-lg p-3 border border-slate-200 dark:border-stellar-cyan/10">
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Segmento RFM</div>
                                        <div className="text-base font-bold text-slate-800 dark:text-white">
                                            {customer.segment}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Communication Log - Flex-1 to fill remaining space */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4 text-stellar-cyan" />
                                        Comunicação
                                    </h3>
                                    <button
                                        onClick={handleMarkContacted}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${contacted
                                            ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                                            : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-stellar-cyan/20 hover:bg-slate-100 dark:hover:bg-space-nebula'
                                            }`}
                                    >
                                        <Check className="w-3 h-3" />
                                        {contacted ? 'Contactado' : 'Marcar'}
                                    </button>
                                </div>

                                {/* Add New Entry */}
                                <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-lg p-2.5 mb-2 border border-slate-200 dark:border-stellar-cyan/10">
                                    <div className="flex gap-1.5">
                                        <select
                                            value={noteMethod}
                                            onChange={(e) => setNoteMethod(e.target.value)}
                                            className="px-2 py-1.5 bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/15 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-stellar-cyan/40"
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
                                            className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/15 rounded-lg text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-stellar-cyan/40"
                                            onKeyPress={(e) => e.key === 'Enter' && addCommunication()}
                                        />
                                        <button
                                            onClick={addCommunication}
                                            className="px-3 py-1.5 bg-gradient-stellar text-white rounded-lg font-medium text-xs hover:shadow-lg hover:shadow-stellar-cyan/25 transition-all flex items-center gap-1 flex-shrink-0"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Communication History - Scrollable to fill remaining space */}
                                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                                    {isLoadingLog ? (
                                        <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                                            <div className="animate-pulse">Carregando...</div>
                                        </div>
                                    ) : communicationLog.length === 0 ? (
                                        <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                                            Nenhuma comunicação registrada
                                        </div>
                                    ) : (
                                        communicationLog.map((entry, idx) => (
                                            <div key={idx} className="bg-white dark:bg-space-nebula/30 rounded-lg p-2.5 border border-slate-200 dark:border-stellar-cyan/10">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 dark:bg-space-dust flex-shrink-0">
                                                        {entry.method === 'call' && <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                                                        {entry.method === 'whatsapp' && <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                                                        {entry.method === 'email' && <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                                                        {entry.method === 'note' && <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                                                            {entry.notes}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                {new Date(entry.date).toLocaleDateString('pt-BR')}
                                                            </span>
                                                            {entry.campaign_name && (
                                                                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                                                                    {entry.campaign_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        </TabsContent>

                        {/* TAB 2: Financial Summary - Fill viewport on mobile */}
                        <TabsContent value="financial" className="mt-0">
                        <div className="flex flex-col h-full gap-4">
                            {/* Hero: Total Gasto */}
                            <div className="bg-gradient-to-br from-stellar-cyan/10 to-blue-100 dark:from-stellar-cyan/20 dark:to-blue-900/20 rounded-xl p-4 border border-stellar-cyan/30 dark:border-stellar-cyan/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-5 h-5 text-stellar-cyan" />
                                    <span className="text-xs font-bold text-stellar-cyan uppercase">Total Gasto</span>
                                </div>
                                <div className="text-3xl font-bold text-blue-700 dark:text-stellar-cyan">
                                    {formatCurrency(customer.netTotal)}
                                </div>
                            </div>

                            {/* Secondary metrics: Ticket + Transactions */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-xl p-3.5 border border-slate-200 dark:border-stellar-cyan/10">
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Ticket Médio</div>
                                    <div className="text-xl font-bold text-slate-800 dark:text-white">
                                        {formatCurrency(customer.netTotal / customer.transactions)}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-xl p-3.5 border border-slate-200 dark:border-stellar-cyan/10">
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Transações</div>
                                    <div className="text-xl font-bold text-slate-800 dark:text-white">
                                        {customer.transactions}
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Breakdown - Compact cards with inline sparklines */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Por Serviço</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Lavagem Card */}
                                    <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 border border-sky-200 dark:border-sky-500/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Lavagem</div>
                                            <div className="text-[10px] font-bold text-sky-500 dark:text-sky-400/70">{revenueBreakdown.washPct}%</div>
                                        </div>
                                        <div className="flex items-end justify-between gap-2">
                                            <div>
                                                <div className="text-lg font-bold text-sky-700 dark:text-sky-300 leading-tight">
                                                    {formatCurrency(revenueBreakdown.wash)}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400">{customer.washServices} serviços</div>
                                            </div>
                                            <MiniSparkline data={customer.washSparkline} color="sky" height={32} />
                                        </div>
                                    </div>
                                    {/* Secagem Card */}
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-500/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Secagem</div>
                                            <div className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400/70">{revenueBreakdown.dryPct}%</div>
                                        </div>
                                        <div className="flex items-end justify-between gap-2">
                                            <div>
                                                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 leading-tight">
                                                    {formatCurrency(revenueBreakdown.dry)}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400">{customer.dryServices} serviços</div>
                                            </div>
                                            <MiniSparkline data={customer.drySparkline} color="emerald" height={32} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </TabsContent>

                        {/* TAB 3: Behavior & Risk - Fill viewport on mobile */}
                        <TabsContent value="behavior" className="mt-0">
                        <div className="flex flex-col h-full gap-4">
                            {/* Visit Pattern - 2x2 grid */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-stellar-cyan" />
                                    Padrão de Visitas
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-xl p-3 border border-slate-200 dark:border-stellar-cyan/10">
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Total Visitas</div>
                                        <div className="text-xl font-bold text-slate-800 dark:text-white">{customer.visits}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-xl p-3 border border-slate-200 dark:border-stellar-cyan/10">
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Média Entre</div>
                                        <div className="text-xl font-bold text-slate-800 dark:text-white">
                                            {customer.avgDaysBetween || '-'} dias
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-xl p-3 border border-slate-200 dark:border-stellar-cyan/10">
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Última Visita</div>
                                        <div className="text-xl font-bold text-slate-800 dark:text-white">
                                            {customer.daysSinceLastVisit} dias
                                        </div>
                                    </div>
                                    {customer.daysOverdue > 0 ? (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-500/20">
                                            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">Atraso</div>
                                            <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                                                {customer.daysOverdue} dias
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-500/20">
                                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Status</div>
                                            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">Em dia</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Risk Assessment */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-red-500 dark:text-red-400" />
                                    Avaliação de Risco
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`${RISK_CARD_STYLES[customer.riskLevel] || RISK_CARD_STYLES['Lost']} rounded-xl p-3`}>
                                        <div className={`text-[11px] font-bold ${RISK_CARD_TEXT[customer.riskLevel] || RISK_CARD_TEXT['Lost']} uppercase mb-1`}>Nível de Risco</div>
                                        <div className={`text-lg font-bold ${RISK_CARD_TEXT[customer.riskLevel] || RISK_CARD_TEXT['Lost']}`}>{riskConfig.pt}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-xl p-3 border border-slate-200 dark:border-stellar-cyan/10">
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Prob. Retorno</div>
                                        <div className="text-lg font-bold text-slate-800 dark:text-white">{customer.returnLikelihood}%</div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Preferences - Fill remaining space */}
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                    Preferências de Serviço
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-slate-50 dark:bg-space-nebula/50 rounded-xl p-3 border border-slate-200 dark:border-stellar-cyan/10">
                                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Serv/Visita</div>
                                        <div className="text-lg font-bold text-slate-800 dark:text-white">{customer.servicesPerVisit}</div>
                                    </div>
                                    <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 border border-sky-200 dark:border-sky-500/20">
                                        <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase mb-1">Lavagem</div>
                                        <div className="text-lg font-bold text-sky-700 dark:text-sky-300">{customer.washPercentage}%</div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-500/20">
                                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Secagem</div>
                                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{customer.dryPercentage}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </TabsContent>

                        {/* TAB 4: Transaction History - Compact on mobile */}
                        <TabsContent value="history" className="mt-0">
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mb-1.5 sm:mb-2 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stellar-cyan" />
                                Últimas Transações
                            </h3>

                            {/* Transaction History Table */}
                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-stellar-cyan/10 bg-white dark:bg-space-nebula/30">
                                <table className="w-full">
                                    <thead className="bg-slate-100 dark:bg-space-dust text-xs sm:text-xs uppercase text-slate-700 dark:text-slate-300 font-semibold">
                                        <tr>
                                            <th className="px-2 py-2 sm:px-3 text-center">Data</th>
                                            <th className="px-2 py-2 sm:px-3 text-center">Serviços</th>
                                            <th className="px-2 py-2 sm:px-3 text-center min-[400px]:table-cell hidden">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-stellar-cyan/5">
                                        {transactionHistory.length > 0 ? (
                                            transactionHistory.map((tx, i) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-space-nebula/50 transition-colors">
                                                    <td className="px-2 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap">
                                                        <div className="text-center">
                                                            <div className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                                                                {tx.date.toLocaleDateString('pt-BR')}
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">
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
                                                <td colSpan="3" className="px-3 py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                                                    Nenhuma transação encontrada
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Mobile Quick Actions - Fixed bottom bar with cosmic styling */}
                {/* v4.4: Uses stellar-cyan (call), cosmic-green (WhatsApp), stellar-blue (email) */}
                {!blacklisted && (customer.phone || customer.email) && (
                    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[70]
                                    bg-white/95 dark:bg-space-dust/95 backdrop-blur-xl
                                    border-t border-slate-200 dark:border-stellar-cyan/10
                                    px-4 py-3 pb-safe flex gap-2">
                        {customer.phone && (
                            <>
                                <button
                                    onClick={() => { haptics.light(); handleCall(); }}
                                    className="flex-1 min-h-[44px] flex items-center justify-center gap-2
                                             bg-stellar-cyan/10 dark:bg-stellar-cyan/15 text-stellar-cyan
                                             border border-stellar-cyan/30 dark:border-stellar-cyan/25
                                             rounded-xl font-semibold text-sm
                                             hover:bg-stellar-cyan/20 dark:hover:bg-stellar-cyan/25
                                             active:scale-[0.97] transition-all
                                             focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40"
                                >
                                    <Phone className="w-5 h-5" />
                                    Ligar
                                </button>
                                <button
                                    onClick={() => { haptics.light(); handleWhatsApp(); }}
                                    disabled={!hasValidPhone}
                                    className={`flex-1 min-h-[44px] flex items-center justify-center gap-2
                                             rounded-xl font-semibold text-sm transition-all active:scale-[0.97]
                                             focus:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-green/40
                                             ${hasValidPhone
                                                 ? 'bg-cosmic-green text-white hover:bg-cosmic-green/90 border border-cosmic-green'
                                                 : 'bg-slate-200/50 dark:bg-space-void/30 text-slate-400 dark:text-slate-500 border-transparent cursor-not-allowed'
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
                                         bg-stellar-blue text-white rounded-xl font-semibold text-sm
                                         hover:bg-stellar-blue/90 border border-stellar-blue
                                         active:scale-[0.97] transition-all
                                         focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-blue/40"
                            >
                                <Mail className="w-5 h-5" />
                                Email
                            </button>
                        )}
                    </div>
                )}
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default CustomerProfileModal;
