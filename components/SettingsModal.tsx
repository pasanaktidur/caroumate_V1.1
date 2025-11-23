
import * as React from 'react';
import type { AppSettings, BrandKit } from '../types';
import { AIModel, FontChoice } from '../types';
import type { TFunction } from '../App';
import { defaultSettings } from '../lib/constants';
import { PaletteIcon, SettingsIcon, UploadIcon, SparklesIcon, TrashIcon } from './icons';
import { FontSelector, ColorInput, PositionSelector } from './ui';

type SettingsTab = 'general' | 'brandkit';

export const SettingsModal: React.FC<{
    currentSettings: AppSettings;
    onClose: () => void;
    onSave: (settings: AppSettings) => void;
    t: TFunction;
    onShowTutorial: () => void;
}> = ({ currentSettings, onClose, onSave, t, onShowTutorial }) => {
    const [settings, setSettings] = React.useState(currentSettings);
    const [activeTab, setActiveTab] = React.useState<SettingsTab>('general');
    const [saved, setSaved] = React.useState(false);

    const handleSave = () => {
        onSave(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };
    
    const handleBrandKitChange = (field: keyof BrandKit, value: any) => {
        setSettings(prev => ({
            ...prev,
            brandKit: { ...(prev.brandKit || defaultSettings.brandKit!), [field]: value }
        }));
    };

    const handleBrandKitColorChange = (field: keyof BrandKit['colors'], value: string) => {
        setSettings(prev => ({
            ...prev,
            brandKit: {
                ...(prev.brandKit || defaultSettings.brandKit!),
                colors: { ...(prev.brandKit?.colors || defaultSettings.brandKit!.colors), [field]: value }
            }
        }));
    };

    const handleBrandKitFontChange = (field: keyof BrandKit['fonts'], value: FontChoice) => {
        setSettings(prev => ({
            ...prev,
            brandKit: {
                ...(prev.brandKit || defaultSettings.brandKit!),
                fonts: { ...(prev.brandKit?.fonts || defaultSettings.brandKit!.fonts), [field]: value }
            }
        }));
    };
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleBrandKitChange('logo', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBrandingStyleChange = (updates: Partial<BrandKit['brandingStyle']>) => {
        setSettings(prev => ({
            ...prev,
            brandKit: { 
                ...(prev.brandKit || defaultSettings.brandKit!), 
                brandingStyle: {
                    ...(prev.brandKit?.brandingStyle || defaultSettings.brandKit!.brandingStyle!),
                    ...updates
                }
            }
        }));
    };

    const getModelDisplayName = (model: string) => {
        switch (model) {
            case AIModel.GEMINI_2_5_FLASH:
                return 'Gemini 2.5 Flash (Fast & Efficient)';
            case AIModel.GEMINI_3_PRO:
                return 'Gemini 3.0 Pro (Best Quality)';
            default:
                return model;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800 transform transition-all">
                
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('settingsTitle')}</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 py-4 flex space-x-2 bg-gray-50/50 dark:bg-gray-900/50">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'general'
                                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        <SettingsIcon className="w-4 h-4" />
                        <span>General & AI</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('brandkit')}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'brandkit'
                                ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        <PaletteIcon className="w-4 h-4" />
                        <span>{t('brandKitTitle')}</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar bg-white dark:bg-gray-900">
                    
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* AI Model Section */}
                            <div className="space-y-3">
                                <label htmlFor="aiModel" className="block text-sm font-bold text-gray-900 dark:text-white">
                                    {t('aiModelLabel')}
                                </label>
                                <div className="relative">
                                    <select
                                        id="aiModel"
                                        value={settings.aiModel}
                                        onChange={e => setSettings({ ...settings, aiModel: e.target.value as AIModel })}
                                        className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-shadow appearance-none cursor-pointer"
                                    >
                                        {Object.values(AIModel).map(m => <option key={m} value={m}>{getModelDisplayName(m)}</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 px-1">{t('aiModelHint')}</p>
                            </div>

                            <hr className="border-gray-100 dark:border-gray-800" />

                            {/* API Key Section */}
                            <div className="space-y-3">
                                <label htmlFor="apiKey" className="block text-sm font-bold text-gray-900 dark:text-white">
                                    {t('apiKeyLabel')}
                                </label>
                                <input
                                    type="password"
                                    id="apiKey"
                                    value={settings.apiKey}
                                    onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
                                    placeholder={t('apiKeyPlaceholder')}
                                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-shadow font-mono text-sm"
                                />
                                <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                                    <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                        {t('apiKeyHint')} <span onClick={onShowTutorial} className="cursor-pointer font-bold hover:underline">{t('apiKeyHintGuide')}</span>
                                    </p>
                                </div>
                            </div>

                            <hr className="border-gray-100 dark:border-gray-800" />

                            {/* System Prompt Section */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="systemPrompt" className="block text-sm font-bold text-gray-900 dark:text-white">{t('systemPromptLabel')}</label>
                                    <button 
                                        onClick={() => setSettings({...settings, systemPrompt: defaultSettings.systemPrompt})} 
                                        className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        {t('setDefaultButton')}
                                    </button>
                                </div>
                                <textarea
                                    id="systemPrompt"
                                    value={settings.systemPrompt}
                                    onChange={e => setSettings({ ...settings, systemPrompt: e.target.value })}
                                    placeholder={t('systemPromptPlaceholder')}
                                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'brandkit' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('brandKitTitle')}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('brandKitSubtitle')}</p>
                            </div>

                            {/* Colors */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">Brand Colors</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <ColorInput id="primaryColor" label={t('brandKitPrimaryColor')} value={settings.brandKit?.colors.primary ?? '#FFFFFF'} onChange={v => handleBrandKitColorChange('primary', v)} />
                                    <ColorInput id="secondaryColor" label={t('brandKitSecondaryColor')} value={settings.brandKit?.colors.secondary ?? '#00C2CB'} onChange={v => handleBrandKitColorChange('secondary', v)} />
                                    <ColorInput id="textColor" label={t('brandKitTextColor')} value={settings.brandKit?.colors.text ?? '#111827'} onChange={v => handleBrandKitColorChange('text', v)} />
                                </div>
                            </div>

                            {/* Typography */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">Typography</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="headlineFont" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">{t('brandKitHeadlineFont')}</label>
                                        <FontSelector
                                            id="headlineFont"
                                            value={settings.brandKit?.fonts.headline ?? FontChoice.POPPINS}
                                            onChange={font => handleBrandKitFontChange('headline', font)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="bodyFont" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">{t('brandKitBodyFont')}</label>
                                        <FontSelector
                                            id="bodyFont"
                                            value={settings.brandKit?.fonts.body ?? FontChoice.SANS}
                                            onChange={font => handleBrandKitFontChange('body', font)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Logo */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">{t('brandKitLogo')}</h4>
                                <div className="flex items-center gap-4">
                                    <div className="relative group w-20 h-20 flex-shrink-0 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                                        {settings.brandKit?.logo ? (
                                            <img src={settings.brandKit.logo} alt="Brand Logo" className="w-full h-full object-contain p-2"/>
                                        ) : (
                                            <PaletteIcon className="w-8 h-8 text-gray-300 dark:text-gray-500"/>
                                        )}
                                        {settings.brandKit?.logo && (
                                            <button 
                                                onClick={() => handleBrandKitChange('logo', '')}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <TrashIcon className="w-5 h-5 text-white" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} id="logo-upload" className="hidden"/>
                                        <button 
                                            type="button" 
                                            onClick={() => document.getElementById('logo-upload')?.click()} 
                                            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <UploadIcon className="w-4 h-4 mr-2" />
                                            {t('brandKitUploadLogo')}
                                        </button>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Recommended: PNG with transparent background.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Watermark */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">{t('brandKitBrandingText')}</h4>
                                <div className="space-y-5">
                                    <input 
                                        id="brandKitBrandingText" 
                                        type="text" 
                                        value={settings.brandKit?.brandingText ?? ''} 
                                        onChange={e => handleBrandKitChange('brandingText', e.target.value)} 
                                        placeholder={t('settingsBrandingPlaceholder')} 
                                        className="block w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 sm:text-sm" 
                                    />
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <ColorInput 
                                            id="brandKitBrandingColor" 
                                            label={t('brandingColorLabel')}
                                            value={settings.brandKit?.brandingStyle?.color ?? '#000000'}
                                            onChange={v => handleBrandingStyleChange({ color: v })}
                                        />
                                        
                                        <div>
                                            <label htmlFor="brandKitBrandingSize" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t('brandingSizeLabel')}</label>
                                            <input
                                                type="number"
                                                id="brandKitBrandingSize"
                                                value={settings.brandKit?.brandingStyle?.fontSize ? settings.brandKit.brandingStyle.fontSize * 10 : ''}
                                                onChange={e => handleBrandingStyleChange({ fontSize: parseFloat(e.target.value) / 10 })}
                                                className="block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 sm:text-sm"
                                                step="1"
                                                min="5"
                                                max="30"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="brandKitBrandingOpacity" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t('brandingOpacityLabel')}</label>
                                        <div className="flex items-center space-x-3 bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                                            <input
                                                id="brandKitBrandingOpacity"
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={settings.brandKit?.brandingStyle?.opacity ?? 0.75}
                                                onChange={e => handleBrandingStyleChange({ opacity: parseFloat(e.target.value) })}
                                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-primary-600"
                                            />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-10 text-right">
                                                {Math.round((settings.brandKit?.brandingStyle?.opacity ?? 0.75) * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    <PositionSelector
                                        label={t('brandingPositionLabel')}
                                        value={settings.brandKit?.brandingStyle?.position ?? 'bottom-right'}
                                        onChange={v => handleBrandingStyleChange({ position: v })}
                                        t={t}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md flex justify-end gap-3 z-10">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        {t('cancelButton')}
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-8 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all"
                    >
                        {saved ? t('savedButton') : t('saveButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};
