// GoogleBusinessWidget.jsx v3.0 - SERVERLESS FUNCTION VERSION
// ✅ Uses Netlify/Vercel serverless function (no CORS issues!)
// ✅ 24-hour caching
// ✅ Standardized header design

import React, { useState, useEffect } from 'react';
import { Star, MapPin, Loader } from 'lucide-react';

const GOOGLE_BUSINESS_CONFIG = {
  // Cache duration (24 hours)
  CACHE_DURATION: 24 * 60 * 60 * 1000,
  
  // Serverless function endpoint
  // Netlify: /.netlify/functions/google-business
  // Vercel: /api/google-business
  API_ENDPOINT: '/.netlify/functions/google-business', // ← Change if using Vercel
  
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
    
    // Check for updates every hour
    const interval = setInterval(checkAndRefresh, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAndRefresh = () => {
    const cached = localStorage.getItem('googleBusinessCache');
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      const now = Date.now();
      
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

      setBusinessData(prev => ({ ...prev, loading: true }));
      console.log('Fetching fresh Google Business data...');

      // Call serverless function (no CORS issues!)
      const response = await fetch(GOOGLE_BUSINESS_CONFIG.API_ENDPOINT);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const newData = await response.json();
      
      // Cache for 24 hours
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
      
      // Try old cache as fallback
      const cached = localStorage.getItem('googleBusinessCache');
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log('API failed, using old cache');
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
    // Hide widget if no data available
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
            {businessData.isOpen === null ? 'N/D' : businessData.isOpen ? 'ABERTO' : 'FECHADO'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoogleBusinessWidget;
