// AtRiskCustomersTable.jsx v5.0 - TAILWIND MIGRATION + DARK MODE
// ✅ Full Tailwind CSS with dark mode support
// ✅ Responsive grid layout
// ✅ All math/metrics logic preserved
// ✅ Professional compact design

import React, { useState } from 'react';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';

const AtRiskCustomersTable = ({ customerMetrics, salesData, maxRows = 5 }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  if (!customerMetrics || !customerMetrics.activeCustomers) {
    return (
      <div className="
        bg-white dark:bg-slate-800 
        rounded-xl 
        p-4 
        border border-slate-200 dark:border-slate-700 
        text-center 
        text-slate-600 dark:text-slate-400
      ">
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

  const getRiskColor = (riskLevel) => {
    if (riskLevel === 'Churning') {
      return 'text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/30';
    }
    return 'text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/30';
  };

  if (atRiskCustomers.length === 0) {
    return (
      <div className="
        bg-white dark:bg-slate-800 
        rounded-xl 
        p-6 
        border border-slate-200 dark:border-slate-700 
        text-center
      ">
        <div className="text-4xl mb-3">🎉</div>
        <div className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Nenhum cliente em risco!
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Todos os clientes estão em boa situação
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="
        bg-white dark:bg-slate-800 
        rounded-xl 
        border border-slate-200 dark:border-slate-700 
        overflow-hidden
      ">
        {/* Header */}
        <div className="
          flex items-center justify-between 
          px-6 py-3 
          border-b border-slate-200 dark:border-slate-700 
          bg-slate-50 dark:bg-slate-900/50
        ">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Clientes em Risco
            </h3>
            <span className="
              px-2 py-0.5 
              bg-red-100 dark:bg-red-900/30 
              text-red-600 dark:text-red-400 
              text-xs font-bold 
              rounded-full
            ">
              {atRiskCustomers.length}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="text-left px-6 py-2 border-b border-slate-200 dark:border-slate-700">Cliente</th>
                <th className="text-center px-4 py-2 border-b border-slate-200 dark:border-slate-700">Risco</th>
                <th className="text-center px-4 py-2 border-b border-slate-200 dark:border-slate-700">Atraso</th>
                <th className="text-right px-4 py-2 border-b border-slate-200 dark:border-slate-700">Valor Total</th>
                <th className="text-right px-4 py-2 border-b border-slate-200 dark:border-slate-700">Visitas</th>
                <th className="text-right px-6 py-2 border-b border-slate-200 dark:border-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {atRiskCustomers.map((customer, index) => (
                <tr
                  key={customer.doc || index}
                  onClick={() => setSelectedCustomer(customer)}
                  className="
                    border-b border-slate-100 dark:border-slate-700/50 
                    hover:bg-slate-50 dark:hover:bg-slate-700/30 
                    cursor-pointer 
                    transition-colors
                  "
                >
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {customer.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {customer.segment}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    <span className={`
                      px-2 py-1 
                      rounded-full 
                      text-[10px] font-bold 
                      uppercase 
                      ${getRiskColor(customer.riskLevel)}
                    `}>
                      {customer.riskLevel}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-bold text-red-600 dark:text-red-500">
                      {customer.daysOverdue || 0}d
                    </span>
                  </td>
                  
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-lavpop-blue dark:text-lavpop-blue-400">
                      {formatCurrency(customer.netTotal)}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {customer.transactions}
                    </span>
                  </td>
                  
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {customer.phone && formatPhone(customer.phone) && (
                        <>
                          <button
                            onClick={(e) => handleCall(e, customer.phone)}
                            className="
                              p-1.5 
                              rounded-lg 
                              bg-slate-100 dark:bg-slate-700 
                              hover:bg-slate-200 dark:hover:bg-slate-600 
                              text-slate-700 dark:text-slate-300 
                              transition-colors
                            "
                            title="Ligar"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleWhatsApp(e, customer.phone)}
                            className="
                              p-1.5 
                              rounded-lg 
                              bg-green-100 dark:bg-green-900/30 
                              hover:bg-green-200 dark:hover:bg-green-900/50 
                              text-green-700 dark:text-green-400 
                              transition-colors
                            "
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!customer.phone && (
                        <span className="text-xs text-slate-400 dark:text-slate-600">
                          Sem telefone
                        </span>
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
