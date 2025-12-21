// ModelDiagnostics.jsx v1.0
// Modal component showing detailed model diagnostics
//
// v1.0 (2025-12-21): Initial implementation
//   - Coefficient table with translated feature names
//   - Performance metrics (R², MAE, RMSE)
//   - Data quality information
//   - Model tier and training info

import React from 'react';
import {
  X,
  FlaskConical,
  TrendingUp,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Calendar,
  Database
} from 'lucide-react';

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
  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${colorClass}`} />
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </div>
    <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    {subtext && (
      <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{subtext}</div>
    )}
  </div>
);

/**
 * ModelDiagnostics Modal Component
 */
const ModelDiagnostics = ({ isOpen, onClose, modelInfo, dataQuality }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Diagnóstico do Modelo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Model Tier */}
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
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

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard
              icon={QualityIcon}
              label="Precisão (R²)"
              value={`${rSquaredPct}%`}
              subtext={quality.label}
              colorClass={quality.color}
            />
            <MetricCard
              icon={BarChart3}
              label="Erro Médio (MAE)"
              value={`R$ ${modelInfo?.mae || 0}`}
              subtext="por dia"
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

          {/* Data Quality */}
          {dataQuality && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Qualidade dos Dados
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-center">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {dataQuality.usableDays || 0}
                  </div>
                  <div className="text-slate-500">dias úteis</div>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-center">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {dataQuality.missingWeather || 0}
                  </div>
                  <div className="text-slate-500">sem clima</div>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-center">
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
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
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
              <li>• <strong>R² = {rSquaredPct}%</strong>: O modelo explica {rSquaredPct}% da variação na receita</li>
              <li>• <strong>MAE = R${modelInfo?.mae || 0}</strong>: Em média, as previsões erram ±R${modelInfo?.mae || 0} por dia</li>
              <li>• Coeficientes positivos indicam aumento na receita esperada</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelDiagnostics;
