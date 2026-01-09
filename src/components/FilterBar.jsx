// FilterBar.jsx v2.5 - FOCUS RING STANDARDIZATION
// Modern filter interface matching Design System
//
// CHANGELOG:
// v2.5 (2026-01-07): Standardized focus rings for accessibility
//   - Changed all focus: to focus-visible: for better keyboard UX
//   - Increased focus ring visibility (was 20%, now proper ring)
//   - Added focus rings to all buttons (clear, toggle, export)
// v2.4 (2025-12-13): Exclude contacted toggle
//   - NEW: "Excluir Contactados" toggle pill to hide already-contacted customers
//   - Integrates with contact tracking system
//   - Helps prioritize outreach to uncontacted customers
// v2.3 (2025-12-01): Removed sticky behavior
//   - FilterBar no longer sticks to top when scrolling
//   - Prevents conflict with CustomerSectionNavigation
// v2.2 (2025-11-30): Accessibility improvements
//   - Added aria-label to all select elements
//   - Added aria-label to search input
// v2.1 (2025-11-29): Design System v3.0 compliance
//   - Removed emojis from risk level select options
// v2.0 (2025-11-26): Redesign per Design System
//   - NEW: "Clear Filters" button
//   - STYLE: Updated inputs and selects to match dark mode system
//   - LAYOUT: Improved mobile responsiveness with flex-wrap
//   - UI: Consistent rounded corners and borders
// v1.0 (2025-11-23): Initial implementation

import React from 'react';
import { Search, Download, ChevronDown, X, Filter, UserX } from 'lucide-react';

const FilterBar = ({
    searchTerm,
    setSearchTerm,
    selectedSegment,
    setSelectedSegment,
    selectedRisk,
    setSelectedRisk,
    sortBy,
    setSortBy,
    segments,
    onExport,
    totalResults,
    // New: Exclude contacted filter
    excludeContacted = false,
    setExcludeContacted,
    contactedCount = 0
}) => {
    // Check if any filter is active
    const hasActiveFilters = searchTerm || selectedSegment !== 'all' || selectedRisk !== 'all' || excludeContacted;

    // Clear all filters
    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedSegment('all');
        setSelectedRisk('all');
        if (setExcludeContacted) setExcludeContacted(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-4 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

                {/* Left: Search & Count */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto flex-1">
                    <div className="relative w-full lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar cliente, telefone ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Buscar cliente por nome, telefone ou CPF"
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-all shadow-sm"
                        />
                    </div>

                    <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300">
                            {totalResults}
                        </span>
                        Clientes
                    </div>
                </div>

                {/* Right: Filters & Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">

                    {/* Mobile Filter Icon (Visual only) */}
                    <div className="lg:hidden flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mr-auto">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </div>

                    {/* Segment Filter */}
                    <div className="relative group flex-1 sm:flex-none min-w-[140px]">
                        <select
                            value={selectedSegment}
                            onChange={(e) => setSelectedSegment(e.target.value)}
                            aria-label="Filtrar por segmento de cliente"
                            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-lavpop-blue dark:hover:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 cursor-pointer transition-all shadow-sm"
                        >
                            <option value="all">Todos Segmentos</option>
                            {segments.filter(s => s !== 'all').map(seg => (
                                <option key={seg} value={seg}>{seg}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Risk Filter */}
                    <div className="relative group flex-1 sm:flex-none min-w-[140px]">
                        <select
                            value={selectedRisk}
                            onChange={(e) => setSelectedRisk(e.target.value)}
                            aria-label="Filtrar por nível de risco"
                            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-lavpop-blue dark:hover:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 cursor-pointer transition-all shadow-sm"
                        >
                            <option value="all">Todos Riscos</option>
                            <option value="Healthy">Saudável</option>
                            <option value="Monitor">Monitorar</option>
                            <option value="At Risk">Em Risco</option>
                            <option value="Churning">Crítico</option>
                            <option value="New Customer">Novo</option>
                            <option value="Lost">Perdido</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Exclude Contacted Toggle */}
                    {setExcludeContacted && (
                        <button
                            onClick={() => setExcludeContacted(!excludeContacted)}
                            aria-label={excludeContacted ? "Mostrar todos os clientes" : "Excluir clientes já contactados"}
                            aria-pressed={excludeContacted}
                            className={`
                                flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
                                ${excludeContacted
                                    ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                                }
                            `}
                            title={excludeContacted ? `Mostrando apenas não contactados (${contactedCount} ocultos)` : "Excluir clientes já contactados"}
                        >
                            <UserX className="w-4 h-4" />
                            <span className="hidden sm:inline">
                                {excludeContacted ? 'Sem Contato' : 'Excluir Contactados'}
                            </span>
                            {excludeContacted && contactedCount > 0 && (
                                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                    -{contactedCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* Sort */}
                    <div className="relative group flex-1 sm:flex-none min-w-[140px]">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            aria-label="Ordenar resultados por"
                            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-lavpop-blue dark:hover:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 cursor-pointer transition-all shadow-sm"
                        >
                            <option value="spending">Maior Gasto</option>
                            <option value="visits">Mais Visitas</option>
                            <option value="lastVisit">Recentes</option>
                            <option value="risk">Maior Risco</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center justify-center p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                            title="Limpar Filtros"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}

                    {/* Export Button */}
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-lavpop-green hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 ml-auto sm:ml-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
