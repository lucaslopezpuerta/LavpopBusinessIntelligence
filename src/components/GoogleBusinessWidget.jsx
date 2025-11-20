// GoogleBusinessWidget.jsx v4.0 Glass widget with rating + open status


// CHANGELOG:
// v4.0 (2025-11-20): Complete Tailwind Integration
// v3.0- SERVERLESS FUNCTION VERSION
// ✅ Uses Netlify serverless function (no CORS issues!)
// ✅ 24-hour caching
// ✅ Standardized header design

import React, { useState, useEffect } from 'react';
import { Star, MapPin, Loader } from 'lucide-react';

const GOOGLE_BUSINESS_CONFIG = {
  CACHE_DURATION: 24 * 60 * 60 * 1000,
  API_ENDPOINT:
    'https://wondrous-medovik-7f51be.netlify.app/.netlify/functions/google-business',
  MAPS_URL: 'https://maps.app.goo.gl/VwNojjvheJrXZeRd8',
};

const GoogleBusinessWidget = () => {
  const [businessData, setBusinessData] = useState({
    rating: null,
    totalReviews: null,
    isOpen: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchBusinessData();
    const interval = setInterval(checkAndRefresh, 60 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAndRefresh = () => {
    const cached = localStorage.getItem('googleBusinessCache');
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      const now = Date.now();
      if (now - timestamp > GOOGLE_BUSINESS_CONFIG.CACHE_DURATION) {
        fetchBusinessData();
      }
    } else {
      fetchBusinessData();
    }
  };

  const fetchBusinessData = async () => {
    try {
      const cached = localStorage.getItem('googleBusinessCache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < GOOGLE_BUSINESS_CONFIG.CACHE_DURATION) {
          setBusinessData({
            ...data,
            loading: false,
            error: null,
          });
          return;
        }
      }

      setBusinessData((prev) => ({ ...prev, loading: true }));

      const response = await fetch(GOOGLE_BUSINESS_CONFIG.API_ENDPOINT);

      if (response.status === 404) {
        setBusinessData({
          rating: null,
          totalReviews: null,
          isOpen: null,
          loading: false,
          error: 'Function not deployed',
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newData = await response.json();

      localStorage.setItem(
        'googleBusinessCache',
        JSON.stringify({
          data: newData,
          timestamp: Date.now(),
        }),
      );

      setBusinessData({
        ...newData,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching Google Business data:', error);
      const cached = localStorage.getItem('googleBusinessCache');
      if (cached) {
        const { data } = JSON.parse(cached);
        setBusinessData({
          ...data,
          loading: false,
          error: 'Using cached data',
        });
      } else {
        setBusinessData((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
      }
    }
  };

  if (businessData.loading) {
    return (
      <div className="flex h-9 min-w-[140px] items-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3 backdrop-blur-md">
        <Loader className="w-3.5 h-3.5 text-white animate-spin" />
        <span className="text-[11px] text-white/90 font-medium">
          Google...
        </span>
      </div>
    );
  }

  if (businessData.error && !businessData.rating) {
    return null;
  }

  const statusLabel =
    businessData.isOpen === null
      ? 'N/D'
      : businessData.isOpen
      ? 'ABERTO'
      : 'FECHADO';

  const statusColor =
    businessData.isOpen == null
      ? 'bg-yellow-400'
      : businessData.isOpen
      ? 'bg-emerald-400'
      : 'bg-rose-400';

  return (
    <button
      type="button"
      className="flex h-9 items-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3 text-left text-white backdrop-blur-md transition-all hover:bg-white/25 hover:-translate-y-[1px]"
      onClick={() =>
        window.open(GOOGLE_BUSINESS_CONFIG.MAPS_URL, '_blank')
      }
      title="Ver no Google Maps"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 flex-shrink-0">
        <MapPin className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col gap-[2px]">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
          <span className="text-[11px] font-semibold">
            {businessData.rating?.toFixed(1) || '—'}
          </span>
          <span className="text-[10px] text-white/80">
            ({businessData.totalReviews || 0})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${statusColor}`}
          />
          <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-white/80">
            {statusLabel}
          </span>
        </div>
      </div>
    </button>
  );
};

export default GoogleBusinessWidget;
