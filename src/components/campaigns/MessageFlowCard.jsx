// MessageFlowCard.jsx v2.0 - MESSAGE LIFECYCLE CARD (MOBILE UX OVERHAUL)
// Shows complete message lifecycle in one card: identity, campaign context, delivery timeline, outcome
// Design System v6.4 compliant - Cosmic Precision
//
// CHANGELOG:
// v2.0 (2026-02-13): Mobile UX overhaul
//   - Separate MobileCardLayout with information hierarchy (name → context → timeline → outcome)
//   - Removed generic User avatar on mobile (wastes space, adds no info)
//   - Return badge visible in mobile row 1 (was hidden sm:block in desktop Outcome column)
//   - Risk badge inline with name (was separate line)
//   - ChevronRight tap affordance on right edge
//   - whileTap scale feedback for touch interaction
//   - Engagement badge compact (icon only) on mobile
//   - Revenue row shown only when returned
//   - Desktop layout unchanged
// v1.1 (2026-02-12): Hover-lift animation
// v1.0 (2026-02-12): Initial implementation

import React from 'react';
import { motion } from 'framer-motion';
import { User, ThumbsUp, ThumbsDown, Tag, ArrowRight, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import useReducedMotion from '../../hooks/useReducedMotion';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { haptics } from '../../utils/haptics';
import { TWEEN } from '../../constants/animations';
import {
  TEMPLATE_DISPLAY_NAMES,
  RISK_COLORS,
  RISK_LABELS,
  formatPhone,
  formatDateTime,
  formatCurrency,
  getDeliverySteps,
  getReturnBadge,
  getSourceBadge,
} from './messageFlowUtils';

// ==================== MOBILE CARD LAYOUT ====================

const MobileCardLayout = ({ message, returnBadge, sourceBadge, deliverySteps, templateName, riskColor, riskLabel, coupon, discount, isDark }) => (
  <div className="flex items-start gap-2">
    <div className="flex-1 min-w-0 space-y-1.5">
      {/* Row 1: Name + Risk + Return badge */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-sm font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {message.customer_name || 'Desconhecido'}
        </span>
        {message.risk_level && (
          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold leading-tight flex-shrink-0 ${riskColor}`}>
            {riskLabel}
          </span>
        )}
        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold leading-tight flex-shrink-0 ${returnBadge.color}`}>
          {returnBadge.label}
        </span>
      </div>

      {/* Row 2: Source + Template + Date */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className={`inline-block px-1.5 py-0.5 rounded font-bold leading-tight flex-shrink-0 ${sourceBadge.color}`}>
          {sourceBadge.label}
        </span>
        <span className={`truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {templateName}
        </span>
        <span className={`flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {formatDateTime(message.contacted_at)}
        </span>
      </div>

      {/* Row 3: Delivery timeline + engagement icon */}
      <div className="flex items-center gap-1 flex-wrap">
        {deliverySteps.map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-0.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${step.dotColor}`} />
              <span className={`text-xs font-medium ${step.color}`}>{step.label}</span>
            </div>
            {i < deliverySteps.length - 1 && (
              <ArrowRight className={`w-2.5 h-2.5 flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            )}
          </React.Fragment>
        ))}
        {/* Engagement badge inline (icon only for compact) */}
        {message.engagement_type && (
          <span className={`ml-1 inline-flex items-center gap-0.5 text-xs font-medium px-1 py-0.5 rounded ${
            message.engagement_type === 'button_positive'
              ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
              : message.engagement_type === 'button_optout'
                ? isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
                : isDark ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-100 text-slate-600'
          }`}>
            {message.engagement_type === 'button_positive' ? <ThumbsUp className="w-2.5 h-2.5" /> :
             message.engagement_type === 'button_optout' ? <ThumbsDown className="w-2.5 h-2.5" /> : 'Resp'}
          </span>
        )}
      </div>

      {/* Row 4: Revenue (only if returned) */}
      {message.status === 'returned' && message.return_revenue > 0 && (
        <div className="flex items-center gap-2 text-xs">
          {message.days_to_return != null && (
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {message.days_to_return}d
            </span>
          )}
          <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {formatCurrency(message.return_revenue)}
          </span>
        </div>
      )}

      {/* Coupon tag */}
      {coupon && (
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
          <Tag className="w-2.5 h-2.5" />
          {coupon}{discount ? ` (-${discount}%)` : ''}
        </span>
      )}
    </div>

    {/* Chevron tap affordance */}
    <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
  </div>
);

// ==================== DESKTOP CARD LAYOUT ====================

const DesktopCardLayout = ({ message, returnBadge, sourceBadge, deliverySteps, templateName, riskColor, riskLabel, ruleName, coupon, discount, isDark }) => (
  <div className="flex items-center gap-4">
    {/* 1. Identity */}
    <div className="flex items-center gap-2.5 w-[22%] min-w-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
        <User className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <span className={`text-base font-medium truncate block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {message.customer_name || 'Desconhecido'}
        </span>
        <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {formatPhone(message.phone)}
        </span>
        {message.risk_level && (
          <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-semibold leading-tight ${riskColor}`}>
            {riskLabel}
          </span>
        )}
      </div>
    </div>

    {/* 2. Campaign Context */}
    <div className="w-[28%] min-w-0 space-y-0.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold leading-tight ${sourceBadge.color}`}>
          {sourceBadge.label}
        </span>
        {ruleName && (
          <span className={`text-xs font-medium truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {ruleName}
          </span>
        )}
      </div>
      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>
        {templateName}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {formatDateTime(message.contacted_at)}
        </span>
        {coupon && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
            <Tag className="w-2.5 h-2.5" />
            {coupon}{discount ? ` (-${discount}%)` : ''}
          </span>
        )}
      </div>
    </div>

    {/* 3. Delivery Timeline */}
    <div className="w-[28%] min-w-0">
      <div className="flex items-center gap-1.5">
        {deliverySteps.map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${step.dotColor}`} />
              <span className={`text-sm font-medium ${step.color}`}>{step.label}</span>
              {step.time && (
                <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{step.time}</span>
              )}
            </div>
            {i < deliverySteps.length - 1 && (
              <ArrowRight className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      {message.engagement_type && (
        <div className="mt-1">
          {message.engagement_type === 'button_positive' ? (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>
              <ThumbsUp className="w-2.5 h-2.5" /> Interessado
            </span>
          ) : message.engagement_type === 'button_optout' ? (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'}`}>
              <ThumbsDown className="w-2.5 h-2.5" /> Opt-out
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              Resposta
            </span>
          )}
        </div>
      )}
    </div>

    {/* 4. Outcome */}
    <div className="w-[22%] min-w-0 text-right">
      <span className={`inline-block px-2.5 py-1 rounded-full text-sm font-semibold ${returnBadge.color}`}>
        {returnBadge.label}
      </span>
      {message.status === 'returned' && (
        <div className="mt-0.5 space-y-0.5">
          {message.days_to_return != null && (
            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {message.days_to_return} {message.days_to_return === 1 ? 'dia' : 'dias'}
            </div>
          )}
          {message.return_revenue > 0 && (
            <div className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {formatCurrency(message.return_revenue)}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const MessageFlowCard = ({ message, onClick }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const deliverySteps = getDeliverySteps(message);
  const returnBadge = getReturnBadge(message);
  const sourceBadge = getSourceBadge(message);
  const templateName = TEMPLATE_DISPLAY_NAMES[message.campaign_type] || message.campaign_name || '-';
  const riskColor = RISK_COLORS[message.risk_level] || 'bg-slate-500 text-white';
  const riskLabel = RISK_LABELS[message.risk_level] || message.risk_level || '-';
  const ruleName = message.rule_name || (message.campaign_id?.startsWith('AUTO_') ? message.campaign_id.replace('AUTO_', '') : null);
  const coupon = message.rule_coupon_code || null;
  const discount = message.rule_discount_percent || null;

  const handleClick = () => {
    haptics.light();
    onClick?.(message);
  };

  const sharedProps = { message, returnBadge, sourceBadge, deliverySteps, templateName, riskColor, riskLabel, coupon, discount, isDark };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={prefersReducedMotion ? {} : { y: -2, boxShadow: isDark ? '0 8px 25px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.12)' }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      transition={TWEEN.HOVER}
      className={`
        rounded-xl border p-3 sm:p-4 cursor-pointer transition-colors
        ${isDark
          ? 'bg-space-dust border-stellar-cyan/10 hover:border-stellar-cyan/25'
          : 'bg-white border-slate-200 hover:border-purple-300'
        }
      `}
    >
      {isMobile ? (
        <MobileCardLayout {...sharedProps} />
      ) : (
        <DesktopCardLayout {...sharedProps} ruleName={ruleName} />
      )}
    </motion.div>
  );
};

export default MessageFlowCard;
