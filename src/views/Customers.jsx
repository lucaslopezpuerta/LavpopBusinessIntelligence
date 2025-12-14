// Customers View v2.8.0 - UNIFIED HEADER
// Complete redesign from card-based list to Intelligence Hub
//
// CHANGELOG:
// v2.8.0 (2025-12-02): Unified header design
//   - Added icon box with left border accent (purple)
//   - Consistent styling across all app views
//   - Simplified title to "Clientes"
// v2.7.1 (2025-12-01): Directory container background fix
//   - Reverted to bg-white (was bg-slate-50 which matched app shell)
//   - Maintains proper visual separation from page background
// v2.7.0 (2025-12-01): UX improvements
//   - Fixed Em Risco card to use needsAttentionCount (At Risk + Churning)
//   - Added background container to Directory section
//   - Consistent visual styling with other sections
// v2.6.0 (2025-12-01): Section navigation and semantic structure
//   - Added CustomerSectionNavigation sticky bar
//   - Named sections: Resumo, Ação Imediata, Análise, Diretório
//   - Semantic <section> elements with proper headings
//   - Improved UX with quick section jumps
// v2.5.0 (2025-12-01): Added At-Risk Customers Table
//   - Moved AtRiskCustomersTable from Dashboard
//   - Added after KPI cards for quick action on at-risk customers
//   - Includes shared contact tracking for app-wide sync
// v2.4.0 (2025-12-01): Fixed New Clients calculation
//   - Now calculates based on first visit date within last 30 days
//   - Subtitle shows "Últimos 30 dias" for clarity
// v2.3.0 (2025-12-01): Customer KPI cards added
//   - Added KPI cards section with New Clients, Active, At Risk, Health Rate
//   - Cards relocated from Dashboard KPICardsGrid
//   - Uses SecondaryKPICard for visual consistency
// v2.2.0 (2025-11-24): New Customer Profile Modal
//   - NEW: CustomerProfileModal with 4 tabs and communication logging
//   - ENHANCED: CustomerCard v3.0 with all personal info and wallet balance
//   - SEPARATE: Dashboard uses CustomerDetailModal, Customer Directory uses CustomerProfileModal
// v2.1.0 (2025-11-24): Pagination & Portuguese translations
// v2.0.1 (2025-11-24): Fixed RFM data loading
// v2.0 (2025-11-23): Customer Intelligence Hub Implementation

import React, { useState, useMemo, Suspense } from 'react';
import { Users as UsersIcon, UserPlus, AlertTriangle, Heart, BarChart3, LayoutGrid } from 'lucide-react';
import { calculateCustomerMetrics, getRFMCoordinates, getChurnHistogramData, getRetentionCohorts, getAcquisitionTrend } from '../utils/customerMetrics';
import SecondaryKPICard from '../components/ui/SecondaryKPICard';
import { formatNumber, formatPercent } from '../utils/formatters';
import CustomerProfileModal from '../components/CustomerProfileModal';
import CustomerRetentionScore from '../components/CustomerRetentionScore';
import CustomerCard from '../components/CustomerCard';
import FilterBar from '../components/FilterBar';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import CustomerSectionNavigation from '../components/customers/CustomerSectionNavigation';
import { LazyRFMScatterPlot, LazyChurnHistogram, LazyNewClientsChart, ChartLoadingFallback } from '../utils/lazyCharts';

const Customers = ({ data }) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [sortBy, setSortBy] = useState('spending');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // 1. Calculate Base Metrics
  const metrics = useMemo(() => {
    if (!data || !data.sales || data.sales.length === 0) return null;
    return calculateCustomerMetrics(data.sales, data.rfm || [], data.customer || []);
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

  // 3. Calculate New Clients (last 30 days based on first visit)
  const newClientsCount = useMemo(() => {
    if (!metrics?.activeCustomers) return 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return metrics.activeCustomers.filter(c => {
      if (!c.firstVisit) return false;
      return c.firstVisit >= thirtyDaysAgo;
    }).length;
  }, [metrics]);

  // 3. Filter & Sort Customers
  const filteredCustomers = useMemo(() => {
    if (!metrics) return [];

    // ✅ FIX: Show ALL customers (including Lost), not just active
    // IMPORTANT: Spread operator creates new array so React detects sort changes
    let result = [...metrics.allCustomers];

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

    // Risk Filter - ✅ VERIFIED: This works correctly
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
          const riskOrder = { 'Churning': 4, 'At Risk': 3, 'Monitor': 2, 'Healthy': 1, 'New Customer': 0, 'Lost': -1 };
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

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSegment, selectedRisk, sortBy]);

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
    <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fade-in">

      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border-l-4 border-purple-500">
          <UsersIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Clientes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visão 360º da sua base de clientes
          </p>
        </div>
      </header>

      {/* Section Navigation - Sticky */}
      <CustomerSectionNavigation hasAtRisk={metrics.needsAttentionCount > 0} />

      {/* Section 1: Resumo - KPI Cards */}
      <section id="resumo-section" aria-labelledby="resumo-heading">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-lavpop-blue/10 dark:bg-lavpop-blue/20 flex items-center justify-center border-l-4 border-lavpop-blue">
            <LayoutGrid className="w-5 h-5 text-lavpop-blue" />
          </div>
          <div>
            <h2 id="resumo-heading" className="text-base font-bold text-slate-900 dark:text-white">
              Resumo de Clientes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visão geral da base de clientes
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SecondaryKPICard
            title="Novos Clientes"
            displayValue={formatNumber(newClientsCount)}
            subtitle="Últimos 30 dias"
            icon={UserPlus}
            color="purple"
          />
          <SecondaryKPICard
            title="Clientes Ativos"
            displayValue={formatNumber(metrics.activeCount)}
            subtitle="Não perdidos"
            icon={UsersIcon}
            color="blue"
          />
          <SecondaryKPICard
            title="Em Risco"
            displayValue={formatNumber(metrics.needsAttentionCount)}
            subtitle="Risco + Crítico"
            icon={AlertTriangle}
            color="red"
          />
          <SecondaryKPICard
            title="Taxa de Saúde"
            displayValue={formatPercent(metrics.healthRate)}
            subtitle="Clientes saudáveis"
            icon={Heart}
            color="green"
          />
        </div>
      </section>

      {/* Section 2: Ação Imediata - At-Risk Customers */}
      {metrics.needsAttentionCount > 0 && (
        <section id="acao-section" aria-labelledby="acao-heading">
          <h2 id="acao-heading" className="sr-only">Ação Imediata - Clientes em Risco</h2>
          <AtRiskCustomersTable
            customerMetrics={metrics}
            salesData={data.sales}
            maxRows={5}
          />
        </section>
      )}

      {/* Section 3: Análise - Intelligence Dashboard */}
      <section id="analise-section" aria-labelledby="analise-heading">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border-l-4 border-purple-500">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 id="analise-heading" className="text-base font-bold text-slate-900 dark:text-white">
              Análise Comportamental
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Retenção, segmentação e tendências de aquisição
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-full">
            <CustomerRetentionScore data={intelligence.retention} />
          </div>
          <div className="h-full">
            <Suspense fallback={<ChartLoadingFallback height="h-80" />}>
              <LazyRFMScatterPlot data={intelligence.rfm} />
            </Suspense>
          </div>
          <div className="h-full">
            <Suspense fallback={<ChartLoadingFallback height="h-64" />}>
              <LazyChurnHistogram data={intelligence.histogram} />
            </Suspense>
          </div>
          <div className="h-full">
            <Suspense fallback={<ChartLoadingFallback height="h-64" />}>
              <LazyNewClientsChart data={intelligence.acquisition} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Section 4: Diretório - Customer Directory */}
      <section id="diretorio-section" aria-labelledby="diretorio-heading">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-l-4 border-blue-500">
            <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 id="diretorio-heading" className="text-base font-bold text-slate-900 dark:text-white">
              Diretório de Clientes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredCustomers.length} clientes encontrados
            </p>
          </div>
        </div>

        {/* Directory Content Container */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedCustomers.map(customer => (
                <CustomerCard
                  key={customer.doc}
                  customer={customer}
                  onClick={() => setSelectedCustomer(customer)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Mostrar:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-lavpop-blue/20"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-slate-600 dark:text-slate-400">por página</span>
                </div>

                {/* Page info */}
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} de {filteredCustomers.length} clientes
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${currentPage === pageNum
                            ? 'bg-lavpop-blue text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <UsersIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Nenhum cliente encontrado</h3>
            <p className="text-slate-400 dark:text-slate-500">Tente ajustar seus filtros de busca</p>
          </div>
        )}
        </div>
      </section>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <CustomerProfileModal
          customer={selectedCustomer}
          sales={data.sales}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

export default Customers;
