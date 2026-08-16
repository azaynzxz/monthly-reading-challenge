import React, { useEffect } from 'react';
import { X, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { useHelloLang } from '../../contexts/HelloLangContext';
import profile from '../../data/profile.json';

const ComingSoonModal = ({ isOpen, onClose }) => {
    const { t } = useHelloLang();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleWhatsApp = () => {
        window.open(profile.whatsapp, '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-50 animate-backdrop-in"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
                <div className="bg-white w-full max-w-sm pointer-events-auto animate-modal-in">

                    {/* Swiss header bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-1 bg-[#880000]" />
                            <span className="text-[10px] text-slate-400 uppercase tracking-[0.3em]">
                                {t('modalSectionLabel')}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-8 text-center">
                        <div className="w-14 h-14 bg-stone-100 flex items-center justify-center mx-auto mb-5">
                            <Sparkles size={24} className="text-[#880000]" />
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 mb-1 leading-tight">
                            <span className="font-extralight block">{t('modalHeadingLight')}</span>
                            <span className="text-[#880000]">{t('modalHeadingBold')}</span>
                        </h2>

                        <p className="text-sm text-slate-500 leading-relaxed mt-4 mb-8 max-w-xs mx-auto">
                            {t('modalDesc')}
                        </p>

                        {/* CTA */}
                        <button
                            onClick={handleWhatsApp}
                            className="group w-full bg-[#880000] text-white px-5 py-3.5 text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#660000] transition-colors duration-200 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <MessageCircle size={16} />
                                <span>{t('joinWhatsApp')}</span>
                            </div>
                            <ArrowRight
                                size={14}
                                className="group-hover:translate-x-0.5 transition-transform duration-200"
                            />
                        </button>

                        <button
                            onClick={onClose}
                            className="mt-4 text-[11px] text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
                        >
                            {t('maybeLater')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ComingSoonModal;
