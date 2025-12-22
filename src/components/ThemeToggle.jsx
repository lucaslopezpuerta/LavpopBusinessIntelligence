// ThemeToggle.jsx v1.1 - HAPTIC FEEDBACK
// Beautiful theme toggle button with smooth animation
//
// FEATURES:
// - Sun/Moon icon transition
// - Smooth color animation
// - Hover effects
// - Accessible
// - Haptic feedback on toggle (v1.1)
//
// CHANGELOG:
// v1.1 (2025-12-22): Added haptic feedback on toggle
// v1.0 (2025-11-20): Initial theme toggle component

import React, { useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { haptics } from '../utils/haptics';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = useCallback(() => {
    haptics.medium();
    toggleTheme();
  }, [toggleTheme]);
  const isDark = theme === 'dark';

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex items-center justify-center
        w-11 h-11 rounded-lg
        transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-lavpop-blue focus:ring-offset-2
        ${isDark 
          ? 'bg-slate-700 hover:bg-slate-600 text-yellow-300' 
          : 'bg-slate-100 hover:bg-slate-200 text-lavpop-blue'
        }
        ${className}
      `}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={isDark ? 'Tema Claro' : 'Tema Escuro'}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon (light mode) */}
        <Sun 
          className={`
            absolute inset-0 w-5 h-5
            transition-all duration-300
            ${isDark 
              ? 'opacity-0 rotate-90 scale-50' 
              : 'opacity-100 rotate-0 scale-100'
            }
          `}
        />
        
        {/* Moon icon (dark mode) */}
        <Moon 
          className={`
            absolute inset-0 w-5 h-5
            transition-all duration-300
            ${isDark 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-50'
            }
          `}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
