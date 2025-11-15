// SocialMediaWidget.jsx v1.0
// Displays social media metrics for Instagram and Facebook
// Static values for v1.0, ready for API integration in future versions

import React from 'react';
import { Instagram, Facebook, TrendingUp } from 'lucide-react';

const SocialMediaWidget = ({ instagramFollowers = 0, facebookFollowers = 0 }) => {
  // Format numbers with K suffix
  const formatFollowers = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      followers: instagramFollowers,
      color: '#E4405F',
      bgColor: '#fce7f3',
      link: 'https://instagram.com/lavpop' // Update with actual handle
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      followers: facebookFollowers,
      color: '#1877F2',
      bgColor: '#dbeafe',
      link: 'https://facebook.com/lavpop' // Update with actual page
    }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '0.75rem'
    }}>
      {platforms.map((platform) => {
        const Icon = platform.icon;
        return (
          <a
            key={platform.id}
            href={platform.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              textDecoration: 'none',
              transition: 'all 0.2s',
              minWidth: '140px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Platform Icon */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: platform.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon style={{ width: '24px', height: '24px', color: platform.color }} />
            </div>

            {/* Platform Info */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '2px'
              }}>
                {platform.name}
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#10306B',
                lineHeight: '1'
              }}>
                {formatFollowers(platform.followers)}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#53be33',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <TrendingUp style={{ width: '12px', height: '12px' }} />
                Seguidores
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default SocialMediaWidget;
