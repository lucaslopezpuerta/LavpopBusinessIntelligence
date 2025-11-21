// AtRiskCustomersTable.jsx v5.0 - TAILWIND MIGRATION
// ✅ Replaced inline styles with Tailwind classes
// ✅ Added dark mode support
// ✅ Responsive table layout
// ✅ Preserved all logic and safety checks
//
// CHANGELOG:
// v5.0 (2025-11-20): Tailwind migration & Dark Mode
// v4.0 (2025-11-16): Ultra compact design

import React, { useState } from 'react';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';

const AtRiskCustomersTable = ({ customerMetrics, salesData, maxRows = 5 }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  if (!customerMetrics || !customerMetrics.activeCustomers) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
        Carregando clientes em risco...
      </div>
    );
  }

  const atRiskCustomers = customerMetrics.activeCustomers
    .filter(c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning')
    .sort((a, b) => b.netTotal - a.netTotal)
    .slice(0, maxRows);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return cleaned;
    }
    return null;
  };

  const handleCall = (e, phone) => {
    e.stopPropagation();
    const cleaned = formatPhone(phone);
    if (cleaned) {
      window.location.href = `tel:+55${cleaned}`;
    }
  };

  const handleWhatsApp = (e, phone) => {
    e.stopPropagation();
    const cleaned = formatPhone(phone);
    if (cleaned) {
      window.open(`https://web.whatsapp.com/send?phone=55${cleaned}`, '_blank');
    }
  };

  const translateRiskLevel = (riskLevel) => {
    switch (riskLevel) {
      case 'Churning': return 'Perdendo';
      case 'At Risk': return 'Em Risco';
      default: return riskLevel;
    }
  };

  const getRiskBadge = (riskLevel, returnLikelihood) => {
    const churnPercent = returnLikelihood !== undefined && returnLikelihood !== null
      ? Math.round(100 - returnLikelihood)
      : 0;

    let colorClass = 'text-slate-500 dark:text-slate-400';
    let bgClass = 'bg-slate-100 dark:bg-slate-700';
    let borderClass = 'border-slate-200 dark:border-slate-600';

    if (riskLevel === 'Churning') {
      colorClass = 'text-red-600 dark:text-red-400';
      bgClass = 'bg-red-50 dark:bg-red-900/20';
      borderClass = 'border-red-200 dark:border-red-800/30';
    } else if (riskLevel === 'At Risk') {
      colorClass = 'text-amber-500 dark:text-amber-400';
      bgClass = 'bg-amber-50 dark:bg-amber-900/20';
      borderClass = 'border-amber-200 dark:border-amber-800/30';
    }

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${colorClass} ${bgClass} ${borderClass}`}>
        <AlertTriangle className="w-[11px] h-[11px]" />
        {translateRiskLevel(riskLevel)} {churnPercent}%
      </div>
    );
  };

  if (atRiskCustomers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 text-center">
        <div className="text-lavpop-green dark:text-green-400 text-[15px] font-semibold mb-1">
          🎉 Ótimas notícias!
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-xs">
          Nenhum cliente em risco detectado
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* ✅ ULTRA COMPACT Single-Line Header */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b-2 border-lavpop-blue dark:border-blue-600">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-lavpop-blue dark:text-blue-400 m-0 leading-none">
                Top {maxRows} Clientes em Risco
              </h3>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Alto valor • Clique para detalhes
          </div>
        </div>

        {/* ✅ COMPACT Table with Tighter Spacing */}
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/50">
                <th className="px-2.5 py-2 font-semibold text-slate-500 dark:text-slate-400 text-[10px] text-left rounded-l-md">
                  CLIENTE
                </th>
                <th className="px-2.5 py-2 font-semibold text-slate-500 dark:text-slate-400 text-[10px] text-center">
                  RISCO
                </th>
                <th className="px-2.5 py-2 font-semibold text-slate-500 dark:text-slate-400 text-[10px] text-center">
                  TOTAL
                </th>
                <th className="px-2.5 py-2 font-semibold text-slate-500 dark:text-slate-400 text-[10px] text-center">
                  DIAS
                </th>
                <th className="px-2.5 py-2 font-semibold text-slate-500 dark:text-slate-400 text-[10px] text-center rounded-r-md">
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {atRiskCustomers.map((customer, index) => (
                <tr
                  key={customer.doc || index}
                  className={`
                    transition-colors duration-150 cursor-pointer
                    hover:bg-blue-50 dark:hover:bg-slate-700
                    ${index < atRiskCustomers.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}
                  `}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  {/* Cliente - Left aligned */}
                  <td className={`p-2.5 ${index < atRiskCustomers.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs mb-px">
                      {customer.name || 'Cliente sem nome'}
                    </div>
                    {customer.phone && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {customer.phone}
                      </div>
                    )}
                  </td>

                  {/* Risco - Center aligned */}
                  <td className={`p-2.5 text-center ${index < atRiskCustomers.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                    {getRiskBadge(customer.riskLevel, customer.returnLikelihood)}
                  </td>

                  {/* Total - Center aligned */}
                  <td className={`p-2.5 text-center font-semibold text-lavpop-blue dark:text-blue-400 text-xs ${index < atRiskCustomers.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                    {formatCurrency(customer.netTotal || 0)}
                  </td>

                  {/* Dias - Center aligned */}
                  <td className={`p-2.5 text-center ${index < atRiskCustomers.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {customer.daysSinceLastVisit || 0}
                    </span>
                  </td>

                  {/* Ações - Center aligned */}
                  <td className={`p-2.5 text-center ${index < atRiskCustomers.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                    <div className="flex gap-1.5 justify-center">
                      {customer.phone && formatPhone(customer.phone) && (
                        <>
                          <button
                            onClick={(e) => handleCall(e, customer.phone)}
                            title="Ligar"
                            className="
                              p-1.5 rounded border border-blue-200 dark:border-blue-800 
                              bg-white dark:bg-slate-800 
                              text-lavpop-blue dark:text-blue-400 
                              hover:bg-lavpop-blue hover:text-white hover:border-lavpop-blue
                              dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600
                              transition-all duration-200
                              flex items-center gap-1 text-[10px] font-semibold
                            "
                          >
                            <Phone className="w-[11px] h-[11px]" />
                            <span className="hidden lg:inline">Ligar</span>
                          </button>
                          <button
                            onClick={(e) => handleWhatsApp(e, customer.phone)}
                            title="WhatsApp"
                            className="
                              p-1.5 rounded border border-green-200 dark:border-green-800 
                              bg-white dark:bg-slate-800 
                              text-[#25D366] 
                              hover:bg-[#25D366] hover:text-white hover:border-[#25D366]
                              transition-all duration-200
                              flex items-center gap-1 text-[10px] font-semibold
                            "
                          >
                            <MessageCircle className="w-[11px] h-[11px]" />
                            <span className="hidden lg:inline">WhatsApp</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
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
