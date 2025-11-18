// Period Comparisons Component v1.0
// Side-by-side comparisons: Current vs Previous vs Last Year
// Shows MoM and YoY growth with visual indicators
//
// CHANGELOG:
// v1.0 (2025-11-16): Initial implementation

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, ArrowRight } from 'lucide-react';
import {
  getCurrentMonthMetrics,
  getPreviousMonthMetrics,
  getSameMonthLastYearMetrics,
  calculateGrowthRate
} from '../utils/analyticsCalculations';
import { formatCurrency } from '../utils/numberUtils';
import { getMonthName } from '../utils/analyticsDateUtils';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280',
  red: '#dc2626',
  green: '#10b981',
  blue: '#3b82f6'
};

const ComparisonCard = ({ title, subtitle, revenue, services, utilization, growth, growthLabel, color }) => (
  <div style={{
    background: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    flex: 1,
    minWidth: '240px',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Color accent bar */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: color
    }} />
    
    {/* Header */}
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '700',
        color: COLORS.gray,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '0.25rem'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '13px',
        color: COLORS.gray,
        opacity: 0.8
      }}>
        {subtitle}
      </div>
    </div>
    
    {/* Revenue */}
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        fontSize: '32px',
        fontWeight: '700',
        color: COLORS.primary,
        lineHeight: 1
      }}>
        {formatCurrency(revenue)}
      </div>
    </div>
    
    {/* Growth indicator */}
    {growth !== null && growth !== undefined && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        padding: '0.5rem',
        background: growth > 0 ? 'rgba(16, 185, 129, 0.08)' : 
                    growth < 0 ? 'rgba(220, 38, 38, 0.08)' : 
                    'rgba(107, 114, 128, 0.08)',
        borderRadius: '8px'
      }}>
        {growth > 0 ? (
          <TrendingUp size={16} style={{ color: COLORS.green }} />
        ) : growth < 0 ? (
          <TrendingDown size={16} style={{ color: COLORS.red }} />
        ) : (
          <ArrowRight size={16} style={{ color: COLORS.gray }} />
        )}
        <div>
          <div style={{
            fontSize: '16px',
            fontWeight: '700',
            color: growth > 0 ? COLORS.green : growth < 0 ? COLORS.red : COLORS.gray
          }}>
            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
          </div>
          <div style={{
            fontSize: '11px',
            color: COLORS.gray,
            opacity: 0.8
          }}>
            {growthLabel}
          </div>
        </div>
      </div>
    )}
    
    {/* Metrics grid */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.75rem',
      marginTop: '1rem',
      paddingTop: '1rem',
      borderTop: '1px solid #f3f4f6'
    }}>
      <div>
        <div style={{
          fontSize: '11px',
          color: COLORS.gray,
          marginBottom: '0.25rem'
        }}>
          Ciclos
        </div>
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          color: COLORS.primary
        }}>
          {services}
        </div>
      </div>
      <div>
        <div style={{
          fontSize: '11px',
          color: COLORS.gray,
          marginBottom: '0.25rem'
        }}>
          Utilização
        </div>
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          color: COLORS.accent
        }}>
          {utilization.toFixed(1)}%
        </div>
      </div>
    </div>
  </div>
);

const PeriodComparisons = ({ salesData }) => {
  const { current, previous, lastYear, momGrowth, yoyGrowth } = useMemo(() => {
    if (!salesData) return { current: null, previous: null, lastYear: null };
    
    const current = getCurrentMonthMetrics(salesData);
    const previous = getPreviousMonthMetrics(salesData);
    const lastYear = getSameMonthLastYearMetrics(salesData);
    
    const momGrowth = calculateGrowthRate(current.revenue, previous.revenue);
    const yoyGrowth = lastYear ? calculateGrowthRate(current.revenue, lastYear.revenue) : null;
    
    return { current, previous, lastYear, momGrowth, yoyGrowth };
  }, [salesData]);
  
  if (!current) return <div>Carregando comparações...</div>;
  
  const today = new Date();
  const currentMonthName = getMonthName(today.getMonth());
  const currentYear = today.getFullYear();
  
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
          <Calendar size={20} style={{ color: COLORS.primary }} />
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: COLORS.primary,
            margin: 0
          }}>
            Comparação de Períodos
          </h3>
        </div>
        <p style={{
          fontSize: '14px',
          color: COLORS.gray,
          margin: 0
        }}>
          Análise comparativa para tomada de decisão estratégica
        </p>
      </div>
      
      {/* Comparison cards */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Current month */}
        <ComparisonCard
          title="ESTE MÊS"
          subtitle={`${currentMonthName} ${currentYear}`}
          revenue={current.revenue}
          services={current.services}
          utilization={current.utilization}
          growth={momGrowth}
          growthLabel="vs mês anterior"
          color={COLORS.primary}
        />
        
        {/* Previous month */}
        <ComparisonCard
          title="MÊS PASSADO"
          subtitle={`${previous.monthName} ${previous.year}`}
          revenue={previous.revenue}
          services={previous.services}
          utilization={previous.utilization}
          growth={null}
          growthLabel=""
          color={COLORS.blue}
        />
        
        {/* Same month last year */}
        {lastYear && (
          <ComparisonCard
            title="MESMO MÊS 2024"
            subtitle={`${lastYear.monthName} ${lastYear.year}`}
            revenue={lastYear.revenue}
            services={lastYear.services}
            utilization={lastYear.utilization}
            growth={yoyGrowth}
            growthLabel="crescimento anual"
            color={COLORS.accent}
          />
        )}
      </div>
      
      {/* Insights box */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '700',
          color: COLORS.primary,
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          💡 Análise Rápida
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: '1.5rem',
          fontSize: '14px',
          color: COLORS.gray,
          lineHeight: '1.8'
        }}>
          {momGrowth > 5 && (
            <li>Crescimento mensal de <strong>{momGrowth.toFixed(1)}%</strong> indica boa performance</li>
          )}
          {momGrowth < -5 && (
            <li style={{ color: COLORS.red }}>Queda de <strong>{Math.abs(momGrowth).toFixed(1)}%</strong> requer atenção - considere campanhas promocionais</li>
          )}
          {yoyGrowth !== null && yoyGrowth > 20 && (
            <li>Crescimento anual de <strong>{yoyGrowth.toFixed(1)}%</strong> mostra forte trajetória</li>
          )}
          {current.utilization < 20 && (
            <li style={{ color: COLORS.blue }}>Utilização de {current.utilization.toFixed(1)}% sugere oportunidade para aumentar volume</li>
          )}
          {current.utilization > 35 && (
            <li style={{ color: COLORS.green }}>Utilização de {current.utilization.toFixed(1)}% está excelente!</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default PeriodComparisons;
