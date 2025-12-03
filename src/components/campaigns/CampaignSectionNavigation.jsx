// CampaignSectionNavigation.jsx v1.0
// Tab navigation for Campaigns view
// Design System v3.1 compliant

import React from 'react';
import { Target, Zap, Users, MessageSquare, History } from 'lucide-react';

const CampaignSectionNavigation = ({ activeSection, onSectionChange }) => {
  const sections = [
    { id: 'overview', label: 'Visão Geral', icon: Target, mobileLabel: 'Geral' },
    { id: 'automations', label: 'Automações', icon: Zap, mobileLabel: 'Auto' },
    { id: 'audience', label: 'Audiência', icon: Users, mobileLabel: 'Público' },
    { id: 'templates', label: 'Mensagens', icon: MessageSquare, mobileLabel: 'Msgs' },
    { id: 'history', label: 'Histórico', icon: History, mobileLabel: 'Hist' }
  ];

  return (
    <nav
      className="sticky top-14 lg:top-[60px] z-40 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800"
      aria-label="Navegação de seções de campanhas"
    >
      <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`
                flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg
                text-xs sm:text-sm font-medium whitespace-nowrap
                transition-all duration-200
                ${isActive
                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
              aria-current={isActive ? 'true' : undefined}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{section.label}</span>
              <span className="sm:hidden">{section.mobileLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CampaignSectionNavigation;
