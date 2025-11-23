// GoogleBusinessWidget.jsx v5.0 - COMPACT MODE
// ✅ Added compact prop for header integration
// ✅ Compact: Icon + Rating + Review count
// ✅ Full: Original design with status
// ✅ Glassmorphism styling
import React, { useState, useEffect } from 'react';
import { Star, MapPin, Loader, MessageSquare } from 'lucide-react';

const GOOGLE_BUSINESS_CONFIG = {
  CACHE_DURATION: 24 * 60 * 60 * 1000,
  API_ENDPOINT: 'https://wondrous-medovik-7f51be.netlify.app/.netlify/functions/google-business',
  MAPS_URL: 'https://maps.app.goo.gl/VwNojjvheJrXZeRd8'
};

const GoogleBusinessWidget = ({ compact = false }) => {
  const [businessData, setBusinessData] = useState({
    rating: null,
    totalReviews: null,
    isOpen: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchBusinessData();
    const interval = setInterval(checkAndRefresh, 60 * 60 * 1000);
    return () => clearInterval(interval);
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
          setBusinessData({ ...data, loading: false, error: null });
          return;
        }
      }

      setBusinessData(prev => ({ ...prev, loading: true }));
      const response = await fetch(GOOGLE_BUSINESS_CONFIG.API_ENDPOINT);

      if (response.status === 404) {
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
      localStorage.setItem('googleBusinessCache', JSON.stringify({
        data: newData,
        timestamp: Date.now()
      }));

      setBusinessData({ ...newData, loading: false, error: null });

    } catch (error) {
      const cached = localStorage.getItem('googleBusinessCache');
      if (cached) {
        const { data } = JSON.parse(cached);
        setBusinessData({ ...data, loading: false, error: 'Using cached data' });
      } else {
        setBusinessData(prev => ({ ...prev, loading: false, error: error.message }));
      }
    }
  };

  if (businessData.loading) {
    return (
      <div className={`
        ${compact
          ? 'bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5'
          : 'bg-white/15 backdrop-blur-md px-3 py-2 border border-white/25'}
        rounded-lg flex items-center gap-2 h-9
      `}>
        <Loader className={`w-3.5 h-3.5 ${compact ? 'text-slate-400 dark:text-slate-500' : 'text-white'} animate-spin`} />
        <div className={`text-[11px] font-medium ${compact ? 'text-slate-600 dark:text-slate-400' : 'text-white/90'}`}>
          Google...
        </div>
      </div>
    );
  }

  if (businessData.error && !businessData.rating) {
    return null;
  }

  // Compact Mode for App Header
  if (compact) {
    return (
      <div
        className="
          bg-slate-100 dark:bg-slate-800
          rounded-lg px-2 py-1.5
          flex items-center gap-1.5
          cursor-pointer
          transition-all duration-200
          h-9
          hover:bg-slate-200 dark:hover:bg-slate-700
        "
        onClick={() => window.open(GOOGLE_BUSINESS_CONFIG.MAPS_URL, '_blank')}
        title={`Google Maps • ${businessData.rating?.toFixed(1)} ⭐ • ${businessData.totalReviews} avaliações`}
      >
        {/* Map Pin Icon */}
        <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Metrics - Hidden on smallest screens */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {businessData.rating?.toFixed(1) || '—'}
            </span>
            <Star className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            ({businessData.totalReviews || 0})
          </span>
          <div className={`w-1.5 h-1.5 rounded-full ${businessData.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
        </div>
      </div>
    );
  }

  // Full Mode for Dashboard Banner
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
      <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center shrink-0">
        <MapPin className="w-[15px] h-[15px] text-white" />
      </div>

      <div className="flex flex-col gap-px">
        <div className="flex items-center gap-1.5">
          <Star className="w-[11px] h-[11px] text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-white leading-none">
            {businessData.rating?.toFixed(1) || '—'}
          </span>
          <span className="text-[10px] text-white/80 font-medium">
            ({businessData.totalReviews || 0})
          </span>
        </div>

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
