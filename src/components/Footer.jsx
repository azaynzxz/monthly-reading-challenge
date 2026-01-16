import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Github, Instagram, Mail, Heart, ArrowRight } from 'lucide-react';

const Footer = () => {
    const navigate = useNavigate();

    const scrollToSection = (sectionId) => {
        // Only works on landing page, but we'll keep the function for compatibility
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="bg-slate-900 text-white">
            {/* Mobile Footer */}
            <div className="md:hidden">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    {/* Logo */}
                    <div className="mb-8">
                        <img src="/logo-white.svg" alt="English Fluency Journey" className="h-10 brightness-0 invert" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/40 leading-relaxed mb-8">
                        Transforming language learning through engaging stories from around the world.
                        90 days of curated content to help you achieve fluency.
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center gap-3 mb-8">
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
                        <Link
                            to="/donate"
                            className="w-9 h-9 bg-[#880000] hover:bg-[#660000] flex items-center justify-center transition-colors group"
                        >
                            <Heart size={16} className="text-white transition-colors" />
                        </Link>
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
                                <Link
                                    to="/donate"
                                    className="w-9 h-9 bg-[#880000] hover:bg-[#660000] flex items-center justify-center transition-colors group"
                                >
                                    <Heart size={16} className="text-white transition-colors" />
                                </Link>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-4 h-0.5 bg-[#880000]"></div>
                                <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Navigate</span>
                            </div>
                            <div className="space-y-3">
                                <Link to="/" className="block text-sm text-white/50 hover:text-white transition-colors">Home</Link>
                                <Link to="/about" className="block text-sm text-white/50 hover:text-white transition-colors">About</Link>
                                <Link to="/donate" className="block text-sm text-white/50 hover:text-white transition-colors">Donate</Link>
                                <Link to="/m1-day1" className="block text-sm text-white/50 hover:text-white transition-colors">Start Challenge</Link>
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
    );
};

export default Footer;
