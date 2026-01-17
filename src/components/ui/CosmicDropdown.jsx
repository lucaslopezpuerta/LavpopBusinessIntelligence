// CosmicDropdown.jsx v1.0.0
// Custom dropdown component with cosmic Design System styling
// Replaces native <select> elements for consistent theming
//
// FEATURES:
// - Glassmorphism panel with stellar-cyan accents
// - Framer Motion animations
// - Keyboard navigation (Arrow keys, Enter, Escape)
// - Click outside to close
// - Touch-friendly with haptic feedback
// - Accessible with ARIA attributes
//
// USAGE:
// <CosmicDropdown
//   value={selectedValue}
//   onChange={handleChange}
//   options={[{ value: 'opt1', label: 'Option 1' }]}
// />
//
// CHANGELOG:
// v1.0.0 (2026-01-16): Initial implementation
//   - Cosmic Precision design system styling
//   - Framer Motion animations
//   - Keyboard and touch support

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { haptics } from '../../utils/haptics';

const CosmicDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Selecione...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const { isDark } = useTheme();

  // Find current selected option
  const selectedOption = options.find(opt => opt.value === value);

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
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            handleSelect(options[highlightedIndex].value);
          }
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, options]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex(opt => opt.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, value, options]);

  const handleToggle = useCallback(() => {
    haptics.tick();
    setIsOpen(prev => !prev);
  }, []);

  const handleSelect = useCallback((optionValue) => {
    haptics.tick();
    onChange(optionValue);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="dropdown-label"
        className={`
          h-9 px-3 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer
          flex items-center justify-between gap-2 min-w-[140px]
          transition-all duration-200
          ${isDark
            ? 'bg-space-dust text-slate-300 hover:bg-space-dust/80'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
          border
          ${isOpen
            ? isDark
              ? 'border-stellar-cyan/40 shadow-stellar-glow-soft'
              : 'border-stellar-cyan/30 shadow-md'
            : isDark
              ? 'border-stellar-cyan/10 hover:border-stellar-cyan/20'
              : 'border-slate-200 hover:border-slate-300'}
          focus:outline-none focus:ring-2
          ${isDark ? 'focus:ring-stellar-cyan/40' : 'focus:ring-amber-500/50'}
        `}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
        />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className={`
              absolute z-50 mt-1 w-full min-w-[160px]
              ${isDark ? 'bg-space-dust' : 'bg-white/95'}
              backdrop-blur-xl
              rounded-xl
              shadow-xl
              border
              ${isDark ? 'border-stellar-cyan/20' : 'border-stellar-cyan/10'}
              py-1
              max-h-60 overflow-auto
            `}
            role="listbox"
            ref={listRef}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    flex items-center justify-between gap-2
                    px-3 py-2 cursor-pointer
                    text-sm font-medium
                    transition-colors duration-100
                    ${isHighlighted
                      ? isDark
                        ? 'bg-stellar-cyan/15 text-white'
                        : 'bg-stellar-cyan/10 text-slate-900'
                      : isDark
                        ? 'text-slate-300 hover:bg-white/5'
                        : 'text-slate-700 hover:bg-slate-50'}
                    ${isSelected
                      ? 'text-stellar-cyan'
                      : ''}
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 flex-shrink-0 text-stellar-cyan" />
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CosmicDropdown;
