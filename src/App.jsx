import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, TrendingUp, Settings } from 'lucide-react';
import { loadAllData } from './utils/csvLoader';
import { calculateBusinessMetrics } from './utils/businessMetrics';
import { calculateCustomerMetrics } from './utils/customerMetrics';
import KPICards from './components/KPICards';
import './App.css';

// Import views
import DashboardV2 from './views/Dashboard';
import Customers from './views/Customers';

const Analytics = ({ data }) => (
  <div className="view-container">
    <h2>Analytics</h2>
    <p>Deep dive analytics coming soon...</p>
  </div>
);

const Operations = ({ data }) => (
  <div className="view-container">
    <h2>Operations</h2>
    <p>Machine efficiency analysis coming soon...</p>
  </div>
);

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
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, component: DashboardV2 },
    { id: 'customers', label: 'Clientes', icon: Users, component: Customers },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, component: Analytics },
    { id: 'operations', label: 'Operações', icon: Settings, component: Operations }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);
  const ActiveComponent = activeTabData?.component || DashboardV2;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="lavpop-logo">
            <div className="logo-circle" style={{ background: '#10306B' }}>L</div>
          </div>
          <h2>Carregando Lavpop BI</h2>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${loadProgress.percent}%` }}
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
              background: '#10306B',
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
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            {/* Use Logo 1 from assets */}
            <img 
              src="src/assets/Logo1.png" 
              alt="Lavpop Logo" 
              className="logo-image"
              onError={(e) => {
                // Fallback if logo doesn't load
                e.target.style.display = 'none';
                console.error('Logo failed to load');
              }}
            />
            <div className="logo-text">
              <h1>Lavpop</h1>
              <span>Business Intelligence</span>
            </div>
          </div>
          
          <nav className="tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">
        <ActiveComponent data={data} onNavigate={setActiveTab} />
      </main>
    </div>
  );
}

export default App;
