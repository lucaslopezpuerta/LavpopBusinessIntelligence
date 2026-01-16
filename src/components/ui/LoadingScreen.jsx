/**
 * LoadingScreen - Cosmic Precision loading experience for Bilavnova
 *
 * Features:
 * - Deep space background with starfield (dark) / clean grid (light)
 * - Saturn logo with orbital progress ring (properly centered)
 * - Orbitron typography for brand name
 * - Numbered progress circles with gradient fills
 * - Theme-aware (light/dark) design
 * - Reduced motion support for accessibility
 *
 * @version 5.1.0 - Cosmic Precision (Fixed alignment + accents)
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../contexts/ThemeContext';
import { BilavnovaIcon } from './BilavnovaLogo';

// Progress steps configuration - Portuguese with proper accents
const STEPS = [
  { key: 'rfm', label: 'Segmentação', number: 1 },
  { key: 'customers', label: 'Clientes', number: 2 },
  { key: 'transactions', label: 'Transações', number: 3 },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const logoVariants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      duration: 0.6
    }
  }
};

const fadeUpVariants = {
  hidden: { y: 20, opacity: 0 },
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

const LoadingScreen = ({ progress = { loaded: 0, total: 3, percent: 0, tableStates: {} } }) => {
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();
  const tableStates = progress.tableStates || {};

  // Remove HTML initial loader when React takes over
  useEffect(() => {
    if (window.removeInitialLoader) {
      window.removeInitialLoader();
    }
  }, []);

  // Orbital ring dimensions
  const logoSize = 112; // w-28 = 7rem = 112px
  const ringPadding = 24; // Space between logo and ring
  const ringSize = logoSize + ringPadding * 2; // 160px
  const ringRadius = (ringSize - 8) / 2; // Account for stroke width
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={prefersReducedMotion ? {} : containerVariants}
      className={`min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden ${
        isDark ? 'bg-space-void' : 'bg-space-light'
      }`}
    >
      {/* Starfield background (dark mode) */}
      {isDark && (
        <div
          className="absolute inset-0 bg-starfield opacity-60"
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
      <div className={`absolute inset-0 aurora-overlay ${isDark ? 'opacity-100' : 'opacity-50'}`} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Orbital Logo with Progress Ring */}
        <motion.div
          variants={prefersReducedMotion ? {} : logoVariants}
          className="relative mb-10"
          style={{ width: ringSize, height: ringSize }}
        >
          {/* SVG Orbital Progress Ring - Centered */}
          <svg
            className="absolute inset-0"
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            {/* Background track */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke={isDark ? 'rgba(0, 174, 239, 0.15)' : 'rgba(45, 56, 138, 0.1)'}
              strokeWidth="4"
            />
            {/* Progress arc */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2d388a" />
                <stop offset="100%" stopColor="#00aeef" />
              </linearGradient>
            </defs>
            <motion.circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              initial={{ strokeDashoffset: ringCircumference }}
              animate={{ strokeDashoffset: ringCircumference - (ringCircumference * progress.percent / 100) }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>

          {/* Rotating orbital ring decoration */}
          {!prefersReducedMotion && (
            <motion.div
              className="absolute border-2 border-transparent rounded-full"
              style={{
                width: ringSize + 16,
                height: ringSize + 16,
                top: -8,
                left: -8,
                borderTopColor: isDark ? 'rgba(0, 174, 239, 0.5)' : 'rgba(45, 56, 138, 0.4)',
                borderRightColor: isDark ? 'rgba(0, 174, 239, 0.2)' : 'rgba(45, 56, 138, 0.15)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Logo container - glassmorphism - Centered inside ring */}
          <motion.div
            className={`
              absolute rounded-3xl flex items-center justify-center
              ${isDark
                ? 'bg-space-dust/70 border border-stellar-cyan/20'
                : 'bg-white/95 border border-stellar-blue/10 shadow-xl'
              }
            `}
            style={{
              width: logoSize,
              height: logoSize,
              top: ringPadding,
              left: ringPadding,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            animate={prefersReducedMotion ? {} : {
              boxShadow: isDark
                ? [
                    '0 0 20px rgba(45, 56, 138, 0.3), 0 0 40px rgba(0, 174, 239, 0.15)',
                    '0 0 30px rgba(0, 174, 239, 0.4), 0 0 60px rgba(45, 56, 138, 0.2)',
                    '0 0 20px rgba(45, 56, 138, 0.3), 0 0 40px rgba(0, 174, 239, 0.15)',
                  ]
                : [
                    '0 4px 24px rgba(45, 56, 138, 0.15)',
                    '0 4px 32px rgba(0, 174, 239, 0.25)',
                    '0 4px 24px rgba(45, 56, 138, 0.15)',
                  ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BilavnovaIcon className="w-16 h-16" variant="gradient" gradientId="loadingLogoGradient" />
          </motion.div>
        </motion.div>

        {/* Brand Name with Orbitron - Using inline style as fallback */}
        <motion.div
          variants={prefersReducedMotion ? {} : fadeUpVariants}
          className="text-center mb-8"
        >
          <h1
            className="text-3xl font-bold tracking-widest mb-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <span className="text-gradient-stellar">BILAVNOVA</span>
          </h1>
          <p className={`text-sm font-medium tracking-wider uppercase ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Carregando dados
          </p>
        </motion.div>

        {/* Horizontal Progress Stepper - Numbered circles with gradient */}
        <motion.div
          variants={prefersReducedMotion ? {} : fadeUpVariants}
          className="w-full max-w-md mb-8"
        >
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const state = tableStates[step.key] || { status: 'pending' };
              const isComplete = state.status === 'complete';
              const isLoading = state.status === 'loading';
              const isLast = index === STEPS.length - 1;

              return (
                <React.Fragment key={step.key}>
                  {/* Step */}
                  <div className="flex flex-col items-center">
                    {/* Circle with number or check */}
                    <motion.div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        text-base font-bold transition-all duration-300
                        ${isComplete
                          ? 'text-white'
                          : isLoading
                            ? 'text-white'
                            : isDark
                              ? 'bg-space-dust text-slate-500 border-2 border-slate-600'
                              : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                        }
                      `}
                      style={isComplete || isLoading ? {
                        background: isComplete
                          ? 'linear-gradient(135deg, #2d388a 0%, #00aeef 100%)'
                          : '#00aeef',
                      } : undefined}
                      animate={isLoading && !prefersReducedMotion ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(0, 174, 239, 0)',
                          '0 0 0 8px rgba(0, 174, 239, 0.3)',
                          '0 0 0 0 rgba(0, 174, 239, 0)',
                        ],
                      } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {isComplete ? (
                        <Check className="w-6 h-6" strokeWidth={3} />
                      ) : (
                        step.number
                      )}
                    </motion.div>

                    {/* Label */}
                    <span className={`mt-3 text-xs font-semibold tracking-wide transition-colors duration-300 ${
                      isComplete
                        ? 'text-stellar-cyan'
                        : isLoading
                          ? isDark ? 'text-white' : 'text-slate-900'
                          : isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className={`flex-1 mx-4 h-1 relative rounded-full -mt-6 ${
                      isDark ? 'bg-space-dust' : 'bg-slate-200'
                    }`}>
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #2d388a, #00aeef)' }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isComplete ? 1 : 0 }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        {/* Percentage Display with Orbitron */}
        <motion.div
          variants={prefersReducedMotion ? {} : fadeUpVariants}
          className="text-center"
        >
          <span
            className={`text-5xl font-bold tracking-wider ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {progress.percent}
            <span className="text-2xl text-stellar-cyan ml-1">%</span>
          </span>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        variants={prefersReducedMotion ? {} : fadeUpVariants}
        className={`absolute bottom-8 text-xs tracking-wider uppercase ${
          isDark ? 'text-slate-600' : 'text-slate-400'
        }`}
      >
        Nova Lopez Lavanderia Ltda.
      </motion.p>
    </motion.div>
  );
};

export default LoadingScreen;
