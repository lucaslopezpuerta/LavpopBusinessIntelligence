// OPERATIONS KPI CARDS V4.0.1 - MINIMAL WORKING VERSION
// ✅ Fixed thresholds (25/15/10)
// ✅ Correct data access
// ✅ No complex features - just working basics

import React from 'react';
import { Flame, Activity, Gauge } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  excellent: '#22c55e',
  good: '#53be33',
  fair: '#f59e0b',
  low: '#dc2626',
  gray: '#6b7280'
};

const THRESHOLDS = {
  excellent: 25,
  good: 15,
  fair: 10
};

const OperationsKPICards = ({ businessMetrics }) => {
  if (!businessMetrics || !businessMetrics.utilization) {
    return (
      <div style={{ color: '#6b7280', padding: '1rem' }}>
        Loading KPI metrics...
      </div>
    );
  }

  const getStatus = (utilization) => {
    if (utilization >= THRESHOLDS.excellent) return { label: 'Excelente', color: COLORS.excellent, emoji: '🔥' };
    if (utilization >= THRESHOLDS.good) return { label: 'Bom', color: COLORS.good, emoji: '✅' };
    if (utilization >= THRESHOLDS.fair) return { label: 'Razoável', color: COLORS.fair, emoji: '⚠️' };
    return { label: 'Baixo', color: COLORS.low, emoji: '📉' };
  };

  const washUtil = businessMetrics.utilization.wash || 0;
  const dryUtil = businessMetrics.utilization.dry || 0;
  const totalUtil = businessMetrics.utilization.total || 0;

  const washServices = businessMetrics.services?.wash || 0;
  const dryServices = businessMetrics.services?.dry || 0;
  const totalServices = businessMetrics.services?.total || 0;

  const washStatus = getStatus(washUtil);
  const dryStatus = getStatus(dryUtil);
  const totalStatus = getStatus(totalUtil);

  const KPICard = ({ 
    title, 
    icon: Icon, 
    utilization, 
    status, 
    capacity, 
    services,
    machineCount
  }) => {
    const progressWidth = Math.min(utilization, 100);
    const capacityPerHour = machineCount === 3 ? 2 : 1.33;
    const maxCyclesPerWeek = Math.round(machineCount * 15 * 7 * capacityPerHour);

    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: `2px solid ${status.color}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: `${status.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon style={{ width: '18px', height: '18px', color: status.color }} />
            </div>
            <h3 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: COLORS.gray,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {title}
            </h3>
          </div>
          <span style={{ fontSize: '24px' }}>{status.emoji}</span>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{
            fontSize: '36px',
            fontWeight: '700',
            color: status.color
          }}>
            {utilization.toFixed(0)}%
          </span>
          <div style={{ marginTop: '0.25rem' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: status.color
            }}>
              {status.label}
            </span>
          </div>
        </div>

        <div style={{
          background: '#f0f9ff',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{ fontSize: '12px', color: COLORS.gray }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Semana Atual:</span>
              <strong style={{ color: COLORS.primary }}>{services} serviços</strong>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '0.5rem' }}>
            {capacity} - {maxCyclesPerWeek} ciclos possíveis/semana
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressWidth}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${status.color}, ${status.color}dd)`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.25rem',
            fontSize: '10px',
            color: COLORS.gray
          }}>
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      <KPICard
        title="LAVADORAS"
        icon={Flame}
        utilization={washUtil}
        status={washStatus}
        capacity="3 máquinas"
        services={washServices}
        machineCount={3}
      />

      <KPICard
        title="SECADORAS"
        icon={Activity}
        utilization={dryUtil}
        status={dryStatus}
        capacity="5 máquinas"
        services={dryServices}
        machineCount={5}
      />

      <KPICard
        title="UTILIZAÇÃO TOTAL"
        icon={Gauge}
        utilization={totalUtil}
        status={totalStatus}
        capacity="8 máquinas"
        services={totalServices}
        machineCount={8}
      />
    </div>
  );
};

export default OperationsKPICards;
