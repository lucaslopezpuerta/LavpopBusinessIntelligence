// FilterBar.jsx v1.0 - GLASSMORPHIC FILTER BAR
// Modern filter interface for Customer Directory
// 
// CHANGELOG:
// v1.0 (2025-11-23): Initial implementation for Customer Intelligence Hub
//   - Glassmorphism styling (backdrop-blur, transparency)
//   - Sticky positioning for persistent visibility
//   - Search input with icon
//   - Custom-styled select dropdowns (Segment, Risk, Sort)
//   - Export CSV button
//   - Results counter
//   - Fully responsive layout
//   - Tailwind CSS styling

import React from 'react';
import { Search, Download, ChevronDown } from 'lucide-react';

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
    return (
        <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">

                {/* Left: Search & Count */}
                <div className="flex items-center gap-4 w-full lg:w-auto flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar cliente, telefone ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-lavpop-blue/50 focus:border-lavpop-blue transition-all"
                        />
                    </div>
                    <div className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                        {totalResults} Clientes
                    </div>
                </div>

                {/* Right: Filters & Actions */}
                <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">

                    {/* Segment Filter */}
                    <div className="relative group">
                        <select
                            value={selectedSegment}
                            onChange={(e) => setSelectedSegment(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:border-lavpop-blue focus:outline-none focus:ring-2 focus:ring-lavpop-blue/20 cursor-pointer transition-all min-w-[140px]"
                        >
                            <option value="all">Todos Segmentos</option>
                            {segments.filter(s => s !== 'all').map(seg => (
                                <option key={seg} value={seg}>{seg}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Risk Filter */}
                    <div className="relative group">
                        <select
                            value={selectedRisk}
                            onChange={(e) => setSelectedRisk(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:border-lavpop-blue focus:outline-none focus:ring-2 focus:ring-lavpop-blue/20 cursor-pointer transition-all min-w-[140px]"
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
                    <div className="relative group">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:border-lavpop-blue focus:outline-none focus:ring-2 focus:ring-lavpop-blue/20 cursor-pointer transition-all min-w-[140px]"
                        >
                            <option value="spending">Maior Gasto</option>
                            <option value="visits">Mais Visitas</option>
                            <option value="lastVisit">Recentes</option>
                            <option value="risk">Maior Risco</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2 bg-lavpop-green text-white rounded-lg text-sm font-bold hover:bg-green-600 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
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
