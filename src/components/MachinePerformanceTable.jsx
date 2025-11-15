//MACHINE PERFORMANCE TABLE V3.0
// ✅ Uses centralized date filtering (no individual dropdown)
//
// CHANGELOG:
// v3.0 (2025-11-15): Unified date filtering
//   - Removed individual period dropdown
//   - Now receives dateFilter and dateWindow props from parent
//   - Displays explicit date range in subtitle
//   - Removed periodLabels object (no longer needed)
//   - Synchronized with Operations tab DateRangeSelector
// v2.0 (Previous): Added revenue breakdown display
// v1.0 (Previous): Initial implementation with local period control

import React, { useEffect } from 'react';
import { Droplet, Activity, TrendingUp, Info, DollarSign } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  wash: '#3b82f6',
  dry: '#f59e0b',
  gray: '#6b7280',
  info: '#3b82f6',
  red: '#dc2626',
  amber: '#f59e0b'
};

const MachinePerformanceTable = ({ machinePerformance, dateFilter = 'currentWeek', dateWindow, revenueBreakdown }) => {
  useEffect(() => {
    console.log('🎯 MachinePerformanceTable received:', { 
      dateFilter, 
      machines: machinePerformance?.length,
      revenueBreakdown 
    });
  }, [dateFilter, machinePerformance, revenueBreakdown]);

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

  // CLIENT-SIDE FILTERING: Exclude "Recarga" as backup
  const filteredMachines = machinePerformance.filter(m => {
    const nameLower = (m.name || '').toLowerCase();
    return !nameLower.includes('recarga');
  });

  // Separate washers and dryers
  const washers = filteredMachines.filter(m => m.type === 'wash');
  const dryers = filteredMachines.filter(m => m.type === 'dry');

  // Calculate totals
  const totalWashUses = washers.reduce((sum, m) => sum + m.uses, 0);
  const totalDryUses = dryers.reduce((sum, m) => sum + m.uses, 0);
  const totalWashRevenue = washers.reduce((sum, m) => sum + m.revenue, 0);
  const totalDryRevenue = dryers.reduce((sum, m) => sum + m.revenue, 0);
  const totalMachineRevenue = totalWashRevenue + totalDryRevenue;

  const avgWashUses = washers.length > 0 ? totalWashUses / washers.length : 0;
  const avgDryUses = dryers.length > 0 ? totalDryUses / dryers.length : 0;

  const MachineRow = ({ machine, avgUses }) => {
    const isAboveAverage = machine.uses >= avgUses;
    const percentDiff = avgUses > 0 ? ((machine.uses / avgUses - 1) * 100) : 0;
    
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
            background: percentDiff >= 0 ? '#f0fdf4' : '#fef2f2',
            color: percentDiff >= 0 ? COLORS.accent : COLORS.red
          }}>
            {percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(0)}%
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
      {/* Header with Date Range Display */}
      <div style={{ 
        marginBottom: '1.5rem'
      }}>
        <div>
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
            Período: {dateWindow?.dateRange || 'Carregando...'}
          </p>
        </div>
      </div>

      {/* Column Explanation Panel */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <Info style={{ width: '16px', height: '16px', color: COLORS.info }} />
          <h4 style={{ 
            fontSize: '13px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Como Interpretar
          </h4>
        </div>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          fontSize: '12px',
          color: COLORS.gray
        }}>
          <div>
            <strong style={{ color: COLORS.primary }}>USOS:</strong> Quantas vezes a máquina foi usada (inclui uso com crédito).
          </div>
          <div>
            <strong style={{ color: COLORS.primary }}>RECEITA:</strong> Total arrecadado por esta máquina (R$).
          </div>
          <div>
            <strong style={{ color: COLORS.primary }}>R$/USO:</strong> Receita média por uso (Receita ÷ Usos). Identifica máquinas que geram mais valor.
          </div>
          <div>
            <strong style={{ color: COLORS.primary }}>VS MÉDIA:</strong> Comparação com a média de usos do seu tipo (lavadora ou secadora).
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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

      {/* Revenue Reconciliation Summary */}
      {revenueBreakdown && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #dcfce7'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <DollarSign style={{ width: '16px', height: '16px', color: COLORS.accent }} />
            <h4 style={{ 
              fontSize: '13px',
              fontWeight: '600',
              color: COLORS.primary,
              margin: 0
            }}>
              Reconciliação de Receita - {dateWindow?.label || 'Carregando...'}
            </h4>
          </div>
          
          <div style={{ 
            fontSize: '13px', 
            color: COLORS.gray,
            lineHeight: '1.8'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Receita de Máquinas (atribuída na tabela acima):</span>
              <strong style={{ color: COLORS.primary }}>{formatCurrency(totalMachineRevenue)}</strong>
            </div>
            
            {revenueBreakdown.recargaRevenue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Venda de Créditos (Recarga - não atribuída):</span>
                <strong style={{ color: COLORS.amber }}>+ {formatCurrency(revenueBreakdown.recargaRevenue)}</strong>
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              paddingTop: '0.5rem',
              borderTop: '2px solid #dcfce7',
              marginTop: '0.5rem'
            }}>
              <span style={{ fontWeight: '600' }}>Receita Total do Período:</span>
              <strong style={{ color: COLORS.accent, fontSize: '16px' }}>
                {formatCurrency(revenueBreakdown.totalRevenue)}
              </strong>
            </div>
          </div>
          
          {revenueBreakdown.recargaRevenue > 0 && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              background: '#fefce8',
              borderRadius: '6px',
              fontSize: '11px',
              color: COLORS.gray
            }}>
              💡 <strong>Nota:</strong> Receita de créditos não aparece na tabela por máquina, pois representa prepagamento para uso futuro.
            </div>
          )}
        </div>
      )}

      {/* Maintenance Insight */}
      <div style={{
        marginTop: '1.5rem',
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '12px',
        color: COLORS.gray
      }}>
        💡 <strong>Manutenção:</strong> Máquinas acima da média podem precisar de revisões mais frequentes. 
        Máquinas abaixo da média podem ter problemas técnicos ou um posicionamento ruim.
      </div>
    </div>
  );
};

export default MachinePerformanceTable;
