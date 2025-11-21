// GoogleBusinessWidget.jsx v4.0 - TAILWIND MIGRATION
// ✅ Replaced inline styles with Tailwind classes
// ✅ Glassmorphism effect using Tailwind
// ✅ Responsive text visibility
// ✅ Preserved all logic and caching
//
// CHANGELOG:
// v4.0 (2025-11-20): Tailwind migration & Glassmorphism
// v3.0 (2025-11-16): Serverless function version

import React, { useState, useEffect } from 'react';
import { Star, MapPin, Loader } from 'lucide-react';

const GOOGLE_BUSINESS_CONFIG = {
  // Cache duration (24 hours)
  CACHE_DURATION: 24 * 60 * 60 * 1000,

  // Serverless function endpoint - FULL URL for GitHub Pages
  API_ENDPOINT: 'https://wondrous-medovik-7f51be.netlify.app/.netlify/functions/google-business',

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

      // If 404, function not deployed yet - hide widget gracefully
      if (response.status === 404) {
        console.warn('Google Business function not deployed yet. Widget disabled.');
        setBusinessData({
          rating: null,
          totalReviews: null,
          isOpen: null,
          loading: false,
          error: 'Function not deployed'
        });
        return;
      }

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
      <div className="
        bg-white/15 backdrop-blur-md 
        rounded-lg px-3 py-2 
        border border-white/25 
        flex items-center gap-2 
        min-w-[140px] h-9
      ">
        <Loader className="w-3.5 h-3.5 text-white animate-spin" />
        <div className="text-[11px] text-white/90 font-medium">
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
    <div
      className="
        bg-white/15 backdrop-blur-md 
        rounded-lg px-3 py-2 
        border border-white/25 
        flex items-center gap-2.5 
        cursor-pointer 
        transition-all duration-200 
        h-9
        hover:bg-white/25 hover:-translate-y-px
      "
      onClick={() => window.open(GOOGLE_BUSINESS_CONFIG.MAPS_URL, '_blank')}
      title="Ver no Google Maps"
    >
      {/* Icon Container */}
      <div className="
        w-7 h-7 
        rounded-md 
        bg-white/20 
        flex items-center justify-center 
        shrink-0
      ">
        <MapPin className="w-[15px] h-[15px] text-white" />
      </div>

      {/* Business Info */}
      <div className="flex flex-col gap-px">
        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <Star className="w-[11px] h-[11px] text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-white leading-none">
            {businessData.rating?.toFixed(1) || '—'}
          </span>
          <span className="text-[10px] text-white/80 font-medium">
            ({businessData.totalReviews || 0})
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${businessData.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-[9px] text-white/90 font-semibold uppercase tracking-wide">
            {businessData.isOpen === null ? 'N/D' : businessData.isOpen ? 'ABERTO' : 'FECHADO'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoogleBusinessWidget;
