// CustomerListDrilldown.jsx v2.0 - SMART LISTS
// ✅ Top 5 limit for brevity
// ✅ WhatsApp and Call actions
// ✅ Dynamic sorting based on type
import React from 'react';
import { Phone, MessageCircle, User, ArrowRight } from 'lucide-react';

const CustomerListDrilldown = ({ customers = [], type = 'active', onNavigate }) => {
    const formatPhone = (phone) => {
        if (!phone) return null;
        const cleaned = String(phone).replace(/\D/g, '');
        return cleaned.length >= 10 ? cleaned : null;
    };

    const handleCall = (e, phone) => {
        e.stopPropagation();
        const cleaned = formatPhone(phone);
        if (cleaned) window.location.href = `tel:+55${cleaned}`;
    };

    const handleWhatsApp = (e, phone) => {
        e.stopPropagation();
        const cleaned = formatPhone(phone);
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const url = isMobile
            ? `https://api.whatsapp.com/send?phone=55${cleaned}`
            : `https://web.whatsapp.com/send?phone=55${cleaned}`;
        window.open(url, '_blank');
    };

    const getTitle = () => {
        switch (type) {
            case 'newclients': return 'Novos Clientes Recentes';
            case 'atrisk': return 'Clientes em Risco (Top 5)';
            case 'active': return 'Clientes Mais Ativos';
            default: return 'Lista de Clientes';
        }
    };

    // Limit to 5 items
    const displayList = customers.slice(0, 5);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {getTitle()}
                </h3>
                <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
                    {customers.length} total
                </span>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {displayList.map((customer, index) => (
                    <div
                        key={customer.doc || index}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center shadow-sm text-slate-400 dark:text-slate-300">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {customer.name || 'Cliente sem nome'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {customer.lastVisit ? `Última visita: ${customer.lastVisit}` : 'Sem visita recente'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {customer.phone && formatPhone(customer.phone) && (
                                <>
                                    <button
                                        onClick={(e) => handleCall(e, customer.phone)}
                                        className="p-2 rounded-lg bg-white dark:bg-slate-800 text-lavpop-blue dark:text-blue-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                        title="Ligar"
                                    >
                                        <Phone className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleWhatsApp(e, customer.phone)}
                                        className="p-2 rounded-lg bg-white dark:bg-slate-800 text-lavpop-green border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                        title="WhatsApp"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {displayList.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        Nenhum cliente encontrado nesta categoria.
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={onNavigate}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
                >
                    Ver Todos na Lista
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default CustomerListDrilldown;
