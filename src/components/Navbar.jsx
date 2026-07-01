import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, BarChart3, CreditCard, Sparkles, Heart, Menu, X, Scroll, Mic } from 'lucide-react';

const Navbar = ({
    activeSection,
    setShowDashboard,
    setShowFlashcards,
    setShowMistakeCards,
    children // For challenge-specific mobile controls (Month Tabs, Day Grid, Poem Grid)
}) => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false);

    const closeMobileMenu = () => {
        setIsMobileMenuClosing(true);
        setTimeout(() => {
            setIsMobileMenuOpen(false);
            setIsMobileMenuClosing(false);
        }, 300);
    };

    const toggleMobileMenu = () => {
        if (isMobileMenuOpen) {
            closeMobileMenu();
        } else {
            setIsMobileMenuOpen(true);
        }
    };

    // Shared navigation items configuration
    const navItems = [
        activeSection === 'reading'
            ? { icon: Scroll, label: 'Poems', to: '/poem' }
            : { icon: BookOpen, label: 'Reading', to: '/m1-day1' },
        { icon: Mic, label: 'Transcribe', to: '/transcribe' },
        { icon: BarChart3, label: 'Stats', onClick: () => setShowDashboard(true) },
        { icon: CreditCard, label: 'Cards', onClick: () => setShowFlashcards(true) },
        { icon: Sparkles, label: 'Review', onClick: () => setShowMistakeCards(true) }
    ];

    return (
        <>
            {/* Navbar - Swiss Design */}
            <nav className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 flex-shrink-0 z-20 fixed top-0">
                <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between h-14 md:h-16">
                        {/* Logo */}
                        <button
                            onClick={() => navigate('/')}
                            className="cursor-pointer group"
                        >
                            <img src="/logo-horizontal.svg" alt="English Fluency Journey" className="h-8 md:h-10" />
                        </button>

                        {/* Desktop Actions */}
                        <div className="hidden sm:flex items-center">
                            {navItems.map((item, i) => {
                                const content = (
                                    <>
                                        <item.icon size={14} className="md:w-4 md:h-4" />
                                        <span className="hidden md:inline">{item.label}</span>
                                    </>
                                );
                                const className = "flex items-center gap-1.5 px-3 md:px-4 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors text-[10px] md:text-xs font-medium uppercase tracking-wider cursor-pointer";
                                
                                if (item.to) {
                                    return (
                                        <Link key={i} to={item.to} className={className}>
                                            {content}
                                        </Link>
                                    );
                                }
                                return (
                                    <button key={i} onClick={item.onClick} className={className}>
                                        {content}
                                    </button>
                                );
                            })}
                            <Link
                                to="/donate"
                                className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-[#880000] text-white hover:bg-[#660000] transition-colors text-[10px] md:text-xs font-medium uppercase tracking-wider ml-2 cursor-pointer"
                            >
                                <Heart size={14} className="md:w-4 md:h-4" />
                                <span className="hidden md:inline">Donate</span>
                            </Link>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={toggleMobileMenu}
                            className="sm:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                            aria-label="Toggle menu"
                        >
                            <span className={`block w-5 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                            <span className={`block w-5 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                            <span className={`block w-5 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu - Swiss Design */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className={`fixed inset-0 bg-black/60 z-30 ${isMobileMenuClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                        onClick={closeMobileMenu}
                    />

                    {/* Mobile Bottom Sheet - Swiss */}
                    <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-40 max-h-[80vh] overflow-y-auto ${isMobileMenuClosing ? 'animate-bottom-sheet-out' : 'animate-bottom-sheet-in'}`}>
                        {/* Handle + Close */}
                        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-[#880000]"></div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Navigation</span>
                            </div>
                            <button
                                onClick={closeMobileMenu}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Quick Actions - Swiss Grid */}
                            <div className="grid grid-cols-5 gap-0 border border-slate-200">
                                {navItems.map((item, i) => {
                                    const content = (
                                        <>
                                            <item.icon size={18} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider mt-1.5">{item.label}</span>
                                        </>
                                    );
                                    const className = `flex flex-col items-center justify-center py-4 text-slate-600 hover:bg-slate-50 hover:text-[#880000] transition-all cursor-pointer ${i < 4 ? 'border-r border-slate-200' : ''}`;
                                    
                                    if (item.to) {
                                        return (
                                            <Link
                                                key={i}
                                                to={item.to}
                                                onClick={closeMobileMenu}
                                                className={className}
                                            >
                                                {content}
                                            </Link>
                                        );
                                    }
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => { item.onClick(); closeMobileMenu(); }}
                                            className={className}
                                        >
                                            {content}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Donate Button */}
                            <Link
                                to="/donate"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#880000] text-white hover:bg-[#660000] transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                                onClick={closeMobileMenu}
                            >
                                <Heart size={16} />
                                Support This Project
                            </Link>

                            {/* Custom Children (e.g. Month Tabs + Day Grid, or Poem list) */}
                            {children && (
                                <div className="space-y-6">
                                    {React.cloneElement(children, { closeMobileMenu })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Navbar;
