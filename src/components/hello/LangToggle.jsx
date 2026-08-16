import React from 'react';
import { useHelloLang } from '../../contexts/HelloLangContext';

/**
 * Minimal EN | ID toggle — Swiss style.
 * Can be placed inline in headers.
 */
const LangToggle = ({ className = '' }) => {
    const { lang, toggleLang } = useHelloLang();

    return (
        <div className={`flex items-center border border-slate-200 overflow-hidden ${className}`}>
            <button
                onClick={() => lang !== 'en' && toggleLang()}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] transition-colors duration-150 ${
                    lang === 'en'
                        ? 'bg-[#880000] text-white'
                        : 'bg-white text-slate-400 hover:text-slate-700'
                }`}
            >
                EN
            </button>
            <div className="w-px h-4 bg-slate-200" />
            <button
                onClick={() => lang !== 'id' && toggleLang()}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] transition-colors duration-150 ${
                    lang === 'id'
                        ? 'bg-[#880000] text-white'
                        : 'bg-white text-slate-400 hover:text-slate-700'
                }`}
            >
                ID
            </button>
        </div>
    );
};

export default LangToggle;
