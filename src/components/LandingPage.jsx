import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { BookOpen, Target, TrendingUp, Globe, ArrowRight, Users, Award, HeadphonesIcon, Github, Instagram, Mail, Heart } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [heroSlides, setHeroSlides] = useState([]);
    const [isHovered, setIsHovered] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [showCarousel, setShowCarousel] = useState(false);
    const [isPageReady, setIsPageReady] = useState(false);
    const [visibleSections, setVisibleSections] = useState(new Set());
    const carouselIntervalRef = useRef(null);
    const sectionsRef = useRef({});

    // Smooth scroll helper function with highlight animation
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            // Remove section from visible set to re-trigger animation
            setVisibleSections(prev => {
                const newSet = new Set(prev);
                newSet.delete(sectionId);
                return newSet;
            });

            element.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Re-add after scroll completes to trigger animation
            setTimeout(() => {
                setVisibleSections(prev => new Set([...prev, sectionId]));
            }, 600);
        }
    };

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
        const sections = ['about', 'features', 'how-it-works', 'advantages'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, []);



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

    // Use local hero images first, fall back to Wikipedia API
    useEffect(() => {
        const fetchImages = async () => {
            try {
                // PRIORITY 1: Try to load local hero images first
                let localHeroImages = [];
                try {
                    const response = await fetch('/images/hero/hero-images.json');
                    if (response.ok) {
                        localHeroImages = await response.json();
                    }
                } catch (e) {
                    console.log('No local hero images found, falling back to API');
                }

                if (localHeroImages.length > 0) {
                    // Shuffle and select 5 local images
                    const shuffled = [...localHeroImages].sort(() => Math.random() - 0.5);
                    const selected = shuffled.slice(0, 5);

                    // Preload local images
                    const preloadPromises = selected.map(slide => {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => resolve({
                                url: slide.localImage,
                                title: slide.title,
                                description: slide.description,
                                searchTerm: slide.searchTerm
                            });
                            img.onerror = () => resolve(null);
                            img.src = slide.localImage;
                        });
                    });

                    const loadedSlides = await Promise.all(preloadPromises);
                    const successfulSlides = loadedSlides.filter(s => s !== null);

                    if (successfulSlides.length > 0) {
                        setHeroSlides(successfulSlides);
                        setImagesLoaded(true);
                        setTimeout(() => setShowCarousel(true), 100);
                        return;
                    }
                }

                // No local images found - show carousel without images
                setImagesLoaded(true);
                setShowCarousel(true);
            } catch (error) {
                console.error('Error fetching hero images:', error);
                setImagesLoaded(true);
                setShowCarousel(true);
            }
        };

        fetchImages();
    }, []);

    // Auto-advance carousel
    useEffect(() => {
        // Clear any existing interval
        if (carouselIntervalRef.current) {
            clearInterval(carouselIntervalRef.current);
            carouselIntervalRef.current = null;
        }

        if (heroSlides.length > 1 && !isHovered) {
            carouselIntervalRef.current = setInterval(() => {
                setCurrentSlide((prev) => {
                    const next = (prev + 1) % heroSlides.length;
                    return next;
                });
            }, 6000);
        }

        return () => {
            if (carouselIntervalRef.current) {
                clearInterval(carouselIntervalRef.current);
                carouselIntervalRef.current = null;
            }
        };
    }, [heroSlides.length, isHovered]);

    const handleHeroClick = () => {
        // Navigate to first day since landmarks don't correspond to specific stories
        navigate('/m1-day1');
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Helper to get section animation class
    const getSectionClass = (sectionId) => {
        return visibleSections.has(sectionId)
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8';
    };

    return (
        <div className={`min-h-screen bg-white transition-opacity duration-700 ${isPageReady ? 'opacity-100' : 'opacity-0'}`}>
            {/* Header/Navigation - Swiss Design */}
            <header
                className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 fixed top-0 z-[100] transition-all duration-500 ease-out"
                style={{
                    opacity: isPageReady ? 1 : 0,
                    transform: isPageReady ? 'translateY(0)' : 'translateY(-100%)'
                }}
            >
                <nav className="max-w-6xl mx-auto px-4 md:px-6">
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="group">
                            <img src="/logo-horizontal.svg" alt="English Fluency Journey" className="h-10" />
                        </Link>

                        {/* Center Links */}
                        <div className="flex items-center gap-8">
                            <button
                                onClick={() => scrollToSection('about')}
                                className="text-xs text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] relative z-[102]"
                            >
                                About
                            </button>
                            <button
                                onClick={() => scrollToSection('features')}
                                className="text-xs text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] relative z-[102]"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => scrollToSection('how-it-works')}
                                className="text-xs text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] relative z-[102]"
                            >
                                Process
                            </button>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2">
                            {/* Donate Button */}
                            <a
                                href="https://ko-fi.com/mrzayn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group bg-[#880000] text-white px-4 py-2.5 text-xs font-medium uppercase tracking-[0.15em] hover:bg-[#660000] transition-all duration-300 flex items-center gap-2 relative z-[102]"
                            >
                                <Heart size={14} className="group-hover:scale-110 transition-transform" />
                                Donate
                            </a>

                            {/* CTA Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/m1-day1');
                                }}
                                className="group bg-slate-900 text-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] hover:bg-[#880000] transition-all duration-300 flex items-center gap-2 relative z-[102] cursor-pointer"
                            >
                                Start
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden flex items-center justify-between h-14">
                        {/* Logo - Compact */}
                        <Link to="/" className="block">
                            <img src="/logo-horizontal.svg" alt="English Fluency Journey" className="h-8" />
                        </Link>

                        {/* Right Side - Menu Toggle + CTA */}
                        <div className="flex items-center gap-2">
                            <a
                                href="https://ko-fi.com/X8X01SBFAD"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#880000] text-white p-1.5 hover:bg-[#660000] transition-colors"
                            >
                                <Heart size={14} />
                            </a>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/m1-day1');
                                }}
                                className="bg-slate-900 text-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider hover:bg-[#880000] transition-colors"
                            >
                                Start
                            </button>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
                            >
                                <span className={`block w-5 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                                <span className={`block w-5 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`block w-5 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Mobile Menu Dropdown */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${isMobileMenuOpen ? 'max-h-64 border-t border-slate-100' : 'max-h-0'}`}
                >
                    <div className="px-4 py-6 bg-white space-y-1">
                        <button
                            onClick={() => { setIsMobileMenuOpen(false); setTimeout(() => scrollToSection('about'), 100); }}
                            className="block w-full text-left py-3 text-xs text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50"
                        >
                            About
                        </button>
                        <button
                            onClick={() => { setIsMobileMenuOpen(false); setTimeout(() => scrollToSection('features'), 100); }}
                            className="block w-full text-left py-3 text-xs text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50"
                        >
                            Features
                        </button>
                        <button
                            onClick={() => { setIsMobileMenuOpen(false); setTimeout(() => scrollToSection('how-it-works'), 100); }}
                            className="block w-full text-left py-3 text-xs text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50"
                        >
                            Process
                        </button>
                        <button
                            onClick={() => { setIsMobileMenuOpen(false); setTimeout(() => scrollToSection('advantages'), 100); }}
                            className="block w-full text-left py-3 text-xs text-slate-500 uppercase tracking-[0.2em]"
                        >
                            Advantages
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section
                className="relative min-h-[calc(100vh-3.5rem)] md:min-h-screen flex items-stretch md:items-center justify-center overflow-hidden cursor-pointer mt-14 md:mt-16 z-10"
                onClick={handleHeroClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Static Background - always visible */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-[#2a0a0a]" />

                {/* Background Images Carousel - fades in after preload */}
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                        opacity: showCarousel ? 1 : 0,
                        transition: 'opacity 1s ease-out'
                    }}
                >
                    {heroSlides.map((slide, index) => {
                        const isActive = index === currentSlide;
                        const isPrevious = index === (currentSlide - 1 + heroSlides.length) % heroSlides.length;

                        return (
                            <div
                                key={`${slide.searchTerm}-${index}`}
                                className="absolute inset-0"
                                style={{
                                    opacity: isActive ? 1 : 0,
                                    transition: 'opacity 1.5s ease-in-out',
                                    willChange: 'opacity',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    zIndex: isActive ? 2 : (isPrevious ? 1 : 0),
                                    pointerEvents: 'none'
                                }}
                            >
                                <img
                                    src={slide.url}
                                    alt={slide.title}
                                    className={`w-full h-full object-cover ${showCarousel ? 'animate-ken-burns' : ''}`}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        pointerEvents: 'none'
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Dark Overlay - Gradient for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 z-[5]"></div>

                {/* Swiss Design Content Overlay */}
                <div className="relative z-10 w-full h-full flex flex-col">

                    {/* Mobile Layout - Vertical Swiss Grid */}
                    <div className="md:hidden flex flex-col h-full px-6 pt-8 pb-6">
                        {/* Top Section - Accent Line + Label */}
                        <div
                            className="mb-auto transition-all duration-700 ease-out"
                            style={{
                                opacity: isPageReady ? 1 : 0,
                                transform: isPageReady ? 'translateY(0)' : 'translateY(-20px)',
                                transitionDelay: '200ms'
                            }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-1 bg-[#880000]"></div>
                                <span className="text-[10px] text-white/60 uppercase tracking-[0.3em] font-medium">English Fluency Journey</span>
                            </div>
                        </div>

                        {/* Middle Section - Main Content */}
                        <div className="mb-auto">
                            {/* Headline - Strong Typography */}
                            <h1 className="mb-8">
                                <span
                                    className="block text-[11vw] leading-[0.9] font-extralight text-white/90 tracking-tight transition-all duration-700 ease-out"
                                    style={{
                                        opacity: isPageReady ? 1 : 0,
                                        transform: isPageReady ? 'translateY(0)' : 'translateY(30px)',
                                        transitionDelay: '300ms'
                                    }}
                                >Master</span>
                                <span
                                    className="block text-[11vw] leading-[0.9] font-extralight text-white/90 tracking-tight transition-all duration-700 ease-out"
                                    style={{
                                        opacity: isPageReady ? 1 : 0,
                                        transform: isPageReady ? 'translateY(0)' : 'translateY(30px)',
                                        transitionDelay: '400ms'
                                    }}
                                >English</span>
                                <span
                                    className="block text-[11vw] leading-[0.9] font-bold text-white tracking-tight transition-all duration-700 ease-out"
                                    style={{
                                        opacity: isPageReady ? 1 : 0,
                                        transform: isPageReady ? 'translateY(0)' : 'translateY(30px)',
                                        transitionDelay: '500ms'
                                    }}
                                >Through</span>
                                <span
                                    className="block text-[11vw] leading-[0.9] font-bold text-[#ff6b6b] tracking-tight transition-all duration-700 ease-out"
                                    style={{
                                        opacity: isPageReady ? 1 : 0,
                                        transform: isPageReady ? 'translateY(0)' : 'translateY(30px)',
                                        transitionDelay: '600ms'
                                    }}
                                >Reading</span>
                            </h1>

                            {/* Description - Offset for Swiss asymmetry */}
                            <div
                                className="pl-4 border-l-2 border-white/20 mb-10 transition-all duration-700 ease-out"
                                style={{
                                    opacity: isPageReady ? 1 : 0,
                                    transform: isPageReady ? 'translateX(0)' : 'translateX(-20px)',
                                    transitionDelay: '700ms'
                                }}
                            >
                                <p className="text-base text-white/70 leading-relaxed max-w-[280px]">
                                    Transforming language learning through engaging stories from around the world.
                                </p>
                            </div>
                        </div>

                        {/* Bottom Section - Stats Row */}
                        <div
                            className="mt-auto transition-all duration-700 ease-out"
                            style={{
                                opacity: isPageReady ? 1 : 0,
                                transform: isPageReady ? 'translateY(0)' : 'translateY(30px)',
                                transitionDelay: '800ms'
                            }}
                        >
                            {/* Stats - Swiss Grid Numbers */}
                            <div className="flex items-end justify-between border-t border-white/10 pt-6">
                                <div>
                                    <div className="text-5xl font-bold text-white leading-none">90</div>
                                    <div className="text-[9px] text-white/50 uppercase tracking-[0.2em] mt-1">Days</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-white leading-none">30</div>
                                    <div className="text-[9px] text-white/50 uppercase tracking-[0.2em] mt-1">Countries</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-5xl font-bold text-[#ff6b6b] leading-none">Free</div>
                                    <div className="text-[9px] text-white/50 uppercase tracking-[0.2em] mt-1">Forever</div>
                                </div>
                            </div>

                            {/* CTA Hint */}
                            <div className="flex items-center justify-center gap-2 mt-8 text-white/50">
                                <span className="text-xs uppercase tracking-wider">Tap to begin</span>
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Layout - Original Grid */}
                    <div className="hidden md:flex items-center justify-center h-full max-w-6xl mx-auto px-6 w-full">
                        <div className="grid md:grid-cols-2 gap-16 items-center w-full">
                            {/* Left Side - Headline and Stats */}
                            <div>
                                <div
                                    className="flex items-center gap-3 mb-6 transition-all duration-700 ease-out"
                                    style={{
                                        opacity: isPageReady ? 1 : 0,
                                        transform: isPageReady ? 'translateY(0)' : 'translateY(-20px)',
                                        transitionDelay: '200ms'
                                    }}
                                >
                                    <div className="w-16 h-1 bg-[#880000]"></div>
                                    <span className="text-xs text-white/60 uppercase tracking-[0.3em]">90-Day Challenge</span>
                                </div>

                                <h1 className="text-6xl lg:text-7xl text-white mb-10 leading-[0.95]">
                                    <span
                                        className="font-extralight block transition-all duration-700 ease-out"
                                        style={{
                                            opacity: isPageReady ? 1 : 0,
                                            transform: isPageReady ? 'translateY(0)' : 'translateY(40px)',
                                            transitionDelay: '300ms'
                                        }}
                                    >Master English</span>
                                    <span
                                        className="font-bold block transition-all duration-700 ease-out"
                                        style={{
                                            opacity: isPageReady ? 1 : 0,
                                            transform: isPageReady ? 'translateY(0)' : 'translateY(40px)',
                                            transitionDelay: '450ms'
                                        }}
                                    >Through</span>
                                    <span
                                        className="font-bold text-[#ff6b6b] block transition-all duration-700 ease-out"
                                        style={{
                                            opacity: isPageReady ? 1 : 0,
                                            transform: isPageReady ? 'translateY(0)' : 'translateY(40px)',
                                            transitionDelay: '600ms'
                                        }}
                                    >Daily Reading</span>
                                </h1>

                                {/* Stats */}
                                <div
                                    className="flex gap-12 transition-all duration-700 ease-out"
                                    style={{
                                        opacity: isPageReady ? 1 : 0,
                                        transform: isPageReady ? 'translateY(0)' : 'translateY(30px)',
                                        transitionDelay: '750ms'
                                    }}
                                >
                                    <div>
                                        <div className="text-6xl font-bold text-white leading-none">90</div>
                                        <div className="text-xs text-white/50 uppercase tracking-[0.2em] mt-2">Days of Content</div>
                                    </div>
                                    <div>
                                        <div className="text-6xl font-bold text-white leading-none">30</div>
                                        <div className="text-xs text-white/50 uppercase tracking-[0.2em] mt-2">Countries</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Description */}
                            <div
                                className="pl-8 border-l border-white/20 transition-all duration-700 ease-out"
                                style={{
                                    opacity: isPageReady ? 1 : 0,
                                    transform: isPageReady ? 'translateX(0)' : 'translateX(40px)',
                                    transitionDelay: '500ms'
                                }}
                            >
                                <p className="text-2xl text-white/80 leading-relaxed mb-8">
                                    Transforming language learning through engaging stories, interactive practice, and comprehensive vocabulary building from around the world.
                                </p>
                                <p className="text-sm text-white/50 uppercase tracking-[0.2em]">
                                    Serving learners since 2024
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carousel Dots - Swiss Minimal Style */}
                {heroSlides.length > 1 && (
                    <div className="absolute bottom-6 md:bottom-8 left-6 md:left-1/2 md:transform md:-translate-x-1/2 z-10 flex gap-2 md:gap-2">
                        {heroSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentSlide(index);
                                }}
                                className={`transition-all duration-300 ${index === currentSlide
                                    ? 'w-6 md:w-8 bg-[#880000]'
                                    : 'w-1.5 md:w-2 bg-white/30 hover:bg-white/50'
                                    } h-1.5 md:h-2 rounded-full`}
                            />
                        ))}
                    </div>
                )}

                {/* Click Hint - Desktop only */}
                <div
                    className="hidden md:block absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 text-white/70 text-sm uppercase tracking-wider"
                    style={{
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 300ms ease-out'
                    }}
                >
                    Click to view story →
                </div>
            </section>

            {/* About Section - Swiss Design */}
            <section
                id="about"
                className={`py-16 md:py-32 bg-white scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('about')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    {/* Mobile Layout */}
                    <div className="md:hidden">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-1 bg-[#880000]"></div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-[0.3em]">About Us</span>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">
                            <span className="font-extralight">Building fluency</span><br />
                            <span className="text-[#880000]">one story at a time</span>
                        </h2>

                        {/* Description */}
                        <div className="pl-4 border-l-2 border-slate-200 mb-10">
                            <p className="text-base text-slate-500 leading-relaxed">
                                English Fluency Journey was created to help learners build fluency through consistent, engaging daily practice with stories from around the world.
                            </p>
                        </div>

                        {/* Stats - Horizontal */}
                        <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-8">
                            <div>
                                <div className="text-4xl font-bold text-slate-900 leading-none">30+</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-[0.15em] mt-2">Countries</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-slate-900 leading-none">90</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-[0.15em] mt-2">Stories</div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Layout - Swiss Asymmetric Grid */}
                    <div className="hidden md:block">
                        <div className="grid grid-cols-12 gap-8">
                            {/* Left Column - Large Number + Label */}
                            <div className="col-span-3">
                                <div className="sticky top-32">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-1 bg-[#880000]"></div>
                                        <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">About</span>
                                    </div>
                                    <div className="text-[120px] font-bold text-slate-100 leading-none -ml-2">01</div>
                                </div>
                            </div>

                            {/* Right Column - Content */}
                            <div className="col-span-8 col-start-5">
                                {/* Headline */}
                                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-8 leading-[1.1]">
                                    <span className="font-extralight">Building fluency through</span><br />
                                    <span className="text-[#880000]">daily reading practice</span>
                                </h2>

                                {/* Description with left border */}
                                <div className="pl-8 border-l border-slate-200 mb-12">
                                    <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
                                        English Fluency Journey was created to help learners build fluency through consistent,
                                        engaging daily practice. Each story is carefully selected to expose you to new vocabulary,
                                        cultural insights, and authentic English from around the world.
                                    </p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-0 border-t border-slate-100">
                                    <div className="py-8 pr-8 border-r border-slate-100">
                                        <div className="text-5xl font-bold text-slate-900 leading-none">30</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-[0.2em] mt-3">Countries Featured</div>
                                        <div className="w-6 h-0.5 bg-[#880000] mt-4"></div>
                                    </div>
                                    <div className="py-8 px-8 border-r border-slate-100">
                                        <div className="text-5xl font-bold text-slate-900 leading-none">90</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-[0.2em] mt-3">Unique Stories</div>
                                        <div className="w-6 h-0.5 bg-[#880000] mt-4"></div>
                                    </div>
                                    <div className="py-8 pl-8">
                                        <div className="text-5xl font-bold text-slate-900 leading-none">3</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-[0.2em] mt-3">Months Journey</div>
                                        <div className="w-6 h-0.5 bg-[#880000] mt-4"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section - Swiss Design */}
            <section
                id="features"
                className={`py-16 md:py-32 bg-stone-100 scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('features')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-1 bg-[#880000]"></div>
                        <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-[0.3em]">Features</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 md:mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-4 md:mb-0">
                            <span className="font-extralight">Learning tools</span><br />
                            <span className="text-[#880000]">tailored for you</span>
                        </h2>
                        <p className="text-sm text-slate-400 max-w-xs md:text-right">
                            Three pillars of effective language learning, designed for daily practice.
                        </p>
                    </div>

                    {/* Mobile Layout - Stacked Cards */}
                    <div className="md:hidden space-y-6">
                        {[
                            {
                                num: '01',
                                icon: BookOpen,
                                title: 'Daily Reading',
                                desc: 'Engage with curated stories from 30 countries with vocabulary highlights and cultural context.',
                                features: ['Interactive Text', 'Definitions', 'Images']
                            },
                            {
                                num: '02',
                                icon: Target,
                                title: 'Pronunciation',
                                desc: 'Practice reading aloud with teleprompter mode, text-to-speech, and adjustable speed.',
                                features: ['Teleprompter', 'TTS', 'Speed Control']
                            },
                            {
                                num: '03',
                                icon: TrendingUp,
                                title: 'Progress Tracking',
                                desc: 'Monitor your journey with statistics, streak tracking, and printable PDF worksheets.',
                                features: ['Dashboard', 'Streaks', 'Worksheets']
                            }
                        ].map((service, i) => (
                            <div key={i} className="bg-white p-6 relative">
                                {/* Number Badge */}
                                <div className="absolute -top-3 -left-1 text-5xl font-bold text-stone-200/80">{service.num}</div>

                                {/* Content */}
                                <div className="pt-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-stone-100 flex items-center justify-center">
                                            <service.icon className="text-[#880000]" size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">{service.title}</h3>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{service.desc}</p>

                                    {/* Feature Tags */}
                                    <div className="flex flex-wrap gap-2">
                                        {service.features.map((f, j) => (
                                            <span key={j} className="text-[10px] uppercase tracking-wider text-slate-400 bg-stone-50 px-2 py-1">
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Layout - Swiss Grid */}
                    <div className="hidden md:grid grid-cols-3 gap-0 border-t border-stone-200">
                        {[
                            {
                                num: '01',
                                icon: BookOpen,
                                title: 'Daily Reading Practice',
                                desc: 'Engage with carefully curated stories from 30 different countries. Each story includes vocabulary highlights, pronunciation guides, and cultural context.',
                                features: ['Interactive Text', 'Word Definitions', 'Wikipedia Images']
                            },
                            {
                                num: '02',
                                icon: Target,
                                title: 'Teleprompter & Pronunciation',
                                desc: 'Practice reading aloud with our teleprompter mode. Adjustable scroll speed, text size, and text-to-speech functionality for perfect pronunciation.',
                                features: ['Teleprompter Mode', 'Text-to-Speech', 'Speed Control']
                            },
                            {
                                num: '03',
                                icon: TrendingUp,
                                title: 'Progress & Assessment',
                                desc: 'Monitor your learning journey with detailed statistics, streak tracking, and comprehensive assessments. Printable PDF worksheets with quizzes.',
                                features: ['Progress Dashboard', 'Streak Tracking', 'PDF Worksheets']
                            }
                        ].map((service, i) => (
                            <div key={i} className={`pt-12 pb-8 ${i < 2 ? 'pr-12 border-r border-stone-200' : 'pl-12'} ${i === 1 ? 'pl-12' : ''}`}>
                                {/* Large Ghost Number */}
                                <div className="text-8xl font-bold text-stone-200/50 leading-none mb-6">{service.num}</div>

                                {/* Icon + Title */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-white flex items-center justify-center">
                                        <service.icon className="text-[#880000]" size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{service.title}</h3>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-slate-500 leading-relaxed mb-6">{service.desc}</p>

                                {/* Feature Tags */}
                                <div className="space-y-2">
                                    {service.features.map((f, j) => (
                                        <div key={j} className="flex items-center gap-2">
                                            <div className="w-1 h-1 bg-[#880000] rounded-full"></div>
                                            <span className="text-xs text-slate-400 uppercase tracking-wider">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Accent Line */}
                                <div className="w-8 h-0.5 bg-[#880000] mt-8"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section - Swiss Design */}
            <section
                id="how-it-works"
                className={`py-16 md:py-32 bg-slate-950 text-white scroll-mt-20 overflow-hidden transition-all duration-700 ease-out ${getSectionClass('how-it-works')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-1 bg-[#880000]"></div>
                        <span className="text-[10px] md:text-xs text-white/50 uppercase tracking-[0.3em]">The Process</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-16 md:mb-24 leading-tight">
                        <span className="font-extralight text-white/80">Four steps to</span><br />
                        <span className="text-[#ff6b6b]">master English</span>
                    </h2>

                    {/* Mobile Layout - Vertical Timeline */}
                    <div className="md:hidden space-y-0">
                        {[
                            { num: '01', title: 'Choose Your Day', desc: 'Start with Day 1 and unlock new stories as you progress through the challenge' },
                            { num: '02', title: 'Read & Practice', desc: 'Use teleprompter mode and listen to perfect pronunciation with text-to-speech' },
                            { num: '03', title: 'Build Vocabulary', desc: 'Master key words with interactive flashcards and comprehensive definitions' },
                            { num: '04', title: 'Track Your Growth', desc: 'Watch your streak grow and earn achievement badges as you progress' }
                        ].map((step, i) => (
                            <div key={i} className="relative pl-16 pb-12 last:pb-0">
                                {/* Vertical Line */}
                                {i < 3 && <div className="absolute left-[27px] top-12 w-px h-full bg-white/10"></div>}
                                {/* Number Circle */}
                                <div className="absolute left-0 top-0 w-14 h-14 border border-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-bold text-[#ff6b6b]">{step.num}</span>
                                </div>
                                {/* Content */}
                                <div className="pt-2">
                                    <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                                    <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Layout - Swiss Grid */}
                    <div className="hidden md:block">
                        {/* Steps Grid */}
                        <div className="grid grid-cols-4 gap-0 border-t border-white/10">
                            {[
                                { num: '01', title: 'Choose Your Day', desc: 'Start with Day 1 and unlock new stories as you progress through the challenge' },
                                { num: '02', title: 'Read & Practice', desc: 'Use teleprompter mode and listen to perfect pronunciation with text-to-speech' },
                                { num: '03', title: 'Build Vocabulary', desc: 'Master key words with interactive flashcards and comprehensive definitions' },
                                { num: '04', title: 'Track Your Growth', desc: 'Watch your streak grow and earn achievement badges as you progress' }
                            ].map((step, i) => (
                                <div key={i} className={`pt-8 pr-8 ${i < 3 ? 'border-r border-white/10' : ''}`}>
                                    {/* Large Number */}
                                    <div className="text-7xl font-bold text-white/5 mb-4 leading-none">{step.num}</div>
                                    {/* Title */}
                                    <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
                                    {/* Description */}
                                    <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
                                    {/* Accent */}
                                    <div className="w-8 h-0.5 bg-[#880000] mt-6"></div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Tagline */}
                        <div className="flex items-center justify-between mt-16 pt-8 border-t border-white/10">
                            <p className="text-white/30 text-sm uppercase tracking-wider">90 days • 30 countries • 1 goal</p>
                            <div className="flex items-center gap-3">
                                <span className="text-white/50 text-sm">Start your journey</span>
                                <ArrowRight className="text-[#ff6b6b]" size={18} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Advantages Section - Swiss Grid */}
            <section
                id="advantages"
                className={`py-16 md:py-32 bg-white scroll-mt-20 transition-all duration-700 ease-out ${getSectionClass('advantages')}`}
            >
                <div className="max-w-6xl mx-auto px-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-1 bg-[#880000]"></div>
                        <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-[0.3em]">Why Choose Us</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 md:mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-4 md:mb-0">
                            <span className="font-extralight">The strategic edge</span><br />
                            <span className="text-[#880000]">that sets us apart</span>
                        </h2>
                        <p className="text-sm text-slate-400 max-w-xs md:text-right">
                            Built for serious learners who want measurable results.
                        </p>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-8">
                        {[
                            { num: '01', icon: Users, title: 'Curated Content', desc: 'Over 90 carefully selected stories with proven effectiveness in building vocabulary and reading comprehension.' },
                            { num: '02', icon: Award, title: 'Structured Learning', desc: '90 days of progressive content designed to build consistent habits and measurable fluency improvement.' },
                            { num: '03', icon: HeadphonesIcon, title: 'Complete Toolkit', desc: 'Flashcards, vocabulary builders, text-to-speech, and interactive assessments all in one place.' },
                            { num: '04', icon: Globe, title: 'Global Perspective', desc: 'Stories from 30 countries provide authentic cultural context and diverse real-world English usage.' }
                        ].map((item, i) => (
                            <div key={i} className="relative pl-16">
                                {/* Number */}
                                <div className="absolute left-0 top-0 text-4xl font-bold text-slate-100">{item.num}</div>
                                {/* Content */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <item.icon className="text-[#880000]" size={18} />
                                        <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                    <div className="w-6 h-0.5 bg-[#880000] mt-4"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Layout - 2x2 Swiss Grid */}
                    <div className="hidden md:grid grid-cols-2 gap-0 border-t border-slate-100">
                        {[
                            { num: '01', icon: Users, title: 'Curated Content', desc: 'Over 90 carefully selected stories with proven effectiveness in building vocabulary and reading comprehension across diverse cultural contexts.' },
                            { num: '02', icon: Award, title: 'Structured Learning', desc: '90 days of progressive content designed to build consistent learning habits and measurable improvement in English fluency.' },
                            { num: '03', icon: HeadphonesIcon, title: 'Complete Toolkit', desc: 'Comprehensive learning tools including flashcards, vocabulary builders, text-to-speech, and interactive assessments.' },
                            { num: '04', icon: Globe, title: 'Global Perspective', desc: 'Stories from 30 countries provide authentic cultural context and diverse perspectives on real-world English usage.' }
                        ].map((item, i) => (
                            <div key={i} className={`py-12 ${i % 2 === 0 ? 'pr-12 border-r border-slate-100' : 'pl-12'} ${i < 2 ? 'border-b border-slate-100' : ''}`}>
                                {/* Large Ghost Number */}
                                <div className="text-7xl font-bold text-slate-100 leading-none mb-4">{item.num}</div>
                                {/* Icon + Title */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center">
                                        <item.icon className="text-[#880000]" size={20} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900">{item.title}</h4>
                                </div>
                                {/* Description */}
                                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                {/* Accent */}
                                <div className="w-8 h-0.5 bg-[#880000] mt-6"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Banner - Swiss Minimal */}
            <section className="py-12 md:py-16 bg-slate-950 text-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
                        {[
                            { value: '90', label: 'Days', suffix: '' },
                            { value: '30', label: 'Countries', suffix: '+' },
                            { value: '2.5K', label: 'Words', suffix: '+' },
                            { value: '100', label: 'Free', suffix: '%' }
                        ].map((stat, i) => (
                            <div key={i} className={`text-center ${i < 3 ? 'md:border-r md:border-white/10' : ''}`}>
                                <div className="text-4xl md:text-5xl font-bold text-white leading-none">
                                    {stat.value}<span className="text-[#ff6b6b]">{stat.suffix}</span>
                                </div>
                                <div className="text-[10px] md:text-xs text-white/40 uppercase tracking-[0.2em] mt-2">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Journey Preview Section - Swiss Design */}
            <section className="py-16 md:py-32 bg-stone-50">
                <div className="max-w-6xl mx-auto px-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-1 bg-[#880000]"></div>
                        <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-[0.3em]">Your Journey</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-4 md:mb-0">
                            <span className="font-extralight">Three months to</span><br />
                            <span className="text-[#880000]">transform your English</span>
                        </h2>
                    </div>

                    {/* Month Cards - Swiss Grid */}
                    <div className="grid md:grid-cols-3 gap-6 md:gap-0 md:border-t md:border-slate-200">
                        {[
                            {
                                month: '01',
                                title: 'Foundation',
                                focus: 'Building Habits',
                                desc: 'Establish daily reading routines with approachable stories from Europe and North America. Focus on core vocabulary.',
                                topics: ['Travel', 'Culture', 'History'],
                                color: 'bg-white'
                            },
                            {
                                month: '02',
                                title: 'Expansion',
                                focus: 'Growing Skills',
                                desc: 'Explore diverse narratives from Asia and South America. Encounter more complex sentence structures.',
                                topics: ['Nature', 'Technology', 'Society'],
                                color: 'bg-slate-50'
                            },
                            {
                                month: '03',
                                title: 'Mastery',
                                focus: 'Achieving Fluency',
                                desc: 'Challenge yourself with stories from Africa and Oceania. Advanced vocabulary and nuanced expressions.',
                                topics: ['Science', 'Arts', 'Philosophy'],
                                color: 'bg-stone-100'
                            }
                        ].map((month, i) => (
                            <div key={i} className={`${month.color} p-6 md:p-10 ${i < 2 ? 'md:border-r md:border-slate-200' : ''} md:border-b-0 border-b border-slate-200 last:border-b-0`}>
                                {/* Month Number */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-6xl md:text-7xl font-bold text-slate-200 leading-none">{month.month}</span>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Month</div>
                                        <div className="text-lg font-bold text-slate-900">{month.title}</div>
                                    </div>
                                </div>
                                {/* Focus */}
                                <div className="inline-block bg-[#880000]/10 px-3 py-1 mb-4">
                                    <span className="text-[10px] text-[#880000] uppercase tracking-wider font-medium">{month.focus}</span>
                                </div>
                                {/* Description */}
                                <p className="text-sm text-slate-500 leading-relaxed mb-6">{month.desc}</p>
                                {/* Topics */}
                                <div className="flex flex-wrap gap-2">
                                    {month.topics.map((topic, j) => (
                                        <span key={j} className="text-[10px] text-slate-400 uppercase tracking-wider border border-slate-200 px-2 py-1">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                                {/* Accent */}
                                <div className="w-8 h-0.5 bg-[#880000] mt-8"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial Section - Swiss Minimal */}
            <section className="py-16 md:py-24 bg-white border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    {/* Quote Mark */}
                    <div className="text-8xl md:text-9xl font-serif text-slate-100 leading-none mb-4">"</div>
                    {/* Quote */}
                    <blockquote className="text-xl md:text-3xl font-light text-slate-700 leading-relaxed mb-8 -mt-16">
                        The daily practice format changed how I approach learning English.
                        <span className="text-[#880000] font-medium"> Reading stories from different countries</span> made
                        vocabulary stick in a way textbooks never did.
                    </blockquote>
                    {/* Attribution */}
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-0.5 bg-slate-200"></div>
                        <span className="text-xs text-slate-400 uppercase tracking-[0.2em]">A Dedicated Learner</span>
                        <div className="w-12 h-0.5 bg-slate-200"></div>
                    </div>
                </div>
            </section>

            {/* Final CTA - Swiss Minimalist */}
            <section className="relative py-20 md:py-32 bg-slate-950 overflow-hidden">
                {/* Background Pattern - Subtle Grid */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                ></div>

                {/* Large Ghost Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-bold text-white/[0.02] leading-none whitespace-nowrap pointer-events-none select-none">
                    START NOW
                </div>

                <div className="relative max-w-6xl mx-auto px-6">
                    {/* Mobile Layout */}
                    <div className="md:hidden text-center">
                        <div className="inline-flex items-center gap-2 mb-6">
                            <div className="w-8 h-1 bg-[#880000]"></div>
                            <span className="text-[10px] text-white/50 uppercase tracking-[0.2em]">Begin Today</span>
                            <div className="w-8 h-1 bg-[#880000]"></div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                            <span className="font-extralight">Your journey to</span><br />
                            <span className="text-[#ff6b6b]">fluency starts here</span>
                        </h2>
                        <p className="text-white/50 mb-8 max-w-sm mx-auto text-sm">
                            90 days. 30 countries. Unlimited potential. No downloads, no signup—just click and begin.
                        </p>
                        <button
                            onClick={() => navigate('/m1-day1')}
                            className="inline-flex items-center gap-3 bg-[#880000] text-white px-8 py-4 font-medium text-sm uppercase tracking-wider hover:bg-[#aa0000] transition-colors"
                        >
                            Start Day 1
                            <ArrowRight size={16} />
                        </button>
                        <div className="flex items-center justify-center gap-4 mt-8 text-white/30">
                            <span className="text-[10px] uppercase tracking-wider">Free Forever</span>
                            <span className="w-1 h-1 rounded-full bg-white/30"></span>
                            <span className="text-[10px] uppercase tracking-wider">No Account</span>
                            <span className="w-1 h-1 rounded-full bg-white/30"></span>
                            <span className="text-[10px] uppercase tracking-wider">Start Now</span>
                        </div>
                    </div>

                    {/* Desktop Layout - Swiss Centered */}
                    <div className="hidden md:block text-center">
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <div className="w-16 h-1 bg-[#880000]"></div>
                            <span className="text-xs text-white/50 uppercase tracking-[0.3em]">Begin Today</span>
                            <div className="w-16 h-1 bg-[#880000]"></div>
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-bold text-white leading-[0.95] mb-8">
                            <span className="font-extralight block">Your journey to fluency</span>
                            <span className="text-[#ff6b6b] block">starts with Day 1</span>
                        </h2>
                        <p className="text-lg text-white/50 max-w-2xl mx-auto mb-12">
                            90 days of curated content. 30 countries to explore. Unlimited potential to unlock.
                            No downloads required, no account needed—just click and begin your transformation.
                        </p>
                        <button
                            onClick={() => navigate('/m1-day1')}
                            className="group inline-flex items-center gap-4 bg-[#880000] text-white px-12 py-5 font-medium uppercase tracking-wider hover:bg-[#aa0000] transition-all duration-300"
                        >
                            Start Day 1 Now
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="flex items-center justify-center gap-6 mt-10 text-white/30">
                            <span className="text-xs uppercase tracking-wider">Free Forever</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#880000]"></span>
                            <span className="text-xs uppercase tracking-wider">No Account Required</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#880000]"></span>
                            <span className="text-xs uppercase tracking-wider">Start in 5 Seconds</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer - Swiss Minimal */}
            <footer className="bg-slate-900 text-white border-t border-white/5">
                {/* Mobile Footer */}
                <div className="md:hidden px-6 py-10">
                    {/* Logo */}
                    <div className="mb-8">
                        <img src="/logo-white.svg" alt="English Fluency Journey" className="h-10 brightness-0 invert" />
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b border-white/10">
                        <button onClick={() => scrollToSection('about')} className="text-left text-xs text-white/50 uppercase tracking-wider hover:text-white transition-colors">About</button>
                        <button onClick={() => scrollToSection('features')} className="text-left text-xs text-white/50 uppercase tracking-wider hover:text-white transition-colors">Features</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="text-left text-xs text-white/50 uppercase tracking-wider hover:text-white transition-colors">Process</button>
                        <button onClick={() => scrollToSection('advantages')} className="text-left text-xs text-white/50 uppercase tracking-wider hover:text-white transition-colors">Advantages</button>
                    </div>

                    {/* Creator */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <img
                                src="/profile.jpg"
                                alt="Mr. Zayn"
                                className="w-10 h-10 rounded-full border border-[#880000] object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div>
                                <div className="text-xs font-bold">Created by Mr. Zayn</div>
                                <div className="text-[10px] text-white/40">Educator & Developer</div>
                            </div>
                        </div>
                        {/* Social Links */}
                        <div className="flex items-center gap-3 pl-13">
                            <a
                                href="https://github.com/azaynz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-white/5 hover:bg-[#880000] flex items-center justify-center transition-colors"
                            >
                                <Github size={14} className="text-white/60 hover:text-white" />
                            </a>
                            <a
                                href="https://instagram.com/azaynz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-white/5 hover:bg-[#880000] flex items-center justify-center transition-colors"
                            >
                                <Instagram size={14} className="text-white/60 hover:text-white" />
                            </a>
                            <a
                                href="mailto:contact.azaynz@gmail.com"
                                className="w-8 h-8 bg-white/5 hover:bg-[#880000] flex items-center justify-center transition-colors"
                            >
                                <Mail size={14} className="text-white/60 hover:text-white" />
                            </a>
                            <a
                                href="https://ko-fi.com/mrzayn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-[#880000] hover:bg-[#660000] flex items-center justify-center transition-colors"
                            >
                                <Heart size={14} className="text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] text-white/30 uppercase tracking-wider">© 2025</div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#880000]"></div>
                            <span className="text-[10px] text-white/30 uppercase tracking-wider">Made with purpose</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Footer */}
                <div className="hidden md:block">
                    <div className="max-w-6xl mx-auto px-6">
                        {/* Main Footer Content */}
                        <div className="flex flex-wrap justify-between gap-8 py-16">
                            {/* Logo & Description */}
                            <div className="max-w-xs">
                                <div className="mb-6">
                                    <img src="/logo-white.svg" alt="English Fluency Journey" className="h-12 brightness-0 invert" />
                                </div>
                                <p className="text-sm text-white/40 leading-relaxed mb-8 max-w-sm">
                                    Transforming language learning through engaging stories from around the world.
                                    90 days of curated content to help you achieve fluency.
                                </p>
                                {/* Creator */}
                                <div className="flex items-center gap-4 mb-6">
                                    <img
                                        src="/profile.jpg"
                                        alt="Mr. Zayn"
                                        className="w-12 h-12 rounded-full border-2 border-[#880000] object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div>
                                        <div className="text-sm font-medium">Created by Mr. Zayn</div>
                                        <div className="text-xs text-white/40">Educator & Developer</div>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="flex items-center gap-3">
                                    <a
                                        href="https://github.com/azaynz"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-9 h-9 bg-white/5 hover:bg-[#880000] flex items-center justify-center transition-colors group"
                                    >
                                        <Github size={16} className="text-white/50 group-hover:text-white transition-colors" />
                                    </a>
                                    <a
                                        href="https://instagram.com/azaynz"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-9 h-9 bg-white/5 hover:bg-[#880000] flex items-center justify-center transition-colors group"
                                    >
                                        <Instagram size={16} className="text-white/50 group-hover:text-white transition-colors" />
                                    </a>
                                    <a
                                        href="mailto:contact.azaynz@gmail.com"
                                        className="w-9 h-9 bg-white/5 hover:bg-[#880000] flex items-center justify-center transition-colors group"
                                    >
                                        <Mail size={16} className="text-white/50 group-hover:text-white transition-colors" />
                                    </a>
                                    <a
                                        href="https://ko-fi.com/X8X01SBFAD"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-9 h-9 bg-[#880000] hover:bg-[#660000] flex items-center justify-center transition-colors group"
                                    >
                                        <Heart size={16} className="text-white transition-colors" />
                                    </a>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-4 h-0.5 bg-[#880000]"></div>
                                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Navigate</span>
                                </div>
                                <div className="space-y-3">
                                    <button onClick={() => scrollToSection('about')} className="block text-sm text-white/50 hover:text-white transition-colors">About</button>
                                    <button onClick={() => scrollToSection('features')} className="block text-sm text-white/50 hover:text-white transition-colors">Features</button>
                                    <button onClick={() => scrollToSection('how-it-works')} className="block text-sm text-white/50 hover:text-white transition-colors">Process</button>
                                    <button onClick={() => scrollToSection('advantages')} className="block text-sm text-white/50 hover:text-white transition-colors">Advantages</button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-4 h-0.5 bg-[#880000]"></div>
                                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Stats</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-2xl font-bold text-white leading-none">90</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Days</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white leading-none">30+</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Countries</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-[#ff6b6b] leading-none">FREE</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">for Learner</div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-4 h-0.5 bg-[#880000]"></div>
                                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Action</span>
                                </div>
                                <button
                                    onClick={() => navigate('/m1-day1')}
                                    className="group flex items-center gap-2 text-[#ff6b6b] hover:text-white transition-colors mb-4"
                                >
                                    <span className="text-sm font-medium">Start Challenge</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <p className="text-[10px] text-white/30 leading-relaxed">
                                    Begin your 90-day journey to English fluency today.
                                </p>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="flex items-center justify-between py-6 border-t border-white/10">
                            <div className="text-xs text-white/30 uppercase tracking-wider">
                                © 2025 English Fluency Journey • All Rights Reserved
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#880000]"></div>
                                <span className="text-xs text-white/30 uppercase tracking-wider">Made with purpose</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
