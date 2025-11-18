// Seasonal Intelligence Component v1.0
// Visual representation of seasonal patterns
// Shows which months historically perform best/worst
//
// CHANGELOG:
// v1.0 (2025-11-16): Initial implementation

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Sun, CloudRain } from 'lucide-react';
import { calculateSeasonalIndex } from '../utils/analyticsCalculations';
import { aggregateByMonth } from '../utils/analyticsCalculations';
import { formatCurrency } from '../utils/numberUtils';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280',
  red: '#dc2626',
  green: '#10b981',
  amber: '#f59e0b'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  
  const data = payload[0].payload;
  
  return (
    <div style={{
      background: 'white',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        fontSize: '13px', 
        fontWeight: '600', 
        color: COLORS.primary,
        marginBottom: '0.5rem'
      }}>
        {data.monthName}
      </div>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '700',
        color: COLORS.gray,
        marginBottom: '0.25rem'
      }}>
        Média: {formatCurrency(data.avgRevenue)}
      </div>
      <div style={{ 
        fontSize: '12px', 
        color: data.performance === 'strong' ? COLORS.green :
               data.performance === 'weak' ? COLORS.red : COLORS.gray
      }}>
        Índice: {data.index} {data.performance === 'strong' ? '🔥' : data.performance === 'weak' ? '❄️' : ''}
      </div>
      <div style={{ 
        fontSize: '11px', 
        color: COLORS.gray,
        marginTop: '0.25rem'
      }}>
        Baseado em {data.count} {data.count === 1 ? 'mês' : 'meses'}
      </div>
    </div>
  );
};

const SeasonalIntelligence = ({ salesData }) => {
  const { seasonalData, insights } = useMemo(() => {
    if (!salesData) return { seasonalData: [], insights: [] };
    
    const monthlyData = aggregateByMonth(salesData);
    const seasonalData = calculateSeasonalIndex(monthlyData);
    
    // Generate insights
    const insights = [];
    const strongest = seasonalData[0];
    const weakest = seasonalData[seasonalData.length - 1];
    
    if (strongest) {
      insights.push({
        type: 'strong',
        text: `${strongest.monthName} é historicamente o mês mais forte (${strongest.index} pontos)`,
        icon: '🔥'
      });
    }
    
    if (weakest && weakest.index < 90) {
      insights.push({
        type: 'weak',
        text: `${weakest.monthName} tende a ser mais fraco - oportunidade para campanhas`,
        icon: '💡'
      });
    }
    
    // Check for current month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentSeasonalData = seasonalData.find(d => d.month === currentMonth);
    
    if (currentSeasonalData) {
      if (currentSeasonalData.performance === 'strong') {
        insights.push({
          type: 'current',
          text: `Mês atual (${currentSeasonalData.monthName}) historicamente é forte - aproveite!`,
          icon: '📈'
        });
      } else if (currentSeasonalData.performance === 'weak') {
        insights.push({
          type: 'current',
          text: `Mês atual (${currentSeasonalData.monthName}) tende a ser mais fraco - considere promoções`,
          icon: '🎯'
        });
      }
    }
    
    return { seasonalData, insights };
  }, [salesData]);
  
  if (seasonalData.length === 0) return <div>Carregando padrões sazonais...</div>;
  
  // Get color for each bar based on performance
  const getBarColor = (performance) => {
    if (performance === 'strong') return COLORS.green;
    if (performance === 'weak') return COLORS.amber;
    return COLORS.primary;
  };
  
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <Sun size={20} style={{ color: COLORS.primary }} />
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: COLORS.primary,
            margin: 0
          }}>
            Inteligência Sazonal
          </h3>
        </div>
        <p style={{
          fontSize: '14px',
          color: COLORS.gray,
          margin: 0
        }}>
          Padrões de performance ao longo do ano
        </p>
      </div>
      
      {/* Chart */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        marginBottom: '1.5rem'
      }}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={seasonalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="monthName" 
              stroke={COLORS.gray}
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke={COLORS.gray}
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="avgRevenue" 
              radius={[8, 8, 0, 0]}
              name="Receita Média"
            >
              {seasonalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.performance)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#f9fafb',
          borderRadius: '8px',
          fontSize: '12px',
          color: COLORS.gray,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', background: COLORS.green, borderRadius: '3px' }} />
            <span>Forte (&gt;110% da média)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', background: COLORS.primary, borderRadius: '3px' }} />
            <span>Médio (90-110%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', background: COLORS.amber, borderRadius: '3px' }} />
            <span>Fraco (&lt;90%)</span>
          </div>
        </div>
      </div>
      
      {/* Insights cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        {insights.map((insight, index) => (
          <div
            key={index}
            style={{
              padding: '1rem 1.25rem',
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}
          >
            <div style={{ fontSize: '20px', lineHeight: 1 }}>
              {insight.icon}
            </div>
            <div style={{
              fontSize: '13px',
              color: COLORS.gray,
              lineHeight: '1.6'
            }}>
              {insight.text}
            </div>
          </div>
        ))}
      </div>
      
      {/* Strategic tip */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        borderRadius: '12px',
        border: '1px solid #bfdbfe'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <CloudRain size={24} style={{ color: COLORS.blue, flexShrink: 0, marginTop: '0.125rem' }} />
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: COLORS.primary,
              marginBottom: '0.5rem'
            }}>
              Dica Estratégica
            </div>
            <p style={{
              fontSize: '13px',
              color: COLORS.gray,
              margin: 0,
              lineHeight: '1.6'
            }}>
              Use esses padrões sazonais para planejar campanhas promocionais nos meses fracos e 
              preparar capacidade extra nos meses fortes. Considere também fatores climáticos - 
              dias chuvosos tendem a aumentar demanda por secagem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalIntelligence;
