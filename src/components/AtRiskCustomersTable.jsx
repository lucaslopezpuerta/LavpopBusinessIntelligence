// AtRiskCustomersTable.jsx v6.1 - MOBILE VIEW OPTIMIZATION
// ✅ No horizontal scroll
// ✅ Mobile: Cliente + Ações only
// ✅ Desktop: All columns visible
// ✅ No phone numbers displayed
// ✅ Row coloring by risk
//
// CHANGELOG:
// v6.1 (2025-11-22): Mobile view optimization
// v6.0 (2025-11-21): No overflow redesign

import React, { useState } from 'react';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';

const AtRiskCustomersTable = ({ customerMetrics, salesData, maxRows = 5 }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  if (!customerMetrics?.activeCustomers) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
        Carregando clientes...
      </div>
    );
  }

  const atRiskCustomers = customerMetrics.activeCustomers
    .filter(c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning')
    .sort((a, b) => b.netTotal - a.netTotal)
    .slice(0, maxRows);

  if (atRiskCustomers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 text-center">
        <div className="text-lavpop-green dark:text-green-400 text-base font-semibold mb-1">
          🎉 Ótimas notícias!
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm">
          Nenhum cliente em risco
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    return cleaned.length >= 10 ? cleaned : null;
  };

  const handleCall = (e, phone) => {
    e.stopPropagation();
    const cleaned = formatPhone(phone);
    if (cleaned) window.location.href = `tel:+55${cleaned}`;
  };

  const handleWhatsApp = (e, phone) => {
    e.stopPropagation();
    const cleaned = formatPhone(phone);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile
      ? `https://api.whatsapp.com/send?phone=55${cleaned}`
      : `https://web.whatsapp.com/send?phone=55${cleaned}`;
    window.open(url, '_blank');
  };

  const getRiskStyles = (riskLevel) => {
    if (riskLevel === 'Churning') {
      return {
        borderColor: 'border-red-500',
        badge: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border-red-300 dark:border-red-600',
        label: 'Perdendo'
      };
    }
    return {
      borderColor: 'border-amber-500',
      badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 border-amber-300 dark:border-amber-600',
      label: 'Em Risco'
    };
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-lavpop-blue/30 dark:border-blue-700">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lavpop-blue to-blue-600 flex items-center justify-center shadow-md">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-lavpop-blue dark:text-blue-400 leading-none">
              Top {maxRows} Clientes em Risco
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Alto valor • Clique para detalhes
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/50">
                <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-[10px] text-center rounded-tl-lg">
                  CLIENTE
                </th>
                <th className="hidden lg:table-cell px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-[10px] text-center">
                  RISCO
                </th>
                <th className="hidden lg:table-cell px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-[10px] text-center">
                  TOTAL
                </th>
                <th className="hidden lg:table-cell px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-[10px] text-center">
                  DIAS
                </th>
                <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-[10px] text-center rounded-tr-lg">
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {atRiskCustomers.map((customer, index) => {
                const styles = getRiskStyles(customer.riskLevel);

                return (
                  <tr
                    key={customer.doc || index}
                    className={`
                      min-h-[60px] transition-all duration-150 cursor-pointer
                      hover:brightness-95 dark:hover:brightness-110
                      ${index < atRiskCustomers.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}
                      hover:bg-slate-50 dark:hover:bg-slate-700/50
                      border-l-4 ${styles.borderColor} lg:border-l-0
                    `}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    {/* Cliente */}
                    <td className="p-4 lg:p-3">
                      <div className="font-bold text-sm lg:text-xs text-slate-900 dark:text-white">
                        {customer.name || 'Sem nome'}
                      </div>
                      <div className="lg:hidden text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                        {styles.label}
                      </div>
                    </td>

                    {/* Risco - Desktop only */}
                    <td className="hidden lg:table-cell p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${styles.badge}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {styles.label}
                      </span>
                    </td>

                    {/* Total - Desktop only */}
                    <td className="hidden lg:table-cell p-3 text-right font-bold text-lavpop-blue dark:text-blue-300">
                      {formatCurrency(customer.netTotal || 0)}
                    </td>

                    {/* Dias - Desktop only */}
                    <td className="hidden lg:table-cell p-3 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        {customer.daysSinceLastVisit || 0}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="p-4 lg:p-3">
                      <div className="flex gap-2 justify-center">
                        {customer.phone && formatPhone(customer.phone) && (
                          <>
                            <button
                              onClick={(e) => handleCall(e, customer.phone)}
                              className="p-2.5 lg:p-2 rounded-lg border-2 border-lavpop-blue dark:border-blue-500 bg-white dark:bg-slate-800 text-lavpop-blue dark:text-blue-400 hover:bg-lavpop-blue hover:text-white dark:hover:bg-blue-600 transition-all"
                              title="Ligar"
                            >
                              <Phone className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleWhatsApp(e, customer.phone)}
                              className="p-2.5 lg:p-2 rounded-lg border-2 border-lavpop-green bg-white dark:bg-slate-800 text-lavpop-green hover:bg-lavpop-green hover:text-white transition-all"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
