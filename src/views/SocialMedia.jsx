// SocialMedia.jsx v1.0
// Social Media Analytics Tab
// Design System v4.0 compliant
//
// v1.0 (2025-12-18): Initial implementation
//   - Instagram analytics dashboard
//   - Platform sub-tab navigation
//   - Facebook placeholder for future expansion

import { useState, lazy, Suspense } from 'react';
import { Share2 } from 'lucide-react';

// Navigation component
import SocialMediaNavigation from '../components/social/SocialMediaNavigation';

// Lazy-loaded platform components
const InstagramAnalytics = lazy(() => import('../components/social/InstagramAnalytics'));

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

const SocialMedia = ({ data }) => {
  const [activeSection, setActiveSection] = useState('instagram');

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Redes Sociais
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Analytics e desempenho das suas redes sociais
            </p>
          </div>
        </div>
      </header>

      {/* Platform Navigation */}
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

      {/* Facebook Section (Coming Soon) */}
      {activeSection === 'facebook' && (
        <ComingSoonPlaceholder platform="Facebook" />
      )}

    </div>
  );
};

export default SocialMedia;
