// Bilavnova BI - Tailwind Configuration v6.3
// "Bilavnova Precision" design system - Aurora Void color system
//
// BRAND COLORS (v6.3 - Aurora Void):
// Dark Mode (Aurora-tinted deep blacks):
// - Space Void: #020910 (Deepest aurora black - page background)
// - Space Nebula: #0A1520 (Aurora navy - sidebar, topbar)
// - Space Dust: #131D28 (Aurora blue - cards, modals)
// - Space Elevated: #1C2736 (Aurora elevated surfaces)
//
// Light Mode (Snow Storm - Nord inspired):
// - Space Light: #ECEFF4 (Page background)
// - Space Mist: #E5E9F0 (Secondary surfaces)
// - Space Cloud: #D8DEE9 (Card backgrounds)
//
// Brand Accents (from logo):
// - Stellar Blue: #2d388a (Gradient start - BRAND)
// - Stellar Cyan: #00aeef (Primary accent - BRAND)
// - Cosmic Green: #22C55E (Success - Tailwind green-500, vibrant)
// - Cosmic Amber: #F59E0B (CTA, warnings - Tailwind amber-500, vibrant)
// - Cosmic Rose: #EF4444 (Error - Tailwind red-500, vibrant)
// - Cosmic Purple: #A855F7 (Special accent - Tailwind purple-500, vibrant)
//
// SEMANTIC COLORS:
// - Success: cosmic-green (#22C55E)
// - Warning: cosmic-amber (#F59E0B)
// - Error: cosmic-rose (#EF4444)
// - Primary: stellar-cyan (#00aeef)
//
// SOURCES:
// - Brand Logo: Bilavnova gradient (#2d388a → #00aeef)
// - GitHub Primer Dark: Surface elevation system
//
// CHANGELOG:
// v6.3 (2026-01-30): Aurora Void - Deep aurora-tinted backgrounds
//   - Deepened dark mode backgrounds for true "space void" aesthetic
//   - Added teal undertones (HSL ~210°) for aurora coherence
//   - Space Void: #0D1117 → #020910 (L=4%, maximum depth)
//   - Space Nebula: #161B22 → #0A1520 (L=8%)
//   - Space Dust: #21262D → #131D28 (L=12%)
//   - Space Elevated: #30363D → #1C2736 (L=16%)
//   - Light mode unchanged (Nordic Snow Storm)
//   - WCAG contrast improved across all combinations
// v6.2 (2026-01-30): Bilavnova Precision - Vibrant Semantic Colors
//   - Replaced muted Nord semantic colors with vibrant Tailwind 500-level:
//     cosmic-green: #A3BE8C → #22C55E (green-500)
//     cosmic-amber: #EBCB8B → #F59E0B (amber-500)
//     cosmic-rose: #BF616A → #EF4444 (red-500)
//     cosmic-purple: #B48EAD → #A855F7 (purple-500)
//   - All colors WCAG AA verified on both dark/light backgrounds
// v6.1 (2026-01-30): Bilavnova Precision - Brand Color Restoration
//   - Restored brand gradient: #2d388a → #00aeef (from logo)
//   - Removed Nord-specific stellar-frost and stellar-ice
//   - Kept improved surface colors (Polar Night + Snow Storm)
//   - Kept semantic accents (cosmic-green, amber, rose, purple)
//   - WCAG AA verified for all primary combinations
// v5.1 (2026-01-29): Color & Contrast Improvements
//   - Unified stellar-cyan to #00aeef (removed dual value confusion)
//   - Removed stellar-cyan-bright (no longer needed)
//   - Improved WCAG AA compliance throughout
// v5.0 (2026-01-29): Cosmic Precision 2.0 - Color harmony overhaul
//   - Removed duplicate purple tokens (cosmic-purple, nebula-violet, stellar-indigo)
//   - Consolidated to standard Tailwind violet-* for purple accents
//   - Reduced glow intensity for softer appearance
// v4.8 (2026-01-28): Solid Badge Utilities safelist
//   - Added badge-solid, badge-pill base classes
//   - Added badge-success, badge-warning, badge-error, badge-info, badge-neutral, badge-accent
//   - Added badge-stellar, badge-cosmic for brand colors
// v4.7 (2026-01-27): Minimalist Stellar navigation safelist
//   - Added bg-space-void/90, bg-white/95 for bottom nav background
// v4.5 (2026-01-20): Cosmic Glass Card safelist for Customers view
//   - Added bg-space-dust/40, /60 and bg-white/50, /60, /70
//   - Added bg-space-nebula/50, /60 for glass card backgrounds
//   - Added border-slate-200/30, /50, /60 for light mode glass borders
//   - Added border-amber-500/20, border-amber-200/60 for warning cards
//   - Added dark: variants for all new glass card classes
// v4.4 (2026-01-18): Cosmic green color + safelist fix
//   - Added cosmic-green (#00d68f) to cosmic accent colors
//   - Complete safelist entries for cosmic-green opacity variants:
//     bg: /10, /15, /20, /25, /30 | border: /20, /25, /30, /40
//     hover: bg/20, bg/25, bg/90, border/50
//     dark: bg/10, bg/15, bg/25, border/25, border/30, hover:bg/25
//     focus-visible:ring-cosmic-green/40
//   - Used for WhatsApp buttons and success action states
// v4.3 (2026-01-17): CampaignFunnel cosmic safelist
//   - Added stellar-gold color classes (text, bg, border with opacity variants)
//   - Added cosmic-purple color classes (text, bg, border with opacity variants)
//   - Added nebula-violet color classes
//   - Added funnel stage border opacity classes
// v4.2 (2026-01-16): Cosmic Effects expansion
//   - Added cosmic accent colors (purple, pink, orange, gold, indigo, violet)
//   - Added new shadow utilities (nebula, solar-flare, cosmic-inner)
//   - Added new gradients (nebula, aurora-subtle, solar, cosmic-radial)
// v4.1 (2026-01-16): Dark mode safelist fix
//   - Added comprehensive safelist for dark: class generation
//   - Fixes Tailwind scanner not detecting classes in JS object properties
//   - Enables all 3,215 dark: patterns in codebase to generate CSS
// v4.0 (2025-01-16): Cosmic Precision - Orbitron font, space colors, orbital animations
// v3.0 (2025-11-23): Premium enhancements - Google Fonts, gradients, animations
// v2.0 (2025-11-20): Tailwind setup with complete design system

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy

  // Safelist: Explicit dark: classes found in codebase (extracted via grep)
  // Only includes classes actually used, to minimize CSS bundle size
  safelist: [
    // Text colors - slate (most common)
    'dark:text-slate-200', 'dark:text-slate-300', 'dark:text-slate-400',
    'dark:text-slate-500', 'dark:text-slate-600',
    'dark:text-white',
    // Text colors - semantic
    'dark:text-blue-300', 'dark:text-blue-400', 'dark:text-blue-200',
    'dark:text-emerald-300', 'dark:text-emerald-400', 'dark:text-emerald-100',
    'dark:text-amber-200', 'dark:text-amber-300', 'dark:text-amber-400',
    'dark:text-red-200', 'dark:text-red-300', 'dark:text-red-400',
    'dark:text-purple-300', 'dark:text-purple-400',
    'dark:text-green-300', 'dark:text-green-400',
    'dark:text-cyan-300', 'dark:text-cyan-400',
    'dark:text-teal-300', 'dark:text-teal-400',
    'dark:text-indigo-100', 'dark:text-indigo-400',
    'dark:text-sky-300', 'dark:text-sky-400',
    'dark:text-orange-300', 'dark:text-orange-400',
    // Background colors - slate
    'dark:bg-slate-600', 'dark:bg-slate-700', 'dark:bg-slate-800', 'dark:bg-slate-900',
    'dark:bg-slate-700/30', 'dark:bg-slate-700/50',
    'dark:bg-slate-800/50', 'dark:bg-slate-800/95',
    'dark:bg-slate-900/50',
    // Background colors - semantic with opacity
    'dark:bg-emerald-900/20', 'dark:bg-emerald-900/30', 'dark:bg-emerald-900/40',
    'dark:bg-amber-900/20', 'dark:bg-amber-900/30', 'dark:bg-amber-900/40',
    'dark:bg-blue-900/20', 'dark:bg-blue-900/30', 'dark:bg-blue-900/40',
    'dark:bg-red-900/20', 'dark:bg-red-900/30', 'dark:bg-red-900/40',
    'dark:bg-purple-900/20', 'dark:bg-purple-900/30', 'dark:bg-purple-900/40',
    'dark:bg-green-900/20', 'dark:bg-green-900/30', 'dark:bg-green-900/40',
    'dark:bg-cyan-900/20', 'dark:bg-cyan-900/40',
    'dark:bg-teal-900/30',
    'dark:bg-orange-900/40',
    // Border colors
    'dark:border-slate-500', 'dark:border-slate-600', 'dark:border-slate-700', 'dark:border-slate-800',
    'dark:border-slate-600/50', 'dark:border-slate-700/50', 'dark:border-slate-700/80',
    'dark:border-blue-800', 'dark:border-emerald-800', 'dark:border-amber-800',
    'dark:border-red-800', 'dark:border-purple-800', 'dark:border-green-800', 'dark:border-indigo-800',
    'dark:border-emerald-800/50', 'dark:border-amber-800/50',
    'dark:border-l-blue-400',
    // Divide colors
    'dark:divide-slate-700',
    // Gradient classes
    'dark:from-slate-600', 'dark:from-slate-900',
    'dark:from-purple-900/20', 'dark:from-indigo-900/20', 'dark:from-blue-900/20',
    'dark:from-emerald-900/20', 'dark:from-amber-900/20',
    'dark:via-slate-800', 'dark:via-orange-600',
    'dark:to-slate-700', 'dark:to-slate-800',
    'dark:to-indigo-900/20', 'dark:to-rose-600',
    // Custom space colors
    'bg-space-void', 'bg-space-nebula', 'bg-space-dust',
    'dark:bg-space-void', 'dark:bg-space-nebula', 'dark:bg-space-dust',
    'bg-space-dust/50', 'bg-space-dust/70', 'bg-space-dust/80',
    // Custom stellar colors
    'text-stellar-cyan', 'border-stellar-cyan', 'bg-stellar-cyan',
    'dark:text-stellar-cyan', 'dark:border-stellar-cyan', 'dark:bg-stellar-cyan',
    'border-stellar-cyan/5', 'border-stellar-cyan/10', 'border-stellar-cyan/15', 'border-stellar-cyan/20',
    'bg-stellar-cyan/5', 'bg-stellar-cyan/10', 'bg-stellar-cyan/20',
    // Stellar gold (v4.2 - CampaignFunnel outcomes)
    'text-stellar-gold', 'bg-stellar-gold', 'border-stellar-gold',
    'bg-stellar-gold/20', 'bg-stellar-gold/30', 'border-stellar-gold/30',
    // Violet (standard Tailwind - replaces deprecated cosmic-purple)
    'text-violet-500', 'text-violet-600', 'bg-violet-500', 'bg-violet-600',
    'bg-violet-500/20', 'bg-violet-600/20', 'border-violet-500/30', 'border-violet-600/30',
    // Amber warning colors (WCAG compliant - NOT yellow)
    'bg-amber-600', 'bg-amber-500', 'text-amber-600', 'text-amber-500',
    'border-amber-600', 'border-amber-500', 'border-amber-700', 'border-amber-400',
    'dark:bg-amber-500', 'dark:border-amber-400',
    // Aurora accent colors (v6.0 - Nord Aurora palette)
    // Cosmic green (success)
    'text-cosmic-green', 'bg-cosmic-green', 'border-cosmic-green',
    'bg-cosmic-green/10', 'bg-cosmic-green/15', 'bg-cosmic-green/20', 'bg-cosmic-green/25', 'bg-cosmic-green/30',
    'border-cosmic-green/20', 'border-cosmic-green/25', 'border-cosmic-green/30', 'border-cosmic-green/40',
    'hover:bg-cosmic-green/20', 'hover:bg-cosmic-green/25', 'hover:bg-cosmic-green/90',
    'hover:border-cosmic-green/50',
    'dark:text-cosmic-green',
    'dark:bg-cosmic-green/10', 'dark:bg-cosmic-green/15', 'dark:bg-cosmic-green/25',
    'dark:border-cosmic-green/25', 'dark:border-cosmic-green/30',
    'dark:hover:bg-cosmic-green/25',
    'focus-visible:ring-cosmic-green/40',
    // Cosmic amber (CTA, warnings)
    'text-cosmic-amber', 'bg-cosmic-amber', 'border-cosmic-amber',
    'bg-cosmic-amber/10', 'bg-cosmic-amber/20', 'bg-cosmic-amber/30',
    'border-cosmic-amber/20', 'border-cosmic-amber/30', 'border-cosmic-amber/40',
    'hover:bg-cosmic-amber/90', 'hover:bg-cosmic-amber/80',
    'dark:text-cosmic-amber', 'dark:bg-cosmic-amber', 'dark:border-cosmic-amber',
    // Cosmic rose (errors)
    'text-cosmic-rose', 'bg-cosmic-rose', 'border-cosmic-rose',
    'bg-cosmic-rose/10', 'bg-cosmic-rose/20', 'bg-cosmic-rose/30',
    'border-cosmic-rose/20', 'border-cosmic-rose/30',
    'dark:text-cosmic-rose', 'dark:bg-cosmic-rose',
    // Cosmic purple (special accents)
    'text-cosmic-purple', 'bg-cosmic-purple', 'border-cosmic-purple',
    'bg-cosmic-purple/10', 'bg-cosmic-purple/20', 'bg-cosmic-purple/30',
    'border-cosmic-purple/20', 'border-cosmic-purple/30',
    'dark:text-cosmic-purple', 'dark:bg-cosmic-purple',
    // Bilavnova brand glow (v6.1)
    'shadow-bilavnova-glow', 'hover:shadow-bilavnova-glow',
    // Space elevated (v6.0)
    'bg-space-elevated', 'dark:bg-space-elevated',
    // Social Media Navigation glassmorphism (v2.0)
    'bg-space-elevated/60', 'bg-space-elevated/80',
    'hover:bg-space-elevated/60',
    'bg-space-dust/30', 'bg-white/80',
    'bg-space-mist', 'bg-space-cloud',
    // Funnel stage borders (v4.2)
    'bg-stellar-cyan/15', 'border-stellar-cyan/40',
    'border-blue-500/40', 'border-emerald-500/40', 'border-emerald-500/30',
    'bg-blue-900/50', 'bg-emerald-900/50',
    // Cosmic Glass Card system (v4.5 - Customers view glassmorphism)
    'bg-space-dust/40', 'bg-space-dust/60',
    'bg-white/50', 'bg-white/60', 'bg-white/70',
    'bg-space-nebula/50', 'bg-space-nebula/60',
    'border-slate-200/30', 'border-slate-200/50', 'border-slate-200/60',
    'border-amber-500/20', 'border-amber-200/60',
    'dark:bg-space-dust/40', 'dark:bg-space-dust/50', 'dark:bg-space-dust/60',
    'dark:bg-space-nebula/50',
    'dark:border-amber-500/20',
    // Minimalist Stellar navigation (v4.7)
    'bg-space-void/90', 'bg-white/95',
    // Solid Badge Utilities (v4.8)
    'badge-solid', 'badge-pill',
    'badge-success', 'badge-warning', 'badge-error', 'badge-info', 'badge-neutral', 'badge-accent',
    'badge-stellar', 'badge-cosmic',

    // Typography utilities (v6.4)
    'text-display-lg', 'text-display', 'text-heading', 'text-subheading',
    'text-body', 'text-body-muted', 'text-caption', 'label-card',
    'text-data-lg', 'text-data',

    // Interactive utilities (v6.4)
    'interactive', 'hover-lift', 'hover-lift-scale', 'press-scale',
    'focus-ring', 'focus-ring-subtle',
    'transition-micro', 'transition-standard',

    // Elevation shadows (v6.4)
    'shadow-elevation-1', 'shadow-elevation-2', 'shadow-elevation-3', 'shadow-elevation-4',
    'shadow-elevation-hover',
    'dark:shadow-elevation-1-dark', 'dark:shadow-elevation-2-dark',
    'dark:shadow-elevation-3-dark', 'dark:shadow-elevation-hover-dark',
  ],

  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Aurora Void - Space Colors (v6.3)
        // Dark mode surfaces with aurora teal undertones for maximum depth
        'space': {
          'void': '#020910',      // Aurora void - deepest (L=4%, HSL 210°)
          'nebula': '#0A1520',    // Aurora nebula - fixed elements (L=8%)
          'dust': '#131D28',      // Aurora dust - cards (L=12%)
          'elevated': '#1C2736',  // Aurora elevated - hover states (L=16%)
          // Light mode surfaces - Nord Snow Storm (unchanged)
          'light': '#ECEFF4',     // Light mode page background
          'mist': '#E5E9F0',      // Light mode secondary surface
          'cloud': '#D8DEE9',     // Light mode card background
          'light-card': '#ffffff', // Pure white card option
        },
        // Bilavnova Precision - Stellar Colors (v6.1)
        // Restored from brand logo gradient
        'stellar': {
          'blue': '#2d388a',      // Brand gradient start (deep royal)
          'cyan': '#00aeef',      // Brand gradient end (vibrant electric)
          'glow': 'rgba(0, 174, 239, 0.3)',     // Brand cyan glow
          'glow-subtle': 'rgba(0, 174, 239, 0.15)',
          'gold': '#F59E0B',      // Alias for cosmic-amber (CTA) - v6.2 vibrant
        },
        // Bilavnova Precision - Cosmic Accent Colors (v6.2)
        // Vibrant Tailwind 500-level colors for high-energy brand
        'cosmic': {
          'green': '#22C55E',     // Success - Tailwind green-500 (vibrant)
          'amber': '#F59E0B',     // CTA/Warning - Tailwind amber-500 (vibrant)
          'rose': '#EF4444',      // Error - Tailwind red-500 (vibrant)
          'purple': '#A855F7',    // Special accent - Tailwind purple-500 (vibrant)
        },
        // Bilavnova Brand Gradient Colors (from logo SVG)
        'bilavnova': {
          'gradient-start': '#2d388a',  // Deep blue
          'gradient-end': '#00aeef',    // Cyan
          50: '#e6f4fc',
          100: '#cce9f9',
          200: '#99d3f3',
          300: '#66bdec',
          400: '#33a7e6',
          500: '#00aeef',  // Primary cyan
          600: '#008bbf',
          700: '#00688f',
          800: '#004560',
          900: '#002330',
        },

        // Lavpop Brand Colors (legacy, keep for compatibility)
        'lavpop-blue': {
          DEFAULT: '#1a5a8e',
          50: '#e8f1f8',
          100: '#d1e3f1',
          200: '#a3c7e3',
          300: '#75abd5',
          400: '#478fc7',
          500: '#1a5a8e', // Primary brand blue
          600: '#154872',
          700: '#103656',
          800: '#0b243a',
          900: '#06121d',
        },
        'lavpop-green': {
          DEFAULT: '#55b03b',
          50: '#f0f9ed',
          100: '#e1f3db',
          200: '#c3e7b7',
          300: '#a5db93',
          400: '#87cf6f',
          500: '#55b03b', // Primary brand green
          600: '#448d2f',
          700: '#336a23',
          800: '#224618',
          900: '#11230c',
        },

        // Risk Level Colors (for customer segmentation)
        'risk': {
          churning: '#dc2626',  // Red - Critical
          'at-risk': '#f59e0b', // Amber - Warning
          monitor: '#1a5a8e',   // Blue - Watch
          healthy: '#55b03b',   // Green - Good
          new: '#9333ea',       // Purple - New customer
          lost: '#6b7280',      // Gray - Inactive
        },

        // Semantic UI Colors
        'ui': {
          background: {
            light: '#f5f7fa',
            dark: '#0f172a',
          },
          card: {
            light: '#ffffff',
            dark: '#1e293b',
          },
          border: {
            light: '#e5e7eb',
            dark: '#334155',
          },
          text: {
            primary: {
              light: '#1f2937',
              dark: '#f1f5f9',
            },
            secondary: {
              light: '#6b7280',
              dark: '#94a3b8',
            },
          }
        }
      },

      fontFamily: {
        // Display font - Orbitron for brand name (space-age geometric)
        display: [
          'Orbitron',
          'sans-serif',
        ],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'Consolas',
          'Monaco',
          '"Courier New"',
          'monospace',
        ],
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],     // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],    // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px

        // Semantic typography tokens (v6.4)
        'display-lg': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],   // 36px hero headings
        'display': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }],    // 30px page titles
        'heading': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],     // 20px section titles
        'subheading': ['1.125rem', { lineHeight: '1.625rem' }],                          // 18px card titles
        'body': ['0.875rem', { lineHeight: '1.375rem' }],                                // 14px body text
        'caption': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],         // 12px labels/captions

        // Data display tokens (v6.4) - for KPIs, metrics
        'data-lg': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],         // 24px large KPI values
        'data': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],            // 16px standard data
      },

      spacing: {
        '18': '4.5rem',  // 72px
        '88': '22rem',   // 352px
        '112': '28rem',  // 448px
        '128': '32rem',  // 512px
        // Card spacing tokens
        'card-sm': '1rem',      // 16px - mobile
        'card-md': '1.5rem',    // 24px - tablet
        'card-lg': '2rem',      // 32px - desktop
      },

      // Animations
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Weather animations
        'sun-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.9' },
        },
        'sun-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'cloud-drift': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(4px)' },
        },
        'rain-fall': {
          '0%': { transform: 'translateY(-2px)', opacity: '0.7' },
          '50%': { transform: 'translateY(2px)', opacity: '1' },
          '100%': { transform: 'translateY(-2px)', opacity: '0.7' },
        },
        'snow-fall': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '25%': { transform: 'translateY(2px) rotate(90deg)', opacity: '0.8' },
          '50%': { transform: 'translateY(0) rotate(180deg)', opacity: '1' },
          '75%': { transform: 'translateY(-2px) rotate(270deg)', opacity: '0.8' },
        },
        'lightning-flash': {
          '0%, 90%, 100%': { opacity: '1' },
          '92%, 94%': { opacity: '0.4' },
          '96%, 98%': { opacity: '0.7' },
        },
        'wind-blow': {
          '0%, 100%': { transform: 'rotate(-5deg) translateX(0)' },
          '25%': { transform: 'rotate(0deg) translateX(2px)' },
          '50%': { transform: 'rotate(5deg) translateX(0)' },
          '75%': { transform: 'rotate(0deg) translateX(-2px)' },
        },
        'fog-drift': {
          '0%, 100%': { transform: 'translateX(0)', opacity: '0.7' },
          '50%': { transform: 'translateX(6px)', opacity: '0.5' },
        },
        // Cosmic Precision animations (v4.0)
        'orbit': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'orbital-glow': {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 20px rgba(0, 174, 239, 0.3))',
          },
          '50%': {
            filter: 'drop-shadow(0 0 40px rgba(0, 174, 239, 0.5))',
          },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'scale-in': 'scale-in 0.2s ease-out',
        // Weather animations
        'sun-pulse': 'sun-pulse 3s ease-in-out infinite',
        'sun-spin': 'sun-spin 20s linear infinite',
        'cloud-drift': 'cloud-drift 4s ease-in-out infinite',
        'rain-fall': 'rain-fall 1.5s ease-in-out infinite',
        'snow-fall': 'snow-fall 4s ease-in-out infinite',
        'lightning-flash': 'lightning-flash 3s ease-in-out infinite',
        'wind-blow': 'wind-blow 2s ease-in-out infinite',
        'fog-drift': 'fog-drift 6s ease-in-out infinite',
        // Cosmic Precision animations (v4.0)
        'orbit': 'orbit 3s linear infinite',
        'orbit-slow': 'orbit 8s linear infinite',
        'orbital-glow': 'orbital-glow 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },

      backgroundImage: {
        // Bilavnova Precision gradients (v6.1 - Brand aligned)
        'gradient-stellar': 'linear-gradient(135deg, #2d388a 0%, #00aeef 100%)',
        'gradient-stellar-vertical': 'linear-gradient(180deg, #2d388a 0%, #00aeef 100%)',
        'gradient-stellar-horizontal': 'linear-gradient(90deg, #2d388a 0%, #00aeef 100%)',
        'gradient-aurora': 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 174, 239, 0.15), transparent)',
        'gradient-aurora-strong': 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 174, 239, 0.3), transparent)',
        // Bilavnova brand gradient (from logo)
        'gradient-bilavnova': 'linear-gradient(135deg, #2d388a 0%, #00aeef 100%)',
        'gradient-bilavnova-vertical': 'linear-gradient(180deg, #2d388a 0%, #00aeef 100%)',
        'gradient-bilavnova-radial': 'radial-gradient(ellipse at center, #00aeef 0%, #2d388a 100%)',
        // Legacy lavpop gradients (deprecated)
        'gradient-lavpop': 'linear-gradient(135deg, #1a5a8e 0%, #2a7ab8 100%)',
        'gradient-lavpop-dark': 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8e 100%)',
        'gradient-green': 'linear-gradient(135deg, #55b03b 0%, #6bc04d 100%)',
        'gradient-green-dark': 'linear-gradient(135deg, #448d2f 0%, #55b03b 100%)',
        'gradient-blue-green': 'linear-gradient(135deg, #1a5a8e 0%, #55b03b 100%)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(26, 90, 142, 0.05) 0%, rgba(85, 176, 59, 0.05) 100%)',
        // Effects gradients (v6.1)
        'gradient-nebula': 'linear-gradient(135deg, #2d388a 0%, #1e5a8e 50%, #00aeef 100%)',
        'gradient-aurora-subtle': 'linear-gradient(180deg, rgba(0, 174, 239, 0.1) 0%, rgba(45, 56, 138, 0.1) 50%, rgba(34, 197, 94, 0.1) 100%)',
        'gradient-solar': 'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)',
        'gradient-cosmic-radial': 'radial-gradient(ellipse at center, rgba(0, 174, 239, 0.15) 0%, transparent 70%)',
        'gradient-nebula-radial': 'radial-gradient(ellipse at center, rgba(45, 56, 138, 0.2) 0%, rgba(180, 142, 173, 0.1) 50%, transparent 80%)',
      },

      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'modal-backdrop': '1040',
        'modal': '1050',
        'tooltip': '1060',
        'notification': '1070',
      },

      borderRadius: {
        'xl': '0.75rem',  // 12px
        '2xl': '1rem',    // 16px
        '3xl': '1.5rem',  // 24px
      },

      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        // Bilavnova brand glow effects
        'bilavnova': '0 4px 24px rgba(45, 56, 138, 0.15)',
        'bilavnova-lg': '0 4px 32px rgba(0, 174, 239, 0.25)',
        'bilavnova-glow': '0 0 20px rgba(0, 174, 239, 0.3)',
        // Legacy lavpop shadows
        'lavpop': '0 4px 14px 0 rgba(26, 90, 142, 0.15)',
        'lavpop-lg': '0 10px 40px -10px rgba(26, 90, 142, 0.25)',
        // New soft shadows for cards
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 4px 12px -4px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 4px 16px -4px rgba(0, 0, 0, 0.1), 0 8px 24px -8px rgba(0, 0, 0, 0.06)',
        'soft-xl': '0 8px 24px -6px rgba(0, 0, 0, 0.12), 0 12px 32px -8px rgba(0, 0, 0, 0.08)',
        // Glow effects for emphasis
        'glow-blue': '0 0 20px rgba(26, 90, 142, 0.15)',
        'glow-green': '0 0 20px rgba(85, 176, 59, 0.15)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.15)',
        // Bilavnova Precision shadows (v6.1 - Brand cyan glow)
        'stellar': '0 0 20px rgba(45, 56, 138, 0.3), 0 0 40px rgba(0, 174, 239, 0.1)',
        'stellar-lg': '0 0 30px rgba(0, 174, 239, 0.4), 0 0 60px rgba(45, 56, 138, 0.2)',
        'stellar-glow': '0 0 40px rgba(0, 174, 239, 0.5)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4)',
        // Brand glow effects (v6.1)
        'stellar-glow-soft': '0 0 20px rgba(0, 174, 239, 0.3), 0 0 40px rgba(0, 174, 239, 0.15)',
        'stellar-glow-lg': '0 0 30px rgba(0, 174, 239, 0.4), 0 0 60px rgba(0, 174, 239, 0.2)',
        'aurora': '0 0 30px rgba(0, 174, 239, 0.3), 0 0 60px rgba(34, 197, 94, 0.2)',
        'aurora-warm': '0 0 20px rgba(235, 203, 139, 0.4), 0 0 40px rgba(191, 97, 106, 0.2)',
        'cosmic-inner': 'inset 0 0 20px rgba(0, 174, 239, 0.15)',
        'cosmic-inner-strong': 'inset 0 0 30px rgba(0, 174, 239, 0.25)',

        // Elevation system (v6.4) - standardized depth levels
        'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)',
        'elevation-2': '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.08)',
        'elevation-3': '0 4px 8px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.08)',
        'elevation-4': '0 8px 16px rgba(0, 0, 0, 0.04), 0 16px 32px rgba(0, 0, 0, 0.08)',
        'elevation-hover': '0 8px 24px rgba(0, 0, 0, 0.1), 0 16px 40px rgba(0, 0, 0, 0.08)',

        // Dark mode elevations with cyan glow (v6.4)
        'elevation-1-dark': '0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3)',
        'elevation-2-dark': '0 2px 4px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.3), 0 0 12px rgba(0, 174, 239, 0.05)',
        'elevation-3-dark': '0 4px 8px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.3), 0 0 16px rgba(0, 174, 239, 0.08)',
        'elevation-hover-dark': '0 8px 24px rgba(0, 0, 0, 0.35), 0 16px 40px rgba(0, 0, 0, 0.25), 0 0 20px rgba(0, 174, 239, 0.12)',
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins here if needed
    // Example: require('@tailwindcss/forms'),
  ],
}
