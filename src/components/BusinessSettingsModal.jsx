// BusinessSettingsModal.jsx v1.0.0
// Modal for configuring business parameters (costs, pricing, etc.)
// Uses Tailwind CSS for modern styling
// Local storage persistence for settings

import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Wrench, TrendingUp, Settings } from 'lucide-react';

const DEFAULT_SETTINGS = {
  // Pricing
  servicePrice: 17.90,
  cashbackPercent: 7.5,
  cashbackStartDate: '2024-06-01',
  
  // Fixed Costs (monthly)
  rentCost: 2000,
  electricityCost: 500,
  waterCost: 200,
  internetCost: 100,
  otherFixedCosts: 200,
  
  // Maintenance
  maintenanceIntervalDays: 45,
  maintenanceDowntimeHours: 6,
  maintenanceCostPerSession: 300,
  
  // Targets
  targetUtilization: 25,
  targetMonthlyRevenue: 8500,
};

const STORAGE_KEY = 'lavpop_business_settings';

const BusinessSettingsModal = ({ isOpen, onClose, onSave }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (onSave) onSave(settings);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    if (confirm('Resetar todas as configurações para os valores padrão?')) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
    }
  };

  const totalFixedCosts = 
    settings.rentCost + 
    settings.electricityCost + 
    settings.waterCost + 
    settings.internetCost + 
    settings.otherFixedCosts;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-lavpop-primary/10 rounded-lg">
                <Settings className="w-6 h-6 text-lavpop-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Configurações do Negócio
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configure parâmetros que afetam análises e recomendações
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Pricing Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lavpop-primary">
                <DollarSign className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Preços e Cashback</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço por Serviço
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.10"
                      value={settings.servicePrice}
                      onChange={(e) => handleChange('servicePrice', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cashback (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={settings.cashbackPercent}
                      onChange={(e) => handleChange('cashbackPercent', parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início do Cashback
                  </label>
                  <input
                    type="date"
                    value={settings.cashbackStartDate}
                    onChange={(e) => handleChange('cashbackStartDate', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Fixed Costs Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lavpop-primary">
                <DollarSign className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Custos Fixos Mensais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aluguel
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={settings.rentCost}
                      onChange={(e) => handleChange('rentCost', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Energia Elétrica
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={settings.electricityCost}
                      onChange={(e) => handleChange('electricityCost', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Água
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={settings.waterCost}
                      onChange={(e) => handleChange('waterCost', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internet
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={settings.internetCost}
                      onChange={(e) => handleChange('internetCost', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outros Custos Fixos
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={settings.otherFixedCosts}
                      onChange={(e) => handleChange('otherFixedCosts', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 p-4 bg-lavpop-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lavpop-primary">
                      Total de Custos Fixos Mensais:
                    </span>
                    <span className="text-2xl font-bold text-lavpop-primary">
                      R$ {totalFixedCosts.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lavpop-primary">
                <Wrench className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Manutenção</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo (dias)
                  </label>
                  <input
                    type="number"
                    value={settings.maintenanceIntervalDays}
                    onChange={(e) => handleChange('maintenanceIntervalDays', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo (horas)
                  </label>
                  <input
                    type="number"
                    value={settings.maintenanceDowntimeHours}
                    onChange={(e) => handleChange('maintenanceDowntimeHours', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custo por Sessão
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={settings.maintenanceCostPerSession}
                      onChange={(e) => handleChange('maintenanceCostPerSession', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Targets Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lavpop-primary">
                <TrendingUp className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Metas</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utilização Alvo (%)
                  </label>
                  <input
                    type="number"
                    value={settings.targetUtilization}
                    onChange={(e) => handleChange('targetUtilization', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receita Mensal Alvo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={settings.targetMonthlyRevenue}
                      onChange={(e) => handleChange('targetMonthlyRevenue', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavpop-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Resetar Padrões
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-lavpop-primary rounded-lg hover:bg-lavpop-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to load settings
export const useBusinessSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  return settings;
};

export default BusinessSettingsModal;
