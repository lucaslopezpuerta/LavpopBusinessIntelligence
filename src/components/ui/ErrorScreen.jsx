/**
 * ErrorScreen - Cosmic Precision error display for Bilavnova
 *
 * Features:
 * - Deep space background with starfield (dark) / clean gradient (light)
 * - Glassmorphism error card with stellar borders
 * - Smart error categorization (network, database, timeout, auth)
 * - User-friendly messages in Portuguese
 * - Actionable recovery suggestions
 * - Expandable technical details
 * - Retry functionality with stellar gradient button
 * - Bilavnova brand integration (Saturn logo, Orbitron font)
 * - Full light/dark mode support via useTheme
 * - Reduced motion support
 *
 * @version 4.0.0 - Cosmic Precision + Bilavnova brand migration
 *
 * CHANGELOG:
 * v4.0.0 (2026-01-18): Cosmic Precision upgrade + Bilavnova brand migration
 *   - Applied Variant E: Premium Cosmic with starfield/aurora
 *   - Added useTheme() hook for full light/dark mode support
 *   - Replaced LogoNoBackground.svg with BilavnovaIcon (Saturn logo)
 *   - Added Orbitron font for brand name
 *   - Updated to stellar gradient button
 *   - Added glassmorphism card styling
 *   - Updated color variants to cosmic palette
 *   - Cosmic compliant: Design System v5.0
 * v3.0.0: Smart error categorization, user-friendly messages
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WifiOff,
  Database,
  Clock,
  ShieldX,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Server,
  HelpCircle
} from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../contexts/ThemeContext';
import { BilavnovaIcon } from './BilavnovaLogo';

/**
 * Categorize error based on message content
 * Returns error type and user-friendly details
 */
const categorizeError = (errorMessage) => {
  const message = (errorMessage || '').toLowerCase();

  // Network/Connection errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('offline') ||
    message.includes('net::') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror')
  ) {
    return {
      type: 'network',
      icon: WifiOff,
      title: 'Sem conexão com a internet',
      description: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
      suggestions: [
        'Verifique se o Wi-Fi ou dados móveis estão ativos',
        'Tente recarregar a página',
        'Se o problema persistir, aguarde alguns minutos'
      ],
      color: 'amber'
    };
  }

  // Database/Supabase errors
  if (
    message.includes('supabase') ||
    message.includes('database') ||
    message.includes('postgres') ||
    message.includes('pgrst') ||
    message.includes('relation') ||
    message.includes('table') ||
    message.includes('column')
  ) {
    return {
      type: 'database',
      icon: Database,
      title: 'Erro no banco de dados',
      description: 'Ocorreu um problema ao acessar os dados. Nossa equipe foi notificada.',
      suggestions: [
        'Tente novamente em alguns instantes',
        'Se o erro persistir, entre em contato com o suporte',
        'Verifique se há manutenção programada'
      ],
      color: 'red'
    };
  }

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('aborted') ||
    message.includes('too long')
  ) {
    return {
      type: 'timeout',
      icon: Clock,
      title: 'Tempo de resposta excedido',
      description: 'O servidor demorou muito para responder. Isso pode indicar alta demanda.',
      suggestions: [
        'Aguarde alguns segundos e tente novamente',
        'Verifique sua conexão com a internet',
        'Tente em um horário com menos tráfego'
      ],
      color: 'cyan'
    };
  }

  // Authentication errors
  if (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('permission') ||
    message.includes('access denied')
  ) {
    return {
      type: 'auth',
      icon: ShieldX,
      title: 'Erro de autenticação',
      description: 'Sua sessão pode ter expirado ou você não tem permissão para acessar esses dados.',
      suggestions: [
        'Tente recarregar a página',
        'Faça login novamente se necessário',
        'Verifique suas permissões de acesso'
      ],
      color: 'purple'
    };
  }

  // Server errors
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('server error') ||
    message.includes('internal error')
  ) {
    return {
      type: 'server',
      icon: Server,
      title: 'Erro no servidor',
      description: 'O servidor encontrou um problema inesperado. Estamos trabalhando para resolver.',
      suggestions: [
        'Aguarde alguns minutos e tente novamente',
        'Verifique o status do serviço',
        'Entre em contato com o suporte se o erro persistir'
      ],
      color: 'red'
    };
  }

  // Generic/Unknown errors
  return {
    type: 'unknown',
    icon: AlertTriangle,
    title: 'Algo deu errado',
    description: 'Ocorreu um erro inesperado ao carregar os dados.',
    suggestions: [
      'Tente recarregar a página',
      'Limpe o cache do navegador',
      'Se o problema persistir, entre em contato com o suporte'
    ],
    color: 'slate'
  };
};

// Color variants for different error types - Cosmic Precision palette
const getColorVariants = (isDark) => ({
  amber: {
    bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
    icon: isDark ? 'bg-amber-900/40 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-600 border border-amber-300',
    border: isDark ? 'border-amber-500/20' : 'border-amber-200',
    text: isDark ? 'text-amber-400' : 'text-amber-700'
  },
  red: {
    bg: isDark ? 'bg-red-900/20' : 'bg-red-50',
    icon: isDark ? 'bg-red-900/40 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-600 border border-red-300',
    border: isDark ? 'border-red-500/20' : 'border-red-200',
    text: isDark ? 'text-red-400' : 'text-red-700'
  },
  cyan: {
    bg: isDark ? 'bg-cyan-900/20' : 'bg-cyan-50',
    icon: isDark ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-100 text-cyan-600 border border-cyan-300',
    border: isDark ? 'border-cyan-500/20' : 'border-cyan-200',
    text: isDark ? 'text-cyan-400' : 'text-cyan-700'
  },
  purple: {
    bg: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
    icon: isDark ? 'bg-purple-900/40 text-purple-400 border border-purple-500/30' : 'bg-purple-100 text-purple-600 border border-purple-300',
    border: isDark ? 'border-purple-500/20' : 'border-purple-200',
    text: isDark ? 'text-purple-400' : 'text-purple-700'
  },
  slate: {
    bg: isDark ? 'bg-slate-800/50' : 'bg-slate-100',
    icon: isDark ? 'bg-slate-700/50 text-slate-400 border border-slate-600/30' : 'bg-slate-200 text-slate-600 border border-slate-300',
    border: isDark ? 'border-slate-600/30' : 'border-slate-200',
    text: isDark ? 'text-slate-400' : 'text-slate-600'
  }
});

const ErrorScreen = ({ error, onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();

  // Categorize the error
  const errorInfo = useMemo(() => categorizeError(error), [error]);
  const colorVariants = getColorVariants(isDark);
  const colors = colorVariants[errorInfo.color];
  const ErrorIcon = errorInfo.icon;

  // Handle retry with loading state
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry?.();
    } finally {
      // Add small delay for UX
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden ${
      isDark ? 'bg-space-void' : 'bg-gradient-to-br from-slate-50 to-blue-50'
    }`}>
      {/* Starfield background (dark mode) */}
      {isDark && (
        <div
          className="absolute inset-0 bg-starfield opacity-50"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Grid pattern (light mode) */}
      {!isDark && (
        <div
          className="absolute inset-0 bg-grid-light"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Aurora gradient overlay */}
      <div className={`absolute inset-x-0 top-0 h-[500px] aurora-overlay ${isDark ? 'opacity-60' : 'opacity-30'}`} />

      <motion.div
        initial={prefersReducedMotion ? {} : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Main card - Glassmorphism Cosmic */}
        <div
          className={`
            rounded-3xl overflow-hidden
            ${isDark
              ? 'bg-space-dust/80 border border-stellar-cyan/15'
              : 'bg-white/90 border border-slate-200/80 shadow-2xl'
            }
          `}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* Gradient border glow (dark mode) */}
          {isDark && (
            <div
              className="absolute inset-0 rounded-3xl -z-10 opacity-20"
              style={{
                background: 'linear-gradient(135deg, rgba(45, 56, 138, 0.4), rgba(0, 174, 239, 0.2))',
                filter: 'blur(24px)',
              }}
            />
          )}

          {/* Header with Bilavnova branding */}
          <div className={`px-6 pt-8 pb-6 text-center border-b ${
            isDark ? 'border-stellar-cyan/10' : 'border-slate-200'
          }`}>
            {/* Logo container with glow */}
            <motion.div
              className={`
                w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
                ${isDark
                  ? 'bg-space-nebula/80 border border-stellar-cyan/20'
                  : 'bg-white border border-stellar-blue/10 shadow-lg'
                }
              `}
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              animate={prefersReducedMotion ? {} : {
                boxShadow: isDark
                  ? [
                      '0 0 20px rgba(45, 56, 138, 0.2), 0 0 40px rgba(0, 174, 239, 0.1)',
                      '0 0 30px rgba(0, 174, 239, 0.3), 0 0 50px rgba(45, 56, 138, 0.15)',
                      '0 0 20px rgba(45, 56, 138, 0.2), 0 0 40px rgba(0, 174, 239, 0.1)',
                    ]
                  : [
                      '0 4px 20px rgba(45, 56, 138, 0.1)',
                      '0 4px 30px rgba(0, 174, 239, 0.15)',
                      '0 4px 20px rgba(45, 56, 138, 0.1)',
                    ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <BilavnovaIcon className="w-9 h-9" variant="gradient" gradientId="errorLogoGradient" />
            </motion.div>

            {/* Brand name with Orbitron */}
            <h1
              className="text-xl font-bold tracking-widest"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span className="text-gradient-stellar">BILAVNOVA</span>
            </h1>
          </div>

          {/* Error content */}
          <div className="p-6">
            {/* Error type indicator */}
            <motion.div
              initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${colors.icon}`}
            >
              <ErrorIcon className="w-8 h-8" />
            </motion.div>

            {/* Error message */}
            <motion.div
              initial={prefersReducedMotion ? {} : { y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {errorInfo.title}
              </h2>
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                {errorInfo.description}
              </p>
            </motion.div>

            {/* Suggestions */}
            <motion.div
              initial={prefersReducedMotion ? {} : { y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`rounded-xl p-4 mb-6 ${colors.bg} border ${colors.border}`}
            >
              <div className="flex items-start gap-3">
                <HelpCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.text}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-2 ${colors.text}`}>
                    O que você pode fazer:
                  </p>
                  <ul className="space-y-1.5">
                    {errorInfo.suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className={`text-sm flex items-start gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                      >
                        <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Technical details (expandable) */}
            <motion.div
              initial={prefersReducedMotion ? {} : { y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`w-full flex items-center justify-between text-sm py-2 transition-colors ${
                  isDark
                    ? 'text-slate-400 hover:text-slate-300'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Detalhes técnicos
                </span>
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={`rounded-xl p-4 border ${
                      isDark
                        ? 'bg-space-nebula/50 border-stellar-cyan/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Mensagem de erro
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                          isDark
                            ? 'bg-space-dust text-slate-400'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {errorInfo.type}
                        </span>
                      </div>
                      <pre className={`text-xs font-mono whitespace-pre-wrap break-all max-h-32 overflow-auto ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {error || 'Erro desconhecido'}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={prefersReducedMotion ? {} : { y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              {/* Primary retry button - Stellar gradient */}
              <motion.button
                onClick={handleRetry}
                disabled={isRetrying}
                className="
                  relative w-full py-3.5 px-6 text-white font-semibold rounded-xl
                  transition-all duration-200 active:scale-[0.98]
                  disabled:opacity-70 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                  overflow-hidden
                "
                style={{
                  background: isRetrying
                    ? (isDark ? '#1a1f35' : '#e2e8f0')
                    : 'linear-gradient(135deg, #2d388a 0%, #00aeef 100%)',
                  boxShadow: isRetrying
                    ? 'none'
                    : '0 4px 14px rgba(0, 174, 239, 0.25)',
                  color: isRetrying ? (isDark ? '#94a3b8' : '#64748b') : '#ffffff',
                }}
                whileHover={isRetrying ? {} : {
                  y: -2,
                  boxShadow: '0 8px 24px rgba(0, 174, 239, 0.35)',
                }}
                whileTap={isRetrying ? {} : { scale: 0.98 }}
              >
                {/* Shimmer effect */}
                {!isRetrying && !prefersReducedMotion && (
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                    }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                  />
                )}
                <RefreshCw className={`w-5 h-5 relative z-10 ${isRetrying ? 'animate-spin' : ''}`} />
                <span className="relative z-10">
                  {isRetrying ? 'Tentando novamente...' : 'Tentar Novamente'}
                </span>
              </motion.button>

              {/* Secondary action - report issue */}
              <a
                href="https://github.com/anthropics/claude-code/issues"
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  w-full py-3 px-6 font-medium rounded-xl
                  transition-colors flex items-center justify-center gap-2
                  ${isDark
                    ? 'text-slate-400 border border-stellar-cyan/15 hover:bg-space-nebula/50'
                    : 'text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }
                `}
              >
                <ExternalLink className="w-4 h-4" />
                Reportar problema
              </a>
            </motion.div>
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t ${
            isDark
              ? 'bg-space-nebula/30 border-stellar-cyan/10'
              : 'bg-slate-50/80 border-slate-200'
          }`}>
            <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Nova Lopez Lavanderia Ltda. • BILAVNOVA
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorScreen;
