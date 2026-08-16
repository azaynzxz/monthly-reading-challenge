import React from 'react';
import ProductCard from './ProductCard';
import { useHelloLang } from '../../contexts/HelloLangContext';

// 6 skeleton placeholders for loading state
const SkeletonCard = () => (
    <div className="bg-white border border-slate-200 flex flex-col overflow-hidden">
        <div className="aspect-square w-full bg-stone-100 animate-pulse" />
        <div className="p-3 flex flex-col gap-2">
            <div className="h-3 bg-stone-100 animate-pulse w-4/5" />
            <div className="h-3 bg-stone-100 animate-pulse w-3/5" />
            <div className="h-2 bg-stone-100 animate-pulse w-2/5 mt-1" />
            <div className="h-8 bg-stone-100 animate-pulse w-full mt-2" />
        </div>
    </div>
);

const CatalogueGrid = ({ items = [], loading = false, onComingSoon }) => {
    const { t } = useHelloLang();

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    }

    if (!items.length) {
        return (
            <div className="py-20 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-8 h-px bg-[#880000]" />
                    <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">
                        {t('noItems')}
                    </span>
                    <div className="w-8 h-px bg-[#880000]" />
                </div>
                <p className="text-sm text-slate-400">{t('noItemsDesc')}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {items.map((item) => (
                <ProductCard
                    key={item.product_id}
                    item={item}
                    onComingSoon={onComingSoon}
                />
            ))}
        </div>
    );
};

export default CatalogueGrid;
