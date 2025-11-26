// CustomerProfileModal.jsx v1.0 - CUSTOMER PROFILE & CRM MODAL
// Comprehensive customer profile modal for Customer Directory
// Separate from Dashboard's CustomerDetailModal
//
// CHANGELOG:
// v1.0 (2025-11-24): Initial implementation
//   - Tab 1: Profile & Contact (personal info, wallet, communication log)
//   - Tab 2: Financial Summary (lifetime value, revenue breakdown)
//   - Tab 3: Behavior & Risk (visit patterns, risk assessment, preferences)
//   - Tab 4: Transaction History (last 10 transactions)
//   - Communication logging via localStorage
//   - Quick contact actions (Call, WhatsApp, Email)

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { formatCurrency } from '../utils/numberUtils';
import { RISK_LABELS } from '../utils/customerMetrics';

const CustomerProfileModal = ({ customer, onClose, sales }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [communicationLog, setCommunicationLog] = useState(() => {
        // Load from localStorage
        const saved = localStorage.getItem(`comm_log_${customer.doc}`);
        return saved ? JSON.parse(saved) : [];
    });
    const [newNote, setNewNote] = useState('');
    const [noteMethod, setNoteMethod] = useState('call');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    // Save communication log to localStorage
    const saveCommunicationLog = (log) => {
        localStorage.setItem(`comm_log_${customer.doc}`, JSON.stringify(log));
        setCommunicationLog(log);
    };

    // Add communication entry
    const addCommunication = () => {
        if (!newNote.trim()) return;

        const entry = {
            date: new Date().toISOString(),
            method: noteMethod,
            notes: newNote,
            timestamp: Date.now(),
        };

        const updated = [entry, ...communicationLog];
        saveCommunicationLog(updated);
        setNewNote('');
    };

    // Handle window resize for mobile detection
    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Get risk configuration
    const riskConfig = RISK_LABELS[customer.riskLevel] || RISK_LABELS['Lost'];

    // Quick actions
    const handleCall = () => {
        if (customer.phone) {
            window.location.href = `tel:${customer.phone}`;
            // Auto-log call attempt
            const entry = {
                date: new Date().toISOString(),
                method: 'call',
                notes: 'Ligação realizada',
                timestamp: Date.now(),
            };
            saveCommunicationLog([entry, ...communicationLog]);
        }
    };

    const handleWhatsApp = () => {
        if (customer.phone) {
            const cleanPhone = customer.phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
            // Auto-log WhatsApp
            const entry = {
                date: new Date().toISOString(),
                method: 'whatsapp',
                notes: 'Mensagem WhatsApp enviada',
                timestamp: Date.now(),
            };
            saveCommunicationLog([entry, ...communicationLog]);
        }
    };

    const handleEmail = () => {
        if (customer.email) {
            window.location.href = `mailto:${customer.email}`;
            // Auto-log email
            const entry = {
                date: new Date().toISOString(),
                method: 'email',
                notes: 'Email enviado',
                timestamp: Date.now(),
            };
            saveCommunicationLog([entry, ...communicationLog]);
        }
    };

    // Helper to parse Brazilian date format (DD/MM/YYYY HH:mm:ss)
    const parseBrDate = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}):(\d{2}))?/);
        if (parts) {
            const [, day, month, year, hour = '00', minute = '00', second = '00'] = parts;
            return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
        }
        return null;
    };

    // Helper for parsing machines - extracts machine codes (e.g., "Lavadora:3" -> "L3")
    const parseMachines = (machineStr) => {
        if (!machineStr || machineStr === 'N/A') return [];

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
            .slice(0, isMobile ? 5 : 10); // Limit to 5 on mobile, 10 on desktop
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

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
                {/* Header - Compact */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 px-4 py-3 sm:px-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lavpop-blue to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white truncate">
                                    {customer.name}
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${riskConfig.bgClass} ${riskConfig.textClass}`}>
                                        <span className={`w-1 h-1 rounded-full bg-${riskConfig.color}-500 animate-pulse`} />
                                        {riskConfig.pt}
                                    </div>
                                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        Retorno: {customer.returnLikelihood}%
                                    </div>
                                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                                        {customer.segment}
                                    </div>
                                </div>
                            </div>
                            {/* Quick Actions - Only WhatsApp on mobile, all buttons on desktop */}
                            <div className="flex gap-2.5">
                                {customer.phone && (
                                    <>
                                        {/* Call button - hidden on mobile */}
                                        <button
                                            onClick={handleCall}
                                            className="hidden sm:flex items-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-lavpop-blue hover:text-white transition-colors text-xs font-semibold border border-slate-200 dark:border-slate-600 min-h-[44px] sm:min-h-0"
                                        >
                                            <Phone className="w-3 h-3" />
                                            <span className="hidden xs:inline">Ligar</span>
                                        </button>
                                        {/* WhatsApp button - always visible */}
                                        <button
                                            onClick={handleWhatsApp}
                                            className="flex items-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition-colors text-xs font-semibold border border-green-200 dark:border-green-800 min-h-[44px] sm:min-h-1"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            <span className="hidden min-[500px]:inline">WhatsApp</span>
                                        </button>
                                    </>
                                )}
                                {/* Email button - hidden on mobile */}
                                {customer.email && (
                                    <button
                                        onClick={handleEmail}
                                        className="hidden sm:flex items-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-colors text-xs font-semibold border border-blue-200 dark:border-blue-800 min-h-[44px] sm:min-h-0"
                                    >
                                        <Mail className="w-3 h-3" />
                                        <span className="hidden xs:inline">Email</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-1.0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors ml-1.3 sm:ml-3"
                        >
                            <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex gap-1 px-3 sm:px-4 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'profile'
                                ? 'border-lavpop-blue text-lavpop-blue'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            <span className="hidden sm:inline">Perfil & Contato</span>
                            <span className="sm:hidden">Perfil</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'financial'
                                ? 'border-lavpop-blue text-lavpop-blue'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            Financeiro
                        </button>
                        <button
                            onClick={() => setActiveTab('behavior')}
                            className={`px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'behavior'
                                ? 'border-lavpop-blue text-lavpop-blue'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            <span className="hidden sm:inline">Comportamento</span>
                            <span className="sm:hidden">Comporta</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'history'
                                ? 'border-lavpop-blue text-lavpop-blue'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            Histórico
                        </button>
                    </div>
                </div>

                {/* Tab Content - Optimized Padding */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
                    {/* TAB 1: Profile & Contact */}
                    {activeTab === 'profile' && (
                        <div className="space-y-3 sm:space-y-4">
                            {/* Personal Information */}
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-lavpop-blue" />
                                    Informações Pessoais
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">CPF</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-white">{customer.doc}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Telefone</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-white">{customer.phone || 'N/A'}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Email</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-white truncate">{customer.email || 'N/A'}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Cadastro</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-white">
                                            {customer.firstVisit ? customer.firstVisit.toLocaleDateString('pt-BR') : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Wallet & Incentives */}
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-green-600" />
                                    Carteira & Cashback
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border-2 border-green-200 dark:border-green-800">
                                        <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-1">Saldo Disponível</div>
                                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {formatCurrency(customer.walletBalance || 0)}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Segmento RFM</div>
                                        <div className="text-base font-bold text-slate-800 dark:text-white truncate">
                                            {customer.segment}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Communication Log */}
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-lavpop-blue" />
                                    Histórico de Comunicação
                                </h3>

                                {/* Add New Entry */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 mb-2">
                                    <div className="flex flex-wrap gap-1.5">
                                        <select
                                            value={noteMethod}
                                            onChange={(e) => setNoteMethod(e.target.value)}
                                            className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0"
                                        >
                                            <option value="call">📞 Ligação</option>
                                            <option value="whatsapp">💬 WhatsApp</option>
                                            <option value="email">📧 Email</option>
                                            <option value="note">📝 Nota</option>
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
                                            <span className="sm:hidden">+</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Communication History */}
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {communicationLog.length === 0 ? (
                                        <div className="text-center py-4 text-slate-400 text-sm">
                                            Nenhuma comunicação registrada
                                        </div>
                                    ) : (
                                        communicationLog.map((entry, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-700 rounded-lg p-2 border border-slate-200 dark:border-slate-600">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-2">
                                                        <div className="text-base">
                                                            {entry.method === 'call' && '📞'}
                                                            {entry.method === 'whatsapp' && '💬'}
                                                            {entry.method === 'email' && '📧'}
                                                            {entry.method === 'note' && '📝'}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-slate-800 dark:text-white">
                                                                {entry.notes}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {new Date(entry.date).toLocaleString('pt-BR')}
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
                                <DollarSign className="w-4 h-4 text-lavpop-blue" />
                                Resumo Financeiro
                            </h3>

                            {/* Lifetime Value */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border-2 border-blue-200 dark:border-blue-800">
                                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-0.5">Total Gasto</div>
                                    <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                        {formatCurrency(customer.netTotal)}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Ticket Médio</div>
                                    <div className="text-base font-bold text-slate-800 dark:text-white">
                                        {formatCurrency(customer.netTotal / customer.transactions)}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Transações</div>
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
                                            <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Lavagem</div>
                                            <div className="text-xs font-bold text-sky-700 dark:text-sky-300">{revenueBreakdown.washPct}%</div>
                                        </div>
                                        <div className="text-lg font-bold text-sky-700 dark:text-sky-300">
                                            {formatCurrency(revenueBreakdown.wash)}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{customer.washServices} serviços</div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Secagem</div>
                                            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{revenueBreakdown.dryPct}%</div>
                                        </div>
                                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                            {formatCurrency(revenueBreakdown.dry)}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{customer.dryServices} serviços</div>
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
                                    <Activity className="w-4 h-4 text-lavpop-blue" />
                                    Padrão de Visitas
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Visitas</div>
                                        <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{customer.transactions}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Média Entre Visitas</div>
                                        <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                                            {customer.avgDaysBetween || 'N/A'}d
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Última Visita</div>
                                        <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                                            {customer.daysSinceLastVisit}d
                                        </div>
                                    </div>
                                    {customer.daysOverdue > 0 && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800">
                                            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-0.5">Atraso</div>
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
                                    <Target className="w-4 h-4 text-red-600" />
                                    Avaliação de Risco
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`${riskConfig.bgClass} rounded-lg p-3 border-2 ${riskConfig.bgClass.replace('bg-', 'border-')}`}>
                                        <div className={`text-[10px] font-bold ${riskConfig.textClass} uppercase mb-0.5`}>Nível de Risco</div>
                                        <div className={`text-base sm:text-lg font-bold ${riskConfig.textClass}`}>{riskConfig.pt}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Probabilidade de Retorno</div>
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
                                    <BarChart3 className="w-4 h-4 text-lavpop-green" />
                                    Preferências de Serviço
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 hidden sm:block">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Serviços/Visita</div>
                                        <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{customer.servicesPerVisit}</div>
                                    </div>
                                    <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-2.5 border border-sky-200 dark:border-sky-800">
                                        <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase mb-0.5">Preferência Lavagem</div>
                                        <div className="text-base sm:text-lg font-bold text-sky-700 dark:text-sky-300">{customer.washPercentage}%</div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 border border-emerald-200 dark:border-emerald-800">
                                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-0.5">Preferência Secagem</div>
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
                                <FileText className="w-4 h-4 text-lavpop-blue" />
                                Últimas 10 Transações
                            </h3>

                            {/* Transaction History Table */}
                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-[10px] sm:text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
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
                                                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                {tx.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 sm:px-3 sm:py-2.5">
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {tx.machines.map((m, idx) => (
                                                                <span key={idx} className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-semibold ${m.type === 'dry'
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
                                                <td colSpan="3" className="px-3 py-6 text-center text-slate-500 dark:text-slate-400 text-xs">
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
            </div>
        </div >
    );
};

export default CustomerProfileModal;
