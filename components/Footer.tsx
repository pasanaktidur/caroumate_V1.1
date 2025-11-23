
import * as React from 'react';
import { InstagramIcon, ThreadsIcon } from './icons';

export const Footer: React.FC<{ className?: string }> = ({ className }) => (
    <footer className={`w-full py-8 mt-auto bg-transparent border-t border-gray-200 dark:border-gray-800 ${className || ''}`}>
        <div className="container mx-auto px-4 flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center space-x-6">
                <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-pink-600 transition-colors transform hover:scale-110"
                    aria-label="Instagram"
                >
                    <InstagramIcon className="h-6 w-6" />
                </a>
                <a 
                    href="https://threads.net" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-black dark:hover:text-white transition-colors transform hover:scale-110"
                    aria-label="Threads"
                >
                    <ThreadsIcon className="h-6 w-6" />
                </a>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                &copy; {new Date().getFullYear()} CarouMate. All rights reserved.
            </p>
        </div>
    </footer>
);
