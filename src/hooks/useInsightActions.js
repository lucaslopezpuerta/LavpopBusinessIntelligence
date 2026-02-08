// useInsightActions.js v1.1 - HIGH SEVERITY FIXES
// Maps recommendation actions to contextual modals instead of tab navigation
//
// CHANGELOG:
// v1.1 (2026-02-06): High severity fixes
//   - Customer resolution capped at MAX_MODAL_CUSTOMERS (200) to prevent massive renders
// v1.0 (2026-02-06): Initial implementation
//   - Resolves customerIds from actionData → full customer objects via customerMap
//   - Opens CustomerSegmentModal with the relevant customer segment
//   - Falls back to tab navigation for recommendations without customerIds
//   - Modal config per rule ID (title, color, icon, audienceType)

import { useState, useCallback } from 'react';
import { useContactTracking } from './useContactTracking';
import { ACTION_TO_TAB } from '../utils/recommendationEngine';

// Modal presentation config per rule ID
const MODAL_CONFIG = {
  'CAM-001': {
    title: 'Clientes Precisando de Atenção',
    subtitle: 'Inativos há 25-35 dias',
    color: 'amber',
    audienceType: 'atRisk'
  },
  'CAM-003': {
    title: 'Novos Clientes Aguardando 2ª Visita',
    subtitle: 'Primeira visita, não retornaram',
    color: 'purple',
    audienceType: 'newClients'
  },
  'CHURN-001': {
    title: 'Clientes em Alto Risco de Churn',
    subtitle: 'Probabilidade de retorno < 30%',
    color: 'red',
    audienceType: 'atRisk'
  },
  'DEGRADE-001': {
    title: 'Clientes com Frequência Caindo',
    subtitle: 'VIPs e frequentes esfriando',
    color: 'amber',
    audienceType: 'atRisk'
  },
  'CONVERT-001': {
    title: 'Novos Sem 2ª Visita',
    subtitle: 'Conversão de primeira visita pendente',
    color: 'blue',
    audienceType: 'newClients'
  }
};

// Cap customers sent to modal to prevent massive DOM renders
const MAX_MODAL_CUSTOMERS = 200;

export function useInsightActions({ data, onNavigate }) {
  const [segmentModal, setSegmentModal] = useState(null);
  const { contactedIds, markContacted } = useContactTracking({});

  // Main action handler — decides between modal or navigation
  const handleAction = useCallback((rec) => {
    const { actionData, actionType, ruleId } = rec;

    // Case 1: Has customerIds → resolve to full objects and open modal
    if (actionData?.customerIds?.length > 0 && data?.customerMap) {
      const config = MODAL_CONFIG[ruleId] || {
        title: rec.title,
        subtitle: rec.description,
        color: 'slate',
        audienceType: 'atRisk'
      };

      // Resolve IDs to full customer objects (capped for performance)
      const customers = actionData.customerIds
        .slice(0, MAX_MODAL_CUSTOMERS)
        .map(id => data.customerMap[id])
        .filter(Boolean);

      if (customers.length > 0) {
        const totalCount = actionData.customerIds.length;
        setSegmentModal({
          ...config,
          customers,
          ruleId,
          ...(totalCount > MAX_MODAL_CUSTOMERS && {
            subtitle: `${config.subtitle} (mostrando ${MAX_MODAL_CUSTOMERS} de ${totalCount})`
          })
        });
        return;
      }
    }

    // Case 2: Single customer action (CAM-002, CEL-001) → navigate to directory
    if (actionType === 'view_customer' && actionData?.customerId) {
      onNavigate?.('diretorio');
      return;
    }

    // Case 3: Fallback → navigate to mapped tab
    if (onNavigate && actionType) {
      const tabId = ACTION_TO_TAB[actionType] || actionType;
      onNavigate(tabId);
    }
  }, [data?.customerMap, onNavigate]);

  const closeSegmentModal = useCallback(() => {
    setSegmentModal(null);
  }, []);

  const handleCreateCampaign = useCallback(() => {
    setSegmentModal(null);
    onNavigate?.('campaigns');
  }, [onNavigate]);

  return {
    handleAction,
    segmentModal,
    closeSegmentModal,
    contactedIds,
    markContacted,
    handleCreateCampaign
  };
}

export default useInsightActions;
