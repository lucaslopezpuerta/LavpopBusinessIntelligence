// GoogleBusinessWidget.jsx v3.0 - TAILWIND MIGRATION + DARK MODE
// ✅ Full Tailwind CSS with dark mode support
// ✅ Glass-morphism header design
// ✅ Consistent with other widgets

import React from 'react';
import { Star } from 'lucide-react';

const GoogleBusinessWidget = ({ rating = 4.9, reviews = 0 }) => {
  return (
    <a
      href="https://www.google.com/maps/place/Lavpop+-+Lavanderia+Self-Service/"
      target="_blank"
      rel="noopener noreferrer"
      className="
        bg-white/15 dark:bg-slate-800/30 
        backdrop-blur-md 
        rounded-lg 
        px-3 py-2 
        border border-white/25 dark:border-slate-700/50 
        flex items-center gap-2.5 
        no-underline 
        cursor-pointer 
        transition-all duration-200 
        h-9
        hover:bg-white/25 dark:hover:bg-slate-800/40 
        hover:-translate-y-px
      "
      title="Ver no Google Business"
    >
      {/* Icon Container */}
      <div className="
        w-7 h-7 
        rounded-md 
        bg-white/20 dark:bg-slate-700/50 
        flex items-center justify-center 
        flex-shrink-0
      ">
        <Star className="w-4 h-4 text-white dark:text-slate-200" fill="currentColor" />
      </div>

      {/* Google Info */}
      <div className="flex flex-col gap-px">
        <div className="text-xs font-bold text-white dark:text-slate-200 leading-none">
          GOOGLE BUSINESS
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white/90 dark:text-slate-300">
            {rating} ⭐
          </span>
          <span className="text-[10px] text-white/80 dark:text-slate-400">
            {reviews} avaliações
          </span>
        </div>
      </div>
    </a>
  );
};

export default GoogleBusinessWidget;
