// CustomerDetailModal.jsx v3.0 - TAILWIND MIGRATION + DARK MODE
// ✅ Full Tailwind CSS with dark mode support
// ✅ Responsive grid layout
// ✅ All math/metrics logic preserved

import React from 'react';
import { X, Phone, MessageCircle, TrendingUp, Calendar, DollarSign, Activity } from 'lucide-react';

const CustomerDetailModal = ({ customer, salesData, onClose }) => {
  if (!customer) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const handleCall = () => {
    const cleaned = customer.phone?.replace(/\D/g, '');
    if (cleaned) {
      window.location.href = `tel:+55${cleaned}`;
    }
  };

  const handleWhatsApp = () => {
    const cleaned = customer.phone?.replace(/\D/g, '');
    if (cleaned) {
      window.open(`https://web.whatsapp.com/send?phone=55${cleaned}`, '_blank');
    }
  };

  const getRiskColor = (riskLevel) => {
    const colors = {
      'Healthy': 'text-lavpop-green bg-lavpop-green-100 dark:bg-lavpop-green-900/30',
      'Monitor': 'text-lavpop-blue bg-lavpop-blue-100 dark:bg-lavpop-blue-900/30',
      'At Risk': 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
      'Churning': 'text-red-600 bg-red-100 dark:bg-red-900/30',
      'New Customer': 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      'Lost': 'text-slate-600 bg-slate-100 dark:bg-slate-700/30'
    };
    return colors[riskLevel] || colors['Monitor'];
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="
        bg-white dark:bg-slate-800 
        rounded-xl 
        shadow-2xl 
        p-6 
        max-w-2xl 
        w-full 
        max-h-[80vh] 
        overflow-y-auto
      ">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {customer.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Documento: {customer.doc}
            </p>
            {customer.phone && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                📞 {formatPhone(customer.phone)}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="
              text-slate-500 dark:text-slate-400 
              hover:text-slate-700 dark:hover:text-slate-200 
              transition-colors
            "
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Actions */}
        {customer.phone && formatPhone(customer.phone) && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleCall}
              className="
                flex-1 
                flex items-center justify-center gap-2 
                px-4 py-2 
                bg-slate-100 dark:bg-slate-700 
                hover:bg-slate-200 dark:hover:bg-slate-600 
                rounded-lg 
                font-medium 
                transition-colors
              "
            >
              <Phone className="w-4 h-4" />
              Ligar
            </button>
            <button
              onClick={handleWhatsApp}
              className="
                flex-1 
                flex items-center justify-center gap-2 
                px-4 py-2 
                bg-green-600 dark:bg-green-700 
                hover:bg-green-700 dark:hover:bg-green-600 
                text-white 
                rounded-lg 
                font-medium 
                transition-colors
              "
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-lavpop-blue-50 dark:bg-lavpop-blue-900/20 rounded-lg p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Valor Total
            </div>
            <div className="text-2xl font-bold text-lavpop-blue dark:text-lavpop-blue-400">
              {formatCurrency(customer.netTotal)}
            </div>
          </div>

          <div className="bg-lavpop-green-50 dark:bg-lavpop-green-900/20 rounded-lg p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total de Visitas
            </div>
            <div className="text-2xl font-bold text-lavpop-green dark:text-lavpop-green-400">
              {customer.transactions}
            </div>
          </div>
        </div>

        {/* Service Preferences */}
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-lavpop-blue-50 to-lavpop-green-50 dark:from-lavpop-blue-900/20 dark:to-lavpop-green-900/20">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
            Preferências de Serviço
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Lavagens
              </div>
              <div className="text-2xl font-bold text-lavpop-blue dark:text-lavpop-blue-400">
                {customer.washServices}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-500">
                {customer.washPercentage}% dos serviços
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-500">
                {formatCurrency(customer.washRevenue)} receita
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Secagens
              </div>
              <div className="text-2xl font-bold text-lavpop-green dark:text-lavpop-green-400">
                {customer.dryServices}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-500">
                {customer.dryPercentage}% dos serviços
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-500">
                {formatCurrency(customer.dryRevenue)} receita
              </div>
            </div>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Segmento:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {customer.segment}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Nível de Risco:</span>
            <span className={`
              px-2 py-1 
              rounded-full 
              text-xs font-bold 
              uppercase 
              ${getRiskColor(customer.riskLevel)}
            `}>
              {customer.riskLevel}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Probabilidade de Retorno:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {customer.returnLikelihood}%
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Total de Serviços:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {customer.totalServices}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Serviços por Visita:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {customer.servicesPerVisit}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Frequência de Visitas:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {customer.avgDaysBetween ? `A cada ${customer.avgDaysBetween} dias` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Dias Desde Última Visita:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {customer.daysSinceLastVisit} dias
            </span>
          </div>
          
          {customer.daysOverdue > 0 && (
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Dias em Atraso:</span>
              <span className="font-bold text-red-600 dark:text-red-500">
                {customer.daysOverdue} dias
              </span>
            </div>
          )}
          
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Primeira Visita:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatDate(customer.firstVisit)}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Última Visita:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatDate(customer.lastVisit)}
            </span>
          </div>
          
          {customer.lastContactDate && (
            <div className="flex justify-between py-2">
              <span className="text-slate-600 dark:text-slate-400">Último Contato:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatDate(customer.lastContactDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
