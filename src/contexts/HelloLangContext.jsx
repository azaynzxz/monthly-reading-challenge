import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Translation strings ───────────────────────────────────────────────────
const strings = {
    en: {
        // Common
        back: 'Back',
        tryAgain: 'Try Again',
        error: 'Error',
        noItems: 'No items yet',
        noItemsDesc: 'Check back soon for new products.',

        // HelloPage
        links: 'Links',
        mainSiteLink: 'myenglish.my.id',

        // ShopPage
        shopLabel: 'Shop',
        digitalProducts: 'Digital Products',
        productCatalogue: 'Product Catalogue',
        shopHeroDesc: 'Premium resources to accelerate your English learning journey.',
        failedToLoadShop: 'Failed to load products. Please try again.',

        // FreebiesPage
        freebiesLabel: 'Freebies',
        hundredPercentFree: '100% Free',
        freeResources: 'Free Resources',
        freebiesHeroDesc: 'Download free worksheets, vocabulary packs, and learning materials. No sign-up required.',
        failedToLoadFreebies: 'Failed to load free resources. Please try again.',

        // ProductCard
        free: 'Free',
        comingSoon: 'Coming Soon',
        buyNow: 'Buy Now',
        getFree: 'Get Free',
        download: 'Download',
        notifyMe: 'Notify Me',

        // ComingSoonModal
        modalSectionLabel: 'Coming Soon',
        modalHeadingLight: 'Under',
        modalHeadingBold: 'Construction',
        modalDesc: 'This resource is still being prepared. Join the WhatsApp community and be the first to know the moment it drops.',
        joinWhatsApp: 'Join WhatsApp Group',
        maybeLater: 'Maybe later',
    },
    id: {
        // Common
        back: 'Kembali',
        tryAgain: 'Coba Lagi',
        error: 'Kesalahan',
        noItems: 'Belum ada item',
        noItemsDesc: 'Segera hadir produk baru.',

        // HelloPage
        links: 'Tautan',
        mainSiteLink: 'myenglish.my.id',

        // ShopPage
        shopLabel: 'Toko',
        digitalProducts: 'Produk Digital',
        productCatalogue: 'Katalog Produk',
        shopHeroDesc: 'Sumber daya premium untuk mempercepat perjalanan belajar bahasa Inggris Anda.',
        failedToLoadShop: 'Gagal memuat produk. Silakan coba lagi.',

        // FreebiesPage
        freebiesLabel: 'Gratis',
        hundredPercentFree: '100% Gratis',
        freeResources: 'Sumber Daya Gratis',
        freebiesHeroDesc: 'Unduh lembar kerja, paket kosakata, dan materi pembelajaran secara gratis. Tanpa daftar.',
        failedToLoadFreebies: 'Gagal memuat sumber daya gratis. Silakan coba lagi.',

        // ProductCard
        free: 'Gratis',
        comingSoon: 'Segera Hadir',
        buyNow: 'Beli Sekarang',
        getFree: 'Dapatkan Gratis',
        download: 'Unduh',
        notifyMe: 'Beritahu Saya',

        // ComingSoonModal
        modalSectionLabel: 'Segera Hadir',
        modalHeadingLight: 'Sedang',
        modalHeadingBold: 'Dipersiapkan',
        modalDesc: 'Sumber daya ini sedang dipersiapkan. Bergabunglah dengan komunitas WhatsApp dan jadilah yang pertama tahu saat tersedia.',
        joinWhatsApp: 'Gabung Grup WhatsApp',
        maybeLater: 'Nanti saja',
    },
};

// ─── Context ──────────────────────────────────────────────────────────────
const HelloLangContext = createContext({
    lang: 'id',
    t: (key) => key,
    toggleLang: () => {},
});

const STORAGE_KEY = 'hello-lang';

// ─── Provider ─────────────────────────────────────────────────────────────
export const HelloLangProvider = ({ children }) => {
    const [lang, setLang] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'en' || saved === 'id' ? saved : 'id';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, lang);
    }, [lang]);

    const toggleLang = () => setLang((prev) => (prev === 'en' ? 'id' : 'en'));

    const t = (key) => strings[lang]?.[key] ?? strings.en[key] ?? key;

    return (
        <HelloLangContext.Provider value={{ lang, t, toggleLang }}>
            {children}
        </HelloLangContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────
export const useHelloLang = () => useContext(HelloLangContext);

export default HelloLangContext;
