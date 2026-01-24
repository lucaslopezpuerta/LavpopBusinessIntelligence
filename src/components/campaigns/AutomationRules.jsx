// AutomationRules.jsx v6.3 - NEW AUTOMATION TYPES
// Automation rules configuration for campaigns
// Design System v4.0 compliant - Mobile-first redesign
//
// CHANGELOG:
// v6.3 (2026-01-24): Added 4 new automation types
//   - RFM Loyalty: Monthly rewards for VIP/Frequente (10%, 20%, or Branded Bag)
//   - Weather Promo: Weather-triggered promos (high drying pain days)
//   - Registration Anniversary: Annual membership celebration (15%/20%/25%)
//   - Churned Recovery: Aggressive recovery for lost customers (50% or FREE)
//   - Welcome and post_visit now one-time only (enforced via welcome_sent_at/post_visit_sent_at)
// v6.2 (2026-01-12): Safe area compliance
//   - Toast notification now uses safe-area-inset for top/right position
//   - Prevents clipping on iPhone Dynamic Island
// v6.1 (2026-01-09): Typography & UX enhancements
//   - Fixed text-[10px] → text-xs (StatusPill badges)
//   - Fixed text-[11px] → text-xs (Quick stats row)
//   - Changed day-of-week picker from flex-wrap to grid layout
//   - Improved touch targets on day buttons (44px min)
// v6.0 (2025-12-12): Enhanced automation controls
//   - Send time window (send_window_start, send_window_end) - Brazil timezone
//   - Day of week restrictions (send_days: checkboxes for each day)
//   - Daily rate limiting (max_daily_sends)
//   - Exclude recent visitors (exclude_recent_days) - not for welcome/wallet/post_visit
//   - Minimum spend threshold (min_total_spent)
//   - Wallet balance max (wallet_balance_max) - for wallet_reminder only
// v5.0 (2025-12-12): Unified automation metrics with campaigns
//   - Automations now display campaign metrics (return rate, revenue)
//   - Fetches effectiveness data from campaign_effectiveness view
//   - Shows same KPIs as manual campaigns
//   - Visual indicator when automation has campaign data
// v4.1 (2025-12-11): Added confirmation dialog for active automations
//   - Shows warning when saving changes to active automations
//   - Clarifies that changes only affect future sends
// v4.0 (2025-12-11): Complete UX redesign
//   - Mobile-first responsive design
//   - Cleaner card layout with better visual hierarchy
//   - Progressive disclosure for advanced settings
//   - Improved status indicators and feedback
//   - Better grouping of related settings
//   - Sticky save button on mobile
//   - Enhanced accessibility
// v3.0 (2025-12-11): Enhanced automation controls
// v2.0 (2025-12-08): Supabase backend integration
// v1.2 (2025-12-08): Fixed persistence bug
// v1.1 (2025-12-03): Added Brazilian mobile phone validation

import { useState, useCallback, useEffect } from 'react';
import {
  Zap,
  Clock,
  AlertTriangle,
  Sparkles,
  Wallet,
  Calendar,
  Play,
  Pause,
  Info,
  Check,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Gift,
  Users,
  MessageCircle,
  Settings2,
  HelpCircle,
  X,
  TrendingUp,
  DollarSign,
  // New icons for v6.3 automations
  Star,
  CloudRain,
  Cake,
  HeartCrack
} from 'lucide-react';
import { getBrazilNow } from '../../utils/dateUtils';
import SectionCard from '../ui/SectionCard';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';
import { getAutomationRules, saveAutomationRules, getCampaignPerformance } from '../../utils/campaignService';
import { haptics } from '../../utils/haptics';

// Available coupon codes (must match POS system)
const COUPON_OPTIONS = [
  // Win-back coupons
  { code: 'VOLTE15', discount: 15, label: 'VOLTE15 (15%)' },
  { code: 'VOLTE20', discount: 20, label: 'VOLTE20 (20%)' },
  { code: 'VOLTE25', discount: 25, label: 'VOLTE25 (25%)' },
  { code: 'VOLTE30', discount: 30, label: 'VOLTE30 (30%)' },
  // Welcome coupons
  { code: 'BEM10', discount: 10, label: 'BEM10 (10%)' },
  { code: 'BEM15', discount: 15, label: 'BEM15 (15%)' },
  { code: 'BEM20', discount: 20, label: 'BEM20 (20%)' },
  // Service-specific coupons
  { code: 'LAVA20', discount: 20, label: 'LAVA20 (20% lavagem)' },
  { code: 'LAVA25', discount: 25, label: 'LAVA25 (25% lavagem)' },
  { code: 'SECA20', discount: 20, label: 'SECA20 (20% secagem)' },
  { code: 'SECA25', discount: 25, label: 'SECA25 (25% secagem)' },
  // VIP/Loyalty coupons (v6.3)
  { code: 'VIP10', discount: 10, label: 'VIP10 (10%)' },
  { code: 'VIP20', discount: 20, label: 'VIP20 (20%)' },
  { code: 'BOLSA', discount: 0, label: 'BOLSA (Bolsa Lavpop)' },
  // Weather coupons (v6.3)
  { code: 'CLIMA10', discount: 10, label: 'CLIMA10 (10%)' },
  { code: 'CLIMA15', discount: 15, label: 'CLIMA15 (15%)' },
  { code: 'CLIMA20', discount: 20, label: 'CLIMA20 (20%)' },
  // Anniversary coupons (v6.3)
  { code: 'ANIVER15', discount: 15, label: 'ANIVER15 (15% - 1 ano)' },
  { code: 'ANIVER20', discount: 20, label: 'ANIVER20 (20% - 2 anos)' },
  { code: 'ANIVER25', discount: 25, label: 'ANIVER25 (25% - 3+ anos)' },
  // Churned recovery coupons (v6.3)
  { code: 'VOLTA50', discount: 50, label: 'VOLTA50 (50%)' },
  { code: 'GRATIS', discount: 100, label: 'GRATIS (1 ciclo grátis)' }
];

// Predefined automation rules
const AUTOMATION_RULES = [
  {
    id: 'winback_30',
    name: 'Win-back 30 dias',
    shortDesc: 'Reengaja clientes inativos há 30 dias',
    icon: AlertTriangle,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-900/20',
    trigger: {
      type: 'days_since_visit',
      value: 30,
      label: '30+ dias sem visita'
    },
    action: {
      template: 'winback_discount',
      channel: 'whatsapp',
      label: 'Cupom de desconto'
    },
    enabled: false,
    cooldown_days: 30,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: 'VOLTE20',
    discount_percent: 20,
    coupon_validity_days: 7,
    hasCoupon: true,
    // v6.0: Enhanced controls
    send_window_start: '09:00',
    send_window_end: '20:00',
    send_days: [1, 2, 3, 4, 5], // Mon-Fri
    max_daily_sends: null,
    exclude_recent_days: 3, // Don't send to recent visitors
    min_total_spent: null,
    wallet_balance_max: null,
    supportsExcludeRecent: true // UI flag: show exclude_recent_days field
  },
  {
    id: 'winback_45',
    name: 'Win-back Urgente',
    shortDesc: 'Última chance para clientes prestes a churnar',
    icon: AlertTriangle,
    color: 'red',
    gradient: 'from-red-500 to-rose-500',
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-900/20',
    trigger: {
      type: 'days_since_visit',
      value: 45,
      label: '45+ dias sem visita'
    },
    action: {
      template: 'winback_critical',
      channel: 'whatsapp',
      label: 'Oferta agressiva'
    },
    enabled: false,
    cooldown_days: 21,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: 'VOLTE30',
    discount_percent: 30,
    coupon_validity_days: 7,
    hasCoupon: true,
    // v6.0: Enhanced controls
    send_window_start: '09:00',
    send_window_end: '20:00',
    send_days: [1, 2, 3, 4, 5], // Mon-Fri
    max_daily_sends: null,
    exclude_recent_days: 3, // Don't send to recent visitors
    min_total_spent: 50, // Only target customers who spent R$50+
    wallet_balance_max: null,
    supportsExcludeRecent: true
  },
  {
    id: 'welcome_new',
    name: 'Boas-vindas',
    shortDesc: 'Recepção automática para novos clientes',
    icon: Sparkles,
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-500',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-900/20',
    trigger: {
      type: 'first_purchase',
      value: 1,
      label: 'Primeira compra'
    },
    action: {
      template: 'welcome_new',
      channel: 'whatsapp',
      label: 'Boas-vindas + cupom'
    },
    enabled: false,
    cooldown_days: 365,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: 'BEM10',
    discount_percent: 10,
    coupon_validity_days: 14,
    hasCoupon: true,
    isOneTime: true, // v6.3: Only send once per customer (enforced via welcome_sent_at column)
    // v6.0: Enhanced controls
    send_window_start: '09:00',
    send_window_end: '20:00',
    send_days: [1, 2, 3, 4, 5], // Mon-Fri
    max_daily_sends: null,
    exclude_recent_days: null, // Don't exclude - targets new customers!
    min_total_spent: null,
    wallet_balance_max: null,
    supportsExcludeRecent: false // This automation targets recent visitors
  },
  {
    id: 'wallet_reminder',
    name: 'Lembrete de Saldo',
    shortDesc: 'Avisa clientes com créditos esquecidos',
    icon: Wallet,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-900/20',
    trigger: {
      type: 'wallet_balance',
      value: 20,
      label: 'Saldo > R$ 20'
    },
    action: {
      template: 'wallet_reminder',
      channel: 'whatsapp',
      label: 'Lembrete de saldo'
    },
    enabled: false,
    cooldown_days: 14,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: null,
    discount_percent: null,
    coupon_validity_days: null,
    hasCoupon: false,
    // v6.0: Enhanced controls
    send_window_start: '09:00',
    send_window_end: '20:00',
    send_days: [1, 2, 3, 4, 5], // Mon-Fri
    max_daily_sends: null,
    exclude_recent_days: null, // Don't exclude - targets wallet holders
    min_total_spent: null,
    wallet_balance_max: 200, // Only target balances up to R$200
    supportsExcludeRecent: false, // This automation targets wallet holders
    supportsWalletMax: true // UI flag: show wallet_balance_max field
  },
  {
    id: 'post_visit',
    name: 'Pós-Visita',
    shortDesc: 'Agradece e pede avaliação no Google',
    icon: Calendar,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-900/20',
    trigger: {
      type: 'hours_after_visit',
      value: 24,
      label: '24h após visita'
    },
    action: {
      template: 'post_visit_thanks',
      channel: 'whatsapp',
      label: 'Feedback + Google'
    },
    enabled: false,
    cooldown_days: 7,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: null,
    discount_percent: null,
    coupon_validity_days: null,
    hasCoupon: false,
    isOneTime: true, // v6.3: Only send once per customer (enforced via post_visit_sent_at column)
    // v6.0: Enhanced controls
    send_window_start: '09:00',
    send_window_end: '20:00',
    send_days: [1, 2, 3, 4, 5, 6, 7], // All days for post-visit
    max_daily_sends: null,
    exclude_recent_days: null, // Don't exclude - targets recent visitors!
    min_total_spent: null,
    wallet_balance_max: null,
    supportsExcludeRecent: false // This automation targets recent visitors
  },
  // =====================================================
  // v6.3: NEW AUTOMATION TYPES
  // =====================================================
  {
    id: 'rfm_loyalty',
    name: 'Fidelidade VIP',
    shortDesc: 'Recompensa mensal para clientes VIP e Frequentes',
    icon: Star,
    color: 'yellow',
    gradient: 'from-yellow-500 to-amber-500',
    bgLight: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-900/20',
    trigger: {
      type: 'rfm_segment',
      value: ['VIP', 'Frequente'],
      label: 'Segmentos VIP ou Frequente'
    },
    action: {
      template: 'rfm_loyalty_vip',
      channel: 'whatsapp',
      label: 'Presente exclusivo'
    },
    enabled: false,
    cooldown_days: 30,
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: 'VIP10',
    discount_percent: 10,
    coupon_validity_days: 14,
    hasCoupon: true,
    // Reward options: 10%, 20%, or Branded Bag
    rewardOptions: [
      { code: 'VIP10', discount: 10, label: '10% de desconto' },
      { code: 'VIP20', discount: 20, label: '20% de desconto' },
      { code: 'BOLSA', discount: 0, label: 'Bolsa Lavpop exclusiva' }
    ],
    // RFM segment selection
    targetSegments: ['VIP', 'Frequente'],
    availableSegments: ['VIP', 'Frequente', 'Promissor', 'Novato'],
    // v6.0: Enhanced controls
    send_window_start: '09:00',
    send_window_end: '20:00',
    send_days: [1, 2, 3, 4, 5], // Mon-Fri
    max_daily_sends: 50,
    exclude_recent_days: null,
    min_total_spent: 100, // Only reward customers who spent R$100+
    wallet_balance_max: null,
    supportsExcludeRecent: false,
    supportsSegmentSelection: true // UI flag: show segment multi-select
  },
  {
    id: 'weather_promo',
    name: 'Promoção Clima',
    shortDesc: 'Promos automáticas em dias de alta umidade',
    icon: CloudRain,
    color: 'sky',
    gradient: 'from-sky-500 to-blue-500',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-900/20',
    trigger: {
      type: 'weather_drying_pain',
      value: {
        humidity_min: 75,
        precipitation_min: 5,
        cloud_cover_min: 80
      },
      label: 'Dias de alta umidade'
    },
    action: {
      template: 'weather_promo',
      channel: 'whatsapp',
      label: 'Desconto por clima'
    },
    enabled: false,
    cooldown_days: 14, // Weather-specific cooldown
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: 'CLIMA15',
    discount_percent: 15,
    coupon_validity_days: 3, // Short validity for urgency
    hasCoupon: true,
    // Weather thresholds (configurable)
    weatherThresholds: {
      humidity_min: 75,
      precipitation_min: 5,
      cloud_cover_min: 80
    },
    // v6.0: Enhanced controls
    send_window_start: '08:00', // Earlier for weather promos
    send_window_end: '18:00',
    send_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
    max_daily_sends: 50, // Batch limit per day
    exclude_recent_days: 3, // Don't spam recent visitors
    min_total_spent: null,
    wallet_balance_max: null,
    supportsExcludeRecent: true,
    supportsWeatherConfig: true // UI flag: show weather threshold config
  },
  {
    id: 'registration_anniversary',
    name: 'Aniversário de Cadastro',
    shortDesc: 'Celebra aniversário de cadastro do cliente',
    icon: Cake,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    bgLight: 'bg-pink-50',
    bgDark: 'dark:bg-pink-900/20',
    trigger: {
      type: 'registration_anniversary',
      value: { window_days: 3 },
      label: 'Aniversário de cadastro (±3 dias)'
    },
    action: {
      template: 'registration_anniversary',
      channel: 'whatsapp',
      label: 'Parabéns + desconto'
    },
    enabled: false,
    cooldown_days: 365, // Annual event
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: 'ANIVER20',
    discount_percent: 20,
    coupon_validity_days: 14,
    hasCoupon: true,
    bypass_global_cooldown: true, // Special occasion - ignore 5-day global cooldown
    // Tiered discounts by anniversary year
    anniversaryDiscounts: [
      { years: 1, code: 'ANIVER15', discount: 15, label: '1 ano: 15%' },
      { years: 2, code: 'ANIVER20', discount: 20, label: '2 anos: 20%' },
      { years: 3, code: 'ANIVER25', discount: 25, label: '3+ anos: 25%' }
    ],
    // v6.0: Enhanced controls
    send_window_start: '09:00',
    send_window_end: '20:00',
    send_days: [1, 2, 3, 4, 5, 6, 7], // All days for celebrations
    max_daily_sends: null,
    exclude_recent_days: null, // Don't exclude - it's their special day!
    min_total_spent: null,
    wallet_balance_max: null,
    supportsExcludeRecent: false,
    supportsAnniversaryTiers: true // UI flag: show tiered discount info
  },
  {
    id: 'churned_recovery',
    name: 'Recuperação Crítica',
    shortDesc: 'Última chance para clientes perdidos (60-120 dias)',
    icon: HeartCrack,
    color: 'red',
    gradient: 'from-red-600 to-rose-600',
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-900/20',
    trigger: {
      type: 'churned_days',
      value: { min_days: 60, max_days: 120 },
      label: 'Clientes perdidos (60-120 dias)'
    },
    action: {
      template: 'churned_recovery',
      channel: 'whatsapp',
      label: 'Oferta irrecusável'
    },
    enabled: false,
    cooldown_days: 21, // Aggressive follow-up
    valid_until: null,
    max_total_sends: null,
    total_sends_count: 0,
    coupon_code: 'VOLTA50',
    discount_percent: 50,
    coupon_validity_days: 7,
    hasCoupon: true,
    // Aggressive offer options
    offerOptions: [
      { code: 'VOLTA50', discount: 50, label: '50% de desconto' },
      { code: 'GRATIS', discount: 100, label: '1 ciclo grátis' }
    ],
    // Churned criteria
    churnedCriteria: {
      min_days: 60,
      max_days: 120,
      risk_level: 'Lost'
    },
    // v6.0: Enhanced controls
    send_window_start: '10:00',
    send_window_end: '19:00',
    send_days: [1, 2, 3, 4, 5], // Mon-Fri
    max_daily_sends: 30, // Limit aggressive campaigns
    exclude_recent_days: null, // Target based on churned criteria
    min_total_spent: 50, // Only target customers who spent R$50+
    wallet_balance_max: null,
    supportsExcludeRecent: false,
    supportsChurnedConfig: true // UI flag: show churned criteria config
  }
];

// Day of week labels (Portuguese)
const DAY_LABELS = [
  { day: 1, label: 'Seg', fullLabel: 'Segunda' },
  { day: 2, label: 'Ter', fullLabel: 'Terça' },
  { day: 3, label: 'Qua', fullLabel: 'Quarta' },
  { day: 4, label: 'Qui', fullLabel: 'Quinta' },
  { day: 5, label: 'Sex', fullLabel: 'Sexta' },
  { day: 6, label: 'Sáb', fullLabel: 'Sábado' },
  { day: 7, label: 'Dom', fullLabel: 'Domingo' }
];

// Tooltip component for help icons - mobile friendly with tap support
const Tooltip = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        className="p-1 -m-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
        aria-label="Ajuda"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {isOpen && (
        <div className="fixed sm:absolute bottom-auto sm:bottom-full left-4 right-4 sm:left-0 sm:right-auto top-1/2 sm:top-auto sm:mb-2 -translate-y-1/2 sm:translate-y-0 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg transition-all duration-200 sm:w-52 z-[100] shadow-xl leading-relaxed">
          {text}
          <div className="hidden sm:block absolute top-full left-4 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
        </div>
      )}
    </div>
  );
};

// Status pill component
const StatusPill = ({ enabled, sendCount, maxSends, validUntil }) => {
  const now = new Date();
  const isExpired = validUntil && new Date(validUntil) < now;
  const isAtLimit = maxSends && sendCount >= maxSends;

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
        Encerrada
      </span>
    );
  }

  if (isAtLimit) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
        Limite atingido
      </span>
    );
  }

  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        Ativa
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
      Inativa
    </span>
  );
};

// Input field component for consistency
const InputField = ({ label, tooltip, children, className = '' }) => (
  <div className={className}>
    <label className="flex items-center text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
      {label}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
    {children}
  </div>
);

const AutomationRules = ({ audienceSegments }) => {
  const [rules, setRules] = useState(AUTOMATION_RULES);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRule, setExpandedRule] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [campaignMetrics, setCampaignMetrics] = useState({});
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'warning' }

  // Load rules and campaign metrics on mount
  useEffect(() => {
    const loadRulesAndMetrics = async () => {
      setIsLoading(true);
      try {
        // Load rules
        const savedRules = await getAutomationRules();
        const savedMap = new Map(savedRules.map(r => [r.id, r]));

        setRules(AUTOMATION_RULES.map(defaultRule => {
          const saved = savedMap.get(defaultRule.id);
          if (saved) {
            return {
              ...defaultRule,
              enabled: saved.enabled ?? defaultRule.enabled,
              cooldown_days: saved.cooldown_days ?? defaultRule.cooldown_days,
              valid_until: saved.valid_until ?? defaultRule.valid_until,
              max_total_sends: saved.max_total_sends ?? defaultRule.max_total_sends,
              total_sends_count: saved.total_sends_count ?? defaultRule.total_sends_count,
              coupon_code: saved.coupon_code ?? defaultRule.coupon_code,
              discount_percent: saved.discount_percent ?? defaultRule.discount_percent,
              coupon_validity_days: saved.coupon_validity_days ?? defaultRule.coupon_validity_days,
              campaign_id: saved.campaign_id ?? null,
              // v6.0: Enhanced controls
              send_window_start: saved.send_window_start ?? defaultRule.send_window_start,
              send_window_end: saved.send_window_end ?? defaultRule.send_window_end,
              send_days: saved.send_days ?? defaultRule.send_days,
              max_daily_sends: saved.max_daily_sends ?? defaultRule.max_daily_sends,
              exclude_recent_days: saved.exclude_recent_days ?? defaultRule.exclude_recent_days,
              min_total_spent: saved.min_total_spent ?? defaultRule.min_total_spent,
              wallet_balance_max: saved.wallet_balance_max ?? defaultRule.wallet_balance_max
            };
          }
          return defaultRule;
        }));

        // Load campaign metrics for automations
        try {
          const allCampaigns = await getCampaignPerformance();
          const metricsMap = {};

          // Filter for automation campaigns (AUTO_* prefix)
          (allCampaigns || []).forEach(c => {
            if (c.campaign_id?.startsWith('AUTO_') || c.id?.startsWith('AUTO_')) {
              const ruleId = (c.campaign_id || c.id).replace('AUTO_', '');
              metricsMap[ruleId] = {
                contactsTracked: c.contacts_tracked || c.total_contacts || 0,
                contactsReturned: c.contacts_returned || c.returned_count || 0,
                returnRate: c.return_rate || 0,
                totalRevenue: c.total_revenue_recovered || c.total_return_revenue || 0,
                avgDaysToReturn: c.avg_days_to_return || null
              };
            }
          });

          setCampaignMetrics(metricsMap);
        } catch (metricsError) {
          console.warn('Could not load campaign metrics:', metricsError.message);
        }
      } catch (error) {
        console.error('Error loading automation rules:', error);
        // Fallback: try to load from backend with sync function (also async now)
        try {
          const savedRules = await getAutomationRules();
          const savedMap = new Map(savedRules.map(r => [r.id, r]));

          setRules(AUTOMATION_RULES.map(defaultRule => {
            const saved = savedMap.get(defaultRule.id);
            return saved ? { ...defaultRule, ...saved } : defaultRule;
          }));
        } catch (fallbackError) {
          console.warn('Fallback also failed, using defaults:', fallbackError.message);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadRulesAndMetrics();
  }, []);

  const toggleRule = useCallback((ruleId) => {
    setRules(prev => {
      const rule = prev.find(r => r.id === ruleId);
      const newEnabled = !rule?.enabled;

      // Show toast feedback
      const ruleName = rule?.name || 'Automação';
      setToast({
        message: newEnabled ? `${ruleName} ativada` : `${ruleName} desativada`,
        type: newEnabled ? 'success' : 'warning'
      });

      // Haptic feedback
      haptics.success();

      // Auto-dismiss toast after 3 seconds
      setTimeout(() => setToast(null), 3000);

      return prev.map(r =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      );
    });
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  const updateRuleField = useCallback((ruleId, field, value) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, [field]: value } : rule
    ));
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  const updateCouponCode = useCallback((ruleId, couponCode) => {
    const couponOption = COUPON_OPTIONS.find(c => c.code === couponCode);
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? {
        ...rule,
        coupon_code: couponCode,
        discount_percent: couponOption?.discount ?? rule.discount_percent
      } : rule
    ));
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  // v6.0: Toggle a day in the send_days array
  const toggleSendDay = useCallback((ruleId, day) => {
    setRules(prev => prev.map(rule => {
      if (rule.id !== ruleId) return rule;
      const currentDays = rule.send_days || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day].sort((a, b) => a - b);
      return { ...rule, send_days: newDays };
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  }, []);

  // Check if any active automation has changes
  const hasActiveAutomationChanges = useCallback(() => {
    return rules.some(rule => rule.enabled);
  }, [rules]);

  // Perform the actual save
  const performSave = useCallback(async () => {
    setIsSaving(true);
    setShowConfirmDialog(false);

    const rulesToSave = rules.map(r => ({
      id: r.id,
      name: r.name,
      enabled: r.enabled,
      trigger: r.trigger,
      action: r.action,
      cooldown_days: r.cooldown_days,
      valid_until: r.valid_until,
      max_total_sends: r.max_total_sends,
      coupon_code: r.coupon_code,
      discount_percent: r.discount_percent,
      coupon_validity_days: r.coupon_validity_days,
      // v6.0: Enhanced controls
      send_window_start: r.send_window_start,
      send_window_end: r.send_window_end,
      send_days: r.send_days,
      max_daily_sends: r.max_daily_sends,
      exclude_recent_days: r.exclude_recent_days,
      min_total_spent: r.min_total_spent,
      wallet_balance_max: r.wallet_balance_max
    }));

    try {
      await saveAutomationRules(rulesToSave);
    } catch (error) {
      console.error('Error saving automation rules:', error);
      // Fire-and-forget fallback attempt (function is async but we don't need to wait)
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setHasChanges(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  }, [rules]);

  // Handle save button click - check for active automations first
  const handleSave = useCallback(() => {
    if (hasChanges && hasActiveAutomationChanges()) {
      setShowConfirmDialog(true);
    } else {
      performSave();
    }
  }, [hasChanges, hasActiveAutomationChanges, performSave]);

  const withValidPhone = (customers) => {
    if (!customers) return [];
    return customers.filter(c => isValidBrazilianMobile(c.phone));
  };

  const getAffectedCount = (rule) => {
    if (!audienceSegments) return 0;

    switch (rule.trigger.type) {
      case 'days_since_visit':
        if (rule.trigger.value === 30) return withValidPhone(audienceSegments.atRisk).length;
        if (rule.trigger.value === 45) return withValidPhone(audienceSegments.atRisk?.filter(c => c.daysSinceLastVisit >= 45)).length;
        return 0;
      case 'first_purchase':
        return withValidPhone(audienceSegments.newCustomers).length;
      case 'wallet_balance':
        return withValidPhone(audienceSegments.withWallet).length;
      case 'hours_after_visit':
        return withValidPhone(audienceSegments.all?.filter(c => c.daysSinceLastVisit === 0)).length;
      default:
        return 0;
    }
  };

  const enabledCount = rules.filter(r => r.enabled).length;
  const totalSent = rules.reduce((sum, r) => sum + (r.total_sends_count || 0), 0);
  const totalReturned = Object.values(campaignMetrics).reduce((sum, m) => sum + (m.contactsReturned || 0), 0);
  const totalRevenue = Object.values(campaignMetrics).reduce((sum, m) => sum + (m.totalRevenue || 0), 0);
  const overallReturnRate = totalSent > 0 ? (totalReturned / totalSent * 100) : 0;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  if (isLoading) {
    return (
      <SectionCard
        title="Automações"
        subtitle="Configure campanhas automáticas"
        icon={Zap}
        color="purple"
        id="automation-rules"
      >
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando automações...</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Automações"
      subtitle="Engaje clientes automaticamente"
      icon={Zap}
      color="purple"
      id="automation-rules"
    >
      {/* Toast notification for toggle feedback - with safe area */}
      {toast && (
        <div
          className={`fixed z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-amber-500 text-white'
          }`}
          style={{
            top: 'calc(1rem + env(safe-area-inset-top, 0px))',
            right: 'calc(1rem + env(safe-area-inset-right, 0px))'
          }}
          role="alert"
          aria-live="polite"
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors"
            aria-label="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Stats Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-4 rounded-xl ${enabledCount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-center gap-2 mb-1">
              {enabledCount > 0 ? (
                <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Pause className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ativas</span>
            </div>
            <p className={`text-2xl font-bold ${enabledCount > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
              {enabledCount}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Enviados</span>
            </div>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {totalSent}
            </p>
          </div>

          <div className={`p-4 rounded-xl ${overallReturnRate > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className={`w-4 h-4 ${overallReturnRate > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Retorno</span>
            </div>
            <p className={`text-2xl font-bold ${overallReturnRate > 15 ? 'text-emerald-600 dark:text-emerald-400' : overallReturnRate > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>
              {overallReturnRate.toFixed(1)}%
            </p>
          </div>

          <div className={`p-4 rounded-xl ${totalRevenue > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`w-4 h-4 ${totalRevenue > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Receita</span>
            </div>
            <p className={`text-lg sm:text-2xl font-bold truncate ${totalRevenue > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {/* How it works - collapsible */}
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            <Info className="w-4 h-4" />
            <span>Como funcionam as automações?</span>
            <ChevronDown className="w-4 h-4 ml-auto transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 text-sm text-purple-700 dark:text-purple-300">
            <p>Quando um cliente atinge o gatilho definido (ex: 30 dias sem visita), uma mensagem WhatsApp é enviada automaticamente. O sistema verifica diariamente e respeita o intervalo configurado entre envios.</p>
          </div>
        </details>

        {/* Rules List */}
        <div className="space-y-3">
          {rules.map((rule) => {
            const Icon = rule.icon;
            const isExpanded = expandedRule === rule.id;
            const affectedCount = getAffectedCount(rule);
            const isAdvancedOpen = showAdvanced[rule.id];

            return (
              <div
                key={rule.id}
                className={`
                  rounded-2xl border transition-all duration-300 overflow-hidden
                  ${rule.enabled
                    ? 'border-emerald-200 dark:border-emerald-800 shadow-sm shadow-emerald-100 dark:shadow-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-700'
                  }
                  ${isExpanded ? 'ring-2 ring-purple-500/20' : ''}
                `}
              >
                {/* Card Header */}
                <div
                  className={`p-4 cursor-pointer transition-colors ${rule.enabled ? `${rule.bgLight} ${rule.bgDark}` : 'bg-white dark:bg-slate-800'}`}
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${rule.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title row with toggle */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                          {rule.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRule(rule.id);
                            }}
                            className={`
                              relative w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all duration-300
                              ${rule.enabled
                                ? 'bg-emerald-500 shadow-inner'
                                : 'bg-slate-300 dark:bg-slate-600'
                              }
                            `}
                            aria-label={rule.enabled ? 'Desativar' : 'Ativar'}
                          >
                            <div className={`
                              absolute top-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center
                              ${rule.enabled ? 'left-6 sm:left-7' : 'left-1'}
                            `}>
                              {rule.enabled ? (
                                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                              ) : (
                                <span className="w-1.5 h-0.5 sm:w-2 bg-slate-400 rounded-full" />
                              )}
                            </div>
                          </button>
                          {/* Expand indicator */}
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Status pill and description */}
                      <div className="flex items-center gap-2 mb-2">
                        <StatusPill
                          enabled={rule.enabled}
                          sendCount={rule.total_sends_count}
                          maxSends={rule.max_total_sends}
                          validUntil={rule.valid_until}
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-snug">
                        {rule.shortDesc}
                      </p>

                      {/* Quick Stats */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {rule.trigger.label}
                        </span>
                        {affectedCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {affectedCount} elegíveis
                          </span>
                        )}
                        {rule.total_sends_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {rule.total_sends_count} enviados
                          </span>
                        )}
                        {/* Campaign Metrics - only shown when data exists */}
                        {campaignMetrics[rule.id]?.contactsReturned > 0 && (
                          <>
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {campaignMetrics[rule.id].returnRate.toFixed(1)}% retorno
                            </span>
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {formatCurrency(campaignMetrics[rule.id].totalRevenue)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                    <div className="p-4 space-y-5">
                      {/* Main Settings */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Settings2 className="w-4 h-4" />
                          Configurações
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Cooldown */}
                          <InputField
                            label="Intervalo entre envios"
                            tooltip="Quantos dias esperar antes de enviar novamente para o mesmo cliente"
                          >
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="365"
                                value={rule.cooldown_days || 14}
                                onChange={(e) => updateRuleField(rule.id, 'cooldown_days', parseInt(e.target.value) || 14)}
                                className="w-full h-11 pl-4 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">dias</span>
                            </div>
                          </InputField>

                          {/* Stop Date */}
                          <InputField
                            label="Data de encerramento"
                            tooltip="A automação para automaticamente após esta data"
                          >
                            <input
                              type="date"
                              value={rule.valid_until ? rule.valid_until.split('T')[0] : ''}
                              onChange={(e) => updateRuleField(rule.id, 'valid_until', e.target.value ? new Date(e.target.value + 'T23:59:59-03:00').toISOString() : null)}
                              min={getBrazilNow().date}
                              placeholder="Sem limite"
                              className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </InputField>
                        </div>

                        {/* Coupon Settings - only for rules with coupons */}
                        {rule.hasCoupon && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
                              <Gift className="w-4 h-4" />
                              Cupom de Desconto
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Coupon Code */}
                              <InputField
                                label="Código do cupom"
                                tooltip="Deve existir no sistema POS"
                              >
                                <select
                                  value={rule.coupon_code || ''}
                                  onChange={(e) => updateCouponCode(rule.id, e.target.value)}
                                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                                >
                                  <option value="">Selecionar cupom</option>
                                  {COUPON_OPTIONS.map(opt => (
                                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                                  ))}
                                </select>
                              </InputField>

                              {/* Coupon Validity */}
                              <InputField
                                label="Validade do cupom"
                                tooltip="Por quantos dias o cupom será válido"
                              >
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={rule.coupon_validity_days || 7}
                                    onChange={(e) => updateRuleField(rule.id, 'coupon_validity_days', parseInt(e.target.value) || 7)}
                                    className="w-full h-11 pl-4 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">dias</span>
                                </div>
                              </InputField>
                            </div>

                            {/* Coupon Preview */}
                            {rule.coupon_code && (
                              <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                  <strong>{rule.coupon_code}</strong> • {rule.discount_percent}% de desconto • Válido por {rule.coupon_validity_days || 7} dias
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* v6.0: Send Schedule Settings */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4" />
                            Horário de Envio
                          </h4>

                          {/* Send Time Window */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <InputField
                              label="Início"
                              tooltip="Horário de início dos envios (Brasília)"
                            >
                              <input
                                type="time"
                                value={rule.send_window_start || '09:00'}
                                onChange={(e) => updateRuleField(rule.id, 'send_window_start', e.target.value)}
                                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </InputField>

                            <InputField
                              label="Fim"
                              tooltip="Horário de término dos envios (Brasília)"
                            >
                              <input
                                type="time"
                                value={rule.send_window_end || '20:00'}
                                onChange={(e) => updateRuleField(rule.id, 'send_window_end', e.target.value)}
                                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </InputField>
                          </div>

                          {/* Day of Week Checkboxes */}
                          <InputField
                            label="Dias da semana"
                            tooltip="Selecione os dias em que a automação pode enviar mensagens"
                            className="mb-4"
                          >
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-1.5">
                              {DAY_LABELS.map(({ day, label, fullLabel }) => {
                                const isSelected = (rule.send_days || []).includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleSendDay(rule.id, day)}
                                    title={fullLabel}
                                    className={`
                                      min-h-[44px] min-w-[44px] px-2 py-2 text-xs font-medium rounded-lg transition-all
                                      ${isSelected
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                      }
                                    `}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </InputField>

                          {/* Daily Rate Limit */}
                          <InputField
                            label="Limite diário de envios"
                            tooltip="Máximo de mensagens por dia para esta automação (vazio = sem limite)"
                          >
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                placeholder="Sem limite"
                                value={rule.max_daily_sends || ''}
                                onChange={(e) => updateRuleField(rule.id, 'max_daily_sends', e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full h-11 pl-4 pr-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">msg/dia</span>
                            </div>
                          </InputField>
                        </div>
                      </div>

                      {/* Advanced Settings Toggle */}
                      <button
                        onClick={() => setShowAdvanced(prev => ({ ...prev, [rule.id]: !prev[rule.id] }))}
                        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      >
                        {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Configurações avançadas
                      </button>

                      {/* Advanced Settings */}
                      {isAdvancedOpen && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                          <InputField
                            label="Limite máximo de envios"
                            tooltip="A automação para após atingir este número total de envios"
                          >
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                placeholder="Sem limite"
                                value={rule.max_total_sends || ''}
                                onChange={(e) => updateRuleField(rule.id, 'max_total_sends', e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full h-11 pl-4 pr-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">mensagens</span>
                            </div>
                          </InputField>

                          {/* Progress bar if limit is set */}
                          {rule.max_total_sends && (
                            <div>
                              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                                <span>Progresso</span>
                                <span>{rule.total_sends_count || 0} / {rule.max_total_sends}</span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, ((rule.total_sends_count || 0) / rule.max_total_sends) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* v6.0: Exclude Recent Visitors - only for winback automations */}
                          {rule.supportsExcludeRecent && (
                            <InputField
                              label="Excluir visitantes recentes"
                              tooltip="Não enviar para clientes que visitaram nos últimos X dias (evita spam)"
                            >
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  placeholder="Não excluir"
                                  value={rule.exclude_recent_days || ''}
                                  onChange={(e) => updateRuleField(rule.id, 'exclude_recent_days', e.target.value ? parseInt(e.target.value) : null)}
                                  className="w-full h-11 pl-4 pr-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">dias</span>
                              </div>
                            </InputField>
                          )}

                          {/* v6.0: Minimum Total Spent */}
                          <InputField
                            label="Gasto mínimo total"
                            tooltip="Apenas enviar para clientes que gastaram no mínimo este valor"
                          >
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                placeholder="Sem mínimo"
                                value={rule.min_total_spent || ''}
                                onChange={(e) => updateRuleField(rule.id, 'min_total_spent', e.target.value ? parseFloat(e.target.value) : null)}
                                className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                          </InputField>

                          {/* v6.0: Wallet Balance Max - only for wallet_reminder */}
                          {rule.supportsWalletMax && (
                            <InputField
                              label="Saldo máximo"
                              tooltip="Apenas enviar para clientes com saldo até este valor (evita alertar quem tem muito saldo)"
                            >
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="10"
                                  placeholder="Sem limite"
                                  value={rule.wallet_balance_max || ''}
                                  onChange={(e) => updateRuleField(rule.id, 'wallet_balance_max', e.target.value ? parseFloat(e.target.value) : null)}
                                  className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                            </InputField>
                          )}
                        </div>
                      )}

                      {/* Summary */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          <strong className="text-slate-700 dark:text-slate-300">Resumo:</strong>{' '}
                          {rule.enabled ? 'Enviando' : 'Quando ativada, enviará'} {rule.action.label.toLowerCase()} via WhatsApp para clientes com {rule.trigger.label.toLowerCase()}.
                          {rule.cooldown_days && ` Intervalo de ${rule.cooldown_days} dias entre mensagens.`}
                          {rule.valid_until && ` Encerra em ${new Date(rule.valid_until).toLocaleDateString('pt-BR')}.`}
                          {rule.max_total_sends && ` Limite de ${rule.max_total_sends} envios.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky Save Button */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900">
          <div className="flex items-center justify-between gap-4">
            {/* Status Messages */}
            <div className="flex-1 min-w-0">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 animate-fade-in">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">Salvo com sucesso!</span>
                </div>
              )}
              {hasChanges && !saveSuccess && (
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  Alterações não salvas
                </span>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || (!hasChanges && !enabledCount)}
              className={`
                flex items-center gap-2 px-6 py-3 font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98] whitespace-nowrap
                ${hasChanges
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/25'
                }
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
              `}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">{hasChanges ? 'Salvar' : 'Salvar'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Active Automations */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirmDialog(false)}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Automação Ativa
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Você está salvando alterações em uma ou mais automações que estão <strong className="text-amber-600 dark:text-amber-400">ativas</strong>.
              </p>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-300">Importante:</strong> As alterações <strong>não afetam</strong> mensagens já enviadas ou agendadas. Apenas <strong>futuros envios</strong> usarão as novas configurações.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={performSave}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-lg shadow-amber-500/25 transition-all"
              >
                Salvar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
};

export default AutomationRules;
