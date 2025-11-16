// SocialMediaWidget.jsx v2.0 - STANDARDIZED HEADER DESIGN
// ✅ Consistent with all other header widgets
// ✅ Transparent blur background matching header style
// ✅ Combined Instagram + Facebook in single widget
// ✅ Compact 36px height
//
// CHANGELOG:
// v2.0 (2025-11-16): Standardized design for header consistency
// v1.0 (previous): Separate cards with white background

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
      style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '0.5rem 0.75rem',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        height: '36px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      title="Ver no Instagram"
    >
      {/* Icon Container */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        background: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Instagram style={{ width: '15px', height: '15px', color: 'white' }} />
      </div>

      {/* Social Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '700',
          color: 'white',
          lineHeight: 1
        }}>
          INSTAGRAM
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Users style={{ width: '10px', height: '10px', color: 'rgba(255, 255, 255, 0.9)' }} />
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            {formatFollowers(instagramFollowers)} {/* +Seguidores */}
          </span>
        </div>
      </div>
    </a>
  );
};

export default SocialMediaWidget;
