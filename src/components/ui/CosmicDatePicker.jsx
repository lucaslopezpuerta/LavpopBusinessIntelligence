// CosmicDatePicker.jsx v1.3
// Custom date picker with cosmic Design System styling
// Replaces native <input type="date"> for consistent theming
//
// FEATURES:
// - Full calendar popup with month navigation
// - Glassmorphism panel with stellar-cyan accents
// - Framer Motion animations with day button micro-interactions
// - Keyboard navigation (Arrow keys, Enter, Escape)
// - Click outside to close
// - Touch-friendly
// - Accessible with ARIA attributes
// - Drop-up support for bottom-positioned pickers
// - Right-align support to prevent overflow
//
// USAGE:
// <CosmicDatePicker
//   value={selectedDate}
//   onChange={handleDateChange}
//   placeholder="Selecione a data"
//   dropUp={true}
//   rightAlign={true}  // Aligns popup to right edge of trigger
// />
//
// CHANGELOG:
// v1.3 (2026-01-27): Micro-interaction animations
//   - Day buttons now have hover/tap animations with motion.button
//   - Navigation buttons have scale feedback
//   - Uses SPRING constants from animations.js
//   - Respects useReducedMotion for accessibility
// v1.2 (2026-01-18): Compact layout
//   - Reduced calendar width: w-72 → w-64
//   - Smaller day cells: w-9 h-9 → w-8 h-8
//   - Tighter spacing and padding throughout
//   - Prevents vertical scrolling in modals
// v1.1 (2026-01-18): Right-align support
//   - Added rightAlign prop to prevent calendar from going off-screen
//   - Calendar aligns to right edge of trigger when rightAlign is true
// v1.0 (2026-01-18): Initial implementation

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { haptics } from '../../utils/haptics';
import { SPRING } from '../../constants/animations';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CosmicDatePicker = ({
  value,
  onChange,
  placeholder = 'Selecione...',
  className = '',
  minDate,
  maxDate,
  disabled = false,
  dropUp = false,
  rightAlign = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedDate, setFocusedDate] = useState(null);
  const containerRef = useRef(null);
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // View state for calendar navigation
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      const date = new Date(value);
      return { year: date.getFullYear(), month: date.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Parse value to Date object
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }, [value]);

  // Today's date for highlighting
  const today = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, []);

  // Parse min/max dates
  const minDateParsed = useMemo(() => {
    if (!minDate) return null;
    const date = new Date(minDate);
    return isNaN(date.getTime()) ? null : date;
  }, [minDate]);

  const maxDateParsed = useMemo(() => {
    if (!maxDate) return null;
    const date = new Date(maxDate);
    return isNaN(date.getTime()) ? null : date;
  }, [maxDate]);

  // Generate calendar days for current view
  const calendarDays = useMemo(() => {
    const { year, month } = viewMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];

    // Padding for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, disabled: true });
    }

    // Actual days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      let isDisabled = false;

      if (minDateParsed && date < minDateParsed) {
        isDisabled = true;
      }
      if (maxDateParsed && date > maxDateParsed) {
        isDisabled = true;
      }

      days.push({ day: d, disabled: isDisabled });
    }

    return days;
  }, [viewMonth, minDateParsed, maxDateParsed]);

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
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(-7);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(7);
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedDate) {
            handleSelectDate(focusedDate.day);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedDate, viewMonth]);

  // Initialize focused date when opening
  useEffect(() => {
    if (isOpen) {
      if (selectedDate &&
          selectedDate.getFullYear() === viewMonth.year &&
          selectedDate.getMonth() === viewMonth.month) {
        setFocusedDate({ day: selectedDate.getDate() });
      } else {
        setFocusedDate({ day: 1 });
      }
    }
  }, [isOpen, viewMonth]);

  const moveFocus = useCallback((delta) => {
    setFocusedDate(prev => {
      if (!prev) return { day: 1 };

      const { year, month } = viewMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      let newDay = prev.day + delta;

      if (newDay < 1) {
        // Go to previous month
        goToPrevMonth();
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
        return { day: daysInPrevMonth + newDay };
      } else if (newDay > daysInMonth) {
        // Go to next month
        goToNextMonth();
        return { day: newDay - daysInMonth };
      }

      return { day: newDay };
    });
  }, [viewMonth]);

  const goToPrevMonth = useCallback(() => {
    haptics.tick();
    setViewMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    haptics.tick();
    setViewMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  }, []);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    haptics.tick();
    setIsOpen(prev => !prev);
  }, [disabled]);

  const handleSelectDate = useCallback((day) => {
    if (!day) return;

    const { year, month } = viewMonth;
    const date = new Date(year, month, day);

    // Check if date is disabled
    if (minDateParsed && date < minDateParsed) return;
    if (maxDateParsed && date > maxDateParsed) return;

    haptics.tick();

    // Format as ISO date string (YYYY-MM-DD)
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(isoDate);
    setIsOpen(false);
  }, [viewMonth, onChange, minDateParsed, maxDateParsed]);

  // Format displayed date
  const displayValue = useMemo(() => {
    if (!selectedDate) return placeholder;
    return `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;
  }, [selectedDate, placeholder]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`
          h-9 px-3 rounded-lg text-xs sm:text-sm font-medium cursor-pointer
          flex items-center justify-between gap-2 min-w-[140px] w-full
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDark
            ? 'bg-space-dust text-slate-300 hover:bg-space-dust/80'
            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}
          border
          ${isOpen
            ? isDark
              ? 'border-stellar-cyan/40 shadow-stellar-glow-soft'
              : 'border-stellar-cyan/30 shadow-md'
            : isDark
              ? 'border-stellar-cyan/10 hover:border-stellar-cyan/20'
              : 'border-slate-300 hover:border-slate-400'}
          focus:outline-none focus:ring-2
          ${isDark ? 'focus:ring-stellar-cyan/40' : 'focus:ring-stellar-cyan/30'}
        `}
      >
        <span className={`truncate ${!selectedDate ? 'text-slate-400 dark:text-slate-500' : ''}`}>
          {displayValue}
        </span>
        <Calendar
          className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
        />
      </button>

      {/* Calendar popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            role="dialog"
            aria-label="Calendário"
            className={`
              absolute z-50 w-64
              ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}
              ${rightAlign ? 'right-0' : 'left-0'}
              ${isDark ? 'bg-space-dust backdrop-blur-xl' : 'bg-white'}
              rounded-xl shadow-xl
              border ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200'}
              p-2.5
            `}
          >
            {/* Month/Year header with navigation */}
            <div className="flex items-center justify-between mb-2">
              <motion.button
                type="button"
                onClick={goToPrevMonth}
                whileHover={!prefersReducedMotion ? { scale: 1.1 } : undefined}
                whileTap={!prefersReducedMotion ? { scale: 0.9 } : undefined}
                transition={SPRING.QUICK}
                className={`
                  p-1 rounded-md transition-colors duration-150
                  ${isDark
                    ? 'text-slate-400 hover:text-white hover:bg-space-nebula'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                `}
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>

              <span className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {MONTHS[viewMonth.month]} {viewMonth.year}
              </span>

              <motion.button
                type="button"
                onClick={goToNextMonth}
                whileHover={!prefersReducedMotion ? { scale: 1.1 } : undefined}
                whileTap={!prefersReducedMotion ? { scale: 0.9 } : undefined}
                transition={SPRING.QUICK}
                className={`
                  p-1 rounded-md transition-colors duration-150
                  ${isDark
                    ? 'text-slate-400 hover:text-white hover:bg-space-nebula'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                `}
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
              {WEEKDAYS.map(day => (
                <div
                  key={day}
                  className={`
                    text-center text-[10px] font-medium py-0.5
                    ${isDark ? 'text-slate-500' : 'text-slate-400'}
                  `}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5" role="grid">
              {calendarDays.map((dayObj, index) => {
                if (dayObj.day === null) {
                  return <div key={`empty-${index}`} className="w-8 h-8" />;
                }

                const isSelected = selectedDate &&
                  selectedDate.getFullYear() === viewMonth.year &&
                  selectedDate.getMonth() === viewMonth.month &&
                  selectedDate.getDate() === dayObj.day;

                const isToday = today.year === viewMonth.year &&
                  today.month === viewMonth.month &&
                  today.day === dayObj.day;

                const isFocused = focusedDate && focusedDate.day === dayObj.day;

                return (
                  <motion.button
                    key={dayObj.day}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    disabled={dayObj.disabled}
                    onClick={() => handleSelectDate(dayObj.day)}
                    onMouseEnter={() => setFocusedDate({ day: dayObj.day })}
                    whileHover={!prefersReducedMotion && !dayObj.disabled ? { scale: 1.15 } : undefined}
                    whileTap={!prefersReducedMotion && !dayObj.disabled ? { scale: 0.9 } : undefined}
                    transition={SPRING.QUICK}
                    className={`
                      w-8 h-8 rounded-md flex items-center justify-center text-xs
                      transition-colors duration-100
                      ${dayObj.disabled
                        ? 'opacity-30 cursor-not-allowed'
                        : 'cursor-pointer'}
                      ${isSelected
                        ? 'bg-stellar-cyan text-white font-semibold'
                        : isToday
                          ? isDark
                            ? 'bg-stellar-cyan/20 text-stellar-cyan font-semibold'
                            : 'bg-stellar-cyan/10 text-stellar-cyan font-semibold'
                          : isFocused
                            ? isDark
                              ? 'bg-space-nebula text-white'
                              : 'bg-slate-100 text-slate-900'
                            : isDark
                              ? 'text-slate-300 hover:bg-space-nebula'
                              : 'text-slate-700 hover:bg-slate-100'}
                      ${isFocused && !isSelected ? 'ring-1 ring-stellar-cyan/50' : ''}
                    `}
                  >
                    {dayObj.day}
                  </motion.button>
                );
              })}
            </div>

            {/* Today shortcut */}
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-stellar-cyan/10">
              <button
                type="button"
                onClick={() => {
                  setViewMonth({ year: today.year, month: today.month });
                  handleSelectDate(today.day);
                }}
                className={`
                  w-full py-1 text-xs font-medium rounded-md
                  transition-colors duration-150
                  ${isDark
                    ? 'text-stellar-cyan hover:bg-stellar-cyan/10'
                    : 'text-stellar-cyan hover:bg-stellar-cyan/5'}
                `}
              >
                Hoje
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CosmicDatePicker;
