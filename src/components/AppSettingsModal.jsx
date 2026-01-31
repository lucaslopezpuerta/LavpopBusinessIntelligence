/**
 * AppSettingsModal - App-wide settings modal
 *
 * VERSION: 3.0
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
 *
 * CHANGELOG:
 * v3.0 (2026-01-31): BaseModal migration
 *   - Migrated to BaseModal component for consistent UX
 *   - Removed duplicate boilerplate (portal, animations, swipe, scroll lock)
 *   - Uses showHeader={false} for custom settings header
 *   - Uses footer prop for action buttons
 *   - Reduced from ~750 lines to ~520 lines
 * v2.8 (2026-01-31): Enhanced drag handle
 * v2.7 (2026-01-31): Enhanced modal transitions
 * v2.6 (2026-01-30): Swipe-to-close gestures
 * v2.5 (2026-01-28): Mobile full-screen fix
 * v2.4 (2026-01-27): Animation standardization
 * v2.3 (2026-01-18): Full-screen mobile + Portal rendering
 * v2.2 (2026-01-18): CosmicDatePicker integration
 * v2.1 (2026-01-18): Light mode refinements
 * v2.0 (2026-01-18): Cosmic Precision redesign
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, DollarSign, Wrench, Settings, Palette, Sun, Moon, Monitor, AlertCircle, LayoutGrid, Rows3, Bot, Globe, Zap } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import CosmicDatePicker from './ui/CosmicDatePicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { haptics } from '../utils/haptics';
import BaseModal from './ui/BaseModal';

const AppSettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings, isSaving, error } = useAppSettings();
  const { theme, setTheme, isDark } = useTheme();
  const isMobile = useIsMobile();

  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Sync local state when settings change (e.g., after reload)
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

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

  // Footer with action buttons
  const footer = (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handleClose}
        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-space-dust border border-slate-300 dark:border-stellar-cyan/15 rounded-lg hover:bg-slate-50 dark:hover:bg-space-nebula transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-space-dust"
      >
        Cancelar
      </button>
      <button
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-stellar rounded-lg hover:shadow-lg hover:shadow-stellar-cyan/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2 dark:focus-visible:ring-offset-space-dust"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        size="full"
        maxWidth="2xl"
        showHeader={false}
        footer={footer}
        closeOnBackdrop={!hasChanges}
        contentClassName="p-0"
      >
        {/* Custom Header */}
        <div className={`bg-white dark:bg-space-dust/95 border-b border-slate-200 dark:border-stellar-cyan/10 flex-shrink-0`}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-stellar-cyan/10 dark:bg-stellar-cyan/20 rounded-lg">
                <Settings className="w-5 h-5 text-stellar-cyan" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Configurações
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-space-nebula rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2 dark:focus-visible:ring-offset-space-dust"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Error Banner - Compact */}
        {error && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Tabs - shadcn with cosmic styling */}
        <Tabs defaultValue="business" className="flex flex-col flex-1 min-h-0">
          <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b border-slate-200 dark:border-stellar-cyan/10 bg-transparent h-auto p-0 px-4 sm:px-5">
            <TabsTrigger
              value="business"
              onClick={() => haptics.tick()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-stellar-cyan data-[state=active]:text-stellar-cyan data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <DollarSign className="w-4 h-4" />
              Negócio
            </TabsTrigger>
            <TabsTrigger
              value="automation"
              onClick={() => haptics.tick()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-stellar-cyan data-[state=active]:text-stellar-cyan data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Bot className="w-4 h-4" />
              Automação
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              onClick={() => haptics.tick()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-stellar-cyan data-[state=active]:text-stellar-cyan data-[state=active]:bg-transparent data-[state=active]:shadow-none text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Palette className="w-4 h-4" />
              Aparência
            </TabsTrigger>
          </TabsList>

          {/* Content - Scrollable */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 overflow-y-auto flex-1 min-h-0">
            <TabsContent value="business" className="mt-0 space-y-4">
              <BusinessTab
                settings={localSettings}
                onChange={handleChange}
                onNumberChange={handleNumberChange}
                totalFixedCosts={totalFixedCosts}
              />
            </TabsContent>
            <TabsContent value="automation" className="mt-0 space-y-4">
              <AutomationTab
                settings={localSettings}
                onChange={handleChange}
              />
            </TabsContent>
            <TabsContent value="appearance" className="mt-0 space-y-4">
              <AppearanceTab theme={theme} setTheme={setTheme} />
            </TabsContent>
          </div>
        </Tabs>
      </BaseModal>

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
    </>
  );
};

// ==================== TAB COMPONENTS ====================

const BusinessTab = ({ settings, onChange, onNumberChange, totalFixedCosts }) => {
  return (
    <div className="space-y-4">
      {/* Pricing Section */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-stellar-cyan">
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
            <CosmicDatePicker
              value={settings.cashbackStartDate}
              onChange={(date) => onChange('cashbackStartDate', date)}
              placeholder="Selecione a data"
              rightAlign
            />
          </div>
        </div>
      </section>

      {/* Fixed Costs Section */}
      <section className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-2 text-stellar-cyan">
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <h3 className="text-sm font-semibold">Custos Fixos</h3>
          </div>
          <span className="text-xs sm:text-sm font-bold text-stellar-cyan">
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
        <div className="flex items-center gap-2 text-stellar-cyan">
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
        <div className="flex items-center gap-2 text-stellar-cyan">
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
                      ? 'border-stellar-cyan bg-stellar-cyan/5 dark:bg-stellar-cyan/10'
                      : 'border-slate-200 dark:border-stellar-cyan/10 hover:border-slate-300 dark:hover:border-stellar-cyan/20'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-stellar-cyan' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-stellar-cyan' : 'text-slate-700 dark:text-slate-300'}`}>
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

        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-lg">
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

  return (
    <div className="space-y-6">
      {/* Theme Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-stellar-cyan">
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
                    ? 'border-stellar-cyan bg-stellar-cyan/5 dark:bg-stellar-cyan/10'
                    : 'border-slate-200 dark:border-stellar-cyan/10 hover:border-slate-300 dark:hover:border-stellar-cyan/20'
                  }
                `}
              >
                <Icon className={`w-5 h-5 sm:w-4 sm:h-4 ${isActive ? 'text-stellar-cyan' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-stellar-cyan' : 'text-slate-700 dark:text-slate-300'}`}>
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
          <div className="flex items-center gap-2 text-stellar-cyan">
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
                      ? 'border-stellar-cyan bg-stellar-cyan/5 dark:bg-stellar-cyan/10'
                      : 'border-slate-200 dark:border-stellar-cyan/10 hover:border-slate-300 dark:hover:border-stellar-cyan/20'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-stellar-cyan' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-stellar-cyan' : 'text-slate-700 dark:text-slate-300'}`}>
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
            w-full py-2 text-sm bg-slate-50 dark:bg-space-dust border border-slate-300 dark:border-stellar-cyan/10 rounded-lg
            focus:outline-none focus:border-stellar-cyan focus:ring-2 focus:ring-stellar-cyan/20 dark:focus:ring-stellar-cyan/30
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
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-space-dust rounded-xl shadow-xl border border-slate-200 dark:border-stellar-cyan/15 max-w-sm w-full p-5 animate-scale-in">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-space-nebula rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${confirmVariant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gradient-stellar text-white hover:shadow-lg hover:shadow-stellar-cyan/25'
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
