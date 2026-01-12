/**
 * AppSettingsModal - App-wide settings modal
 *
 * VERSION: 1.9
 *
 * Replaces BusinessSettingsModal with improved UX:
 * - Dark mode support
 * - Tabbed navigation (Negócio, Automação, Aparência)
 * - Dashboard layout toggle (Compact/Expanded)
 * - POS automation proxy toggle
 * - Escape key to close
 * - Input validation (min/max)
 * - Live total calculation
 * - Styled confirmation dialogs
 * - iOS-compatible scroll lock (v1.9 - refactored to useScrollLock hook)
 * - Safe area bottom padding for notch devices (v1.8)
 *
 * CHANGELOG:
 * v1.9 (2026-01-12): Refactored to useScrollLock hook
 *   - Replaced inline scroll lock useEffect with shared useScrollLock hook
 *   - Reduces code duplication across modals
 * v1.8 (2026-01-12): Safe area compliance
 *   - Added pb-safe to footer for iPhone home indicator
 * v1.7 (2026-01-12): iOS-compatible scroll lock
 *   - Upgraded scroll lock to fixed position method for iOS Safari
 *   - Preserves scroll position when modal closes
 * v1.6 (2026-01-07): Glass morphism enhancement
 *   - Added backdrop-blur and semi-transparent background to modal
 *   - Glass effect on footer for premium floating feel
 *   - Focus ring standardization on buttons
 * v1.5 (2025-12-25): Added Automação tab
 *   - New "Automação" tab for POS sync settings
 *   - Proxy toggle for CAPTCHA solving (Com Proxy / Sem Proxy)
 *   - Setting persisted to Supabase app_settings.pos_use_proxy
 * v1.4 (2025-12-23): Added Dashboard Layout toggle
 *   - New "Layout do Dashboard" section in Appearance tab
 *   - Compact (single-glance) and Expanded (vertical) options
 *   - Persisted via ThemeContext (localStorage)
 * v1.3 (2025-12-16): Mobile layout refinements
 *   - Responsive grids: 2-col on mobile, 3-col on sm+
 *   - Shortened labels for mobile (e.g., "Início Cashback", "Custo/Sessão")
 *   - Reduced mobile padding (px-4 vs px-5, px-2 vs px-3 on inputs)
 *   - Fixed text overflow with truncate on all labels
 *   - Better modal height management (95vh mobile, 90vh desktop)
 *   - Flex column layout with scrollable content area
 *   - Theme buttons: stacked vertical on mobile, horizontal on sm+
 *   - Responsive NumberInput prefix/suffix positioning
 * v1.2 (2025-12-16): Simplified footer
 *   - Removed "Reset to Defaults" button (not useful for single-user app)
 *   - Footer now right-aligned with Cancel/Save only
 * v1.1 (2025-12-16): Compact layout per Design System v3.2
 *   - Reduced padding and spacing (p-4, space-y-3)
 *   - Smaller modal width (max-w-2xl)
 *   - Compact inputs without descriptions
 *   - Inline total costs display
 * v1.0 (2025-12-16): Initial implementation
 *   - Migrated from BusinessSettingsModal
 *   - Added dark mode support
 *   - Added tabbed layout
 *   - Added input validation
 *   - Uses AppSettingsContext for Supabase persistence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, DollarSign, Wrench, Settings, Palette, Sun, Moon, Monitor, AlertCircle, LayoutGrid, Rows3, Bot, Globe, Zap } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useScrollLock } from '../hooks/useScrollLock';

// Tab configuration
const TABS = [
  { id: 'business', label: 'Negócio', icon: DollarSign },
  { id: 'automation', label: 'Automação', icon: Bot },
  { id: 'appearance', label: 'Aparência', icon: Palette },
];

const AppSettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings, isSaving, error } = useAppSettings();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('business');
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Sync local state when settings change (e.g., after reload)
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasChanges]);

  // iOS-compatible scroll lock - prevents body scroll while modal is open
  useScrollLock(isOpen);

  const handleChange = useCallback((field, value) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const handleNumberChange = useCallback((field, value, min = 0, max = Infinity) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    const clamped = Math.max(min, Math.min(max, parsed));
    handleChange(field, clamped);
  }, [handleChange]);

  const handleSave = async () => {
    await updateSettings(localSettings);
    setHasChanges(false);
    onClose();
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleDiscardAndClose = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    setShowDiscardConfirm(false);
    onClose();
  };

  // Calculate total fixed costs
  const totalFixedCosts =
    (localSettings.rentCost || 0) +
    (localSettings.electricityCost || 0) +
    (localSettings.waterCost || 0) +
    (localSettings.internetCost || 0) +
    (localSettings.otherFixedCosts || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div
          className="relative w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl animate-scale-in max-h-[95vh] sm:max-h-[90vh] flex flex-col border border-white/20 dark:border-slate-700/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Compact */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-lavpop-blue/10 dark:bg-lavpop-blue/20 rounded-lg">
                <Settings className="w-5 h-5 text-lavpop-blue" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Configurações
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Tab Navigation - Compact */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 px-4 sm:px-5 flex-shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors
                    ${isActive
                      ? 'border-lavpop-blue text-lavpop-blue'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Error Banner - Compact */}
          {error && (
            <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Content - Scrollable */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            {activeTab === 'business' && (
              <BusinessTab
                settings={localSettings}
                onChange={handleChange}
                onNumberChange={handleNumberChange}
                totalFixedCosts={totalFixedCosts}
              />
            )}
            {activeTab === 'automation' && (
              <AutomationTab
                settings={localSettings}
                onChange={handleChange}
              />
            )}
            {activeTab === 'appearance' && (
              <AppearanceTab theme={theme} setTheme={setTheme} />
            )}
          </div>

          {/* Footer - Compact with glass morphism + safe area */}
          <div className="flex items-center justify-end gap-2 px-4 sm:px-5 py-3 pb-safe border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm rounded-b-2xl flex-shrink-0">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-lavpop-blue rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      {/* Discard Changes Confirmation Dialog */}
      {showDiscardConfirm && (
        <ConfirmDialog
          title="Descartar Alterações"
          message="Você tem alterações não salvas. Deseja descartar?"
          confirmLabel="Descartar"
          confirmVariant="danger"
          onConfirm={handleDiscardAndClose}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}
    </div>
  );
};

// ==================== TAB COMPONENTS ====================

const BusinessTab = ({ settings, onChange, onNumberChange, totalFixedCosts }) => {
  return (
    <div className="space-y-4">
      {/* Pricing Section */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-lavpop-blue">
          <DollarSign className="w-4 h-4 flex-shrink-0" />
          <h3 className="text-sm font-semibold">Preços e Cashback</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <NumberInput
            label="Preço/Serviço"
            value={settings.servicePrice}
            onChange={(v) => onNumberChange('servicePrice', v, 0)}
            prefix="R$"
            step={0.1}
          />
          <NumberInput
            label="Cashback"
            value={settings.cashbackPercent}
            onChange={(v) => onNumberChange('cashbackPercent', v, 0, 100)}
            suffix="%"
            step={0.5}
          />
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 truncate">
              Início Cashback
            </label>
            <input
              type="date"
              value={settings.cashbackStartDate}
              onChange={(e) => onChange('cashbackStartDate', e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* Fixed Costs Section */}
      <section className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-2 text-lavpop-blue">
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <h3 className="text-sm font-semibold">Custos Fixos</h3>
          </div>
          <span className="text-xs sm:text-sm font-bold text-lavpop-blue">
            Total: R$ {totalFixedCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <NumberInput
            label="Aluguel"
            value={settings.rentCost}
            onChange={(v) => onNumberChange('rentCost', v, 0)}
            prefix="R$"
          />
          <NumberInput
            label="Energia"
            value={settings.electricityCost}
            onChange={(v) => onNumberChange('electricityCost', v, 0)}
            prefix="R$"
          />
          <NumberInput
            label="Água"
            value={settings.waterCost}
            onChange={(v) => onNumberChange('waterCost', v, 0)}
            prefix="R$"
          />
          <NumberInput
            label="Internet"
            value={settings.internetCost}
            onChange={(v) => onNumberChange('internetCost', v, 0)}
            prefix="R$"
          />
          <div className="col-span-2 sm:col-span-2">
            <NumberInput
              label="Outros Custos"
              value={settings.otherFixedCosts}
              onChange={(v) => onNumberChange('otherFixedCosts', v, 0)}
              prefix="R$"
            />
          </div>
        </div>
      </section>

      {/* Maintenance Section */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-lavpop-blue">
          <Wrench className="w-4 h-4 flex-shrink-0" />
          <h3 className="text-sm font-semibold">Manutenção</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <NumberInput
            label="Intervalo"
            value={settings.maintenanceIntervalDays}
            onChange={(v) => onNumberChange('maintenanceIntervalDays', v, 1)}
            suffix="dias"
            step={1}
          />
          <NumberInput
            label="Parada"
            value={settings.maintenanceDowntimeHours}
            onChange={(v) => onNumberChange('maintenanceDowntimeHours', v, 0)}
            suffix="horas"
            step={1}
          />
          <div className="col-span-2 sm:col-span-1">
            <NumberInput
              label="Custo/Sessão"
              value={settings.maintenanceCostPerSession}
              onChange={(v) => onNumberChange('maintenanceCostPerSession', v, 0)}
              prefix="R$"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const AutomationTab = ({ settings, onChange }) => {
  const proxyOptions = [
    {
      value: true,
      label: 'Com Proxy',
      icon: Globe,
      desc: 'Usa proxy residencial brasileiro',
      detail: 'Mais confiável, evita bloqueios geográficos'
    },
    {
      value: false,
      label: 'Sem Proxy',
      icon: Zap,
      desc: 'Conexão direta (ProxyLess)',
      detail: 'Mais rápido, pode falhar se IP for bloqueado'
    },
  ];

  return (
    <div className="space-y-6">
      {/* CAPTCHA Solver Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-lavpop-blue">
          <Bot className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Sincronização POS</h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configurações para a automação de sincronização de dados do POS (vendas e clientes).
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Modo de Resolução CAPTCHA
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {proxyOptions.map((option) => {
              const Icon = option.icon;
              const isActive = settings.posUseProxy === option.value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => onChange('posUseProxy', option.value)}
                  className={`
                    flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all text-left
                    ${isActive
                      ? 'border-lavpop-blue bg-lavpop-blue/5 dark:bg-lavpop-blue/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-lavpop-blue' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-lavpop-blue' : 'text-slate-700 dark:text-slate-300'}`}>
                      {option.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {option.desc}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                    {option.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Nota:</strong> O modo com proxy usa um IP residencial brasileiro para resolver o CAPTCHA,
            evitando rejeições por geolocalização. O modo sem proxy é mais rápido mas pode falhar se
            o sistema detectar que o IP não é do Brasil.
          </p>
        </div>
      </section>
    </div>
  );
};

const AppearanceTab = ({ theme, setTheme }) => {
  const { dashboardLayout, setDashboardLayout } = useTheme();
  const isMobile = useIsMobile();

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

  const layoutOptions = [
    { value: 'compact', label: 'Compacto', icon: LayoutGrid, desc: 'Visão única, sem rolagem' },
    { value: 'expanded', label: 'Expandido', icon: Rows3, desc: 'Layout vertical completo' },
  ];

  // Note: Theme and layout are stored in localStorage via ThemeContext (not Supabase)
  // This is intentional - UI preferences need instant toggling without network latency

  return (
    <div className="space-y-6">
      {/* Theme Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-lavpop-blue">
          <Palette className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Tema</h3>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value ||
              (option.value === 'system' && !['light', 'dark'].includes(theme));
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`
                  flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl border-2 transition-all
                  ${isActive
                    ? 'border-lavpop-blue bg-lavpop-blue/5 dark:bg-lavpop-blue/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }
                `}
              >
                <Icon className={`w-5 h-5 sm:w-4 sm:h-4 ${isActive ? 'text-lavpop-blue' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-lavpop-blue' : 'text-slate-700 dark:text-slate-300'}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          O tema também pode ser alterado pelo botão na barra superior.
        </p>
      </section>

      {/* Dashboard Layout Section - Hidden on mobile (compact mode is desktop-only) */}
      {!isMobile && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-lavpop-blue">
            <LayoutGrid className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Layout do Dashboard</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {layoutOptions.map((option) => {
              const Icon = option.icon;
              const isActive = dashboardLayout === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setDashboardLayout(option.value)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all
                    ${isActive
                      ? 'border-lavpop-blue bg-lavpop-blue/5 dark:bg-lavpop-blue/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-lavpop-blue' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-lavpop-blue' : 'text-slate-700 dark:text-slate-300'}`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {option.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

// ==================== SHARED COMPONENTS ====================

const NumberInput = ({ label, value, onChange, prefix, suffix, step = 1, min = 0 }) => {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 truncate">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg
            focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
            text-slate-900 dark:text-white
            ${prefix ? 'pl-7 sm:pl-9 pr-2 sm:pr-3' : suffix ? 'pl-2 sm:pl-3 pr-10 sm:pr-12' : 'px-2 sm:px-3'}
          `}
        />
        {suffix && (
          <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

const ConfirmDialog = ({ title, message, confirmLabel, confirmVariant = 'primary', onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-5 animate-scale-in">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${confirmVariant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-lavpop-blue text-white hover:bg-blue-600'
              }
            `}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppSettingsModal;
