
import * as React from 'react';
import type { UserProfile } from '../types';
import type { TFunction } from '../App';
import { TrashIcon, PlusIcon, SparklesIcon } from './icons';

export const ProfileSetupModal: React.FC<{ user: UserProfile, onSetupComplete: (profile: Omit<UserProfile, 'profileComplete'>) => void; t: TFunction; }> = ({ user, onSetupComplete, t }) => {
    const [name, setName] = React.useState(user.name || '');
    const [niches, setNiches] = React.useState<string[]>(user.niche?.length > 0 ? user.niche : ['']);
    
    const handleNicheChange = (index: number, value: string) => {
        const newNiches = [...niches];
        newNiches[index] = value;
        setNiches(newNiches);
    };

    const handleAddNiche = () => {
        setNiches([...niches, '']);
    };

    const handleRemoveNiche = (index: number) => {
        if (niches.length > 1) {
            const newNiches = niches.filter((_, i) => i !== index);
            setNiches(newNiches);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSetupComplete({ ...user, name, niche: niches });
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 max-w-lg w-full m-4 transform transition-all scale-100">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-2xl">
                        <SparklesIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">{t('profileTitle')}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">{t('profileSubtitle')}</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('profileNameLabel')}</label>
                        <input 
                            type="text" 
                            id="name" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('profileNicheLabel')}</label>
                         <div className="space-y-3 mt-1">
                            {niches.map((niche, index) => (
                                <div key={index} className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <input
                                        type="text"
                                        value={niche}
                                        onChange={e => handleNicheChange(index, e.target.value)}
                                        required
                                        placeholder={t('profileNichePlaceholder')}
                                        className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                    {niches.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveNiche(index)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddNiche} className="mt-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center transition-colors">
                            <PlusIcon className="w-4 h-4 mr-1.5" />
                            {t('profileAddNiche')}
                        </button>
                    </div>
                    <button type="submit" className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-200">
                        {t('profileButton')}
                    </button>
                </form>
            </div>
        </div>
    );
};
