import React, { useState, useEffect } from 'react';
import SEO from '../../components/SEO';
import ProfileHeader from '../../components/hello/ProfileHeader';
import SocialIconBar from '../../components/hello/SocialIconBar';
import LinkCard from '../../components/hello/LinkCard';
import HelloFooter from '../../components/hello/HelloFooter';
import LangToggle from '../../components/hello/LangToggle';
import primaryLinks from '../../data/primary-links.json';
import profile from '../../data/profile.json';
import { useHelloLang } from '../../contexts/HelloLangContext';

const HelloPage = () => {
    const { t } = useHelloLang();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className="min-h-screen bg-stone-50 flex flex-col transition-opacity duration-700"
            style={{ opacity: isReady ? 1 : 0 }}
        >
            <SEO
                title={`${profile.name} | ${profile.handle}`}
                description={`${profile.bio} — English teacher, creator, and digital product maker.`}
                keywords="Mr. Zayn, English teacher, digital products, free resources, WhatsApp community"
                url="https://myenglish.my.id/hello"
                type="website"
            />

            {/* Profile Hero */}
            <ProfileHeader />

            {/* Social Icons */}
            <SocialIconBar />

            {/* Main content — max-w-lg for link-in-bio feel */}
            <main className="flex-1 w-full max-w-lg mx-auto px-4 py-8">
                {/* Section label + LangToggle */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-1 bg-[#880000]" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-[0.3em]">
                            {t('links')}
                        </span>
                    </div>
                    <LangToggle />
                </div>

                {/* CTA Link Cards */}
                <div className="flex flex-col gap-3">
                    {primaryLinks.map((link, i) => (
                        <LinkCard
                            key={link.label}
                            {...link}
                            style={{
                                opacity: isReady ? 1 : 0,
                                transform: isReady ? 'translateY(0)' : 'translateY(16px)',
                                transition: `opacity 0.5s ease-out ${300 + i * 100}ms, transform 0.5s ease-out ${300 + i * 100}ms`,
                            }}
                        />
                    ))}
                </div>

                {/* Back-to-site link */}
                <div className="mt-10 flex items-center justify-center">
                    <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-colors"
                    >
                        {t('mainSiteLink')}
                    </a>
                </div>
            </main>

            <HelloFooter />
        </div>
    );
};

export default HelloPage;
