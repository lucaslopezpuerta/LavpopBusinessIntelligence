// CustomerCard.jsx v5.0 - FIXED-SIZE CLICKABLE CARD
// Optimized card design with consistent size and full clickability
// 
// CHANGELOG:
// v5.0 (2025-11-24): Fixed-size clickable card
//   - REMOVED: "Ver Perfil Completo" button
//   - CHANGED: Entire card is now clickable
//   - FIXED: Consistent height regardless of data availability
//   - OPTIMIZED: Better space usage, cleaner layout
// v4.0 (2025-11-24): Personal info focus
// v3.0 (2025-11-24): Enhanced with all metrics
// v2.0 (2025-11-24): Enhanced with dates and larger buttons
// v1.0 (2025-11-23): Initial implementation

import React from 'react';
import { Phone, MessageCircle, Clock, Wallet, AlertCircle, Calendar, Activity } from 'lucide-react';
import { formatCurrency } from '../utils/numberUtils';

const CustomerCard = ({ customer, onClick }) => {
    // Risk Badge Logic (Dot Style)
    const getRiskBadge = (level) => {
        switch (level) {
            case 'Healthy': return { color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', label: 'Saudável' };
            case 'Monitor': return { color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', label: 'Monitorar' };
            case 'At Risk': return { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Em Risco' };
            case 'Churning': return { color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', label: 'Crítico' };
            case 'New Customer': return { color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50', label: 'Novo' };
            default: return { color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50', label: 'Perdido' };
        }
    };

    const risk = getRiskBadge(customer.riskLevel);

    const handleCall = (e) => {
        e.stopPropagation();
        if (customer.phone) window.location.href = `tel:${customer.phone}`;
    };

    const handleWhatsApp = (e) => {
        e.stopPropagation();
        if (customer.phone) {
            const cleanPhone = customer.phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
    };

    return (
        <div
            onClick={onClick}
            className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-lavpop-blue dark:hover:border-lavpop-blue transition-all duration-200 cursor-pointer h-full flex flex-col"
        >
            {/* Header: Name & Risk - Flexible Height */}
            <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight line-clamp-2 flex-1">
                    {customer.name}
                </h3>
                <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${risk.bg} ${risk.text} shrink-0`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${risk.color} animate-pulse`} />
                    {risk.label}
                </div>
            </div>

            {/* Contact Info - Compact (No Email) */}
            <div className="space-y-0.5 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                {customer.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                    </div>
                )}
                {customer.registrationDate && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">Desde {customer.registrationDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                    </div>
                )}
            </div>

            {/* Metrics Grid - Ultra Compact (Wallet & Freq only) */}
            <div className="grid grid-cols-2 gap-2 mb-3 flex-1">
                {/* Wallet */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800 flex flex-col justify-center">
                    <div className="flex items-center gap-1 mb-0.5">
                        <Wallet className="w-3 h-3 text-green-600 dark:text-green-400" />
                        <span className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase">Carteira</span>
                    </div>
                    <div className="text-sm font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(customer.walletBalance || 0)}
                    </div>
                </div>

                {/* Visit Frequency & Recency Badge */}
                <div className={`rounded-lg p-2 border flex flex-col justify-center ${customer.daysOverdue > 0
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'
                    }`}>
                    <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1">
                            <Activity className={`w-3 h-3 ${customer.daysOverdue > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                            <span className={`text-[9px] font-bold uppercase ${customer.daysOverdue > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                Freq.
                            </span>
                        </div>
                        {/* Recency Badge */}
                        <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${customer.daysOverdue > 0
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                            }`}>
                            {customer.daysSinceLastVisit}d atrás
                        </div>
                    </div>
                    <div className={`text-sm font-bold ${customer.daysOverdue > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {customer.avgDaysBetween ? `~${customer.avgDaysBetween} dias` : 'N/A'}
                    </div>
                </div>
            </div>

            {/* Action Buttons - Fixed at Bottom */}
            {customer.phone && (
                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={handleCall}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-lavpop-blue hover:text-white transition-colors font-semibold text-xs"
                        title="Ligar"
                    >
                        <Phone className="w-3 h-3" />
                        <span>Ligar</span>
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition-colors font-semibold text-xs"
                        title="WhatsApp"
                    >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomerCard;
