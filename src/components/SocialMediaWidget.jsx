// SocialMediaWidget.jsx v7.2 - NAVIGATE TO SOCIAL TAB
// Fetches Instagram/Facebook metrics including insights (profile views, reach, etc.)
// Shows hover dropdown with detailed metrics and Instagram profile picture
// Click navigates to Social Media tab in app
//
// CHANGELOG:
// v7.2 (2025-12-18): Navigate to Social Media tab on click
//   - Click on widget navigates to Social Media view
//   - Hover still shows dropdown with stats
//   - Removed external link behavior from main widget
// v7.1 (previous): Profile picture in dropdown
import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, Users, Loader, Eye, Link2, Radio, Image, Heart, ExternalLink } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';

const SOCIAL_MEDIA_CONFIG = {
  CACHE_DURATION: 4 * 60 * 60 * 1000, // 4 hours (insights are daily metrics)
  API_ENDPOINT: '/.netlify/functions/meta-social',
  CACHE_KEY: 'metaSocialCache_v1', // Versioned for cache busting on updates
  // Fallback URLs (used if API doesn't return URLs)
  FALLBACK_INSTAGRAM_URL: 'https://www.instagram.com/lavpopcaxiasdosul/',
  FALLBACK_FACEBOOK_URL: 'https://www.facebook.com/profile.php?id=61556557355037'
};

const SocialMediaWidget = ({ compact = false }) => {
  const { navigateTo } = useNavigation();
  const [socialData, setSocialData] = useState({
    instagramFollowers: null,
    instagramUsername: null,
    instagramMediaCount: null,
    instagramProfilePicture: null,
    instagramUrl: null,
    instagramInsights: null,
    facebookFollowers: null,
    facebookLikes: null,
    facebookUrl: null,
    loading: true,
    error: null
  });

  const [showInstagramDropdown, setShowInstagramDropdown] = useState(false);
  const [showFacebookDropdown, setShowFacebookDropdown] = useState(false);

  useEffect(() => {
    fetchSocialData();
    const interval = setInterval(checkAndRefresh, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAndRefresh = () => {
    try {
      const cached = localStorage.getItem(SOCIAL_MEDIA_CONFIG.CACHE_KEY);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > SOCIAL_MEDIA_CONFIG.CACHE_DURATION) {
          fetchSocialData();
        }
      } else {
        fetchSocialData();
      }
    } catch {
      // Corrupted cache, fetch fresh data
      localStorage.removeItem(SOCIAL_MEDIA_CONFIG.CACHE_KEY);
      fetchSocialData();
    }
  };

  const fetchSocialData = async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem(SOCIAL_MEDIA_CONFIG.CACHE_KEY);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < SOCIAL_MEDIA_CONFIG.CACHE_DURATION) {
            setSocialData({ ...data, loading: false, error: null });
            return;
          }
        } catch {
          // Corrupted cache, continue to fetch
          localStorage.removeItem(SOCIAL_MEDIA_CONFIG.CACHE_KEY);
        }
      }

      setSocialData(prev => ({ ...prev, loading: true }));

      const response = await fetch(SOCIAL_MEDIA_CONFIG.API_ENDPOINT);

      if (response.status === 404) {
        setSocialData({
          instagramFollowers: null,
          instagramUsername: null,
          instagramMediaCount: null,
          instagramProfilePicture: null,
          instagramUrl: null,
          instagramInsights: null,
          facebookFollowers: null,
          facebookLikes: null,
          facebookUrl: null,
          loading: false,
          error: 'Function not deployed'
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const apiData = await response.json();

      const newData = {
        instagramFollowers: apiData.instagram?.followers || 0,
        instagramUsername: apiData.instagram?.username || null,
        instagramMediaCount: apiData.instagram?.mediaCount || 0,
        instagramProfilePicture: apiData.instagram?.profilePicture || null,
        instagramUrl: apiData.instagram?.url || SOCIAL_MEDIA_CONFIG.FALLBACK_INSTAGRAM_URL,
        instagramInsights: apiData.instagram?.insights || null,
        facebookFollowers: apiData.facebook?.followers || 0,
        facebookLikes: apiData.facebook?.likes || 0,
        facebookUrl: apiData.facebook?.url || SOCIAL_MEDIA_CONFIG.FALLBACK_FACEBOOK_URL
      };

      localStorage.setItem(SOCIAL_MEDIA_CONFIG.CACHE_KEY, JSON.stringify({
        data: newData,
        timestamp: Date.now()
      }));

      setSocialData({ ...newData, loading: false, error: null });

    } catch (error) {
      // On error, try to use stale cached data as fallback
      try {
        const cached = localStorage.getItem(SOCIAL_MEDIA_CONFIG.CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          setSocialData({ ...data, loading: false, error: 'Using cached data' });
          return;
        }
      } catch {
        // Cache corrupted, ignore
      }
      setSocialData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const formatNumber = (count) => {
    if (count === null || count === undefined) return '—';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Loading state
  if (socialData.loading) {
    return (
      <div className={`
        ${compact
          ? 'bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5'
          : 'bg-white/15 backdrop-blur-md px-3 py-2 border border-white/25'}
        rounded-lg flex items-center gap-2 h-9
      `}>
        <Loader className={`w-3.5 h-3.5 ${compact ? 'text-slate-400 dark:text-slate-500' : 'text-white'} animate-spin`} />
        <div className={`text-[11px] font-medium ${compact ? 'text-slate-600 dark:text-slate-400' : 'text-white/90'}`}>
          Instagram...
        </div>
      </div>
    );
  }

  // Error state with no cached data - hide widget
  if (socialData.error && !socialData.instagramFollowers) {
    return null;
  }

  // Instagram Dropdown Content
  const InstagramDropdown = () => (
    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
        {socialData.instagramProfilePicture ? (
          <img
            src={socialData.instagramProfilePicture}
            alt={socialData.instagramUsername || 'Instagram'}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Instagram className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">Instagram</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">@{socialData.instagramUsername || 'lavpopcaxiasdosul'}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 pt-3">
        {/* Followers */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
            <Users className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wide">Seguidores</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {formatNumber(socialData.instagramFollowers)}
          </div>
        </div>

        {/* Posts */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
            <Image className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wide">Posts</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {formatNumber(socialData.instagramMediaCount)}
          </div>
        </div>

        {/* Profile Views - Only show if insights available */}
        {socialData.instagramInsights?.profileViews > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 mb-0.5">
              <Eye className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wide">Visitas</span>
            </div>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
              {formatNumber(socialData.instagramInsights.profileViews)}
            </div>
          </div>
        )}

        {/* Reach */}
        {socialData.instagramInsights?.reach > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-0.5">
              <Radio className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wide">Alcance</span>
            </div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {formatNumber(socialData.instagramInsights.reach)}
            </div>
          </div>
        )}

        {/* Website Clicks */}
        {socialData.instagramInsights?.websiteClicks > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-0.5">
              <Link2 className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wide">Cliques</span>
            </div>
            <div className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatNumber(socialData.instagramInsights.websiteClicks)}
            </div>
          </div>
        )}

        {/* Accounts Engaged */}
        {socialData.instagramInsights?.accountsEngaged > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-0.5">
              <Users className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wide">Engajados</span>
            </div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
              {formatNumber(socialData.instagramInsights.accountsEngaged)}
            </div>
          </div>
        )}

        {/* Total Interactions */}
        {socialData.instagramInsights?.totalInteractions > 0 && (
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2">
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 mb-0.5">
              <Heart className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wide">Interacoes</span>
            </div>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-300">
              {formatNumber(socialData.instagramInsights.totalInteractions)}
            </div>
          </div>
        )}
      </div>

      {/* View Profile Link */}
      <a
        href={socialData.instagramUrl || SOCIAL_MEDIA_CONFIG.FALLBACK_INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
      >
        <span>Ver Perfil</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );

  // Facebook Dropdown Content
  const FacebookDropdown = () => (
    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Facebook className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">Facebook</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Pagina</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 pt-3">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
            <Users className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wide">Seguidores</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {formatNumber(socialData.facebookFollowers)}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-0.5">
            <Heart className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wide">Curtidas</span>
          </div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {formatNumber(socialData.facebookLikes)}
          </div>
        </div>
      </div>

      {/* View Page Link */}
      <a
        href={socialData.facebookUrl || SOCIAL_MEDIA_CONFIG.FALLBACK_FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all"
      >
        <span>Ver Pagina</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );

  // Compact Mode for App Header
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {/* Instagram with Dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setShowInstagramDropdown(true)}
          onMouseLeave={() => setShowInstagramDropdown(false)}
        >
          <div
            onClick={() => navigateTo('social')}
            className="
              bg-slate-100 dark:bg-slate-800
              rounded-lg px-2 py-1.5
              flex items-center gap-1.5
              cursor-pointer
              transition-all duration-200
              h-9
              hover:bg-slate-200 dark:hover:bg-slate-700
            "
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigateTo('social')}
            title="Ver Redes Sociais"
          >
            {/* Mobile: Show followers only */}
            <div className="sm:hidden flex items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {formatNumber(socialData.instagramFollowers)}
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
                  {formatNumber(socialData.instagramFollowers)}
                </span>
              </div>
            </div>
          </div>

          {/* Dropdown */}
          {showInstagramDropdown && <InstagramDropdown />}
        </div>

        {/* Facebook with Dropdown */}
        {socialData.facebookFollowers > 0 && (
          <div
            className="relative"
            onMouseEnter={() => setShowFacebookDropdown(true)}
            onMouseLeave={() => setShowFacebookDropdown(false)}
          >
            <div
              onClick={() => navigateTo('social')}
              className="
                bg-slate-100 dark:bg-slate-800
                rounded-lg px-2 py-1.5
                flex items-center gap-1.5
                cursor-pointer
                transition-all duration-200
                h-9
                hover:bg-slate-200 dark:hover:bg-slate-700
              "
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigateTo('social')}
              title="Ver Redes Sociais"
            >
              {/* Mobile: Show followers only */}
              <div className="sm:hidden flex items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {formatNumber(socialData.facebookFollowers)}
                </span>
              </div>

              {/* Desktop: Icon + Followers */}
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shrink-0">
                  <Facebook className="w-3 h-3 text-white" />
                </div>
                <div className="flex items-center gap-0.5">
                  <Users className="w-2.5 h-2.5 text-blue-500 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {formatNumber(socialData.facebookFollowers)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dropdown */}
            {showFacebookDropdown && <FacebookDropdown />}
          </div>
        )}
      </div>
    );
  }

  // Full Mode for Dashboard Banner (keep simple, no dropdown needed)
  return (
    <div className="flex items-center gap-2">
      {/* Instagram */}
      <div
        onClick={() => navigateTo('social')}
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
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigateTo('social')}
        title="Ver Redes Sociais"
      >
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
          <Instagram className="w-[15px] h-[15px] text-white" />
        </div>

        <div className="flex flex-col gap-px">
          <div className="text-xs font-bold text-white leading-none">
            INSTAGRAM
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-2.5 h-2.5 text-white/90" />
            <span className="text-[11px] font-semibold text-white/90">
              {formatNumber(socialData.instagramFollowers)}
            </span>
          </div>
        </div>
      </div>

      {/* Facebook */}
      {socialData.facebookFollowers > 0 && (
        <div
          onClick={() => navigateTo('social')}
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
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigateTo('social')}
          title="Ver Redes Sociais"
        >
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <Facebook className="w-[15px] h-[15px] text-white" />
          </div>

          <div className="flex flex-col gap-px">
            <div className="text-xs font-bold text-white leading-none">
              FACEBOOK
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-2.5 h-2.5 text-white/90" />
              <span className="text-[11px] font-semibold text-white/90">
                {formatNumber(socialData.facebookFollowers)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaWidget;
