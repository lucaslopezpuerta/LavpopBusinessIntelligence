// ChurnHistogram.jsx v1.0 - DANGER ZONE VISUALIZATION
// Time-to-churn distribution histogram
// 
// CHANGELOG:
// v1.0 (2025-11-23): Initial implementation for Customer Intelligence Hub
//   - Histogram showing distribution of "Days Between Visits"
//   - Color-coded buckets: Green (0-20d), Amber (20-30d), Red (30d+)
//   - Identifies natural drop-off point for customer retention
//   - Interactive tooltips with customer counts
//   - Tailwind CSS styling with glassmorphism
//   - Fully responsive design

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ChurnHistogram = ({ data }) => {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md p-3 border border-slate-200 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-slate-800 mb-1">Intervalo: {label} dias</p>
                    <p className="text-slate-600">
                        <span className="font-bold text-lavpop-blue text-lg">{payload[0].value}</span> clientes
                    </p>
                    <p className="text-slate-500 mt-1 italic">
                        retornam geralmente neste período
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-sm h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Zona de Perigo (Churn)
                </h3>
                <p className="text-xs text-slate-500">
                    Distribuição do tempo de retorno. A maioria dos clientes volta em <span className="font-bold text-slate-700">0-20 dias</span>.
                    <br />
                    Após <span className="font-bold text-red-500">30 dias</span>, a chance de retorno cai drasticamente.
                </p>
            </div>

            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="bin"
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.min < 20 ? '#10b981' : // Safe (Green)
                                            entry.min < 30 ? '#f59e0b' : // Warning (Amber)
                                                '#ef4444' // Danger (Red)
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChurnHistogram;
