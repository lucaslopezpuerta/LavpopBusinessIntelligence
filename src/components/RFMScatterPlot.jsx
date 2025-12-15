// RFMScatterPlot.jsx v2.0 - INTERACTIVE INSIGHTS
// Visual representation of customer value and recency with contact tracking
//
// CHANGELOG:
// v2.0 (2025-12-15): Interactive insights + modal integration
//   - REFACTORED: Reduced insights from 4 to 2 (primary clickable, secondary info)
//   - NEW: Click bubble → opens CustomerProfileModal
//   - NEW: Click insight → opens CustomerSegmentModal with filtered customers
//   - NEW: onOpenCustomerProfile and onOpenSegmentModal props
// v1.4 (2025-12-13): Contact status visualization
//   - NEW: Blue dashed stroke for contacted customers (pending in contact_tracking)
//   - NEW: Tooltip shows contact status and campaign name
//   - NEW: Legend indicating stroke meaning
//   - NEW: Insight for contacted high-value customers
//   - Accepts contactedIds and pendingContacts props from parent
// v1.3 (2025-11-24): Added explanation for likelihood-based classification
// v1.2 (2025-11-24): Added actionable insights
// v1.1 (2025-11-24): Portuguese translations
// v1.0 (2025-11-23): Initial implementation

import React, { useMemo, useState, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';
import { AlertTriangle, Trophy } from 'lucide-react';
import { formatCurrency } from '../utils/numberUtils';
import InsightBox from './ui/InsightBox';
import CustomerSegmentModal from './modals/CustomerSegmentModal';

const RFMScatterPlot = ({
    data,
    contactedIds = new Set(),
    pendingContacts = {},
    onOpenCustomerProfile,
    onMarkContacted,
    onCreateCampaign
}) => {
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: '', customers: [], audienceType: 'atRisk', color: 'amber' });

    if (!data || data.length === 0) return null;

    // Enrich data with contact status
    const enrichedData = useMemo(() => {
        return data.map(d => ({
            ...d,
            isContacted: contactedIds.has(String(d.id)),
            contactInfo: pendingContacts[String(d.id)] || null
        }));
    }, [data, contactedIds, pendingContacts]);

    // Calculate segment stats
    const highValueAtRiskCustomers = useMemo(() =>
        enrichedData.filter(d => d.y > 500 && d.x > 30), [enrichedData]);
    const championsCustomers = useMemo(() =>
        enrichedData.filter(d => d.y > 500 && d.x <= 20), [enrichedData]);

    const notContactedHighValue = highValueAtRiskCustomers.filter(d => !d.isContacted).length;
    const totalContacted = enrichedData.filter(d => d.isContacted).length;

    // Click handler for bubble
    const handleBubbleClick = useCallback((entry) => {
        if (onOpenCustomerProfile && entry?.id) {
            onOpenCustomerProfile(entry.id);
        }
    }, [onOpenCustomerProfile]);

    // Click handler for high-value at-risk insight
    const handleHighValueAtRiskClick = useCallback(() => {
        const notContacted = highValueAtRiskCustomers.filter(d => !d.isContacted);
        setModalData({
            title: 'Clientes de Alto Valor em Risco',
            subtitle: `${notContacted.length} clientes sem contato`,
            customers: notContacted,
            audienceType: 'atRisk',
            color: 'amber',
            icon: AlertTriangle
        });
        setModalOpen(true);
    }, [highValueAtRiskCustomers]);

    // Generate simplified insights (reduced from 4 to 2)
    const insights = useMemo(() => {
        const result = [];

        // Primary insight: High-value at risk (clickable if > 0)
        if (notContactedHighValue > 0) {
            result.push({
                type: 'warning',
                text: `${notContactedHighValue} clientes de alto valor em risco sem contato`,
                onClick: handleHighValueAtRiskClick,
                customerCount: notContactedHighValue
            });
        } else if (highValueAtRiskCustomers.length === 0) {
            result.push({
                type: 'success',
                text: 'Nenhum cliente de alto valor em risco no momento'
            });
        } else {
            result.push({
                type: 'info',
                text: `${highValueAtRiskCustomers.length} clientes de alto valor em risco - todos contactados`
            });
        }

        // Secondary insight: Champions count (info only)
        if (championsCustomers.length > 0) {
            result.push({
                type: 'success',
                text: `${championsCustomers.length} campeoes ativos - mantenha o relacionamento`
            });
        }

        return result;
    }, [notContactedHighValue, highValueAtRiskCustomers, championsCustomers, handleHighValueAtRiskClick]);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;

            // Translate risk status to Portuguese
            const getRiskLabel = (status) => {
                const labels = {
                    'Healthy': 'Saudável',
                    'Monitor': 'Monitorar',
                    'At Risk': 'Em Risco',
                    'Churning': 'Crítico',
                    'New Customer': 'Novo',
                    'Lost': 'Perdido'
                };
                return labels[status] || status;
            };

            // Format contact date
            const formatContactDate = (isoDate) => {
                if (!isoDate) return '';
                const date = new Date(isoDate);
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            };

            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl text-xs max-w-[220px]">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">{d.name}</p>
                    <p className="text-slate-600 dark:text-slate-300">Gasto: <span className="font-semibold text-lavpop-blue dark:text-blue-400">{formatCurrency(d.y)}</span></p>
                    <p className="text-slate-600 dark:text-slate-300">Última visita: <span className="font-semibold text-red-500 dark:text-red-400">{d.x} dias atrás</span></p>
                    <p className="text-slate-600 dark:text-slate-300">Frequência: <span className="font-semibold text-lavpop-green dark:text-emerald-400">{d.r} visitas</span></p>

                    {/* Risk Status Badge */}
                    <div className={`mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit ${d.status === 'Healthy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        d.status === 'At Risk' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                            d.status === 'Churning' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                        {getRiskLabel(d.status)}
                    </div>

                    {/* Contact Status */}
                    {d.isContacted && d.contactInfo && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold">Contactado</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
                                {d.contactInfo.campaign_name || 'Campanha'}
                                {d.contactInfo.contacted_at && ` • ${formatContactDate(d.contactInfo.contacted_at)}`}
                            </p>
                        </div>
                    )}
                    {!d.isContacted && d.y > 500 && d.x > 30 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-amber-600 dark:text-amber-400 text-[10px] font-medium">
                                ⚡ Cliente de alto valor sem contato recente
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-sm h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-lavpop-blue"></span>
                    Mapa de Risco (RFM)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Identifique visualmente onde estão seus clientes de maior valor.
                    <br />
                    <span className="font-semibold text-green-600">Topo-Esquerda:</span> Campeões |
                    <span className="font-semibold text-red-500 ml-1">Topo-Direita:</span> Em Perigo
                </p>

                {/* Legend for contact status */}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/60"></div>
                        <span className="text-slate-600 dark:text-slate-400">Saudável</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-amber-500/60"></div>
                        <span className="text-slate-600 dark:text-slate-400">Em Risco</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-red-500/60"></div>
                        <span className="text-slate-600 dark:text-slate-400">Crítico</span>
                    </div>
                    {totalContacted > 0 && (
                        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-600">
                            <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-dashed border-blue-500"></div>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Contactado ({totalContacted})</span>
                        </div>
                    )}
                </div>

                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                        💡 <span className="font-bold">Nota:</span> A classificação considera o padrão individual de cada cliente.
                        Clientes "saudáveis" podem aparecer à direita se naturalmente visitam com menos frequência.
                    </p>
                </div>
            </div>

            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Recência"
                            unit=" dias"
                            stroke="#94a3b8"
                            fontSize={10}
                            label={{ value: 'Dias sem visitar (Recência)', position: 'bottom', offset: 0, fontSize: 10, fill: '#64748b' }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Valor"
                            unit=" R$"
                            stroke="#94a3b8"
                            fontSize={10}
                            tickFormatter={(val) => `R$${val}`}
                        />
                        {/* ZAxis controls bubble size based on frequency (r = transactions count) */}
                        <ZAxis
                            type="number"
                            dataKey="r"
                            range={[40, 400]}
                            name="Frequência"
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                        {/* Danger Zone Reference Line */}
                        <ReferenceLine x={30} stroke="#ef4444" strokeDasharray="3 3">
                            <Label value="Zona de Perigo (>30d)" position="insideTopRight" fill="#ef4444" fontSize={10} />
                        </ReferenceLine>

                        <Scatter
                            name="Clientes"
                            data={enrichedData}
                            fill="#8884d8"
                            onClick={(data) => handleBubbleClick(data)}
                            cursor={onOpenCustomerProfile ? 'pointer' : 'default'}
                        >
                            {enrichedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.status === 'Healthy' ? '#10b981' :
                                            entry.status === 'At Risk' ? '#f59e0b' :
                                                entry.status === 'Churning' ? '#ef4444' :
                                                    '#94a3b8'
                                    }
                                    fillOpacity={0.6}
                                    stroke={entry.isContacted ? '#3b82f6' : 'transparent'}
                                    strokeWidth={entry.isContacted ? 3 : 0}
                                    strokeDasharray={entry.isContacted ? '4 2' : undefined}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <InsightBox insights={insights} />

            {/* Customer Segment Modal */}
            <CustomerSegmentModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalData.title}
                subtitle={modalData.subtitle}
                icon={modalData.icon}
                color={modalData.color}
                customers={modalData.customers}
                audienceType={modalData.audienceType}
                contactedIds={contactedIds}
                onOpenCustomerProfile={onOpenCustomerProfile}
                onMarkContacted={onMarkContacted}
                onCreateCampaign={onCreateCampaign}
            />
        </div>
    );
};

export default RFMScatterPlot;
