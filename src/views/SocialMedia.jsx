// SocialMedia.jsx v1.5 - WHATCHIMP ANALYTICS TAB
// Social Media Analytics Tab
// Design System v4.0 compliant
//
// CHANGELOG:
// v1.5 (2026-02-03): Added WhatChimp Analytics tab
//   - New WhatChimp Sync Analytics dashboard
//   - Shows sync status, label distributions, and customer segments
// v1.4 (2026-01-27): Stellar Cascade transitions
//   - Added AnimatedView, AnimatedHeader, AnimatedSection wrappers
//   - Content cascades in layered sequence (~250ms total)
// v1.3 (2026-01-12): Pull-to-refresh support
//   - Added PullToRefreshWrapper for mobile swipe-to-refresh gesture
//   - Accepts onDataChange prop for refresh callback
// v1.2 (2025-12-19): Added Google Business tab
//   - Google Business Profile analytics with OAuth
//   - Rating, reviews, search/views/actions metrics
// v1.1 (2025-12-19): Added Blacklist tab
//   - Moved BlacklistManager from Campaigns view
//   - Blacklist logically belongs with WhatsApp messaging
// v1.0 (2025-12-18): Initial implementation
//   - Instagram analytics dashboard
//   - Platform sub-tab navigation
//   - Facebook placeholder for future expansion

import { useState, useCallback, Suspense } from 'react';
import lazyRetry from '../utils/lazyRetry';
import { Share2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Navigation component
import SocialMediaNavigation from '../components/social/SocialMediaNavigation';

// Lazy-loaded platform components (with retry for chunk load resilience)
const InstagramAnalytics = lazyRetry(() => import('../components/social/InstagramAnalytics'));
const WhatsAppAnalytics = lazyRetry(() => import('../components/campaigns/WhatsAppAnalytics'));
const WhatChimpAnalytics = lazyRetry(() => import('../components/social/WhatChimpAnalytics'));
const BlacklistManager = lazyRetry(() => import('../components/campaigns/BlacklistManager'));
const GoogleBusinessAnalytics = lazyRetry(() => import('../components/social/GoogleBusinessAnalytics'));
const InstagramGrowthAnalytics = lazyRetry(() => import('../components/social/InstagramGrowthAnalytics'));
const TemplatePerformance = lazyRetry(() => import('../components/campaigns/TemplatePerformance'));

// Pull-to-refresh wrapper
import PullToRefreshWrapper from '../components/ui/PullToRefreshWrapper';
import { AnimatedView, AnimatedHeader, AnimatedSection } from '../components/ui/AnimatedView';
import { Skeleton, SkeletonText, SkeletonChartAnimated } from '../components/ui/Skeleton';

// Loading fallback for lazy components - cosmic shimmer skeleton
const LoadingFallback = () => (
  <div className="space-y-6 py-4">
    {/* KPI Grid skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-space-dust/40 rounded-xl border border-slate-200 dark:border-stellar-cyan/5 p-4">
          <Skeleton className="h-3 w-16 rounded mb-2" stagger staggerIndex={i} />
          <Skeleton className="h-7 w-20 rounded mb-1" stagger staggerIndex={i} />
          <Skeleton className="h-3 w-12 rounded" stagger staggerIndex={i} />
        </div>
      ))}
    </div>
    {/* Chart skeleton */}
    <div className="bg-white dark:bg-space-dust/40 rounded-xl border border-slate-200 dark:border-stellar-cyan/5 p-6">
      <Skeleton className="h-5 w-40 rounded mb-4" stagger staggerIndex={4} />
      <SkeletonChartAnimated height="h-64" />
    </div>
  </div>
);

// Placeholder for future platforms
const ComingSoonPlaceholder = ({ platform }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
      <Share2 className="w-10 h-10 text-slate-400" />
    </div>
    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
      {platform} em breve
    </h3>
    <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
      Estamos trabalhando para trazer as métricas do {platform} para você.
      Fique atento para atualizações!
    </p>
  </div>
);

// ==================== MAIN COMPONENT ====================

const SocialMedia = ({ data, onDataChange }) => {
  // Theme context for Cosmic Precision styling
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState('instagram');
  // Shared state for WhatsApp tab (synced from WhatsAppAnalytics → TemplatePerformance)
  const [waDateFilter, setWaDateFilter] = useState('30d');
  const [waRefreshKey, setWaRefreshKey] = useState(0);
  const handleWaDateFilterChange = useCallback((filter) => setWaDateFilter(filter), []);
  const handleWaSyncComplete = useCallback(() => setWaRefreshKey(k => k + 1), []);

  // Shared state for Instagram tab (synced from InstagramAnalytics → InstagramGrowthAnalytics)
  const [igRefreshKey, setIgRefreshKey] = useState(0);
  const handleIgSyncComplete = useCallback(() => setIgRefreshKey(k => k + 1), []);

  return (
    <PullToRefreshWrapper onRefresh={onDataChange}>
      <AnimatedView>
        {/* Header - Cosmic Precision Design v2.1 */}
        <AnimatedHeader className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icon Container - Glassmorphism */}
            <div
              className={`
                w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDark
                  ? 'bg-space-dust/70 border border-stellar-cyan/20'
                  : 'bg-white border border-stellar-blue/10 shadow-md'}
              `}
              style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            >
              <Share2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-stellar-cyan' : 'text-stellar-blue'}`} />
            </div>
            {/* Title & Subtitle */}
            <div>
              <h1
                className="text-xl sm:text-2xl font-bold tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                <span className="text-gradient-stellar">REDES SOCIAIS</span>
              </h1>
              <p className={`hidden sm:block text-xs tracking-wide mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Analytics e desempenho das suas redes sociais
              </p>
            </div>
          </div>
        </div>

        </AnimatedHeader>

        {/* Platform Navigation */}
        <AnimatedSection>
          <SocialMediaNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Instagram Analytics Section */}
      {activeSection === 'instagram' && (
        <>
          <Suspense fallback={<LoadingFallback />}>
            <InstagramAnalytics onSyncComplete={handleIgSyncComplete} />
          </Suspense>
          <div className="mt-6">
            <Suspense fallback={<LoadingFallback />}>
              <InstagramGrowthAnalytics refreshKey={igRefreshKey} />
            </Suspense>
          </div>
        </>
      )}

      {/* WhatsApp Business Analytics Section */}
      {activeSection === 'whatsapp' && (
        <>
          <Suspense fallback={<LoadingFallback />}>
            <WhatsAppAnalytics onDateFilterChange={handleWaDateFilterChange} onSyncComplete={handleWaSyncComplete} />
          </Suspense>
          <div className="mt-6">
            <Suspense fallback={<LoadingFallback />}>
              <TemplatePerformance dateFilter={waDateFilter} refreshKey={waRefreshKey} />
            </Suspense>
          </div>
        </>
      )}

      {/* WhatChimp Sync Analytics Section */}
      {activeSection === 'whatchimp' && (
        <Suspense fallback={<LoadingFallback />}>
          <WhatChimpAnalytics />
        </Suspense>
      )}

      {/* Blacklist Manager Section */}
      {activeSection === 'blacklist' && (
        <Suspense fallback={<LoadingFallback />}>
          <BlacklistManager customerData={data?.customer} />
        </Suspense>
      )}

      {/* Google Business Profile Section */}
      {activeSection === 'google' && (
        <Suspense fallback={<LoadingFallback />}>
          <GoogleBusinessAnalytics />
        </Suspense>
      )}

        {/* Facebook Section (Coming Soon) */}
        {activeSection === 'facebook' && (
          <ComingSoonPlaceholder platform="Facebook" />
        )}
        </AnimatedSection>

      </AnimatedView>
    </PullToRefreshWrapper>
  );
};

export default SocialMedia;
