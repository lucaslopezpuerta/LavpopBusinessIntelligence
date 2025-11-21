// AtRiskCustomersTable.jsx v5.3 - MOBILE OPTIMIZATION
// ✅ Hidden TOTAL/DIAS/RISCO columns on mobile
// ✅ Row background color indicates risk level
// ✅ Min-height 60px on mobile rows
// ✅ Removed phone from mobile view
// ✅ No logic changes
//
// CHANGELOG:
// v5.3 (2025-11-21): Mobile optimization

import React, { useState } from 'react';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';

const AtRiskCustomersTable = ({ customerMetrics, salesData, maxRows = 5 }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  if (!customerMetrics || !customerMetrics.activeCustomers) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
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

  const getRiskStyles = (riskLevel) => {
    if (riskLevel === 'Churning') {
      return {
        mobile: 'bg-red-50 dark:bg-red-900/20',
        badge: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border-red-300 dark:border-red-700'
      };
    } else if (riskLevel === 'At Risk') {
      return {
        mobile: 'bg-amber-50 dark:bg-amber-900/20',
        badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 border-amber-300 dark:border-amber-700'
      };
    }
    return {
      mobile: 'bg-white dark:bg-slate-800',
      badge: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-300 dark:border-slate-600'
    };
  };

  const getRiskBadge = (riskLevel, returnLikelihood) => {
    const churnPercent = returnLikelihood !== undefined && returnLikelihood !== null
      ? Math.round(100 - returnLikelihood)
      : 0;

    const styles = getRiskStyles(riskLevel);

    return (
      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${styles.badge}`}>
        <AlertTriangle className="w-3 h-3" />
        {translateRiskLevel(riskLevel)} {churnPercent}%
      </div>
    );
  };

  if (atRiskCustomers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 text-center">
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gradient-to-r from-lavpop-blue to-blue-600 dark:from-blue-700 dark:to-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lavpop-blue to-blue-600 dark:from-blue-700 dark:to-blue-900 flex items-center justify-center shadow-md">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-lavpop-blue dark:text-blue-400 m-0 leading-none">
                Top {maxRows} Clientes em Risco
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Alto valor • Clique para detalhes
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-700/50">
                <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-[10px] text-center rounded-l-lg">
                  CLIENTE
                </th>
                <th className="hidden md:table-cell px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-[10px] text-center">
                  RISCO
                </th>
                <th className="hidden lg:table-cell px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-[10px] text-center">
                  TOTAL
                </th>
                <th className="hidden lg:table-cell px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-[10px] text-center">
                  DIAS
                </th>
                <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-[10px] text-center rounded-r-lg">
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {atRiskCustomers.map((customer, index) => {
                const riskStyles = getRiskStyles(customer.riskLevel);
                
                return (
                  <tr
                    key={customer.doc || index}
                    className={`
                      min-h-[60px] md:min-h-0
                      transition-all duration-150 cursor-pointer
                      hover:brightness-95 dark:hover:brightness-110
                      active:brightness-90 dark:active:brightness-125
                      ${index < atRiskCustomers.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}
                      md:bg-white md:dark:bg-slate-800
                      ${riskStyles.mobile}
                    `}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    {/* Cliente */}
                    <td className="p-4 md:p-3 text-center">
                      <div className="font-bold text-sm md:text-xs text-slate-900 dark:text-white">
                        {customer.name || 'Cliente sem nome'}
                      </div>
                      <div className="hidden md:block text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                        {customer.phone}
                      </div>
                    </td>

                    {/* Risco - Desktop only */}
                    <td className="hidden md:table-cell p-3 text-center">
                      {getRiskBadge(customer.riskLevel, customer.returnLikelihood)}
                    </td>

                    {/* Total - Large screens only */}
                    <td className="hidden lg:table-cell p-3 text-center font-bold text-lavpop-blue dark:text-blue-300 text-xs">
                      {formatCurrency(customer.netTotal || 0)}
                    </td>

                    {/* Dias - Large screens only */}
                    <td className="hidden lg:table-cell p-3 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-200">
                        {customer.daysSinceLastVisit || 0}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="p-4 md:p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        {customer.phone && formatPhone(customer.phone) && (
                          <>
                            <button
                              onClick={(e) => handleCall(e, customer.phone)}
                              title="Ligar"
                              className="
                                p-2.5 md:p-2 rounded-lg border-2 border-lavpop-blue dark:border-blue-600
                                bg-white dark:bg-slate-800 
                                text-lavpop-blue dark:text-blue-400 
                                hover:bg-lavpop-blue hover:text-white hover:scale-110
                                dark:hover:bg-blue-600 dark:hover:text-white
                                active:scale-95
                                transition-all duration-200
                              "
                            >
                              <Phone className="w-4 h-4 md:w-3.5 md:h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleWhatsApp(e, customer.phone)}
                              title="WhatsApp"
                              className="
                                p-2.5 md:p-2 rounded-lg border-2 border-[#25D366]
                                bg-white dark:bg-slate-800 
                                text-[#25D366] 
                                hover:bg-[#25D366] hover:text-white hover:scale-110
                                active:scale-95
                                transition-all duration-200
                              "
                            >
                              <MessageCircle className="w-4 h-4 md:w-3.5 md:h-3.5" />
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
