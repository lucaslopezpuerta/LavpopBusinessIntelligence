// Analytics View v2.0 - COMPLETE REDESIGN
// Story-telling layout focused on strategic insights
// Four main sections: Growth, Comparisons, Seasonal, Lifecycle
//
// CHANGELOG:
// v2.0 (2025-11-16): Complete redesign - strategic focus
//   - Removed redundant metrics (no duplicate of Dashboard)
//   - Long-term focus (12 months, not weekly)
//   - Story-telling design with sections
//   - Uses proven math from businessMetrics.js

import React from 'react';
import { Sparkles, BarChart3 } from 'lucide-react';
import GrowthTrajectory from '../components/GrowthTrajectory';
import PeriodComparisons from '../components/PeriodComparisons';
import SeasonalIntelligence from '../components/SeasonalIntelligence';
import CustomerLifecycle from '../components/CustomerLifecycle';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280'
};

const Analytics = ({ data }) => {
  if (!data || !data.sales) {
    return (
      <div className="view-container" style={{ padding: '2rem' }}>
        <div style={{
          background: 'white',
          padding: '3rem 2rem',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <BarChart3 size={48} style={{ color: COLORS.primary, margin: '0 auto 1rem' }} />
          <h3 style={{ 
            color: COLORS.primary, 
            fontSize: '20px',
            marginBottom: '0.5rem'
          }}>
            Carregando dados estratégicos...
          </h3>
          <p style={{ color: COLORS.gray, fontSize: '14px', margin: 0 }}>
            Preparando análise de tendências e insights
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="view-container" style={{
      background: '#f9fafb',
      minHeight: '100vh',
      paddingBottom: '3rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1.5rem'
      }}>
        {/* Hero Header */}
        <div style={{
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderRadius: '20px',
            marginBottom: '1rem'
          }}>
            <Sparkles size={16} style={{ color: COLORS.primary }} />
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: COLORS.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Análise Estratégica
            </span>
          </div>
          
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: COLORS.primary,
            margin: 0,
            marginBottom: '0.75rem',
            lineHeight: 1.2
          }}>
            Analytics
          </h1>
          
          <p style={{
            fontSize: '16px',
            color: COLORS.gray,
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Análise de longo prazo, tendências de crescimento e insights para tomada de decisão estratégica
          </p>
        </div>
        
        {/* Section 1: Growth Trajectory (Hero) */}
        <div style={{ marginBottom: '3rem' }}>
          <GrowthTrajectory salesData={data.sales} />
        </div>
        
        {/* Section 2: Period Comparisons */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
          marginBottom: '3rem'
        }}>
          <PeriodComparisons salesData={data.sales} />
        </div>
        
        {/* Section 3 & 4: Side by Side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Section 3: Seasonal Intelligence */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <SeasonalIntelligence salesData={data.sales} />
          </div>
          
          {/* Section 4: Customer Lifecycle */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <CustomerLifecycle 
              salesData={data.sales} 
              customerData={data.customers}
            />
          </div>
        </div>
        
        {/* Footer insight */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '1.5rem 2rem',
          borderRadius: '12px',
          border: '1px solid #bae6fd',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '14px',
            color: COLORS.gray,
            margin: 0,
            lineHeight: 1.6
          }}>
            <strong style={{ color: COLORS.primary }}>💡 Dica:</strong> Use esses insights para planejar campanhas, 
            definir metas realistas e tomar decisões estratégicas baseadas em dados históricos comprovados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
