// CustomerCard.jsx v2.0 - ENHANCED CUSTOMER CARD
// Modern card design for Customer Directory
// 
// CHANGELOG:
// v2.0 (2025-11-24): Enhanced with dates and larger buttons
//   - NEW: Registration date (firstVisit) display
//   - NEW: Last visit date (full date + days ago)
//   - ENHANCED: Larger action buttons (px-4 py-2.5 with text labels)
//   - ENHANCED: Segment label format "Segmento: Champion"
// v1.0 (2025-11-23): Initial implementation
//   - Premium card design with glassmorphism
//   - Dot-style risk badges
//   - Metrics grid and quick actions

import React from 'react';
import { Phone, MessageCircle, DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';
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
            className="group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
            {/* Decorative Gradient Background on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Header: Name & Risk */}
            <div className="relative flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight mb-1 line-clamp-1">
                        {customer.name}
                    </h3>
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${risk.bg} ${risk.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${risk.color} animate-pulse`} />
                        {risk.label}
                    </div>
                </div>
            </div>

            {/* NEW: Dates Section */}
            <div className="relative grid grid-cols-2 gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div>
                    <div className="flex items-center gap-1 mb-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Cadastro</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {customer.firstVisit ? customer.firstVisit.toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-1 mb-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Última Visita</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {customer.lastVisit ? customer.lastVisit.toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                        {customer.daysSinceLastVisit}d atrás
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="relative grid grid-cols-2 gap-3 mb-3">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-lavpop-blue" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Gasto Total</span>
                    </div>
                    <div className="text-base font-bold text-slate-800 dark:text-white">
                        {formatCurrency(customer.netTotal)}
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-lavpop-green" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Visitas</span>
                    </div>
                    <div className="text-base font-bold text-slate-800 dark:text-white">
                        {customer.transactions}
                    </div>
                </div>
            </div>

            {/* Footer: Segment & Actions */}
            <div className="relative space-y-2">
                {/* Segment Label */}
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="text-slate-400">Segmento:</span> <span className="font-bold text-slate-700 dark:text-slate-300">{customer.segment}</span>
                </div>

                {/* Larger Action Buttons */}
                {customer.phone && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCall}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-lavpop-blue hover:text-white transition-colors font-semibold text-sm"
                            title="Ligar"
                        >
                            <Phone className="w-4 h-4" />
                            <span>Ligar</span>
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition-colors font-semibold text-sm"
                            title="WhatsApp"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerCard;
