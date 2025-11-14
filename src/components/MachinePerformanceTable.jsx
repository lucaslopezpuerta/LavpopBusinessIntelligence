import React from 'react';
import { Droplet, Activity, TrendingUp } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  wash: '#3b82f6',
  dry: '#f59e0b',
  gray: '#6b7280'
};

const MachinePerformanceTable = ({ machinePerformance }) => {
  if (!machinePerformance || machinePerformance.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Loading machine performance data...
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Separate washers and dryers
  const washers = machinePerformance.filter(m => m.type === 'wash');
  const dryers = machinePerformance.filter(m => m.type === 'dry');

  // Calculate totals
  const totalWashUses = washers.reduce((sum, m) => sum + m.uses, 0);
  const totalDryUses = dryers.reduce((sum, m) => sum + m.uses, 0);
  const totalWashRevenue = washers.reduce((sum, m) => sum + m.revenue, 0);
  const totalDryRevenue = dryers.reduce((sum, m) => sum + m.revenue, 0);

  const avgWashUses = washers.length > 0 ? totalWashUses / washers.length : 0;
  const avgDryUses = dryers.length > 0 ? totalDryUses / dryers.length : 0;

  const MachineRow = ({ machine, avgUses }) => {
    const isAboveAverage = machine.uses >= avgUses;
    
    return (
      <tr style={{
        borderBottom: '1px solid #f3f4f6',
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <td style={{
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {machine.type === 'wash' ? (
            <Droplet style={{ width: '16px', height: '16px', color: COLORS.wash }} />
          ) : (
            <Activity style={{ width: '16px', height: '16px', color: COLORS.dry }} />
          )}
          <span style={{ 
            fontSize: '13px',
            fontWeight: '500',
            color: COLORS.primary
          }}>
            {machine.name}
          </span>
        </td>
        <td style={{
          padding: '0.75rem',
          textAlign: 'center'
        }}>
          <span style={{ 
            fontSize: '14px',
            fontWeight: '600',
            color: isAboveAverage ? COLORS.accent : COLORS.gray
          }}>
            {machine.uses}
          </span>
          {isAboveAverage && (
            <TrendingUp 
              style={{ 
                width: '12px', 
                height: '12px', 
                color: COLORS.accent,
                marginLeft: '4px',
                display: 'inline'
              }} 
            />
          )}
        </td>
        <td style={{
          padding: '0.75rem',
          textAlign: 'right',
          fontSize: '13px',
          fontWeight: '500',
          color: COLORS.primary
        }}>
          {formatCurrency(machine.revenue)}
        </td>
        <td style={{
          padding: '0.75rem',
          textAlign: 'right',
          fontSize: '13px',
          color: COLORS.gray
        }}>
          {formatCurrency(machine.avgRevenuePerUse)}
        </td>
        <td style={{
          padding: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            background: isAboveAverage ? '#f0fdf4' : '#fef2f2',
            color: isAboveAverage ? COLORS.accent : COLORS.red
          }}>
            {((machine.uses / avgUses - 1) * 100).toFixed(0) > 0 ? '+' : ''}{((machine.uses / avgUses - 1) * 100).toFixed(0)}%
          </div>
        </td>
      </tr>
    );
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
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Activity style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Performance por Máquina
          </h3>
        </div>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          Uso e receita individual (Semana Atual)
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          padding: '1rem',
          background: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #dbeafe'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: COLORS.gray,
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            letterSpacing: '0.5px'
          }}>
            Lavadoras ({washers.length})
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: COLORS.wash,
            marginBottom: '0.25rem'
          }}>
            {totalWashUses.toLocaleString('pt-BR')} usos
          </div>
          <div style={{ fontSize: '12px', color: COLORS.gray }}>
            {formatCurrency(totalWashRevenue)} • Média: {avgWashUses.toFixed(1)} usos
          </div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#fffbeb',
          borderRadius: '8px',
          border: '1px solid #fef3c7'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: COLORS.gray,
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            letterSpacing: '0.5px'
          }}>
            Secadoras ({dryers.length})
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: COLORS.dry,
            marginBottom: '0.25rem'
          }}>
            {totalDryUses.toLocaleString('pt-BR')} usos
          </div>
          <div style={{ fontSize: '12px', color: COLORS.gray }}>
            {formatCurrency(totalDryRevenue)} • Média: {avgDryUses.toFixed(1)} usos
          </div>
        </div>
      </div>

      {/* Washers Table */}
      {washers.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{
            fontSize: '13px',
            fontWeight: '600',
            color: COLORS.wash,
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Lavadoras
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid #e5e7eb',
                  background: '#f9fafb'
                }}>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: COLORS.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Máquina
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: COLORS.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Usos
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: COLORS.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Receita
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: COLORS.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    R$/Uso
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: COLORS.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    vs Média
                  </th>
                </tr>
              </thead>
              <tbody>
                {washers.map(machine => (
                  <MachineRow 
                    key={machine.name} 
                    machine={machine} 
                    avgUses={avgWashUses} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dryers Table */}
      {dryers.length > 0 && (
        <div>
          <h4 style={{
            fontSize: '13px',
            fontWeight: '600',
            color: COLORS.dry,
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Secadoras
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid #e5e7eb',
                  background: '#f9fafb'
                }}>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: COLORS.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Máquina
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: COLORS.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Usos
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: COLORS.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Receita
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: COLORS.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    R$/Uso
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: COLORS.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    vs Média
                  </th>
                </tr>
              </thead>
              <tbody>
                {dryers.map(machine => (
                  <MachineRow 
                    key={machine.name} 
                    machine={machine} 
                    avgUses={avgDryUses} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insight */}
      <div style={{
        marginTop: '1.5rem',
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '12px',
        color: COLORS.gray
      }}>
        💡 <strong>Manutenção:</strong> Máquinas acima da média podem precisar de revisão mais frequente. 
        Máquinas abaixo da média podem ter problemas técnicos ou posicionamento ruim.
      </div>
    </div>
  );
};

export default MachinePerformanceTable;
