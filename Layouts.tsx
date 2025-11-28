import * as React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MobileFooter } from './MobileFooter';
import { Footer } from './Footer';
import type { UserProfile, Language, AppView } from '../types';
import type { TFunction } from '../App';

interface MainLayoutProps {
    user: UserProfile | null;
    onLogout: () => void;
    onDashboard: () => void;
    onOpenSettings: () => void;
    language: Language;
    onLanguageChange: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    t: TFunction;
    isSettingsOpen: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = (props) => {
    const navigate = useNavigate();
    const location = useLocation();

    const getCurrentView = (): AppView => {
        const path = location.pathname;
        if (path.includes('/dashboard')) return 'DASHBOARD';
        if (path.includes('/generator')) return 'GENERATOR';
        return 'DASHBOARD';
    };

    const handleMobileNavigate = (view: AppView) => {
        if (view === 'SETTINGS') {
            props.onOpenSettings();
        } else if (view === 'DASHBOARD') {
            navigate('/dashboard');
        } else if (view === 'GENERATOR') {
            navigate('/generator');
        }
    };

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
            <Header 
                user={props.user}
                onLogout={props.onLogout}
                onDashboard={props.onDashboard}
                onOpenSettings={props.onOpenSettings}
                language={props.language}
                onLanguageChange={props.onLanguageChange}
                theme={props.theme}
                onToggleTheme={props.onToggleTheme}
                t={props.t}
            />
            <div className="flex flex-col flex-grow w-full min-w-0 relative bg-gray-50 dark:bg-gray-950 overflow-hidden">
                <main className="flex-grow w-full relative transition-all duration-300 overflow-y-auto custom-scrollbar">
                    <Outlet />
                    <Footer className="block" />
                </main>
            </div>
            {props.user && props.user.profileComplete && (
                <MobileFooter
                    currentView={getCurrentView()}
                    onNavigate={handleMobileNavigate}
                    isSettingsOpen={props.isSettingsOpen}
                    t={props.t}
                />
            )}
        </div>
    );
};