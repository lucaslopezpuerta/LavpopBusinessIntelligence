// ExportModal.jsx v2.1 - NARRATIVE-DRIVEN EXPORTS
// Modal for exporting data to CSV or PDF with charts and narratives
//
// CHANGELOG:
// v2.1 (2026-01-31): Narrative-driven export refactor
//   - Added Customer Health Report option
//   - Updated descriptions for narrative-driven reports
//   - Async export handlers for new report functions
//   - Design System v6.3 compliant exports
// v2.0 (2026-01-31): BaseModal migration
//   - Migrated to BaseModal component for consistent UX
//   - Removed duplicate boilerplate (portal, animations, swipe, scroll lock)
//   - Uses BaseModal footer prop for action buttons
//   - Reduced from ~680 lines to ~380 lines
// v1.8 (2026-01-31): Enhanced drag handle
// v1.7 (2026-01-31): Enhanced modal transitions
// v1.6 (2026-01-30): Swipe-to-close and portal rendering
// v1.5 (2026-01-25): Animation performance optimization
// v1.4 (2026-01-12): iOS-compatible scroll lock
// v1.3 (2025-12-17): Global reports (Complete + Executive Summary)
// v1.2 (2025-12-17): Fixed data field mappings + new export types
// v1.1 (2025-12-17): More export options per view
// v1.0 (2025-12-17): Initial implementation

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Download, Loader2, Check, AlertCircle, BookOpen, BarChart3, Users } from 'lucide-react';
import { exportToCSV, exportToPDF, exportCompleteReport, exportExecutiveSummary, exportCustomerHealthReport } from '../utils/exportUtils';
import { useTheme } from '../contexts/ThemeContext';
import BaseModal from './ui/BaseModal';

// Export configurations with correct field mappings from Supabase
const EXPORT_CONFIGS = {
  // Customer data (from data.customers)
  customers: {
    title: 'Diretório de Clientes',
    columns: [
      { key: 'Nome', label: 'Nome', width: 40 },
      { key: 'Documento', label: 'CPF', width: 28 },
      { key: 'Telefone', label: 'Telefone', width: 25 },
      { key: 'Total_Compras', label: 'Total Gasto', width: 22, align: 'right' },
      { key: 'Quantidade_Compras', label: 'Visitas', width: 15, align: 'center' },
      { key: 'Data_Ultima_Compra', label: 'Última Visita', width: 25 }
    ]
  },
  activeCustomers: {
    title: 'Clientes Ativos',
    columns: [
      { key: 'Nome', label: 'Nome', width: 40 },
      { key: 'Telefone', label: 'Telefone', width: 25 },
      { key: 'Total_Compras', label: 'Total', width: 22, align: 'right' },
      { key: 'Quantidade_Compras', label: 'Visitas', width: 15, align: 'center' },
      { key: 'days_since_last_visit', label: 'Dias s/ Visita', width: 22, align: 'center' }
    ]
  },
  newCustomers: {
    title: 'Clientes Novos (30 dias)',
    columns: [
      { key: 'Nome', label: 'Nome', width: 40 },
      { key: 'Telefone', label: 'Telefone', width: 25 },
      { key: 'Data_Cadastro', label: 'Cadastro', width: 28 },
      { key: 'Total_Compras', label: 'Total', width: 22, align: 'right' },
      { key: 'Quantidade_Compras', label: 'Visitas', width: 15, align: 'center' }
    ]
  },
  // RFM data (from data.rfm)
  atRisk: {
    title: 'Clientes em Risco',
    columns: [
      { key: 'client name', label: 'Nome', width: 40 },
      { key: 'phone number', label: 'Telefone', width: 25 },
      { key: 'Recency', label: 'Dias s/ Visita', width: 22, align: 'center' },
      { key: 'Monetary', label: 'Total Gasto', width: 25, align: 'right' },
      { key: 'segment', label: 'Segmento', width: 22 }
    ]
  },
  rfmSegments: {
    title: 'Segmentação RFM',
    showChart: true,
    chartType: 'pie',
    columns: [
      { key: 'segment', label: 'Segmento', width: 30 },
      { key: 'count', label: 'Clientes', width: 22, align: 'center' },
      { key: 'percentage', label: '% Total', width: 22, align: 'center' },
      { key: 'avgValue', label: 'Ticket Médio', width: 28, align: 'right' },
      { key: 'totalRevenue', label: 'Receita', width: 30, align: 'right' }
    ]
  },
  // Transactions (from data.sales)
  transactions: {
    title: 'Histórico de Transações',
    columns: [
      { key: 'Data_Hora', label: 'Data/Hora', width: 32 },
      { key: 'Nome_Cliente', label: 'Cliente', width: 35 },
      { key: 'Valor_Venda', label: 'Valor', width: 20, align: 'right' },
      { key: 'Meio_de_Pagamento', label: 'Pagamento', width: 25 },
      { key: 'Maquinas', label: 'Máquinas', width: 20 }
    ]
  },
  recentTransactions: {
    title: 'Transações Recentes (7 dias)',
    columns: [
      { key: 'Data_Hora', label: 'Data/Hora', width: 32 },
      { key: 'Nome_Cliente', label: 'Cliente', width: 35 },
      { key: 'Valor_Venda', label: 'Valor', width: 20, align: 'right' },
      { key: 'Meio_de_Pagamento', label: 'Pagamento', width: 25 },
      { key: 'Maquinas', label: 'Máquinas', width: 20 }
    ]
  },
  // Aggregated data
  kpis: {
    title: 'KPIs do Dashboard',
    showChart: true,
    chartType: 'bar',
    columns: [
      { key: 'metric', label: 'Métrica', width: 50 },
      { key: 'value', label: 'Valor', width: 30, align: 'right' },
      { key: 'description', label: 'Descrição', width: 60 }
    ]
  },
  dailySales: {
    title: 'Vendas por Dia',
    showChart: true,
    chartType: 'bar',
    columns: [
      { key: 'date', label: 'Data', width: 28 },
      { key: 'transactions', label: 'Transações', width: 22, align: 'center' },
      { key: 'revenue', label: 'Receita', width: 28, align: 'right' },
      { key: 'avgTicket', label: 'Ticket Médio', width: 28, align: 'right' }
    ]
  }
};

// Export options per view (as requested)
const VIEW_EXPORTS = {
  dashboard: [
    { id: 'kpis', label: 'KPIs + Gráfico', description: 'Métricas principais com visualização' },
    { id: 'recentTransactions', label: 'Transações Recentes', description: 'Últimos 7 dias de vendas' },
  ],
  customers: [
    { id: 'atRisk', label: 'Clientes em Risco', description: 'Esfriando ou inativos' },
    { id: 'activeCustomers', label: 'Clientes Ativos', description: 'Com visitas nos últimos 60 dias' },
    { id: 'newCustomers', label: 'Clientes Novos', description: 'Cadastrados nos últimos 30 dias' },
  ],
  diretorio: [
    { id: 'customers', label: 'Diretório de Clientes', description: 'Lista completa' },
    { id: 'rfmSegments', label: 'Segmentos RFM', description: 'Resumo com gráfico' },
  ],
  campaigns: [
    { id: 'rfmSegments', label: 'Segmentos RFM', description: 'Público-alvo por segmento' },
    { id: 'kpis', label: 'KPIs', description: 'Métricas de performance' },
  ],
  intelligence: [
    { id: 'kpis', label: 'Métricas de Negócio', description: 'Indicadores com gráfico' },
    { id: 'rfmSegments', label: 'Análise RFM', description: 'Segmentação com gráfico' },
  ],
  operations: [
    { id: 'transactions', label: 'Todas as Transações', description: 'Histórico completo' },
    { id: 'dailySales', label: 'Vendas por Dia', description: 'Resumo diário com gráfico' },
  ],
  upload: [
    { id: 'transactions', label: 'Transações Importadas', description: 'Dados do CSV' },
    { id: 'customers', label: 'Clientes Cadastrados', description: 'Base atual' },
  ],
};

// Global comprehensive reports (available from any view)
const GLOBAL_REPORTS = [
  {
    id: 'executiveSummary',
    label: 'Resumo Executivo',
    description: '1 página • KPIs, narrativas e ações prioritárias',
    icon: BarChart3,
    pdfOnly: true
  },
  {
    id: 'completeReport',
    label: 'Relatório Completo',
    description: '5 páginas • Análise profunda com gráficos e recomendações',
    icon: BookOpen,
    pdfOnly: true
  },
  {
    id: 'customerHealth',
    label: 'Saúde de Clientes',
    description: '2 páginas • Segmentos RFM e clientes em risco',
    icon: Users,
    pdfOnly: true
  },
];

const ExportModal = ({ isOpen, onClose, activeView, data }) => {
  const [format, setFormat] = useState('pdf');
  const [selectedExport, setSelectedExport] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showGlobal, setShowGlobal] = useState(true);
  const { isDark } = useTheme();

  const viewExports = VIEW_EXPORTS[activeView] || VIEW_EXPORTS.dashboard;

  useEffect(() => {
    if (isOpen) {
      setSelectedExport('executiveSummary');
      setFormat('pdf');
      setShowGlobal(true);
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Get data for specific export type
  const getExportData = (exportId) => {
    if (!data) return [];

    const customers = data.customers || [];
    const rfm = data.rfm || [];
    const sales = data.sales || [];

    switch (exportId) {
      case 'customers':
        return customers;

      case 'activeCustomers':
        return customers.filter(c => {
          const days = parseInt(c.days_since_last_visit) || 999;
          return days <= 60;
        });

      case 'newCustomers':
        return customers.filter(c => {
          if (!c.Data_Cadastro) return false;
          try {
            const parts = c.Data_Cadastro.split(' ')[0].split('/');
            const cadastroDate = new Date(parts[2], parts[1] - 1, parts[0]);
            const daysSince = (Date.now() - cadastroDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince <= 30;
          } catch {
            return false;
          }
        });

      case 'atRisk':
        return rfm.filter(c => c.segment === 'Esfriando' || c.segment === 'Inativo');

      case 'rfmSegments':
        return getRFMSegmentSummary(rfm);

      case 'transactions':
        return sales;

      case 'recentTransactions':
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return sales.filter(s => {
          if (!s.Data_Hora) return false;
          try {
            const parts = s.Data_Hora.split(' ')[0].split('/');
            const saleDate = new Date(parts[2], parts[1] - 1, parts[0]);
            return saleDate.getTime() >= sevenDaysAgo;
          } catch {
            return false;
          }
        });

      case 'kpis':
        return getKPIData();

      case 'dailySales':
        return getDailySalesSummary(sales);

      default:
        return [];
    }
  };

  const getRFMSegmentSummary = (rfmData) => {
    const segments = {};
    rfmData.forEach(c => {
      const seg = c.segment || 'Desconhecido';
      if (!segments[seg]) segments[seg] = { count: 0, totalValue: 0 };
      segments[seg].count++;
      const monetary = parseFloat(String(c.Monetary || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      segments[seg].totalValue += monetary;
    });

    const total = rfmData.length || 1;
    const segmentOrder = ['VIP', 'Frequente', 'Promissor', 'Novato', 'Esfriando', 'Inativo'];

    return Object.entries(segments)
      .map(([segment, d]) => ({
        segment,
        count: d.count,
        percentage: `${((d.count / total) * 100).toFixed(1)}%`,
        avgValue: `R$ ${d.count > 0 ? (d.totalValue / d.count).toFixed(2) : '0'}`,
        totalRevenue: `R$ ${d.totalValue.toFixed(2)}`
      }))
      .sort((a, b) => segmentOrder.indexOf(a.segment) - segmentOrder.indexOf(b.segment));
  };

  const getKPIData = () => {
    const customers = data?.customers || [];
    const rfm = data?.rfm || [];
    const sales = data?.sales || [];

    return [
      { metric: 'Total de Clientes', value: customers.length, description: 'Base cadastrada' },
      { metric: 'Total de Transações', value: sales.length, description: 'Vendas registradas' },
      { metric: 'Clientes VIP', value: rfm.filter(c => c.segment === 'VIP').length, description: 'Top performers' },
      { metric: 'Clientes Frequentes', value: rfm.filter(c => c.segment === 'Frequente').length, description: 'Visitantes regulares' },
      { metric: 'Clientes Promissores', value: rfm.filter(c => c.segment === 'Promissor').length, description: 'Em crescimento' },
      { metric: 'Clientes Novos', value: rfm.filter(c => c.segment === 'Novato').length, description: 'Recém-chegados' },
      { metric: 'Clientes Esfriando', value: rfm.filter(c => c.segment === 'Esfriando').length, description: 'Precisam de atenção' },
      { metric: 'Clientes Inativos', value: rfm.filter(c => c.segment === 'Inativo').length, description: 'Sem visitas recentes' },
    ];
  };

  const getDailySalesSummary = (salesData) => {
    const dailyMap = {};
    salesData.forEach(sale => {
      if (!sale.Data_Hora) return;
      const date = sale.Data_Hora.split(' ')[0];
      if (!dailyMap[date]) dailyMap[date] = { transactions: 0, revenue: 0 };
      dailyMap[date].transactions++;
      const value = parseFloat(String(sale.Valor_Venda || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      dailyMap[date].revenue += value;
    });

    return Object.entries(dailyMap)
      .map(([date, d]) => ({
        date,
        transactions: d.transactions,
        revenue: `R$ ${d.revenue.toFixed(2)}`,
        avgTicket: `R$ ${d.transactions > 0 ? (d.revenue / d.transactions).toFixed(2) : '0'}`
      }))
      .sort((a, b) => {
        const [da, ma, ya] = a.date.split('/');
        const [db, mb, yb] = b.date.split('/');
        return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
      })
      .slice(0, 30);
  };

  const getSummary = (exportId) => {
    const customers = data?.customers || [];
    const rfm = data?.rfm || [];
    const sales = data?.sales || [];

    switch (exportId) {
      case 'customers':
      case 'activeCustomers':
      case 'newCustomers':
        return { title: 'Resumo', items: [{ label: 'Total de Clientes', value: customers.length }] };
      case 'atRisk':
        const atRisk = rfm.filter(c => c.segment === 'Esfriando' || c.segment === 'Inativo');
        return { title: 'Resumo', items: [
          { label: 'Clientes em Risco', value: atRisk.length },
          { label: '% do Total', value: `${((atRisk.length / (rfm.length || 1)) * 100).toFixed(1)}%` },
        ]};
      case 'transactions':
      case 'recentTransactions':
        return { title: 'Resumo', items: [{ label: 'Total de Transações', value: sales.length }] };
      default:
        return null;
    }
  };

  const handleExport = async () => {
    if (!selectedExport || !data) {
      setStatus('error');
      setErrorMessage('Dados não disponíveis para exportação');
      return;
    }

    setStatus('loading');

    try {
      const timestamp = new Date().toISOString().split('T')[0];

      // Handle global reports (async functions)
      if (selectedExport === 'executiveSummary') {
        await exportExecutiveSummary(data, `bilavnova-resumo-executivo-${timestamp}`);
        setStatus('success');
        setTimeout(() => onClose(), 1500);
        return;
      }

      if (selectedExport === 'completeReport') {
        await exportCompleteReport(data, `bilavnova-relatorio-completo-${timestamp}`);
        setStatus('success');
        setTimeout(() => onClose(), 1500);
        return;
      }

      if (selectedExport === 'customerHealth') {
        await exportCustomerHealthReport(data, `bilavnova-saude-clientes-${timestamp}`);
        setStatus('success');
        setTimeout(() => onClose(), 1500);
        return;
      }

      // Handle view-specific exports
      const config = EXPORT_CONFIGS[selectedExport];
      const exportData = getExportData(selectedExport);

      if (!exportData || exportData.length === 0) {
        throw new Error('Nenhum dado disponível para este relatório');
      }

      const filename = `bilavnova-${selectedExport}-${timestamp}`;

      if (format === 'csv') {
        exportToCSV(exportData, filename, { columns: config.columns });
      } else {
        exportToPDF({
          title: config.title,
          data: exportData,
          columns: config.columns,
          filename,
          orientation: exportData.length > 15 || config.columns.length > 5 ? 'landscape' : 'portrait',
          summary: getSummary(selectedExport),
          showChart: config.showChart,
          chartType: config.chartType
        });
      }

      setStatus('success');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Export error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Erro ao exportar dados');
    }
  };

  // Footer with action buttons
  const footer = (
    <div className="flex justify-end gap-2">
      <button
        onClick={onClose}
        className={`px-4 py-2 rounded-xl transition-colors ${
          isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        Cancelar
      </button>
      <button
        onClick={handleExport}
        disabled={status === 'loading' || !selectedExport}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Exportando...</>
        ) : (
          <><Download className="w-4 h-4" />Exportar</>
        )}
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="medium"
      maxWidth="md"
      title="Exportar Dados"
      icon={Download}
      iconColor="blue"
      footer={footer}
    >
      <div className="space-y-4">
        {/* Tab selector: Global vs View-specific */}
        <div className={`flex gap-2 p-1 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <button
            onClick={() => {
              setShowGlobal(true);
              setSelectedExport('executiveSummary');
              setFormat('pdf');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              showGlobal
                ? `${isDark ? 'bg-slate-600 text-white' : 'bg-white text-slate-900'} shadow-sm`
                : `${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`
            }`}
          >
            Relatórios
          </button>
          <button
            onClick={() => {
              setShowGlobal(false);
              setSelectedExport(viewExports[0]?.id || null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              !showGlobal
                ? `${isDark ? 'bg-slate-600 text-white' : 'bg-white text-slate-900'} shadow-sm`
                : `${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`
            }`}
          >
            Dados da Aba
          </button>
        </div>

        {/* Format selector (only for view-specific exports) */}
        {!showGlobal && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Formato
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('csv')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  format === 'csv'
                    ? `border-blue-500 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`
                    : `${isDark ? 'border-slate-600 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'}`
                }`}
              >
                <FileSpreadsheet className={`w-5 h-5 ${format === 'csv' ? 'text-blue-500' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className={`font-medium ${format === 'csv' ? (isDark ? 'text-blue-300' : 'text-blue-700') : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>
                    CSV
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Excel, Sheets</div>
                </div>
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  format === 'pdf'
                    ? `border-blue-500 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`
                    : `${isDark ? 'border-slate-600 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'}`
                }`}
              >
                <FileText className={`w-5 h-5 ${format === 'pdf' ? 'text-blue-500' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className={`font-medium ${format === 'pdf' ? (isDark ? 'text-blue-300' : 'text-blue-700') : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>
                    PDF
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Com gráficos</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Global Reports */}
        {showGlobal && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Tipo de Relatório
            </label>
            <div className="space-y-2">
              {GLOBAL_REPORTS.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedExport(option.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedExport === option.id
                        ? `border-blue-500 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`
                        : `${isDark ? 'border-slate-600 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'}`
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedExport === option.id ? 'bg-blue-500' : (isDark ? 'bg-slate-700' : 'bg-slate-100')
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        selectedExport === option.id ? 'text-white' : (isDark ? 'text-slate-400' : 'text-slate-500')
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        selectedExport === option.id
                          ? (isDark ? 'text-blue-300' : 'text-blue-700')
                          : (isDark ? 'text-slate-300' : 'text-slate-700')
                      }`}>
                        {option.label}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {option.description}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedExport === option.id
                        ? 'border-blue-500 bg-blue-500'
                        : (isDark ? 'border-slate-500' : 'border-slate-300')
                    }`}>
                      {selectedExport === option.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className={`mt-2 text-xs text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Relatórios PDF com narrativas, gráficos e ações recomendadas
            </p>
          </div>
        )}

        {/* View-specific exports */}
        {!showGlobal && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Tipo de Relatório
            </label>
            <div className="space-y-2">
              {viewExports.map(option => (
                <button
                  key={option.id}
                  onClick={() => setSelectedExport(option.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedExport === option.id
                      ? `border-blue-500 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`
                      : `${isDark ? 'border-slate-600 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'}`
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedExport === option.id
                      ? 'border-blue-500 bg-blue-500'
                      : (isDark ? 'border-slate-500' : 'border-slate-300')
                  }`}>
                    {selectedExport === option.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className={`font-medium ${
                      selectedExport === option.id
                        ? (isDark ? 'text-blue-300' : 'text-blue-700')
                        : (isDark ? 'text-slate-300' : 'text-slate-700')
                    }`}>
                      {option.label}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {option.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {status === 'error' && (
          <div className={`flex items-center gap-2 p-3 rounded-xl ${
            isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}

        {/* Success message */}
        {status === 'success' && (
          <div className={`flex items-center gap-2 p-3 rounded-xl ${
            isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
          }`}>
            <Check className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Exportação concluída!</span>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ExportModal;
