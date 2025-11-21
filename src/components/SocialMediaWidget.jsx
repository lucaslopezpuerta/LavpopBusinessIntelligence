// SocialMediaWidget.jsx v3.0 - TAILWIND MIGRATION
// ✅ Replaced inline styles with Tailwind classes
// ✅ Glassmorphism effect using Tailwind
// ✅ Combined Instagram + Facebook in single widget
// ✅ Responsive design
//
// CHANGELOG:
// v3.0 (2025-11-20): Tailwind migration & Glassmorphism
// v2.0 (2025-11-16): Standardized design

import React from 'react';
import { Instagram, Users } from 'lucide-react';

const SocialMediaWidget = ({ instagramFollowers = 0, facebookFollowers = 0 }) => {
  const formatFollowers = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const totalFollowers = instagramFollowers + facebookFollowers;

  return (
    <a
      href="https://www.instagram.com/lavpopcaxiasdosul/"
      target="_blank"
      rel="noopener noreferrer"
      className="
        bg-white/15 backdrop-blur-md 
        rounded-lg px-3 py-2 
        border border-white/25 
        flex items-center gap-2.5 
        no-underline cursor-pointer 
        transition-all duration-200 
        h-9
        hover:bg-white/25 hover:-translate-y-px
      "
      title="Ver no Instagram"
    >
      {/* Icon Container */}
      <div className="
        w-7 h-7 
        rounded-md 
        bg-white/20 
        flex items-center justify-center 
        shrink-0
      ">
        <Instagram className="w-[15px] h-[15px] text-white" />
      </div>

      {/* Social Info */}
      <div className="flex flex-col gap-px">
        <div className="text-xs font-bold text-white leading-none">
          INSTAGRAM
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-2.5 h-2.5 text-white/90" />
          <span className="text-[11px] font-semibold text-white/90">
            {formatFollowers(instagramFollowers)}
          </span>
        </div>
      </div>
    </a>
  );
};

export default SocialMediaWidget;
