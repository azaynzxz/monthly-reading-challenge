import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Play, Pause, ChevronDown, ChevronLeft, AlertCircle, Sparkles, Minus, Plus, Type, X, Music, FolderOpen, RotateCcw } from 'lucide-react';
import MistakeCards from './MistakeCards';

// Import reading data
import month1Data from '../data/month1.json';
import month2Data from '../data/month2.json';
import month3Data from '../data/month3.json';

const allMonths = { 1: month1Data, 2: month2Data, 3: month3Data };

const ReviewPage = () => {
    const navigate = useNavigate();

    // Month/Day selection
    const [selectedMonth, setSelectedMonth] = useState(1);
    const [selectedDay, setSelectedDay] = useState(1);
    const [showDayPicker, setShowDayPicker] = useState(false);

    // Audio state
    const [audioFile, setAudioFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const audioRef = useRef(null);
    const fileInputRef = useRef(null);

    // Drag overlay (Google Drive style — full-page overlay only when dragging)
    const [showDragOverlay, setShowDragOverlay] = useState(false);
    const dragCounterRef = useRef(0);

    // Mistake marking
    const [mistakes, setMistakes] = useState(new Set());

    // Font size
    const [readingFontSize, setReadingFontSize] = useState('normal');
    const fontSizeClasses = {
        small: 'text-sm leading-relaxed',
        normal: 'text-base md:text-lg leading-relaxed md:leading-loose',
        large: 'text-lg md:text-xl leading-relaxed md:leading-loose',
        xlarge: 'text-xl md:text-2xl leading-relaxed md:leading-loose',
    };

    // MistakeCards modal
    const [showMistakeCards, setShowMistakeCards] = useState(false);

    // Get active data
    const monthData = allMonths[selectedMonth] || [];
    const activeData = monthData.find(d => d.day === selectedDay) || monthData[0];

    // Reset mistakes when changing text
    useEffect(() => {
        setMistakes(new Set());
    }, [selectedMonth, selectedDay]);

    // Cleanup audio URL on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onTimeUpdate = () => setAudioCurrentTime(audio.currentTime);
        const onDurationChange = () => setAudioDuration(audio.duration || 0);
        const onEnded = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('durationchange', onDurationChange);
        audio.addEventListener('ended', onEnded);
        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('durationchange', onDurationChange);
            audio.removeEventListener('ended', onEnded);
        };
    }, [audioUrl]);

    // --- Global drag listeners for Google Drive style overlay ---
    useEffect(() => {
        const onDragEnter = (e) => {
            e.preventDefault();
            dragCounterRef.current++;
            if (e.dataTransfer.types.includes('Files')) {
                setShowDragOverlay(true);
            }
        };
        const onDragLeave = (e) => {
            e.preventDefault();
            dragCounterRef.current--;
            if (dragCounterRef.current <= 0) {
                dragCounterRef.current = 0;
                setShowDragOverlay(false);
            }
        };
        const onDragOver = (e) => {
            e.preventDefault();
        };
        const onDrop = (e) => {
            e.preventDefault();
            dragCounterRef.current = 0;
            setShowDragOverlay(false);
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('audio/')) {
                loadAudioFile(files[0]);
            }
        };
        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('drop', onDrop);
        return () => {
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('drop', onDrop);
        };
    }, []);

    // --- Audio helpers ---
    const loadAudioFile = useCallback((file) => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(file);
        setAudioFile(file);
        setAudioUrl(url);
        setIsPlaying(false);
        setAudioCurrentTime(0);
    }, [audioUrl]);

    const handleFileInput = (e) => {
        if (e.target.files.length > 0) loadAudioFile(e.target.files[0]);
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) { audio.pause(); setIsPlaying(false); }
        else { audio.play(); setIsPlaying(true); }
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio || !audioDuration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        audio.currentTime = ratio * audioDuration;
    };

    const removeAudio = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioFile(null);
        setAudioUrl(null);
        setIsPlaying(false);
        setAudioCurrentTime(0);
        setAudioDuration(0);
    };

    // --- Mistake word toggle ---
    const toggleMistake = (word) => {
        const clean = word.toLowerCase().replace(/[.,!?;:()\"'\-]/g, '').trim();
        if (!clean) return;
        setMistakes(prev => {
            const next = new Set(prev);
            if (next.has(clean)) next.delete(clean);
            else next.add(clean);
            return next;
        });
    };

    // Font size cycle
    const cycleFontSize = (direction) => {
        const sizes = ['small', 'normal', 'large', 'xlarge'];
        const idx = sizes.indexOf(readingFontSize);
        if (direction === 'up' && idx < sizes.length - 1) setReadingFontSize(sizes[idx + 1]);
        if (direction === 'down' && idx > 0) setReadingFontSize(sizes[idx - 1]);
    };

    // Format time
    const formatTime = (s) => {
        if (!s || !isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // Build mistake words string for MistakeCards
    const mistakeWordsString = [...mistakes].join(', ');

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ========== STICKY TOP BAR (nav + audio player) ========== */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                {/* Nav Row */}
                <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={() => navigate('/')}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="w-6 h-0.5 bg-[#880000] hidden sm:block flex-shrink-0"></div>
                        <h1 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-[0.1em] sm:tracking-[0.15em] truncate">Audio Review</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* File picker button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                            title="Browse audio file"
                        >
                            <FolderOpen size={12} />
                            <span className="hidden sm:inline">{audioFile ? 'Change' : 'Open'} Audio</span>
                            <span className="sm:hidden">{audioFile ? 'Change' : 'Audio'}</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                        {/* Month/Day Picker */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDayPicker(!showDayPicker)}
                                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] bg-slate-900 text-white hover:bg-[#880000] transition-all"
                            >
                                <span>M{selectedMonth}·D{selectedDay}</span>
                                <ChevronDown size={10} />
                            </button>
                            {showDayPicker && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDayPicker(false)} />
                                    <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 shadow-xl z-50 p-3 sm:p-4 w-[240px] sm:w-[280px] animate-modal-in">
                                        <div className="flex gap-0 border border-slate-200 mb-3">
                                            {[1, 2, 3].map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => { setSelectedMonth(m); setSelectedDay(1); }}
                                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${selectedMonth === m ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                                >
                                                    M{m}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-6 gap-1">
                                            {(allMonths[selectedMonth] || []).map(d => (
                                                <button
                                                    key={d.day}
                                                    onClick={() => { setSelectedDay(d.day); setShowDayPicker(false); }}
                                                    className={`py-1.5 sm:py-2 text-xs font-bold transition-all ${selectedDay === d.day ? 'bg-[#880000] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                                >
                                                    {d.day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Audio Player Row — only visible when audio is loaded */}
                {audioUrl && (
                    <div className="border-t border-slate-100 px-3 sm:px-4 py-2 bg-slate-50/80">
                        <div className="max-w-5xl mx-auto flex items-center gap-3">
                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-900 hover:bg-[#880000] text-white transition-all flex-shrink-0"
                            >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                            </button>

                            {/* Progress */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Music size={10} className="text-slate-400 flex-shrink-0" />
                                    <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">{audioFile?.name}</span>
                                    <button onClick={removeAudio} className="ml-auto text-slate-300 hover:text-red-500 transition-colors flex-shrink-0" title="Remove">
                                        <X size={12} />
                                    </button>
                                </div>
                                <div
                                    onClick={handleSeek}
                                    onTouchStart={handleSeek}
                                    className="h-1.5 sm:h-2 bg-slate-200 cursor-pointer relative group"
                                >
                                    <div
                                        className="h-full bg-[#880000] transition-[width] duration-100"
                                        style={{ width: audioDuration ? `${(audioCurrentTime / audioDuration) * 100}%` : '0%' }}
                                    />
                                </div>
                                <div className="flex justify-between mt-0.5">
                                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">{formatTime(audioCurrentTime)}</span>
                                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">{formatTime(audioDuration)}</span>
                                </div>
                            </div>
                        </div>
                        <audio ref={audioRef} src={audioUrl} preload="metadata" />
                    </div>
                )}
            </div>

            {/* ========== MAIN CONTENT ========== */}
            <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {activeData && (
                    <div className="bg-white shadow-xl overflow-hidden border-l-4 border-[#880000] animate-fade-in">
                        {/* Header */}
                        <div className="bg-slate-50 border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="min-w-0">
                                    <div className="w-8 h-0.5 bg-[#880000] mb-1.5"></div>
                                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-tight truncate">{activeData.title}</h2>
                                    <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-[0.15em]">
                                        M{selectedMonth} · Day {selectedDay} · {activeData.country}
                                    </span>
                                </div>
                                {/* Mistake Counter */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {mistakes.size > 0 && (
                                        <button
                                            onClick={() => setMistakes(new Set())}
                                            className="flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                                            title="Clear all"
                                        >
                                            <RotateCcw size={10} />
                                            <span className="hidden sm:inline">Clear</span>
                                        </button>
                                    )}
                                    <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 ${mistakes.size > 0 ? 'bg-[#880000] text-white' : 'bg-slate-100 text-slate-400'} transition-all`}>
                                        <AlertCircle size={12} />
                                        <span className="text-xs font-bold">{mistakes.size}</span>
                                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider hidden sm:inline">
                                            {mistakes.size === 1 ? 'mistake' : 'mistakes'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reading Content */}
                        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
                            <div className="mb-4">
                                {/* Toolbar */}
                                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-6 sm:w-8 h-0.5 bg-[#880000]"></div>
                                        <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">Tap words to mark</span>
                                    </div>
                                    {/* Font Size */}
                                    <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-50 rounded-lg p-0.5 sm:p-1">
                                        <button
                                            onClick={() => cycleFontSize('down')}
                                            disabled={readingFontSize === 'small'}
                                            className={`p-1 sm:p-1.5 rounded transition-all ${readingFontSize === 'small' ? 'text-slate-300' : 'text-slate-500 hover:text-[#880000] hover:bg-white'}`}
                                        >
                                            <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        </button>
                                        <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2">
                                            <Type className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-[20px] sm:min-w-[40px] text-center">
                                                {readingFontSize === 'small' ? 'S' : readingFontSize === 'normal' ? 'M' : readingFontSize === 'large' ? 'L' : 'XL'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => cycleFontSize('up')}
                                            disabled={readingFontSize === 'xlarge'}
                                            className={`p-1 sm:p-1.5 rounded transition-all ${readingFontSize === 'xlarge' ? 'text-slate-300' : 'text-slate-500 hover:text-[#880000] hover:bg-white'}`}
                                        >
                                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Text Chunks */}
                                <div className="space-y-4 sm:space-y-6">
                                    {(() => {
                                        const text = activeData.text;
                                        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                                        const chunks = [];
                                        for (let i = 0; i < sentences.length; i += 2) {
                                            chunks.push(sentences.slice(i, i + 2).join(' ').trim());
                                        }
                                        let globalWordIndex = 0;

                                        return chunks.map((chunk, chunkIndex) => {
                                            const chunkWords = chunk.split(' ');
                                            const startWordIndex = globalWordIndex;
                                            globalWordIndex += chunkWords.length;

                                            return (
                                                <div
                                                    key={chunkIndex}
                                                    className="relative animate-wipe-reveal"
                                                    style={{ animationDelay: `${chunkIndex * 150}ms` }}
                                                >
                                                    <div className="absolute -left-1 sm:-left-2 md:-left-4 top-0 text-[9px] sm:text-[10px] font-bold text-slate-200">
                                                        {String(chunkIndex + 1).padStart(2, '0')}
                                                    </div>
                                                    <p className={`${fontSizeClasses[readingFontSize]} font-normal pl-3 sm:pl-4 md:pl-6 border-l border-transparent text-slate-700`}>
                                                        {chunkWords.map((word, wordIndexInChunk) => {
                                                            const index = startWordIndex + wordIndexInChunk;
                                                            const cleanWord = word.toLowerCase().replace(/[.,!?;:()\"'\-]/g, '').trim();
                                                            const isMistake = mistakes.has(cleanWord);

                                                            return (
                                                                <React.Fragment key={index}>
                                                                    <span
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            toggleMistake(word);
                                                                        }}
                                                                        className={`transition-all duration-150 cursor-pointer select-none inline-block ${isMistake
                                                                            ? 'bg-[#880000] text-white px-0.5 sm:px-1 py-0.5 rounded-sm mistake-word-pulse'
                                                                            : 'hover:bg-slate-100 active:bg-slate-200'
                                                                            }`}
                                                                        title={isMistake ? 'Tap to unmark' : 'Tap to mark mistake'}
                                                                    >
                                                                        {word}
                                                                    </span>
                                                                    {' '}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </p>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Mistake Tags + Action Bar */}
                        <div className="border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/50">
                            {/* Mistake word chips */}
                            {mistakes.size > 0 && (
                                <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3">
                                    {[...mistakes].map(w => (
                                        <span key={w} className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-[#880000]/10 text-[#880000] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                                            {w}
                                            <button onClick={() => toggleMistake(w)} className="hover:text-red-800 ml-0.5">
                                                <X size={8} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {/* Create Review Card button */}
                            <button
                                onClick={() => setShowMistakeCards(true)}
                                disabled={mistakes.size === 0}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-[#880000] text-white font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Sparkles size={14} />
                                <span>Create Review Card</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========== DRAG & DROP OVERLAY (Google Drive style) ========== */}
            {showDragOverlay && (
                <div className="fixed inset-0 z-[100] bg-[#880000]/90 backdrop-blur-sm flex items-center justify-center animate-backdrop-in-fast">
                    <div className="text-center p-8">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 border-4 border-dashed border-white/60 flex items-center justify-center rounded-2xl animate-pulse">
                            <Upload size={36} className="text-white/80" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">Drop audio file here</h2>
                        <p className="text-white/60 text-xs sm:text-sm uppercase tracking-wider">MP3 · WAV · M4A · OGG · WEBM</p>
                    </div>
                </div>
            )}

            {/* ========== MistakeCards Modal ========== */}
            {showMistakeCards && (
                <MistakeCards
                    onClose={() => setShowMistakeCards(false)}
                    initialWords={mistakeWordsString}
                />
            )}
        </div>
    );
};

export default ReviewPage;
