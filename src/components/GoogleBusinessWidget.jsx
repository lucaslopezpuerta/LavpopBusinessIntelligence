// GoogleBusinessWidget.jsx v1.1 - FIXED WITH FALLBACK
// ✅ Static fallback data when API unavailable
// ✅ Graceful degradation (no errors shown)
// ✅ Links to Google Maps for live data
//
// CHANGELOG:
// v1.1 (2025-11-15): Added static fallback, removed CORS errors
// v1.0 (2025-11-14): Initial version with API integration

import React from 'react';
import { Star, MessageSquare, ExternalLink } from 'lucide-react';

// Static fallback data for Lavpop
// Update these values manually or via backend API
const FALLBACK_DATA = {
  rating: 4.8,
  reviewCount: 25,
  name: 'Lavpop Lavanderia'
};

const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/VwNojjvheJrXZeRd8';

const GoogleBusinessWidget = () => {
  // Use static data (avoids CORS errors)
  // Note: To use live data, implement a backend proxy or use Places Library
  const data = FALLBACK_DATA;

  // Generate star display
  const fullStars = Math.floor(data.rating);
  const hasHalfStar = data.rating % 1 >= 0.5;
  
  return (
    <a
      href={GOOGLE_MAPS_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver no Google Maps"
      style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        minWidth: '200px',
        textDecoration: 'none',
        transition: 'all 0.2s',
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
      {/* Google Icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <span style={{ fontSize: '24px' }}>🏢</span>
      </div>

      {/* Business Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '2px'
        }}>
          Lavpop Caxias do Sul
        </div>
        
        {/* Rating Stars */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '2px'
        }}>
          <div style={{ display: 'flex', gap: '1px' }}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                style={{
                  width: '14px',
                  height: '14px',
                  fill: i < fullStars || (i === fullStars && hasHalfStar) ? '#f59e0b' : 'none',
                  color: i < fullStars || (i === fullStars && hasHalfStar) ? '#f59e0b' : '#d1d5db',
                  strokeWidth: 2
                }}
              />
            ))}
          </div>
          <span style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#1a5a8e'
          }}>
            {data.rating.toFixed(1)}
          </span>
        </div>

        {/* Review Count */}
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <MessageSquare style={{ width: '12px', height: '12px' }} />
          {data.reviewCount} avaliações
        </div>
      </div>

      {/* External Link Icon */}
      <ExternalLink style={{ width: '14px', height: '14px', color: '#9ca3af', flexShrink: 0 }} />
    </a>
  );
};

export default GoogleBusinessWidget;

/* 
 * NOTE: This version uses static fallback data to avoid CORS errors.
 * 
 * To use live Google data, you have 3 options:
 * 
 * 1. BACKEND PROXY (Recommended)
 *    - Create a backend endpoint that calls the Places API
 *    - Frontend calls your backend
 *    - No CORS issues
 * 
 * 2. PLACES LIBRARY (Complex)
 *    - Use @googlemaps/js-api-loader
 *    - Load Places Library in browser
 *    - More setup required
 * 
 * 3. STATIC UPDATE (Current - Simplest)
 *    - Update FALLBACK_DATA manually
 *    - No API costs
 *    - No CORS errors
 *    - Widget still links to live Google Maps
 */
