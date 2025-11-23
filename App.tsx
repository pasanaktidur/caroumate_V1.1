
import * as React from 'react';
import type { AppView, UserProfile, Carousel, SlideData, DesignPreferences, AppSettings } from './types';
import { AIModel } from './types';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { 
    generateCarouselContent, getAiAssistance, generateCaption, generateImage, 
    regenerateSlideContent, generateThreadFromCarousel, generateVideo, editImage, getDesignSuggestion 
} from './services/geminiService';
import { supabase } from './lib/supabaseClient';

import { translations } from './lib/translations';
import { SETTINGS_STORAGE_KEY, DOWNLOADS_STORAGE_KEY, HISTORY_STORAGE_KEY, defaultSettings } from './lib/constants';

import { Header } from './components/Header';
import { MobileFooter } from './components/MobileFooter';
import { Footer } from './components/Footer';
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
    
    // --- State Initialization ---
    const [user, setUser] = React.useState<UserProfile | null>(null);
    const [view, setView] = React.useState<AppView>('LOADING'); // Start in LOADING state

    const [previousView, setPreviousView] = React.useState<AppView>('DASHBOARD');
    
    const [carouselHistory, setCarouselHistory] = React.useState<Carousel[]>([]);
    const [localHistoryCount, setLocalHistoryCount] = React.useState<number>(0);
    
    const [downloadCount, setDownloadCount] = React.useState<number>(() => {
        try {
            const savedCount = localStorage.getItem(DOWNLOADS_STORAGE_KEY);
            return savedCount ? JSON.parse(savedCount) : 0;
        } catch { return 0; }
    });

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

    // Settings remain in localStorage for this version, except strict data
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
                }
            };
        } catch (error) {
            console.error("Could not load settings:", error);
            return defaultSettings;
        }
    });
    
    // Check for local storage data on load
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setLocalHistoryCount(parsed.length);
                }
            }
        } catch (e) {}
    }, []);

    const handleLanguageChange = () => {
        setLanguage(lang => lang === 'en' ? 'id' : 'en');
    };
    
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

    // --- URL Routing Logic ---
    const determineInitialView = (): AppView | null => {
        if (typeof window === 'undefined') return null;

        const path = window.location.pathname.toLowerCase();
        
        // Path-based routing
        if (path.startsWith('/dashboard')) return 'DASHBOARD';
        if (path.startsWith('/generator')) return 'GENERATOR';

        // Fallback: Check URL Query Params
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        if (viewParam === 'dashboard') return 'DASHBOARD';
        if (viewParam === 'generator') return 'GENERATOR';
        
        return null;
    };

    // Handle Browser Back/Forward Buttons
    React.useEffect(() => {
        const handlePopState = () => {
            const view = determineInitialView();
            if (view && user?.profileComplete) {
                setView(view);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [user]);

    // --- Supabase Authentication & Data Sync ---

    // Fetch carousels from Supabase
    const fetchHistory = React.useCallback(async (userId: string) => {
        try {
            // Fetch carousels and their slides
            const { data: carouselsData, error: carouselsError } = await supabase
                .from('carousels')
                .select('*, slides(*)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (carouselsError) throw carouselsError;

            if (carouselsData) {
                const formattedHistory: Carousel[] = carouselsData.map(c => ({
                    id: c.id,
                    title: c.title,
                    createdAt: c.created_at,
                    category: c.category,
                    preferences: c.preferences,
                    slides: c.slides.sort((a: any, b: any) => a.order - b.order).map((s: any) => ({
                        id: s.id,
                        headline: s.headline,
                        body: s.body,
                        visual_prompt: s.visual_prompt,
                        backgroundImage: s.background_image,
                        ...s.styles // Spread JSONB styles back into flat properties
                    }))
                }));
                setCarouselHistory(formattedHistory);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    }, []);

    // Auth State Listener
    React.useEffect(() => {
        let mounted = true;
        
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;
            if (session?.user) {
                // Clean up URL hash if present (contains access_token)
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    // Replace state to clear hash but keep pathname
                    window.history.replaceState(null, '', window.location.pathname);
                }
                fetchUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
            } else {
                setView('LOGIN');
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            if (session?.user) {
                fetchUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
            } else {
                setUser(null);
                setCarouselHistory([]);
                setView('LOGIN');
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchHistory]);

    const fetchUserProfile = async (userId: string, email: string, metadata: any) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                console.error("Error fetching profile:", error);
            }

            if (data) {
                const userProfile: UserProfile = {
                    name: data.full_name || metadata.full_name || email.split('@')[0],
                    email: data.email || email,
                    picture: data.avatar_url || metadata.avatar_url || '',
                    niche: data.niche || [],
                    profileComplete: data.is_profile_complete
                };
                setUser(userProfile);
                if (data.is_profile_complete) {
                    const intendedView = determineInitialView();
                    setView(intendedView || 'DASHBOARD');
                    fetchHistory(userId);
                } else {
                    setView('PROFILE_SETUP');
                }
            } else {
                // Profile doesn't exist in table yet, so they need to setup.
                const newUser: UserProfile = {
                    name: metadata.full_name || email.split('@')[0],
                    email: email,
                    picture: metadata.avatar_url || '',
                    niche: [],
                    profileComplete: false
                };
                setUser(newUser);
                setView('PROFILE_SETUP');
            }
        } catch (e) {
            console.error("Profile fetch error:", e);
            setView('LOGIN');
        }
    };

    // --- Helper: Save/Update Full Carousel to Supabase ---
    const saveCarouselToDb = async (carousel: Carousel) => {
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) return;
        
        console.log(`[SUPABASE START] Saving carousel "${carousel.title}"...`);

        try {
            // 1. Upsert Carousel
            const { error: carouselError } = await supabase
                .from('carousels')
                .upsert({
                    id: carousel.id,
                    user_id: userId,
                    title: carousel.title,
                    category: carousel.category,
                    preferences: carousel.preferences,
                    created_at: carousel.createdAt
                });

            if (carouselError) {
                 console.error("[SUPABASE ERROR] Failed to save carousel meta:", carouselError);
                 throw carouselError;
            }

            // 2. Prepare Slides
            // Note: We need to map frontend SlideData to DB columns
            const slidesPayload = carousel.slides.map((s, index) => {
                // Extract styles separately
                const { id, headline, body, visual_prompt, backgroundImage, ...styles } = s;
                return {
                    id: s.id,
                    carousel_id: carousel.id,
                    headline,
                    body,
                    visual_prompt,
                    background_image: backgroundImage,
                    styles: styles, // JSONB column
                    order: index
                };
            });

            // 3. Upsert Slides
            const { error: slidesError } = await supabase
                .from('slides')
                .upsert(slidesPayload);
            
            if (slidesError) {
                console.error("[SUPABASE ERROR] Failed to save slides:", slidesError);
                throw slidesError;
            }

            console.log(`[SUPABASE SUCCESS] Carousel "${carousel.title}" saved successfully.`);

            // Update local history state to match
            setCarouselHistory(prev => {
                const exists = prev.find(c => c.id === carousel.id);
                if (exists) {
                    return prev.map(c => c.id === carousel.id ? carousel : c);
                } else {
                    return [carousel, ...prev];
                }
            });

        } catch (e: any) {
            console.error("Error saving carousel to DB:", e);
            setError(`Failed to save changes to the cloud: ${e.message || 'Unknown error'}`);
        }
    };

    // --- ---

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

    const handleSaveSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error("Could not save settings:", error);
        }
        setIsSettingsOpen(false);
    };

    const handleLogin = async () => {
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard' // Optional: explicit redirect
                }
            });
            if (error) {
                console.error("Login error:", error);
                if (error.message?.includes("provider is not enabled")) {
                     setError("Google Login belum diaktifkan di Dashboard Supabase Anda. Silakan aktifkan di Authentication > Providers.");
                } else {
                    setError(error.message);
                }
            }
        } catch (err: any) {
            console.error("Login exception:", err);
            setError(err.message || "Failed to initialize login.");
        }
    };
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
        // State clearing is handled by onAuthStateChange listener
    };

    const handleProfileSetup = async (profile: Omit<UserProfile, 'profileComplete'>) => {
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) return;

        const cleanedProfile = {
            ...profile,
            niche: profile.niche.filter(n => n.trim() !== ''),
        };

        // Save to Supabase
        const { error } = await supabase.from('profiles').upsert({
            id: userId,
            full_name: cleanedProfile.name,
            email: cleanedProfile.email,
            avatar_url: cleanedProfile.picture,
            niche: cleanedProfile.niche,
            is_profile_complete: true
        });

        if (error) {
            console.error("Error saving profile:", error);
            setError("Failed to save profile. Please try again.");
            return;
        }

        setUser({ ...cleanedProfile, profileComplete: true });
        setView('DASHBOARD');
        fetchHistory(userId);
    };
    
    const handleMigrateLocalData = async () => {
        if (!user) return;
        const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!saved) return;

        try {
            const localCarousels: Carousel[] = JSON.parse(saved);
            if (localCarousels.length === 0) return;

            const confirm = window.confirm(`We found ${localCarousels.length} carousels on your device. Do you want to sync them to your account?`);
            if (!confirm) return;

            let successCount = 0;
            // Use a Promise.all or sequential loop. Sequential is safer to avoid rate limits or connection issues
            for (const carousel of localCarousels) {
                // Ensure IDs are valid UUIDs. Local storage might use random strings, Supabase expects UUID.
                // If existing IDs are not UUIDs, generate new ones.
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(carousel.id);
                
                // Prepare clean carousel for DB
                const cleanCarousel = {
                    ...carousel,
                    id: isUUID ? carousel.id : crypto.randomUUID(),
                    slides: carousel.slides.map(s => ({
                        ...s,
                        id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id) ? s.id : crypto.randomUUID()
                    }))
                };

                await saveCarouselToDb(cleanCarousel);
                successCount++;
            }

            // Clear local storage after success
            localStorage.removeItem(HISTORY_STORAGE_KEY);
            setLocalHistoryCount(0);
            
            // Refresh fetching
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (userId) fetchHistory(userId);

            alert(`Successfully synced ${successCount} carousels!`);

        } catch (e) {
            console.error("Migration failed:", e);
            alert("Migration partially failed. Check console for details.");
        }
    };

    const goToDashboard = () => {
        if (view === 'LOGIN' || view === 'PROFILE_SETUP') return;
        if (currentCarousel) {
            saveCarouselToDb(currentCarousel);
        }
        setCurrentCarousel(null);
        setView('DASHBOARD');
        
        // Push state to browser history
        window.history.pushState(null, '', '/dashboard');
    }

    const startNewCarousel = () => {
        setCurrentCarousel(null);
        setSelectedSlideId(null);
        setView('GENERATOR');
        
        // Push state to browser history
        window.history.pushState(null, '', '/generator');
    };

    const handleEditCarousel = (carouselId: string) => {
        const carouselToEdit = carouselHistory.find(c => c.id === carouselId);
        if (carouselToEdit) {
            setCurrentCarousel(carouselToEdit);
            setCurrentTopic(carouselToEdit.title);
            setSelectedSlideId(carouselToEdit.slides[0]?.id || null);
            setView('GENERATOR');
            
            // Push state
            window.history.pushState(null, '', '/generator');
        }
    };
    
    const handleDeleteCarousel = async (carouselId: string) => {
        if (window.confirm(t('deleteCarouselConfirm'))) {
            // Optimistic update
            setCarouselHistory(prev => prev.filter(c => c.id !== carouselId));
            
            const { error } = await supabase.from('carousels').delete().eq('id', carouselId);
            if (error) {
                console.error("Delete failed:", error);
                fetchHistory((await supabase.auth.getUser()).data.user!.id);
            }
        }
    };

    const handleClearHistory = async () => {
        if (window.confirm(t('clearHistoryConfirm'))) {
            setCarouselHistory([]);
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (userId) {
                await supabase.from('carousels').delete().eq('user_id', userId);
            }
        }
    };
    
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
        // Final Save
        await saveCarouselToDb(updatedCarousel);
        return updatedCarousel;
    };
    
    const executeVideoGenerationForAllSlides = async (carousel: Carousel, settings: AppSettings): Promise<void> => {
        try {
            const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio?.openSelectKey();
            }
        } catch (e) {
            console.error("AI Studio helper not available.", e);
        }

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
            } catch (err: any) {
                 console.error(`Failed to generate video for slide ${i + 1}:`, err);
            } finally {
                setIsGeneratingVideoForSlide(null);
            }
        }
        await saveCarouselToDb(updatedCarousel);
        setGenerationMessage('');
    };


    const handleGenerateCarousel = React.useCallback(async (topic: string, niche: string, preferences: DesignPreferences, magicCreate: boolean) => {
        if (!user) return;
        
        if (!settings.apiKey) {
            setError(t('errorApiKeyNotConfigured'));
            return;
        }

        setIsGenerating(true);
        setError(null);
        setCurrentCarousel(null);
        setCurrentTopic(topic);
        
        let newCarousel: Carousel | null = null;

        try {
            setGenerationMessage(t('generatingContentMessage'));
            const nicheToUse = niche || (user.niche.length > 0 ? user.niche[0] : 'General');
            const slidesContent = await generateCarouselContent(topic, nicheToUse, preferences, settings);

            const initialSlides: SlideData[] = slidesContent.map(s => ({ ...s, id: crypto.randomUUID() }));
            
            newCarousel = {
                id: crypto.randomUUID(),
                title: topic,
                createdAt: new Date().toISOString(),
                slides: initialSlides,
                category: nicheToUse,
                preferences,
            };
            
            setCurrentCarousel(newCarousel);
            setSelectedSlideId(initialSlides[0]?.id ?? null);
            
            // Save initial structure to DB
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
    }, [user, settings, t, parseAndDisplayError]);

    const handleGenerateImageForSlide = async (slideId: string) => {
        if (!currentCarousel) return;
        const slide = currentCarousel.slides.find(s => s.id === slideId);
        if (!slide) return;
    
        setIsGeneratingImageForSlide(slideId);
        setError(null);
    
        try {
            const imageUrl = await generateImage(slide.visual_prompt, currentCarousel.preferences.aspectRatio, settings);
            handleUpdateSlide(slideId, { backgroundImage: imageUrl });
        } catch (err: any) {
            setError(parseAndDisplayError(err));
        } finally {
            setIsGeneratingImageForSlide(null);
        }
    };
    
    const handleGenerateAllImages = async () => {
        if (!currentCarousel) return;
        setIsGenerating(true);
        setError(null);
        try {
            await executeImageGenerationForAllSlides(currentCarousel, settings);
        } catch(err: any) {
            setError(parseAndDisplayError(err));
        } finally {
            setIsGenerating(false);
            setGenerationMessage('');
            setIsGeneratingImageForSlide(null);
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
             if (parsedError.includes("Requested entity was not found.")) {
                setError(t('errorVeoKeyNotFound'));
            } else {
                setError(parsedError);
            }
        } finally {
            setIsGenerating(false);
            setGenerationMessage('');
            setIsGeneratingVideoForSlide(null);
        }
    };

    const handleRegenerateContent = async (slideId: string, part: 'headline' | 'body') => {
        if (!currentCarousel || regeneratingPart) return;
        const slide = currentCarousel.slides.find(s => s.id === slideId);
        if (!slide) return;

        if (!settings.apiKey) {
            setError(t('errorApiKeyNotConfigured'));
            return;
        }
        setRegeneratingPart({ slideId, part });
        setError(null);
        try {
            const newText = await regenerateSlideContent(currentCarousel.title, slide, part, settings);
            handleUpdateSlide(slideId, { [part]: newText });
        } catch (err: any) {
            setError(parseAndDisplayError(err));
        } finally {
            setRegeneratingPart(null);
        }
    };

    const handleGenerateCaption = async () => {
        if (!currentCarousel) return;
        setIsCaptionModalOpen(true);
        if (!settings.apiKey) {
            setError(t('errorApiKeyNotConfigured'));
            setIsGeneratingCaption(false);
            setGeneratedCaption('');
            return;
        }
        setIsGeneratingCaption(true);
        setGeneratedCaption('');
        setError(null);
        try {
            const caption = await generateCaption(currentCarousel, settings);
            setGeneratedCaption(caption);
        } catch (err: any) {
            setError(parseAndDisplayError(err));
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const handleGenerateThread = async () => {
        if (!currentCarousel) return;
        setIsThreadModalOpen(true);
        if (!settings.apiKey) {
            setError(t('errorApiKeyNotConfigured'));
            setIsGeneratingThread(false);
            setGeneratedThread('');
            return;
        }
        setIsGeneratingThread(true);
        setGeneratedThread('');
        setError(null);
        try {
            const thread = await generateThreadFromCarousel(currentCarousel, settings);
            setGeneratedThread(thread);
        } catch (err: any) {
            setError(parseAndDisplayError(err));
        } finally {
            setIsGeneratingThread(false);
        }
    };

    const handleGenerateVideoForSlide = async (slideId: string) => {
        if (!currentCarousel) return;
        const slide = currentCarousel.slides.find(s => s.id === slideId);
        if (!slide) return;

        try {
            const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio?.openSelectKey();
            }
        } catch (e) {
            console.error("AI Studio helper not available.", e);
        }
    
        setIsGeneratingVideoForSlide(slideId);
        setGenerationMessage(t('generatingVideoMessage'));
        setError(null);
    
        try {
            const videoUrl = await generateVideo(slide.visual_prompt, currentCarousel.preferences.aspectRatio, settings);
            handleUpdateSlide(slideId, { backgroundImage: videoUrl });
        } catch (err: any) {
             const parsedError = parseAndDisplayError(err);
            if (parsedError.includes("Requested entity was not found.")) {
                setError(t('errorVeoKeyNotFound'));
            } else {
                setError(parsedError);
            }
        } finally {
            setIsGeneratingVideoForSlide(null);
            setGenerationMessage('');
        }
    };

    const handleEditImageForSlide = async (slideId: string, editPrompt: string) => {
        if (!currentCarousel || !editPrompt) return;
        const slide = currentCarousel.slides.find(s => s.id === slideId);
        if (!slide?.backgroundImage || !slide.backgroundImage.startsWith('data:image')) return;

        setIsGeneratingImageForSlide(slideId);
        setError(null);
        
        try {
            const [meta, base64Data] = slide.backgroundImage.split(',');
            const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/png';
            const newImageUrl = await editImage(base64Data, mimeType, editPrompt, settings);
            handleUpdateSlide(slideId, { backgroundImage: newImageUrl });
        } catch (err: any) {
            setError(parseAndDisplayError(err));
        } finally {
            setIsGeneratingImageForSlide(null);
        }
    };
    
    const handleGetDesignSuggestion = async () => {
        if (!currentCarousel) return;
        setIsSuggestingDesign(true);
        setError(null);
        try {
            const suggestion = await getDesignSuggestion(currentCarousel.title, currentCarousel.category, settings);
            handleUpdateCarouselPreferences({ ...suggestion }, currentTopic);
        } catch (err: any) {
            setError(parseAndDisplayError(err));
        } finally {
            setIsSuggestingDesign(false);
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
                    const videoResponse = await fetch(visualUrl);
                    const videoBlob = await videoResponse.blob();
                    const extension = videoBlob.type.split('/')[1] || 'mp4';
                    zip.file(`slide-${i + 1}.${extension}`, videoBlob);

                    const videoElement = element.querySelector('video');
                    if (videoElement) videoElement.style.visibility = 'hidden';

                    const overlayCanvas = await html2canvas(element, {
                        allowTaint: true,
                        useCORS: true,
                        backgroundColor: null,
                        scale: 2,
                    });
                    const overlayBlob = await new Promise<Blob | null>(resolve => overlayCanvas.toBlob(resolve, 'image/png'));
                    if (overlayBlob) {
                        zip.file(`slide-${i + 1}_overlay.png`, overlayBlob);
                    }
                    if (videoElement) videoElement.style.visibility = 'visible';
                } else {
                    const elementWidth = element.offsetWidth;
                    const targetWidth = 1080; 
                    const scaleFactor = targetWidth / elementWidth;
                    const finalBgColor = slide?.backgroundColor ?? currentCarousel.preferences.backgroundColor;
                    const canvas = await html2canvas(element, {
                        allowTaint: true,
                        useCORS: true,
                        backgroundColor: visualUrl ? null : finalBgColor,
                        scale: scaleFactor, 
                    });
                    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                    if (blob) {
                        zip.file(`slide-${i + 1}.png`, blob);
                    }
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

            const newCount = downloadCount + 1;
            setDownloadCount(newCount);
            localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(newCount));

        } catch (error) {
            console.error("Failed to download carousel:", error);
            setError(t('errorDownload'));
        } finally {
            setIsDownloading(false);
        }
    };

    // Updated to sync with DB
    const handleUpdateSlide = (slideId: string, updates: Partial<SlideData>) => {
        setCurrentCarousel(prev => {
            if (!prev) return null;
            const updatedSlides = prev.slides.map(s => s.id === slideId ? { ...s, ...updates } : s);
            const newCarousel = { ...prev, slides: updatedSlides };
            
            // Debounce the DB save or save immediately if critical? 
            // For now, we save on every update for data integrity in this migration logic
            saveCarouselToDb(newCarousel); 
            
            return newCarousel;
        });
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

    const handleRemoveVisualForSlide = (slideId: string) => {
        handleUpdateSlide(slideId, { backgroundImage: undefined });
    };

    // Updated to sync with DB
    const handleUpdateCarouselPreferences = (updates: Partial<DesignPreferences>, topicValue: string) => {
        setCurrentCarousel(prev => {
            if (prev) {
                const newCarousel = { ...prev, preferences: { ...prev.preferences, ...updates } };
                saveCarouselToDb(newCarousel);
                return newCarousel;
            }
            // Temp creation for new carousel before generation is mostly local state until generation happens
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

    const handleApplyBrandKit = () => {
        if (!settings.brandKit) return;
        const { colors, fonts, brandingText, brandingStyle } = settings.brandKit;
        const mainFont = fonts.body || 'Inter' as any;
        handleUpdateCarouselPreferences({
            backgroundColor: colors.primary,
            fontColor: colors.text,
            font: mainFont,
            brandingText: brandingText,
            brandingStyle: brandingStyle,
            headlineStyle: { ...currentCarousel?.preferences.headlineStyle },
            bodyStyle: { ...currentCarousel?.preferences.bodyStyle }
        }, currentTopic);
        handleClearSlideOverrides('backgroundColor');
        handleClearSlideOverrides('fontColor');
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

    const handleApplyAssistantSuggestion = (suggestion: string, type: 'hook' | 'cta') => {
        if (!selectedSlideId) return;
        const fieldToUpdate = type === 'hook' ? 'headline' : 'body';
        handleUpdateSlide(selectedSlideId, { [fieldToUpdate]: suggestion });
        setIsAssistantOpen(false);
    };

    const selectedSlide = React.useMemo(() => {
        return currentCarousel?.slides.find(s => s.id === selectedSlideId);
    }, [currentCarousel, selectedSlideId]);
    
    const mostUsedCategory = React.useMemo(() => {
        if (carouselHistory.length === 0) return 'N/A';
        const categoryCounts = carouselHistory.reduce((acc, carousel) => {
            acc[carousel.category] = (acc[carousel.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(categoryCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }, [carouselHistory]);

    const renderContent = () => {
        switch (view) {
            case 'LOADING': return <div className="flex h-full items-center justify-center"><Loader text="" /></div>;
            case 'LOGIN': return <LoginScreen onLogin={handleLogin} t={t} error={error} />;
            case 'PROFILE_SETUP': return <ProfileSetupModal user={user!} onSetupComplete={handleProfileSetup} t={t} />;
            case 'DASHBOARD': return (
                <Dashboard
                    onNewCarousel={startNewCarousel}
                    onShowTutorial={() => setView('TUTORIAL')}
                    history={carouselHistory}
                    onEdit={handleEditCarousel}
                    onDelete={handleDeleteCarousel}
                    onClearHistory={handleClearHistory}
                    t={t}
                    downloadCount={downloadCount}
                    mostUsedCategory={mostUsedCategory}
                    localHistoryCount={localHistoryCount}
                    onMigrateLocalData={handleMigrateLocalData}
                />
            );
            case 'GENERATOR': return (
                <Generator
                    user={user!}
                    isGenerating={isGenerating}
                    generationMessage={generationMessage}
                    error={error}
                    onErrorDismiss={() => setError(null)}
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
            );
            case 'SETTINGS': return (
                <SettingsModal
                    currentSettings={settings}
                    onSave={(newSettings) => {
                        handleSaveSettings(newSettings);
                        setView(previousView);
                    }}
                    onClose={() => setView(previousView)}
                    t={t}
                    onShowTutorial={() => setView('TUTORIAL')}
                />
            );
            case 'TUTORIAL': return (
                <TutorialScreen
                    onBack={() => setView('DASHBOARD')}
                    content={translations[language].tutorial}
                />
            );
            default: return <LoginScreen onLogin={handleLogin} t={t} error={error} />;
        }
    };

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
            <Header
                user={user}
                onLogout={handleLogout}
                onDashboard={goToDashboard}
                onOpenSettings={() => setIsSettingsOpen(true)}
                language={language}
                onLanguageChange={handleLanguageChange}
                theme={theme}
                onToggleTheme={toggleTheme}
                t={t}
                currentView={view}
                onNavigate={(v) => {
                    if (v === 'DASHBOARD') goToDashboard();
                    else if (v === 'GENERATOR') startNewCarousel();
                    else setView(v);
                }}
            />
            <div className="flex flex-col flex-grow w-full min-w-0 relative bg-gray-50 dark:bg-gray-950 overflow-hidden">
                <main className={`flex-grow w-full relative transition-all duration-300 overflow-y-auto custom-scrollbar ${view === 'GENERATOR' ? 'lg:overflow-hidden' : ''}`}>
                    {renderContent()}
                </main>
                {view !== 'GENERATOR' && view !== 'LOADING' && view !== 'LOGIN' && (
                    <Footer className={!user ? "block" : "hidden md:block"} />
                )}
            </div>

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
                    onClose={() => setIsSettingsOpen(false)}
                    onSave={handleSaveSettings}
                    t={t}
                    onShowTutorial={() => {
                        setIsSettingsOpen(false);
                        setView('TUTORIAL');
                    }}
                />
            )}
            {user && user.profileComplete && view !== 'LOADING' && (
                <MobileFooter
                    currentView={view}
                    onNavigate={(targetView) => {
                        if (targetView === 'DASHBOARD') {
                            goToDashboard();
                        } else if (targetView === 'SETTINGS') {
                            setPreviousView(view);
                            setView('SETTINGS');
                        } else {
                            setView(targetView);
                        }
                    }}
                    t={t}
                />
            )}
        </div>
    );
}
