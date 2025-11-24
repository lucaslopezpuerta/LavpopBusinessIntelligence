// CustomerCard.jsx v1.0 - PREMIUM CUSTOMER CARD
// Modern card design for Customer Directory
// 
// CHANGELOG:
// v1.0 (2025-11-23): Initial implementation for Customer Intelligence Hub
//   - Premium card design with glassmorphism on hover
//   - Dot-style risk badges (consistent with AtRiskCustomersTable)
//   - Hover effects: scale, shadow, gradient background
//   - Metrics grid: Gasto Total, Visitas
//   - Quick actions: Call, WhatsApp
//   - Fully responsive with dark mode support
//   - Tailwind CSS styling

import React from 'react';
import { Phone, MessageCircle, DollarSign, TrendingUp } from 'lucide-react';
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
            <div className="relative flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight mb-1 line-clamp-1">
                        {customer.name}
                    </h3>
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${risk.bg} ${risk.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${risk.color} animate-pulse`} />
                        {risk.label}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Última Visita</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {customer.daysSinceLastVisit}d atrás
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="relative grid grid-cols-2 gap-3 mb-4">
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
            <div className="relative flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {customer.segment}
                </div>

                {customer.phone && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCall}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-lavpop-blue hover:text-white transition-colors"
                            title="Ligar"
                        >
                            <Phone className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition-colors"
                            title="WhatsApp"
                        >
                            <MessageCircle className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerCard;
