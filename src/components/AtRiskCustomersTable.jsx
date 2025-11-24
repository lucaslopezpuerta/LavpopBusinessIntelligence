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
import { Phone, MessageCircle, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';

const AtRiskCustomersTable = ({ customerMetrics, salesData, maxRows = 7 }) => {
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
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-8 text-center border border-emerald-200 dark:border-emerald-800 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-2">
          Excelente trabalho!
        </h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Nenhum cliente em risco no momento
        </p>
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
        borderColorValue: '#ef4444', // red-500
        badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
        dot: 'bg-red-500',
        label: 'Perdendo'
      };
    }
    return {
      borderColorValue: '#f59e0b', // amber-500
      badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
      label: 'Em Risco'
    };
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Clientes em Risco
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {atRiskCustomers.length} clientes precisam de atenção
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700">
                <th className="px-4 py-2 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Cliente
                  </span>
                </th>
                <th className="hidden lg:table-cell px-4 py-2 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Risco
                  </span>
                </th>
                <th className="hidden lg:table-cell px-4 py-2 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Total
                  </span>
                </th>
                <th className="hidden lg:table-cell px-4 py-2 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Dias
                  </span>
                </th>
                <th className="px-4 py-2 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Ações
                  </span>
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
                      group cursor-pointer
                      border-b border-slate-100 dark:border-slate-800
                      hover:bg-slate-50 dark:hover:bg-slate-800/50
                      hover:shadow-md
                      transition-all duration-200
                      border-l-4
                    `}
                    style={{ borderLeftColor: styles.borderColorValue }}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    {/* Cliente */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {customer.name || 'Sem nome'}
                          </div>
                          <div className="lg:hidden flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                {styles.label}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                              {customer.daysSinceLastVisit || 0}d
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="lg:hidden w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      </div>
                    </td>

                    {/* Risco - Desktop only */}
                    <td className="hidden lg:table-cell px-4 py-2 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${styles.badge}">
                        <div className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                        <span className="text-xs font-bold">
                          {styles.label}
                        </span>
                      </div>
                    </td>

                    {/* Total - Desktop only */}
                    <td className="hidden lg:table-cell px-4 py-2 text-center font-bold text-sm text-blue-600 dark:text-blue-400">
                      {formatCurrency(customer.netTotal || 0)}
                    </td>

                    {/* Dias - Desktop only */}
                    <td className="hidden lg:table-cell px-4 py-2 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                        {customer.daysSinceLastVisit || 0}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        {customer.phone && formatPhone(customer.phone) && (
                          <>
                            <button
                              onClick={(e) => handleCall(e, customer.phone)}
                              className="
                                p-2 rounded-lg
                                bg-blue-50 dark:bg-blue-900/20
                                text-blue-600 dark:text-blue-400
                                hover:bg-blue-100 dark:hover:bg-blue-900/40
                                hover:scale-110
                                transition-all duration-200
                                group-hover:shadow-md
                              "
                              title="Ligar"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleWhatsApp(e, customer.phone)}
                              className="
                                p-2 rounded-lg
                                bg-green-50 dark:bg-green-900/20
                                text-green-600 dark:text-green-400
                                hover:bg-green-100 dark:hover:bg-green-900/40
                                hover:scale-110
                                transition-all duration-200
                                group-hover:shadow-md
                              "
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
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
