// messageFlowUtils.js v1.0 - Shared utilities for Message Flow Monitor
// Constants, formatters, and helper functions used by MessageFlowCard and MessageFlowDetailModal

// Template display names (Portuguese)
export const TEMPLATE_DISPLAY_NAMES = {
  winback: 'Desconto de Retorno',
  welcome: 'Boas-vindas',
  wallet: 'Lembrete de Saldo',
  post_visit: 'Pós-Visita',
  manual: 'Campanha Manual',
  promo: 'Promoção',
  rfm_loyalty: 'Fidelidade VIP',
  weather: 'Promo Clima',
  anniversary: 'Aniversário',
  churned: 'Última Chance',
  upsell: 'Upsell',
};

// Risk level badge colors
export const RISK_COLORS = {
  'Healthy': 'bg-emerald-600 text-white',
  'Monitor': 'bg-blue-600 text-white',
  'At Risk': 'bg-amber-600 text-white',
  'Churning': 'bg-red-600 text-white',
  'New Customer': 'bg-blue-500 text-white',
  'Lost': 'bg-slate-600 text-white',
};

// Risk level Portuguese labels
export const RISK_LABELS = {
  'Healthy': 'Saudável',
  'Monitor': 'Monitorar',
  'At Risk': 'Em Risco',
  'Churning': 'Crítico',
  'New Customer': 'Novo',
  'Lost': 'Perdido',
};

// Format phone for display: (54) 99612-3456
export const formatPhone = (phone) => {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  const digits = clean.startsWith('55') && clean.length > 11 ? clean.slice(2) : clean;
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

// Format date for display: 09/02 12:04
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
};

// Format time only: 12:04
export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Format currency
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Get delivery steps for timeline
export const getDeliverySteps = (message) => {
  const ds = message.delivery_status || 'pending';
  const steps = [];

  steps.push({
    label: 'Env',
    fullLabel: 'Enviada',
    time: formatTime(message.contacted_at),
    active: true,
    color: 'text-amber-500',
    dotColor: 'bg-amber-500',
  });

  const isDelivered = ['delivered', 'read'].includes(ds);
  steps.push({
    label: 'Ent',
    fullLabel: 'Entregue',
    time: isDelivered ? formatTime(message.updated_at || message.contacted_at) : '',
    active: isDelivered,
    color: isDelivered ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-600',
    dotColor: isDelivered ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
  });

  if (ds === 'failed' || ds === 'undelivered') {
    steps.push({
      label: 'Falhou',
      fullLabel: 'Falhou',
      time: formatTime(message.updated_at),
      active: true,
      color: 'text-red-500',
      dotColor: 'bg-red-500',
    });
  } else {
    const isRead = ds === 'read';
    steps.push({
      label: 'Lida',
      fullLabel: 'Lida',
      time: isRead ? formatTime(message.updated_at || message.contacted_at) : '',
      active: isRead,
      color: isRead ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-600',
      dotColor: isRead ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600',
    });
  }

  return steps;
};

// Return status badge
export const getReturnBadge = (message) => {
  const status = message.status || 'pending';
  switch (status) {
    case 'returned':
      return { label: 'Retornou', color: 'bg-emerald-600 dark:bg-emerald-500 text-white' };
    case 'expired':
      return { label: 'Expirado', color: 'bg-slate-500 dark:bg-slate-600 text-white' };
    case 'cleared':
      return { label: 'Limpo', color: 'bg-blue-600 dark:bg-blue-500 text-white' };
    case 'queued':
      return { label: 'Na Fila', color: 'bg-purple-600 dark:bg-purple-500 text-white' };
    default:
      return { label: 'Pendente', color: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400' };
  }
};

// Source badge (automation vs manual vs priority queue)
export const getSourceBadge = (message) => {
  if (message.priority_source === 'manual_inclusion') {
    return { label: 'FILA', color: 'bg-amber-600 text-white' };
  }
  if (message.campaign_id?.startsWith('AUTO_')) {
    return { label: 'AUTO', color: 'bg-purple-600 text-white' };
  }
  return { label: 'MANUAL', color: 'bg-blue-600 text-white' };
};
