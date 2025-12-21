/**
 * LoadingScreen - Clean loading experience for Lavpop BI
 *
 * Features:
 * - Solid dark background (slate-900)
 * - Horizontal progress stepper (3 steps)
 * - Brand color accents on completed steps
 * - Seamless transition from HTML loader
 * - Reduced motion support
 *
 * @version 3.0.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import LogoNoBackground from '../../assets/LogoNoBackground.svg';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Progress steps configuration (ordered by typical load time, smallest first)
const STEPS = [
  { key: 'rfm', label: 'Segmentacao', number: 1 },
  { key: 'customers', label: 'Clientes', number: 2 },
  { key: 'transactions', label: 'Transacoes', number: 3 },
];

const LoadingScreen = ({ progress = { loaded: 0, total: 3, percent: 0, tableStates: {} } }) => {
  const prefersReducedMotion = useReducedMotion();
  const tableStates = progress.tableStates || {};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-6">
      {/* Logo */}
      <motion.div
        initial={prefersReducedMotion ? {} : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-12"
      >
        <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center p-4">
          <img
            src={LogoNoBackground}
            alt="Lavpop"
            className="w-full h-full object-contain"
          />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={prefersReducedMotion ? {} : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-center mb-12"
      >
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          BILAVNOVA
        </h1>
        <p className="text-sm text-slate-400">
          Carregando dados...
        </p>
      </motion.div>

      {/* Horizontal Progress Stepper */}
      <motion.div
        initial={prefersReducedMotion ? {} : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="w-full max-w-md mb-10"
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
                  {/* Circle */}
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                      isComplete
                        ? 'bg-lavpop-green text-white'
                        : isLoading
                          ? 'bg-lavpop-blue text-white'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                    animate={isLoading && !prefersReducedMotion ? {
                      scale: [1, 1.05, 1],
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {isComplete ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </motion.div>

                  {/* Label */}
                  <span className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                    isComplete
                      ? 'text-lavpop-green'
                      : isLoading
                        ? 'text-white'
                        : 'text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 mx-3 h-0.5 bg-slate-800 relative -mt-6">
                    <motion.div
                      className="absolute inset-0 bg-lavpop-green origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isComplete ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={prefersReducedMotion ? {} : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="w-full max-w-xs"
      >
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-lavpop-blue to-lavpop-green rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-center text-xs text-slate-500 mt-3">
          {progress.percent}%
        </p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
