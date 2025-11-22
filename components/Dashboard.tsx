import * as React from 'react';
import type { Carousel } from '../types';
import type { TFunction } from '../App';
import { SparklesIcon, TrashIcon, DocumentTextIcon, DownloadIcon } from './icons';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
        <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
            {icon}
        </div>
        <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
        </div>
    </div>
);

const CarouselCard: React.FC<{ 
    carousel: Carousel; 
    onEdit: (id: string) => void; 
    onDelete: (id: string) => void; 
    t: TFunction;
}> = ({ carousel, onEdit, onDelete, t }) => (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 flex flex-col">
        {/* Card Header / Preview Placeholder */}
        <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden p-4">
            {carousel.slides.length > 0 && (
                <div className="absolute inset-0 opacity-50 blur-xl scale-110">
                     {/* Simulating a blur of the content */}
                     <div className="w-full h-full" style={{ backgroundColor: carousel.preferences.backgroundColor }}></div>
                </div>
            )}
            <div className="relative z-10 h-full flex flex-col justify-center">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {carousel.title}
                </h3>
            </div>
            <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white/80 dark:text-gray-200 dark:bg-black/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-600">
                {carousel.category}
            </span>
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col flex-grow">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                 <span className="flex items-center mr-3">
                    <DocumentTextIcon className="w-3.5 h-3.5 mr-1" />
                    {carousel.slides.length} slides
                 </span>
                 <span>
                    {new Date(carousel.createdAt).toLocaleDateString()}
                 </span>
            </div>

            <div className="mt-auto flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={() => onEdit(carousel.id)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 transition-colors"
                >
                    {t('historyEditButton')}
                </button>
                <button
                    onClick={() => onDelete(carousel.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    aria-label={t('deleteAriaLabel')}
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
);

export const Dashboard: React.FC<{
    onNewCarousel: () => void;
    onShowTutorial: () => void;
    history: Carousel[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onClearHistory: () => void;
    t: TFunction;
    downloadCount: number;
    mostUsedCategory: string;
}> = ({ onNewCarousel, onShowTutorial, history, onEdit, onDelete, onClearHistory, t, downloadCount, mostUsedCategory }) => (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl pb-24 md:pb-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('dashboardTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">{t('dashboardSubtitle')}</p>
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                <button onClick={onShowTutorial} className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none transition-all shadow-sm hover:shadow">
                    {t('tutorialButton')}
                </button>
                <button onClick={onNewCarousel} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 transform hover:-translate-y-0.5 transition-all">
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    {t('newCarouselButton')}
                </button>
            </div>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <StatCard 
                title={t('statsTotalCarousels')} 
                value={history.length} 
                icon={<DocumentTextIcon className="w-6 h-6" />} 
            />
            <StatCard 
                title={t('statsDownloads')} 
                value={downloadCount} 
                icon={<DownloadIcon className="w-6 h-6" />} 
            />
            <StatCard 
                title={t('statsMostUsedCategory')} 
                value={mostUsedCategory} 
                icon={<SparklesIcon className="w-6 h-6" />} 
            />
        </div>

        {/* History Section */}
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('historyTitle')}</h3>
                {history.length > 0 && (
                     <button 
                        onClick={onClearHistory} 
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline font-medium flex items-center"
                    >
                        <TrashIcon className="w-4 h-4 mr-1.5"/>
                        {t('clearAllHistoryButton')}
                    </button>
                )}
            </div>

            {history.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {history.map(c => (
                        <CarouselCard 
                            key={c.id} 
                            carousel={c} 
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                            t={t}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
                    <div className="bg-white dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <SparklesIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{t('historyEmpty')}</p>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">{t('historyEmptyHint')}</p>
                    <button onClick={onNewCarousel} className="mt-6 text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                        {t('newCarouselButton')} &rarr;
                    </button>
                </div>
            )}
        </div>
    </div>
);