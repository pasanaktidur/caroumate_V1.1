import * as React from 'react';
import type { AppView } from '../types';
import type { TFunction } from '../App';
import { HomeIcon, SparklesIcon } from './icons';

export const Sidebar: React.FC<{
    currentView: AppView;
    onNavigate: (view: AppView) => void;
    t: TFunction;
}> = ({ currentView, onNavigate, t }) => {
    
    const navItems = [
        { view: 'DASHBOARD' as AppView, label: t('dashboardTitle'), icon: <HomeIcon className="w-5 h-5" /> },
        { view: 'GENERATOR' as AppView, label: t('generator'), icon: <SparklesIcon className="w-5 h-5" /> },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 h-full flex-shrink-0 z-30">
            <div className="p-4 space-y-1 mt-4">
                {navItems.map(item => {
                    const isActive = currentView === item.view;
                    return (
                        <button
                            key={item.view}
                            onClick={() => onNavigate(item.view)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                                isActive 
                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800/50' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            <span className={`transition-colors duration-200 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400 animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};