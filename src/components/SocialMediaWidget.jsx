// SocialMediaWidget.jsx v4.0 - COMPACT MODE
// ✅ Added compact prop for header integration
// ✅ Compact: Icon + Follower count only
// ✅ Full: Original design with label
// ✅ Glassmorphism styling
import React from 'react';
import { Instagram, Users } from 'lucide-react';

const SocialMediaWidget = ({ instagramFollowers = 0, facebookFollowers = 0, compact = false }) => {
  const formatFollowers = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const totalFollowers = instagramFollowers + facebookFollowers;

  // Compact Mode for App Header
  if (compact) {
    return (
      <a
        href="https://www.instagram.com/lavpopcaxiasdosul/"
        target="_blank"
        rel="noopener noreferrer"
        className="
          bg-slate-100 dark:bg-slate-800
          rounded-lg px-2 py-1.5
          flex items-center gap-1.5
          no-underline cursor-pointer
          transition-all duration-200
          h-9
          hover:bg-slate-200 dark:hover:bg-slate-700
        "
        title={`Instagram • ${formatFollowers(instagramFollowers)} seguidores`}
      >
        {/* Mobile: Show followers only, Desktop: Show icon + followers */}
        <div className="sm:hidden flex items-center">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {formatFollowers(instagramFollowers)}
          </span>
        </div>

        {/* Desktop: Icon + Followers */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
            <Instagram className="w-3 h-3 text-white" />
          </div>
          <div className="flex items-center gap-0.5">
            <Users className="w-2.5 h-2.5 text-purple-500 dark:text-purple-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {formatFollowers(instagramFollowers)}
            </span>
          </div>
        </div>
      </a>
    );
  }

  // Full Mode for Dashboard Banner
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
      <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center shrink-0">
        <Instagram className="w-[15px] h-[15px] text-white" />
      </div>

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
