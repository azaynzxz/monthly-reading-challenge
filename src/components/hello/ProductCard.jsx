import React from 'react';
import { Sparkles, ExternalLink, Download } from 'lucide-react';
import { useHelloLang } from '../../contexts/HelloLangContext';

const ProductCard = ({ item, onComingSoon }) => {
    const { t } = useHelloLang();
    const { title, image, price, sale_price, link, isComingSoon } = item;

    // "Free" detection — price OR sale_price set to 0 (mapped to 'Free' in fetchCatalogue)
    const isFree =
        price === 'Free' ||
        price === 'free' ||
        sale_price === 'Free' ||
        sale_price === 'free';

    // Only show sale price row if it exists, is non-empty, and is not 'Free'
    // (when sale_price is Free the whole item is free — handled above)
    const hasSalePrice =
        sale_price &&
        sale_price.trim() !== '' &&
        sale_price !== 'Free' &&
        sale_price !== 'free' &&
        !isFree;

    const handleAction = () => {
        if (isComingSoon) {
            onComingSoon?.();
        } else {
            window.open(link, '_blank', 'noopener,noreferrer');
        }
    };

    // ── Button label & style ────────────────────────────────────────────────
    let buttonLabel, buttonClass;
    if (isComingSoon) {
        buttonLabel = t('notifyMe');
        buttonClass = 'bg-slate-100 text-slate-400 hover:bg-slate-200';
    } else if (isFree) {
        buttonLabel = t('getFree');          // "Dapatkan Gratis" (ID) / "Get Free" (EN)
        buttonClass = 'bg-[#880000] text-white hover:bg-[#660000]';
    } else {
        buttonLabel = t('buyNow');
        buttonClass = 'bg-slate-900 text-white hover:bg-[#880000]';
    }

    return (
        <div className="group bg-white border border-slate-200 hover:border-[#880000] hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
            {/* Image — strict 1:1 ratio */}
            <div className="aspect-square w-full overflow-hidden relative bg-stone-100">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                {/* Fallback placeholder */}
                <div
                    className="absolute inset-0 bg-stone-100 items-center justify-center"
                    style={{ display: image ? 'none' : 'flex' }}
                >
                    <div className="w-10 h-10 border border-slate-200 flex items-center justify-center">
                        <div className="w-4 h-0.5 bg-[#880000]" />
                    </div>
                </div>

                {/* Coming Soon badge overlay */}
                {isComingSoon && (
                    <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm px-2 py-1 flex items-center gap-1">
                        <Sparkles size={10} className="text-[#ff6b6b]" />
                        <span className="text-[9px] text-white uppercase tracking-[0.15em] font-medium">
                            {t('comingSoon')}
                        </span>
                    </div>
                )}

                {/* Free badge overlay */}
                {isFree && !isComingSoon && (
                    <div className="absolute top-2 right-2 bg-[#880000] px-2 py-1">
                        <span className="text-[9px] text-white uppercase tracking-[0.15em] font-bold">
                            {t('free')}
                        </span>
                    </div>
                )}
            </div>

            {/* Card body */}
            <div className="p-3 flex flex-col flex-1">
                {/* Title */}
                <p className="text-xs font-bold text-slate-900 leading-snug mb-2 line-clamp-2 uppercase tracking-[0.06em]">
                    {title}
                </p>

                {/* Price area */}
                <div className="mb-3 mt-auto">
                    {isComingSoon ? (
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                            {t('comingSoon')}
                        </span>
                    ) : isFree ? (
                        <span className="text-sm font-bold text-[#880000]">
                            {t('free')}
                        </span>
                    ) : hasSalePrice ? (
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-400 line-through">{price}</span>
                            <span className="text-sm font-bold text-[#880000]">{sale_price}</span>
                        </div>
                    ) : (
                        <span className="text-sm font-bold text-slate-900">{price}</span>
                    )}
                </div>

                {/* Action button */}
                <button
                    onClick={handleAction}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-200 ${buttonClass}`}
                >
                    <span>{buttonLabel}</span>
                    {isComingSoon ? (
                        <Sparkles size={12} />
                    ) : isFree ? (
                        <Download size={12} />
                    ) : (
                        <ExternalLink size={12} />
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
