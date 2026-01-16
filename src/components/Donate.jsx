import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, MapPin, ArrowRight, Heart, Server, Code, Zap, Database, Shield, Sparkles, CheckCircle, HelpCircle, Share2, ExternalLink } from 'lucide-react';
import SEO from './SEO';
import Footer from './Footer';

const Donate = () => {
    const navigate = useNavigate();
    const [visibleSections, setVisibleSections] = useState(new Set());
    const [isPageReady, setIsPageReady] = useState(false);

    // Page entrance animation
    useEffect(() => {
        const timer = setTimeout(() => setIsPageReady(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Intersection Observer for section animations
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setVisibleSections(prev => new Set([...prev, entry.target.id]));
                }
            });
        }, observerOptions);

        const sections = ['costs', 'options', 'transparency', 'faq'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, []);

    const getSectionClass = (sectionId) => {
        return visibleSections.has(sectionId)
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8';
    };

    const costs = [
        { icon: Server, title: 'Hosting & Infrastructure', description: 'Server costs and CDN for fast global access' },
        { icon: Code, title: 'API Services', description: 'Dictionary API and Wikipedia integration costs' },
        { icon: Shield, title: 'Domain & Security', description: 'Domain registration and SSL certificates' },
        { icon: Zap, title: 'Development Time', description: 'Ongoing maintenance and bug fixes' },
        { icon: Database, title: 'Content Curation', description: 'Story research and quality assurance' },
        { icon: Sparkles, title: 'Feature Development', description: 'New tools and improvements' }
    ];

    const faqs = [
        {
            icon: HelpCircle,
            question: 'Is this platform free?',
            answer: 'Yes, always. English Fluency Journey will remain 100% free for all learners.'
        },
        {
            icon: Heart,
            question: 'Why donate?',
            answer: 'Donations support ongoing development, hosting costs, and platform improvements.'
        },
        {
            icon: CheckCircle,
            question: 'Are donations required?',
            answer: 'No, completely optional. The platform is free regardless of donation status.'
        },
        {
            icon: Share2,
            question: 'What if I can\'t donate?',
            answer: 'Share the platform with others who might benefit from it. Word of mouth helps tremendously.'
        }
    ];

    return (
        <div className={`min-h-screen bg-white transition-opacity duration-700 ${isPageReady ? 'opacity-100' : 'opacity-0'}`}>
            <SEO
                title="Support Development | English Fluency Journey"
                description="Support the ongoing development and maintenance of English Fluency Journey. Choose between international (Ko-fi) or local Indonesian (Saweria) donation options."
                keywords="donate, support development, Ko-fi, Saweria, English learning platform"
                ogImage="https://myenglish.my.id/og-image.jpg"
                url="https://myenglish.my.id/donate"
                type="website"
            />

            {/* Header/Navigation */}
            <header className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 fixed top-0 z-[100]">
                <nav className="max-w-6xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="group">
                            <img src="/logo-horizontal.svg" alt="English Fluency Journey" className="h-10" />
                        </Link>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/m1-day1')}
                                className="group bg-slate-900 text-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] hover:bg-[#880000] transition-all duration-300 flex items-center gap-2"
                            >
                                Start Learning
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden mt-16 bg-gradient-to-br from-slate-800 via-slate-900 to-[#2a0a0a]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60"></div>

                <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
                    <div
                        className="flex items-center justify-center gap-3 mb-6 transition-all duration-700 ease-out"
                        style={{
                            opacity: isPageReady ? 1 : 0,
                            transform: isPageReady ? 'translateY(0)' : 'translateY(-20px)',
                            transitionDelay: '200ms'
                        }}
                    >
                        <div className="w-16 h-1 bg-[#880000]"></div>
                        <span className="text-xs text-white/60 uppercase tracking-[0.3em]">Support Development</span>
                        <div className="w-16 h-1 bg-[#880000]"></div>
                    </div>

                    <h1
                        className="text-4xl md:text-6xl text-white mb-6 leading-[1.1] transition-all duration-700 ease-out"
                        style={{
                            opacity: isPageReady ? 1 : 0,
                            transform: isPageReady ? 'translateY(0)' : 'translateY(40px)',
                            transitionDelay: '300ms'
                        }}
                    >
                        <span className="font-extralight block">Keep This Platform</span>
                        <span className="font-bold text-[#ff6b6b] block">Free & Accessible</span>
                    </h1>

                    <p
                        className="text-lg text-white/70 max-w-2xl mx-auto transition-all duration-700 ease-out"
                        style={{
                            opacity: isPageReady ? 1 : 0,
                            transform: isPageReady ? 'translateY(0)' : 'translateY(30px)',
                            transitionDelay: '450ms'
                        }}
                    >
                        Your contribution supports ongoing development, infrastructure costs, and platform improvements. English Fluency Journey remains free for all learners.
                    </p>
                </div>
            </section>

            {/* What Your Support Covers */}
            <section
                id="costs"
                className={`py-16 md:py-24 bg-white scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('costs')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-12 h-1 bg-[#880000]"></div>
                            <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">Transparency</span>
                            <div className="w-12 h-1 bg-[#880000]"></div>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            What Your Support Covers
                        </h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Development and operational costs for maintaining a free, high-quality learning platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {costs.map((cost, index) => {
                            const Icon = cost.icon;
                            return (
                                <div key={index} className="bg-stone-50 p-6 border-l-4 border-slate-200 hover:border-[#880000] transition-colors">
                                    <Icon className="text-[#880000] mb-3" size={32} />
                                    <h3 className="font-bold text-slate-900 mb-2">{cost.title}</h3>
                                    <p className="text-sm text-slate-600">{cost.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Donation Options - Swiss Design */}
            <section
                id="options"
                className={`py-16 md:py-24 bg-stone-50 scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('options')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-12 gap-8 mb-12">
                        <div className="md:col-span-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-1 bg-[#880000]"></div>
                                <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">Support</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
                                <span className="font-extralight block">Choose</span>
                                <span className="text-[#880000]">Your Method</span>
                            </h2>
                        </div>
                        <div className="md:col-span-8 md:col-start-6 flex items-end">
                            <p className="text-slate-600 text-lg">
                                Two payment options available: international via Ko-fi or local Indonesian via Saweria.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-0 border-2 border-slate-900">
                        {/* International - Ko-fi */}
                        <div className="bg-white p-8 md:p-12 border-r-0 md:border-r-2 border-b-2 md:border-b-0 border-slate-900 group hover:bg-stone-50 transition-colors">
                            <div className="mb-8">
                                <Globe className="text-[#880000] mb-4" size={48} />
                                <div className="w-16 h-1 bg-[#880000] mb-6"></div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-2 uppercase tracking-tight">International</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-6">Ko-fi Platform</p>
                            </div>

                            <div className="mb-8">
                                <p className="text-slate-600 mb-6">
                                    Credit cards, PayPal, and other international payment methods accepted.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-[#880000]"></div>
                                        <span className="text-sm text-slate-600">Credit/Debit Card</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-[#880000]"></div>
                                        <span className="text-sm text-slate-600">PayPal</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-[#880000]"></div>
                                        <span className="text-sm text-slate-600">Apple/Google Pay</span>
                                    </div>
                                </div>
                            </div>

                            <a
                                href="https://ko-fi.com/mrzayn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/btn w-full bg-slate-900 text-white px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#880000] transition-all duration-300 flex items-center justify-between"
                            >
                                <span>Donate via Ko-fi</span>
                                <ExternalLink size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </a>
                        </div>

                        {/* Local Indonesian - Saweria */}
                        <div className="bg-white p-8 md:p-12 group hover:bg-stone-50 transition-colors">
                            <div className="mb-8">
                                <MapPin className="text-[#880000] mb-4" size={48} />
                                <div className="w-16 h-1 bg-[#880000] mb-6"></div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Indonesian</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-6">Saweria Platform</p>
                            </div>

                            <div className="mb-8">
                                <p className="text-slate-600 mb-6">
                                    Local Indonesian payment methods including QRIS, bank transfers, and e-wallets.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-[#880000]"></div>
                                        <span className="text-sm text-slate-600">QRIS</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-[#880000]"></div>
                                        <span className="text-sm text-slate-600">Bank Transfer</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-[#880000]"></div>
                                        <span className="text-sm text-slate-600">GoPay, OVO, Dana</span>
                                    </div>
                                </div>
                            </div>

                            <a
                                href="https://saweria.co/mrzayn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/btn w-full bg-slate-900 text-white px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#880000] transition-all duration-300 flex items-center justify-between"
                            >
                                <span>Donate via Saweria</span>
                                <ExternalLink size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transparency - Grid Layout */}
            <section
                id="transparency"
                className={`py-16 md:py-24 bg-white scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('transparency')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-12 h-1 bg-[#880000]"></div>
                            <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">Transparency</span>
                            <div className="w-12 h-1 bg-[#880000]"></div>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            How Donations Are Used
                        </h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Transparent allocation of funds to maintain and improve the platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-stone-50 p-6 border-l-4 border-[#880000]">
                            <CheckCircle className="text-[#880000] mb-3" size={28} />
                            <h3 className="font-bold text-slate-900 mb-2 text-lg">Infrastructure & Hosting</h3>
                            <p className="text-sm text-slate-600">Server costs, CDN, and bandwidth for fast global access to all learners</p>
                        </div>

                        <div className="bg-stone-50 p-6 border-l-4 border-slate-200 hover:border-[#880000] transition-colors">
                            <Code className="text-[#880000] mb-3" size={28} />
                            <h3 className="font-bold text-slate-900 mb-2 text-lg">Development & Maintenance</h3>
                            <p className="text-sm text-slate-600">Bug fixes, security updates, and continuous platform improvements</p>
                        </div>

                        <div className="bg-stone-50 p-6 border-l-4 border-slate-200 hover:border-[#880000] transition-colors">
                            <Database className="text-[#880000] mb-3" size={28} />
                            <h3 className="font-bold text-slate-900 mb-2 text-lg">Content Quality</h3>
                            <p className="text-sm text-slate-600">Story curation, fact-checking, and maintaining educational value</p>
                        </div>

                        <div className="bg-stone-50 p-6 border-l-4 border-slate-200 hover:border-[#880000] transition-colors">
                            <Sparkles className="text-[#880000] mb-3" size={28} />
                            <h3 className="font-bold text-slate-900 mb-2 text-lg">Platform Improvements</h3>
                            <p className="text-sm text-slate-600">User-requested features and performance optimization</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section
                id="faq"
                className={`py-16 md:py-24 bg-stone-50 scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('faq')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-12 h-1 bg-[#880000]"></div>
                            <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">Questions</span>
                            <div className="w-12 h-1 bg-[#880000]"></div>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {faqs.map((faq, index) => {
                            const Icon = faq.icon;
                            return (
                                <div key={index} className="bg-stone-50 p-6 border-l-4 border-slate-200">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Icon className="text-[#880000] mt-1 flex-shrink-0" size={24} />
                                        <h3 className="font-bold text-slate-900 text-lg">{faq.question}</h3>
                                    </div>
                                    <p className="text-slate-600 pl-9">{faq.answer}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-16 bg-gradient-to-br from-slate-800 via-slate-900 to-[#2a0a0a]">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Thank You for Your Support
                    </h2>
                    <p className="text-lg text-white/70 mb-8">
                        Every contribution helps keep this platform free and accessible for learners worldwide.
                    </p>
                    <button
                        onClick={() => navigate('/m1-day1')}
                        className="group bg-[#880000] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] hover:bg-[#660000] transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
                    >
                        Back to Learning
                        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Donate;
