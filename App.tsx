import * as React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import type { Carousel, SlideData, DesignPreferences, AppSettings } from './types';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { 
    generateCarouselContent, generateCaption, generateImage, 
    regenerateSlideContent, generateThreadFromCarousel, generateVideo, editImage, getDesignSuggestion 
} from './services/geminiService';

import { translations } from './lib/translations';
import { SETTINGS_STORAGE_KEY, defaultSettings } from './lib/constants';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useCarouselHistory } from './hooks/useCarouselHistory';

import { MainLayout } from './components/Layouts';
import { LoginScreen } from './components/LoginScreen';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { Dashboard } from './components/Dashboard';
import { Generator } from './components/Generator';
import { SettingsModal } from './components/SettingsModal';
import { TutorialScreen } from './components/TutorialScreen';
import { AiAssistantModal } from './components/AiAssistantModal';
import { CaptionModal } from './components/CaptionModal';
import { ThreadModal } from './components/ThreadModal';
import { Loader } from './components/Loader';

export type TFunction = (key: string, params?: { [key: string]: any }) => string;

export default function App() {
    const navigate = useNavigate();

    // Debugging Log
    React.useEffect(() => {
        console.log("CarouMate App Mounted Successfully");
    }, []);

    // --- Auth & Data Hooks ---
    const { 
        user, isLoadingUser, authError, setAuthError, 
        handleGoogleLogin, handleEmailLogin, handleEmailSignUp, handleLogout, handleProfileSetup,
        updateUser 
    } = useAuth();

    const {
        carouselHistory, localHistoryCount, downloadCount, historyError, setHistoryError,
        saveCarouselToDb, handleDeleteCarousel, handleClearHistory, handleMigrateLocalData, incrementDownloadCount
    } = useCarouselHistory(user);

    // --- Global UI State ---
    const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
            return localStorage.getItem('theme') as 'light' | 'dark';
        }
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });
    
    React.useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const [language, setLanguage] = React.useState<keyof typeof translations>('id');
    const handleLanguageChange = () => setLanguage(lang => lang === 'en' ? 'id' : 'en');
    
    const t: TFunction = React.useCallback((key: string, params?: { [key: string]: any }) => {
        let text = (translations[language] as any)[key] || key;
        if (params) {
            Object.keys(params).forEach(pKey => {
                const regex = new RegExp(`{{${pKey}}}`, 'g');
                text = text.replace(regex, String(params[pKey]));
            });
        }
        return text;
    }, [language]);

    // --- Editor State ---
    const [currentCarousel, setCurrentCarousel] = React.useState<Carousel | null>(null);
    const [selectedSlideId, setSelectedSlideId] = React.useState<string | null>(null);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isGeneratingImageForSlide, setIsGeneratingImageForSlide] = React.useState<string | null>(null);
    const [isGeneratingVideoForSlide, setIsGeneratingVideoForSlide] = React.useState<string | null>(null);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [generationMessage, setGenerationMessage] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);
    const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isCaptionModalOpen, setIsCaptionModalOpen] = React.useState(false);
    const [isGeneratingCaption, setIsGeneratingCaption] = React.useState(false);
    const [generatedCaption, setGeneratedCaption] = React.useState<string>('');
    const [currentTopic, setCurrentTopic] = React.useState('');
    const [regeneratingPart, setRegeneratingPart] = React.useState<{ slideId: string; part: 'headline' | 'body' } | null>(null);
    const [isThreadModalOpen, setIsThreadModalOpen] = React.useState(false);
    const [isGeneratingThread, setIsGeneratingThread] = React.useState(false);
    const [generatedThread, setGeneratedThread] = React.useState('');
    const [isSuggestingDesign, setIsSuggestingDesign] = React.useState(false);

    // Sync hook errors to local UI error state
    React.useEffect(() => {
        if (authError) setError(authError);
        if (historyError) setError(historyError);
    }, [authError, historyError]);

    const dismissError = () => {
        setError(null);
        setAuthError(null);
        setHistoryError(null);
    };

    // Settings
    const [settings, setSettings] = React.useState<AppSettings>(() => {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            const parsedSettings = savedSettings ? JSON.parse(savedSettings) : {};
            return {
                ...defaultSettings,
                ...parsedSettings,
                brandKit: {
                    ...defaultSettings.brandKit,
                    ...(parsedSettings.brandKit || {}),
                    colors: { ...defaultSettings.brandKit!.colors, ...(parsedSettings.brandKit?.colors || {}) },
                    fonts: { ...defaultSettings.brandKit!.fonts, ...(parsedSettings.brandKit?.fonts || {}) },
                    brandingStyle: { ...defaultSettings.brandKit!.brandingStyle, ...(parsedSettings.brandKit?.brandingStyle || {}) },
                    slideNumberStyle: { ...defaultSettings.brandKit!.slideNumberStyle, ...(parsedSettings.brandKit?.slideNumberStyle || {}) },
                }
            };
        } catch (error) {
            console.error("Could not load settings:", error);
            return defaultSettings;
        }
    });

    const handleSaveSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error("Could not save settings:", error);
        }
        setIsSettingsOpen(false);
    };

    // --- Helper: Parse Errors ---
    const parseAndDisplayError = React.useCallback((error: any): string => {
        let errorMessage = error.message || t('errorUnknown');
        if (errorMessage.startsWith('{') && errorMessage.endsWith('}')) {
            try {
                const errorObj = JSON.parse(errorMessage);
                if (errorObj.error) {
                    const { code, message, status, details } = errorObj.error;
                    if (code === 429 || status === "RESOURCE_EXHAUSTED") {
                        const helpLinkDetails = details?.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.Help');
                        const helpLink = helpLinkDetails?.links?.[0]?.url;
                        return t('errorQuotaExceeded', {
                            link: helpLink || 'https://ai.google.dev/gemini-api/docs/rate-limits'
                        });
                    }
                    const lowerMessage = message?.toLowerCase() || '';
                    if (code === 400 && (lowerMessage.includes('api key not valid') || lowerMessage.includes('permission denied'))) {
                         return t('errorInvalidApiKey');
                    }
                    return message || errorMessage;
                }
            } catch (e) {}
        }
        const lowerCaseMessage = errorMessage.toLowerCase();
        if (lowerCaseMessage.includes('api key not valid') || lowerCaseMessage.includes('permission denied')) {
            return t('errorInvalidApiKey');
        }
        if (lowerCaseMessage.includes('api key is not configured')) {
            return t('errorApiKeyNotConfigured');
        }
        if (errorMessage.includes("AI did not return an image from your prompt.")) {
            return t('errorImageGen');
        }
        return errorMessage;
    }, [t]);

    const goToDashboard = () => {
        setIsSettingsOpen(false); 
        if (currentCarousel) saveCarouselToDb(currentCarousel);
        setCurrentCarousel(null);
        navigate('/dashboard');
    }

    const startNewCarousel = () => {
        setIsSettingsOpen(false); 
        if (currentCarousel) saveCarouselToDb(currentCarousel);
        setCurrentCarousel(null);
        setSelectedSlideId(null);
        navigate('/generator');
    };

    const handleEditCarousel = (carouselId: string) => {
        const carouselToEdit = carouselHistory.find(c => c.id === carouselId);
        if (carouselToEdit) {
            setCurrentCarousel(carouselToEdit);
            setCurrentTopic(carouselToEdit.title);
            setSelectedSlideId(carouselToEdit.slides[0]?.id || null);
            navigate('/generator');
        }
    };

    const deleteCarousel = async (id: string) => {
        if (window.confirm(t('deleteCarouselConfirm'))) await handleDeleteCarousel(id);
    }

    const clearHistory = async () => {
        if (window.confirm(t('clearHistoryConfirm'))) await handleClearHistory();
    }

    // Generation Helpers
    const executeImageGenerationForAllSlides = async (carousel: Carousel, settings: AppSettings): Promise<Carousel> => {
        let updatedCarousel = carousel;
        for (let i = 0; i < carousel.slides.length; i++) {
            const slide = carousel.slides[i];
            setGenerationMessage(t('generatingImageMessage', { current: i + 1, total: carousel.slides.length }));
            setIsGeneratingImageForSlide(slide.id);
            try {
                const imageUrl = await generateImage(slide.visual_prompt, carousel.preferences.aspectRatio, settings);
                const newSlides = updatedCarousel.slides.map(s => s.id === slide.id ? { ...s, backgroundImage: imageUrl } : s);
                updatedCarousel = { ...updatedCarousel, slides: newSlides };
                setCurrentCarousel(updatedCarousel);
            } catch (imageErr) {
                console.error(`Failed to generate image for slide ${i + 1}:`, imageErr);
            }
        }
        await saveCarouselToDb(updatedCarousel);
        return updatedCarousel;
    };
    
    const executeVideoGenerationForAllSlides = async (carousel: Carousel, settings: AppSettings): Promise<void> => {
        try {
            const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
            if (!hasKey) await (window as any).aistudio?.openSelectKey();
        } catch (e) { console.error("AI Studio helper not available.", e); }

        let updatedCarousel = carousel;
        for (let i = 0; i < carousel.slides.length; i++) {
            const slide = carousel.slides[i];
            setGenerationMessage(t('generatingVideoMessage') + ` (${i + 1}/${carousel.slides.length})`);
            setIsGeneratingVideoForSlide(slide.id);
            try {
                const videoUrl = await generateVideo(slide.visual_prompt, carousel.preferences.aspectRatio, settings);
                updatedCarousel = {
                    ...updatedCarousel,
                    slides: updatedCarousel.slides.map(s => s.id === slide.id ? { ...s, backgroundImage: videoUrl } : s)
                };
                setCurrentCarousel(updatedCarousel);
            } catch (err: any) { console.error(`Failed to generate video for slide ${i + 1}:`, err); } 
            finally { setIsGeneratingVideoForSlide(null); }
        }
        await saveCarouselToDb(updatedCarousel);
        setGenerationMessage('');
    };

    // Main Generate Handler
    const handleGenerateCarousel = React.useCallback(async (topic: string, niche: string, preferences: DesignPreferences, magicCreate: boolean) => {
        if (!user) return;
        if (!settings.apiKey) { setError(t('errorApiKeyNotConfigured')); return; }

        setIsGenerating(true);
        setError(null);
        setCurrentCarousel(null);
        setCurrentTopic(topic);
        
        try {
            setGenerationMessage(t('generatingContentMessage'));
            const nicheToUse = niche || (user.niche.length > 0 ? user.niche[0] : 'General');
            const slidesContent = await generateCarouselContent(topic, nicheToUse, preferences, settings);
            const initialSlides: SlideData[] = slidesContent.map(s => ({ ...s, id: crypto.randomUUID() }));
            
            const newCarousel: Carousel = {
                id: crypto.randomUUID(),
                title: topic,
                createdAt: new Date().toISOString(),
                slides: initialSlides,
                category: nicheToUse,
                preferences,
            };
            
            setCurrentCarousel(newCarousel);
            setSelectedSlideId(initialSlides[0]?.id ?? null);
            await saveCarouselToDb(newCarousel);

            if (magicCreate) {
                await executeImageGenerationForAllSlides(newCarousel, settings);
            } 
        } catch (err: any) {
            setError(parseAndDisplayError(err));
        } finally {
            setIsGenerating(false);
            setGenerationMessage('');
            setIsGeneratingImageForSlide(null);
        }
    }, [user, settings, t, parseAndDisplayError, saveCarouselToDb]);

    // Update Handler
    const handleUpdateSlide = (slideId: string, updates: Partial<SlideData>) => {
        setCurrentCarousel(prev => {
            if (!prev) return null;
            const updatedSlides = prev.slides.map(s => s.id === slideId ? { ...s, ...updates } : s);
            const newCarousel = { ...prev, slides: updatedSlides };
            saveCarouselToDb(newCarousel); 
            return newCarousel;
        });
    };

    // Specific Generation Handlers
    const handleGenerateImageForSlide = async (slideId: string) => {
        if (!currentCarousel) return;
        const slide = currentCarousel.slides.find(s => s.id === slideId);
        if (!slide) return;
    
        setIsGeneratingImageForSlide(slideId);
        setError(null);
        try {
            const imageUrl = await generateImage(slide.visual_prompt, currentCarousel.preferences.aspectRatio, settings);
            handleUpdateSlide(slideId, { backgroundImage: imageUrl });
        } catch (err: any) { setError(parseAndDisplayError(err)); } 
        finally { setIsGeneratingImageForSlide(null); }
    };

    const handleGenerateAllImages = async () => {
        if (!currentCarousel) return;
        setIsGenerating(true);
        setError(null);
        try {
            await executeImageGenerationForAllSlides(currentCarousel, settings);
        } catch(err: any) { setError(parseAndDisplayError(err)); } 
        finally { setIsGenerating(false); setGenerationMessage(''); setIsGeneratingImageForSlide(null); }
    };

    const handleGenerateVideoForSlide = async (slideId: string) => {
        if (!currentCarousel) return;
        const slide = currentCarousel.slides.find(s => s.id === slideId);
        if (!slide) return;
        try {
            const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
            if (!hasKey) await (window as any).aistudio?.openSelectKey();
        } catch (e) { console.error(e); }
    
        setIsGeneratingVideoForSlide(slideId);
        setGenerationMessage(t('generatingVideoMessage'));
        setError(null);
        try {
            const videoUrl = await generateVideo(slide.visual_prompt, currentCarousel.preferences.aspectRatio, settings);
            handleUpdateSlide(slideId, { backgroundImage: videoUrl });
        } catch (err: any) {
             const parsedError = parseAndDisplayError(err);
            if (parsedError.includes("Requested entity was not found.")) setError(t('errorVeoKeyNotFound'));
            else setError(parsedError);
        } finally {
            setIsGeneratingVideoForSlide(null);
            setGenerationMessage('');
        }
    };

    const handleGenerateAllVideos = async () => {
        if (!currentCarousel) return;
        setIsGenerating(true);
        setError(null);
        try {
            await executeVideoGenerationForAllSlides(currentCarousel, settings);
        } catch (err: any) {
             const parsedError = parseAndDisplayError(err);
             if (parsedError.includes("Requested entity was not found.")) setError(t('errorVeoKeyNotFound'));
             else setError(parsedError);
        } finally {
            setIsGenerating(false);
            setGenerationMessage('');
            setIsGeneratingVideoForSlide(null);
        }
    };

    const handleDownloadCarousel = async () => {
        if (!currentCarousel) return;
        setIsDownloading(true);
        setError(null);
        try {
            const zip = new JSZip();
            const slideElements = document.querySelectorAll('[data-carousel-slide]');
            const slideOrderMap = new Map(currentCarousel.slides.map((slide, index) => [slide.id, index]));
            const orderedElements = Array.from(slideElements).sort((a, b) => {
                const idA = a.getAttribute('data-carousel-slide') || '';
                const idB = b.getAttribute('data-carousel-slide') || '';
                return Number(slideOrderMap.get(idA) ?? 99) - Number(slideOrderMap.get(idB) ?? 99);
            });

            for (let i = 0; i < orderedElements.length; i++) {
                const element = orderedElements[i] as HTMLElement;
                const slideId = element.getAttribute('data-carousel-slide');
                const slide = currentCarousel.slides.find(s => s.id === slideId);
                if (!slide) continue;

                const originalTransform = element.style.transform;
                const originalTransition = element.style.transition;
                const originalBoxShadow = element.style.boxShadow;
                const originalBorderRadius = element.style.borderRadius;
                element.style.transform = 'none';
                element.style.transition = 'none';
                element.style.boxShadow = 'none';
                element.style.borderRadius = '0px';

                const visualUrl = slide.backgroundImage ?? currentCarousel.preferences.backgroundImage;
                const isVideo = visualUrl?.startsWith('data:video');
                
                if (isVideo) {
                    const videoResponse = await fetch(visualUrl!);
                    const videoBlob = await videoResponse.blob();
                    const extension = videoBlob.type.split('/')[1] || 'mp4';
                    zip.file(`slide-${i + 1}.${extension}`, videoBlob);
                    const videoElement = element.querySelector('video');
                    if (videoElement) videoElement.style.visibility = 'hidden';
                    const overlayCanvas = await html2canvas(element, { allowTaint: true, useCORS: true, backgroundColor: null, scale: 2 });
                    const overlayBlob = await new Promise<Blob | null>(resolve => overlayCanvas.toBlob(resolve, 'image/png'));
                    if (overlayBlob) zip.file(`slide-${i + 1}_overlay.png`, overlayBlob);
                    if (videoElement) videoElement.style.visibility = 'visible';
                } else {
                    const elementWidth = element.offsetWidth;
                    const targetWidth = 1080; 
                    const scaleFactor = targetWidth / elementWidth;
                    const finalBgColor = slide?.backgroundColor ?? currentCarousel.preferences.backgroundColor;
                    const canvas = await html2canvas(element, {
                        allowTaint: true, useCORS: true, backgroundColor: visualUrl ? null : finalBgColor, scale: scaleFactor, 
                    });
                    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                    if (blob) zip.file(`slide-${i + 1}.png`, blob);
                }
                element.style.transform = originalTransform;
                element.style.transition = originalTransition;
                element.style.boxShadow = originalBoxShadow;
                element.style.borderRadius = originalBorderRadius;
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(zipBlob);
            const safeTitle = currentCarousel.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.download = `${safeTitle || 'carousel'}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            incrementDownloadCount();

        } catch (error) {
            console.error("Failed to download carousel:", error);
            setError(t('errorDownload'));
        } finally {
            setIsDownloading(false);
        }
    };

    // Design & Formatting Handlers
    const handleUpdateCarouselPreferences = (updates: Partial<DesignPreferences>, topicValue: string) => {
        setCurrentCarousel(prev => {
            if (prev) {
                const newCarousel = { ...prev, preferences: { ...prev.preferences, ...updates } };
                saveCarouselToDb(newCarousel);
                return newCarousel;
            }
            return {
                id: crypto.randomUUID(),
                title: topicValue,
                createdAt: new Date().toISOString(),
                slides: [],
                category: user?.niche[0] || 'General',
                preferences: {
                    ...defaultSettings.brandKit!,
                    ...{
                        backgroundColor: '#FFFFFF',
                        fontColor: '#111827',
                        backgroundOpacity: 1,
                        style: 'Minimalist' as any,
                        font: 'Inter' as any,
                        aspectRatio: '1:1' as any,
                        backgroundImage: undefined,
                        brandingText: '',
                        brandingStyle: { color: '#111827', opacity: 0.75, position: 'bottom-right', fontSize: 0.7 },
                        headlineStyle: { fontSize: 1.4, fontWeight: 'bold', textAlign: 'center', textStroke: { color: '#000000', width: 0 } },
                        bodyStyle: { fontSize: 0.8, textAlign: 'center', textStroke: { color: '#000000', width: 0 } },
                        slideNumberStyle: { show: false, color: '#FFFFFF', opacity: 0.8, position: 'top-right', fontSize: 0.7 },
                    },
                    ...updates,
                },
            };
        });
    };

    const handleClearSlideOverrides = (property: keyof SlideData) => {
        setCurrentCarousel(prev => {
            if (!prev) return null;
            const updatedSlides = prev.slides.map(slide => {
                const newSlide = { ...slide };
                delete newSlide[property];
                return newSlide;
            });
            const newCarousel = { ...prev, slides: updatedSlides };
            saveCarouselToDb(newCarousel);
            return newCarousel;
        });
    };

    const handleMoveSlide = (slideId: string, direction: 'left' | 'right') => {
        if (!currentCarousel) return;
        const slides = [...currentCarousel.slides];
        const index = slides.findIndex(s => s.id === slideId);
        if (index === -1) return;
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= slides.length) return;
        
        [slides[index], slides[newIndex]] = [slides[newIndex], slides[index]];
        const newCarousel = { ...currentCarousel, slides };
        setCurrentCarousel(newCarousel);
        saveCarouselToDb(newCarousel);
    };

    const handleApplyBrandKit = () => {
        if (!settings.brandKit) return;
        const { colors, fonts, brandingText, brandingStyle, slideNumberStyle } = settings.brandKit;
        const mainFont = fonts.body || 'Inter' as any;
        handleUpdateCarouselPreferences({
            backgroundColor: colors.primary,
            fontColor: colors.text,
            font: mainFont,
            brandingText: brandingText,
            brandingStyle: brandingStyle,
            slideNumberStyle: slideNumberStyle,
            headlineStyle: { ...currentCarousel?.preferences.headlineStyle },
            bodyStyle: { ...currentCarousel?.preferences.bodyStyle }
        }, currentTopic);
        handleClearSlideOverrides('backgroundColor');
        handleClearSlideOverrides('fontColor');
    };

    // Misc Handlers
    const handleRegenerateContent = async (slideId: string, part: 'headline' | 'body') => {
        if (!currentCarousel || regeneratingPart) return;
        const slide = currentCarousel.slides.find(s => s.id === slideId);
        if (!slide) return;
        if (!settings.apiKey) { setError(t('errorApiKeyNotConfigured')); return; }
        setRegeneratingPart({ slideId, part });
        setError(null);
        try {
            const newText = await regenerateSlideContent(currentCarousel.title, slide, part, settings);
            handleUpdateSlide(slideId, { [part]: newText });
        } catch (err: any) { setError(parseAndDisplayError(err)); } 
        finally { setRegeneratingPart(null); }
    };

    const handleGenerateCaption = async () => {
        if (!currentCarousel) return;
        setIsCaptionModalOpen(true);
        if (!settings.apiKey) { setError(t('errorApiKeyNotConfigured')); setIsGeneratingCaption(false); return; }
        setIsGeneratingCaption(true); setGeneratedCaption(''); setError(null);
        try {
            const caption = await generateCaption(currentCarousel, settings);
            setGeneratedCaption(caption);
        } catch (err: any) { setError(parseAndDisplayError(err)); } 
        finally { setIsGeneratingCaption(false); }
    };

    const handleGenerateThread = async () => {
        if (!currentCarousel) return;
        setIsThreadModalOpen(true);
        if (!settings.apiKey) { setError(t('errorApiKeyNotConfigured')); setIsGeneratingThread(false); return; }
        setIsGeneratingThread(true); setGeneratedThread(''); setError(null);
        try {
            const thread = await generateThreadFromCarousel(currentCarousel, settings);
            setGeneratedThread(thread);
        } catch (err: any) { setError(parseAndDisplayError(err)); } 
        finally { setIsGeneratingThread(false); }
    };

    const handleEditImageForSlide = async (slideId: string, editPrompt: string) => {
        if (!currentCarousel || !editPrompt) return;
        const slide = currentCarousel.slides.find(s => s.id === slideId);
        if (!slide?.backgroundImage || !slide.backgroundImage.startsWith('data:image')) return;
        setIsGeneratingImageForSlide(slideId); setError(null);
        try {
            const [meta, base64Data] = slide.backgroundImage.split(',');
            const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/png';
            const newImageUrl = await editImage(base64Data, mimeType, editPrompt, settings);
            handleUpdateSlide(slideId, { backgroundImage: newImageUrl });
        } catch (err: any) { setError(parseAndDisplayError(err)); } 
        finally { setIsGeneratingImageForSlide(null); }
    };

    const handleGetDesignSuggestion = async () => {
        if (!currentCarousel) return;
        setIsSuggestingDesign(true); setError(null);
        try {
            const suggestion = await getDesignSuggestion(currentCarousel.title, currentCarousel.category, settings);
            handleUpdateCarouselPreferences({ ...suggestion }, currentTopic);
        } catch (err: any) { setError(parseAndDisplayError(err)); } 
        finally { setIsSuggestingDesign(false); }
    };

    const handleApplyAssistantSuggestion = (suggestion: string, type: 'hook' | 'cta') => {
        if (!selectedSlideId) return;
        const fieldToUpdate = type === 'hook' ? 'headline' : 'body';
        handleUpdateSlide(selectedSlideId, { [fieldToUpdate]: suggestion });
        setIsAssistantOpen(false);
    };

    const handleUploadVisualForSlide = (e: React.ChangeEvent<HTMLInputElement>, slideId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const visualUrl = reader.result as string;
                handleUpdateSlide(slideId, { backgroundImage: visualUrl });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveVisualForSlide = (slideId: string) => handleUpdateSlide(slideId, { backgroundImage: undefined });

    const selectedSlide = React.useMemo(() => currentCarousel?.slides.find(s => s.id === selectedSlideId), [currentCarousel, selectedSlideId]);
    
    const mostUsedCategory = React.useMemo(() => {
        if (carouselHistory.length === 0) return 'N/A';
        const categoryCounts = carouselHistory.reduce((acc, carousel) => {
            acc[carousel.category] = (acc[carousel.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(categoryCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }, [carouselHistory]);

    if (isLoadingUser) {
        return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader text="" /></div>;
    }

    return (
        <>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route element={
                    <MainLayout 
                        user={user}
                        onLogout={handleLogout}
                        onDashboard={goToDashboard}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        language={language}
                        onLanguageChange={handleLanguageChange}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                        t={t}
                        isSettingsOpen={isSettingsOpen}
                    />
                }>
                    <Route path="/dashboard" element={
                        <Dashboard
                            onNewCarousel={startNewCarousel}
                            onShowTutorial={() => navigate('/tutorial')}
                            history={carouselHistory}
                            onEdit={handleEditCarousel}
                            onDelete={deleteCarousel}
                            onClearHistory={clearHistory}
                            t={t}
                            downloadCount={downloadCount}
                            mostUsedCategory={mostUsedCategory}
                            localHistoryCount={localHistoryCount}
                            onMigrateLocalData={handleMigrateLocalData}
                        />
                    } />
                    <Route path="/generator" element={
                        <Generator
                            user={user!}
                            isGenerating={isGenerating}
                            generationMessage={generationMessage}
                            error={error}
                            onErrorDismiss={dismissError}
                            onGenerate={handleGenerateCarousel}
                            currentCarousel={currentCarousel}
                            setCurrentCarousel={setCurrentCarousel}
                            selectedSlide={selectedSlide}
                            onSelectSlide={setSelectedSlideId}
                            onUpdateSlide={handleUpdateSlide}
                            onUpdateCarouselPreferences={handleUpdateCarouselPreferences}
                            onClearSlideOverrides={handleClearSlideOverrides}
                            onMoveSlide={handleMoveSlide}
                            onOpenAssistant={() => setIsAssistantOpen(true)}
                            onOpenCaption={handleGenerateCaption}
                            onOpenThread={handleGenerateThread}
                            onDownload={handleDownloadCarousel}
                            isDownloading={isDownloading}
                            isGeneratingImageForSlide={isGeneratingImageForSlide}
                            isGeneratingVideoForSlide={isGeneratingVideoForSlide}
                            onGenerateImageForSlide={handleGenerateImageForSlide}
                            onGenerateVideoForSlide={handleGenerateVideoForSlide}
                            onGenerateAllVideos={handleGenerateAllVideos}
                            onEditImageForSlide={handleEditImageForSlide}
                            onGenerateAllImages={handleGenerateAllImages}
                            onGetDesignSuggestion={handleGetDesignSuggestion}
                            isSuggestingDesign={isSuggestingDesign}
                            onRegenerateContent={handleRegenerateContent}
                            onUploadVisualForSlide={handleUploadVisualForSlide}
                            onRemoveVisualForSlide={handleRemoveVisualForSlide}
                            onApplyBrandKit={handleApplyBrandKit}
                            brandKitConfigured={!!settings.brandKit}
                            t={t}
                            regeneratingPart={regeneratingPart}
                        />
                    } />
                    <Route path="/tutorial" element={
                        <TutorialScreen
                            onBack={() => navigate('/dashboard')}
                            content={translations[language].tutorial}
                        />
                    } />
                </Route>

                <Route path="/login" element={
                    <LoginScreen 
                        onGoogleLogin={handleGoogleLogin} 
                        onEmailLogin={handleEmailLogin}
                        onEmailSignUp={handleEmailSignUp}
                        t={t} 
                        error={error} 
                        onErrorDismiss={dismissError}
                        mode="login"
                        onSwitchMode={(m) => navigate(m === 'login' ? '/login' : '/signup')}
                    />
                } />
                <Route path="/signup" element={
                    <LoginScreen 
                        onGoogleLogin={handleGoogleLogin} 
                        onEmailLogin={handleEmailLogin}
                        onEmailSignUp={handleEmailSignUp}
                        t={t} 
                        error={error} 
                        onErrorDismiss={dismissError}
                        mode="signup"
                        onSwitchMode={(m) => navigate(m === 'login' ? '/login' : '/signup')}
                    />
                } />
                <Route path="/profile-setup" element={
                    <ProfileSetupModal user={user!} onSetupComplete={handleProfileSetup} t={t} />
                } />
                
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>

            {/* Modals */}
            {isAssistantOpen && (
                <AiAssistantModal 
                    topic={currentTopic}
                    onClose={() => setIsAssistantOpen(false)}
                    settings={settings}
                    t={t}
                    parseError={parseAndDisplayError}
                    onApplySuggestion={handleApplyAssistantSuggestion}
                    selectedSlideId={selectedSlideId}
                />
            )}
            {isCaptionModalOpen && (
                <CaptionModal
                    topic={currentTopic}
                    onClose={() => setIsCaptionModalOpen(false)}
                    isLoading={isGeneratingCaption}
                    caption={generatedCaption}
                    error={error}
                    t={t}
                />
            )}
            {isThreadModalOpen && (
                <ThreadModal
                    onClose={() => {
                        setIsThreadModalOpen(false);
                        setError(null);
                    }}
                    isLoading={isGeneratingThread}
                    threadContent={generatedThread}
                    error={error}
                    t={t}
                />
            )}
            {isSettingsOpen && (
                <SettingsModal
                    currentSettings={settings}
                    user={user}
                    onClose={() => setIsSettingsOpen(false)}
                    onSave={handleSaveSettings}
                    onUpdateUser={updateUser}
                    t={t}
                    onShowTutorial={() => {
                        setIsSettingsOpen(false);
                        navigate('/tutorial');
                    }}
                />
            )}
        </>
    );
}