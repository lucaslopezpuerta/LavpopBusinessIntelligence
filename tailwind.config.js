// Bilavnova BI - Tailwind Configuration v4.3
// "Cosmic Precision" design system - Space-age futurist aesthetic
//
// BRAND COLORS:
// - Stellar Blue: #2d388a (Gradient start - deep indigo)
// - Stellar Cyan: #00aeef (Gradient end - bright cyan)
// - Space Void: #050816 (Deep space background)
//
// CHANGELOG:
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
    // Cosmic purple (v4.2 - CampaignFunnel outcomes)
    'text-cosmic-purple', 'bg-cosmic-purple', 'border-cosmic-purple',
    'bg-cosmic-purple/20', 'bg-cosmic-purple/30', 'border-cosmic-purple/30',
    // Nebula violet
    'text-nebula-violet', 'bg-nebula-violet/20', 'border-nebula-violet/30',
    // Funnel stage borders (v4.2)
    'bg-stellar-cyan/15', 'border-stellar-cyan/40',
    'border-blue-500/40', 'border-emerald-500/40', 'border-emerald-500/30',
    'bg-blue-900/50', 'bg-emerald-900/50',
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
        // Cosmic Space Colors (v4.0)
        'space': {
          'void': '#050816',      // Deep space black (primary dark bg)
          'nebula': '#0a0f1e',    // Slightly lighter
          'dust': '#1a1f35',      // Card backgrounds (dark mode)
          'light': '#f8fafc',     // Light mode background
          'light-card': '#ffffff', // Light mode card
        },
        // Stellar Gradient Colors (v4.0 - from brand logo)
        'stellar': {
          'blue': '#2d388a',      // Gradient start (deep indigo)
          'cyan': '#00aeef',      // Gradient end (bright cyan)
          'glow': 'rgba(0, 174, 239, 0.5)',
          'glow-subtle': 'rgba(0, 174, 239, 0.2)',
          'indigo': '#4f46e5',    // Deep stellar indigo
          'gold': '#fbbf24',      // Star gold accent
        },
        // Cosmic Accent Colors (v4.1 - expanded palette)
        'cosmic': {
          'purple': '#6366f1',    // Nebula purple
          'pink': '#ec4899',      // Supernova pink
          'orange': '#f97316',    // Solar flare orange
        },
        'nebula': {
          'violet': '#8b5cf6',    // Nebula violet
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
        // Cosmic Precision gradients (v4.0)
        'gradient-stellar': 'linear-gradient(135deg, #2d388a 0%, #00aeef 100%)',
        'gradient-stellar-vertical': 'linear-gradient(180deg, #2d388a 0%, #00aeef 100%)',
        'gradient-stellar-horizontal': 'linear-gradient(90deg, #2d388a 0%, #00aeef 100%)',
        'gradient-aurora': 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(45, 56, 138, 0.15), transparent)',
        'gradient-aurora-strong': 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(45, 56, 138, 0.3), transparent)',
        // Bilavnova brand gradient (from logo)
        'gradient-bilavnova': 'linear-gradient(135deg, #2d388a 0%, #00aeef 100%)',
        'gradient-bilavnova-vertical': 'linear-gradient(180deg, #2d388a 0%, #00aeef 100%)',
        'gradient-bilavnova-radial': 'radial-gradient(ellipse at center, #00aeef 0%, #2d388a 100%)',
        // Legacy lavpop gradients
        'gradient-lavpop': 'linear-gradient(135deg, #1a5a8e 0%, #2a7ab8 100%)',
        'gradient-lavpop-dark': 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8e 100%)',
        'gradient-green': 'linear-gradient(135deg, #55b03b 0%, #6bc04d 100%)',
        'gradient-green-dark': 'linear-gradient(135deg, #448d2f 0%, #55b03b 100%)',
        'gradient-blue-green': 'linear-gradient(135deg, #1a5a8e 0%, #55b03b 100%)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(26, 90, 142, 0.05) 0%, rgba(85, 176, 59, 0.05) 100%)',
        // Cosmic Effects gradients (v4.1)
        'gradient-nebula': 'linear-gradient(135deg, #2d388a 0%, #6366f1 50%, #00aeef 100%)',
        'gradient-aurora-subtle': 'linear-gradient(180deg, rgba(0, 174, 239, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(139, 92, 246, 0.1) 100%)',
        'gradient-solar': 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
        'gradient-cosmic-radial': 'radial-gradient(ellipse at center, rgba(0, 174, 239, 0.15) 0%, transparent 70%)',
        'gradient-nebula-radial': 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 80%)',
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
        // Cosmic Precision shadows (v4.0)
        'stellar': '0 0 20px rgba(45, 56, 138, 0.3), 0 0 40px rgba(0, 174, 239, 0.1)',
        'stellar-lg': '0 0 30px rgba(0, 174, 239, 0.4), 0 0 60px rgba(45, 56, 138, 0.2)',
        'stellar-glow': '0 0 40px rgba(0, 174, 239, 0.5)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4)',
        // Cosmic Effects shadows (v4.1)
        'stellar-glow-soft': '0 0 20px rgba(0, 174, 239, 0.4), 0 0 40px rgba(0, 174, 239, 0.2)',
        'stellar-glow-lg': '0 0 30px rgba(0, 174, 239, 0.5), 0 0 60px rgba(0, 174, 239, 0.25)',
        'nebula': '0 0 30px rgba(99, 102, 241, 0.3), 0 0 60px rgba(139, 92, 246, 0.2)',
        'solar-flare': '0 0 20px rgba(249, 115, 22, 0.4), 0 0 40px rgba(251, 191, 36, 0.2)',
        'cosmic-inner': 'inset 0 0 20px rgba(0, 174, 239, 0.15)',
        'cosmic-inner-strong': 'inset 0 0 30px rgba(0, 174, 239, 0.25)',
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins here if needed
    // Example: require('@tailwindcss/forms'),
  ],
}
