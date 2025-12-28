import React, { useState } from 'react';
import { X, Trophy, TrendingUp, Clock, MapPin, BookOpen, Calendar, Award } from 'lucide-react';
import { getStorage, StorageKeys } from '../utils/storage';

const Dashboard = ({ statistics, progress, onClose, currentMonth, allMonthsData }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };
    const savedWords = getStorage(StorageKeys.VOCABULARY, []);
    
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const getTopCountries = () => {
        if (!statistics?.countries) return [];
        return Object.entries(statistics.countries)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    };

    const getMonthProgress = () => {
        if (!progress?.monthProgress) return 0;
        const monthKey = `month-${currentMonth}`;
        const monthData = progress.monthProgress[monthKey];
        if (!monthData) return 0;
        return Math.round((monthData.completed.length / 30) * 100);
    };

    const getBadgeName = (badge) => {
        const badges = {
            '7-day-streak': '7 Day Streak',
            '30-day-streak': '30 Day Streak',
            'perfect-pronunciation': 'Perfect Pronunciation'
        };
        return badges[badge] || badge;
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/60 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onClick={handleClose}
            />
            {/* Modal - Swiss Design */}
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="bg-white shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col border-l-4 border-[#880000]">
                    {/* Header - Swiss */}
                    <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 bg-[#880000]"></div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-[0.15em]">Progress Dashboard</h2>
                        </div>
                        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {/* Stats Grid - Swiss Numbers */}
                        <div className="grid grid-cols-3 gap-0 border border-slate-200">
                            <div className="p-6 border-r border-slate-200">
                                <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">Words Read</div>
                                <div className="text-4xl font-bold text-slate-900 leading-none">{statistics?.totalWordsRead?.toLocaleString() || 0}</div>
                                <div className="w-6 h-0.5 bg-[#880000] mt-4"></div>
                            </div>
                            <div className="p-6 border-r border-slate-200">
                                <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">Time Practiced</div>
                                <div className="text-4xl font-bold text-slate-900 leading-none">{formatTime(statistics?.totalTimePracticed || 0)}</div>
                                <div className="w-6 h-0.5 bg-[#880000] mt-4"></div>
                            </div>
                            <div className="p-6">
                                <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">Sessions</div>
                                <div className="text-4xl font-bold text-slate-900 leading-none">{statistics?.practiceSessions || 0}</div>
                                <div className="w-6 h-0.5 bg-[#880000] mt-4"></div>
                            </div>
                        </div>

                        {/* Streak & Month Progress - Swiss Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-200">
                            {/* Streak */}
                            <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-4 h-0.5 bg-slate-300"></div>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">Streak</span>
                                </div>
                                <div className="flex items-end gap-6">
                                    <div>
                                        <div className="text-5xl font-bold text-[#880000] leading-none">{progress?.currentStreak || 0}</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Current Days</div>
                                    </div>
                                    <div className="pb-1">
                                        <div className="text-2xl font-bold text-slate-300 leading-none">{progress?.longestStreak || 0}</div>
                                        <div className="text-[9px] text-slate-300 uppercase tracking-wider mt-1">Best</div>
                                    </div>
                                </div>
                            </div>

                            {/* Month Progress */}
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-4 h-0.5 bg-slate-300"></div>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">Month {currentMonth}</span>
                                </div>
                                <div className="flex items-end justify-between mb-3">
                                    <div className="text-4xl font-bold text-slate-900 leading-none">{getMonthProgress()}%</div>
                                    <div className="text-[10px] text-slate-400">{progress?.monthProgress?.[`month-${currentMonth}`]?.completed?.length || 0}/30</div>
                                </div>
                                <div className="w-full bg-slate-100 h-1">
                                    <div className="bg-[#880000] h-1 transition-all duration-500" style={{ width: `${getMonthProgress()}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Badges - Swiss */}
                        <div className="border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-4 h-0.5 bg-slate-300"></div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">Badges</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {progress?.badges && progress.badges.length > 0 ? (
                                    progress.badges.map((badge, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                                            {getBadgeName(badge)}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400">No badges yet. Keep practicing!</p>
                                )}
                            </div>
                        </div>

                        {/* Countries & Vocabulary - Swiss Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-200">
                            {/* Countries */}
                            <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-4 h-0.5 bg-slate-300"></div>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">Top Countries</span>
                                </div>
                                {getTopCountries().length > 0 ? (
                                    <div className="space-y-2">
                                        {getTopCountries().map(([country, count], idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className="text-slate-700">{country}</span>
                                                <span className="text-slate-400 font-mono">{count}×</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400">No data yet</p>
                                )}
                            </div>

                            {/* Vocabulary */}
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-4 h-0.5 bg-slate-300"></div>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">Vocabulary</span>
                                </div>
                                <div className="text-4xl font-bold text-slate-900 leading-none">{savedWords.length}</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Words Saved</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;

