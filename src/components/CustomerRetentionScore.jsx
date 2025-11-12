// CustomerRetentionScore_v2.0.jsx
// ✅ Using Actual Recent Returns methodology
// Shows: Of customers who visited X days ago, what % came back within 30 days?
// More actionable than average frequency, shows actual retention performance

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

/**
 * OPTION C: ACTUAL RECENT RETURNS
 * 
 * WHAT IT CALCULATES:
 * For customers who visited X days ago (30/60/90), what percentage returned within the next 30 days?
 * 
 * EXAMPLE (30-day retention):
 * - Look at all customers who visited 30 days ago (e.g., Oct 13)
 * - Count how many of them came back between Oct 13 and Nov 12 (30-day window)
 * - Rate = (returned customers / eligible customers) * 100
 * 
 * WHY THIS IS BETTER:
 * - Shows actual retention behavior, not just average frequency
 * - Measures recent performance (last 30/60/90 days)
 * - Actionable: "We're keeping 85% of customers" is clear and measurable
 * - Can track improvement over time
 * 
 * DIFFERENCES FROM OLD METHOD:
 * - Old: Average days between visits across all time
 * - New: Actual return rate in recent time windows
 * - Old: "89.8% of customers return within 30 days on average"
 * - New: "85% of customers who visited 30 days ago came back"
 */
const CustomerRetentionScore = ({ salesData }) => {
  const retentionData = useMemo(() => {
    if (!salesData || salesData.length === 0) return null;

    const now = new Date();
    
    // Group all visits by customer
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

    // Sort visits for each customer chronologically
    Object.values(customerVisits).forEach(visits => {
      visits.sort((a, b) => a - b);
    });

    /**
     * Calculate retention for a specific lookback period
     * @param {number} lookbackDays - How many days ago to look (30, 60, or 90)
     * @returns {number} Percentage of customers who returned within 30 days
     */
    const calculateRetentionRate = (lookbackDays) => {
      // Define the target date (X days ago)
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - lookbackDays);
      targetDate.setHours(0, 0, 0, 0);
      
      // Define the window end (target date + 30 days)
      const windowEnd = new Date(targetDate);
      windowEnd.setDate(windowEnd.getDate() + 30);
      windowEnd.setHours(23, 59, 59, 999);
      
      // Allow some tolerance (±3 days) for "visited around target date"
      const targetStart = new Date(targetDate);
      targetStart.setDate(targetStart.getDate() - 3);
      const targetEnd = new Date(targetDate);
      targetEnd.setDate(targetEnd.getDate() + 3);
      
      let eligibleCustomers = 0;
      let returnedCustomers = 0;
      
      Object.entries(customerVisits).forEach(([doc, visits]) => {
        // Find if customer visited around target date
        const visitedAroundTarget = visits.some(visit => 
          visit >= targetStart && visit <= targetEnd
        );
        
        if (!visitedAroundTarget) return; // Customer wasn't active at target date
        
        eligibleCustomers++;
        
        // Check if they came back within 30 days after target
        const returnedInWindow = visits.some(visit => 
          visit > targetDate && visit <= windowEnd
        );
        
        if (returnedInWindow) {
          returnedCustomers++;
        }
      });
      
      return eligibleCustomers > 0 
        ? (returnedCustomers / eligibleCustomers) * 100 
        : 0;
    };

    return {
      rate30: Math.round(calculateRetentionRate(30) * 10) / 10,
      rate60: Math.round(calculateRetentionRate(60) * 10) / 10,
      rate90: Math.round(calculateRetentionRate(90) * 10) / 10,
      totalCustomers: Object.keys(customerVisits).length
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

  /**
   * INTERPRETATION GUIDE:
   * 
   * 30-Day Rate: Short-term loyalty
   * - >80%: Excellent - Customers highly engaged
   * - 60-80%: Good - Strong retention
   * - 40-60%: Fair - Room for improvement
   * - <40%: Poor - Need retention campaigns
   * 
   * 60-Day Rate: Medium-term retention
   * - Usually 5-10% higher than 30-day
   * - Shows if customers return eventually
   * 
   * 90-Day Rate: Long-term loyalty
   * - Usually 8-15% higher than 30-day
   * - High rate = loyal customer base
   * 
   * TREND TO WATCH:
   * If 90-day rate is much higher than 30-day (e.g., 30-day: 60%, 90-day: 85%)
   * → Customers are returning, but taking longer than ideal
   * → Consider reminder campaigns at 20-25 days
   */
  const periods = [
    {
      label: '30 Days',
      rate: retentionData.rate30,
      description: 'Returned within 1 month',
      meaning: 'Short-term loyalty'
    },
    {
      label: '60 Days',
      rate: retentionData.rate60,
      description: 'Returned within 2 months',
      meaning: 'Medium-term retention'
    },
    {
      label: '90 Days',
      rate: retentionData.rate90,
      description: 'Returned within 3 months',
      meaning: 'Long-term loyalty'
    }
  ];

  const getColorForRate = (rate) => {
    if (rate >= 80) return COLORS.accent;
    if (rate >= 60) return '#22c55e';
    if (rate >= 40) return '#f59e0b';
    return '#dc2626';
  };

  const getPerformanceLabel = (rate) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    if (rate >= 40) return 'Fair';
    return 'Needs Improvement';
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
          Of customers active X days ago, % who returned within 30 days
        </p>
      </div>

      {/* Retention Periods */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {periods.map((period, index) => {
          const performance = getPerformanceLabel(period.rate);
          const color = getColorForRate(period.rate);
          
          return (
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
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: color
                  }}>
                    {period.rate}%
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {performance}
                  </div>
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
                  background: color,
                  borderRadius: '4px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Interpretation Guide */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '11px',
        color: COLORS.gray
      }}>
        <div style={{ fontWeight: '600', marginBottom: '4px', color: COLORS.primary }}>
          💡 How to Read This
        </div>
        <div style={{ lineHeight: '1.5' }}>
          <strong>30-day rate</strong>: Of customers active 30 days ago, {retentionData.rate30}% came back within a month.
          {retentionData.rate90 - retentionData.rate30 > 15 && (
            <div style={{ marginTop: '4px', color: '#f59e0b' }}>
              ⚠️ Large gap between 30 and 90-day suggests customers return, but slowly. Consider reminder campaigns at 20-25 days.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerRetentionScore;
