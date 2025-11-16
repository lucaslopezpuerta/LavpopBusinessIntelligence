// GoogleBusinessWidget.jsx v2.0 - STANDARDIZED WITH REAL API
// ✅ Consistent with all other header widgets
// ✅ Google Places API integration (updates once daily)
// ✅ Shows rating, reviews, and open/closed status
// ✅ Automatic caching (24-hour refresh)
// ✅ Compact 36px height matching other widgets
//
// CHANGELOG:
// v2.0 (2025-11-16): Standardized design + real API + daily updates
// v1.0 (2025-11-16): Initial mock data version

import React, { useState, useEffect } from 'react';
import { Star, MapPin, Loader, AlertCircle } from 'lucide-react';

// ⚙️ CONFIGURATION
const GOOGLE_BUSINESS_CONFIG = {
  // STEP 1: Get your Place ID from: https://developers.google.com/maps/documentation/places/web-service/place-id
  // Search for "Lavpop Caxias do Sul" and copy the Place ID
  PLACE_ID: 'ChIJW0SI_ryjHpUR_YAfB0aLu8I', // ← Place ID
  
  // STEP 2: Your Google API Key (already in GitHub secrets)
  // This will be loaded from environment variable
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || '',
  
  // STEP 3: Cache duration (24 hours = 86400000 ms)
  CACHE_DURATION: 6 * 60 * 60 * 1000,
  
  // Google Maps link (fallback)
  MAPS_URL: 'https://maps.app.goo.gl/VwNojjvheJrXZeRd8'
};

const GoogleBusinessWidget = () => {
  const [businessData, setBusinessData] = useState({
    rating: null,
    totalReviews: null,
    isOpen: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchBusinessData();
    
    // Check for updates every hour, but only refetch if cache expired
    const interval = setInterval(checkAndRefresh, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAndRefresh = () => {
    const cached = localStorage.getItem('googleBusinessCache');
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // Only refresh if cache is older than 24 hours
      if (now - timestamp > GOOGLE_BUSINESS_CONFIG.CACHE_DURATION) {
        console.log('Google Business cache expired, refreshing...');
        fetchBusinessData();
      }
    } else {
      fetchBusinessData();
    }
  };

  const fetchBusinessData = async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem('googleBusinessCache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Use cache if less than 24 hours old
        if (now - timestamp < GOOGLE_BUSINESS_CONFIG.CACHE_DURATION) {
          console.log('Using cached Google Business data');
          setBusinessData({
            ...data,
            loading: false,
            error: null
          });
          return;
        }
      }

      setLoading(true);
      console.log('Fetching fresh Google Business data...');

      // API Endpoint: Google Places API - Place Details
      // https://developers.google.com/maps/documentation/places/web-service/details
      const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_BUSINESS_CONFIG.PLACE_ID}&fields=rating,user_ratings_total,opening_hours&key=${GOOGLE_BUSINESS_CONFIG.API_KEY}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Google Business data');
      }
      
      const result = await response.json();
      
      if (result.status !== 'OK') {
        throw new Error(`Google API Error: ${result.status}`);
      }
      
      const place = result.result;
      const newData = {
        rating: place.rating,
        totalReviews: place.user_ratings_total,
        isOpen: place.opening_hours?.open_now ?? null
      };
      
      // Cache the result for 24 hours
      localStorage.setItem('googleBusinessCache', JSON.stringify({
        data: newData,
        timestamp: Date.now()
      }));
      
      setBusinessData({
        ...newData,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Error fetching Google Business data:', error);
      
      // If API fails, try to use old cache as fallback
      const cached = localStorage.getItem('googleBusinessCache');
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log('API failed, using old cache as fallback');
        setBusinessData({
          ...data,
          loading: false,
          error: 'Using cached data'
        });
      } else {
        setBusinessData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    }
  };

  if (businessData.loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '0.5rem 0.75rem',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        minWidth: '140px',
        height: '36px'
      }}>
        <Loader style={{ width: '14px', height: '14px', color: 'white' }} className="animate-spin" />
        <div style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '500'
        }}>
          Carregando...
        </div>
      </div>
    );
  }

  if (businessData.error && !businessData.rating) {
    // Only hide if we have no data at all
    return null;
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
      padding: '0.5rem 0.75rem',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
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
    onClick={() => window.open(GOOGLE_BUSINESS_CONFIG.MAPS_URL, '_blank')}
    title="Ver no Google Maps"
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
        <MapPin style={{ width: '15px', height: '15px', color: 'white' }} />
      </div>

      {/* Business Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Star 
            style={{ 
              width: '11px', 
              height: '11px', 
              color: '#fbbf24',
              fill: '#fbbf24'
            }} 
          />
          <span style={{
            fontSize: '12px',
            fontWeight: '700',
            color: 'white',
            lineHeight: 1
          }}>
            {businessData.rating?.toFixed(1) || '—'}
          </span>
          <span style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '500'
          }}>
            ({businessData.totalReviews || 0})
          </span>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <div style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: businessData.isOpen ? '#10b981' : '#ef4444'
          }} />
          <span style={{
            fontSize: '9px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}>
            {businessData.isOpen === null ? 'Status desconhecido' : businessData.isOpen ? 'ABERTO' : 'FECHADO'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoogleBusinessWidget;
