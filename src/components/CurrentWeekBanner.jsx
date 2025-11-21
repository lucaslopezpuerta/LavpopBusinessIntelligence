// CurrentWeekBanner.jsx v3.0 - TAILWIND MIGRATION + DARK MODE
// ✅ Full Tailwind CSS with dark mode support
// ✅ Gradient design with brand colors
// ✅ Responsive layout

import React from 'react';
import { Calendar, TrendingUp, CalendarDays } from 'lucide-react';

const CurrentWeekBanner = ({ dateRange, viewMode, onToggleView }) => {
  if (!dateRange) return null;

  return (
    <div className="
      bg-gradient-to-r 
      from-lavpop-blue 
      to-lavpop-blue-700 
      dark:from-lavpop-blue-800 
      dark:to-lavpop-blue-900 
      rounded-xl 
      p-4 
      mb-4 
      shadow-lg
    ">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="
            w-12 h-12 
            bg-white/20 dark:bg-white/10 
            rounded-lg 
            flex items-center justify-center
          ">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">
              {dateRange.label}
            </h2>
            <p className="text-white/80 text-sm">
              {dateRange.start} - {dateRange.end}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleView}
          className="
            flex items-center gap-2 
            px-4 py-2 
            bg-white/20 dark:bg-white/10 
            hover:bg-white/30 dark:hover:bg-white/20 
            text-white 
            rounded-lg 
            font-medium 
            transition-colors
          "
        >
          {viewMode === 'complete' ? (
            <>
              <CalendarDays className="w-4 h-4" />
              Ver Semana Atual
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Ver Semana Completa
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CurrentWeekBanner;
