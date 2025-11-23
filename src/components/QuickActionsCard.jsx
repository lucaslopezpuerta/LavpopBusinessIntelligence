// QuickActionsCard.jsx v1.0 - QUICK ACTIONS SHORTCUTS
// ✅ Export weekly report
// ✅ Send campaign to at-risk customers
// ✅ Refresh all data
// ✅ Business settings
//
// CHANGELOG:
// v1.0 (2025-11-23): Initial implementation

import React from 'react';
import { FileDown, Send, RefreshCw, Settings } from 'lucide-react';

const QuickActionsCard = ({ onRefresh, onExportReport, onSendCampaign, onOpenSettings }) => {
    const actions = [
        {
            id: 'export',
            label: 'Exportar Relatório',
            icon: FileDown,
            onClick: onExportReport,
            gradient: 'from-blue-500 to-indigo-600',
            gradientDark: 'dark:from-blue-600 dark:to-indigo-700',
            description: 'Baixar relatório semanal em PDF'
        },
        {
            id: 'campaign',
            label: 'Enviar Campanha',
            icon: Send,
            onClick: onSendCampaign,
            gradient: 'from-purple-500 to-violet-600',
            gradientDark: 'dark:from-purple-600 dark:to-violet-700',
            description: 'SMS para clientes em risco'
        },
        {
            id: 'refresh',
            label: 'Atualizar Dados',
            icon: RefreshCw,
            onClick: onRefresh,
            gradient: 'from-emerald-500 to-teal-600',
            gradientDark: 'dark:from-emerald-600 dark:to-teal-700',
            description: 'Recarregar todos os dados'
        },
        {
            id: 'settings',
            label: 'Configurações',
            icon: Settings,
            onClick: onOpenSettings,
            gradient: 'from-slate-500 to-gray-600',
            gradientDark: 'dark:from-slate-600 dark:to-gray-700',
            description: 'Ajustes do negócio'
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ações Rápidas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Atalhos para tarefas comuns
                </p>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => {
                    const Icon = action.icon;

                    return (
                        <button
                            key={action.id}
                            onClick={action.onClick}
                            className={`
                relative overflow-hidden
                bg-gradient-to-br ${action.gradient} ${action.gradientDark}
                rounded-xl p-4
                shadow-md hover:shadow-lg
                transition-all duration-300
                card-lift
                group
                text-left
              `}
                            title={action.description}
                        >
                            {/* Subtle overlay */}
                            <div className="absolute inset-0 bg-white/10 dark:bg-black/10" />

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="w-10 h-10 rounded-lg bg-white/20 dark:bg-black/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-sm font-bold text-white leading-tight">
                                    {action.label}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActionsCard;
