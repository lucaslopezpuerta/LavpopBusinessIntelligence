// colorMapping.js v3.4 - BILAVNOVA PRECISION PALETTE
// Unified semantic color mapping for Intelligence components
// Design System v6.2 compliant - Brand-aligned with vibrant semantic colors
//
// Bilavnova Precision Accent Colors (v6.2 - Vibrant Tailwind 500):
// - Success: cosmic-green (#22C55E) - Tailwind green-500
// - Warning: cosmic-amber (#F59E0B) - Tailwind amber-500
// - Error: cosmic-rose (#EF4444) - Tailwind red-500
// - Primary: stellar-cyan (#00aeef) - Brand electric cyan
// - Secondary: stellar-blue (#2d388a) - Brand deep royal
// - Special: cosmic-purple (#A855F7) - Tailwind purple-500
//
// CHANGELOG:
// v3.4 (2026-02-11): Insight category color exports
//   - insightCategoryMap: maps insight categories → semantic color keys
//   - insightCategoryText: isDark-aware text classes per category
//   - hexToRgba: shared hex→rgba utility (moved from InsightCard)
// v3.3 (2026-02-02): KPICard icon glow colors
//   - Added accentColor to semantic colors for dark mode icon glow
//   - revenue, cost, profit, positive, negative, neutral, warning, blue
//   - Fixes cyan-only glow fallback in KPICard.jsx
// v3.2 (2026-01-30): Bilavnova Precision - Vibrant semantic colors
//   - Replaced muted Nord semantic colors with vibrant Tailwind 500-level:
//     cosmic-green: #A3BE8C → #22C55E (green-500)
//     cosmic-amber: #EBCB8B → #F59E0B (amber-500)
//     cosmic-rose: #BF616A → #EF4444 (red-500)
//     cosmic-purple: #B48EAD → #A855F7 (purple-500)
//   - Updated chartColors primary palette and semantic colors
//   - All colors WCAG AA verified
// v3.1 (2026-01-30): Bilavnova Precision - Brand color restoration
//   - Restored brand gradient: #2d388a → #00aeef (from logo)
//   - stellar-cyan now #00aeef (brand vibrant) instead of #88C0D0
//   - stellar-blue now #2d388a (brand deep) instead of #5E81AC
//   - Removed Nord-specific stellar-ice and stellar-frost
//   - Maintained WCAG AA compliance throughout
// v3.0 (2026-01-30): Aurora Borealis - Nord-inspired palette
//   - Updated chart colors to use Aurora palette
//   - stellar colors now reference Nord frost (#88C0D0)
//   - Maintained WCAG AA compliance throughout
// v2.1 (2026-01-29): Mode-aware warning colors for light mode refinement
//   - Light mode warnings: Soft tinted amber (bg-amber-50, text-amber-800)
//   - Dark mode warnings: Solid amber (bg-amber-500, text-white)
//   - medium confidence: Mode-aware (soft light, solid dark)
//   - fair badge: Mode-aware (soft light, solid dark)
//   - Icon wells remain solid for visual consistency
// v2.0 (2026-01-29): Cosmic Precision 2.0 - Warning color unification
//   - REVERTED yellow back to AMBER for WCAG AA compliance (4.7:1 contrast)
//   - Yellow-600 fails WCAG AA (3.5:1 contrast) - DO NOT USE for warnings
// v1.4 (2026-01-29): Orange to yellow migration (REVERTED in v2.0)
// v1.3 (2026-01-29): Amber to orange migration (REVERTED in v2.0)
// v1.2 (2026-01-29): Complete solid color migration for WCAG AA
//   - Confidence levels (high/medium/low) now solid with white text
//   - Campaign status badges now solid with white text
//   - Comfort category badges now solid with badgeText property
// v1.1 (2026-01-29): Solid color icon wells for WCAG AA compliance
//   - All iconBg entries now use solid colors
//   - Icon colors now white for proper contrast
// v1.0 (2025-11-30): Initial implementation
//   - Semantic color roles for business metrics
//   - Weather-specific colors
//   - Confidence level colors
//   - Dark mode support built-in

/**
 * Semantic color mappings for Intelligence dashboard
 * Each color includes all necessary Tailwind classes for consistent styling
 */
export const semanticColors = {
  // Primary business metrics
  revenue: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-100',
    textMuted: 'text-emerald-700 dark:text-emerald-300',
    textSubtle: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-white',
    iconBg: 'bg-emerald-600 dark:bg-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
    ring: 'ring-emerald-500',
    solidGradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    accentColor: { dark: '#34d399', light: '#10b981' }, // emerald-400 / emerald-500 for icon glow
  },
  cost: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    bgGradient: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100',
    textMuted: 'text-red-700 dark:text-red-300',
    textSubtle: 'text-red-600 dark:text-red-400',
    icon: 'text-white',
    iconBg: 'bg-red-600 dark:bg-red-500',
    gradient: 'from-red-500 to-red-600',
    ring: 'ring-red-500',
    solidGradient: 'bg-gradient-to-br from-red-500 to-rose-600',
    accentColor: { dark: '#f87171', light: '#ef4444' }, // red-400 / red-500 for icon glow
  },
  profit: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-900 dark:text-purple-100',
    textMuted: 'text-purple-700 dark:text-purple-300',
    textSubtle: 'text-purple-600 dark:text-purple-400',
    icon: 'text-white',
    iconBg: 'bg-purple-600 dark:bg-purple-500',
    gradient: 'from-purple-500 to-purple-600',
    ring: 'ring-purple-500',
    solidGradient: 'bg-gradient-to-br from-purple-500 to-violet-600',
    accentColor: { dark: '#c4b5fd', light: '#a855f7' }, // purple-300 / purple-500 for icon glow
  },

  // Trend indicators
  positive: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-100',
    textMuted: 'text-emerald-700 dark:text-emerald-300',
    textSubtle: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-white',
    iconBg: 'bg-emerald-600 dark:bg-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
    ring: 'ring-emerald-500',
    solidGradient: 'bg-gradient-to-br from-emerald-500 to-green-600',
    accentColor: { dark: '#34d399', light: '#10b981' }, // emerald-400 / emerald-500 for icon glow
  },
  negative: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    bgGradient: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100',
    textMuted: 'text-red-700 dark:text-red-300',
    textSubtle: 'text-red-600 dark:text-red-400',
    icon: 'text-white',
    iconBg: 'bg-red-600 dark:bg-red-500',
    gradient: 'from-red-500 to-red-600',
    ring: 'ring-red-500',
    solidGradient: 'bg-gradient-to-br from-red-500 to-rose-600',
    accentColor: { dark: '#f87171', light: '#ef4444' }, // red-400 / red-500 for icon glow
  },
  neutral: {
    bg: 'bg-slate-50 dark:bg-slate-800',
    bgGradient: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-900 dark:text-white',
    textMuted: 'text-slate-700 dark:text-slate-300',
    textSubtle: 'text-slate-600 dark:text-slate-400',
    icon: 'text-white',
    iconBg: 'bg-slate-100 dark:bg-slate-700',
    gradient: 'from-slate-500 to-slate-600',
    ring: 'ring-slate-500',
    solidGradient: 'bg-gradient-to-br from-slate-500 to-slate-600',
    accentColor: { dark: '#94a3b8', light: '#64748b' }, // slate-400 / slate-500 for icon glow
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    bgGradient: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    textMuted: 'text-amber-700 dark:text-amber-300',
    textSubtle: 'text-amber-600 dark:text-amber-400',
    icon: 'text-white',
    iconBg: 'bg-amber-600 dark:bg-amber-500',  // FIXED: amber (WCAG 4.7:1), not yellow (3.5:1)
    gradient: 'from-amber-500 to-amber-600',
    ring: 'ring-amber-500',
    solidGradient: 'bg-gradient-to-br from-amber-500 to-amber-600',
    accentColor: { dark: '#fbbf24', light: '#f59e0b' }, // amber-400 / amber-500 for icon glow
  },

  // Weather-specific (semantic colors for weather conditions)
  sunny: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    bgGradient: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    textMuted: 'text-amber-700 dark:text-amber-300',
    textSubtle: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-800/50',
    gradient: 'from-amber-400 to-yellow-500',
    ring: 'ring-amber-500',
    chartColor: '#f59e0b',
  },
  cloudy: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    bgGradient: 'bg-gradient-to-br from-slate-50 via-gray-100 to-slate-50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-900 dark:text-slate-100',
    textMuted: 'text-slate-700 dark:text-slate-300',
    textSubtle: 'text-slate-600 dark:text-slate-400',
    icon: 'text-slate-500 dark:text-slate-400',
    iconBg: 'bg-slate-200 dark:bg-slate-700',
    gradient: 'from-slate-400 to-gray-500',
    ring: 'ring-slate-500',
    chartColor: '#64748b',
  },
  rainy: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    bgGradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    textMuted: 'text-blue-700 dark:text-blue-300',
    textSubtle: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-200 dark:bg-blue-800/50',
    gradient: 'from-blue-400 to-indigo-500',
    ring: 'ring-blue-500',
    chartColor: '#3b82f6',
  },

  // Comfort-based weather categories (thermal comfort classification)
  muggy: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    bgGradient: 'bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-900 dark:text-orange-100',
    textMuted: 'text-orange-700 dark:text-orange-300',
    textSubtle: 'text-orange-600 dark:text-orange-400',
    icon: 'text-orange-500 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-800/50',
    gradient: 'from-orange-400 to-red-500',
    ring: 'ring-orange-500',
    chartColor: '#f97316',
  },
  hot: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    bgGradient: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-900 dark:text-yellow-100',
    textMuted: 'text-yellow-700 dark:text-yellow-300',
    textSubtle: 'text-yellow-600 dark:text-yellow-400',
    icon: 'text-yellow-500 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-800/50',
    gradient: 'from-yellow-400 to-amber-500',
    ring: 'ring-yellow-500',
    chartColor: '#eab308',
  },
  cold: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    bgGradient: 'bg-gradient-to-br from-cyan-50 via-sky-50 to-cyan-50 dark:from-cyan-900/20 dark:via-sky-900/20 dark:to-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-900 dark:text-cyan-100',
    textMuted: 'text-cyan-700 dark:text-cyan-300',
    textSubtle: 'text-cyan-600 dark:text-cyan-400',
    icon: 'text-cyan-500 dark:text-cyan-400',
    iconBg: 'bg-cyan-100 dark:bg-cyan-800/50',
    gradient: 'from-cyan-400 to-sky-500',
    ring: 'ring-cyan-500',
    chartColor: '#06b6d4',
  },
  mild: {
    bg: 'bg-lime-50 dark:bg-lime-900/20',
    bgGradient: 'bg-gradient-to-br from-lime-50 via-green-50 to-lime-50 dark:from-lime-900/20 dark:via-green-900/20 dark:to-lime-900/20',
    border: 'border-lime-200 dark:border-lime-800',
    text: 'text-lime-900 dark:text-lime-100',
    textMuted: 'text-lime-700 dark:text-lime-300',
    textSubtle: 'text-lime-600 dark:text-lime-400',
    icon: 'text-lime-500 dark:text-lime-400',
    iconBg: 'bg-lime-100 dark:bg-lime-800/50',
    gradient: 'from-lime-400 to-green-500',
    ring: 'ring-lime-500',
    chartColor: '#84cc16',
  },
  humid: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    bgGradient: 'bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-50 dark:from-teal-900/20 dark:via-emerald-900/20 dark:to-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    text: 'text-teal-900 dark:text-teal-100',
    textMuted: 'text-teal-700 dark:text-teal-300',
    textSubtle: 'text-teal-600 dark:text-teal-400',
    icon: 'text-teal-500 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-800/50',
    gradient: 'from-teal-400 to-emerald-500',
    ring: 'ring-teal-500',
    chartColor: '#14b8a6',
  },

  // Brand colors
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    textMuted: 'text-blue-700 dark:text-blue-300',
    textSubtle: 'text-blue-600 dark:text-blue-400',
    icon: 'text-white',
    iconBg: 'bg-blue-600 dark:bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    ring: 'ring-blue-500',
    solidGradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    accentColor: { dark: '#60a5fa', light: '#3b82f6' }, // blue-400 / blue-500 for icon glow
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    bgGradient: 'bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-900 dark:text-cyan-100',
    textMuted: 'text-cyan-700 dark:text-cyan-300',
    textSubtle: 'text-cyan-600 dark:text-cyan-400',
    icon: 'text-white',
    iconBg: 'bg-cyan-600 dark:bg-cyan-500',
    gradient: 'from-cyan-500 to-cyan-600',
    ring: 'ring-cyan-500',
    solidGradient: 'bg-gradient-to-br from-cyan-500 to-teal-600',
    accentColor: { dark: '#22d3ee', light: '#06b6d4' }, // cyan-400 / cyan-500 for icon glow
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    bgGradient: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-900 dark:text-orange-100',
    textMuted: 'text-orange-700 dark:text-orange-300',
    textSubtle: 'text-orange-600 dark:text-orange-400',
    icon: 'text-white',
    iconBg: 'bg-orange-600 dark:bg-orange-500',
    gradient: 'from-orange-500 to-orange-600',
    ring: 'ring-orange-500',
    solidGradient: 'bg-gradient-to-br from-orange-500 to-amber-600',
    accentColor: { dark: '#fb923c', light: '#f97316' }, // orange-400 / orange-500 for icon glow
  },

  // WhatsApp brand colors
  whatsapp: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-900 dark:text-green-100',
    textMuted: 'text-green-700 dark:text-green-300',
    textSubtle: 'text-green-600 dark:text-green-400',
    icon: 'text-white',
    iconBg: 'bg-green-600 dark:bg-green-500',
    gradient: 'from-green-500 to-emerald-600',
    ring: 'ring-green-500',
    solidGradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
  },
  whatsappTeal: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    bgGradient: 'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-800/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-100',
    textMuted: 'text-emerald-700 dark:text-emerald-300',
    textSubtle: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-white',
    iconBg: 'bg-emerald-600 dark:bg-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-500',
    solidGradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  },
  whatsappDark: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    bgGradient: 'bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-800/20',
    border: 'border-teal-200 dark:border-teal-800',
    text: 'text-teal-900 dark:text-teal-100',
    textMuted: 'text-teal-700 dark:text-teal-300',
    textSubtle: 'text-teal-600 dark:text-teal-400',
    icon: 'text-white',
    iconBg: 'bg-teal-600 dark:bg-teal-500',
    gradient: 'from-teal-500 to-cyan-600',
    ring: 'ring-teal-500',
    solidGradient: 'bg-gradient-to-br from-teal-500 to-cyan-600',
  },
  whatsappRead: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    bgGradient: 'bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-900/20 dark:to-sky-800/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-900 dark:text-cyan-100',
    textMuted: 'text-cyan-700 dark:text-cyan-300',
    textSubtle: 'text-cyan-600 dark:text-cyan-400',
    icon: 'text-white',
    iconBg: 'bg-cyan-600 dark:bg-cyan-500',
    gradient: 'from-cyan-500 to-sky-600',
    ring: 'ring-cyan-500',
    solidGradient: 'bg-gradient-to-br from-cyan-500 to-sky-600',
  },
  stellar: {
    bg: 'bg-blue-50 dark:bg-stellar-cyan/10',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-stellar-blue/20 dark:to-stellar-cyan/10',
    border: 'border-blue-200 dark:border-stellar-cyan/20',
    text: 'text-stellar-blue dark:text-stellar-cyan',
    textMuted: 'text-blue-700 dark:text-stellar-cyan/80',
    textSubtle: 'text-blue-600 dark:text-stellar-cyan/60',
    icon: 'text-stellar-blue dark:text-stellar-cyan',
    iconBg: 'bg-stellar-blue dark:bg-stellar-cyan',
    gradient: 'from-stellar-blue to-stellar-cyan',
    ring: 'ring-stellar-cyan',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    bgGradient: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-900 dark:text-indigo-100',
    textMuted: 'text-indigo-700 dark:text-indigo-300',
    textSubtle: 'text-indigo-600 dark:text-indigo-400',
    icon: 'text-white',
    iconBg: 'bg-indigo-600 dark:bg-indigo-500',
    gradient: 'from-indigo-500 to-indigo-600',
    ring: 'ring-indigo-500',
    // Solid gradient for hero cards (white text)
    solidGradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-900 dark:text-purple-100',
    textMuted: 'text-purple-700 dark:text-purple-300',
    textSubtle: 'text-purple-600 dark:text-purple-400',
    icon: 'text-white',
    iconBg: 'bg-purple-600 dark:bg-purple-500',
    gradient: 'from-purple-500 to-purple-600',
    ring: 'ring-purple-500',
    // Solid gradient for hero cards (white text)
    solidGradient: 'bg-gradient-to-br from-purple-500 to-violet-600',
  },

  // Confidence levels - Mode-aware for WCAG AA compliance
  // Light mode: Soft tinted (refined) | Dark mode: Solid (confident)
  high: {
    bg: 'bg-emerald-600 dark:bg-emerald-500',
    border: 'border-emerald-700 dark:border-emerald-400',
    text: 'text-white',
    dot: 'bg-emerald-500',
  },
  medium: {
    // MODE-AWARE: Soft tinted in light, solid in dark
    bg: 'bg-amber-50 dark:bg-amber-500',
    border: 'border-amber-200 dark:border-amber-400',
    text: 'text-amber-800 dark:text-white',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-red-600 dark:bg-red-500',
    border: 'border-red-700 dark:border-red-400',
    text: 'text-white',
    dot: 'bg-red-500',
  },

  // Campaign status colors - Solid colors for WCAG AA compliance
  excellent: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-white',
    badge: 'bg-emerald-600 dark:bg-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
    label: 'Excelente',
  },
  good: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-white',
    badge: 'bg-blue-600 dark:bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    label: 'Bom',
  },
  fair: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    // MODE-AWARE badge: Soft tinted in light, solid in dark
    text: 'text-amber-800 dark:text-white',
    badge: 'bg-amber-50 dark:bg-amber-500',
    badgeBorder: 'border border-amber-200 dark:border-amber-400',
    gradient: 'from-amber-500 to-amber-600',
    label: 'Razoavel',
  },
  poor: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-white',
    badge: 'bg-red-600 dark:bg-red-500',
    gradient: 'from-red-500 to-red-600',
    label: 'Fraco',
  },
};

/**
 * Get semantic color object by type
 * @param {string} type - Color type key
 * @returns {object} Color mapping object
 */
export const getSemanticColor = (type) => {
  return semanticColors[type] || semanticColors.neutral;
};

/**
 * Get color based on numeric value (positive/negative)
 * @param {number} value - Numeric value to evaluate
 * @param {boolean} inverse - If true, negative is good (e.g., cost reduction)
 * @returns {object} Color mapping object
 */
export const getValueColor = (value, inverse = false) => {
  if (value === 0 || value === null || value === undefined) {
    return semanticColors.neutral;
  }
  const isPositive = inverse ? value < 0 : value > 0;
  return isPositive ? semanticColors.positive : semanticColors.negative;
};

/**
 * Get confidence level color
 * @param {number} confidence - Confidence percentage (0-100)
 * @returns {object} Color mapping object with level label
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 70) return { ...semanticColors.high, level: 'high', label: 'Alta' };
  if (confidence >= 40) return { ...semanticColors.medium, level: 'medium', label: 'Media' };
  return { ...semanticColors.low, level: 'low', label: 'Baixa' };
};

/**
 * Get campaign status color
 * @param {string} status - Campaign status (excellent, good, fair, poor)
 * @returns {object} Color mapping object
 */
export const getCampaignStatusColor = (status) => {
  return semanticColors[status] || semanticColors.fair;
};

/**
 * Chart color palette for consistent data visualization
 * v3.1: Bilavnova Precision palette - Brand aligned
 */
export const chartColors = {
  // Bilavnova Precision primary palette (v6.2 - vibrant)
  primary: ['#2d388a', '#00aeef', '#22C55E', '#F59E0B', '#EF4444', '#A855F7'],

  // Semantic chart colors (Bilavnova v6.2 - vibrant)
  revenue: '#22C55E',    // cosmic-green (vibrant)
  cost: '#EF4444',       // cosmic-rose (vibrant)
  profit: '#A855F7',     // cosmic-purple (vibrant)
  stellar: '#00aeef',    // stellar-cyan (brand)

  // Legacy alias
  lavpop: '#2d388a',     // stellar-blue (brand)

  // Weather chart colors (Bilavnova v6.2 - vibrant)
  weather: {
    sunny: '#F59E0B',    // cosmic-amber (vibrant)
    cloudy: '#4C566A',   // Nord polar night 3
    rainy: '#00aeef',    // stellar-cyan (brand)
  },

  // Trend colors (Bilavnova v6.2 - vibrant)
  positive: '#22C55E',   // cosmic-green (vibrant)
  negative: '#EF4444',   // cosmic-rose (vibrant)
  neutral: '#4C566A',    // Nord polar night 3
};

/**
 * Atmospheric weather colors - NEW DESIGN
 * Fresh, modern palette that evokes weather moods
 */
export const weatherColors = {
  // Clear sky conditions
  clearSky: {
    light: 'from-sky-400 via-blue-400 to-indigo-500',
    dark: 'from-sky-600 via-blue-700 to-indigo-800',
    accent: '#0ea5e9',  // sky-500
    bg: 'bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/40',
    text: 'text-sky-600 dark:text-sky-400',
    icon: 'text-sky-500 dark:text-sky-400',
  },

  // Sunny/hot conditions
  goldenSun: {
    light: 'from-amber-300 via-orange-400 to-rose-400',
    dark: 'from-amber-500 via-orange-600 to-rose-700',
    accent: '#f59e0b',  // amber-500
    bg: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/40',
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500 dark:text-amber-400',
  },

  // Cloudy/overcast
  stormCloud: {
    light: 'from-slate-400 via-gray-500 to-zinc-600',
    dark: 'from-slate-600 via-gray-700 to-zinc-800',
    accent: '#64748b',  // slate-500
    bg: 'bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-800/50 dark:to-gray-900/60',
    text: 'text-slate-600 dark:text-slate-400',
    icon: 'text-slate-500 dark:text-slate-400',
  },

  // Rain/precipitation
  rainDrop: {
    light: 'from-blue-400 via-cyan-500 to-teal-500',
    dark: 'from-blue-600 via-cyan-700 to-teal-800',
    accent: '#06b6d4',  // cyan-500
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/40',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500 dark:text-blue-400',
  },

  // Cold/frost
  frostCold: {
    light: 'from-cyan-300 via-sky-400 to-blue-400',
    dark: 'from-cyan-500 via-sky-600 to-blue-700',
    accent: '#22d3ee',  // cyan-400
    bg: 'bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-900/30 dark:to-sky-900/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    icon: 'text-cyan-400 dark:text-cyan-300',
  },

  // Mild/pleasant
  warmBreeze: {
    light: 'from-emerald-400 via-teal-400 to-cyan-400',
    dark: 'from-emerald-600 via-teal-700 to-cyan-700',
    accent: '#14b8a6',  // teal-500
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/40',
    text: 'text-teal-600 dark:text-teal-400',
    icon: 'text-teal-500 dark:text-teal-400',
  },

  // Humid/muggy
  humidHaze: {
    light: 'from-violet-400 via-purple-400 to-fuchsia-400',
    dark: 'from-violet-600 via-purple-700 to-fuchsia-700',
    accent: '#a855f7',  // purple-500
    bg: 'bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/40',
    text: 'text-violet-600 dark:text-violet-400',
    icon: 'text-purple-500 dark:text-purple-400',
  },
};

/**
 * Weather chart colors for Recharts visualization
 * v3.2: Bilavnova Precision palette (vibrant)
 */
export const weatherChartColors = {
  temperature: {
    stroke: '#F59E0B',      // cosmic-amber (vibrant)
    fill: 'url(#tempGradient)',
    gradient: ['#F59E0B', '#F97316', '#EF4444'], // Vibrant warm scale
  },
  precipitation: {
    stroke: '#00aeef',      // stellar-cyan (brand)
    fill: '#00aeef',
    opacity: 0.6,
  },
  humidity: {
    stroke: '#A855F7',      // cosmic-purple (vibrant)
    fill: 'url(#humidityGradient)',
  },
  wind: {
    stroke: '#2d388a',      // stellar-blue (brand)
    fill: '#2d388a',
    opacity: 0.4,
  },
  uv: {
    stroke: '#F97316',      // orange-500 (vibrant)
    fill: '#F97316',
  },
};

/**
 * Hero gradient mapping based on weather condition
 */
export const heroGradients = {
  'clear-day': 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
  'clear-night': 'bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-800',
  'partly-cloudy-day': 'bg-gradient-to-br from-slate-300 via-blue-400 to-sky-500',
  'partly-cloudy-night': 'bg-gradient-to-br from-slate-500 via-indigo-600 to-purple-700',
  'cloudy': 'bg-gradient-to-br from-slate-400 via-gray-500 to-slate-600',
  'rain': 'bg-gradient-to-br from-slate-500 via-blue-600 to-cyan-700',
  'showers-day': 'bg-gradient-to-br from-slate-400 via-blue-500 to-cyan-600',
  'showers-night': 'bg-gradient-to-br from-slate-600 via-blue-700 to-cyan-800',
  'thunder-rain': 'bg-gradient-to-br from-slate-600 via-purple-700 to-indigo-800',
  'snow': 'bg-gradient-to-br from-slate-200 via-blue-200 to-cyan-300',
  'fog': 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500',
  'wind': 'bg-gradient-to-br from-teal-400 via-cyan-500 to-sky-600',
  // Temperature-based overrides
  'hot': 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500',
  'cold': 'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600',
};

/**
 * Comfort category color mapping (Portuguese labels)
 */
export const comfortCategoryColors = {
  abafado: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    icon: 'text-orange-500 dark:text-orange-400',
    // MODE-AWARE: Soft tinted in light, solid in dark
    badge: 'bg-amber-50 dark:bg-amber-500',
    badgeBorder: 'border border-amber-200 dark:border-amber-400',
    badgeText: 'text-amber-800 dark:text-white',
    chart: '#f97316', // orange-500
  },
  quente: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-500 dark:text-amber-400',
    // MODE-AWARE: Soft tinted in light, solid in dark
    badge: 'bg-amber-50 dark:bg-amber-500',
    badgeBorder: 'border border-amber-200 dark:border-amber-400',
    badgeText: 'text-amber-800 dark:text-white',
    chart: '#f59e0b', // amber-500
  },
  ameno: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-500 dark:text-emerald-400',
    badge: 'bg-emerald-600 dark:bg-emerald-500',
    badgeText: 'text-white',
    chart: '#10b981', // emerald-500
  },
  frio: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-700 dark:text-cyan-300',
    icon: 'text-cyan-500 dark:text-cyan-400',
    badge: 'bg-cyan-600 dark:bg-cyan-500',
    badgeText: 'text-white',
    chart: '#06b6d4', // cyan-500
  },
  umido: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    text: 'text-teal-700 dark:text-teal-300',
    icon: 'text-teal-500 dark:text-teal-400',
    badge: 'bg-teal-600 dark:bg-teal-500',
    badgeText: 'text-white',
    chart: '#14b8a6', // teal-500
  },
  chuvoso: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-500 dark:text-blue-400',
    badge: 'bg-blue-600 dark:bg-blue-500',
    badgeText: 'text-white',
    chart: '#3b82f6', // blue-500
  },
};

/**
 * Get comfort category color object
 * @param {string} category - Comfort category key
 * @returns {object} Color mapping object
 */
export const getComfortCategoryColor = (category) => {
  return comfortCategoryColors[category] || comfortCategoryColors.ameno;
};

/**
 * Convert hex color to rgba string
 * @param {string} hex - Hex color string (e.g. '#ff0000')
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} rgba string
 */
export const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * Maps insight recommendation categories to semantic color keys
 * Used by InsightCard and InsightsView for centralized color resolution
 */
export const insightCategoryMap = {
  campaign: 'blue',
  churn: 'cost',
  alert: 'warning',
  celebration: 'positive',
  ai_insight: 'profit',
  operational: 'neutral',
};

/**
 * isDark-aware text classes per insight category
 * Components use useTheme() + isDark (not dark: prefix) for Variant D compliance
 */
export const insightCategoryText = {
  campaign:    { light: 'text-blue-600',   dark: 'text-stellar-cyan' },
  churn:       { light: 'text-red-600',    dark: 'text-red-400' },
  alert:       { light: 'text-amber-600',  dark: 'text-amber-400' },
  celebration: { light: 'text-green-600',  dark: 'text-cosmic-green' },
  ai_insight:  { light: 'text-purple-600', dark: 'text-purple-400' },
  operational: { light: 'text-slate-600',  dark: 'text-slate-400' },
};

export default semanticColors;
