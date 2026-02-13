// MessageFlowDetailModal.jsx v2.0 - MESSAGE DETAIL DRILL-DOWN (MOBILE UX OVERHAUL)
// Full message lifecycle detail view using BaseModal
// Design System v6.4 compliant - Cosmic Precision
//
// CHANGELOG:
// v2.0 (2026-02-13): Mobile UX overhaul
//   - Collapsible sections on mobile (Campanha, Engajamento, Notas collapsed by default)
//   - Quick action buttons: Copy phone, Open WhatsApp
//   - Prev/Next message navigation via BaseModal headerActions
//   - Meta section hidden behind "Detalhes tecnicos" toggle
//   - Fixed all text-[10px] → text-xs minimum
//   - DetailRow value text-xs sm:text-sm for better readability
// v1.1 (2026-02-12): Layout polish
// v1.0 (2026-02-12): Initial implementation

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Zap,
  Clock,
  Send,
  CheckCircle2,
  BookOpen,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowDownRight,
  Tag,
  Calendar,
  Phone,
  MessageSquare,
  Hash,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { haptics } from '../../utils/haptics';
import BaseModal from '../ui/BaseModal';
import {
  TEMPLATE_DISPLAY_NAMES,
  RISK_COLORS,
  RISK_LABELS,
  formatPhone,
  formatDateTime,
  formatCurrency,
  getSourceBadge,
  getReturnBadge,
} from './messageFlowUtils';

// Trigger type descriptions (Portuguese)
const TRIGGER_DESCRIPTIONS = {
  days_since_visit: (val) => `${val}+ dias sem visita`,
  first_purchase: () => 'Primeira visita',
  wallet_balance: (val) => `Saldo >= R$ ${val}`,
  hours_after_visit: (val) => `${val}h após visita`,
};

// ==================== SECTION COMPONENTS ====================

const Section = ({ title, icon, iconColor = 'text-slate-400', children, isDark }) => {
  const Icon = icon;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </span>
      </div>
      <div className={`rounded-xl p-3 sm:p-4 border ${isDark ? 'bg-space-nebula/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
        {children}
      </div>
    </div>
  );
};

const CollapsibleSection = ({ id, title, icon, iconColor = 'text-slate-400', isDark, isExpanded, onToggle, children }) => {
  const Icon = icon;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => { haptics.tick(); onToggle(id); }}
        className="w-full flex items-center gap-2 group min-h-[44px]"
      >
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'} ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            className="overflow-hidden"
          >
            <div className={`rounded-xl p-3 sm:p-4 border ${isDark ? 'bg-space-nebula/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailRow = ({ label, value, isDark, valueClassName = '', isLast = false }) => (
  <div className={`flex items-baseline justify-between gap-2 py-1 ${
    !isLast ? `border-b ${isDark ? 'border-slate-700/30' : 'border-slate-100'}` : ''
  }`}>
    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
    <span className={`text-xs sm:text-sm font-medium text-right ${isDark ? 'text-slate-200' : 'text-slate-700'} ${valueClassName}`}>
      {value || '-'}
    </span>
  </div>
);

// ==================== MAIN COMPONENT ====================

const MessageFlowDetailModal = ({ message, onClose, messages = [], onNavigate }) => {
  const { isDark } = useTheme();
  const toast = useToast();
  const isMobile = useIsMobile();

  // Collapsible section state — primary sections always expanded, secondary collapsed on mobile
  const [expandedSections, setExpandedSections] = useState(new Set(['customer', 'delivery', 'outcome']));
  const [showMeta, setShowMeta] = useState(false);

  if (!message) return null;

  const toggleSection = (id) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Navigation
  const currentIndex = messages.findIndex(m => m.id === message.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < messages.length - 1;

  const goTo = (direction) => {
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < messages.length) {
      haptics.tick();
      onNavigate?.(messages[nextIndex]);
    }
  };

  // Quick actions
  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(message.phone || '');
      haptics.success();
      toast.success('Telefone copiado');
    } catch {
      haptics.error();
      toast.error('Erro ao copiar');
    }
  };

  const handleWhatsAppOpen = () => {
    const cleanPhone = (message.phone || '').replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}`, '_blank');
    haptics.light();
  };

  // Derived data
  const sourceBadge = getSourceBadge(message);
  const returnBadge = getReturnBadge(message);
  const riskColor = RISK_COLORS[message.risk_level] || 'bg-slate-500 text-white';
  const riskLabel = RISK_LABELS[message.risk_level] || message.risk_level || '-';
  const templateName = TEMPLATE_DISPLAY_NAMES[message.campaign_type] || message.campaign_name || '-';
  const triggerDesc = message.trigger_type
    ? (TRIGGER_DESCRIPTIONS[message.trigger_type]?.(message.trigger_value) || `${message.trigger_type}: ${message.trigger_value}`)
    : null;

  // Build delivery timeline events
  const timelineEvents = [];
  if (message.created_at) {
    timelineEvents.push({ label: 'Criado', time: formatDateTime(message.created_at), icon: Clock, color: 'text-slate-400', dotColor: 'bg-slate-400' });
  }
  if (message.contacted_at) {
    timelineEvents.push({ label: 'Enviada', time: formatDateTime(message.contacted_at), icon: Send, color: 'text-amber-500', dotColor: 'bg-amber-500' });
  }
  const ds = message.delivery_status || 'pending';
  if (['delivered', 'read'].includes(ds)) {
    timelineEvents.push({ label: 'Entregue', time: formatDateTime(message.updated_at || message.contacted_at), icon: CheckCircle2, color: 'text-emerald-500', dotColor: 'bg-emerald-500' });
  }
  if (ds === 'read') {
    timelineEvents.push({ label: 'Lida', time: formatDateTime(message.updated_at), icon: BookOpen, color: 'text-cyan-500', dotColor: 'bg-cyan-500' });
  }
  if (ds === 'failed' || ds === 'undelivered') {
    timelineEvents.push({
      label: 'Falhou', time: formatDateTime(message.updated_at), icon: AlertCircle, color: 'text-red-500', dotColor: 'bg-red-500',
      detail: message.delivery_error_message || (message.delivery_error_code ? `Erro ${message.delivery_error_code}` : null),
    });
  }

  // Campaign detail rows
  const campaignRows = [
    { label: 'Template', value: templateName },
    { label: 'Tipo', value: message.campaign_type },
    triggerDesc ? { label: 'Gatilho', value: triggerDesc } : null,
    message.rule_cooldown_days ? { label: 'Cooldown', value: `${message.rule_cooldown_days} dias` } : null,
    (message.send_window_start || message.send_window_end) ? { label: 'Janela', value: `${message.send_window_start || '?'} - ${message.send_window_end || '?'}` } : null,
    message.campaign_id ? { label: 'Campaign ID', value: message.campaign_id, className: 'text-xs font-mono' } : null,
  ].filter(Boolean);

  // Section renderer: collapsible on mobile, always visible on desktop
  const renderSection = (id, title, icon, iconColor, children, isPrimary = false) => {
    if (!isMobile || isPrimary) {
      return <Section title={title} icon={icon} iconColor={iconColor} isDark={isDark}>{children}</Section>;
    }
    return (
      <CollapsibleSection
        id={id}
        title={title}
        icon={icon}
        iconColor={iconColor}
        isDark={isDark}
        isExpanded={expandedSections.has(id)}
        onToggle={toggleSection}
      >
        {children}
      </CollapsibleSection>
    );
  };

  // Header actions: prev/next navigation
  const headerActions = messages.length > 1 && onNavigate ? (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => goTo(-1)}
        disabled={!hasPrev}
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center ${
          isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
        }`}
        aria-label="Mensagem anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className={`text-xs tabular-nums ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {currentIndex + 1}/{messages.length}
      </span>
      <button
        type="button"
        onClick={() => goTo(1)}
        disabled={!hasNext}
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center ${
          isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
        }`}
        aria-label="Proxima mensagem"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  ) : null;

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Detalhes da Mensagem"
      subtitle={templateName}
      icon={MessageSquare}
      iconColor="purple"
      solidIconColors
      size="full"
      maxWidth="lg"
      headerActions={headerActions}
    >
      <div className="space-y-4 sm:space-y-5">

        {/* Customer Section — always expanded */}
        {renderSection('customer', 'Cliente', User, 'text-blue-400', (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  {message.customer_name || 'Desconhecido'}
                </div>
                {message.customer_id && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <Hash className={`w-2.5 h-2.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                    <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {message.customer_id}
                    </span>
                  </div>
                )}
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-1 mt-0.5`}>
                  <Phone className="w-3 h-3" />
                  {formatPhone(message.phone)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {message.risk_level && (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${riskColor}`}>
                    {riskLabel}
                  </span>
                )}
              </div>
            </div>
            {/* Quick actions */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleCopyPhone}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                  isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Copy className="w-3 h-3" />
                Copiar
              </button>
              <button
                type="button"
                onClick={handleWhatsAppOpen}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                  isDark
                    ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <ExternalLink className="w-3 h-3" />
                WhatsApp
              </button>
            </div>
          </>
        ), true)}

        {/* Campaign / Rule Section — collapsible on mobile */}
        {renderSection('campaign', 'Campanha', Zap, 'text-purple-400', (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${sourceBadge.color}`}>
                {sourceBadge.label}
              </span>
              <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {message.rule_name || message.campaign_name || message.campaign_id || '-'}
              </span>
            </div>
            {campaignRows.map((row, i) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={row.value}
                isDark={isDark}
                valueClassName={row.className || ''}
                isLast={i === campaignRows.length - 1}
              />
            ))}
            {message.rule_coupon_code && (
              <div className="flex items-center gap-2 mt-2">
                <Tag className={`w-3.5 h-3.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  {message.rule_coupon_code}
                  {message.rule_discount_percent ? ` (-${message.rule_discount_percent}%)` : ''}
                </span>
              </div>
            )}
          </>
        ))}

        {/* Delivery Timeline — always expanded */}
        {renderSection('delivery', 'Entrega', Send, 'text-amber-400', (
          <div className="space-y-0">
            {timelineEvents.map((event, i) => {
              const EventIcon = event.icon;
              return (
                <div key={i} className="flex items-start gap-3 relative">
                  {i < timelineEvents.length - 1 && (
                    <div className={`absolute left-[9px] top-5 bottom-0 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  )}
                  <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 z-10 ${event.dotColor}`}>
                    <EventIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="flex-1 pb-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${event.color}`}>{event.label}</span>
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{event.time}</span>
                    </div>
                    {event.detail && (
                      <div className={`text-xs mt-0.5 px-2 py-1 rounded ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                        {event.detail}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ), true)}

        {/* Engagement Section — collapsible on mobile */}
        {message.engagement_type && renderSection('engagement', 'Engajamento', ThumbsUp, 'text-emerald-400', (
          <div className="flex items-center gap-2">
            {message.engagement_type === 'button_positive' ? (
              <>
                <ThumbsUp className="w-4 h-4 text-emerald-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  Interessado
                </span>
              </>
            ) : message.engagement_type === 'button_optout' ? (
              <>
                <ThumbsDown className="w-4 h-4 text-red-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  Opt-out (sem interesse)
                </span>
              </>
            ) : (
              <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {message.engagement_type}
              </span>
            )}
          </div>
        ))}

        {/* Outcome Section — always expanded */}
        {renderSection('outcome', 'Resultado', ArrowDownRight, 'text-emerald-400', (
          <>
            <div className="mb-1">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${returnBadge.color}`}>
                {returnBadge.label}
              </span>
            </div>
            {message.status === 'returned' && (
              <>
                {message.days_to_return != null && (
                  <DetailRow
                    label="Tempo de retorno"
                    value={`${message.days_to_return} ${message.days_to_return === 1 ? 'dia' : 'dias'}`}
                    isDark={isDark}
                  />
                )}
                {message.return_revenue > 0 && (
                  <DetailRow
                    label="Receita"
                    value={formatCurrency(message.return_revenue)}
                    isDark={isDark}
                    valueClassName={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
                    isLast
                  />
                )}
              </>
            )}
            {message.returned_at && (
              <DetailRow label="Retornou em" value={formatDateTime(message.returned_at)} isDark={isDark} />
            )}
            {message.expires_at && (
              <DetailRow label="Expira em" value={formatDateTime(message.expires_at)} isDark={isDark} isLast />
            )}
          </>
        ), true)}

        {/* Notes — collapsible on mobile */}
        {message.notes && renderSection('notes', 'Notas', Calendar, 'text-slate-400', (
          <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{message.notes}</p>
        ))}

        {/* Meta (IDs) — hidden behind toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowMeta(!showMeta)}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
              isDark ? 'text-slate-600 hover:text-slate-400 hover:bg-space-nebula/30' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50/50'
            }`}
          >
            {showMeta ? 'Ocultar detalhes' : 'Detalhes tecnicos'}
          </button>
          {showMeta && (
            <div className={`mt-1 rounded-xl p-3 border ${isDark ? 'bg-space-nebula/30 border-slate-700/30' : 'bg-slate-50/50 border-slate-100'}`}>
              <div className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'} space-y-0.5 font-mono`}>
                <div>ID: {message.id}</div>
                {message.twilio_sid && <div>SID: {message.twilio_sid}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default MessageFlowDetailModal;
