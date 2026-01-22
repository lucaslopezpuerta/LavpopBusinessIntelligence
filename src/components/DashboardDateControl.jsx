// DashboardDateControl.jsx v4.0 - COSMIC DROPDOWN SELECTOR
// Premium date period selector using CosmicDropdown pattern
//
// FEATURES:
// ✅ Glassmorphism container with stellar accents
// ✅ Calendar icon with ambient glow
// ✅ Dropdown selector (replaces toggle pills)
// ✅ Framer Motion animations
// ✅ Keyboard navigation support
// ✅ Theme-aware design (light/dark)
// ✅ Inline mode for header integration
// ✅ Accessibility: focus states, ARIA, reduced motion
// ✅ Haptic feedback on interactions
//
// CHANGELOG:
// v4.0 (2026-01-22): Dropdown selector redesign
//   - Replaced toggle pills with dropdown selector
//   - Based on CosmicDropdown pattern
//   - Cleaner, more compact design
//   - Better mobile experience
// v3.0 (2026-01-22): Cosmic Command Center redesign
// v2.0 (2026-01-22): Cosmic Date Selector redesign
// v1.0: Initial implementation

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronDown, Check, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { haptics } from '../utils/haptics';

// Period options configuration
const PERIOD_OPTIONS = [
  {
    value: 'complete',
    label: 'Semana Completa',
    shortLabel: 'Completa',
    icon: CheckCircle2,
    description: 'Última semana completa',
  },
  {
    value: 'current',
    label: 'Semana Parcial',
    shortLabel: 'Parcial',
    icon: Clock,
    description: 'Semana atual em andamento',
  },
];

const DashboardDateControl = ({ viewMode, setViewMode, dateRange, inline = false }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  if (!dateRange) return null;

  // Find current selected option
  const selectedOption = PERIOD_OPTIONS.find(opt => opt.value === viewMode) || PERIOD_OPTIONS[0];
  const SelectedIcon = selectedOption.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < PERIOD_OPTIONS.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : PERIOD_OPTIONS.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < PERIOD_OPTIONS.length) {
            handleSelect(PERIOD_OPTIONS[highlightedIndex].value);
          }
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex]);

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const currentIndex = PERIOD_OPTIONS.findIndex(opt => opt.value === viewMode);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, viewMode]);

  const handleToggle = useCallback(() => {
    haptics.tick();
    setIsOpen(prev => !prev);
  }, []);

  const handleSelect = useCallback((value) => {
    haptics.tick();
    setViewMode(value);
    setIsOpen(false);
  }, [setViewMode]);

  // Render the control content
  const controlContent = (
    <div
      ref={containerRef}
      className={`
        relative
        flex items-center ${inline ? 'gap-2 sm:gap-3' : 'justify-between gap-4'}
      `}
    >
      {/* Left: Date Display Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Calendar Icon with ambient glow container - hidden on mobile */}
        <div className="relative flex-shrink-0 hidden sm:block">
          {/* Ambient glow behind icon */}
          <div
            className={`absolute inset-0 rounded-lg blur-md ${
              isDark ? 'bg-stellar-cyan/20' : 'bg-stellar-blue/10'
            }`}
            style={{ transform: 'scale(1.3)' }}
          />
          {/* Icon container */}
          <div
            className={`
              relative p-2 rounded-lg
              ${isDark
                ? 'bg-gradient-to-br from-stellar-blue/30 to-stellar-cyan/20 border border-stellar-cyan/30'
                : 'bg-gradient-to-br from-stellar-blue/10 to-stellar-cyan/5 border border-stellar-blue/15'}
            `}
          >
            <Calendar
              className={`w-4 h-4 ${isDark ? 'text-stellar-cyan' : 'text-stellar-blue'}`}
            />
          </div>
        </div>

        {/* Date text with hierarchy */}
        <div className="flex flex-col min-w-0">
          {/* Date range */}
          <span
            className={`
              text-sm font-semibold tracking-wide truncate
              ${isDark ? 'text-white' : 'text-slate-800'}
            `}
          >
            {dateRange.start} - {dateRange.end}
          </span>
          {/* Period label - shows selected mode */}
          {!inline && (
            <span
              className={`
                text-xs
                ${isDark ? 'text-slate-400' : 'text-slate-500'}
              `}
            >
              {dateRange.label || selectedOption.label}
            </span>
          )}
        </div>
      </div>

      {/* Right: Dropdown Selector */}
      <div className="relative flex-shrink-0">
        {/* Trigger button */}
        <button
          type="button"
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Selecionar período"
          className={`
            ${inline ? 'h-8 px-2.5 sm:px-3' : 'h-9 px-3'} rounded-lg
            text-xs sm:text-sm font-semibold cursor-pointer
            flex items-center justify-between gap-1.5 sm:gap-2
            transition-all duration-200
            ${isDark
              ? 'bg-space-dust/80 text-slate-200 hover:bg-space-dust'
              : 'bg-gradient-to-r from-stellar-blue/5 to-stellar-cyan/5 text-slate-700 hover:from-stellar-blue/10 hover:to-stellar-cyan/10'}
            border
            ${isOpen
              ? isDark
                ? 'border-stellar-cyan/40 shadow-[0_0_12px_rgba(0,174,239,0.2)]'
                : 'border-stellar-blue/40 shadow-[0_4px_12px_rgba(45,56,138,0.15)]'
              : isDark
                ? 'border-stellar-cyan/15 hover:border-stellar-cyan/25'
                : 'border-stellar-blue/20 hover:border-stellar-blue/30'}
            focus:outline-none focus:ring-2
            ${isDark ? 'focus:ring-stellar-cyan/40' : 'focus:ring-stellar-blue/30'}
          `}
        >
          <SelectedIcon
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              isDark ? 'text-stellar-cyan' : 'text-stellar-blue'
            }`}
          />
          <span className="truncate">
            {selectedOption.shortLabel}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            } ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          />
        </button>

        {/* Dropdown panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className={`
                absolute z-50 right-0 w-52
                top-full mt-1.5
                backdrop-blur-xl
                rounded-xl
                border
                ${isDark
                  ? 'bg-space-dust/95 border-stellar-cyan/20'
                  : 'border-stellar-blue/15'}
                py-1.5
                overflow-hidden
              `}
              style={{
                background: isDark
                  ? undefined
                  : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,248,255,0.98) 50%, rgba(240,247,255,0.98) 100%)',
                boxShadow: isDark
                  ? '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 174, 239, 0.1)'
                  : '0 10px 40px rgba(45, 56, 138, 0.18), 0 4px 16px rgba(0, 174, 239, 0.12)',
              }}
              role="listbox"
            >
              {/* Top accent gradient line - light mode only */}
              {!isDark && (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl opacity-60"
                  style={{
                    background: 'linear-gradient(90deg, #2d388a, #00aeef)',
                  }}
                />
              )}

              {PERIOD_OPTIONS.map((option, index) => {
                const isSelected = option.value === viewMode;
                const isHighlighted = index === highlightedIndex;
                const OptionIcon = option.icon;

                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      flex items-center gap-3
                      px-3 py-2.5 cursor-pointer
                      transition-all duration-150
                      ${isHighlighted
                        ? isDark
                          ? 'bg-stellar-cyan/15'
                          : 'bg-gradient-to-r from-stellar-blue/15 to-stellar-cyan/10'
                        : ''}
                    `}
                  >
                    {/* Icon */}
                    <OptionIcon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isSelected
                          ? isDark ? 'text-stellar-cyan' : 'text-stellar-blue'
                          : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    />

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium ${
                          isSelected
                            ? isDark ? 'text-white' : 'text-slate-900'
                            : isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        {option.label}
                      </div>
                      <div
                        className={`text-xs ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {option.description}
                      </div>
                    </div>

                    {/* Check mark */}
                    {isSelected && (
                      <Check className={`w-4 h-4 flex-shrink-0 ${
                        isDark ? 'text-stellar-cyan' : 'text-stellar-blue'
                      }`} />
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // When inline, return control directly (no wrapper)
  if (inline) {
    return controlContent;
  }

  // When not inline, wrap with container styling
  return (
    <div className="mb-6">
      <motion.div
        className={`
          relative overflow-hidden p-4 rounded-2xl
          ${isDark
            ? 'bg-space-dust/90 border border-stellar-cyan/20'
            : 'bg-white border border-slate-200/80 shadow-lg'}
        `}
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        whileHover={!prefersReducedMotion ? {
          y: -3,
          boxShadow: isDark
            ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 174, 239, 0.1)'
            : '0 20px 40px rgba(0, 0, 0, 0.12)'
        } : undefined}
        transition={{ type: 'tween', duration: 0.25 }}
      >
        {/* Orbital accent ring decoration */}
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(0, 174, 239, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(45, 56, 138, 0.06) 0%, transparent 70%)',
          }}
        />

        {controlContent}

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-4 right-4 h-px"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, transparent, rgba(0, 174, 239, 0.3), rgba(45, 56, 138, 0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(45, 56, 138, 0.15), rgba(0, 174, 239, 0.15), transparent)',
          }}
        />
      </motion.div>
    </div>
  );
};

export default DashboardDateControl;
