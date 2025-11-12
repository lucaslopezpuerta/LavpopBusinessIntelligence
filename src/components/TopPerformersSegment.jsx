import React from 'react';
import { Crown, Heart, TrendingUp, Award } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  amber: '#f59e0b',
  gray: '#6b7280'
};

const TopPerformersSegment = ({ customerMetrics }) => {
  if (!customerMetrics || !customerMetrics.activeCustomers) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Loading top performers...
      </div>
    );
  }

  const segments = [
    {
      name: 'Champion',
      icon: Crown,
      color: '#eab308',
      bgColor: '#fef3c7',
      description: 'Best customers'
    },
    {
      name: 'Loyal',
      icon: Heart,
      color: '#dc2626',
      bgColor: '#fee2e2',
      description: 'Regular visitors'
    },
    {
      name: 'Potential',
      icon: TrendingUp,
      color: '#10306B',
      bgColor: '#e3f2fd',
      description: 'Growing customers'
    }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTopCustomersBySegment = (segmentName, limit = 5) => {
    return customerMetrics.activeCustomers
      .filter(c => c.segment === segmentName)
      .sort((a, b) => b.netTotal - a.netTotal)
      .slice(0, limit);
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
          <Award style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Top Performers by Segment
          </h3>
        </div>
        <p style={{
          fontSize: '13px',
          color: COLORS.gray,
          margin: 0
        }}>
          Top 5 customers in each key segment
        </p>
      </div>

      {/* Segments Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        {segments.map((segment) => {
          const Icon = segment.icon;
          const topCustomers = getTopCustomersBySegment(segment.name);
          
          return (
            <div 
              key={segment.name}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '1rem',
                background: '#fafafa'
              }}
            >
              {/* Segment Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid #e5e7eb'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: segment.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon style={{ width: '18px', height: '18px', color: segment.color }} />
                </div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: COLORS.primary
                  }}>
                    {segment.name}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: COLORS.gray
                  }}>
                    {segment.description}
                  </div>
                </div>
              </div>

              {/* Customer List */}
              {topCustomers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {topCustomers.map((customer, index) => (
                    <div 
                      key={customer.doc || index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.25rem'
                        }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: index === 0 ? segment.bgColor : '#f3f4f6',
                            color: index === 0 ? segment.color : COLORS.gray,
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {index + 1}
                          </span>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: COLORS.primary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {customer.name}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: COLORS.gray,
                          marginLeft: '28px'
                        }}>
                          {customer.transactions} visits • {customer.totalServices} services
                        </div>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: segment.color,
                        marginLeft: '1rem',
                        flexShrink: 0
                      }}>
                        {formatCurrency(customer.netTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  color: COLORS.gray,
                  fontSize: '13px'
                }}>
                  No customers in this segment
                </div>
              )}

              {/* Segment Total */}
              {topCustomers.length > 0 && (
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: COLORS.gray,
                    fontWeight: '500'
                  }}>
                    Top 5 Total:
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: COLORS.primary
                  }}>
                    {formatCurrency(
                      topCustomers.reduce((sum, c) => sum + c.netTotal, 0)
                    )}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopPerformersSegment;
