import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile } from '../types';

export function useAuth() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const fetchUserProfile = useCallback(async (userId: string, email: string, metadata: any) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
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
                setIsLoadingUser(false);
                
                // Intelligent Redirect
                if (data.is_profile_complete) {
                    const publicPaths = ['/login', '/signup', '/'];
                    if (publicPaths.includes(location.pathname)) {
                        navigate('/dashboard', { replace: true });
                    }
                } else {
                    navigate('/profile-setup', { replace: true });
                }
            } else {
                // New user, profile needs setup
                const newUser: UserProfile = {
                    name: metadata.full_name || email.split('@')[0],
                    email: email,
                    picture: metadata.avatar_url || '',
                    niche: [],
                    profileComplete: false
                };
                setUser(newUser);
                setIsLoadingUser(false);
                navigate('/profile-setup', { replace: true });
            }
        } catch (e) {
            console.error("Profile fetch error:", e);
            setIsLoadingUser(false);
            navigate('/login', { replace: true });
        }
    }, [navigate, location.pathname]);

    useEffect(() => {
        let mounted = true;
        
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!mounted) return;

            if (session?.user) {
                await fetchUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
            } else {
                setIsLoadingUser(false);
                const publicPaths = ['/login', '/signup'];
                if (!publicPaths.includes(location.pathname)) {
                    if (location.pathname !== '/login' && location.pathname !== '/signup') {
                         navigate('/login', { replace: true });
                    }
                }
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            if (session?.user) {
                fetchUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
            } else {
                setUser(null);
                setIsLoadingUser(false);
                const publicPaths = ['/login', '/signup'];
                if (!publicPaths.includes(location.pathname)) {
                    navigate('/login', { replace: true });
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUserProfile, location.pathname, navigate]);

    const handleGoogleLogin = async () => {
        setAuthError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) {
                if (error.message?.includes("provider is not enabled")) {
                     setAuthError("Google Login belum diaktifkan di Dashboard Supabase Anda.");
                } else {
                    setAuthError(error.message);
                }
            }
        } catch (err: any) {
            setAuthError(err.message || "Failed to initialize login.");
        }
    };

    const handleEmailLogin = async (email: string, password: string): Promise<boolean> => {
        setAuthError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setAuthError(error.message);
                return false;
            }
            return true;
        } catch (err: any) {
            setAuthError(err.message);
            return false;
        }
    };

    const handleEmailSignUp = async (email: string, password: string, fullName: string): Promise<boolean> => {
        setAuthError(null);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } },
            });
            if (error) {
                setAuthError(error.message);
                return false;
            }
            return true;
        } catch (err: any) {
            setAuthError(err.message);
            return false;
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleProfileSetup = async (profile: Omit<UserProfile, 'profileComplete'>) => {
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) return;

        const { error } = await supabase.from('profiles').upsert({
            id: userId,
            full_name: profile.name,
            email: profile.email,
            avatar_url: profile.picture,
            niche: profile.niche.filter(n => n.trim() !== ''),
            is_profile_complete: true
        });

        if (error) {
            setAuthError("Failed to save profile. Please try again.");
            return;
        }

        setUser({ ...profile, profileComplete: true } as UserProfile);
        navigate('/dashboard');
    };

    const updateUser = async (updates: Partial<UserProfile>) => {
        if (!user) return;
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) return;

        const { error } = await supabase.from('profiles').update({
            full_name: updates.name,
            niche: updates.niche,
        }).eq('id', userId);

        if (error) {
            setAuthError(`Failed to update profile: ${error.message}`);
            return;
        }
        
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    return {
        user,
        isLoadingUser,
        authError,
        setAuthError,
        handleGoogleLogin,
        handleEmailLogin,
        handleEmailSignUp,
        handleLogout,
        handleProfileSetup,
        updateUser
    };
}