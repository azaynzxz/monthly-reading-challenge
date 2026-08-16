import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    Gift,
    ShoppingBag,
    ArrowRight,
    ExternalLink,
} from 'lucide-react';

// Map icon name strings (from JSON) to Lucide components
const ICON_MAP = {
    MessageCircle,
    Gift,
    ShoppingBag,
};

const LinkCard = ({ icon, label, description, href, external, accent, style }) => {
    const navigate = useNavigate();
    const Icon = ICON_MAP[icon] ?? ShoppingBag;

    const handleClick = () => {
        if (external) {
            window.open(href, '_blank', 'noopener,noreferrer');
        } else {
            navigate(href);
        }
    };

    if (accent) {
        // WhatsApp / primary accent card — crimson background
        return (
            <button
                onClick={handleClick}
                style={style}
                className="group w-full flex items-center justify-between px-5 py-4 bg-[#880000] hover:bg-[#660000] transition-colors duration-200 text-white"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={20} />
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-bold uppercase tracking-[0.12em]">
                            {label}
                        </div>
                        {description && (
                            <div className="text-[11px] text-white/60 mt-0.5 font-normal tracking-normal normal-case">
                                {description}
                            </div>
                        )}
                    </div>
                </div>
                {external ? (
                    <ExternalLink
                        size={16}
                        className="flex-shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200"
                    />
                ) : (
                    <ArrowRight
                        size={16}
                        className="flex-shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200"
                    />
                )}
            </button>
        );
    }

    // Standard card — white on light background, Swiss border accent
    return (
        <button
            onClick={handleClick}
            style={style}
            className="group w-full flex items-center justify-between px-5 py-4 bg-white border border-slate-200 hover:border-[#880000] transition-all duration-200 text-left"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 group-hover:bg-[#880000]/10 flex items-center justify-center flex-shrink-0 transition-colors duration-200">
                    <Icon size={20} className="text-[#880000]" />
                </div>
                <div className="text-left">
                    <div className="text-sm font-bold text-slate-900 uppercase tracking-[0.12em]">
                        {label}
                    </div>
                    {description && (
                        <div className="text-[11px] text-slate-400 mt-0.5 font-normal tracking-normal normal-case">
                            {description}
                        </div>
                    )}
                </div>
            </div>
            {external ? (
                <ExternalLink
                    size={16}
                    className="flex-shrink-0 text-slate-300 group-hover:text-[#880000] group-hover:translate-x-0.5 transition-all duration-200"
                />
            ) : (
                <ArrowRight
                    size={16}
                    className="flex-shrink-0 text-slate-300 group-hover:text-[#880000] group-hover:translate-x-1 transition-all duration-200"
                />
            )}
        </button>
    );
};

export default LinkCard;
