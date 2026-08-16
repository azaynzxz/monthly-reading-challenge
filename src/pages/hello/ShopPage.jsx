import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, RotateCcw } from 'lucide-react';
import SEO from '../../components/SEO';
import CatalogueGrid from '../../components/hello/CatalogueGrid';
import ComingSoonModal from '../../components/hello/ComingSoonModal';
import HelloFooter from '../../components/hello/HelloFooter';
import LangToggle from '../../components/hello/LangToggle';
import { fetchCatalogue } from '../../api/fetchCatalogue';
import { useHelloLang } from '../../contexts/HelloLangContext';

const ShopPage = () => {
    const navigate = useNavigate();
    const { t } = useHelloLang();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const loadItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchCatalogue('shop');
            setItems(data);
        } catch (err) {
            console.error('[ShopPage] Failed to load catalogue:', err);
            setError(t('failedToLoadShop'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    return (
        <div
            className="min-h-screen bg-stone-50 flex flex-col transition-opacity duration-700"
            style={{ opacity: isReady ? 1 : 0 }}
        >
            <SEO
                title="Shop Catalogue | Mr. Zayn"
                description="Browse premium digital products for English learners — worksheets, vocabulary packs, and more."
                url="https://myenglish.my.id/hello/shop"
                type="website"
            />

            {/* Sticky mini header */}
            <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/hello')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
                    >
                        <ArrowLeft
                            size={16}
                            className="group-hover:-translate-x-0.5 transition-transform"
                        />
                        <span className="text-xs uppercase tracking-[0.15em]">{t('back')}</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-[#880000]" />
                            <span className="text-[10px] text-slate-400 uppercase tracking-[0.3em]">
                                {t('shopLabel')}
                            </span>
                        </div>
                        <LangToggle />
                    </div>
                </div>
            </header>

            {/* Page hero */}
            <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-[#2a0a0a] px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-1 bg-[#880000]" />
                        <span className="text-xs text-white/50 uppercase tracking-[0.3em]">
                            {t('digitalProducts')}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl text-white leading-tight">
                        <span className="font-extralight block">{t('productCatalogue').split(' ')[0]}</span>
                        <span className="font-bold text-[#ff6b6b]">
                            {t('productCatalogue').split(' ').slice(1).join(' ') || t('productCatalogue')}
                        </span>
                    </h1>
                    <p className="mt-3 text-sm text-white/50 max-w-sm leading-relaxed">
                        {t('shopHeroDesc')}
                    </p>
                </div>
            </section>

            {/* Grid section */}
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
                {error ? (
                    <div className="py-16 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-8 h-px bg-[#880000]" />
                            <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">
                                {t('error')}
                            </span>
                            <div className="w-8 h-px bg-[#880000]" />
                        </div>
                        <p className="text-sm text-slate-500 mb-6">{error}</p>
                        <button
                            onClick={loadItems}
                            className="group flex items-center gap-2 mx-auto px-5 py-2.5 bg-slate-900 text-white text-xs font-medium uppercase tracking-[0.15em] hover:bg-[#880000] transition-colors"
                        >
                            <RotateCcw
                                size={14}
                                className="group-hover:rotate-180 transition-transform duration-500"
                            />
                            {t('tryAgain')}
                        </button>
                    </div>
                ) : (
                    <CatalogueGrid
                        items={items}
                        loading={loading}
                        onComingSoon={() => setModalOpen(true)}
                    />
                )}
            </main>

            <HelloFooter />

            <ComingSoonModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
};

export default ShopPage;
