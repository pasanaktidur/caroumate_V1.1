
import * as React from 'react';
import type { TFunction } from '../App';
import { SparklesIcon, SettingsIcon, DownloadIcon, GoogleIcon, LoaderIcon } from './icons';

const SampleCarouselPreview: React.FC = () => {
    const slideStyle = "h-[200px] sm:h-[260px] w-[160px] sm:w-[210px] flex-shrink-0 relative flex flex-col justify-center items-center p-5 text-center rounded-2xl shadow-2xl border border-white/10 backdrop-blur-sm";

    return (
        <div className="relative mx-auto w-full max-w-md perspective-1000">
            {/* Floating Elements Background */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 -right-20 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>

            {/* Phone Mockup */}
            <div className="relative mx-auto bg-gray-900 border-[12px] border-gray-900 rounded-[3rem] h-[480px] w-[240px] sm:h-[580px] sm:w-[290px] shadow-2xl shadow-primary-900/50 transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500 z-10">
                <div className="w-[80px] h-[24px] bg-gray-900 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
                <div className="rounded-[2.2rem] overflow-hidden w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 relative">
                    {/* Screen Content */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        <div className="flex items-center space-x-[-40px] sm:space-x-[-50px]">
                            {/* Slide 1 */}
                            <div className={`${slideStyle} bg-gradient-to-br from-gold-400 to-gold-600 text-white font-poppins z-10 transform -rotate-12 scale-90 opacity-80 shadow-xl`}>
                                <div className="absolute top-2 right-2 w-2 h-2 bg-white/50 rounded-full"></div>
                                <h2 className="font-bold text-lg leading-tight drop-shadow-md">Unlock Your Potential</h2>
                                <div className="w-8 h-1 bg-white/50 rounded-full mt-3 mb-2"></div>
                                <p className="text-xs opacity-90">5 Mindset Shifts</p>
                            </div>
                            {/* Slide 2 (Main) */}
                            <div className={`${slideStyle} bg-white text-gray-900 font-sans z-20 transform scale-100 shadow-2xl ring-1 ring-black/5`}>
                                <div className="bg-primary-100 p-3 rounded-full mb-4">
                                    <SparklesIcon className="w-8 h-8 text-primary-600" />
                                </div>
                                <h2 className="font-extrabold text-2xl leading-none text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600 mb-2">CarouMate AI</h2>
                                <p className="text-xs font-medium text-gray-500">Stunning carousels,<br/>instantly.</p>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-600"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                </div>
                            </div>
                             {/* Slide 3 */}
                            <div className={`${slideStyle} bg-gradient-to-br from-accent-500 to-accent-600 text-white font-montserrat z-10 transform rotate-12 scale-90 opacity-80 shadow-xl`}>
                                 <h2 className="font-bold text-xl leading-tight">Swipe →</h2>
                                <p className="text-xs mt-2 opacity-90">Your guide to going viral.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LoginScreen: React.FC<{ 
    onGoogleLogin: () => void; 
    onEmailLogin: (e: string, p: string) => Promise<boolean>;
    onEmailSignUp: (e: string, p: string, n: string) => Promise<boolean>;
    t: TFunction; 
    error?: string | null;
    onErrorDismiss: () => void;
}> = ({ onGoogleLogin, onEmailLogin, onEmailSignUp, t, error, onErrorDismiss }) => {
    const [isLoginMode, setIsLoginMode] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [fullName, setFullName] = React.useState('');

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLoginMode) {
                await onEmailLogin(email, password);
            } else {
                await onEmailSignUp(email, password, fullName);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-950 min-h-full flex flex-col">
            <main className="flex-grow">
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-grid-pattern dark:bg-grid-pattern-dark opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary-200/30 dark:bg-primary-900/20 rounded-[100%] blur-[100px] pointer-events-none"></div>

                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-10 pb-24 lg:pt-20 lg:pb-32">
                        <div className="lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">
                            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                                
                                {/* Logo & Tagline */}
                                <div className="mb-6">
                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 mb-6">
                                        <span className="flex h-2 w-2 rounded-full bg-primary-500 mr-2 animate-pulse"></span>
                                        <span className="text-xs font-semibold tracking-wide uppercase text-primary-700 dark:text-primary-300">{t('heroTagline')}</span>
                                    </div>
                                    <h1 className="text-5xl sm:text-6xl xl:text-7xl tracking-tight font-extrabold text-gray-900 dark:text-white mb-4">
                                        {t('heroTitle1')} <br className="hidden lg:block" />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">{t('heroTitle2')}</span>
                                    </h1>
                                </div>
                                
                                {/* Auth Card */}
                                <div className="mt-8 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md mx-auto lg:mx-0">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        {isLoginMode ? t('loginTitle') : t('registerTitle')}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        {isLoginMode ? t('loginSubtitle') : t('registerSubtitle')}
                                    </p>

                                    {error && (
                                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 text-xs font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                                        {!isLoginMode && (
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('fullNameLabel')}</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white sm:text-sm"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('emailLabel')}</label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">{t('passwordLabel')}</label>
                                                {isLoginMode && (
                                                    <button type="button" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                                                        {t('forgotPassword')}
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white sm:text-sm"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 transition-all"
                                        >
                                            {isLoading && <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />}
                                            {isLoginMode ? t('signInButton') : t('signUpButton')}
                                        </button>
                                    </form>

                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded">
                                                {t('orContinueWith')}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={onGoogleLogin}
                                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-200 dark:border-gray-700 text-sm font-bold rounded-xl text-gray-700 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-all"
                                    >
                                       <GoogleIcon className="mr-3 w-5 h-5" />
                                       Google
                                    </button>

                                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                                        {isLoginMode ? t('noAccount') : t('haveAccount')}{' '}
                                        <button 
                                            onClick={() => { setIsLoginMode(!isLoginMode); onErrorDismiss(); }} 
                                            className="font-bold text-primary-600 dark:text-primary-400 hover:underline"
                                        >
                                            {isLoginMode ? t('signUpButton') : t('signInButton')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-16 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 flex justify-center lg:justify-end hidden lg:flex">
                                <SampleCarouselPreview />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="py-24 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-base text-primary-600 dark:text-primary-400 font-bold tracking-wide uppercase mb-2">{t('featuresTitle')}</h2>
                            <p className="text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
                                {t('featuresSubtitle')}
                            </p>
                            <p className="text-lg text-gray-500 dark:text-gray-400">
                                {t('featuresDescription')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="relative group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-3xl"></div>
                                <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-6 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300">
                                    <SparklesIcon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('feature1Title')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {t('feature1Description')}
                                </p>
                            </div>
                            
                             {/* Feature 2 */}
                            <div className="relative group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-3xl"></div>
                                <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-6 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300">
                                    <SettingsIcon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('feature2Title')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {t('feature2Description')}
                                </p>
                            </div>

                             {/* Feature 3 */}
                            <div className="relative group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-3xl"></div>
                                <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-6 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300">
                                    <DownloadIcon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('feature3Title')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {t('feature3Description')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
