// CampaignDetailsModal.jsx v1.0
// Shows campaign details with individual contact outcomes
// Displays which contacts have returned vs pending vs expired
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.0 (2025-12-08): Initial implementation
//   - Campaign info header with metrics
//   - Contact list with status indicators
//   - Return revenue and days to return for returned contacts

import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Users,
  Calendar,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Phone,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { getCampaignContacts, getCampaignPerformance } from '../../utils/campaignService';

const CampaignDetailsModal = ({ campaign, onClose, formatCurrency, formatPercent }) => {
  const [contacts, setContacts] = useState([]);
  const [campaignData, setCampaignData] = useState(campaign);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch campaign contacts on mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch full campaign performance data
        const performance = await getCampaignPerformance(campaign.id);
        if (performance) {
          setCampaignData(prev => ({ ...prev, ...performance }));
        }

        // Fetch individual contacts
        const contactsData = await getCampaignContacts(campaign.id);
        setContacts(contactsData || []);
      } catch (error) {
        console.error('Failed to fetch campaign details:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [campaign.id]);

  // Filter contacts by status
  const filteredContacts = filterStatus === 'all'
    ? contacts
    : contacts.filter(c => {
        const status = c.contact_tracking?.status || 'pending';
        return status === filterStatus;
      });

  // Count by status
  const statusCounts = contacts.reduce((acc, c) => {
    const status = c.contact_tracking?.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const getStatusIcon = (status) => {
    switch (status) {
      case 'returned':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-slate-400" />;
      case 'cleared':
        return <XCircle className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'returned': return 'Retornou';
      case 'expired': return 'Expirado';
      case 'cleared': return 'Limpo';
      default: return 'Pendente';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'returned':
        return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
      case 'expired':
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
      case 'cleared':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
    }
  };

  const getAudienceLabel = (audience) => {
    switch (audience) {
      case 'atRisk': return 'Em Risco';
      case 'newCustomers': return 'Novos';
      case 'healthy': return 'Saudáveis';
      case 'withWallet': return 'Com Saldo';
      case 'all': return 'Todos';
      default: return audience || '-';
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const contactsData = await getCampaignContacts(campaign.id);
      setContacts(contactsData || []);
    } catch (error) {
      console.error('Failed to refresh contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {campaignData.name || campaign.id}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {campaignData.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(campaignData.created_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {campaignData.audience && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {getAudienceLabel(campaignData.audience)}
                  </span>
                )}
                {campaignData.contact_method && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {campaignData.contact_method === 'whatsapp' ? 'WhatsApp' : campaignData.contact_method}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Summary */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Enviados</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {campaignData.sends || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Rastreados</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {campaignData.contacts_tracked || contacts.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Retornaram</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {campaignData.contacts_returned || statusCounts.returned || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Taxa Retorno</p>
              <p className={`text-xl font-bold ${
                (campaignData.return_rate || 0) > 15
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : (campaignData.return_rate || 0) > 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400'
              }`}>
                {formatPercent(campaignData.return_rate || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Receita Recuperada</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(campaignData.total_revenue_recovered || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Todos', count: contacts.length },
              { key: 'returned', label: 'Retornaram', count: statusCounts.returned || 0 },
              { key: 'pending', label: 'Pendentes', count: statusCounts.pending || 0 },
              { key: 'expired', label: 'Expirados', count: statusCounts.expired || 0 }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === key
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="ml-2 text-slate-600 dark:text-slate-400">Carregando contatos...</span>
            </div>
          ) : filteredContacts.length > 0 ? (
            <div className="space-y-2">
              {filteredContacts.map((contact) => {
                const tracking = contact.contact_tracking || {};
                const status = tracking.status || 'pending';

                return (
                  <div
                    key={contact.id}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      {/* Customer Info */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {contact.customer_name || 'Cliente'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </span>
                            )}
                            <span>ID: {contact.customer_id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusLabel(status)}
                        </span>

                        {/* Return details for returned contacts */}
                        {status === 'returned' && (
                          <div className="flex items-center gap-3 text-sm">
                            {tracking.days_to_return !== null && (
                              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                <ArrowRight className="w-3 h-3" />
                                {tracking.days_to_return}d
                              </span>
                            )}
                            {tracking.return_revenue > 0 && (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <DollarSign className="w-3 h-3" />
                                {formatCurrency(tracking.return_revenue)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Sent date */}
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {contact.sent_at && new Date(contact.sent_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                {contacts.length === 0
                  ? 'Nenhum contato registrado para esta campanha'
                  : 'Nenhum contato com este status'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {contacts.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-slate-600 dark:text-slate-400">
                  Média dias para retorno:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {campaignData.avg_days_to_return
                      ? `${campaignData.avg_days_to_return} dias`
                      : '-'}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">
                  {(statusCounts.returned || 0)} de {contacts.length} retornaram
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetailsModal;
