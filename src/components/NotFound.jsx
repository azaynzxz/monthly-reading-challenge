import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home } from 'lucide-react';
import SEO from './SEO';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* SEO Meta Tags */}
            <SEO
                title="404 - Page Not Found | English Fluency Journey"
                description="The page you're looking for doesn't exist. Return to English Fluency Journey to continue your learning."
                url="https://myenglish.my.id/404"
            />

            {/* Header - Minimal */}
            <header className="w-full bg-white border-b border-slate-100 fixed top-0 z-50">
                <nav className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="group">
                        <img src="/logo-horizontal.svg" alt="English Fluency Journey" className="h-10" />
                    </Link>
                    <Link
                        to="/"
                        className="group bg-slate-900 text-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] hover:bg-[#880000] transition-all duration-300 flex items-center gap-2"
                    >
                        <Home size={14} />
                        Home
                    </Link>
                </nav>
            </header>

            {/* Main Content - Swiss Design */}
            <main className="flex-1 flex items-center justify-center px-6 mt-16">
                <div className="max-w-4xl w-full">
                    {/* Swiss Grid Layout */}
                    <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-center">
                        {/* Left Column - Large Number */}
                        <div className="md:col-span-5">
                            <div className="relative">
                                {/* Background Number */}
                                <div className="text-[180px] md:text-[240px] font-bold text-slate-100 leading-none -ml-4 md:-ml-8 select-none">
                                    404
                                </div>
                                {/* Accent Line */}
                                <div className="absolute bottom-0 left-0 w-24 h-2 bg-[#880000]"></div>
                            </div>
                        </div>

                        {/* Right Column - Content */}
                        <div className="md:col-span-7">
                            {/* Label */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-1 bg-[#880000]"></div>
                                <span className="text-xs text-slate-400 uppercase tracking-[0.3em]">Error</span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                <span className="font-extralight block">Page not</span>
                                <span className="text-[#880000]">found</span>
                            </h1>

                            {/* Description */}
                            <div className="pl-6 border-l-2 border-slate-200 mb-10">
                                <p className="text-lg text-slate-500 leading-relaxed mb-4">
                                    The page you're looking for doesn't exist or has been moved.
                                </p>
                                <p className="text-sm text-slate-400">
                                    Let's get you back on track with your English learning journey.
                                </p>
                            </div>

                            {/* Action Buttons - Swiss Grid */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/"
                                    className="group bg-slate-900 text-white px-6 py-3.5 text-xs font-medium uppercase tracking-[0.15em] hover:bg-[#880000] transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Home size={16} />
                                    Back to Home
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                                <Link
                                    to="/m1-day1"
                                    className="group bg-white border-2 border-slate-900 text-slate-900 px-6 py-3.5 text-xs font-medium uppercase tracking-[0.15em] hover:bg-slate-900 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    Start Reading
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>

                            {/* Stats - Minimal */}
                            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-slate-100">
                                <div>
                                    <div className="text-3xl font-bold text-slate-900 leading-none">90</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-2">Stories</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-slate-900 leading-none">30</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-2">Countries</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-[#880000] leading-none">Free</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-2">Forever</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer - Minimal */}
            <footer className="w-full border-t border-slate-100 py-6">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">
                            © 2024 English Fluency Journey
                        </p>
                        <div className="flex items-center gap-6">
                            <Link to="/" className="text-xs text-slate-400 hover:text-slate-900 uppercase tracking-wider transition-colors">
                                Home
                            </Link>
                            <Link to="/m1-day1" className="text-xs text-slate-400 hover:text-slate-900 uppercase tracking-wider transition-colors">
                                Start Learning
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default NotFound;
