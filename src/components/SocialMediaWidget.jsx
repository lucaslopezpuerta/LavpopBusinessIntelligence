// SocialMediaWidget.jsx v3.0 Tailwind Instagram glass widget for header
// CHANGELOG:
// v3.0 (2025-11-20): Complete Tailwind Redesign
// v2.0 (2025-11-16): Standardized design for header consistency
// ✅ Consistent with all other header widgets
// ✅ Transparent blur background matching header style
// ✅ Combined Instagram + Facebook in single widget
// ✅ Compact 36px height
// v1.0 (previous): Separate cards with a white background

import React from 'react';
import { Instagram, Users } from 'lucide-react';

const SocialMediaWidget = ({
  instagramFollowers = 0,
  facebookFollowers = 0,
}) => {
  const formatFollowers = (count) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const totalFollowers = instagramFollowers + facebookFollowers;

  return (
    <a
      href="https://www.instagram.com/lavpopcaxiasdosul/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 items-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3 text-white no-underline backdrop-blur-md transition-all hover:bg-white/25 hover:-translate-y-[1px]"
      title="Ver no Instagram"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 flex-shrink-0">
        <Instagram className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col gap-[2px]">
        <div className="text-[11px] font-semibold text-white">
          Instagram
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-white/90" />
          <span className="text-[11px] font-medium text-white/90">
            {formatFollowers(instagramFollowers || totalFollowers)} seguidores
          </span>
        </div>
      </div>
    </a>
  );
};

export default SocialMediaWidget;
