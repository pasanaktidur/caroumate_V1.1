
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { HISTORY_STORAGE_KEY, DOWNLOADS_STORAGE_KEY } from '../lib/constants';
import type { Carousel, UserProfile } from '../types';

export function useCarouselHistory(user: UserProfile | null) {
    const [carouselHistory, setCarouselHistory] = useState<Carousel[]>([]);
    const [localHistoryCount, setLocalHistoryCount] = useState<number>(0);
    const [downloadCount, setDownloadCount] = useState<number>(() => {
        try {
            const savedCount = localStorage.getItem(DOWNLOADS_STORAGE_KEY);
            return savedCount ? JSON.parse(savedCount) : 0;
        } catch { return 0; }
    });
    const [historyError, setHistoryError] = useState<string | null>(null);

    // Check for local storage data on load
    useEffect(() => {
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

    const fetchHistory = useCallback(async () => {
        if (!user) return;
        
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user?.id;
            if (!userId) return;

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
                        ...s.styles
                    }))
                }));
                setCarouselHistory(formattedHistory);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    }, [user]);

    // Fetch history when user changes
    useEffect(() => {
        if (user) {
            fetchHistory();
        } else {
            setCarouselHistory([]);
        }
    }, [user, fetchHistory]);

    const saveCarouselToDb = async (carousel: Carousel) => {
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) return;

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

            if (carouselError) throw carouselError;

            // 2. Prepare Slides
            const slidesPayload = carousel.slides.map((s, index) => {
                const { id, headline, body, visual_prompt, backgroundImage, ...styles } = s;
                return {
                    id: s.id,
                    carousel_id: carousel.id,
                    headline,
                    body,
                    visual_prompt,
                    background_image: backgroundImage,
                    styles: styles,
                    order: index
                };
            });

            // 3. Upsert Slides
            const { error: slidesError } = await supabase
                .from('slides')
                .upsert(slidesPayload);
            
            if (slidesError) throw slidesError;

            // Update local state
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
            setHistoryError(`Failed to save changes to the cloud: ${e.message || 'Unknown error'}`);
        }
    };

    const handleDeleteCarousel = async (carouselId: string) => {
        setCarouselHistory(prev => prev.filter(c => c.id !== carouselId));
        const { error } = await supabase.from('carousels').delete().eq('id', carouselId);
        if (error) {
            console.error("Delete failed:", error);
            fetchHistory();
        }
    };

    const handleClearHistory = async () => {
        setCarouselHistory([]);
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId) {
            await supabase.from('carousels').delete().eq('user_id', userId);
        }
    };

    const handleMigrateLocalData = async () => {
        if (!user) return;
        const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!saved) return;

        try {
            const localCarousels: Carousel[] = JSON.parse(saved);
            if (localCarousels.length === 0) return;

            // eslint-disable-next-line no-restricted-globals
            const confirmSync = confirm(`We found ${localCarousels.length} carousels on your device. Do you want to sync them to your account?`);
            if (!confirmSync) return;

            let successCount = 0;
            for (const carousel of localCarousels) {
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(carousel.id);
                
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

            localStorage.removeItem(HISTORY_STORAGE_KEY);
            setLocalHistoryCount(0);
            fetchHistory();
            alert(`Successfully synced ${successCount} carousels!`);

        } catch (e) {
            console.error("Migration failed:", e);
            alert("Migration partially failed. Check console for details.");
        }
    };

    const incrementDownloadCount = () => {
        const newCount = downloadCount + 1;
        setDownloadCount(newCount);
        localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(newCount));
    };

    return {
        carouselHistory,
        localHistoryCount,
        downloadCount,
        historyError,
        setHistoryError,
        saveCarouselToDb,
        handleDeleteCarousel,
        handleClearHistory,
        handleMigrateLocalData,
        incrementDownloadCount
    };
}
