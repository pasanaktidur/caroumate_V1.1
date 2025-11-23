
import * as React from 'react';
import type { Carousel } from '../types';
import type { TFunction } from '../App';
import { SparklesIcon, TrashIcon, DocumentTextIcon, DownloadIcon, UploadIcon } from './icons';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-3 hover:shadow-md transition-shadow duration-200">
        <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
            {icon}
        </div>
        <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</h4>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
        </div>
    </div>
);

const CarouselCard: React.FC<{ 
    carousel: Carousel; 
    onEdit: (id: string) => void; 
    onDelete: (id: string) => void; 
    t: TFunction;
}> = ({ carousel, onEdit, onDelete, t }) => (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 flex flex-col">
        {/* Card Header / Preview Placeholder */}
        <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden p-3">
            {carousel.slides.length > 0 && (
                <div className="absolute inset-0 opacity-50 blur-xl scale-110">
                     {/* Simulating a blur of the content */}
                     <div className="w-full h-full" style={{ backgroundColor: carousel.preferences.backgroundColor }}></div>
                </div>
            )}
            <div className="relative z-10 h-full flex flex-col justify-center">
                 <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                    {carousel.title}
                </h3>
            </div>
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold text-gray-700 bg-white/80 dark:text-gray-200 dark:bg-black/50 backdrop-blur-sm rounded-md border border-gray-200 dark:border-gray-600">
                {carousel.category}
            </span>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-grow">
            <div className="flex items-center text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-3">
                 <span className="flex items-center mr-3">
                    <DocumentTextIcon className="w-3 h-3 mr-1" />
                    {carousel.slides.length} slides
                 </span>
                 <span>
                    {new Date(carousel.createdAt).toLocaleDateString()}
                 </span>
            </div>

            <div className="mt-auto flex space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={() => onEdit(carousel.id)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-1.5 text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 focus:outline-none transition-colors"
                >
                    {t('historyEditButton')}
                </button>
                <button
                    onClick={() => onDelete(carousel.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    aria-label={t('deleteAriaLabel')}
                >
                    <TrashIcon className="w-4 h-4" />
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
    localHistoryCount?: number;
    onMigrateLocalData?: () => void;
}> = ({ onNewCarousel, onShowTutorial, history, onEdit, onDelete, onClearHistory, t, downloadCount, mostUsedCategory, localHistoryCount, onMigrateLocalData }) => (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl pb-24 md:pb-8">
        {/* Migration Banner */}
        {(localHistoryCount ?? 0) > 0 && (
            <div className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <UploadIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sync Local Data</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            We found {localHistoryCount} carousels in your browser storage. Sync them to cloud.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onMigrateLocalData}
                    className="w-full sm:w-auto whitespace-nowrap px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                    Sync Now
                </button>
            </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('dashboardTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{t('dashboardSubtitle')}</p>
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2.5">
                <button onClick={onShowTutorial} className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none transition-all shadow-sm hover:shadow">
                    {t('tutorialButton')}
                </button>
                <button onClick={onNewCarousel} className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 transform hover:-translate-y-0.5 transition-all">
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    {t('newCarouselButton')}
                </button>
            </div>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            <StatCard 
                title={t('statsTotalCarousels')} 
                value={history.length} 
                icon={<DocumentTextIcon className="w-5 h-5" />} 
            />
            <StatCard 
                title={t('statsDownloads')} 
                value={downloadCount} 
                icon={<DownloadIcon className="w-5 h-5" />} 
            />
            <StatCard 
                title={t('statsMostUsedCategory')} 
                value={mostUsedCategory} 
                icon={<SparklesIcon className="w-5 h-5" />} 
            />
        </div>

        {/* History Section */}
        <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('historyTitle')}</h3>
                {history.length > 0 && (
                     <button 
                        onClick={onClearHistory} 
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline font-semibold flex items-center"
                    >
                        <TrashIcon className="w-3.5 h-3.5 mr-1.5"/>
                        {t('clearAllHistoryButton')}
                    </button>
                )}
            </div>

            {history.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                    <div className="bg-white dark:bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <SparklesIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{t('historyEmpty')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">{t('historyEmptyHint')}</p>
                    <button onClick={onNewCarousel} className="mt-4 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
                        {t('newCarouselButton')} &rarr;
                    </button>
                </div>
            )}
        </div>
    </div>
);
