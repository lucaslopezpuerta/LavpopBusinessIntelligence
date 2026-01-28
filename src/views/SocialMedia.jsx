// SocialMedia.jsx v1.4 - STELLAR CASCADE TRANSITIONS
// Social Media Analytics Tab
// Design System v4.0 compliant
//
// CHANGELOG:
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

import { useState, lazy, Suspense } from 'react';
import { Share2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Navigation component
import SocialMediaNavigation from '../components/social/SocialMediaNavigation';

// Lazy-loaded platform components
const InstagramAnalytics = lazy(() => import('../components/social/InstagramAnalytics'));
const WhatsAppAnalytics = lazy(() => import('../components/campaigns/WhatsAppAnalytics'));
const BlacklistManager = lazy(() => import('../components/campaigns/BlacklistManager'));
const GoogleBusinessAnalytics = lazy(() => import('../components/social/GoogleBusinessAnalytics'));

// Pull-to-refresh wrapper
import PullToRefreshWrapper from '../components/ui/PullToRefreshWrapper';
import { AnimatedView, AnimatedHeader, AnimatedSection } from '../components/ui/AnimatedView';

// Loading fallback for lazy components
const LoadingFallback = () => (
  <div className="flex justify-center py-12">
    <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
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
                className="text-lg sm:text-xl font-bold tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                <span className="text-gradient-stellar">REDES SOCIAIS</span>
              </h1>
              <p className={`text-[10px] sm:text-xs tracking-wide mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
        <Suspense fallback={<LoadingFallback />}>
          <InstagramAnalytics />
        </Suspense>
      )}

      {/* WhatsApp Business Analytics Section */}
      {activeSection === 'whatsapp' && (
        <Suspense fallback={<LoadingFallback />}>
          <WhatsAppAnalytics />
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
