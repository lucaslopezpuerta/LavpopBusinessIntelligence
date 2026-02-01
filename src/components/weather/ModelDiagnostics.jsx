// ModelDiagnostics.jsx v3.0
// Modal component showing detailed model diagnostics
//
// CHANGELOG:
// v3.1 (2026-01-20): UX improvements
//   - Removed footer "Fechar" button (header close button is sufficient)
//   - iOS-compatible body scroll lock (position:fixed approach)
// v3.0 (2026-01-20): Cosmic Precision upgrade
//   - Applied Variant D: Glassmorphism Cosmic (Modal)
//   - Added useTheme hook for theme-aware styling
//   - Modal: bg-space-dust/95 dark, bg-white/98 light
//   - Added backdrop-blur-xl effect
//   - Updated borders to stellar-cyan/20 in dark mode
//   - Updated internal borders to stellar-cyan/10
//   - Cosmic compliant: Design System v5.1
//
// v2.1 (2026-01-20): Closure day exclusion explanation
//   - Added explanation that closure days (revenue < R$100) are excluded
//   - Closure days are fundamentally unpredictable without external indicators
//   - Normal-day MAPE ~47% vs All-day MAPE ~141%
//
// v2.0 (2026-01-20): OOS metrics and drift detection
//   - Added "Desempenho Real" section with OOS MAE/MAPE
//   - Added drift warning when model degradation detected
//   - Clearly distinguishes in-sample (training) vs OOS (real) metrics
//   - Rolling 30-day accuracy from prediction_accuracy view
//
// v1.0 (2025-12-21): Initial implementation
//   - Coefficient table with translated feature names
//   - Performance metrics (R², MAE, RMSE)
//   - Data quality information
//   - Model tier and training info

import React, { useEffect } from 'react';
import {
  X,
  FlaskConical,
  TrendingUp,
  BarChart3,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Database,
  Target,
  Activity,
  Store,
  Info
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// Feature name translations (Portuguese)
const FEATURE_TRANSLATIONS = {
  'intercept': 'Intercepto (base)',
  'rev_lag_1': 'Receita de ontem',
  'rev_lag_7': 'Receita há 7 dias',
  'is_weekend': 'Final de semana',
  'drying_pain': 'Dificuldade de secar',
  'is_rainy': 'Dia de chuva',
  'heavy_rain': 'Chuva forte',
  'is_holiday': 'Feriado',
  'is_holiday_eve': 'Véspera de feriado',
  'weekend_x_drying': 'Fim de sem. × Dificuldade',
  'weekend_x_rain': 'Fim de sem. × Chuva',
  'holiday_x_drying': 'Feriado × Dificuldade'
};

// Model tier descriptions
const TIER_INFO = {
  full: {
    label: 'Completo',
    description: '12 features incluindo feriados e interações',
    color: 'text-emerald-600 dark:text-emerald-400'
  },
  reduced: {
    label: 'Reduzido',
    description: '7 features básicas (menos dados disponíveis)',
    color: 'text-blue-600 dark:text-blue-400'
  },
  minimal: {
    label: 'Mínimo',
    description: '3 features (apenas lags de receita)',
    color: 'text-amber-600 dark:text-amber-400'
  },
  fallback: {
    label: 'Fallback',
    description: 'Usando média histórica (dados insuficientes)',
    color: 'text-red-600 dark:text-red-400'
  }
};

/**
 * Get R² quality label and color
 */
function getRSquaredQuality(rSquared) {
  if (rSquared >= 0.85) return { label: 'Excelente', color: 'text-emerald-600', icon: CheckCircle };
  if (rSquared >= 0.75) return { label: 'Bom', color: 'text-blue-600', icon: CheckCircle };
  if (rSquared >= 0.60) return { label: 'Razoável', color: 'text-amber-600', icon: AlertCircle };
  return { label: 'Baixo', color: 'text-red-600', icon: AlertCircle };
}

/**
 * Format coefficient value for display
 */
function formatCoefficient(value, index) {
  if (value === undefined || value === null) return '—';

  // Intercept should show full value
  if (index === 0) {
    return `R$ ${Math.round(value)}`;
  }

  // Other coefficients as multipliers
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

/**
 * Metric card component
 */
const MetricCard = ({ icon: Icon, label, value, subtext, colorClass = 'text-slate-600' }) => (
  <div className="p-3 bg-slate-50 dark:bg-space-dust/50 rounded-lg">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${colorClass}`} />
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </div>
    <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    {subtext && (
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtext}</div>
    )}
  </div>
);

/**
 * ModelDiagnostics Modal Component
 */
const ModelDiagnostics = ({ isOpen, onClose, modelInfo, dataQuality }) => {
  const { isDark } = useTheme();

  // Lock body scroll when modal is open (iOS-compatible)
  useEffect(() => {
    if (!isOpen) return;

    // Save current scroll position and styles
    const scrollY = window.scrollY;
    const originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };

    // Lock scrolling - position:fixed prevents iOS scroll-through
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    return () => {
      // Restore original styles
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.left = originalStyles.left;
      document.body.style.right = originalStyles.right;
      document.body.style.width = originalStyles.width;
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const rSquared = modelInfo?.r_squared || 0;
  const rSquaredPct = Math.round(rSquared * 100);
  const quality = getRSquaredQuality(rSquared);
  const QualityIcon = quality.icon;

  const tier = modelInfo?.model_tier || 'full';
  const tierInfo = TIER_INFO[tier] || TIER_INFO.full;

  const featureNames = modelInfo?.feature_names || [];
  const coefficients = modelInfo?.coefficients || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden">
      <div className={`
        ${isDark ? 'bg-space-dust/95' : 'bg-white/98'}
        backdrop-blur-xl
        border ${isDark ? 'border-stellar-cyan/20' : 'border-slate-200'}
        shadow-2xl
        rounded-2xl
        max-w-lg w-full max-h-[90vh] overflow-hidden
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-stellar-cyan/10">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Diagnóstico do Modelo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-space-nebula transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Drift Warning */}
          {modelInfo?.drift_detected && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Modelo pode estar desatualizado
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    Os erros recentes são {modelInfo.drift_ratio ? `${modelInfo.drift_ratio.toFixed(1)}×` : ''} maiores que a média histórica.
                    Considere investigar mudanças no padrão de receita.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Real Performance (OOS Metrics) - Most Important */}
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Desempenho Real
              </h3>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
              Métricas de previsões verificadas. Dias de fechamento são excluídos do MAPE principal.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-space-dust rounded p-2">
                <span className="text-xs text-amber-600 dark:text-amber-500">MAE:</span>
                <div className="text-lg font-bold text-amber-900 dark:text-amber-200">
                  {modelInfo?.tracked_mae ? `R$ ${modelInfo.tracked_mae}` : (modelInfo?.oos_mae ? `R$ ${modelInfo.oos_mae}` : '—')}
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-500">erro médio</span>
              </div>
              <div className="bg-white dark:bg-space-dust rounded p-2">
                <span className="text-xs text-emerald-600 dark:text-emerald-500">MAPE (Normal):</span>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {modelInfo?.tracked_mape ? `${Math.round(modelInfo.tracked_mape)}%` : '—'}
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-500">dias normais</span>
              </div>
              <div className="bg-white dark:bg-space-dust rounded p-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">MAPE (Todos):</span>
                <div className="text-lg font-bold text-slate-600 dark:text-slate-300">
                  {modelInfo?.oos_mape ? `${Math.round(modelInfo.oos_mape)}%` : '—'}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">incl. fechamentos</span>
              </div>
            </div>
            {modelInfo?.tracked_predictions > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                Baseado em {modelInfo.tracked_predictions} previsões verificadas
              </p>
            )}
          </div>

          {/* Closure Days Explanation */}
          <div className="mb-4 p-3 bg-slate-50 dark:bg-space-dust/50 rounded-lg border border-slate-200 dark:border-stellar-cyan/10">
            <div className="flex items-start gap-2">
              <Store className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Por que dias de fechamento são excluídos?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Dias com receita abaixo de R$ 100 (feriados, manutenção, etc.) são imprevisíveis
                  sem indicadores externos. Eles representam ~17% dos dias mas causam ~40% do erro total.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <Info className="w-3 h-3 inline mr-1" />
                  Este modelo prevê receita para <strong>dias normais de operação</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Model Tier */}
          <div className="mb-4 p-3 bg-slate-50 dark:bg-space-dust/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Complexidade do Modelo
              </span>
              <span className={`text-sm font-semibold ${tierInfo.color}`}>
                {tierInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tierInfo.description}
            </p>
          </div>

          {/* Training Metrics (In-Sample) */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Métricas de Treino (In-Sample)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Ajuste do modelo aos dados de treino — pode superestimar a precisão real.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={QualityIcon}
                label="R² (Treino)"
                value={`${rSquaredPct}%`}
                subtext={quality.label}
                colorClass={quality.color}
              />
              <MetricCard
                icon={BarChart3}
                label="MAE (Treino)"
                value={`R$ ${modelInfo?.mae || 0}`}
                subtext="in-sample"
                colorClass="text-slate-600 dark:text-slate-400"
              />
              <MetricCard
                icon={Database}
                label="Dados de Treino"
                value={`${modelInfo?.n_training_samples || 0} dias`}
                colorClass="text-slate-600 dark:text-slate-400"
              />
              <MetricCard
                icon={Calendar}
                label="Último Treino"
                value={modelInfo?.last_trained ?
                  new Date(modelInfo.last_trained).toLocaleDateString('pt-BR') :
                  '—'
                }
                colorClass="text-slate-600 dark:text-slate-400"
              />
            </div>
          </div>

          {/* Data Quality */}
          {dataQuality && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Qualidade dos Dados
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-slate-50 dark:bg-space-dust/50 rounded text-center">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {dataQuality.usableDays || 0}
                  </div>
                  <div className="text-slate-500">dias úteis</div>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-space-dust/50 rounded text-center">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {dataQuality.missingWeather || 0}
                  </div>
                  <div className="text-slate-500">sem clima</div>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-space-dust/50 rounded text-center">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {dataQuality.outlierCount || 0}
                  </div>
                  <div className="text-slate-500">outliers</div>
                </div>
              </div>
              {dataQuality.holidaysInRange > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {dataQuality.holidaysInRange} feriado(s) no período de treino
                </p>
              )}
            </div>
          )}

          {/* Coefficients Table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Coeficientes do Modelo
            </h3>
            <div className="border border-slate-200 dark:border-stellar-cyan/10 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-space-dust">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Feature
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Coeficiente
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {featureNames.map((name, idx) => (
                    <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {FEATURE_TRANSLATIONS[name] || name}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-900 dark:text-white">
                        {formatCoefficient(coefficients[idx], idx)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Os coeficientes indicam quanto cada fator contribui para a previsão de receita.
            </p>
          </div>

          {/* Interpretation Guide */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
              Como interpretar
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• <strong>MAE Real</strong>: Erro médio em previsões reais — métrica mais confiável</li>
              <li>• <strong>MAPE</strong>: Erro percentual médio — útil para comparar entre períodos</li>
              <li>• <strong>R² (Treino)</strong>: Quanto o modelo se ajusta aos dados — pode superestimar</li>
              {modelInfo?.oos_mae && modelInfo?.mae && (
                <li>• O MAE real (R${modelInfo.oos_mae}) é tipicamente maior que o MAE de treino (R${modelInfo.mae})</li>
              )}
              <li>• Coeficientes positivos indicam aumento na receita esperada</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelDiagnostics;
