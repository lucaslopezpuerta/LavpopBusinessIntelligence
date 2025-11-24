import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // You can also log to an error reporting service here
        // Example: logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                        {/* Error Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                            </div>
                        </div>

                        {/* Error Message */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                                Oops! Algo deu errado
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mb-2">
                                Encontramos um erro inesperado. Não se preocupe, seus dados estão seguros.
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-500">
                                Tente recarregar a página ou voltar para a página inicial.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-lavpop-blue to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Tentar Novamente
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-[0.98]"
                            >
                                <Home className="w-5 h-5" />
                                Página Inicial
                            </button>
                        </div>

                        {/* Error Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Detalhes do Erro (Desenvolvimento)
                                </summary>
                                <div className="mt-3 space-y-2">
                                    <div>
                                        <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                                            Error:
                                        </p>
                                        <pre className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded overflow-x-auto">
                                            {this.state.error.toString()}
                                        </pre>
                                    </div>
                                    {this.state.errorInfo && (
                                        <div>
                                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                                                Component Stack:
                                            </p>
                                            <pre className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded overflow-x-auto">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
