// LoginPage.jsx v1.2 - Admin Login Screen
// Clean login experience matching Bilavnova design
//
// Features:
// - Dark slate-900 background (matches LoadingScreen)
// - Brand logo and colors
// - Email/password form
// - Error handling with Portuguese messages
// - Loading state during authentication
// - Reduced motion support
// - Seamless transition from HTML initial loader
//
// CHANGELOG:
// v1.2 (2025-12-26): Seamless transitions + PNG logo
//   - Remove initial HTML loader when component mounts
//   - Use PNG logo from public folder (matches LoadingScreen)
// v1.1 (2025-12-26): Fixed redirect after login
//   - Added useNavigate for redirect to dashboard
//   - Added isAuthenticated check to redirect if already logged in
// v1.0 (2025-12-26): Initial implementation

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useAuth } from '../../contexts/AuthContext';

// PWA icon from public folder (matches LoadingScreen for consistency)
const BilavnovaLogo = '/pwa-192x192.png';

const LoginPage = () => {
  const { signIn, error: authError, isAuthenticated } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Remove HTML initial loader when React takes over
  useEffect(() => {
    if (window.removeInitialLoader) {
      window.removeInitialLoader();
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email.trim()) {
      setError('Digite seu email');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Digite sua senha');
      setLoading(false);
      return;
    }

    const result = await signIn(email.trim(), password);

    if (!result.success) {
      setError(result.error);
    }
    // On success, AuthContext will update and App.jsx will redirect

    setLoading(false);
  };

  const displayError = error || authError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-6">
      {/* Logo */}
      <motion.div
        initial={prefersReducedMotion ? {} : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center p-4">
          <img
            src={BilavnovaLogo}
            alt="Bilavnova"
            className="w-full h-full object-contain"
          />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={prefersReducedMotion ? {} : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          BILAVNOVA
        </h1>
        <p className="text-sm text-slate-400">
          Acesso administrativo
        </p>
      </motion.div>

      {/* Login Form */}
      <motion.form
        initial={prefersReducedMotion ? {} : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
      >
        {/* Error Message */}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400">{displayError}</span>
          </motion.div>
        )}

        {/* Email Input */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            disabled={loading}
            className="w-full h-12 pl-11 pr-4 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-lavpop-blue focus:outline-none focus:ring-1 focus:ring-lavpop-blue transition-colors disabled:opacity-50"
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoComplete="current-password"
            disabled={loading}
            className="w-full h-12 pl-11 pr-11 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-lavpop-blue focus:outline-none focus:ring-1 focus:ring-lavpop-blue transition-colors disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-lg bg-lavpop-blue hover:bg-lavpop-blue/90 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Entrando...</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Entrar</span>
            </>
          )}
        </button>
      </motion.form>

      {/* Footer */}
      <motion.p
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="mt-12 text-xs text-slate-600"
      >
        Nova Lopez Lavanderia Ltd.
      </motion.p>
    </div>
  );
};

export default LoginPage;
