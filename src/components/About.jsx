import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Target, TrendingUp, Globe, ArrowRight, Users, Award, Clock, MapPin, Volume2, Printer, Download, Share2, BarChart3, Type, Monitor, Sparkles, CheckCircle, Heart, ChevronDown, X, Zap, Book, Mic, Palette, Database, Image } from 'lucide-react';
import SEO from './SEO';
import Footer from './Footer';

const About = () => {
    const navigate = useNavigate();
    const [visibleSections, setVisibleSections] = useState(new Set());
    const [isPageReady, setIsPageReady] = useState(false);
    const [expandedFeature, setExpandedFeature] = useState(null);

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

        // Observe all sections
        const sections = ['what', 'why', 'who', 'when', 'where', 'how', 'features', 'cta'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, []);

    // Helper to get section animation class
    const getSectionClass = (sectionId) => {
        return visibleSections.has(sectionId)
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8';
    };

    const features = [
        {
            id: 'reading',
            icon: BookOpen,
            title: 'Interactive Reading',
            description: '90 curated stories from 30+ countries with intelligent features',
            details: [
                'Click-to-define vocabulary with Free Dictionary API',
                'Difficult word highlighting based on frequency',
                'Personal vocabulary saving and management',
                'Wikipedia images with cultural context',
                'Adjustable font size (4 levels)',
                'Chunk-based text display for better comprehension',
                'Copy and share story functionality',
                'Smooth page transitions'
            ]
        },
        {
            id: 'teleprompter',
            icon: Monitor,
            title: 'Teleprompter Mode',
            description: 'Professional practice mode for reading aloud',
            details: [
                'Full-screen immersive practice environment',
                '3-second countdown timer',
                'Auto-scroll with adjustable speed (0.1x - 1.0x)',
                'Customizable font size controls',
                'Play/pause functionality',
                'Practice time tracking',
                'Swiss-design interface'
            ]
        },
        {
            id: 'tts',
            icon: Volume2,
            title: 'Text-to-Speech',
            description: 'Perfect pronunciation with native voices',
            details: [
                'Multiple English voice options',
                'Real-time word highlighting during playback',
                'Adjustable speech rate',
                'Chunk-by-chunk progression',
                'Browser-native TTS API',
                'Voice selection and preferences'
            ]
        },
        {
            id: 'assessment',
            icon: Target,
            title: 'Smart Assessments',
            description: 'Auto-generated quizzes to test comprehension',
            details: [
                'Fill-in-the-blank questions',
                'Multiple choice vocabulary (API-powered)',
                'Comprehension questions',
                'Real-time scoring and feedback',
                'Challenge mode with timer',
                'Accuracy tracking',
                'Instant answer validation'
            ]
        },
        {
            id: 'print',
            icon: Printer,
            title: 'Print Worksheets',
            description: 'Professional PDF-ready study materials',
            details: [
                'A4-sized print-optimized format',
                'Story text with vocabulary bank',
                'Comprehensive assessment quiz',
                'Answer key included',
                'Swiss design layout',
                'Print-friendly styling'
            ]
        },
        {
            id: 'dashboard',
            icon: BarChart3,
            title: 'Progress Dashboard',
            description: 'Comprehensive learning analytics',
            details: [
                'Total words read counter',
                'Practice time statistics',
                'Session tracking',
                'Country exposure visualization',
                'Monthly progress charts',
                'Streak tracking (current & longest)',
                'Achievement badges (7-day, 30-day)',
                'Month completion percentage'
            ]
        },
        {
            id: 'flashcards',
            icon: Type,
            title: 'Flashcards',
            description: 'Review saved vocabulary effectively',
            details: [
                'Saved word review system',
                'Card flip animations',
                'Navigation controls',
                'Remove words option',
                'Difficulty indicators',
                'Spaced repetition ready'
            ]
        },
        {
            id: 'posters',
            icon: Download,
            title: 'Visual Posters',
            description: 'Beautiful shareable learning graphics',
            details: [
                'Word frequency visualization',
                'Custom vocabulary posters with IPA phonetics',
                'Canvas-based generation (1080x1920)',
                'Practice statistics display',
                'Swiss typography design',
                'Downloadable for social media',
                'Text-to-speech for pronunciation'
            ]
        }
    ];

    return (
        <div className={`min-h-screen bg-white transition-opacity duration-700 ${isPageReady ? 'opacity-100' : 'opacity-0'}`}>
            {/* SEO Meta Tags */}
            <SEO
                title="About | English Fluency Journey - Learn English Through Daily Reading"
                description="Discover how English Fluency Journey helps you master English through 90 days of engaging stories, interactive tools, and comprehensive progress tracking. Free forever."
                keywords="about English Fluency Journey, how to learn English, English learning platform, daily reading practice, ESL tools, language learning features"
                ogImage="https://myenglish.my.id/og-image.jpg"
                url="https://myenglish.my.id/about"
                type="website"
            />

            {/* Header/Navigation - Swiss Design */}
            <header className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 fixed top-0 z-[100]">
                <nav className="max-w-6xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="group">
                            <img src="/logo-horizontal.svg" alt="English Fluency Journey" className="h-10" />
                        </Link>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2">
                            <Link
                                to="/donate"
                                className="group bg-[#880000] text-white px-4 py-2.5 text-xs font-medium uppercase tracking-[0.15em] hover:bg-[#660000] transition-all duration-300 flex items-center gap-2"
                            >
                                <Heart size={14} className="group-hover:scale-110 transition-transform" />
                                <span className="hidden md:inline">Donate</span>
                            </Link>
                            <button
                                onClick={() => navigate('/m1-day1')}
                                className="group bg-slate-900 text-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] hover:bg-[#880000] transition-all duration-300 flex items-center gap-2"
                            >
                                Start
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden mt-16 bg-gradient-to-br from-slate-800 via-slate-900 to-[#2a0a0a]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60"></div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
                    <div
                        className="flex items-center justify-center gap-3 mb-6 transition-all duration-700 ease-out"
                        style={{
                            opacity: isPageReady ? 1 : 0,
                            transform: isPageReady ? 'translateY(0)' : 'translateY(-20px)',
                            transitionDelay: '200ms'
                        }}
                    >
                        <div className="w-16 h-1 bg-[#880000]"></div>
                        <span className="text-xs text-white/60 uppercase tracking-[0.3em]">About This Platform</span>
                        <div className="w-16 h-1 bg-[#880000]"></div>
                    </div>

                    <h1
                        className="text-4xl md:text-6xl lg:text-7xl text-white mb-6 leading-[1.1] transition-all duration-700 ease-out"
                        style={{
                            opacity: isPageReady ? 1 : 0,
                            transform: isPageReady ? 'translateY(0)' : 'translateY(40px)',
                            transitionDelay: '300ms'
                        }}
                    >
                        <span className="font-extralight block">Master English</span>
                        <span className="font-bold text-[#ff6b6b] block">Through Reading</span>
                    </h1>

                    <p
                        className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto transition-all duration-700 ease-out"
                        style={{
                            opacity: isPageReady ? 1 : 0,
                            transform: isPageReady ? 'translateY(0)' : 'translateY(30px)',
                            transitionDelay: '450ms'
                        }}
                    >
                        A comprehensive 90-day journey designed to transform your English fluency through engaging stories, interactive tools, and proven learning methods.
                    </p>

                    {/* Stats */}
                    <div
                        className="flex flex-wrap justify-center gap-8 md:gap-12 mt-12 transition-all duration-700 ease-out"
                        style={{
                            opacity: isPageReady ? 1 : 0,
                            transform: isPageReady ? 'translateY(0)' : 'translateY(30px)',
                            transitionDelay: '600ms'
                        }}
                    >
                        <div>
                            <div className="text-5xl font-bold text-white leading-none">90</div>
                            <div className="text-xs text-white/50 uppercase tracking-[0.2em] mt-2">Days</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold text-white leading-none">30+</div>
                            <div className="text-xs text-white/50 uppercase tracking-[0.2em] mt-2">Countries</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold text-[#ff6b6b] leading-none">Free</div>
                            <div className="text-xs text-white/50 uppercase tracking-[0.2em] mt-2">Forever</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHAT Section */}
            <section
                id="what"
                className={`py-16 md:py-24 bg-white scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('what')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-12 gap-8">
                        <div className="md:col-span-3">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-1 bg-[#880000]"></div>
                                <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">What</span>
                            </div>
                            <div className="text-[80px] md:text-[120px] font-bold text-slate-100 leading-none -ml-2">01</div>
                        </div>

                        <div className="md:col-span-8 md:col-start-5">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                <span className="font-extralight">What is</span><br />
                                <span className="text-[#880000]">English Fluency Journey?</span>
                            </h2>

                            <div className="pl-6 border-l-2 border-slate-200 space-y-4">
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    English Fluency Journey is a <strong>free, web-based platform</strong> designed to help learners master English through daily reading practice. Over 90 days, you'll explore engaging stories from 30+ countries while building vocabulary, improving pronunciation, and tracking your progress.
                                </p>
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    Each day presents a new story with interactive features including click-to-define vocabulary, text-to-speech, teleprompter mode, and comprehensive assessments. No downloads, no subscriptions—just pure learning.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY Section */}
            <section
                id="why"
                className={`py-16 md:py-24 bg-stone-50 scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('why')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-12 gap-8">
                        <div className="md:col-span-3">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-1 bg-[#880000]"></div>
                                <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">Why</span>
                            </div>
                            <div className="text-[80px] md:text-[120px] font-bold text-slate-100 leading-none -ml-2">02</div>
                        </div>

                        <div className="md:col-span-8 md:col-start-5">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                <span className="font-extralight">Why use</span><br />
                                <span className="text-[#880000]">this platform?</span>
                            </h2>

                            <div className="space-y-6">
                                <div className="bg-white p-6 border-l-4 border-[#880000]">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">The Problem</h3>
                                    <p className="text-slate-600">
                                        Traditional language learning often focuses on isolated grammar rules and vocabulary lists, making it difficult to develop real fluency and confidence in using English naturally.
                                    </p>
                                </div>

                                <div className="bg-white p-6 border-l-4 border-slate-300">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">The Solution</h3>
                                    <p className="text-slate-600">
                                        Reading-based learning exposes you to authentic English in context, helping you absorb vocabulary, grammar patterns, and cultural nuances naturally—the same way native speakers learn.
                                    </p>
                                </div>

                                <div className="bg-white p-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">Key Benefits</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle size={20} className="text-[#880000] mt-0.5 flex-shrink-0" />
                                            <span className="text-slate-600"><strong>Vocabulary Expansion:</strong> Learn words in context with real usage examples</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle size={20} className="text-[#880000] mt-0.5 flex-shrink-0" />
                                            <span className="text-slate-600"><strong>Pronunciation Practice:</strong> Read aloud with teleprompter and TTS guidance</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle size={20} className="text-[#880000] mt-0.5 flex-shrink-0" />
                                            <span className="text-slate-600"><strong>Cultural Exposure:</strong> Discover stories from 30+ countries worldwide</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle size={20} className="text-[#880000] mt-0.5 flex-shrink-0" />
                                            <span className="text-slate-600"><strong>Consistent Habit:</strong> Daily practice builds lasting fluency</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHO Section */}
            <section
                id="who"
                className={`py-16 md:py-24 bg-white scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('who')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-12 gap-8">
                        <div className="md:col-span-3">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-1 bg-[#880000]"></div>
                                <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">Who</span>
                            </div>
                            <div className="text-[80px] md:text-[120px] font-bold text-slate-100 leading-none -ml-2">03</div>
                        </div>

                        <div className="md:col-span-8 md:col-start-5">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                <span className="font-extralight">Who is</span><br />
                                <span className="text-[#880000]">this for?</span>
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-stone-50 p-6">
                                    <Users className="text-[#880000] mb-3" size={32} />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">ESL Learners</h3>
                                    <p className="text-sm text-slate-600">
                                        Beginner to intermediate English learners seeking structured daily practice to build fluency and confidence.
                                    </p>
                                </div>

                                <div className="bg-stone-50 p-6">
                                    <Award className="text-[#880000] mb-3" size={32} />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Exam Preparation</h3>
                                    <p className="text-sm text-slate-600">
                                        Students preparing for TOEFL, IELTS, or other English proficiency tests who need reading comprehension practice.
                                    </p>
                                </div>

                                <div className="bg-stone-50 p-6">
                                    <Target className="text-[#880000] mb-3" size={32} />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Professionals</h3>
                                    <p className="text-sm text-slate-600">
                                        Working professionals improving business English and communication skills for career advancement.
                                    </p>
                                </div>

                                <div className="bg-stone-50 p-6">
                                    <Sparkles className="text-[#880000] mb-3" size={32} />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Lifelong Learners</h3>
                                    <p className="text-sm text-slate-600">
                                        Anyone seeking a consistent daily practice routine to maintain and improve their English skills.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHEN Section */}
            <section
                id="when"
                className={`py-16 md:py-24 bg-stone-50 scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('when')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-12 gap-8">
                        <div className="md:col-span-3">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-1 bg-[#880000]"></div>
                                <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">When</span>
                            </div>
                            <div className="text-[80px] md:text-[120px] font-bold text-slate-100 leading-none -ml-2">04</div>
                        </div>

                        <div className="md:col-span-8 md:col-start-5">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                <span className="font-extralight">When to</span><br />
                                <span className="text-[#880000]">practice?</span>
                            </h2>

                            <div className="pl-6 border-l-2 border-slate-200 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                                        <Clock size={20} className="text-[#880000]" />
                                        Daily Practice Schedule
                                    </h3>
                                    <p className="text-slate-600 mb-3">
                                        Dedicate 15-30 minutes each day to reading practice. Consistency is more important than duration. Choose a time that works best for you:
                                    </p>
                                    <ul className="space-y-2 text-slate-600">
                                        <li className="flex items-start gap-2">
                                            <span className="text-[#880000] font-bold">•</span>
                                            <span><strong>Morning:</strong> Start your day with focused learning</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[#880000] font-bold">•</span>
                                            <span><strong>Lunch Break:</strong> Quick practice during work breaks</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[#880000] font-bold">•</span>
                                            <span><strong>Evening:</strong> Wind down with engaging stories</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-white p-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">90-Day Journey Timeline</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-4">
                                            <div className="text-2xl font-bold text-[#880000] min-w-[60px]">Month 1</div>
                                            <div className="text-slate-600">Build foundation and establish daily habit</div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="text-2xl font-bold text-[#880000] min-w-[60px]">Month 2</div>
                                            <div className="text-slate-600">Expand vocabulary and improve fluency</div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="text-2xl font-bold text-[#880000] min-w-[60px]">Month 3</div>
                                            <div className="text-slate-600">Master advanced concepts and celebrate progress</div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-slate-600">
                                    <strong>Flexible Learning:</strong> Progress at your own pace. You can revisit previous stories, skip ahead after completing practice, or take breaks as needed. The platform tracks your progress automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHERE Section */}
            <section
                id="where"
                className={`py-16 md:py-24 bg-white scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('where')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-12 gap-8">
                        <div className="md:col-span-3">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-1 bg-[#880000]"></div>
                                <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">Where</span>
                            </div>
                            <div className="text-[80px] md:text-[120px] font-bold text-slate-100 leading-none -ml-2">05</div>
                        </div>

                        <div className="md:col-span-8 md:col-start-5">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                <span className="font-extralight">Where can</span><br />
                                <span className="text-[#880000]">you learn?</span>
                            </h2>

                            <div className="space-y-6">
                                <div className="bg-stone-50 p-6 border-l-4 border-[#880000]">
                                    <div className="flex items-start gap-4">
                                        <Globe className="text-[#880000] mt-1 flex-shrink-0" size={32} />
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">30+ Countries Featured</h3>
                                            <p className="text-slate-600 mb-3">
                                                Explore stories from diverse cultures around the world, including:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {['Japan', 'Brazil', 'Egypt', 'France', 'India', 'Australia', 'Kenya', 'Mexico', 'Norway', 'Thailand', 'And 20+ more...'].map((country, i) => (
                                                    <span key={i} className="text-xs bg-white px-3 py-1 text-slate-600 border border-slate-200">
                                                        {country}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-stone-50 p-6">
                                    <div className="flex items-start gap-4">
                                        <MapPin className="text-[#880000] mt-1 flex-shrink-0" size={32} />
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">Accessible Anywhere</h3>
                                            <p className="text-slate-600">
                                                <strong>100% web-based platform</strong> — no downloads or installations required. Access from any device with a browser:
                                            </p>
                                            <ul className="mt-3 space-y-2 text-slate-600">
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle size={16} className="text-[#880000]" />
                                                    Desktop computers and laptops
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle size={16} className="text-[#880000]" />
                                                    Tablets and iPads
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle size={16} className="text-[#880000]" />
                                                    Mobile phones (responsive design)
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW Section - Features Showcase */}
            <section
                id="how"
                className={`py-16 md:py-24 bg-stone-50 scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('how')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-12 gap-8 mb-12">
                        <div className="md:col-span-3">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-1 bg-[#880000]"></div>
                                <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">How</span>
                            </div>
                            <div className="text-[80px] md:text-[120px] font-bold text-slate-100 leading-none -ml-2">06</div>
                        </div>

                        <div className="md:col-span-8 md:col-start-5">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                <span className="font-extralight">How does</span><br />
                                <span className="text-[#880000]">it work?</span>
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                English Fluency Journey combines powerful learning tools into one seamless platform. Explore each feature below to discover how they work together to accelerate your English mastery.
                            </p>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="space-y-4">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            const isExpanded = expandedFeature === feature.id;

                            return (
                                <div key={feature.id} className="bg-white border border-slate-200 overflow-hidden">
                                    <button
                                        onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                                        className="w-full p-6 flex items-center justify-between hover:bg-stone-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-stone-100 flex items-center justify-center flex-shrink-0">
                                                <Icon className="text-[#880000]" size={24} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
                                                <p className="text-sm text-slate-500">{feature.description}</p>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            size={20}
                                            className={`text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {isExpanded && (
                                        <div className="px-6 pb-6 border-t border-slate-100">
                                            <ul className="mt-4 space-y-2">
                                                {feature.details.map((detail, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-slate-600">
                                                        <CheckCircle size={16} className="text-[#880000] mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm">{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Technology Stack Section */}
            <section
                id="features"
                className={`py-16 md:py-24 bg-white scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('features')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-12 h-1 bg-[#880000]"></div>
                            <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">Technology</span>
                            <div className="w-12 h-1 bg-[#880000]"></div>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Built with Modern Web Technologies
                        </h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Fast, reliable, and accessible platform powered by cutting-edge tools
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-stone-50 p-6 text-center">
                            <div className="flex items-center justify-center mb-3">
                                <Zap className="text-[#880000]" size={40} />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">React + Vite</h3>
                            <p className="text-sm text-slate-600">Lightning-fast modern framework</p>
                        </div>
                        <div className="bg-stone-50 p-6 text-center">
                            <div className="flex items-center justify-center mb-3">
                                <Book className="text-[#880000]" size={40} />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Free Dictionary API</h3>
                            <p className="text-sm text-slate-600">Real-time word definitions</p>
                        </div>
                        <div className="bg-stone-50 p-6 text-center">
                            <div className="flex items-center justify-center mb-3">
                                <Mic className="text-[#880000]" size={40} />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Browser TTS</h3>
                            <p className="text-sm text-slate-600">Native text-to-speech</p>
                        </div>
                        <div className="bg-stone-50 p-6 text-center">
                            <div className="flex items-center justify-center mb-3">
                                <Palette className="text-[#880000]" size={40} />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Canvas API</h3>
                            <p className="text-sm text-slate-600">Beautiful poster generation</p>
                        </div>
                        <div className="bg-stone-50 p-6 text-center">
                            <div className="flex items-center justify-center mb-3">
                                <Database className="text-[#880000]" size={40} />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">LocalStorage</h3>
                            <p className="text-sm text-slate-600">Automatic progress saving</p>
                        </div>
                        <div className="bg-stone-50 p-6 text-center">
                            <div className="flex items-center justify-center mb-3">
                                <Image className="text-[#880000]" size={40} />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Wikipedia API</h3>
                            <p className="text-sm text-slate-600">Cultural context images</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section
                id="cta"
                className={`py-20 md:py-32 bg-gradient-to-br from-slate-800 via-slate-900 to-[#2a0a0a] scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('cta')}`}
            >
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        <span className="font-extralight">Ready to begin</span><br />
                        <span className="text-[#ff6b6b]">your journey?</span>
                    </h2>
                    <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
                        Join thousands of learners improving their English through daily reading practice. Start today—it's completely free.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/m1-day1')}
                            className="group bg-[#880000] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] hover:bg-[#660000] transition-all duration-300 flex items-center gap-2"
                        >
                            Start Day 1
                            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="group bg-white/10 backdrop-blur-sm text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] hover:bg-white/20 transition-all duration-300"
                        >
                            Back to Home
                        </button>
                    </div>

                    {/* Support */}
                    <div className="mt-16 pt-8 border-t border-white/10">
                        <p className="text-white/50 text-sm mb-4">Love this platform? Support its development</p>
                        <Link
                            to="/donate"
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] hover:bg-white/20 transition-all duration-300"
                        >
                            <Heart size={14} />
                            Support Development
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default About;
