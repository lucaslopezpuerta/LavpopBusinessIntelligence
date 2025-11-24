// RFMScatterPlot.jsx v1.3 - RISK MAP WITH CLEAR EXPLANATION
// Visual representation of customer value and recency
// 
// CHANGELOG:
// v1.3 (2025-11-24): Added explanation for likelihood-based classification
//   - NEW: Clear tooltip explaining why healthy customers can be in danger zone
//   - IMPROVED: Updated insights to mention individual patterns
// v1.2 (2025-11-24): Added actionable insights
// v1.1 (2025-11-24): Portuguese translations
// v1.0 (2025-11-23): Initial implementation

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';
import { formatCurrency } from '../utils/numberUtils';
import InsightBox from './InsightBox';

const RFMScatterPlot = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Generate insights
    const highValueAtRisk = data.filter(d => d.y > 500 && d.x > 30).length;
    const champions = data.filter(d => d.y > 500 && d.x <= 20).length;

    const insights = [];
    if (highValueAtRisk > 0) {
        insights.push({ type: 'warning', text: `⚠️ ${highValueAtRisk} clientes de alto valor (>R$500) estão em risco (>30 dias)` });
        insights.push({ type: 'action', text: '💡 AÇÃO URGENTE: Contatar esses clientes imediatamente' });
    }
    if (champions > 0) {
        insights.push({ type: 'success', text: `🎯 ${champions} campeões identificados - mantenha o relacionamento` });
    }
    insights.push({ type: 'action', text: '💡 A classificação considera padrões individuais, não apenas dias absolutos' });

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

            return (
                <div className="bg-white/90 backdrop-blur-md p-3 border border-slate-200 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-slate-800 mb-1">{d.name}</p>
                    <p className="text-slate-600">Gasto: <span className="font-semibold text-lavpop-blue">{formatCurrency(d.y)}</span></p>
                    <p className="text-slate-600">Última visita: <span className="font-semibold text-red-500">{d.x} dias atrás</span></p>
                    <p className="text-slate-600">Frequência: <span className="font-semibold text-lavpop-green">{d.r} visitas</span></p>
                    <div className={`mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit ${d.status === 'Healthy' ? 'bg-green-100 text-green-700' :
                        d.status === 'At Risk' ? 'bg-amber-100 text-amber-700' :
                            d.status === 'Churning' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                        }`}>
                        {getRiskLabel(d.status)}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-sm h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-lavpop-blue"></span>
                    Mapa de Risco (RFM)
                </h3>
                <p className="text-xs text-slate-500">
                    Identifique visualmente onde estão seus clientes de maior valor.
                    <br />
                    <span className="font-semibold text-green-600">Topo-Esquerda:</span> Campeões |
                    <span className="font-semibold text-red-500 ml-1">Topo-Direita:</span> Em Perigo
                </p>
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
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                        {/* Danger Zone Reference Line */}
                        <ReferenceLine x={30} stroke="#ef4444" strokeDasharray="3 3">
                            <Label value="Zona de Perigo (>30d)" position="insideTopRight" fill="#ef4444" fontSize={10} />
                        </ReferenceLine>

                        <Scatter name="Clientes" data={data} fill="#8884d8">
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.status === 'Healthy' ? '#10b981' :
                                            entry.status === 'At Risk' ? '#f59e0b' :
                                                entry.status === 'Churning' ? '#ef4444' :
                                                    '#94a3b8'
                                    }
                                    fillOpacity={0.6}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <InsightBox insights={insights} />
        </div>
    );
};

export default RFMScatterPlot;
