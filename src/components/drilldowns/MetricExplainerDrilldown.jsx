import React from 'react';
import { Info, Calculator, Target } from 'lucide-react';

const MetricExplainerDrilldown = ({ metricType }) => {
    const getContent = () => {
        switch (metricType) {
            case 'health':
                return {
                    title: 'Taxa de Saúde',
                    formula: 'Clientes Ativos / Total de Clientes',
                    explanation: 'Representa a porcentagem da sua base de clientes que retornou nos últimos 90 dias.',
                    benchmarks: [
                        { label: 'Excelente', value: '> 40%', color: 'text-emerald-600 bg-emerald-50' },
                        { label: 'Bom', value: '25% - 40%', color: 'text-blue-600 bg-blue-50' },
                        { label: 'Atenção', value: '< 25%', color: 'text-amber-600 bg-amber-50' }
                    ],
                    tip: 'Para aumentar esta taxa, foque em campanhas de reativação para clientes "Em Risco".'
                };
            case 'projection':
                return {
                    title: 'Projeção de Receita',
                    formula: '(Receita Atual / Dias Decorridos) × 7',
                    explanation: 'Uma estimativa de como fechará a semana baseada no desempenho médio diário até agora.',
                    benchmarks: [],
                    tip: 'Esta projeção torna-se mais precisa à medida que a semana avança. Nos primeiros dias (seg/ter), pode haver maior variação.'
                };
            case 'utilization':
                return {
                    title: 'Utilização Geral',
                    formula: 'Horas em Uso / (Máquinas × Horas de Funcionamento)',
                    explanation: 'Mede a eficiência do uso do seu equipamento. Baseado em um dia de funcionamento padrão.',
                    benchmarks: [
                        { label: 'Excelente', value: '> 25%', color: 'text-emerald-600 bg-emerald-50' },
                        { label: 'Bom', value: '15% - 25%', color: 'text-blue-600 bg-blue-50' },
                        { label: 'Razoável', value: '10% - 15%', color: 'text-amber-600 bg-amber-50' },
                        { label: 'Baixo', value: '< 10%', color: 'text-red-600 bg-red-50' }
                    ],
                    tip: 'Utilização muito alta (>80%) pode indicar necessidade de mais máquinas ou perda de clientes por filas.'
                };
            default:
                return {
                    title: 'Sobre esta Métrica',
                    formula: '',
                    explanation: 'Informações detalhadas sobre este indicador.',
                    benchmarks: [],
                    tip: ''
                };
        }
    };

    const content = getContent();

    return (
        <div className="space-y-6">
            {/* Formula Card */}
            <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">Como é calculado?</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-600 text-center font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                    {content.formula}
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {content.explanation}
                </p>
            </div>

            {/* Benchmarks */}
            {content.benchmarks.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">Benchmarks</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {content.benchmarks.map((bench, idx) => (
                            <div key={idx} className={`p-3 rounded-lg text-center ${bench.color} dark:bg-opacity-10`}>
                                <div className="text-lg font-bold">{bench.value}</div>
                                <div className="text-xs font-medium opacity-80">{bench.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tip */}
            <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-bold">Dica:</span> {content.tip}
                </p>
            </div>
        </div>
    );
};

export default MetricExplainerDrilldown;
