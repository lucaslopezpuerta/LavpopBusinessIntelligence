/**
 * ErrorBoundary - Cosmic Precision error boundary for Bilavnova
 *
 * Features:
 * - Mobile-first responsive design (no scroll required)
 * - Compact cosmic card with stellar glow
 * - React Error Boundary pattern (class component required)
 * - Bilavnova brand integration (Saturn logo, Orbitron font)
 * - Sentry error tracking integration
 * - Proper dark mode via useTheme (not dark: prefix)
 *
 * @version 2.3.0 - useTheme Pattern
 *
 * CHANGELOG:
 * v2.3.0 (2026-01-18): Switched to useTheme pattern for dark mode
 *   - Extracted UI to functional component for hook access
 *   - Uses JavaScript conditionals instead of dark: prefix
 *   - Design System v5.1 compliant
 * v2.2.0 (2026-01-18): Mobile-first responsive design
 * v2.1.0 (2026-01-18): Enhanced cosmic visual design
 * v2.0.0 (2026-01-18): Cosmic Precision upgrade
 * v1.0.0: Initial implementation
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { captureError, addBreadcrumb } from '../utils/errorTracking';
import { BilavnovaIcon } from './ui/BilavnovaLogo';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Error UI Component - Functional component that can use hooks
 * Renders the cosmic error screen with proper theme support
 */
const ErrorUI = ({ error, onReset, onGoHome }) => {
    const { isDark } = useTheme();

    return (
        <div
            className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: isDark ? '#050816' : 'linear-gradient(135deg, #f8fafc, #eff6ff)' }}
        >
            {/* Background effects */}
            {isDark && (
                <>
                    <div className="absolute inset-0 bg-starfield opacity-60 pointer-events-none" />
                    <div className="absolute inset-0 aurora-overlay opacity-70 pointer-events-none" />
                </>
            )}
            {!isDark && (
                <div className="absolute inset-0 bg-grid-light pointer-events-none" />
            )}

            {/* Card container */}
            <div className="relative z-10 w-full max-w-sm">
                {/* Glow effect */}
                <div
                    className="absolute -inset-0.5 rounded-2xl blur-lg"
                    style={{
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(45, 56, 138, 0.4), rgba(0, 174, 239, 0.25))'
                            : 'linear-gradient(135deg, rgba(45, 56, 138, 0.15), rgba(0, 174, 239, 0.1))',
                        opacity: isDark ? 0.6 : 0.8,
                    }}
                />

                {/* Main card */}
                <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                        background: isDark
                            ? 'linear-gradient(145deg, rgba(26, 31, 53, 0.97), rgba(10, 15, 30, 0.99))'
                            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.98))',
                        border: `1px solid ${isDark ? 'rgba(0, 174, 239, 0.15)' : 'rgba(148, 163, 184, 0.2)'}`,
                        boxShadow: isDark
                            ? '0 20px 40px -12px rgba(0, 0, 0, 0.5)'
                            : '0 20px 40px -12px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    {/* Top gradient line */}
                    <div
                        className="h-0.5"
                        style={{ background: 'linear-gradient(90deg, transparent, #00aeef, #2d388a, #00aeef, transparent)' }}
                    />

                    <div className="px-5 py-6 sm:px-6 sm:py-8">
                        {/* Logo + Brand row */}
                        <div className="flex items-center justify-center gap-3 mb-5">
                            <div
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: isDark
                                        ? 'linear-gradient(135deg, rgba(45, 56, 138, 0.3), rgba(10, 15, 30, 0.7))'
                                        : 'linear-gradient(135deg, rgba(45, 56, 138, 0.1), rgba(255, 255, 255, 0.9))',
                                    border: `1px solid ${isDark ? 'rgba(0, 174, 239, 0.25)' : 'rgba(45, 56, 138, 0.15)'}`,
                                    boxShadow: isDark
                                        ? '0 0 20px rgba(0, 174, 239, 0.15)'
                                        : '0 4px 12px rgba(45, 56, 138, 0.1)',
                                }}
                            >
                                <BilavnovaIcon className="w-7 h-7 sm:w-8 sm:h-8" variant="gradient" gradientId="errorLogoGrad" />
                            </div>
                            <h1
                                className="text-lg sm:text-xl font-bold tracking-widest"
                                style={{ fontFamily: "'Orbitron', sans-serif" }}
                            >
                                <span className="text-gradient-stellar">BILAVNOVA</span>
                            </h1>
                        </div>

                        {/* Error indicator */}
                        <div className="flex justify-center mb-4">
                            <div
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center"
                                style={{
                                    background: isDark
                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(127, 29, 29, 0.25))'
                                        : 'linear-gradient(135deg, rgba(254, 226, 226, 0.8), rgba(254, 202, 202, 0.6))',
                                    border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.3)'}`,
                                }}
                            >
                                <AlertTriangle
                                    className="w-6 h-6 sm:w-7 sm:h-7"
                                    style={{ color: isDark ? '#f87171' : '#dc2626' }}
                                />
                            </div>
                        </div>

                        {/* Error message - compact */}
                        <div className="text-center mb-5">
                            <h2
                                className="text-base sm:text-lg font-semibold mb-1.5"
                                style={{ color: isDark ? '#ffffff' : '#0f172a' }}
                            >
                                Algo deu errado
                            </h2>
                            <p
                                className="text-sm leading-relaxed"
                                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                            >
                                Erro inesperado. Seus dados estão seguros.
                            </p>
                        </div>

                        {/* Buttons - always side by side */}
                        <div className="flex gap-2.5">
                            <button
                                onClick={onReset}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
                                style={{
                                    background: 'linear-gradient(135deg, #2d388a, #00aeef)',
                                    boxShadow: '0 4px 16px rgba(0, 174, 239, 0.3)',
                                }}
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Recarregar</span>
                            </button>

                            <button
                                onClick={onGoHome}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
                                style={{
                                    background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(241, 245, 249, 0.9)',
                                    border: `1px solid ${isDark ? 'rgba(0, 174, 239, 0.15)' : 'rgba(148, 163, 184, 0.3)'}`,
                                    color: isDark ? '#cbd5e1' : '#475569',
                                }}
                            >
                                <Home className="w-4 h-4" />
                                <span>Início</span>
                            </button>
                        </div>

                        {/* Dev details - only shown in dev, scrollable internally */}
                        {process.env.NODE_ENV === 'development' && error && (
                            <details className="mt-4">
                                <summary
                                    className="text-xs cursor-pointer"
                                    style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                                >
                                    Detalhes técnicos
                                </summary>
                                <pre
                                    className="mt-2 p-2 text-[10px] leading-tight font-mono rounded-lg max-h-20 overflow-auto"
                                    style={{
                                        background: isDark ? 'rgba(5, 8, 22, 0.5)' : 'rgba(241, 245, 249, 0.8)',
                                        border: `1px solid ${isDark ? 'rgba(0, 174, 239, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
                                        color: isDark ? '#64748b' : '#475569',
                                    }}
                                >
                                    {error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>

                    {/* Footer - minimal */}
                    <div
                        className="px-5 py-2.5 text-center"
                        style={{
                            background: isDark ? 'rgba(5, 8, 22, 0.4)' : 'rgba(241, 245, 249, 0.6)',
                            borderTop: `1px solid ${isDark ? 'rgba(0, 174, 239, 0.08)' : 'rgba(148, 163, 184, 0.15)'}`,
                        }}
                    >
                        <p
                            className="text-[10px]"
                            style={{ color: isDark ? '#475569' : '#94a3b8' }}
                        >
                            Nova Lopez Lavanderia Ltda.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * ErrorBoundary - Class component required for React error boundaries
 * Delegates UI rendering to ErrorUI functional component
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });

        captureError(error, {
            component: 'ErrorBoundary',
            action: 'componentDidCatch',
            componentStack: errorInfo?.componentStack,
        });

        addBreadcrumb({
            category: 'error',
            message: 'React error boundary triggered',
            level: 'error',
            data: { errorMessage: error?.message },
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <ErrorUI
                    error={this.state.error}
                    onReset={this.handleReset}
                    onGoHome={this.handleGoHome}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
