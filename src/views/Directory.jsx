// Directory.jsx v1.2 - PROPER LOADING SKELETON
// Dedicated view for browsing and searching customers
// Extracted from Customers.jsx for better separation of concerns
//
// CHANGELOG:
// v1.2 (2025-12-23): Fixed empty tab rendering
//   - Replaced tiny spinner with DirectoryLoadingSkeleton
//   - Prevents "empty tab" appearance during data loading
// v1.1 (2025-12-16): Full-width layout
//   - REMOVED: Redundant padding (now uses App.jsx padding)
//   - REMOVED: max-w-[1600px] constraint for full-width
//   - Consistent with Dashboard.jsx layout pattern
// v1.0 (2025-12-16): Initial implementation
//   - Extracted from Customers.jsx (was Section 4: Diretório)
//   - Dedicated route in App.jsx
//   - Full-screen customer browsing experience
//   - Enhanced search with instant filtering
//   - CustomerProfileModal integration

import React, { useState, useMemo, Suspense, lazy } from 'react';
import { Search, Users as UsersIcon, Download, Filter, SlidersHorizontal } from 'lucide-react';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import CustomerCard from '../components/CustomerCard';
import FilterBar from '../components/FilterBar';
import { useContactTracking } from '../hooks/useContactTracking';
import { DirectoryLoadingSkeleton } from '../components/ui/Skeleton';

// Lazy-load heavy modals
const CustomerProfileModal = lazy(() => import('../components/CustomerProfileModal'));

const Directory = ({ data }) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [sortBy, setSortBy] = useState('spending');
  const [excludeContacted, setExcludeContacted] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Contact tracking
  const { contactedIds } = useContactTracking();

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data || !data.sales || data.sales.length === 0) return null;
    return calculateCustomerMetrics(data.sales, data.rfm || [], data.customer || []);
  }, [data]);

  // Filter & Sort Customers
  const { filteredCustomers, contactedInResults } = useMemo(() => {
    if (!metrics) return { filteredCustomers: [], contactedInResults: 0 };

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

    // Risk Filter
    if (selectedRisk !== 'all') {
      result = result.filter(c => c.riskLevel === selectedRisk);
    }

    // Count contacted in current results (before excluding)
    const contacted = result.filter(c => contactedIds.has(String(c.doc))).length;

    // Exclude Contacted Filter
    if (excludeContacted) {
      result = result.filter(c => !contactedIds.has(String(c.doc)));
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
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR');
        default: return 0;
      }
    });

    return { filteredCustomers: result, contactedInResults: contacted };
  }, [metrics, searchTerm, selectedSegment, selectedRisk, sortBy, excludeContacted, contactedIds]);

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
  }, [searchTerm, selectedSegment, selectedRisk, sortBy, excludeContacted]);

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
    return <DirectoryLoadingSkeleton />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-l-4 border-blue-500">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Diretório
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {metrics.allCustomers.length} clientes cadastrados
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <UsersIcon className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {filteredCustomers.length} encontrados
            </span>
          </div>
          {contactedInResults > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {contactedInResults} contactados
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
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
            excludeContacted={excludeContacted}
            setExcludeContacted={setExcludeContacted}
            contactedCount={contactedInResults}
          />
        </div>

        {/* Customer Grid */}
        <div className="p-4 sm:p-6">
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
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <CustomerProfileModal
            customer={selectedCustomer}
            sales={data.sales}
            onClose={() => setSelectedCustomer(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Directory;
