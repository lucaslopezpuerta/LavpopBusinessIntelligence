/**
 * ErrorScreen - User-friendly error display for Bilavnova
 *
 * Features:
 * - Solid dark background (matches LoadingScreen)
 * - Smart error categorization (network, database, timeout, auth)
 * - User-friendly messages in Portuguese
 * - Actionable recovery suggestions
 * - Expandable technical details
 * - Retry functionality
 * - Reduced motion support
 *
 * @version 3.0.0
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
import LogoNoBackground from '../../assets/LogoNoBackground.svg';
import { useReducedMotion } from '../../hooks/useReducedMotion';

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
      title: 'Sem conexao com a internet',
      description: 'Nao foi possivel conectar ao servidor. Verifique sua conexao com a internet.',
      suggestions: [
        'Verifique se o Wi-Fi ou dados moveis estao ativos',
        'Tente recarregar a pagina',
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
        'Verifique se ha manutencao programada'
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
        'Verifique sua conexao com a internet',
        'Tente em um horario com menos trafego'
      ],
      color: 'orange'
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
      title: 'Erro de autenticacao',
      description: 'Sua sessao pode ter expirado ou voce nao tem permissao para acessar esses dados.',
      suggestions: [
        'Tente recarregar a pagina',
        'Faca login novamente se necessario',
        'Verifique suas permissoes de acesso'
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
        'Verifique o status do servico',
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
      'Tente recarregar a pagina',
      'Limpe o cache do navegador',
      'Se o problema persistir, entre em contato com o suporte'
    ],
    color: 'slate'
  };
};

// Color variants for different error types (dark theme)
const colorVariants = {
  amber: {
    bg: 'bg-amber-900/30',
    icon: 'bg-amber-900/50 text-amber-400',
    border: 'border-amber-800',
    text: 'text-amber-300'
  },
  red: {
    bg: 'bg-red-900/30',
    icon: 'bg-red-900/50 text-red-400',
    border: 'border-red-800',
    text: 'text-red-300'
  },
  orange: {
    bg: 'bg-orange-900/30',
    icon: 'bg-orange-900/50 text-orange-400',
    border: 'border-orange-800',
    text: 'text-orange-300'
  },
  purple: {
    bg: 'bg-purple-900/30',
    icon: 'bg-purple-900/50 text-purple-400',
    border: 'border-purple-800',
    text: 'text-purple-300'
  },
  slate: {
    bg: 'bg-slate-700/50',
    icon: 'bg-slate-700 text-slate-400',
    border: 'border-slate-600',
    text: 'text-slate-300'
  }
};

const ErrorScreen = ({ error, onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Categorize the error
  const errorInfo = useMemo(() => categorizeError(error), [error]);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <motion.div
        initial={prefersReducedMotion ? {} : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg"
      >
        {/* Main card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          {/* Header with logo */}
          <div className="px-6 pt-8 pb-6 text-center border-b border-slate-700">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-700 border border-slate-600 p-3">
              <img
                src={LogoNoBackground}
                alt="BILAVNOVA"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-white">
              BILAVNOVA
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
              <h2 className="text-xl font-semibold text-white mb-2">
                {errorInfo.title}
              </h2>
              <p className="text-slate-400 leading-relaxed">
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
                    O que voce pode fazer:
                  </p>
                  <ul className="space-y-1.5">
                    {errorInfo.suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="text-sm text-slate-400 flex items-start gap-2"
                      >
                        <span className="text-slate-500 mt-1">•</span>
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
                className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-slate-300 transition-colors py-2"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Detalhes tecnicos
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
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Mensagem de erro
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 font-mono">
                          {errorInfo.type}
                        </span>
                      </div>
                      <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all max-h-32 overflow-auto">
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
              {/* Primary retry button */}
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className={`w-full py-3.5 px-6 text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isRetrying
                    ? 'bg-slate-600'
                    : 'bg-gradient-to-r from-lavpop-blue to-lavpop-green hover:opacity-90'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Tentando novamente...' : 'Tentar Novamente'}
              </button>

              {/* Secondary action - report issue */}
              <a
                href="https://github.com/anthropics/claude-code/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-6 text-slate-400 font-medium rounded-xl border border-slate-700 hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Reportar problema
              </a>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
            <p className="text-xs text-center text-slate-500">
              Nova Lopez Lavanderia Ltd. • BILAVNOVA
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorScreen;
