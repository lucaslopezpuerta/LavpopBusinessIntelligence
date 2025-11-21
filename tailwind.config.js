// Lavpop BI - Tailwind Configuration v2.0
// Complete design system with brand colors and dark mode support
// 
// BRAND COLORS:
// - Primary Blue: #1a5a8e (Lavpop brand blue)
// - Accent Green: #55b03b (Lavpop brand green)
//
// CHANGELOG:
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
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
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
        'lavpop': '0 4px 14px 0 rgba(26, 90, 142, 0.15)', // Branded shadow
        'lavpop-lg': '0 10px 40px -10px rgba(26, 90, 142, 0.25)', // Large branded shadow
      },
      
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      maxWidth: {
        '8xl': '88rem',   // 1408px
        '9xl': '96rem',   // 1536px
        'lavpop': '100rem', // 1600px - Dashboard max width
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins here if needed
    // Example: require('@tailwindcss/forms'),
  ],
}
