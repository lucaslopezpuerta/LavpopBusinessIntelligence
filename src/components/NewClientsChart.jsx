// NewClientsChart.jsx v2.1 - ACQUISITION CONTEXT WITH INSIGHTS
// Simplified new customer acquisition tracking
// 
// CHANGELOG:
// v2.1 (2025-11-24): Added actionable insights
//   - NEW: InsightBox with acquisition recommendations
// v2.0 (2025-11-23): Redesign for Customer Intelligence Hub

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import InsightBox from './InsightBox';

const NewClientsChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Calculate stats
  const totalNew = data.reduce((sum, d) => sum + d.count, 0);
  const avgNew = Math.round(totalNew / data.length);

  // Generate insights
  const insights = [];
  insights.push({ type: 'success', text: `📈 ${totalNew} novos clientes (média ${avgNew}/dia)` });
  insights.push({ type: 'action', text: '🎯 Meta: Converter 80% em clientes recorrentes' });
  insights.push({ type: 'action', text: '💡 Próximo passo: Programa de boas-vindas para novos clientes' });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-3 border border-slate-200 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-800 mb-1">{payload[0].payload.displayDate}</p>
          <p className="text-slate-600">
            <span className="font-bold text-lavpop-blue text-lg">{payload[0].value}</span> novos clientes
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
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Novos Clientes
        </h3>
        <p className="text-xs text-slate-500">
          Aquisição nos últimos 30 dias.
        </p>
      </div>

      <div className="flex items-end gap-4 mb-4">
        <div>
          <div className="text-3xl font-black text-slate-800">{totalNew}</div>
          <div className="text-xs font-bold text-slate-400 uppercase">Total</div>
        </div>
        <div>
          <div className="text-3xl font-black text-slate-800">{avgNew}</div>
          <div className="text-xs font-bold text-slate-400 uppercase">Média/Dia</div>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.count > avgNew ? '#3b82f6' : '#93c5fd'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <InsightBox insights={insights} />
    </div>
  );
};

export default NewClientsChart;
