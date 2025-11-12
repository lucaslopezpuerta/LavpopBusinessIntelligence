import React, { useMemo } from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  gray: '#6b7280'
};

/**
 * Normalize document number
 */
function normalizeDoc(doc) {
  if (!doc) return '';
  const cleaned = String(doc).replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned.length <= 11) {
    return cleaned.padStart(11, '0');
  }
  return cleaned;
}

const CustomerRetentionScore = ({ salesData }) => {
  const retentionData = useMemo(() => {
    if (!salesData || salesData.length === 0) return null;

    // Group visits by customer
    const customerVisits = {};
    
    salesData.forEach(row => {
      const doc = normalizeDoc(row.Doc_Cliente || row.document || row.doc || '');
      if (!doc) return;

      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date) return;

      if (!customerVisits[doc]) {
        customerVisits[doc] = [];
      }
      customerVisits[doc].push(date);
    });

    // Sort visits for each customer
    Object.values(customerVisits).forEach(visits => {
      visits.sort((a, b) => a - b);
    });

    // Calculate return rates
    let totalCustomersWithMultipleVisits = 0;
    let returnedWithin30 = 0;
    let returnedWithin60 = 0;
    let returnedWithin90 = 0;

    Object.values(customerVisits).forEach(visits => {
      if (visits.length < 2) return;
      
      totalCustomersWithMultipleVisits++;

      // Calculate time between visits
      const intervals = [];
      for (let i = 1; i < visits.length; i++) {
        const days = Math.round((visits[i] - visits[i-1]) / (1000*60*60*24));
        intervals.push(days);
      }

      const avgInterval = intervals.reduce((a,b) => a+b, 0) / intervals.length;

      if (avgInterval <= 30) returnedWithin30++;
      if (avgInterval <= 60) returnedWithin60++;
      if (avgInterval <= 90) returnedWithin90++;
    });

    const rate30 = totalCustomersWithMultipleVisits > 0 
      ? (returnedWithin30 / totalCustomersWithMultipleVisits) * 100 
      : 0;
    const rate60 = totalCustomersWithMultipleVisits > 0 
      ? (returnedWithin60 / totalCustomersWithMultipleVisits) * 100 
      : 0;
    const rate90 = totalCustomersWithMultipleVisits > 0 
      ? (returnedWithin90 / totalCustomersWithMultipleVisits) * 100 
      : 0;

    return {
      rate30: Math.round(rate30 * 10) / 10,
      rate60: Math.round(rate60 * 10) / 10,
      rate90: Math.round(rate90 * 10) / 10,
      totalCustomersAnalyzed: totalCustomersWithMultipleVisits
    };
  }, [salesData]);

  if (!retentionData) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Loading retention data...
      </div>
    );
  }

  const periods = [
    {
      label: '30 Days',
      rate: retentionData.rate30,
      description: 'Return within 1 month'
    },
    {
      label: '60 Days',
      rate: retentionData.rate60,
      description: 'Return within 2 months'
    },
    {
      label: '90 Days',
      rate: retentionData.rate90,
      description: 'Return within 3 months'
    }
  ];

  const getColorForRate = (rate) => {
    if (rate >= 80) return COLORS.accent;
    if (rate >= 60) return '#22c55e';
    if (rate >= 40) return '#f59e0b';
    return '#dc2626';
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <TrendingUp style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Customer Retention Rate
          </h3>
        </div>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          Based on {retentionData.totalCustomersAnalyzed} repeat customers
        </p>
      </div>

      {/* Retention Periods */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {periods.map((period, index) => (
          <div key={index}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: COLORS.primary
                }}>
                  {period.label}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: COLORS.gray
                }}>
                  {period.description}
                </div>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: getColorForRate(period.rate)
              }}>
                {period.rate}%
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              background: '#f3f4f6',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${period.rate}%`,
                height: '100%',
                background: getColorForRate(period.rate),
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '11px',
        color: COLORS.gray,
        textAlign: 'center'
      }}>
        💡 Higher rates indicate stronger customer loyalty
      </div>
    </div>
  );
};

export default CustomerRetentionScore;
