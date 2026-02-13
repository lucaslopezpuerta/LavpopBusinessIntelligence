// MessageFlowCard.jsx v1.1 - MESSAGE LIFECYCLE CARD
// Shows complete message lifecycle in one card: identity, campaign context, delivery timeline, outcome
// Design System v6.4 compliant - Cosmic Precision
//
// CHANGELOG:
// v1.1 (2026-02-12): Hover-lift animation
//   - Root div → motion.div with whileHover y:-2 and shadow enhancement
//   - Removed CSS hover:-translate-y-px, using Framer Motion instead
//   - Respects useReducedMotion preference
// v1.0 (2026-02-12): Initial implementation

import React from 'react';
import { motion } from 'framer-motion';
import { User, ThumbsUp, ThumbsDown, Tag, ArrowRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import useReducedMotion from '../../hooks/useReducedMotion';
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

const MessageFlowCard = ({ message, onClick }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

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

  return (
    <motion.div
      onClick={handleClick}
      whileHover={prefersReducedMotion ? {} : { y: -2, boxShadow: isDark ? '0 8px 25px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.12)' }}
      transition={TWEEN.HOVER}
      className={`
        rounded-xl border p-3 sm:p-4 cursor-pointer transition-colors
        ${isDark
          ? 'bg-space-dust border-stellar-cyan/10 hover:border-stellar-cyan/25'
          : 'bg-white border-slate-200 hover:border-purple-300'
        }
      `}
    >
      {/* Desktop: horizontal 4-column layout / Mobile: stacked */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">

        {/* 1. Identity */}
        <div className="flex items-center gap-2.5 sm:w-[22%] sm:min-w-0">
          <div className={`
            w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0
            ${isDark ? 'bg-slate-700' : 'bg-slate-100'}
          `}>
            <User className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm sm:text-base font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {message.customer_name || 'Desconhecido'}
              </span>
              {/* Mobile: show return badge inline with name */}
              <span className="sm:hidden">
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold leading-tight ${returnBadge.color}`}>
                  {returnBadge.label}
                </span>
              </span>
            </div>
            <div className={`text-xs sm:text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-2`}>
              <span>{formatPhone(message.phone)}</span>
              <span className="sm:hidden">{formatDateTime(message.contacted_at)}</span>
            </div>
            {/* Risk badge - shown on a new line on mobile */}
            {message.risk_level && (
              <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-semibold leading-tight ${riskColor}`}>
                {riskLabel}
              </span>
            )}
          </div>
        </div>

        {/* 2. Campaign Context */}
        <div className="sm:w-[28%] sm:min-w-0 space-y-0.5">
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
          <div className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>
            {templateName}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} hidden sm:inline`}>
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
        <div className="sm:w-[28%] sm:min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {deliverySteps.map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${step.dotColor}`} />
                  <span className={`text-xs sm:text-sm font-medium ${step.color}`}>
                    {step.label}
                  </span>
                  {step.time && (
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {step.time}
                    </span>
                  )}
                </div>
                {i < deliverySteps.length - 1 && (
                  <ArrowRight className={`w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Engagement badge */}
          {message.engagement_type && (
            <div className="mt-1">
              {message.engagement_type === 'button_positive' ? (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>
                  <ThumbsUp className="w-2.5 h-2.5" />
                  Interessado
                </span>
              ) : message.engagement_type === 'button_optout' ? (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'}`}>
                  <ThumbsDown className="w-2.5 h-2.5" />
                  Opt-out
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
        <div className="sm:w-[22%] sm:min-w-0 sm:text-right hidden sm:block">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold ${returnBadge.color}`}>
            {returnBadge.label}
          </span>
          {message.status === 'returned' && (
            <div className="mt-0.5 space-y-0.5">
              {message.days_to_return != null && (
                <div className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {message.days_to_return} {message.days_to_return === 1 ? 'dia' : 'dias'}
                </div>
              )}
              {message.return_revenue > 0 && (
                <div className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(message.return_revenue)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageFlowCard;
