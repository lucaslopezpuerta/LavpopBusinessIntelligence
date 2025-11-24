// Customers View v2.0.1 - CUSTOMER INTELLIGENCE HUB
// Complete redesign from card-based list to Intelligence Hub
// 
// CHANGELOG:
// v2.0.1 (2025-11-24): Fixed RFM data loading
//   - FIX: Properly extract data.sales and data.rfm from data object
//   - FIX: Pass rfm data to calculateCustomerMetrics
// v2.0 (2025-11-23): Customer Intelligence Hub Implementation
//   - NEW: Intelligence Dashboard with 4 analytics components
//     * Retention Pulse (CustomerRetentionScore)
//     * Risk Map (RFMScatterPlot)
//     * Danger Zone (ChurnHistogram)
//     * Acquisition Context (NewClientsChart)
//   - NEW: Premium CustomerCard component with dot-style risk badges
//   - NEW: Glassmorphic FilterBar with enhanced UX
//   - REFACTOR: Complete Tailwind CSS migration
//   - UI: Responsive grid layout + dark mode support

import React, { useState, useMemo } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { calculateCustomerMetrics, getRFMCoordinates, getChurnHistogramData, getRetentionCohorts, getAcquisitionTrend } from '../utils/customerMetrics';
import CustomerDetailModal from '../components/CustomerDetailModal';
import CustomerRetentionScore from '../components/CustomerRetentionScore';
import RFMScatterPlot from '../components/RFMScatterPlot';
import ChurnHistogram from '../components/ChurnHistogram';
import NewClientsChart from '../components/NewClientsChart';
import CustomerCard from '../components/CustomerCard';
import FilterBar from '../components/FilterBar';

const Customers = ({ data }) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [sortBy, setSortBy] = useState('spending');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // 1. Calculate Base Metrics
  const metrics = useMemo(() => {
    if (!data || !data.sales || data.sales.length === 0) return null;
    // Pass both sales and rfm data to calculateCustomerMetrics
    return calculateCustomerMetrics(data.sales, data.rfm || []);
  }, [data]);

  // 2. Prepare Intelligence Data
  const intelligence = useMemo(() => {
    if (!metrics) return null;
    return {
      rfm: getRFMCoordinates(metrics.activeCustomers),
      histogram: getChurnHistogramData(metrics.activeCustomers),
      retention: getRetentionCohorts(data.sales),
      acquisition: getAcquisitionTrend(metrics.activeCustomers)
    };
  }, [metrics, data]);

  // 3. Filter & Sort Customers
  const filteredCustomers = useMemo(() => {
    if (!metrics) return [];

    let result = metrics.activeCustomers;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term)) ||
        c.doc.includes(term)
      );
    }

    // Segment Filter
    if (selectedSegment !== 'all') {
      result = result.filter(c => c.segment === selectedSegment);
    }

    // Risk Filter
    if (selectedRisk !== 'all') {
      result = result.filter(c => c.riskLevel === selectedRisk);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'spending': return b.netTotal - a.netTotal;
        case 'visits': return b.transactions - a.transactions;
        case 'lastVisit': return b.lastVisit - a.lastVisit;
        case 'risk':
          const riskOrder = { 'Churning': 4, 'At Risk': 3, 'Monitor': 2, 'Healthy': 1, 'New Customer': 0 };
          return (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
        default: return 0;
      }
    });

    return result;
  }, [metrics, searchTerm, selectedSegment, selectedRisk, sortBy]);

  // Get unique segments for filter
  const segments = useMemo(() => {
    if (!metrics) return [];
    const segs = new Set(metrics.activeCustomers.map(c => c.segment));
    return ['all', ...Array.from(segs)];
  }, [metrics]);

  // Export Handler
  const handleExport = () => {
    if (!filteredCustomers.length) return;

    const headers = ['Nome', 'Telefone', 'Segmento', 'Risco', 'Gasto Total', 'Visitas', 'Última Visita'];
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(c => [
        `"${c.name}"`,
        c.phone || '',
        c.segment,
        c.riskLevel,
        c.netTotal.toFixed(2),
        c.transactions,
        c.lastVisit ? c.lastVisit.toLocaleDateString('pt-BR') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'clientes_lavpop.csv';
    link.click();
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavpop-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Hub de Inteligência de Clientes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Visão 360º da sua base de clientes
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <UsersIcon className="w-5 h-5 text-lavpop-blue" />
          <span className="text-2xl font-black text-slate-800 dark:text-white">{metrics.activeCount}</span>
          <span className="text-xs font-bold text-slate-400 uppercase">Clientes Ativos</span>
        </div>
      </div>

      {/* Intelligence Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Row 1: Retention & Risk Map */}
        <div className="h-full">
          <CustomerRetentionScore data={intelligence.retention} />
        </div>
        <div className="h-full">
          <RFMScatterPlot data={intelligence.rfm} />
        </div>

        {/* Row 2: Behavioral Patterns */}
        <div className="h-full">
          <ChurnHistogram data={intelligence.histogram} />
        </div>
        <div className="h-full">
          <NewClientsChart data={intelligence.acquisition} />
        </div>
      </div>

      {/* Customer Directory */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 bg-lavpop-blue rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Diretório de Clientes</h2>
        </div>

        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedSegment={selectedSegment}
          setSelectedSegment={setSelectedSegment}
          selectedRisk={selectedRisk}
          setSelectedRisk={setSelectedRisk}
          sortBy={sortBy}
          setSortBy={setSortBy}
          segments={segments}
          onExport={handleExport}
          totalResults={filteredCustomers.length}
        />

        {filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCustomers.slice(0, 100).map(customer => (
              <CustomerCard
                key={customer.doc}
                customer={customer}
                onClick={() => setSelectedCustomer(customer)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <UsersIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Nenhum cliente encontrado</h3>
            <p className="text-slate-400 dark:text-slate-500">Tente ajustar seus filtros de busca</p>
          </div>
        )}

        {filteredCustomers.length > 100 && (
          <div className="text-center py-4 text-slate-400 text-sm">
            Mostrando 100 de {filteredCustomers.length} clientes. Use a busca para encontrar mais.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

export default Customers;
