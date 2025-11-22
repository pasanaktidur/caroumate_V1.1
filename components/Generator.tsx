import * as React from 'react';
import type { UserProfile, Carousel, SlideData, DesignPreferences, SlideNumberStyle } from '../types';
import { DesignStyle, AspectRatio, FontChoice } from '../types';
import type { TFunction } from '../App';
import { 
    SparklesIcon, LoaderIcon, DownloadIcon, DocumentTextIcon, ThreadsIcon, UploadIcon,
    RefreshIcon, TrashIcon, LeftArrowIcon, RightArrowIcon, ChevronDownIcon
} from './icons';
import { aspectRatioDisplayMap } from '../lib/constants';
import { SlideCard } from './SlideCard';
import { Loader } from './Loader';
import { FontSelector, ApplyScopeControl, TextFormatToolbar, TextStrokeControl, ColorInput, PositionSelector } from './ui';

export const Generator: React.FC<{
    user: UserProfile;
    isGenerating: boolean;
    generationMessage: string;
    error: string | null;
    onErrorDismiss: () => void;
    onGenerate: (topic: string, niche: string, preferences: DesignPreferences, magicCreate: boolean) => void;
    currentCarousel: Carousel | null;
    setCurrentCarousel: React.Dispatch<React.SetStateAction<Carousel | null>>;
    selectedSlide: SlideData | undefined;
    onSelectSlide: (id: string) => void;
    onUpdateSlide: (id: string, updates: Partial<SlideData>) => void;
    onUpdateCarouselPreferences: (updates: Partial<DesignPreferences>, currentTopic: string) => void;
    onClearSlideOverrides: (property: keyof SlideData) => void;
    onMoveSlide: (id: string, direction: 'left' | 'right') => void;
    onOpenAssistant: () => void;
    onOpenCaption: () => void;
    onOpenThread: () => void;
    onDownload: () => void;
    isDownloading: boolean;
    isGeneratingImageForSlide: string | null;
    isGeneratingVideoForSlide: string | null;
    onGenerateImageForSlide: (slideId: string) => void;
    onGenerateVideoForSlide: (slideId: string) => void;
    onGenerateAllVideos: () => void;
    onEditImageForSlide: (slideId: string, editPrompt: string) => void;
    onGenerateAllImages: () => void;
    onGetDesignSuggestion: () => void;
    isSuggestingDesign: boolean;
    onUploadVisualForSlide: (e: React.ChangeEvent<HTMLInputElement>, slideId: string) => void;
    onRemoveVisualForSlide: (slideId: string) => void;
    onApplyBrandKit: () => void;
    brandKitConfigured: boolean;
    regeneratingPart: { slideId: string; part: 'headline' | 'body' } | null;
    onRegenerateContent: (slideId: string, part: 'headline' | 'body') => void;
    t: TFunction;
}> = (props) => {
    const { 
        user, onGenerate, currentCarousel, selectedSlide, onUpdateSlide, onUpdateCarouselPreferences, 
        onClearSlideOverrides, onSelectSlide, onMoveSlide, onRegenerateContent, onOpenThread, 
        onErrorDismiss, ...rest 
    } = props;
    const { 
        isGenerating, generationMessage, error, onOpenAssistant, onOpenCaption, onDownload, 
        isDownloading, isGeneratingImageForSlide, isGeneratingVideoForSlide, onGenerateImageForSlide, 
        onGenerateVideoForSlide, onGenerateAllVideos, onEditImageForSlide, onGenerateAllImages, onGetDesignSuggestion, 
        isSuggestingDesign, onUploadVisualForSlide, onRemoveVisualForSlide, onApplyBrandKit, 
        brandKitConfigured, t, regeneratingPart 
    } = rest;
    
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [topic, setTopic] = React.useState('');
    const [selectedNiche, setSelectedNiche] = React.useState<string>(user.niche?.[0] || '');
    const [isMagicCreateEnabled, setIsMagicCreateEnabled] = React.useState(false);
    const [editPrompt, setEditPrompt] = React.useState('');
    
    // Scopes for applying styles
    const [colorScope, setColorScope] = React.useState<'all' | 'selected'>('all');
    const [visualScope, setVisualScope] = React.useState<'all' | 'selected'>('selected');
    
    // --- Resizable Panel Logic ---
    const [sidebarWidth, setSidebarWidth] = React.useState(420);
    const [isResizing, setIsResizing] = React.useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = e.clientX;
            const minWidth = 360;
            const maxWidth = 800;
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'auto';
            document.body.style.userSelect = 'auto';
        };

        if (isResizing) {
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);
    
    const preferences = currentCarousel?.preferences ?? {
        backgroundColor: '#FFFFFF',
        fontColor: '#111827',
        backgroundOpacity: 1,
        style: DesignStyle.MINIMALIST,
        font: FontChoice.MONO,
        aspectRatio: AspectRatio.SQUARE,
        backgroundImage: undefined,
        brandingText: '',
        brandingStyle: { color: '#111827', opacity: 0.75, position: 'bottom-right', fontSize: 0.7 },
        headlineStyle: { fontSize: 1.4, fontWeight: 'bold', textAlign: 'center', textStroke: { color: '#000000', width: 0 } },
        bodyStyle: { fontSize: 0.8, textAlign: 'center', textStroke: { color: '#000000', width: 0 } },
        slideNumberStyle: { show: false, color: '#FFFFFF', opacity: 0.8, position: 'top-right', fontSize: 0.7 },
    };

    React.useEffect(() => {
        if (currentCarousel) {
            setTopic(currentCarousel.title);
            setSelectedNiche(currentCarousel.category || user.niche?.[0] || '');
        }
    }, [currentCarousel?.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(topic, selectedNiche, preferences, isMagicCreateEnabled);
    };
    
    const handleBgVisualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const visualUrl = reader.result as string;
                if (colorScope === 'selected' && selectedSlide) {
                    onUpdateSlide(selectedSlide.id, { backgroundImage: visualUrl });
                } else {
                    onUpdateCarouselPreferences({ backgroundImage: visualUrl }, topic);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBgVisual = () => {
         if (colorScope === 'selected' && selectedSlide) {
            onUpdateSlide(selectedSlide.id, { backgroundImage: undefined });
        } else {
            onUpdateCarouselPreferences({ backgroundImage: undefined }, topic);
            // Also clear per-slide overrides if applying to all
            onClearSlideOverrides('backgroundImage');
        }
    };

    const handleStyleChange = (key: keyof DesignPreferences, value: any) => {
        if (colorScope === 'selected' && selectedSlide) {
            onUpdateSlide(selectedSlide.id, { [key]: value } as Partial<SlideData>);
        } else {
            onUpdateCarouselPreferences({ [key]: value }, topic);
            if(key === 'backgroundColor' || key === 'fontColor' || key === 'backgroundOpacity'){
                onClearSlideOverrides(key as keyof SlideData);
            }
        }
    };
    
    const handleTextStyleChange = (type: 'headlineStyle' | 'bodyStyle', style: any) => {
        if (selectedSlide) {
            onUpdateSlide(selectedSlide.id, { [type]: style });
        }
    };

    const slideNumberPrefs = preferences.slideNumberStyle ?? { show: false, color: '#FFFFFF', opacity: 0.8, position: 'top-right', fontSize: 0.7 };

    const handleSlideNumberStyleChange = (updates: Partial<SlideNumberStyle>) => {
        onUpdateCarouselPreferences({
            slideNumberStyle: { ...slideNumberPrefs, ...updates }
        }, topic);
    };
    
    const slideFileInputRef = React.useRef<HTMLInputElement>(null);
    
    const isVisualGenerationRunning = isGeneratingImageForSlide != null || isGeneratingVideoForSlide != null;

    return (
        <div className="flex-grow lg:flex lg:flex-row lg:overflow-hidden">
            {/* Left Panel: Controls */}
            <div
                className="w-full lg:w-[var(--sidebar-width)] lg:flex-shrink-0 bg-white dark:bg-gray-900 border-r dark:border-gray-800 p-0 lg:overflow-y-auto custom-scrollbar flex flex-col z-10 shadow-xl lg:shadow-none"
                style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
            >
                <div className="p-6 space-y-8 pb-24">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Step 1: Idea */}
                        <section>
                            <div className="flex items-center mb-4">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 text-xs font-bold mr-3">1</div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('generatorStep1Title')}</h3>
                            </div>
                            <div className="space-y-4 ml-9">
                                <textarea
                                    id="topic"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    required
                                    placeholder={t('generatorTopicPlaceholder')}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
                                    rows={3}
                                />
                                <div>
                                    <label htmlFor="niche-select" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('profileNicheLabel')}</label>
                                    <div className="relative">
                                        <select
                                            id="niche-select"
                                            value={selectedNiche}
                                            onChange={e => setSelectedNiche(e.target.value)}
                                            className="block w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer sm:text-sm"
                                        >
                                            {user.niche.length > 0 ? (
                                                user.niche.map(n => <option key={n} value={n}>{n}</option>)
                                            ) : (
                                                <option value="">{t('generatorNicheGeneral')}</option>
                                            )}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <ChevronDownIcon className="w-4 h-4"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        {/* Step 2: Design */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 text-xs font-bold mr-3">2</div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('generatorStep2Title')}</h3>
                                </div>
                                 {currentCarousel && (
                                    <button type="button" onClick={onGetDesignSuggestion} disabled={isSuggestingDesign} className="text-xs inline-flex items-center font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                                        {isSuggestingDesign ? <LoaderIcon className="w-3 h-3 mr-1.5 animate-spin" /> : <SparklesIcon className="w-3 h-3 mr-1.5"/>}
                                        {t('suggestDesignButton')}
                                    </button>
                                 )}
                            </div>
                           
                            <div className="space-y-5 ml-9">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="style" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('generatorStyleLabel')}</label>
                                        <div className="relative">
                                            <select id="style" value={preferences.style} onChange={e => onUpdateCarouselPreferences({ style: e.target.value as DesignStyle }, topic)} className="block w-full pl-3 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer text-sm">
                                                {Object.values(DesignStyle).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                <ChevronDownIcon className="w-4 h-4"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="aspectRatio" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('generatorAspectRatioLabel')}</label>
                                        <div className="relative">
                                            <select id="aspectRatio" value={preferences.aspectRatio} onChange={e => onUpdateCarouselPreferences({ aspectRatio: e.target.value as AspectRatio }, topic)} className="block w-full pl-3 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer text-sm">
                                                {Object.entries(aspectRatioDisplayMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                <ChevronDownIcon className="w-4 h-4"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="font" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('generatorFontLabel')}</label>
                                    <FontSelector
                                        id="font"
                                        value={preferences.font}
                                        onChange={font => onUpdateCarouselPreferences({ font }, topic)}
                                    />
                                </div>

                                 {/* Branding */}
                                 <div className="pt-5 border-t border-gray-100 dark:border-gray-800">
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('generatorBrandingLabel')}</label>
                                    <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <input id="branding" type="text" value={preferences.brandingText ?? ''} onChange={e => onUpdateCarouselPreferences({ brandingText: e.target.value }, topic)} placeholder={t('generatorBrandingPlaceholder')} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <ColorInput 
                                                id="brandingColor" 
                                                label={t('brandingColorLabel')}
                                                value={preferences.brandingStyle.color}
                                                onChange={v => onUpdateCarouselPreferences({ brandingStyle: { ...preferences.brandingStyle, color: v } }, topic)}
                                            />
                                             <div>
                                                <label htmlFor="brandingSize" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('brandingSizeLabel')}</label>
                                                <input
                                                    type="number"
                                                    id="brandingSize"
                                                    value={preferences.brandingStyle.fontSize ? preferences.brandingStyle.fontSize * 10 : ''}
                                                    onChange={e => {
                                                        const newSize = parseFloat(e.target.value) / 10;
                                                        onUpdateCarouselPreferences({
                                                            brandingStyle: { ...preferences.brandingStyle, fontSize: newSize }
                                                        }, topic);
                                                    }}
                                                    className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
                                                    step="1"
                                                    min="5"
                                                    max="30"
                                                />
                                            </div>
                                        </div>
                                         <PositionSelector
                                            label={t('brandingPositionLabel')}
                                            value={preferences.brandingStyle.position}
                                            onChange={v => onUpdateCarouselPreferences({ brandingStyle: { ...preferences.brandingStyle, position: v } }, topic)}
                                            t={t}
                                        />
                                    </div>
                                </div>

                                 {/* Slide Number */}
                                <div className="pt-5 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('generatorSlideNumberLabel')}</label>
                                        <div
                                            onClick={() => handleSlideNumberStyleChange({ show: !slideNumberPrefs.show })}
                                            role="switch"
                                            aria-checked={slideNumberPrefs.show}
                                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${slideNumberPrefs.show ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${slideNumberPrefs.show ? 'translate-x-4' : 'translate-x-0'}`}
                                            />
                                        </div>
                                    </div>
                                    {slideNumberPrefs.show && (
                                        <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <div className="grid grid-cols-2 gap-4">
                                                <ColorInput
                                                    id="slideNumberColor"
                                                    label={t('slideNumberColorLabel')}
                                                    value={slideNumberPrefs.color}
                                                    onChange={v => handleSlideNumberStyleChange({ color: v })}
                                                />
                                                 <div>
                                                    <label htmlFor="slideNumberSize" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('slideNumberSizeLabel')}</label>
                                                    <input
                                                        type="number"
                                                        id="slideNumberSize"
                                                        value={slideNumberPrefs.fontSize ? slideNumberPrefs.fontSize * 10 : ''}
                                                        onChange={e => {
                                                            const newSize = parseFloat(e.target.value) / 10;
                                                            handleSlideNumberStyleChange({ fontSize: newSize });
                                                        }}
                                                        className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
                                                        step="1"
                                                        min="5"
                                                        max="30"
                                                    />
                                                </div>
                                            </div>
                                            <PositionSelector
                                                label={t('slideNumberPositionLabel')}
                                                value={slideNumberPrefs.position}
                                                onChange={v => handleSlideNumberStyleChange({ position: v })}
                                                t={t}
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Colors & Opacity */}
                                <div className="pt-5 border-t border-gray-100 dark:border-gray-800">
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Colors</label>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <ColorInput id="bgColor" label={t('generatorBgColorLabel')} value={selectedSlide?.backgroundColor ?? preferences.backgroundColor} onChange={v => handleStyleChange('backgroundColor', v)} />
                                        <ColorInput id="fontColor" label={t('generatorFontColorLabel')} value={selectedSlide?.fontColor ?? preferences.fontColor} onChange={v => handleStyleChange('fontColor', v)} />
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between mb-1">
                                            <label htmlFor="bgOpacity" className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('generatorBgOpacityLabel')}</label>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                {Math.round((selectedSlide?.backgroundOpacity ?? preferences.backgroundOpacity) * 100)}%
                                            </span>
                                        </div>
                                        <input
                                            id="bgOpacity"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={selectedSlide?.backgroundOpacity ?? preferences.backgroundOpacity}
                                            onChange={e => handleStyleChange('backgroundOpacity', parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
                                        />
                                    </div>
                                </div>
                               
                                {/* Global Font Size Controls */}
                                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-100 dark:border-gray-800">
                                    <div>
                                        <label htmlFor="globalHeadlineSize" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('generatorHeadlineSizeLabel')}</label>
                                        <input
                                            type="number"
                                            id="globalHeadlineSize"
                                            value={preferences.headlineStyle.fontSize ? preferences.headlineStyle.fontSize * 10 : ''}
                                            onChange={e => {
                                                const newSize = parseFloat(e.target.value) / 10;
                                                onUpdateCarouselPreferences({
                                                    headlineStyle: { ...preferences.headlineStyle, fontSize: newSize }
                                                }, topic);
                                            }}
                                            className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                                            step="1"
                                            min="10"
                                            max="100"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="globalBodySize" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('generatorBodySizeLabel')}</label>
                                        <input
                                            type="number"
                                            id="globalBodySize"
                                            value={preferences.bodyStyle.fontSize ? preferences.bodyStyle.fontSize * 10 : ''}
                                            onChange={e => {
                                                const newSize = parseFloat(e.target.value) / 10;
                                                onUpdateCarouselPreferences({
                                                    bodyStyle: { ...preferences.bodyStyle, fontSize: newSize }
                                                }, topic);
                                            }}
                                            className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                                            step="1"
                                            min="5"
                                            max="50"
                                        />
                                    </div>
                                </div>
                                 <ApplyScopeControl scope={colorScope} setScope={setColorScope} isDisabled={!selectedSlide} t={t} fieldId="colors" />
                                
                                {/* Background Visual */}
                                <div className="pt-5 border-t border-gray-100 dark:border-gray-800">
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('generatorCustomBgLabel')}</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="file" accept="image/*,video/*" onChange={handleBgVisualUpload} ref={fileInputRef} className="hidden" />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                           <UploadIcon className="w-4 h-4 mr-2" />
                                            {t('uploadVisual')}
                                        </button>
                                        {( (colorScope === 'all' && preferences.backgroundImage) || (colorScope === 'selected' && selectedSlide?.backgroundImage) ) && (
                                            <button type="button" onClick={handleRemoveBgVisual} className="px-4 py-2.5 border border-red-200 dark:border-red-900/50 text-sm font-medium rounded-xl text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                                {t('generatorRemoveBgButton')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Brand Kit Button */}
                                {brandKitConfigured && (
                                    <button type="button" onClick={onApplyBrandKit} className="w-full inline-flex items-center justify-center px-4 py-3 border border-gold-200 dark:border-gold-800/50 text-sm font-bold rounded-xl text-gold-800 dark:text-gold-200 bg-gold-50 dark:bg-gold-900/20 hover:bg-gold-100 dark:hover:bg-gold-900/40 focus:outline-none transition-all shadow-sm hover:shadow">
                                        <SparklesIcon className="w-4 h-4 mr-2 text-gold-500" />
                                        {t('applyBrandKit')}
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* Action Buttons */}
                        <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl">
                                <label htmlFor="magic-create" className="text-sm font-medium text-primary-900 dark:text-primary-100 cursor-pointer flex-1">{t('magicCreateLabel')}</label>
                                <div
                                    onClick={() => setIsMagicCreateEnabled(!isMagicCreateEnabled)}
                                    role="switch"
                                    aria-checked={isMagicCreateEnabled}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isMagicCreateEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMagicCreateEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 px-1">{t('magicCreateHint')}</p>

                           <button
                                type="submit"
                                disabled={isGenerating}
                                className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5"
                            >
                                {isGenerating ? <LoaderIcon className="w-6 h-6 mr-2 animate-spin" /> : <SparklesIcon className="w-6 h-6 mr-2 -ml-1" />}
                                {isGenerating ? t('generatorGeneratingButton') : t('generatorCreateButton')}
                            </button>
                             {currentCarousel && currentCarousel.slides.length > 0 && (
                                 <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={onOpenAssistant} className="w-full text-xs inline-flex flex-col items-center justify-center px-2 py-3 border border-gray-200 dark:border-gray-700 font-semibold rounded-xl text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                                        <SparklesIcon className="w-5 h-5 mb-1 text-purple-500"/>
                                        {t('generatorAssistantButton')}
                                    </button>
                                    <button type="button" onClick={onOpenCaption} className="w-full text-xs inline-flex flex-col items-center justify-center px-2 py-3 border border-gray-200 dark:border-gray-700 font-semibold rounded-xl text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                                        <DocumentTextIcon className="w-5 h-5 mb-1 text-blue-500"/>
                                        {t('generatorCaptionButton')}
                                    </button>
                                    <button type="button" onClick={onOpenThread} className="w-full text-xs inline-flex flex-col items-center justify-center px-2 py-3 border border-gray-200 dark:border-gray-700 font-semibold rounded-xl text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                                        <ThreadsIcon className="w-5 h-5 mb-1 text-gray-900 dark:text-white"/>
                                        {t('generatorThreadButton')}
                                    </button>
                                </div>
                             )}
                        </div>
                    </form>
                    
                     {/* Step 3: Edit Content */}
                    {selectedSlide && (
                        <div className="pt-8 border-t-2 border-dashed border-gray-200 dark:border-gray-700 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center mb-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 text-xs font-bold mr-3">3</div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('generatorStep3Title')} (Slide {(currentCarousel?.slides.findIndex(s => s.id === selectedSlide.id) ?? 0) + 1})</h3>
                            </div>

                            {/* Headline */}
                            <div className="space-y-2 pl-9">
                                <label htmlFor="headline" className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('generatorHeadlineLabel')}</label>
                                <div className="flex items-start gap-2">
                                    <textarea id="headline" value={selectedSlide.headline} onChange={e => onUpdateSlide(selectedSlide.id, { headline: e.target.value })} className="flex-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm" rows={2}/>
                                    <button
                                        type="button"
                                        onClick={() => onRegenerateContent(selectedSlide.id, 'headline')}
                                        disabled={!!regeneratingPart}
                                        className="p-2.5 text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                        aria-label={t('regenerateHeadlineAria')}
                                    >
                                        {regeneratingPart?.part === 'headline' ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <RefreshIcon className="w-5 h-5"/>}
                                    </button>
                                </div>
                                <TextFormatToolbar style={selectedSlide.headlineStyle ?? preferences.headlineStyle} onStyleChange={s => handleTextStyleChange('headlineStyle', s)} />
                                <div className="flex items-end flex-wrap gap-4">
                                    <TextStrokeControl style={selectedSlide.headlineStyle ?? preferences.headlineStyle} onStyleChange={s => handleTextStyleChange('headlineStyle', s)} />
                                    <ColorInput
                                        id="headlineColor"
                                        label={t('headlineColorLabel')}
                                        value={selectedSlide.headlineColor ?? (selectedSlide.fontColor ?? preferences.fontColor)}
                                        onChange={v => onUpdateSlide(selectedSlide.id, { headlineColor: v })}
                                    />
                                </div>
                            </div>
                            
                            {/* Body */}
                            <div className="space-y-2 pl-9">
                                <label htmlFor="body" className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('generatorBodyLabel')}</label>
                                <div className="flex items-start gap-2">
                                    <textarea id="body" value={selectedSlide.body} onChange={e => onUpdateSlide(selectedSlide.id, { body: e.target.value })} className="flex-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm" rows={4}/>
                                     <button
                                        type="button"
                                        onClick={() => onRegenerateContent(selectedSlide.id, 'body')}
                                        disabled={!!regeneratingPart}
                                        className="p-2.5 text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                        aria-label={t('regenerateBodyAria')}
                                    >
                                        {regeneratingPart?.part === 'body' ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <RefreshIcon className="w-5 h-5"/>}
                                    </button>
                                </div>
                                 <TextFormatToolbar style={selectedSlide.bodyStyle ?? preferences.bodyStyle} onStyleChange={s => handleTextStyleChange('bodyStyle', s)} />
                                 <div className="flex items-end flex-wrap gap-4">
                                    <TextStrokeControl style={selectedSlide.bodyStyle ?? preferences.bodyStyle} onStyleChange={s => handleTextStyleChange('bodyStyle', s)} />
                                    <ColorInput
                                        id="bodyColor"
                                        label={t('bodyColorLabel')}
                                        value={selectedSlide.bodyColor ?? (selectedSlide.fontColor ?? preferences.fontColor)}
                                        onChange={v => onUpdateSlide(selectedSlide.id, { bodyColor: v })}
                                    />
                                </div>
                            </div>
                            
                            {/* Visuals Section */}
                            <div className="space-y-2 pl-9">
                                <label htmlFor="visual_prompt" className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('generatorVisualPromptLabel')}</label>
                                <textarea id="visual_prompt" value={selectedSlide.visual_prompt} onChange={e => onUpdateSlide(selectedSlide.id, { visual_prompt: e.target.value })} className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm" rows={2}/>
                                
                                <ApplyScopeControl scope={visualScope} setScope={setVisualScope} isDisabled={false} t={t} fieldId="visuals" />

                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    <input type="file" accept="image/*,video/*" onChange={(e) => onUploadVisualForSlide(e, selectedSlide.id)} ref={slideFileInputRef} className="hidden" />
                                    <button type="button" onClick={() => slideFileInputRef.current?.click()} className="col-span-1 inline-flex items-center justify-center px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-wide rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                                        <UploadIcon className="w-4 h-4 mr-2"/>{t('uploadVisual')}
                                    </button>
                                    <button type="button" onClick={() => visualScope === 'all' ? onGenerateAllImages() : onGenerateImageForSlide(selectedSlide.id)} className="col-span-1 inline-flex items-center justify-center px-3 py-2.5 border border-transparent text-xs font-bold uppercase tracking-wide rounded-xl text-white bg-accent-500 hover:bg-accent-600 disabled:opacity-50 shadow-md shadow-accent-500/20" disabled={isGenerating || isVisualGenerationRunning}>{t('generateImageButton')}</button>
                                    <button type="button" onClick={() => visualScope === 'all' ? onGenerateAllVideos() : onGenerateVideoForSlide(selectedSlide.id)} className="col-span-1 inline-flex items-center justify-center px-3 py-2.5 border border-transparent text-xs font-bold uppercase tracking-wide rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 shadow-md shadow-indigo-500/20" disabled={isGenerating || isVisualGenerationRunning}>{t('generateVideoButton')}</button>
                                </div>
                                {selectedSlide.backgroundImage && (
                                    <button type="button" onClick={() => onRemoveVisualForSlide(selectedSlide.id)} className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 border border-red-200 dark:border-red-900/50 text-xs font-bold uppercase rounded-xl text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"><TrashIcon className="w-4 h-4 mr-2"/>{t('removeButton')}</button>
                                 )}
                                 {selectedSlide.backgroundImage && selectedSlide.backgroundImage.startsWith('data:image') && (
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4 space-y-2">
                                        <label htmlFor="edit_prompt" className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('refineImagePrompt')}</label>
                                        <div className="flex space-x-2">
                                            <textarea id="edit_prompt" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder={t('refineImagePlaceholder')} className="flex-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 sm:text-sm resize-none" rows={1}/>
                                            <button type="button" onClick={() => { onEditImageForSlide(selectedSlide.id, editPrompt); setEditPrompt(''); }} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-bold uppercase rounded-xl text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 shadow-sm" disabled={isGenerating || isVisualGenerationRunning || !editPrompt}>
                                               {t('refineImageButton')}
                                            </button>
                                        </div>
                                    </div>
                                 )}
                            </div>

                             {/* Move Slide */}
                            <div className="pl-9">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('generatorMoveSlideLabel')}</label>
                                <div className="flex items-center space-x-2">
                                    <button type="button" onClick={() => onMoveSlide(selectedSlide.id, 'left')} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" disabled={currentCarousel?.slides.findIndex(s => s.id === selectedSlide.id) === 0}><LeftArrowIcon className="w-5 h-5"/></button>
                                    <button type="button" onClick={() => onMoveSlide(selectedSlide.id, 'right')} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" disabled={currentCarousel?.slides.findIndex(s => s.id === selectedSlide.id) === (currentCarousel?.slides.length ?? 0) - 1}><RightArrowIcon className="w-5 h-5"/></button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
            {/* Resizer Handle */}
            <div
                className="hidden lg:block w-1.5 cursor-col-resize bg-gray-100 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 hover:bg-primary-400 transition-colors z-20"
                onMouseDown={handleMouseDown}
            />

            {/* Right Panel: Preview */}
            <div className="flex-grow bg-gray-100/50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 pb-24 lg:pb-6 lg:overflow-y-auto relative">
                {/* Canvas Background Pattern */}
                <div className="absolute inset-0 bg-grid-pattern dark:bg-grid-pattern-dark opacity-[0.4] dark:opacity-[0.1] pointer-events-none"></div>
                
                {error && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-11/12 max-w-xl bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-100 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm" role="alert">
                        <strong className="font-bold block mb-1 text-lg">{t('errorTitle')}</strong>
                        <span className="block sm:inline text-sm opacity-90" dangerouslySetInnerHTML={{ __html: error }}></span>
                         <button onClick={onErrorDismiss} className="absolute top-2 right-3 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors">
                            <span className="text-xl leading-none">×</span>
                        </button>
                    </div>
                )}
                
                {isGenerating || isSuggestingDesign ? (
                    <div className="z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
                         <Loader text={generationMessage || t('suggestingDesignMessage')} />
                    </div>
                ) : currentCarousel && currentCarousel.slides.length > 0 ? (
                    <div className="w-full flex flex-col items-center justify-center z-10">
                        <div className="flex items-center space-x-6 overflow-x-auto py-12 px-8 w-full custom-scrollbar pb-8">
                            {currentCarousel.slides.map((slide, index) => (
                                <SlideCard
                                    key={slide.id}
                                    slide={slide}
                                    slideIndex={index}
                                    totalSlides={currentCarousel.slides.length}
                                    preferences={preferences}
                                    isSelected={slide.id === selectedSlide?.id}
                                    onClick={() => onSelectSlide(slide.id)}
                                    isGeneratingImage={isGeneratingImageForSlide === slide.id || isGeneratingVideoForSlide === slide.id}
                                    t={t}
                                />
                            ))}
                        </div>
                        <button
                            onClick={onDownload}
                            disabled={isDownloading}
                            className="mt-8 inline-flex items-center justify-center px-10 py-4 border border-transparent text-lg font-bold rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 transform hover:-translate-y-1 transition-all"
                        >
                            {isDownloading ? <LoaderIcon className="w-6 h-6 mr-2 animate-spin" /> : <DownloadIcon className="w-6 h-6 mr-2 -ml-1" />}
                            {isDownloading ? t('downloadingButton') : t('downloadAllButton')}
                        </button>
                    </div>
                ) : (
                    <div className="text-center z-10 opacity-60">
                        <div className="bg-gray-200 dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                             <SparklesIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-200">{t('previewEmptyTitle')}</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 lg:hidden">{t('previewEmptySubtitleMobile')}</p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 hidden lg:block">{t('previewEmptySubtitleDesktop')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};