import React, { useState, useEffect } from 'react';
import { getSocialIconUrl } from '../../api/fetchSocialIcon';
import profile from '../../data/profile.json';

const ProfileHeader = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setIsReady(true), 50);
        return () => clearTimeout(t);
    }, []);

    const entry = (delay) => ({
        opacity: isReady ? 1 : 0,
        transform: isReady ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
    });

    return (
        <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-[#2a0a0a] pt-16 pb-10 px-6 text-center">
            {/* Subtle top rule */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#880000]" />

            {/* Avatar */}
            <div style={entry(100)} className="flex justify-center mb-5">
                <div className="relative">
                    <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-[#880000]"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    {/* Fallback initials avatar */}
                    <div
                        className="w-24 h-24 rounded-full bg-[#880000] hidden items-center justify-center border-2 border-[#880000]"
                        style={{ display: 'none' }}
                    >
                        <span className="text-white text-2xl font-bold">MZ</span>
                    </div>
                </div>
            </div>

            {/* Section label — Swiss accent rule */}
            <div style={entry(200)} className="flex items-center justify-center gap-3 mb-4">
                <div className="w-8 h-px bg-[#880000]" />
                <span className="text-[10px] text-white/50 uppercase tracking-[0.3em]">Creator</span>
                <div className="w-8 h-px bg-[#880000]" />
            </div>

            {/* Name */}
            <div style={entry(300)}>
                <h1 className="text-2xl font-bold text-white leading-tight">
                    {profile.name}
                </h1>
            </div>

            {/* Handle */}
            <div style={entry(400)} className="mt-1 mb-3">
                <span className="text-xs text-white/50 uppercase tracking-[0.2em]">
                    {profile.handle}
                </span>
            </div>

            {/* Bio */}
            <div style={entry(500)}>
                <p className="text-sm text-white/60 max-w-xs mx-auto leading-relaxed">
                    {profile.bio}
                </p>
            </div>
        </div>
    );
};

export default ProfileHeader;
