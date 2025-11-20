// AtRiskCustomersTable.jsx v5.0 - Tailwind Redesign
// - Shows top N customers with risk of churn
// - Opens CustomerDetailModal with last 5 transactions

// CHANGELOG:
// v5.0 (2025-11-20): Full Tailwind Redesign
// v4.0 (2025-11-16): Ultra compact design - single-line header, tighter rows, center alignment, Total height reduction: ~85px for 5 rows, Professional clean design with brand colors
// v3.0 (2025-11-15): Complete redesign - clean, professional, brand-focused

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Users, ChevronRight } from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';

const BRAND = {
  primary: '#0c4a6e',
  accent: '#4ac02a',
};

const formatCurrency = (value) =>
  `R$ ${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return '—';
  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR');
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('pt-BR');
};

const AtRiskCustomersTable = ({ customerMetrics, salesData, maxRows = 5 }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const rows = useMemo(() => {
    const list = customerMetrics?.activeCustomers || [];
    return list
      .filter(
        (c) =>
          c.riskLevel === 'At Risk' || c.riskLevel === 'Churning'
      )
      .sort((a, b) => (b.netTotal || 0) - (a.netTotal || 0))
      .slice(0, maxRows);
  }, [customerMetrics, maxRows]);

  const totalAtRisk = customerMetrics?.atRiskCount || rows.length || 0;

  return (
    <>
      <div className="mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md bg-rose-100 px-2 py-1 text-rose-700 text-[11px] font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              RISCO DE CHURN
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Top {rows.length || 0} Clientes em Risco
              </div>
              <div className="text-[11px] text-slate-500">
                {totalAtRisk} clientes com alto risco de não retornar.
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
            <Users className="w-3.5 h-3.5" />
            <span>Priorize contato e ofertas direcionadas.</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            Nenhum cliente em risco significativo neste momento. Boa saúde da base! 🎉
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-2 py-2 text-left">Segmento</th>
                  <th className="px-2 py-2 text-right">Última visita</th>
                  <th className="px-2 py-2 text-right">Dias</th>
                  <th className="px-2 py-2 text-right">Retorno</th>
                  <th className="px-4 py-2 text-right">Gasto Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.doc}
                    className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 flex items-center justify-center rounded-full bg-[#0c4a6e]/10 text-[11px] font-semibold text-[#0c4a6e]">
                          {c.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-slate-900">
                            {c.name || `Cliente ${c.doc?.slice(-4)}`}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            CPF: {c.doc}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[12px] text-slate-600">
                      {c.segment || '—'}
                    </td>
                    <td className="px-2 py-2 text-right text-[12px] text-slate-600">
                      {formatDate(c.lastVisit)}
                    </td>
                    <td className="px-2 py-2 text-right text-[12px] text-slate-600">
                      {c.daysSinceLastVisit ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-right text-[12px] text-slate-600">
                      {c.returnLikelihood != null
                        ? `${c.returnLikelihood}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[13px] font-semibold text-slate-900">
                          {formatCurrency(c.netTotal)}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          salesData={salesData}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </>
  );
};

export default AtRiskCustomersTable;
