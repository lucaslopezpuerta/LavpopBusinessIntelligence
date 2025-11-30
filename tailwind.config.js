// Lavpop BI - Tailwind Configuration v3.0
// Premium design system with enhanced typography, gradients, and animations
// 
// BRAND COLORS:
// - Primary Blue: #1a5a8e (Lavpop brand blue)
// - Accent Green: #55b03b (Lavpop brand green)
//
// CHANGELOG:
// v3.0 (2025-11-23): Premium enhancements - Google Fonts, gradients, animations
// v2.0 (2025-11-20): Tailwind setup with complete design system

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Lavpop Brand Colors
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
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'scale-in': 'scale-in 0.2s ease-out',
      },

      backgroundImage: {
        'gradient-lavpop': 'linear-gradient(135deg, #1a5a8e 0%, #2a7ab8 100%)',
        'gradient-lavpop-dark': 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8e 100%)',
        'gradient-green': 'linear-gradient(135deg, #55b03b 0%, #6bc04d 100%)',
        'gradient-green-dark': 'linear-gradient(135deg, #448d2f 0%, #55b03b 100%)',
        'gradient-blue-green': 'linear-gradient(135deg, #1a5a8e 0%, #55b03b 100%)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(26, 90, 142, 0.05) 0%, rgba(85, 176, 59, 0.05) 100%)',
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
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins here if needed
    // Example: require('@tailwindcss/forms'),
  ],
}
