import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { BookOpen, Target, TrendingUp, Globe, Calendar, ArrowRight, Check, Users, Award, HeadphonesIcon } from 'lucide-react';
import month1Data from '../data/month1.json';
import month2Data from '../data/month2.json';
import month3Data from '../data/month3.json';

// Image cache
const imageCache = new Map();

const LandingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [heroSlides, setHeroSlides] = useState([]);
    const [isHovered, setIsHovered] = useState(false);
    const carouselIntervalRef = useRef(null);

    // Smooth scroll helper function
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };



    // Fetch Wikipedia image with caching
    const fetchWikipediaImage = async (searchTerm) => {
        if (!searchTerm) return null;

        // Check cache first
        if (imageCache.has(searchTerm)) {
            return imageCache.get(searchTerm);
        }

        try {
            const response = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
            );

            if (response.ok) {
                const data = await response.json();
                const imageUrl = data.originalimage?.source || data.thumbnail?.source;

                // Skip if no image or if it's an SVG (usually flags/icons)
                if (imageUrl && !imageUrl.includes('.svg') && !imageUrl.toLowerCase().includes('flag')) {
                    // Preload image
                    const img = new Image();
                    img.src = imageUrl;

                    const imageData = {
                        url: imageUrl,
                        title: data.title,
                        description: data.extract
                    };

                    // Cache the result
                    imageCache.set(searchTerm, imageData);
                    return imageData;
                }
            } else if (response.status === 404) {
                // Silently handle 404s - page doesn't exist
                return null;
            }
        } catch (error) {
            // Silently handle errors
            return null;
        }

        return null;
    };

    // Handle hash navigation
    useEffect(() => {
        if (location.hash) {
            const sectionId = location.hash.substring(1);
            // Increase delay to ensure DOM is ready and transitions are starting
            setTimeout(() => {
                scrollToSection(sectionId);
            }, 300);
        }
    }, [location]);

    // Collect all stories with wikiSearch field and fetch images
    useEffect(() => {
        const allStories = [
            ...month1Data.map(s => ({ ...s, month: 1 })),
            ...month2Data.map(s => ({ ...s, month: 2 })),
            ...month3Data.map(s => ({ ...s, month: 3 }))
        ].filter(story => story.wikiSearch);

        // Randomly select 5 stories
        const shuffled = [...allStories].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5);

        // Fetch Wikipedia images for selected stories
        const fetchImages = async () => {
            const slides = [];
            for (const story of selected) {
                if (story.wikiSearch) {
                    const imageData = await fetchWikipediaImage(story.wikiSearch);
                    if (imageData) {
                        slides.push({
                            ...imageData,
                            title: story.title,
                            month: story.month,
                            day: story.day,
                            country: story.country,
                            searchTerm: story.wikiSearch
                        });
                    }
                }
            }

            if (slides.length > 0) {
                setHeroSlides(slides);
            } else {
                // If no images found, still set up with at least one placeholder
                setIsMounted(true);
            }
        };

        fetchImages();
    }, []);

    // Auto-advance carousel
    useEffect(() => {
        if (heroSlides.length > 1 && !isHovered) {
            carouselIntervalRef.current = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
            }, 6000);
        }

        return () => {
            if (carouselIntervalRef.current) {
                clearInterval(carouselIntervalRef.current);
            }
        };
    }, [heroSlides.length, isHovered]);

    const handleHeroClick = () => {
        if (heroSlides[currentSlide]) {
            const slide = heroSlides[currentSlide];
            navigate(`/m${slide.month}-day${slide.day}`);
        }
    };

    return (
        <div className={`min-h-screen bg-white`}>
            {/* Header/Navigation */}
            <header className="w-full bg-white border-b border-slate-200 fixed top-0 z-[100]">
                <nav className="max-w-6xl mx-auto px-4 md:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#880000]">
                            <BookOpen size={24} />
                            <span className="font-bold text-sm md:text-base uppercase tracking-wider">English Reading Practice</span>
                        </div>
                        <div className="hidden md:flex items-center gap-6 relative z-[101]">
                            <Link
                                to="/#features"
                                className="text-slate-700 hover:text-[#880000] transition-colors text-sm font-medium cursor-pointer relative z-[102]"
                            >
                                Features
                            </Link>
                            <Link
                                to="/#how-it-works"
                                className="text-slate-700 hover:text-[#880000] transition-colors text-sm font-medium cursor-pointer relative z-[102]"
                            >
                                How It Works
                            </Link>
                            <Link
                                to="/#advantages"
                                className="text-slate-700 hover:text-[#880000] transition-colors text-sm font-medium cursor-pointer relative z-[102]"
                            >
                                Advantages
                            </Link>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/m1-day1');
                            }}
                            className="bg-[#880000] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#770000] transition-all flex items-center gap-2 relative z-[102] cursor-pointer"
                        >
                            Start Challenge
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section
                className="relative min-h-screen flex items-center justify-center overflow-hidden cursor-pointer mt-16 z-10"
                onClick={handleHeroClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Background Images Carousel */}
                {heroSlides.length > 0 && (
                    <>
                        {heroSlides.map((slide, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                                    }`}
                            >
                                <img
                                    src={slide.url}
                                    alt={slide.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </>
                )}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50"></div>

                {/* Content Overlay - Split Layout */}
                <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 w-full">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left Side - Headline and Stats */}
                        <div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 leading-tight">
                                <span className="font-light">Master English Through</span><br />
                                <span className="font-bold text-white drop-shadow-[0_2px_8px_rgba(136,0,0,0.8)]">Daily Reading</span>
                            </h1>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div>
                                    <div className="text-4xl md:text-5xl font-bold text-white mb-1">90</div>
                                    <div className="text-sm text-white/80 uppercase tracking-wider">Days of Content</div>
                                </div>
                                <div>
                                    <div className="text-4xl md:text-5xl font-bold text-white mb-1">30</div>
                                    <div className="text-sm text-white/80 uppercase tracking-wider">Countries Featured</div>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/m1-day1');
                                }}
                                className="bg-white text-[#880000] px-8 py-4 rounded-lg font-bold text-lg transition-all hover:bg-[#880000] hover:text-white flex items-center gap-2"
                            >
                                Start Day 1 Challenge
                                <ArrowRight size={20} />
                            </button>
                        </div>

                        {/* Right Side - Description */}
                        <div>
                            <p className="text-xl md:text-2xl text-white leading-relaxed mb-6">
                                Transforming language learning through engaging stories, interactive practice, and comprehensive vocabulary building from around the world.
                            </p>
                            <p className="text-sm text-white/70 uppercase tracking-wider">
                                Serving learners since 2024
                            </p>
                        </div>
                    </div>
                </div>

                {/* Carousel Dots */}
                {heroSlides.length > 1 && (
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
                        {heroSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentSlide(index);
                                }}
                                className={`transition-all ${index === currentSlide
                                    ? 'w-8 bg-white'
                                    : 'w-2 bg-white/50 hover:bg-white/75'
                                    } h-2 rounded-full`}
                            />
                        ))}
                    </div>
                )}

                {/* Click Hint */}
                <div
                    className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 text-white/70 text-sm uppercase tracking-wider"
                    style={{
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 300ms ease-out'
                    }}
                >
                    Click to view story →
                </div>
            </section>

            {/* About Section */}
            <section
                id="about"
                className="py-20 md:py-32 bg-white scroll-mt-20"
            >
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 underline decoration-[#880000] decoration-2 underline-offset-4">
                                About Us.
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                English Reading Practice was created to help learners build fluency through consistent,
                                engaging daily practice. Each story is carefully selected to expose you to new vocabulary,
                                cultural insights, and authentic English from around the world.
                            </p>
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Globe className="text-[#880000]" size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 mb-1">Active Worldwide</div>
                                        <div className="text-sm text-slate-600">30+ countries featured with diverse cultural stories</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="text-[#880000]" size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 mb-1">90 Stories</div>
                                        <div className="text-sm text-slate-600">Comprehensive content across 3 months</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Globe className="text-slate-300" size={64} />
                                    </div>
                                </div>
                                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen className="text-slate-300" size={64} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section
                id="features"
                className="py-20 md:py-32 bg-stone-50 scroll-mt-20"
            >
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <div className="flex items-start justify-between mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
                            Comprehensive Learning Tools<br />
                            <span className="text-[#880000]">Tailored to Your Needs</span>
                        </h2>
                        <ArrowRight className="text-[#880000] hidden md:block" size={32} />
                    </div>

                    <div className="space-y-8">
                        {/* Service 1 */}
                        <div className="grid md:grid-cols-3 gap-8 items-start">
                            <div className="text-6xl font-bold text-slate-200">01.</div>
                            <div className="md:col-span-2">
                                <div className="flex items-start gap-6 mb-4">
                                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="text-slate-300" size={48} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Daily Reading Practice</h3>
                                        <p className="text-slate-600 mb-4">
                                            Engage with carefully curated stories from 30 different countries. Each story includes
                                            vocabulary highlights, pronunciation guides, and cultural context to enhance your learning experience.
                                        </p>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Features</div>
                                        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                            <span>Interactive Text</span>
                                            <span>•</span>
                                            <span>Word Definitions</span>
                                            <span>•</span>
                                            <span>Wikipedia Images</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Service 2 */}
                        <div className="grid md:grid-cols-3 gap-8 items-start">
                            <div className="text-6xl font-bold text-slate-200">02.</div>
                            <div className="md:col-span-2">
                                <div className="flex items-start gap-6 mb-4">
                                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Target className="text-slate-300" size={48} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Teleprompter & Pronunciation</h3>
                                        <p className="text-slate-600 mb-4">
                                            Practice reading aloud with our teleprompter mode. Adjustable scroll speed, text size,
                                            and text-to-speech functionality help you perfect your pronunciation and reading fluency.
                                        </p>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Features</div>
                                        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                            <span>Teleprompter Mode</span>
                                            <span>•</span>
                                            <span>Text-to-Speech</span>
                                            <span>•</span>
                                            <span>Speed Control</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Service 3 */}
                        <div className="grid md:grid-cols-3 gap-8 items-start">
                            <div className="text-6xl font-bold text-slate-200">03.</div>
                            <div className="md:col-span-2">
                                <div className="flex items-start gap-6 mb-4">
                                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <TrendingUp className="text-slate-300" size={48} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Progress Tracking & Assessment</h3>
                                        <p className="text-slate-600 mb-4">
                                            Monitor your learning journey with detailed statistics, streak tracking, and comprehensive
                                            assessments. Printable PDF worksheets with quizzes help reinforce your learning.
                                        </p>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Features</div>
                                        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                            <span>Progress Dashboard</span>
                                            <span>•</span>
                                            <span>Streak Tracking</span>
                                            <span>•</span>
                                            <span>PDF Worksheets</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section
                id="how-it-works"
                className="py-20 md:py-32 bg-white scroll-mt-20"
            >
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 underline decoration-[#880000] decoration-2 underline-offset-4">
                        How It Works.
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-16">
                        Simple Steps to <span className="text-[#880000]">Master English</span>
                    </h3>

                    <div className="grid md:grid-cols-4 gap-8 md:gap-12">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#880000] text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-2xl">
                                1
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-3">Choose Your Day</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Start with Day 1 and unlock new stories as you progress through the challenge
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#880000] text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-2xl">
                                2
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-3">Read & Practice</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Use teleprompter mode and listen to perfect pronunciation with text-to-speech
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#880000] text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-2xl">
                                3
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-3">Build Vocabulary</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Master key words with interactive flashcards and comprehensive definitions
                            </p>
                        </div>

                        {/* Step 4 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#880000] text-white rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-2xl">
                                4
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-3">Track Your Growth</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Watch your streak grow and earn achievement badges as you progress
                            </p>
                        </div>
                    </div>

                    {/* Visual Flow Indicator */}
                    <div className="hidden md:flex items-center justify-center mt-12 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-0.5 bg-[#880000]"></div>
                            <div className="w-12 h-0.5 bg-[#880000]"></div>
                            <div className="w-12 h-0.5 bg-[#880000]"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Advantages Section */}
            <section
                id="advantages"
                className="py-20 md:py-32 bg-white scroll-mt-20"
            >
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 underline decoration-[#880000] decoration-2 underline-offset-4">
                        Our Advantage.
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-12">
                        The Strategic Edge That Sets Us Apart
                    </h3>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Left Column */}
                        <div className="space-y-8 border-r border-slate-200 pr-8">
                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Users className="text-slate-300" size={40} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Experienced Content</h4>
                                    <p className="text-slate-600">
                                        Over 90 carefully curated stories with proven effectiveness in building vocabulary and
                                        improving reading comprehension across diverse cultural contexts.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Award className="text-slate-300" size={40} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Proven Track Record</h4>
                                    <p className="text-slate-600">
                                        90 days of structured content designed to build consistent learning habits and
                                        measurable improvement in English fluency.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <HeadphonesIcon className="text-slate-300" size={40} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Dedicated Support</h4>
                                    <p className="text-slate-600">
                                        Comprehensive learning tools including flashcards, vocabulary builders, and
                                        interactive assessments to support your learning journey.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Globe className="text-slate-300" size={40} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Global Reach</h4>
                                    <p className="text-slate-600">
                                        Stories from 30 countries provide authentic cultural context and diverse
                                        perspectives to enhance your understanding of English in real-world contexts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section
                className="py-20 md:py-32 bg-[#880000] text-white"
            >
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Ready to Start Your English Journey?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join the challenge and see your English improve day by day.
                    </p>
                    <p className="text-sm opacity-75">
                        No download needed. Start reading in 5 seconds.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer
                className="bg-slate-900 text-white py-12"
            >
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <img
                            src="/profile.jpg"
                            alt="Mr. Zayn"
                            className="w-12 h-12 rounded-full border-2 border-[#880000] object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <span className="font-bold">Created by Mr. Zayn</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                        © 2025 English Fluency Journey. Created for learners worldwide.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
