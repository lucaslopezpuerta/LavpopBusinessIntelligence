// App.jsx v2.0 - REDESIGNED HEADER
// ✅ Sleek, compact header with better logo integration
// ✅ Modern tab design with brand colors
// ✅ Space-efficient layout
//
// CHANGELOG:
// v2.0 (2025-11-15): Complete header redesign

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, TrendingUp, Settings } from 'lucide-react';
import { loadAllData } from './utils/csvLoader';
import { calculateBusinessMetrics } from './utils/businessMetrics';
import { calculateCustomerMetrics } from './utils/customerMetrics';
import KPICards from './components/KPICards';
import Logo from './assets/Logo1.png';
import './App.css';

// Import views
import Dashboard from './views/Dashboard';
import Customers from './views/Customers';
import Operations from './views/Operations';

const Analytics = ({ data }) => (
  <div className="view-container">
    <h2>Analytics</h2>
    <p>Deep dive analytics coming soon...</p>
  </div>
);

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280'
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 7, percent: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const loadedData = await loadAllData((progress) => {
          setLoadProgress(progress);
        });
        setData(loadedData);
        setError(null);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, component: Dashboard },
    { id: 'customers', label: 'Clientes', icon: Users, component: Customers },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, component: Analytics },
    { id: 'operations', label: 'Operações', icon: Settings, component: Operations }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);
  const ActiveComponent = activeTabData?.component || Dashboard;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="lavpop-logo">
            <div className="logo-circle" style={{ background: COLORS.primary }}>L</div>
          </div>
          <h2>Carregando Lavpop BI</h2>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${loadProgress.percent}%`,
                background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`
              }}
            />
          </div>
          <p>{loadProgress.loaded} de {loadProgress.total} arquivos carregados ({loadProgress.percent}%)</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <h2>Erro ao carregar dados</h2>
          <div className="error-details">
            <p><strong>Detalhes do erro:</strong></p>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '1rem', 
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '12px',
              overflow: 'auto',
              maxWidth: '600px',
              margin: '1rem auto',
              color: '#dc2626'
            }}>
              {error}
            </pre>
            <div style={{ 
              marginTop: '1.5rem', 
              color: '#6b7280', 
              fontSize: '14px',
              textAlign: 'left',
              maxWidth: '600px',
              margin: '1rem auto',
              background: '#fef3c7',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid #f59e0b'
            }}>
              <p style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>
                Possíveis causas:
              </p>
              <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
                <li>Arquivos CSV ausentes em <code>/public/data/</code></li>
                <li>Workflow de fetch não executou corretamente</li>
                <li>Formato de arquivo CSV incorreto</li>
                <li>Caminho base do GitHub Pages não configurado</li>
              </ul>
              <p style={{ marginTop: '1rem', fontWeight: 'bold', color: '#92400e' }}>
                Como resolver:
              </p>
              <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
                <li>Verifique se os arquivos existem no repositório</li>
                <li>Execute manualmente o workflow "Fetch Google Sheets Data"</li>
                <li>Verifique o console do navegador (F12) para mais detalhes</li>
              </ul>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 2rem',
              background: COLORS.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={{ 
      minHeight: '100vh',
      background: '#f9fafb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* REDESIGNED HEADER */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem'
        }}>
          {/* Logo Section - Compact & Elegant */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem'
          }}>
            <img 
              src={Logo} 
              alt="Lavpop Logo" 
              style={{
                height: '42px',
                width: 'auto',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div>
              <h1 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: COLORS.primary,
                margin: 0,
                lineHeight: '1.2',
                letterSpacing: '-0.5px'
              }}>
                Lavpop
              </h1>
              <span style={{
                fontSize: '11px',
                color: COLORS.gray,
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Business Intelligence
              </span>
            </div>
          </div>
          
          {/* Modern Tab Navigation */}
          <nav style={{
            display: 'flex',
            gap: '0.5rem',
            background: '#f9fafb',
            padding: '0.35rem',
            borderRadius: '10px',
            border: '1px solid #e5e7eb'
          }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '7px',
                    border: 'none',
                    background: isActive ? 'white' : 'transparent',
                    color: isActive ? COLORS.primary : COLORS.gray,
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <ActiveComponent data={data} onNavigate={setActiveTab} />
      </main>
    </div>
  );
}

export default App;
