// FilterBar.jsx v2.0 - REDESIGNED & RESPONSIVE
// Modern filter interface matching Design System
// 
// CHANGELOG:
// v2.0 (2025-11-26): Redesign per Design System
//   - NEW: "Clear Filters" button
//   - STYLE: Updated inputs and selects to match dark mode system
//   - LAYOUT: Improved mobile responsiveness with flex-wrap
//   - UI: Consistent rounded corners and borders
// v1.0 (2025-11-23): Initial implementation

import React from 'react';
import { Search, Download, ChevronDown, X, Filter } from 'lucide-react';

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
    totalResults
}) => {
    // Check if any filter is active
    const hasActiveFilters = searchTerm || selectedSegment !== 'all' || selectedRisk !== 'all';

    // Clear all filters
    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedSegment('all');
        setSelectedRisk('all');
    };

    return (
        <div className="sticky top-4 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl p-4 mb-6 animate-fade-in">
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
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lavpop-blue/50 focus:border-lavpop-blue transition-all shadow-sm"
                        />
                    </div>

                    <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
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
                            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-lavpop-blue dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-lavpop-blue/20 cursor-pointer transition-all shadow-sm"
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
                            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-lavpop-blue dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-lavpop-blue/20 cursor-pointer transition-all shadow-sm"
                        >
                            <option value="all">Todos Riscos</option>
                            <option value="Healthy">Saudável 🟢</option>
                            <option value="Monitor">Monitorar 🔵</option>
                            <option value="At Risk">Em Risco 🟠</option>
                            <option value="Churning">Crítico 🔴</option>
                            <option value="New Customer">Novo 🟣</option>
                            <option value="Lost">Perdido ⚪</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Sort */}
                    <div className="relative group flex-1 sm:flex-none min-w-[140px]">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-lavpop-blue dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-lavpop-blue/20 cursor-pointer transition-all shadow-sm"
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
                            className="flex items-center justify-center p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Limpar Filtros"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}

                    {/* Export Button */}
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-lavpop-green hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 ml-auto sm:ml-0"
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
