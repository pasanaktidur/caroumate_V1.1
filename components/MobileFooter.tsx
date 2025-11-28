
import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppView } from '../types';
import type { TFunction } from '../App';
import { HomeIcon, SparklesIcon, SettingsIcon, GiftIcon } from './icons';

export const MobileFooter: React.FC<{
    currentView: AppView; // Kept for interface compatibility, derived internally
    onNavigate: (view: AppView) => void;
    t: TFunction;
    isSettingsOpen?: boolean;
}> = ({ onNavigate, t, isSettingsOpen }) => {
    const location = useLocation();
    
    // Determine current view from location for highlighting
    const getCurrentView = (): 'DASHBOARD' | 'GENERATOR' => {
        if (location.pathname.includes('/generator')) return 'GENERATOR';
        return 'DASHBOARD';
    };

    const currentView = getCurrentView();
    
    const navItems = [
        { view: 'DASHBOARD' as AppView, label: t('dashboardTitle'), icon: <HomeIcon className="w-5 h-5 mx-auto mb-0.5" /> },
        { view: 'GENERATOR' as AppView, label: t('generator'), icon: <SparklesIcon className="w-5 h-5 mx-auto mb-0.5" /> },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-t-lg z-50">
            <div className="flex justify-around items-center h-14">
                {navItems.map(item => (
                    <button
                        key={item.view}
                        onClick={() => onNavigate(item.view)}
                        className={`flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors duration-200 ${
                            currentView === item.view && !isSettingsOpen
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                        }`}
                        aria-current={currentView === item.view ? 'page' : undefined}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
                 <button
                    onClick={() => onNavigate('SETTINGS')}
                    className={`flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors duration-200 ${
                        isSettingsOpen
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                    aria-current={isSettingsOpen ? 'page' : undefined}
                    aria-label={t('settingsAriaLabel')}
                >
                    <SettingsIcon className="w-5 h-5 mx-auto mb-0.5" />
                    <span>{t('settingsTitle')}</span>
                </button>
                <a
                    href="http://lynk.id/pasanaktidur/s/re2yoep3v6r0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center w-full h-full text-[10px] font-medium text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors duration-200"
                    aria-label={t('donate')}
                >
                    <GiftIcon className="w-5 h-5 mx-auto mb-0.5" />
                    <span>{t('donate')}</span>
                </a>
            </div>
        </div>
    );
};
