import * as React from 'react';
// FIX: FontChoice is an enum used as a value, so it must be imported as a value, not a type.
import type { TextStyle, Position } from '../types';
import { FontChoice } from '../types';
import {
    ChevronDownIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CaseIcon,
    AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon
} from './icons';
import { fontClassMap } from '../lib/constants';
import { TFunction } from '../App';

export const FontSelector: React.FC<{
    id: string;
    value: FontChoice;
    onChange: (value: FontChoice) => void;
}> = ({ id, value, onChange }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const handleSelect = (font: FontChoice) => {
        onChange(font);
        setIsOpen(false);
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                id={id}
                onClick={() => setIsOpen(!isOpen)}
                className="mt-1 relative w-full cursor-pointer rounded-xl bg-gray-50 dark:bg-gray-800 py-2.5 pl-4 pr-10 text-left text-gray-900 dark:text-gray-200 ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm sm:leading-6 transition-shadow hover:ring-gray-300 dark:hover:ring-gray-600"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={`block truncate ${fontClassMap[value]} text-base`}>{value}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
            </button>

            {isOpen && (
                <ul
                    className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm custom-scrollbar"
                    role="listbox"
                    aria-labelledby={id}
                >
                    {Object.values(FontChoice).map((font) => (
                        <li
                            key={font}
                            className={`relative cursor-pointer select-none py-2.5 pl-4 pr-9 text-gray-900 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors ${fontClassMap[font]}`}
                            id={`option-${id}-${font}`}
                            role="option"
                            aria-selected={font === value}
                            onClick={() => handleSelect(font)}
                        >
                            <span className={`block truncate ${font === value ? 'text-primary-600 dark:text-primary-400' : ''}`}>{font}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


export const ApplyScopeControl: React.FC<{
    scope: 'all' | 'selected';
    setScope: (scope: 'all' | 'selected') => void;
    isDisabled: boolean;
    t: TFunction;
    fieldId: string;
}> = ({ scope, setScope, isDisabled, t, fieldId }) => (
    <div className="flex items-center space-x-3 mt-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">{t('applyTo')}</span>
        <div className="flex items-center space-x-3">
             <label className="inline-flex items-center cursor-pointer">
                <input
                    id={`${fieldId}-scope-all`}
                    type="radio"
                    name={`${fieldId}-scope`}
                    value="all"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-xs text-gray-700 dark:text-gray-300 font-medium">{t('applyToAll')}</span>
            </label>
            <label className={`inline-flex items-center ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                    id={`${fieldId}-scope-selected`}
                    type="radio"
                    name={`${fieldId}-scope`}
                    value="selected"
                    checked={scope === 'selected'}
                    onChange={() => !isDisabled && setScope('selected')}
                    disabled={isDisabled}
                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-xs text-gray-700 dark:text-gray-300 font-medium">{t('applyToSelected')}</span>
            </label>
        </div>
    </div>
);

export const TextFormatToolbar: React.FC<{ style: TextStyle, onStyleChange: (newStyle: TextStyle) => void }> = ({ style, onStyleChange }) => {
    const toggleStyle = (key: keyof TextStyle, value: any, defaultValue: any) => {
        onStyleChange({ ...style, [key]: style[key] === value ? defaultValue : value });
    };

    const toggleDecoration = (value: 'underline' | 'line-through') => {
        const decorations = new Set((style.textDecorationLine || '').split(' ').filter(Boolean));
        if (decorations.has(value)) {
            decorations.delete(value);
        } else {
            decorations.add(value);
        }
        onStyleChange({ ...style, textDecorationLine: Array.from(decorations).join(' ') });
    };

    const isDecorationActive = (value: string) => (style.textDecorationLine || '').includes(value);

    const btnBase = "p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50";
    const btnActive = "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300";
    const btnInactive = "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700";

    return (
        <div className="flex flex-wrap items-center gap-1 p-1.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => toggleStyle('fontWeight', 'bold', 'normal')} className={`${btnBase} ${style.fontWeight === 'bold' ? btnActive : btnInactive}`}><BoldIcon className="w-4 h-4" /></button>
            <button type="button" onClick={() => toggleStyle('fontStyle', 'italic', 'normal')} className={`${btnBase} ${style.fontStyle === 'italic' ? btnActive : btnInactive}`}><ItalicIcon className="w-4 h-4" /></button>
            <button type="button" onClick={() => toggleDecoration('underline')} className={`${btnBase} ${isDecorationActive('underline') ? btnActive : btnInactive}`}><UnderlineIcon className="w-4 h-4" /></button>
            <button type="button" onClick={() => toggleDecoration('line-through')} className={`${btnBase} ${isDecorationActive('line-through') ? btnActive : btnInactive}`}><StrikethroughIcon className="w-4 h-4" /></button>
            <button type="button" onClick={() => toggleStyle('textTransform', 'uppercase', 'none')} className={`${btnBase} ${style.textTransform === 'uppercase' ? btnActive : btnInactive}`}><CaseIcon className="w-4 h-4" /></button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            
            <button type="button" onClick={() => onStyleChange({ ...style, textAlign: 'left' })} className={`${btnBase} ${style.textAlign === 'left' ? btnActive : btnInactive}`}><AlignLeftIcon className="w-4 h-4" /></button>
            <button type="button" onClick={() => onStyleChange({ ...style, textAlign: 'center' })} className={`${btnBase} ${style.textAlign === 'center' ? btnActive : btnInactive}`}><AlignCenterIcon className="w-4 h-4" /></button>
            <button type="button" onClick={() => onStyleChange({ ...style, textAlign: 'right' })} className={`${btnBase} ${style.textAlign === 'right' ? btnActive : btnInactive}`}><AlignRightIcon className="w-4 h-4" /></button>
            <button type="button" onClick={() => onStyleChange({ ...style, textAlign: 'justify' })} className={`${btnBase} ${style.textAlign === 'justify' ? btnActive : btnInactive}`}><AlignJustifyIcon className="w-4 h-4" /></button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            
            <div className="flex items-center ml-1">
                 <input
                    type="number"
                    value={style.fontSize ? style.fontSize * 10 : ''}
                    onChange={e => onStyleChange({ ...style, fontSize: parseFloat(e.target.value) / 10 })}
                    className="w-14 py-1 px-2 text-sm text-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    step="1"
                    min="5"
                    max="100"
                    placeholder="Size"
                    aria-label="Font size"
                />
            </div>
        </div>
    );
};

export const TextStrokeControl: React.FC<{
    style: TextStyle;
    onStyleChange: (newStyle: TextStyle) => void;
}> = ({ style, onStyleChange }) => {
    const stroke = style.textStroke ?? { color: '#000000', width: 0 };

    const handleStrokeChange = (newStroke: { color: string; width: number; }) => {
        onStyleChange({ ...style, textStroke: newStroke });
    };

    return (
        <div className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-semibold uppercase tracking-wide px-2 text-gray-500 dark:text-gray-400">Border</span>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm cursor-pointer">
                 <input
                    type="color"
                    value={stroke.color}
                    onChange={(e) => handleStrokeChange({ ...stroke, color: e.target.value })}
                    className="absolute -top-2 -left-2 w-10 h-10 p-0 border-none cursor-pointer opacity-0"
                    aria-label="Text border color"
                    disabled={stroke.width === 0}
                />
                <div className="w-full h-full" style={{ backgroundColor: stroke.color }}></div>
            </div>
           
            <input
                type="number"
                value={stroke.width}
                onChange={e => handleStrokeChange({ ...stroke, width: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-14 py-1 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                step="1"
                min="0"
                max="10"
                aria-label="Text border width"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">px</span>
        </div>
    );
};

export const ColorInput: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
}> = ({ id, label, value, onChange }) => {
    const [textValue, setTextValue] = React.useState(value);

    React.useEffect(() => {
        setTextValue(value);
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newText = e.target.value;
        setTextValue(newText);
        if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(newText)) {
            onChange(newText);
        }
    };
    
    return (
        <div className="group">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-shadow">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm cursor-pointer flex-shrink-0">
                     <input
                        type="color"
                        id={id}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute -top-2 -left-2 w-12 h-12 p-0 border-none cursor-pointer opacity-0"
                        aria-label={`${label} color picker`}
                    />
                    <div className="w-full h-full" style={{ backgroundColor: value }}></div>
                </div>
                <input
                    type="text"
                    value={textValue}
                    onChange={handleTextChange}
                    className="block w-full bg-transparent border-none text-sm text-gray-700 dark:text-gray-200 focus:ring-0 font-mono uppercase tracking-wider"
                    aria-label={`${label} hex code`}
                />
            </div>
        </div>
    );
};

export const PositionSelector: React.FC<{
    label: string;
    value: Position;
    onChange: (value: Position) => void;
    t: TFunction;
}> = ({ label, value, onChange, t }) => {
    const positions: Position[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    const positionLabels: { [key in Position]: string } = {
        'top-left': 'Top Left',
        'top-right': 'Top Right',
        'bottom-left': 'Bottom Left',
        'bottom-right': 'Bottom Right',
        'top-center': 'Top Center',
        'bottom-center': 'Bottom Center',
    };

    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</label>
            <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-800/80 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                {positions.map(pos => (
                    <button
                        type="button"
                        key={pos}
                        onClick={() => onChange(pos)}
                        className={`px-2 py-2 text-[10px] uppercase font-bold rounded-lg border transition-all duration-200 ${
                            value === pos
                                ? 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/50 dark:text-primary-300 dark:border-primary-800'
                                : 'bg-white dark:bg-gray-700 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                    >
                        {positionLabels[pos].replace(' ', '\n')}
                    </button>
                ))}
            </div>
        </div>
    );
};