// AutomationPerformance.jsx v1.1 - Automation Rule Performance Analytics
// Per-rule delivery, return rates, revenue recovered, timeline
// Design System v6.4 compliant - Cosmic Precision
//
// DATA SOURCES:
// - automation_rules (rule config: name, trigger_type, enabled, coupon, discount)
// - automation_sends (per-send records: rule_id, customer_id, sent_at) - used for timeline only
// - contact_tracking (delivery + return tracking: campaign_id, delivery_status, returned, revenue)
//
// FEATURES:
// - Summary KPI cards (total sends, overall return rate, revenue recovered, active rules)
// - Best automation highlight card with green glow accent
// - Per-rule cards: name, sends, delivery rate, return rate, revenue, enabled badge
// - Stacked bar chart showing daily sends over time per automation rule
// - Comparison between rules to identify best performer
// - Responsive table (desktop) / card list (mobile)
// - Portuguese labels (Brazilian app)
// - Skeleton loading state, null on empty data
//
// CHANGELOG:
// v1.1 (2026-02-14): Fix zero metrics - 3 join bugs
//   - Fix: delivery rate now uses contact_tracking.delivery_status (webhooks update this, not automation_sends)
//   - Fix: campaign_id join uses 'AUTO_' + rule.id prefix (matches contact_tracking convention)
//   - Fix: removed broken trigger_type -> campaign_type matching (incompatible value domains)
// v1.0 (2026-02-09): Initial implementation
//   - Fetches automation_rules, automation_sends (90d), contact_tracking (90d)
//   - Client-side join: groups sends by rule_id, matches contacts by campaign_type
//   - KPI summary row with 4 cards
//   - Best rule highlight card with green glow
//   - Recharts stacked BarChart (daily sends per rule)
//   - Responsive table (desktop) / card list (mobile)
//   - Skeleton loading, null on empty

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bot,
  Zap,
  Send,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Info,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useIsMobile, useMediaQuery } from '../../hooks/useMediaQuery';
import { getSupabaseClient } from '../../utils/supabaseClient';

// ---------------------------------------------------------------------------
// Constants & Formatters
// ---------------------------------------------------------------------------

const NUMBER_FMT = new Intl.NumberFormat('pt-BR');

const PERCENT_FMT = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

const CURRENCY_FMT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const CURRENCY_SHORT_FMT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

/** Minimum sends to qualify for "best automation" highlight */
const MIN_SENDS_FOR_BEST = 5;

/** Lookback period in days for data queries */
const LOOKBACK_DAYS = 90;

/** Per-rule chart colors (distinct, accessible) */
const RULE_COLORS_DARK = [
  '#00aeef', // stellar cyan
  '#a78bfa', // purple
  '#00d68f', // cosmic green
  '#fbbf24', // amber
  '#f472b6', // pink
  '#60a5fa', // blue
  '#34d399', // emerald
  '#fb923c', // orange
];
const RULE_COLORS_LIGHT = [
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#3b82f6', // blue
  '#059669', // emerald dark
  '#ea580c', // orange
];

/**
 * Humanize an automation rule ID for display
 * e.g. "winback_30" -> "Winback 30", "welcome_new" -> "Welcome New"
 */
function humanizeRuleName(name) {
  if (!name) return '--';
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a date string as DD/MM
 */
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Extract YYYY-MM-DD date string from an ISO timestamp, adjusted for Brazil timezone
 */
function extractDateKey(isoTimestamp) {
  if (!isoTimestamp) return null;
  try {
    const d = new Date(isoTimestamp);
    // Format in Brazil timezone to get the correct local date
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
    return parts; // en-CA yields YYYY-MM-DD
  } catch {
    return isoTimestamp.slice(0, 10);
  }
}

/**
 * Return rate color tier
 */
function getReturnRateColor(rate) {
  if (rate >= 30) return 'green';
  if (rate >= 15) return 'amber';
  return 'red';
}

/**
 * Delivery rate color tier
 */
function getDeliveryRateColor(rate) {
  if (rate >= 90) return 'green';
  if (rate >= 70) return 'amber';
  return 'red';
}

/**
 * Get Tailwind text color class by tier
 */
function getTierTextColor(tier) {
  switch (tier) {
    case 'green': return 'text-emerald-600 dark:text-emerald-400';
    case 'amber': return 'text-amber-600 dark:text-amber-400';
    case 'red': return 'text-red-600 dark:text-red-400';
    default: return 'text-slate-600 dark:text-slate-400';
  }
}

/**
 * Get progress bar fill class by tier
 */
function getProgressBarFill(tier) {
  switch (tier) {
    case 'green': return 'bg-emerald-500';
    case 'amber': return 'bg-amber-500';
    case 'red': return 'bg-red-500';
    default: return 'bg-slate-400';
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Skeleton placeholder while data loads */
const LoadingSkeleton = ({ isDark }) => (
  <div
    className={`
      ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
      backdrop-blur-xl rounded-2xl p-5
      ${isDark
        ? 'ring-1 ring-white/[0.05]'
        : 'ring-1 ring-slate-200/80'}
      overflow-hidden
    `}
  >
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-xl animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className="flex-1 space-y-2">
        <div className={`h-4 w-52 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-3 w-36 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-200/70'}`} />
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`h-20 rounded-xl animate-pulse ${isDark ? 'bg-slate-700/40' : 'bg-slate-100'}`} />
      ))}
    </div>
    <div className={`h-28 rounded-xl animate-pulse mb-5 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/80'}`} />
    <div className={`h-52 rounded-xl animate-pulse mb-5 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/80'}`} />
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`h-14 rounded-lg animate-pulse ${isDark ? 'bg-slate-700/30' : 'bg-slate-100/80'}`} />
      ))}
    </div>
  </div>
);

/** Rate progress bar (delivery or return) */
const RateBar = ({ rate, tier, isDark }) => {
  const fillClass = getProgressBarFill(tier);
  const clampedWidth = Math.min(100, Math.max(0, rate));

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className={`
          flex-1 h-2 rounded-full overflow-hidden
          ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200/80'}
        `}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillClass}`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums whitespace-nowrap ${getTierTextColor(tier)}`}>
        {PERCENT_FMT.format(rate)}%
      </span>
    </div>
  );
};

/** Custom tooltip for the stacked bar chart */
const TimelineTooltip = ({ active, payload, label, isDark, ruleColorMap }) => {
  if (!active || !payload || !payload.length) return null;

  const totalSends = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

  return (
    <div
      className={`
        px-3 py-2 rounded-lg text-xs shadow-lg max-w-[220px]
        ${isDark
          ? 'bg-space-nebula/95 border border-stellar-cyan/20 text-white'
          : 'bg-white/95 border border-slate-200 text-slate-800'}
      `}
    >
      <p className="font-semibold mb-1.5">{formatShortDate(label)}</p>
      {payload
        .filter((entry) => entry.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-1.5 mb-0.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="truncate">{humanizeRuleName(entry.dataKey)}</span>
            <span className="ml-auto font-semibold tabular-nums">{entry.value}</span>
          </div>
        ))
      }
      <div className={`mt-1.5 pt-1.5 border-t ${isDark ? 'border-white/10' : 'border-slate-200'} font-semibold`}>
        Total: {NUMBER_FMT.format(totalSends)}
      </div>
    </div>
  );
};

/** Best automation highlight card */
const BestRuleCard = ({ rule, isDark, isDesktop }) => {
  if (!rule) return null;

  return (
    <div
      className={`
        relative p-4 rounded-xl mb-5 overflow-hidden
        ${isDark
          ? 'bg-gradient-to-br from-emerald-950/40 via-space-dust to-space-nebula/30 ring-1 ring-emerald-500/20 shadow-[0_0_24px_-6px_rgba(0,214,143,0.15)]'
          : 'bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 ring-1 ring-emerald-200/60 shadow-[0_0_24px_-6px_rgba(16,185,129,0.12)]'}
      `}
    >
      {/* Subtle glow accent */}
      <div
        className={`
          absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none
          ${isDark ? 'bg-emerald-500' : 'bg-emerald-400'}
        `}
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-3">
        {/* Award icon */}
        <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
          <Award className="w-5 h-5 text-white" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium tracking-wider text-emerald-700 dark:text-emerald-400">
              Melhor Automacao
            </p>
          </div>
          <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold text-slate-900 dark:text-white truncate`}>
            {rule.displayName}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {rule.triggerType ? humanizeRuleName(rule.triggerType) : 'Automacao'} &bull; {rule.enabled ? 'Ativa' : 'Pausada'}
          </p>

          {/* Metrics row */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Envios</p>
              <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {NUMBER_FMT.format(rule.totalSends)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Entrega</p>
              <p className={`text-sm font-bold tabular-nums ${getTierTextColor(getDeliveryRateColor(rule.deliveryRate))}`}>
                {PERCENT_FMT.format(rule.deliveryRate)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Retorno</p>
              <p className={`text-sm font-bold tabular-nums ${getTierTextColor(getReturnRateColor(rule.returnRate))}`}>
                {PERCENT_FMT.format(rule.returnRate)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Receita</p>
              <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {CURRENCY_SHORT_FMT.format(rule.revenueRecovered)}
              </p>
            </div>
          </div>

          {/* Return rate bar */}
          <div className="mt-3">
            <RateBar
              rate={rule.returnRate}
              tier={getReturnRateColor(rule.returnRate)}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/** Mobile card for a single automation rule */
const RuleCard = ({ rule, isBest, isDark }) => {
  const deliveryTier = getDeliveryRateColor(rule.deliveryRate);
  const returnTier = getReturnRateColor(rule.returnRate);

  return (
    <div
      className={`
        p-4 rounded-xl
        ${isBest ? 'border-l-[3px] border-l-emerald-500' : ''}
        ${isDark
          ? 'bg-gradient-to-br from-space-dust via-space-dust to-space-nebula/30 ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]'
          : 'bg-gradient-to-br from-white via-white to-slate-50/50 ring-1 ring-slate-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'}
        shadow-sm
      `}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[60%]">
          {rule.displayName}
        </span>
        <div className="flex items-center gap-1.5">
          {isBest && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Award className="w-3.5 h-3.5" aria-hidden="true" />
              Melhor
            </span>
          )}
          {/* Enabled/Disabled badge */}
          <span
            className={`
              inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium
              ${rule.enabled
                ? (isDark ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200')
                : (isDark ? 'bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200')
              }
            `}
          >
            {rule.enabled ? (
              <ToggleRight className="w-3 h-3" aria-hidden="true" />
            ) : (
              <ToggleLeft className="w-3 h-3" aria-hidden="true" />
            )}
            {rule.enabled ? 'Ativa' : 'Pausada'}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {rule.triggerType ? humanizeRuleName(rule.triggerType) : '--'}
        {rule.couponCode ? ` | Cupom: ${rule.couponCode}` : ''}
        {rule.discountPercent ? ` (${rule.discountPercent}%)` : ''}
      </p>

      {/* Delivery rate bar */}
      <div className="mb-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Taxa Entrega</p>
        <RateBar rate={rule.deliveryRate} tier={deliveryTier} isDark={isDark} />
      </div>

      {/* Return rate bar */}
      <div className="mb-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Taxa Retorno</p>
        <RateBar rate={rule.returnRate} tier={returnTier} isDark={isDark} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Envios</span>
          <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
            {NUMBER_FMT.format(rule.totalSends)}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Entregues</span>
          <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
            {NUMBER_FMT.format(rule.delivered)}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Retornaram</span>
          <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
            {NUMBER_FMT.format(rule.returnedCount)}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Receita Recuperada</span>
          <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
            {CURRENCY_FMT.format(rule.revenueRecovered)}
          </p>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const AutomationPerformance = ({ className = '' }) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // State
  const [rules, setRules] = useState([]);
  const [sends, setSends] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const client = await getSupabaseClient();
      if (!client) {
        setError('Supabase nao configurado');
        return;
      }

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - LOOKBACK_DAYS);
      const cutoff = ninetyDaysAgo.toISOString();

      const [rulesResult, sendsResult, contactsResult] = await Promise.all([
        // 1. All automation rules
        client
          .from('automation_rules')
          .select('id, name, enabled, trigger_type, trigger_value, cooldown_days, total_sends_count, coupon_code, discount_percent')
          .order('name'),

        // 2. Automation sends (last 90 days)
        client
          .from('automation_sends')
          .select('rule_id, customer_id, sent_at, status')
          .gte('sent_at', cutoff)
          .order('sent_at', { ascending: true }),

        // 3. Contact tracking for automation campaigns (return rates)
        client
          .from('contact_tracking')
          .select('campaign_id, customer_id, returned_at, return_revenue, campaign_type, delivery_status')
          .not('campaign_type', 'is', null)
          .gte('created_at', cutoff)
      ]);

      if (rulesResult.error) throw rulesResult.error;
      if (sendsResult.error) throw sendsResult.error;
      if (contactsResult.error) throw contactsResult.error;

      setRules(rulesResult.data || []);
      setSends(sendsResult.data || []);
      setContacts(contactsResult.data || []);
    } catch (err) {
      console.error('[AutomationPerformance] Fetch error:', err);
      setError(err.message || 'Erro ao carregar dados de automacoes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -----------------------------------------------------------------------
  // Derived data: process rules, sends, contacts into per-rule metrics
  // -----------------------------------------------------------------------

  const processedRules = useMemo(() => {
    if (!rules.length) return [];

    // Index sends by rule_id
    const sendsByRule = {};
    for (const send of sends) {
      if (!send.rule_id) continue;
      if (!sendsByRule[send.rule_id]) sendsByRule[send.rule_id] = [];
      sendsByRule[send.rule_id].push(send);
    }

    // Index contacts by campaign_id for matching
    // contact_tracking uses 'AUTO_' + rule.id as campaign_id (e.g. 'AUTO_winback_30')
    const contactsByCampaign = {};
    for (const contact of contacts) {
      const cid = contact.campaign_id;
      if (!cid) continue;
      if (!contactsByCampaign[cid]) contactsByCampaign[cid] = [];
      contactsByCampaign[cid].push(contact);
    }

    return rules.map((rule) => {
      const ruleSends = sendsByRule[rule.id] || [];
      const totalSends = ruleSends.length;

      // Match contacts via campaign_id = 'AUTO_' + rule.id
      const contactList = contactsByCampaign['AUTO_' + rule.id] || [];
      const contactedCount = contactList.length;

      // Delivery stats from contact_tracking (webhooks update delivery_status here, not in automation_sends)
      const delivered = contactList.filter(
        (c) => c.delivery_status === 'delivered' || c.delivery_status === 'read'
      ).length;
      const failed = contactList.filter(
        (c) => c.delivery_status === 'failed' || c.delivery_status === 'undelivered'
      ).length;
      const deliveryRate = contactedCount > 0 ? (delivered / contactedCount) * 100 : 0;

      // Return rate & revenue
      const returnedCount = contactList.filter((c) => c.returned_at != null).length;
      const revenueRecovered = contactList.reduce(
        (sum, c) => sum + (Number(c.return_revenue) || 0),
        0
      );
      const returnRate = contactedCount > 0 ? (returnedCount / contactedCount) * 100 : 0;

      return {
        ruleId: rule.id,
        displayName: rule.name || humanizeRuleName(rule.id),
        enabled: rule.enabled,
        triggerType: rule.trigger_type,
        triggerValue: rule.trigger_value,
        cooldownDays: rule.cooldown_days,
        couponCode: rule.coupon_code,
        discountPercent: rule.discount_percent,
        totalSendsCount: rule.total_sends_count || 0,
        totalSends,
        delivered,
        failed,
        deliveryRate,
        contactedCount,
        returnedCount,
        revenueRecovered,
        returnRate,
        // Keep raw sends for timeline
        _sends: ruleSends
      };
    })
    // Sort by revenue recovered descending (primary), then return rate descending
    .sort((a, b) => {
      if (b.revenueRecovered !== a.revenueRecovered) return b.revenueRecovered - a.revenueRecovered;
      if (b.returnRate !== a.returnRate) return b.returnRate - a.returnRate;
      return b.totalSends - a.totalSends;
    });
  }, [rules, sends, contacts]);

  /** Best automation: highest revenue among those with minimum sends */
  const bestRule = useMemo(() => {
    if (!processedRules.length) return null;

    const qualified = processedRules.filter((r) => r.totalSends >= MIN_SENDS_FOR_BEST);
    if (!qualified.length) return null;

    // Already sorted by revenue desc
    return qualified[0];
  }, [processedRules]);

  /** Summary KPIs */
  const summary = useMemo(() => {
    if (!processedRules.length) return null;

    const totalSends = processedRules.reduce((sum, r) => sum + r.totalSends, 0);
    const totalContacted = processedRules.reduce((sum, r) => sum + r.contactedCount, 0);
    const totalReturned = processedRules.reduce((sum, r) => sum + r.returnedCount, 0);
    const totalRevenue = processedRules.reduce((sum, r) => sum + r.revenueRecovered, 0);
    const activeRules = processedRules.filter((r) => r.enabled).length;

    const overallReturnRate = totalContacted > 0
      ? (totalReturned / totalContacted) * 100
      : 0;

    return {
      totalSends,
      totalContacted,
      totalReturned,
      totalRevenue,
      activeRules,
      totalRules: processedRules.length,
      overallReturnRate
    };
  }, [processedRules]);

  /** Timeline chart data: daily sends stacked per rule */
  const timelineData = useMemo(() => {
    if (!sends.length || !processedRules.length) return [];

    // Collect all rule IDs that have sends
    const activeRuleIds = processedRules
      .filter((r) => r.totalSends > 0)
      .map((r) => r.ruleId);

    if (!activeRuleIds.length) return [];

    // Build a map of date -> { ruleId: count }
    const dateMap = {};
    for (const send of sends) {
      const dateKey = extractDateKey(send.sent_at);
      if (!dateKey || !send.rule_id) continue;

      if (!dateMap[dateKey]) dateMap[dateKey] = {};
      dateMap[dateKey][send.rule_id] = (dateMap[dateKey][send.rule_id] || 0) + 1;
    }

    // Convert to array sorted by date
    const sorted = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, ruleCounts]) => {
        const entry = { date };
        for (const ruleId of activeRuleIds) {
          entry[ruleId] = ruleCounts[ruleId] || 0;
        }
        return entry;
      });

    return sorted;
  }, [sends, processedRules]);

  /** Color assignment per rule (stable, index-based) */
  const ruleColorMap = useMemo(() => {
    const map = {};
    const colors = isDark ? RULE_COLORS_DARK : RULE_COLORS_LIGHT;
    processedRules.forEach((rule, idx) => {
      map[rule.ruleId] = colors[idx % colors.length];
    });
    return map;
  }, [processedRules, isDark]);

  /** Rule IDs with sends (for chart bars) */
  const chartRuleIds = useMemo(() => {
    return processedRules
      .filter((r) => r.totalSends > 0)
      .map((r) => r.ruleId);
  }, [processedRules]);

  /** Best rule ID for row highlighting */
  const bestRuleId = bestRule?.ruleId;

  // -----------------------------------------------------------------------
  // Render guards
  // -----------------------------------------------------------------------

  if (loading) return <LoadingSkeleton isDark={isDark} />;

  // No automation sends yet - silently hide
  if (error || !processedRules.length || !summary || summary.totalSends === 0) return null;

  // -----------------------------------------------------------------------
  // Style helpers
  // -----------------------------------------------------------------------

  const statCardClass = `
    p-4 rounded-xl
    ${isDark
      ? 'bg-gradient-to-br from-space-dust via-space-dust to-space-nebula/30 shadow-[inset_0_1px_0_0_rgba(0,174,239,0.05)]'
      : 'bg-gradient-to-br from-white via-white to-slate-50/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'}
    ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
    shadow-sm
  `;

  const labelClass = `${isDesktop ? 'text-sm' : 'text-xs'} tracking-wider text-slate-500 dark:text-slate-400 mb-1`;
  const valueClass = `${isDesktop ? 'text-xl' : 'text-lg'} font-bold tabular-nums text-slate-900 dark:text-white`;

  // Chart colors
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(0,174,239,0.12),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'}
        overflow-hidden
        ${className}
      `}
    >
      {/* ----------------------------------------------------------------- */}
      {/* HEADER                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-3 mb-5">
        {/* Left: Icon Badge + Title */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-sky-500 dark:bg-sky-600 flex items-center justify-center shadow-sm shrink-0">
            <Bot className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold text-slate-800 dark:text-white`}>
              Performance de Automacoes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {summary.activeRules} de {summary.totalRules} {summary.totalRules === 1 ? 'regra ativa' : 'regras ativas'} &bull; Ultimos {LOOKBACK_DAYS} dias
            </p>
          </div>
        </div>

        {/* Right: Return Rate Badge */}
        <div
          className={`
            flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shrink-0
            backdrop-blur-sm ring-1
            ${summary.overallReturnRate >= 30
              ? 'bg-emerald-600 dark:bg-emerald-500 ring-emerald-700 dark:ring-emerald-400'
              : summary.overallReturnRate >= 15
                ? 'bg-amber-600 dark:bg-amber-500 ring-amber-700 dark:ring-amber-400'
                : 'bg-red-600 dark:bg-red-500 ring-red-700 dark:ring-red-400'}
          `}
        >
          <Users className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          <span className="text-xs font-medium text-white whitespace-nowrap">
            {PERCENT_FMT.format(summary.overallReturnRate)}% retorno
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* KPI CARDS                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* Total Sends */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <Send className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" aria-hidden="true" />
            <p className={labelClass}>Envios Totais</p>
          </div>
          <p className={valueClass}>
            {NUMBER_FMT.format(summary.totalSends)}
          </p>
        </div>

        {/* Overall Return Rate */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
            <p className={labelClass}>Taxa Retorno</p>
          </div>
          <p className={`${valueClass} ${getTierTextColor(getReturnRateColor(summary.overallReturnRate))}`}>
            {PERCENT_FMT.format(summary.overallReturnRate)}%
          </p>
        </div>

        {/* Revenue Recovered */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            <p className={labelClass}>Receita Recuperada</p>
          </div>
          <p className={valueClass}>
            {CURRENCY_SHORT_FMT.format(summary.totalRevenue)}
          </p>
        </div>

        {/* Active Rules */}
        <div className={statCardClass}>
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" aria-hidden="true" />
            <p className={labelClass}>Regras Ativas</p>
          </div>
          <p className={valueClass}>
            {summary.activeRules}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              /{summary.totalRules}
            </span>
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* BEST AUTOMATION HIGHLIGHT                                         */}
      {/* ----------------------------------------------------------------- */}
      {bestRule && (
        <BestRuleCard
          rule={bestRule}
          isDark={isDark}
          isDesktop={isDesktop}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TIMELINE CHART: Daily sends per automation (stacked)              */}
      {/* ----------------------------------------------------------------- */}
      {timelineData.length > 1 && (
        <div className="mb-5">
          <p className="text-xs font-medium tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Envios Diarios por Automacao
          </p>
          <div
            className={`
              rounded-xl p-3
              ${isDark
                ? 'bg-space-nebula/40 ring-1 ring-white/[0.04]'
                : 'bg-slate-50/60 ring-1 ring-slate-100'}
            `}
          >
            <ResponsiveContainer width="100%" height={isDesktop ? 240 : 200}>
              <BarChart
                data={timelineData}
                margin={{ top: 10, right: 10, bottom: 5, left: isDesktop ? 5 : 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: axisColor }}
                  tickFormatter={formatShortDate}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  interval={isMobile ? 'preserveStartEnd' : Math.max(0, Math.floor(timelineData.length / 8) - 1)}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? 'end' : 'middle'}
                  height={isMobile ? 50 : 30}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: axisColor }}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  width={isDesktop ? 40 : 30}
                  allowDecimals={false}
                />
                <Tooltip
                  content={
                    <TimelineTooltip
                      isDark={isDark}
                      ruleColorMap={ruleColorMap}
                    />
                  }
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                />
                {!isMobile && (
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {humanizeRuleName(value)}
                      </span>
                    )}
                    iconSize={10}
                    wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
                  />
                )}
                {chartRuleIds.map((ruleId) => (
                  <Bar
                    key={ruleId}
                    dataKey={ruleId}
                    stackId="sends"
                    fill={ruleColorMap[ruleId] || '#94a3b8'}
                    fillOpacity={0.85}
                    radius={chartRuleIds.indexOf(ruleId) === chartRuleIds.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                    maxBarSize={32}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* RULE TABLE (Desktop) / CARD LIST (Mobile)                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-4">
        <p className="text-xs font-medium tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Detalhamento por Regra
        </p>

        {isMobile ? (
          /* ---- Mobile: Card List ---- */
          <div className="space-y-3">
            {processedRules.map((rule) => (
              <RuleCard
                key={rule.ruleId}
                rule={rule}
                isBest={rule.ruleId === bestRuleId}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          /* ---- Desktop: Full Table ---- */
          <div
            className={`
              rounded-xl overflow-hidden
              ${isDark
                ? 'ring-1 ring-white/[0.06]'
                : 'ring-1 ring-slate-200'}
            `}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className={`
                      ${isDark ? 'bg-space-nebula' : 'bg-slate-100'}
                      sticky top-0 z-10
                    `}
                  >
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Automacao
                    </th>
                    <th className="text-center px-3 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                    <th className="text-right px-3 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Envios
                    </th>
                    <th className="text-right px-3 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Entregues
                    </th>
                    <th className="text-right px-3 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Falhas
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 min-w-[130px]">
                      Entrega
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 min-w-[130px]">
                      Retorno
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                      Receita
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedRules.map((rule, idx) => {
                    const isBest = rule.ruleId === bestRuleId;
                    const isEven = idx % 2 === 0;
                    const deliveryTier = getDeliveryRateColor(rule.deliveryRate);
                    const returnTier = getReturnRateColor(rule.returnRate);

                    return (
                      <tr
                        key={rule.ruleId}
                        className={`
                          ${isBest ? 'border-l-[3px] border-l-emerald-500' : 'border-l-[3px] border-l-transparent'}
                          ${isEven
                            ? (isDark ? 'bg-space-dust/20' : 'bg-white')
                            : (isDark ? 'bg-space-dust/40' : 'bg-slate-50/60')}
                          hover:${isDark ? 'bg-space-dust/60' : 'bg-slate-100/80'}
                          transition-colors duration-150
                        `}
                      >
                        {/* Automation Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Color dot matching chart */}
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: ruleColorMap[rule.ruleId] || '#94a3b8' }}
                              aria-hidden="true"
                            />
                            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                              {rule.displayName}
                            </span>
                            {isBest && (
                              <Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pl-[18px]">
                            {rule.triggerType ? humanizeRuleName(rule.triggerType) : '--'}
                            {rule.couponCode ? ` | ${rule.couponCode}` : ''}
                            {rule.discountPercent ? ` (${rule.discountPercent}%)` : ''}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`
                              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                              ${rule.enabled
                                ? (isDark
                                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                                    : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200')
                                : (isDark
                                    ? 'bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30'
                                    : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200')
                              }
                            `}
                          >
                            {rule.enabled ? (
                              <CheckCircle className="w-3 h-3" aria-hidden="true" />
                            ) : (
                              <XCircle className="w-3 h-3" aria-hidden="true" />
                            )}
                            {rule.enabled ? 'Ativa' : 'Pausada'}
                          </span>
                        </td>

                        {/* Sends */}
                        <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                          {NUMBER_FMT.format(rule.totalSends)}
                        </td>

                        {/* Delivered */}
                        <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                          {NUMBER_FMT.format(rule.delivered)}
                        </td>

                        {/* Failed */}
                        <td className="px-3 py-3 text-right tabular-nums">
                          <span className={rule.failed > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-300'}>
                            {NUMBER_FMT.format(rule.failed)}
                          </span>
                        </td>

                        {/* Delivery Rate with progress bar */}
                        <td className="px-3 py-3">
                          <RateBar rate={rule.deliveryRate} tier={deliveryTier} isDark={isDark} />
                        </td>

                        {/* Return Rate with progress bar */}
                        <td className="px-3 py-3">
                          <RateBar rate={rule.returnRate} tier={returnTier} isDark={isDark} />
                        </td>

                        {/* Revenue */}
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-white">
                          {CURRENCY_FMT.format(rule.revenueRecovered)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* FOOTER                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={`
          flex items-center gap-1.5 pt-3
          border-t ${isDark ? 'border-white/[0.05]' : 'border-slate-200/50'}
        `}
      >
        <Info className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dados dos ultimos {LOOKBACK_DAYS} dias &bull; Retorno = clientes que voltaram apos contato automatizado &bull; Min. {MIN_SENDS_FOR_BEST} envios para destaque
        </p>
      </div>
    </div>
  );
};

export default AutomationPerformance;
