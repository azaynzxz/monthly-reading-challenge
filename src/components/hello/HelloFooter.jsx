import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import profile from '../../data/profile.json';

const HelloFooter = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 text-white">
            <div className="max-w-lg mx-auto px-6 py-8">
                {/* Divider rule */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-6 h-px bg-[#880000]" />
                    <span className="text-[9px] text-white/30 uppercase tracking-[0.3em]">
                        {profile.handle}
                    </span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">
                        © {year} {profile.name}
                    </p>

                    <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/70 uppercase tracking-wider transition-colors duration-200"
                    >
                        <span>myenglish.my.id</span>
                        <ExternalLink
                            size={10}
                            className="group-hover:translate-x-0.5 transition-transform duration-200"
                        />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default HelloFooter;
