
import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { UserProfile, Language } from '../types';
import type { TFunction } from '../App';
import { SparklesIcon, SettingsIcon, GiftIcon, LogoutIcon, MoonIcon, SunIcon, HomeIcon } from './icons';

export const Header: React.FC<{
    user: UserProfile | null;
    onLogout: () => void;
    onDashboard: () => void;
    onOpenSettings: () => void;
    language: Language;
    onLanguageChange: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    t: TFunction;
}> = ({ user, onLogout, onDashboard, onOpenSettings, language, onLanguageChange, theme, onToggleTheme, t }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <header className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-all duration-300">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6">
                <div className="flex items-center justify-between h-12 sm:h-12">
                    <div className="flex items-center gap-2 lg:gap-4">
                        <div className="flex items-center space-x-1.5 cursor-pointer group" onClick={onDashboard}>
                            <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-1 rounded-md shadow-sm group-hover:shadow-md transition-all duration-300">
                                <SparklesIcon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <h1 className="text-sm sm:text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 tracking-tight">CarouMate</h1>
                        </div>

                        {/* Desktop Navigation */}
                        {user && (
                            <nav className="hidden md:flex items-center space-x-1">
                                <button
                                    onClick={() => handleNavigate('/dashboard')}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all duration-200 ${
                                        currentPath === '/dashboard'
                                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 ring-1 ring-primary-200 dark:ring-primary-800/50'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <HomeIcon className={`w-3 h-3 ${currentPath === '/dashboard' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                                    <span>{t('dashboardTitle')}</span>
                                </button>
                                <button
                                    onClick={() => handleNavigate('/generator')}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all duration-200 ${
                                        currentPath === '/generator'
                                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 ring-1 ring-primary-200 dark:ring-primary-800/50'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <SparklesIcon className={`w-3 h-3 ${currentPath === '/generator' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                                    <span>{t('generator')}</span>
                                </button>
                            </nav>
                        )}
                    </div>

                    {user && (
                        <div className="flex items-center space-x-1">
                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 hidden lg:block mr-1">
                                {t('welcome', { name: user.name.split(' ')[0] })}
                            </span>
                            
                            <div className="h-3 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block mx-1"></div>

                            <button
                                onClick={onLanguageChange}
                                className="p-1 text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 w-6 h-6 flex items-center justify-center"
                                aria-label={t('languageAriaLabel')}
                            >
                                {language === 'en' ? 'ID' : 'EN'}
                            </button>
                            
                            <button
                                onClick={onToggleTheme}
                                className="p-1 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded hover:bg-yellow-50 dark:hover:bg-gray-700 hover:text-yellow-600 dark:hover:text-yellow-300 transition-all duration-200 h-6 w-6 flex items-center justify-center"
                                aria-label={t('toggleThemeAriaLabel')}
                            >
                                {theme === 'light' ? <MoonIcon className="w-3 h-3" /> : <SunIcon className="w-3 h-3" />}
                            </button>
                            
                            <button
                                onClick={onOpenSettings}
                                className="hidden md:flex p-1 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 h-6 w-6 items-center justify-center"
                                aria-label={t('settingsAriaLabel')}
                            >
                                <SettingsIcon className="w-3 h-3" />
                            </button>
                            
                            <a
                                href="http://lynk.id/pasanaktidur/s/re2yoep3v6r0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden md:inline-flex items-center text-[9px] font-bold text-white bg-gradient-to-r from-accent-500 to-accent-600 rounded-full hover:from-accent-600 hover:to-accent-700 shadow-sm hover:shadow transition-all duration-200 px-2 py-0.5"
                                aria-label={t('donate')}
                            >
                                <GiftIcon className="w-2.5 h-2.5 mr-1" />
                                {t('donate')}
                            </a>
                            
                            <button
                                onClick={onLogout}
                                className="inline-flex items-center text-[9px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border border-transparent rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors px-2 py-0.5 ml-1"
                                aria-label={t('logout')}
                            >
                                <span className="hidden sm:inline">{t('logout')}</span>
                                <LogoutIcon className="sm:hidden w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
