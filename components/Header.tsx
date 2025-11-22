import * as React from 'react';
import type { UserProfile, Language } from '../types';
import type { TFunction } from '../App';
import { SparklesIcon, SettingsIcon, GiftIcon, LogoutIcon, MoonIcon, SunIcon } from './icons';

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
}> = ({ user, onLogout, onDashboard, onOpenSettings, language, onLanguageChange, theme, onToggleTheme, t }) => (
    <header className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-2.5 cursor-pointer group" onClick={onDashboard}>
                    <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-1.5 rounded-lg shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all duration-300">
                        <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 tracking-tight">CarouMate</h1>
                </div>
                {user && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hidden md:block mr-2">
                            {t('welcome', { name: user.name.split(' ')[0] })}
                        </span>
                        
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block mx-2"></div>

                        <button
                            onClick={onLanguageChange}
                            className="p-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
                            aria-label={t('languageAriaLabel')}
                        >
                            {language === 'en' ? 'ID' : 'EN'}
                        </button>
                        
                        <button
                            onClick={onToggleTheme}
                            className="p-2 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-700 hover:text-yellow-600 dark:hover:text-yellow-300 transition-all duration-200"
                            aria-label={t('toggleThemeAriaLabel')}
                        >
                            {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
                        </button>
                        
                        <button
                            onClick={onOpenSettings}
                            className="hidden md:inline-flex p-2 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200"
                            aria-label={t('settingsAriaLabel')}
                        >
                            <SettingsIcon className="w-4 h-4" />
                        </button>
                        
                        <a
                            href="http://lynk.id/pasanaktidur/s/re2yoep3v6r0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:inline-flex items-center text-xs font-semibold text-white bg-gradient-to-r from-accent-500 to-accent-600 rounded-full hover:from-accent-600 hover:to-accent-700 shadow-md shadow-accent-500/20 transition-all duration-200 px-4 py-2"
                            aria-label={t('donate')}
                        >
                            <GiftIcon className="w-4 h-4 mr-1.5" />
                            {t('donate')}
                        </a>
                        
                        <button
                            onClick={onLogout}
                            className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-transparent rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors sm:px-4 sm:py-2 p-2 ml-2"
                            aria-label={t('logout')}
                        >
                            <span className="hidden sm:inline">{t('logout')}</span>
                            <LogoutIcon className="sm:hidden w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    </header>
);