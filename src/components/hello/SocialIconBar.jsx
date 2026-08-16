import React from 'react';
import { getSocialIconUrl } from '../../api/fetchSocialIcon';
import profile from '../../data/profile.json';

const SocialIconBar = () => {
    return (
        <div className="bg-slate-900 border-t border-white/5 px-6 py-4">
            <div className="flex items-center justify-center gap-2">
                {profile.socials.map((social) => (
                    <a
                        key={social.slug}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={social.platform}
                        aria-label={`Visit ${social.platform}`}
                        className="group w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-[#880000] transition-colors duration-200"
                    >
                        <img
                            src={getSocialIconUrl(social.slug, 'ffffff')}
                            alt={social.platform}
                            className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity duration-200"
                            loading="lazy"
                        />
                    </a>
                ))}
            </div>
        </div>
    );
};

export default SocialIconBar;
