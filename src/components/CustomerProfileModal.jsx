// CustomerProfileModal.jsx v5.0 - BASEMODAL MIGRATION
// Comprehensive customer profile modal for Customer Directory
// Design System v5.1 compliant - Tier 2 Enhanced
//
// CHANGELOG:
// v5.0 (2026-01-31): BaseModal migration
//   - Migrated to BaseModal component for consistent UX
//   - Removed duplicate boilerplate (portal, animations, swipe, scroll lock)
//   - Uses showHeader={false} for custom header with avatar and actions
//   - Preserved all 4 tabs and business logic
//   - Reduced from ~1300 lines to ~1000 lines
// v4.11 (2026-01-31): Enhanced drag handle
// v4.10 (2026-01-31): Enhanced modal transitions
// v4.9 (2026-01-28): Bottom action bar safe area fix
// v4.8 (2026-01-28): Mobile full-screen and safe area fix
// v4.7 (2026-01-27): Animation standardization
// v4.6 (2026-01-18): Improved card label contrast in dark mode
// v4.5 (2026-01-18): Prominent WhatsApp button
// v4.4 (2026-01-18): Cosmic action buttons design
// v4.3 (2026-01-18): Service sparklines in Financial tab
// v4.2 (2026-01-18): Balanced mobile layout
// v4.0 (2026-01-18): Cosmic Design System v5.0 overhaul

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BaseModal from './ui/BaseModal';
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
import { haptics } from '../utils/haptics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Segment-based avatar configuration
// Maps RFM segments to icons and gradient colors for visual recognition
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
    'default': { icon: User, from: 'from-stellar-blue', to: 'to-stellar-cyan', text: 'text-white' },
};

// High contrast risk pill styling
const RISK_PILL_STYLES = {
    'Healthy': 'bg-emerald-500 text-white',
    'Monitor': 'bg-blue-500 text-white',
    'At Risk': 'bg-amber-500 text-white',
    'Churning': 'bg-red-600 text-white',
    'New Customer': 'bg-purple-500 text-white',
    'Lost': 'bg-slate-500 text-white',
};

// Light background styles for risk mini-cards
const RISK_CARD_STYLES = {
    'Healthy': 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50',
    'Monitor': 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50',
    'At Risk': 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50',
    'Churning': 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50',
    'New Customer': 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50',
    'Lost': 'bg-slate-50 dark:bg-slate-700/20 border border-slate-200 dark:border-slate-600/50',
};

// Text colors for risk mini-cards
const RISK_CARD_TEXT = {
    'Healthy': 'text-green-700 dark:text-green-400',
    'Monitor': 'text-blue-700 dark:text-blue-400',
    'At Risk': 'text-amber-700 dark:text-amber-400',
    'Churning': 'text-red-700 dark:text-red-400',
    'New Customer': 'text-purple-700 dark:text-purple-400',
    'Lost': 'text-slate-700 dark:text-slate-400',
};

// MiniSparkline - Inline SVG sparkline for service trend visualization
const MiniSparkline = ({ data, color = 'sky', height = 32, className = '' }) => {
    const width = 80;
    const padding = 2;

    const hasData = data && data.length > 0 && data.some(v => v > 0);
    if (!hasData) {
        return (
            <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">Sem dados</span>
            </div>
        );
    }

    const maxVal = Math.max(...data, 1);
    const points = data.map((val, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((val / maxVal) * (height - 2 * padding));
        return `${x},${y}`;
    });

    const linePath = `M ${points.join(' L ')}`;
    const areaPath = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;

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
    const [communicationLog, setCommunicationLog] = useState([]);
    const [isLoadingLog, setIsLoadingLog] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [noteMethod, setNoteMethod] = useState('call');
    const isMobile = useMediaQuery('(max-width: 639px)');
    const prefersReducedMotion = useReducedMotion();

    // Load communication log from backend on mount
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

    // Shared contact tracking
    const { isContacted, toggleContacted, markContacted } = useContactTracking();
    const customerId = customer.doc || customer.id;
    const contacted = isContacted(customerId);

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

    // Blacklist check
    const { isBlacklisted, getBlacklistReason } = useBlacklist();
    const blacklisted = isBlacklisted(customer.phone);
    const blacklistInfo = blacklisted ? getBlacklistReason(customer.phone) : null;

    // Toggle cycles trend panel
    const toggleCyclesTrend = useCallback(() => {
        haptics.light();
        setShowCyclesTrend(prev => !prev);
    }, []);

    // Listen for communication log updates
    useEffect(() => {
        const handleLogUpdate = async (event) => {
            if (event.detail?.customerId === customer.doc) {
                try {
                    const log = await getCommunicationLogAsync(customer.doc);
                    setCommunicationLog(log);
                } catch (error) {
                    console.warn('Failed to refresh communication log:', error);
                }
            }
        };

        window.addEventListener('communicationLogUpdate', handleLogUpdate);
        return () => window.removeEventListener('communicationLogUpdate', handleLogUpdate);
    }, [customer.doc]);

    // Add communication entry
    const addCommunication = () => {
        if (!newNote.trim()) return;
        addCommunicationEntry(customer.doc, noteMethod, newNote);
        setNewNote('');
    };

    // Get risk configuration
    const riskConfig = RISK_LABELS[customer.riskLevel] || RISK_LABELS['Lost'];

    // Quick actions
    const handleCall = () => {
        if (customer.phone) {
            window.location.href = `tel:${customer.phone}`;
            addCommunicationEntry(customer.doc, 'call', getDefaultNotes('call'));
            if (customerId && !contacted) {
                markContacted(customerId, 'call', customerContext);
            }
        }
    };

    const handleWhatsApp = () => {
        if (hasValidPhone && customer.phone) {
            const cleanPhone = customer.phone.replace(/\D/g, '');
            const whatsappPhone = cleanPhone.length === 11 ? '55' + cleanPhone : cleanPhone;
            window.open(`https://wa.me/${whatsappPhone}`, '_blank');
            addCommunicationEntry(customer.doc, 'whatsapp', getDefaultNotes('whatsapp'));
            if (customerId && !contacted) {
                markContacted(customerId, 'whatsapp', customerContext);
            }
        }
    };

    const handleEmail = () => {
        if (customer.email) {
            window.location.href = `mailto:${customer.email}`;
            addCommunicationEntry(customer.doc, 'email', getDefaultNotes('email'));
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

    // Mask CPF for privacy
    const maskCpf = (cpf) => {
        if (!cpf) return '-';
        const clean = String(cpf).replace(/\D/g, '');
        if (clean.length !== 11) return cpf;
        return `${clean.slice(0, 3)}.***.***-${clean.slice(-2)}`;
    };

    // Parse machines from transaction
    const parseMachines = (machineStr) => {
        if (!machineStr || machineStr === 'N/A') return [];

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

    // Transaction History
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
            .slice(0, 5);
    }, [sales, customer.doc, isMobile]);

    // Revenue breakdown
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

    return (
        <>
            <BaseModal
                isOpen={true}
                onClose={onClose}
                size="full"
                maxWidth="2xl"
                showHeader={false}
                contentClassName="p-0"
                ariaLabel={`Perfil de ${customer.name}`}
                zIndex={60}
            >
                {/* Custom Header with Avatar and Actions */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-space-nebula dark:to-space-dust border-b border-slate-200 dark:border-stellar-cyan/10 rounded-t-2xl flex-shrink-0">
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
                                        {/* Risk status pill */}
                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase shadow-sm ${RISK_PILL_STYLES[customer.riskLevel] || 'bg-slate-500 text-white'}`}>
                                            {riskConfig.pt}
                                        </div>
                                        {/* Segment pill */}
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
                                {/* Quick Actions - desktop only */}
                                {!blacklisted && (
                                    <div className="hidden sm:flex gap-2">
                                        {customer.phone && (
                                            <>
                                                <button
                                                    onClick={handleCall}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stellar-cyan/10 dark:bg-stellar-cyan/15 text-stellar-cyan border border-stellar-cyan/30 dark:border-stellar-cyan/25 hover:bg-stellar-cyan/20 dark:hover:bg-stellar-cyan/25 hover:border-stellar-cyan/50 transition-all text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/40"
                                                >
                                                    <Phone className="w-3.5 h-3.5" />
                                                    <span className="hidden min-[500px]:inline">Ligar</span>
                                                </button>
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
                            className="border-b border-slate-200 dark:border-stellar-cyan/10 overflow-hidden flex-shrink-0"
                        >
                            <CustomerCyclesTrend
                                sales={sales}
                                customerDoc={customer.doc}
                                onCollapse={toggleCyclesTrend}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tab Navigation */}
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

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-28 sm:pb-4 custom-scrollbar">
                        {/* TAB 1: Profile & Contact */}
                        <TabsContent value="profile" className="mt-0">
                        <div className="flex flex-col h-full gap-3 sm:gap-4">
                            {/* Personal Information */}
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

                            {/* Communication Log */}
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

                                {/* Communication History */}
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
                                                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
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

                        {/* TAB 2: Financial Summary */}
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

                            {/* Secondary metrics */}
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

                            {/* Revenue Breakdown */}
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

                        {/* TAB 3: Behavior & Risk */}
                        <TabsContent value="behavior" className="mt-0">
                        <div className="flex flex-col h-full gap-4">
                            {/* Visit Pattern */}
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

                            {/* Service Preferences */}
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

                        {/* TAB 4: Transaction History */}
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
            </BaseModal>

            {/* Mobile Quick Actions - Fixed bottom bar */}
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
        </>
    );
};

export default CustomerProfileModal;
