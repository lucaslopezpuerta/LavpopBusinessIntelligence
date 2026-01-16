/**
 * LoginPage - Cosmic Precision login experience for Bilavnova
 *
 * Features:
 * - Deep space background with starfield (dark) / clean grid (light)
 * - Glassmorphism login card with gradient border
 * - Orbitron typography for brand name
 * - Input fields with cyan focus glow
 * - Gradient submit button with shimmer effect
 * - Theme-aware (light/dark) design
 * - Reduced motion support for accessibility
 *
 * @version 3.0.0 - Cosmic Precision
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { BilavnovaIcon } from '../ui/BilavnovaLogo';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    }
  }
};

const logoVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    }
  }
};

const fadeUpVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    }
  }
};

const LoginPage = () => {
  const { signIn, error: authError, isAuthenticated } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();
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
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden ${
      isDark ? 'bg-space-void' : 'bg-space-light'
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
      <motion.div
        className={`absolute inset-x-0 top-0 h-[500px] aurora-overlay ${isDark ? 'opacity-100' : 'opacity-40'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isDark ? 1 : 0.4 }}
        transition={{ duration: 1 }}
      />

      {/* Animated aurora (dark mode only) */}
      {isDark && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-x-0 top-0 h-[600px] pointer-events-none"
          animate={{
            background: [
              'radial-gradient(ellipse 80% 50% at 30% -20%, rgba(45, 56, 138, 0.2), transparent)',
              'radial-gradient(ellipse 80% 50% at 70% -20%, rgba(0, 174, 239, 0.2), transparent)',
              'radial-gradient(ellipse 80% 50% at 30% -20%, rgba(45, 56, 138, 0.2), transparent)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={prefersReducedMotion ? {} : containerVariants}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Glassmorphism Card */}
        <motion.div
          variants={prefersReducedMotion ? {} : cardVariants}
          className={`
            relative rounded-3xl p-8
            ${isDark
              ? 'bg-space-dust/50 border border-stellar-cyan/10'
              : 'bg-white/80 border border-stellar-blue/5 shadow-2xl'
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
              className="absolute inset-0 rounded-3xl -z-10 opacity-30"
              style={{
                background: 'linear-gradient(135deg, rgba(45, 56, 138, 0.3), rgba(0, 174, 239, 0.2))',
                filter: 'blur(20px)',
              }}
            />
          )}

          {/* Logo */}
          <motion.div
            variants={prefersReducedMotion ? {} : logoVariants}
            className="flex justify-center mb-6"
          >
            <motion.div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center p-4 ${
                isDark
                  ? 'bg-space-nebula/80 border border-stellar-cyan/20'
                  : 'bg-white border border-stellar-blue/10 shadow-lg'
              }`}
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
              <BilavnovaIcon className="w-full h-full" variant="gradient" gradientId="loginLogoGradient" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div
            variants={prefersReducedMotion ? {} : fadeUpVariants}
            className="text-center mb-8"
          >
            <h1
              className="text-2xl font-bold tracking-widest mb-2"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span className="text-gradient-stellar">BILAVNOVA</span>
            </h1>
            <p className={`text-sm tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Acesso administrativo
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.form
            variants={prefersReducedMotion ? {} : fadeUpVariants}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Error Message */}
            {displayError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 p-3 rounded-xl ${
                  isDark
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <AlertCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                <span className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{displayError}</span>
              </motion.div>
            )}

            {/* Email Input */}
            <div className="relative">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                disabled={loading}
                className={`
                  w-full h-12 pl-12 pr-4 rounded-xl transition-all duration-200
                  ${isDark
                    ? 'bg-space-nebula/60 border-slate-700/50 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }
                  border focus:outline-none focus:border-stellar-cyan
                  focus:ring-2 focus:ring-stellar-cyan/20
                  focus:shadow-[0_0_20px_rgba(0,174,239,0.15)]
                  disabled:opacity-50
                `}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                autoComplete="current-password"
                disabled={loading}
                className={`
                  w-full h-12 pl-12 pr-12 rounded-xl transition-all duration-200
                  ${isDark
                    ? 'bg-space-nebula/60 border-slate-700/50 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }
                  border focus:outline-none focus:border-stellar-cyan
                  focus:ring-2 focus:ring-stellar-cyan/20
                  focus:shadow-[0_0_20px_rgba(0,174,239,0.15)]
                  disabled:opacity-50
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                  isDark
                    ? 'text-slate-500 hover:text-slate-400'
                    : 'text-slate-400 hover:text-slate-500'
                }`}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Submit Button with Gradient & Shimmer */}
            <motion.button
              type="submit"
              disabled={loading}
              className="
                relative w-full h-12 rounded-xl text-white font-semibold
                flex items-center justify-center gap-2
                transition-all duration-200
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                overflow-hidden
              "
              style={{
                background: 'linear-gradient(135deg, #2d388a 0%, #00aeef 100%)',
                boxShadow: '0 4px 14px rgba(0, 174, 239, 0.25)',
                fontFamily: "'Inter', sans-serif",
              }}
              whileHover={loading ? {} : {
                y: -2,
                boxShadow: '0 8px 24px rgba(0, 174, 239, 0.35)',
              }}
              whileTap={loading ? {} : { scale: 0.98 }}
            >
              {/* Shimmer effect */}
              {!loading && !prefersReducedMotion && (
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

              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="relative z-10">Entrando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Entrar</span>
                </>
              )}
            </motion.button>
          </motion.form>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className={`mt-12 text-xs tracking-wider uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}
      >
        Nova Lopez Lavanderia Ltd.
      </motion.p>
    </div>
  );
};

export default LoginPage;
