// MessageFlowDetailModal.jsx v1.1 - MESSAGE DETAIL DRILL-DOWN
// Full message lifecycle detail view using BaseModal
// Design System v6.4 compliant - Cosmic Precision
//
// CHANGELOG:
// v1.1 (2026-02-12): Layout polish
//   - Responsive section padding (p-3 sm:p-4) and section gaps (space-y-4 sm:space-y-5)
//   - Explicit section borders in both themes
//   - DetailRow spacing increased to py-1 with subtle row separators
//   - Customer ID shown as subtle badge below name instead of DetailRow
//   - Outcome section: days + revenue as DetailRows below badge
//   - Meta footer with better padding (pt-3) and container styling
//   - Removed duplicate padding (BaseModal v1.4 provides px-4 sm:px-6 pt-4)
// v1.0 (2026-02-12): Initial implementation

import React from 'react';
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
  Hash
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
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

const DetailRow = ({ label, value, isDark, valueClassName = '', isLast = false }) => (
  <div className={`flex items-baseline justify-between gap-2 py-1 ${
    !isLast ? `border-b ${isDark ? 'border-slate-700/30' : 'border-slate-100'}` : ''
  }`}>
    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
    <span className={`text-xs font-medium text-right ${isDark ? 'text-slate-200' : 'text-slate-700'} ${valueClassName}`}>
      {value || '-'}
    </span>
  </div>
);

const MessageFlowDetailModal = ({ message, onClose }) => {
  const { isDark } = useTheme();

  if (!message) return null;

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
    timelineEvents.push({
      label: 'Criado',
      time: formatDateTime(message.created_at),
      icon: Clock,
      color: 'text-slate-400',
      dotColor: 'bg-slate-400',
    });
  }
  if (message.contacted_at) {
    timelineEvents.push({
      label: 'Enviada',
      time: formatDateTime(message.contacted_at),
      icon: Send,
      color: 'text-amber-500',
      dotColor: 'bg-amber-500',
    });
  }

  const ds = message.delivery_status || 'pending';
  if (['delivered', 'read'].includes(ds)) {
    timelineEvents.push({
      label: 'Entregue',
      time: formatDateTime(message.updated_at || message.contacted_at),
      icon: CheckCircle2,
      color: 'text-emerald-500',
      dotColor: 'bg-emerald-500',
    });
  }
  if (ds === 'read') {
    timelineEvents.push({
      label: 'Lida',
      time: formatDateTime(message.updated_at),
      icon: BookOpen,
      color: 'text-cyan-500',
      dotColor: 'bg-cyan-500',
    });
  }
  if (ds === 'failed' || ds === 'undelivered') {
    timelineEvents.push({
      label: 'Falhou',
      time: formatDateTime(message.updated_at),
      icon: AlertCircle,
      color: 'text-red-500',
      dotColor: 'bg-red-500',
      detail: message.delivery_error_message || (message.delivery_error_code ? `Erro ${message.delivery_error_code}` : null),
    });
  }

  // Count detail rows for isLast detection in campaign section
  const campaignRows = [
    { label: 'Template', value: templateName },
    { label: 'Tipo', value: message.campaign_type },
    triggerDesc ? { label: 'Gatilho', value: triggerDesc } : null,
    message.rule_cooldown_days ? { label: 'Cooldown', value: `${message.rule_cooldown_days} dias` } : null,
    (message.send_window_start || message.send_window_end) ? { label: 'Janela', value: `${message.send_window_start || '?'} - ${message.send_window_end || '?'}` } : null,
    message.campaign_id ? { label: 'Campaign ID', value: message.campaign_id, className: 'text-[10px] font-mono' } : null,
  ].filter(Boolean);

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Detalhes da Mensagem"
      subtitle={templateName}
      icon={MessageSquare}
      iconColor="purple"
      solidIconColors
      size="large"
      maxWidth="lg"
    >
      <div className="space-y-4 sm:space-y-5">

        {/* Customer Section */}
        <Section title="Cliente" icon={User} iconColor="text-blue-400" isDark={isDark}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                {message.customer_name || 'Desconhecido'}
              </div>
              {message.customer_id && (
                <div className="mt-0.5 flex items-center gap-1">
                  <Hash className={`w-2.5 h-2.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
        </Section>

        {/* Campaign / Rule Section */}
        <Section title="Campanha" icon={Zap} iconColor="text-purple-400" isDark={isDark}>
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
        </Section>

        {/* Delivery Timeline (vertical) */}
        <Section title="Entrega" icon={Send} iconColor="text-amber-400" isDark={isDark}>
          <div className="space-y-0">
            {timelineEvents.map((event, i) => {
              const EventIcon = event.icon;
              return (
                <div key={i} className="flex items-start gap-3 relative">
                  {/* Vertical line */}
                  {i < timelineEvents.length - 1 && (
                    <div className={`absolute left-[9px] top-5 bottom-0 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  )}
                  {/* Dot */}
                  <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 z-10 ${event.dotColor}`}>
                    <EventIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${event.color}`}>{event.label}</span>
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{event.time}</span>
                    </div>
                    {event.detail && (
                      <div className={`text-[10px] mt-0.5 px-2 py-1 rounded ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                        {event.detail}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Engagement Section */}
        {message.engagement_type && (
          <Section title="Engajamento" icon={ThumbsUp} iconColor="text-emerald-400" isDark={isDark}>
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
          </Section>
        )}

        {/* Outcome Section */}
        <Section title="Resultado" icon={ArrowDownRight} iconColor="text-emerald-400" isDark={isDark}>
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
                  valueClassName="text-sm font-bold text-emerald-600 dark:text-emerald-400"
                  isLast
                />
              )}
            </>
          )}
          {message.returned_at && (
            <DetailRow
              label="Retornou em"
              value={formatDateTime(message.returned_at)}
              isDark={isDark}
            />
          )}
          {message.expires_at && (
            <DetailRow
              label="Expira em"
              value={formatDateTime(message.expires_at)}
              isDark={isDark}
              isLast
            />
          )}
        </Section>

        {/* Notes */}
        {message.notes && (
          <Section title="Notas" icon={Calendar} iconColor="text-slate-400" isDark={isDark}>
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{message.notes}</p>
          </Section>
        )}

        {/* Meta (IDs) */}
        <div className={`rounded-xl p-3 border ${isDark ? 'bg-space-nebula/30 border-slate-700/30' : 'bg-slate-50/50 border-slate-100'}`}>
          <div className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-300'} space-y-0.5`}>
            <div>ID: {message.id}</div>
            {message.twilio_sid && <div>Twilio SID: {message.twilio_sid}</div>}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default MessageFlowDetailModal;
