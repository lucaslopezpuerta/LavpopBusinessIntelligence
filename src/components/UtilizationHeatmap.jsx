// UtilizationHeatmap Component v2.1
// Hour x Day heatmap showing average service utilization patterns
//
// CHANGELOG:
// v2.1 (2025-11-15): Portuguese labels
//   - Changed "Low activity" to "Baixa atividade"
//   - Changed "High activity" to "Alta atividade"
//   - Confirmed displays average services per hour/day
// v2.0 (2025-11-15): Dynamic date filtering
//   - Removed hardcoded "last 4 weeks" logic
//   - Now receives dateFilter and dateWindow props from parent
//   - Uses dateWindow.start and dateWindow.end for filtering
//   - Displays explicit date range in subtitle
//   - Synchronized with Operations tab DateRangeSelector
// v1.0 (Previous): Initial implementation with fixed 4-week window

import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  gray: '#6b7280'
};

/**
 * Count machines from transaction string
 */
function countMachines(str) {
  if (!str) return { wash: 0, dry: 0, total: 0 };
  const machines = String(str).toLowerCase().split(',').map(m => m.trim());
  let wash = 0, dry = 0;
  machines.forEach(m => {
    if (m.includes('lavadora')) wash++;
    else if (m.includes('secadora')) dry++;
  });
  return { wash, dry, total: wash + dry };
}

const UtilizationHeatmap = ({ salesData, dateFilter = 'currentWeek', dateWindow }) => {
  const heatmapData = useMemo(() => {
    if (!salesData || salesData.length === 0 || !dateWindow) return null;

    const OPERATING_HOURS = { start: 8, end: 23 };
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Use dateWindow from centralized filter
    const startDate = dateWindow.start;
    const endDate = dateWindow.end;

    // Initialize grid: [hour][day]
    const grid = {};
    for (let hour = OPERATING_HOURS.start; hour < OPERATING_HOURS.end; hour++) {
      grid[hour] = {};
      for (let day = 0; day < 7; day++) {
        grid[hour][day] = { services: 0, days: 0 };
      }
    }

    // Count unique days we have data for each hour/day combination
    const daysSeen = {};
    for (let hour = OPERATING_HOURS.start; hour < OPERATING_HOURS.end; hour++) {
      daysSeen[hour] = {};
      for (let day = 0; day < 7; day++) {
        daysSeen[hour][day] = new Set();
      }
    }

    // Process sales data
    salesData.forEach(row => {
      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date || date < startDate || date > endDate) return;

      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      if (hour >= OPERATING_HOURS.start && hour < OPERATING_HOURS.end) {
        const machineInfo = countMachines(row.Maquinas || row.machine || '');
        
        grid[hour][dayOfWeek].services += machineInfo.total;
        
        // Track which calendar dates we've seen for this hour/day combo
        const dateStr = date.toISOString().split('T')[0];
        daysSeen[hour][dayOfWeek].add(dateStr);
      }
    });

    // Calculate averages
    const avgGrid = {};
    let maxAvg = 0;

    for (let hour = OPERATING_HOURS.start; hour < OPERATING_HOURS.end; hour++) {
      avgGrid[hour] = {};
      for (let day = 0; day < 7; day++) {
        const uniqueDays = daysSeen[hour][day].size;
        const avg = uniqueDays > 0 ? grid[hour][day].services / uniqueDays : 0;
        avgGrid[hour][day] = Math.round(avg * 10) / 10;
        maxAvg = Math.max(maxAvg, avgGrid[hour][day]);
      }
    }

    return {
      grid: avgGrid,
      maxAvg,
      hours: Array.from({ length: OPERATING_HOURS.end - OPERATING_HOURS.start }, 
        (_, i) => OPERATING_HOURS.start + i),
      days
    };
  }, [salesData, dateWindow]);

  if (!heatmapData) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Carregando mapa de calor de utilização...
      </div>
    );
  }

  const { grid, maxAvg, hours, days } = heatmapData;

  const getColor = (value) => {
    if (value === 0) return '#f3f4f6';
    const intensity = value / maxAvg;
    
    if (intensity > 0.8) return '#15803d'; // Dark green
    if (intensity > 0.6) return '#16a34a'; // Medium-dark green
    if (intensity > 0.4) return '#22c55e'; // Medium green
    if (intensity > 0.2) return '#86efac'; // Light green
    return '#dcfce7'; // Very light green
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
          <Activity style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Mapa de Calor de Utilização
          </h3>
        </div>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          Período: {dateWindow?.dateRange || 'Carregando...'}
        </p>
        <p style={{
          fontSize: '11px',
          color: '#9ca3af',
          margin: '0.25rem 0 0 0',
          fontStyle: 'italic'
        }}>
          Valores = média de serviços por hora em cada dia da semana
        </p>
      </div>

      {/* Heatmap */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '600px' }}>
          {/* Day headers */}
          <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
            <div style={{ width: '50px' }}></div>
            {days.map((day, index) => (
              <div 
                key={index}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: COLORS.gray
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          {hours.map(hour => (
            <div key={hour} style={{ display: 'flex', marginBottom: '2px' }}>
              <div style={{
                width: '50px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '11px',
                color: COLORS.gray,
                fontWeight: '500'
              }}>
                {hour}:00
              </div>
              {days.map((_, dayIndex) => {
                const value = grid[hour][dayIndex];
                return (
                  <div
                    key={dayIndex}
                    style={{
                      flex: 1,
                      height: '24px',
                      background: getColor(value),
                      margin: '0 1px',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: value > maxAvg * 0.5 ? 'white' : COLORS.gray,
                      cursor: 'default',
                      transition: 'transform 0.1s'
                    }}
                    title={`${days[dayIndex]} ${hour}:00 - ${value.toFixed(1)} serviços em média`}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {value > 0 ? value.toFixed(0) : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: COLORS.gray
      }}>
        <span>Baixa atividade</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, idx) => (
            <div
              key={idx}
              style={{
                width: '20px',
                height: '12px',
                background: getColor(maxAvg * intensity),
                borderRadius: '2px'
              }}
            />
          ))}
        </div>
        <span>Alta atividade</span>
      </div>
    </div>
  );
};

export default UtilizationHeatmap;
