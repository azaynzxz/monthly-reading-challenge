import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, X, Dices, ChevronLeft, BookOpen, Trash2, Volume2, AlertCircle, RotateCcw, Sparkles, Minus, Plus as PlusIcon, Type, Globe, Copy, Check, Share2 } from 'lucide-react';
import MistakeCards from './MistakeCards';

// Import data
import month1Data from '../data/month1.json';
import month2Data from '../data/month2.json';
import month3Data from '../data/month3.json';
import { useNavigate } from 'react-router-dom';

const allStories = [
    ...month1Data.map(s => ({ ...s, month: 1 })),
    ...month2Data.map(s => ({ ...s, month: 2 })),
    ...month3Data.map(s => ({ ...s, month: 3 }))
];

// ─── Slot machine reel component ─────────────────────────────
const SlotReel = ({ isSpinning, finalStory, onDone }) => {
    const reelRef = useRef(null);
    const [displayStories, setDisplayStories] = useState([]);
    const [settled, setSettled] = useState(false);

    useEffect(() => {
        if (!isSpinning) {
            if (finalStory && !settled) {
                setSettled(true);
            }
            return;
        }

        setSettled(false);

        const sequence = [];
        const totalItems = 20;
        for (let i = 0; i < totalItems; i++) {
            sequence.push(allStories[Math.floor(Math.random() * allStories.length)]);
        }
        if (finalStory) {
            sequence.push(finalStory);
        }
        setDisplayStories(sequence);

        const timer = setTimeout(() => {
            setSettled(true);
            onDone?.();
        }, 2400);

        return () => clearTimeout(timer);
    }, [isSpinning, finalStory]);

    if (settled && finalStory) {
        return (
            <div className="overflow-hidden h-[72px] flex items-center">
                <div className="animate-fade-in">
                    <div className="text-[10px] font-bold text-[#880000] uppercase tracking-[0.15em] mb-0.5">
                        Month {finalStory.month} · Day {finalStory.day} · {finalStory.country}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                        {finalStory.title}
                    </div>
                </div>
            </div>
        );
    }

    if (isSpinning && displayStories.length > 0) {
        return (
            <div className="overflow-hidden h-[72px] relative">
                <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-white via-transparent to-white" />
                <div
                    ref={reelRef}
                    className="roulette-reel-spin"
                    style={{ '--total-items': displayStories.length }}
                >
                    {displayStories.map((story, i) => (
                        <div key={i} className="h-[72px] flex items-center shrink-0">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                                    Month {story.month} · Day {story.day}
                                </div>
                                <div className="text-base sm:text-lg font-bold text-slate-600 leading-tight truncate">
                                    {story.title}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-[72px] flex items-center">
            <span className="text-sm text-slate-300 italic">Press spin to assign a story</span>
        </div>
    );
};

// ─── Dictionary popup (for Read mode) ────────────────────────
const DictionaryPopup = ({ word, position, onClose, onSpeak }) => {
    const [definition, setDefinition] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchDef = async () => {
            setLoading(true);
            try {
                const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled && data?.[0]) {
                        setDefinition(data[0]);
                    }
                }
            } catch (e) {
                // ignore
            }
            if (!cancelled) setLoading(false);
        };
        fetchDef();
        return () => { cancelled = true; };
    }, [word]);

    // Calculate position to stay on screen
    const left = Math.max(16, Math.min((position?.left || 200) - 150, window.innerWidth - 320));
    const top = Math.min((position?.top || 200) + 8, window.innerHeight - 250);

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                className="fixed z-50 bg-white shadow-2xl border-l-4 border-[#880000] p-4 w-[300px] animate-modal-in"
                style={{ top: `${top}px`, left: `${left}px` }}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900 capitalize tracking-tight">{word}</h3>
                        <button
                            onClick={() => onSpeak(word)}
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#880000] transition-colors"
                        >
                            <Volume2 size={14} />
                        </button>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors p-1">
                        <X size={16} />
                    </button>
                </div>

                {loading ? (
                    <div className="text-xs text-slate-400 italic py-2">Loading definition...</div>
                ) : definition ? (
                    <div className="space-y-2">
                        {definition.phonetic && (
                            <p className="text-xs text-slate-400 font-mono">{definition.phonetic}</p>
                        )}
                        {definition.meanings?.slice(0, 2).map((m, i) => (
                            <div key={i} className="pl-3 border-l-2 border-slate-100">
                                <span className="text-[9px] font-bold text-[#880000] uppercase tracking-[0.1em]">{m.partOfSpeech}</span>
                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                    {m.definitions?.[0]?.definition}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-slate-400 italic">No definition found.</p>
                )}
            </div>
        </>
    );
};

// ─── Story Reading Modal ─────────────────────────────────────
const StoryModal = ({ story, onClose }) => {
    const [isClosing, setIsClosing] = useState(false);
    // Modes: 'read' = dictionary/listen | 'review' = mark mistakes
    const [mode, setMode] = useState('read');
    const [mistakes, setMistakes] = useState(new Set());
    const [dictWord, setDictWord] = useState(null);
    const [dictPosition, setDictPosition] = useState(null);
    const [showMistakeCards, setShowMistakeCards] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Font size
    const [fontSize, setFontSize] = useState('normal');
    const fontSizeClasses = {
        small: 'text-sm leading-relaxed',
        normal: 'text-base md:text-lg leading-relaxed md:leading-loose',
        large: 'text-lg md:text-xl leading-relaxed md:leading-loose',
        xlarge: 'text-xl md:text-2xl leading-relaxed md:leading-loose',
    };
    const cycleFontSize = (dir) => {
        const sizes = ['small', 'normal', 'large', 'xlarge'];
        const idx = sizes.indexOf(fontSize);
        if (dir === 'up' && idx < sizes.length - 1) setFontSize(sizes[idx + 1]);
        if (dir === 'down' && idx > 0) setFontSize(sizes[idx - 1]);
    };

    // Common words to skip
    const skipWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that',
        'these', 'those', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
        'my', 'your', 'his', 'its', 'our', 'their', 'who', 'whom', 'whose', 'which', 'what', 'where',
        'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
        'such', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also', 'now',
        'here', 'there', 'then', 'if', 'as', 'into', 'from', 'up', 'down', 'out', 'off', 'over',
        'any', 'am', 'by', 'about', 'so', 'no', 'yes'
    ]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 250);
    };

    const speakWord = (word) => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.85;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    const handleWordClick = (word, e) => {
        const clean = word.toLowerCase().replace(/[.,!?;:()"'\-]/g, '').trim();
        if (!clean || clean.length < 3 || skipWords.has(clean)) return;

        if (mode === 'review') {
            // Mark/unmark mistakes
            setMistakes(prev => {
                const next = new Set(prev);
                if (next.has(clean)) next.delete(clean);
                else next.add(clean);
                return next;
            });
        } else {
            // Dictionary mode
            const rect = e?.currentTarget?.getBoundingClientRect();
            setDictPosition({
                top: rect ? rect.bottom : e.clientY,
                left: rect ? rect.left + rect.width / 2 : e.clientX,
            });
            setDictWord(dictWord === clean ? null : clean);
        }
    };

    // Clear mistakes when switching to read mode
    const toggleMode = (newMode) => {
        setDictWord(null);
        setMode(newMode);
    };

    // Build text chunks
    const sentences = story.text.match(/[^.!?]+[.!?]+/g) || [story.text];
    const chunks = [];
    for (let i = 0; i < sentences.length; i += 2) {
        chunks.push(sentences.slice(i, i + 2).join(' ').trim());
    }

    const mistakeWordsString = [...mistakes].join(', ');

    return (
        <div
            className={`fixed inset-0 z-50 ${isClosing ? 'animate-modal-out' : 'animate-fade-in'}`}
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
        >
            <div className="absolute inset-0 overflow-y-auto">
                {/* ── Sticky Header ───────────────────────── */}
                <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <button
                                onClick={handleClose}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="w-6 h-0.5 bg-[#880000] hidden sm:block flex-shrink-0"></div>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-[0.1em] truncate">
                                M{story.month} · Day {story.day}
                            </span>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex items-center gap-0 border border-slate-200">
                            <button
                                onClick={() => toggleMode('read')}
                                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${mode === 'read' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <BookOpen size={10} />
                                <span>Read</span>
                            </button>
                            <button
                                onClick={() => toggleMode('review')}
                                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${mode === 'review' ? 'bg-[#880000] text-white' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <AlertCircle size={10} />
                                <span>Review</span>
                                {mistakes.size > 0 && (
                                    <span className="ml-0.5 bg-white/20 px-1 rounded-sm text-[8px]">{mistakes.size}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Reading Card ─────────────────────────── */}
                <div className="max-w-3xl mx-auto px-0 sm:px-4 py-4 sm:py-6">
                    <div className="bg-white shadow-xl overflow-hidden border-l-4 border-[#880000] animate-fade-in">

                        {/* Hero Image */}
                        {story.localImage && !imageError && (
                            <div className="relative min-h-[160px] md:min-h-[200px] lg:min-h-[240px] overflow-hidden">
                                <img
                                    src={story.localImage}
                                    alt={story.title}
                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageError(true)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

                                {/* Title over image */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Globe size={10} className="text-white/60" />
                                        <span className="text-[10px] text-white/60 uppercase tracking-[0.15em]">{story.country}</span>
                                    </div>
                                    <div className="w-8 h-0.5 bg-white/40 mb-2"></div>
                                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight tracking-tight">
                                        {story.title}
                                    </h2>
                                </div>
                            </div>
                        )}

                        {/* No image fallback header */}
                        {(!story.localImage || imageError) && (
                            <div className="bg-slate-50 border-b border-slate-100 px-4 sm:px-6 py-4">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Globe size={10} className="text-slate-400" />
                                    <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">{story.country}</span>
                                </div>
                                <div className="w-8 h-0.5 bg-[#880000] mb-2"></div>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{story.title}</h2>
                            </div>
                        )}

                        {/* ── Reading Content ──────────────── */}
                        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-6 sm:w-8 h-0.5 bg-[#880000]"></div>
                                    <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                                        {mode === 'review' ? 'Tap words to mark' : 'Tap words for definition'}
                                    </span>
                                </div>
                                {/* Font Size */}
                                <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-50 rounded-lg p-0.5 sm:p-1">
                                    <button
                                        onClick={() => cycleFontSize('down')}
                                        disabled={fontSize === 'small'}
                                        className={`p-1 sm:p-1.5 rounded transition-all ${fontSize === 'small' ? 'text-slate-300' : 'text-slate-500 hover:text-[#880000] hover:bg-white'}`}
                                    >
                                        <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                    <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2">
                                        <Type className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-[20px] sm:min-w-[40px] text-center">
                                            {fontSize === 'small' ? 'S' : fontSize === 'normal' ? 'M' : fontSize === 'large' ? 'L' : 'XL'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => cycleFontSize('up')}
                                        disabled={fontSize === 'xlarge'}
                                        className={`p-1 sm:p-1.5 rounded transition-all ${fontSize === 'xlarge' ? 'text-slate-300' : 'text-slate-500 hover:text-[#880000] hover:bg-white'}`}
                                    >
                                        <PlusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                </div>

                                {mode === 'review' && mistakes.size > 0 && (
                                    <button
                                        onClick={() => setMistakes(new Set())}
                                        className="flex items-center gap-1 px-2 py-1 text-[9px] text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                                    >
                                        <RotateCcw size={10} />
                                        <span className="hidden sm:inline">Clear</span>
                                    </button>
                                )}
                            </div>

                            {/* Text Chunks */}
                            <div className="space-y-4 sm:space-y-6">
                                {chunks.map((chunk, chunkIndex) => {
                                    const words = chunk.split(' ');

                                    return (
                                        <div
                                            key={chunkIndex}
                                            className="relative animate-wipe-reveal"
                                            style={{ animationDelay: `${chunkIndex * 150}ms` }}
                                        >
                                            <div className="absolute -left-1 sm:-left-2 md:-left-4 top-0 text-[9px] sm:text-[10px] font-bold text-slate-200">
                                                {String(chunkIndex + 1).padStart(2, '0')}
                                            </div>
                                            <p className={`${fontSizeClasses[fontSize]} font-normal pl-3 sm:pl-4 md:pl-6 border-l border-transparent text-slate-700`}>
                                                {words.map((word, wIdx) => {
                                                    const clean = word.toLowerCase().replace(/[.,!?;:()"'\-]/g, '').trim();
                                                    const isMistake = mistakes.has(clean);
                                                    const isDictActive = dictWord === clean;

                                                    return (
                                                        <React.Fragment key={wIdx}>
                                                            <span
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleWordClick(word, e);
                                                                }}
                                                                className={`transition-all duration-150 cursor-pointer select-none inline-block ${mode === 'review'
                                                                        ? isMistake
                                                                            ? 'bg-[#880000] text-white px-0.5 sm:px-1 py-0.5 rounded-sm mistake-word-pulse'
                                                                            : 'hover:bg-slate-100 active:bg-slate-200'
                                                                        : isDictActive
                                                                            ? 'bg-slate-900 text-white px-0.5'
                                                                            : isMistake
                                                                                ? 'underline decoration-[#880000] decoration-2 underline-offset-2 hover:bg-[#880000]/10'
                                                                                : 'hover:bg-slate-100'
                                                                    }`}
                                                                title={mode === 'review' ? (isMistake ? 'Tap to unmark' : 'Tap to mark') : 'Tap for definition'}
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
                                })}
                            </div>
                        </div>

                        {/* ── Review Mode Footer ─────────── */}
                        {mode === 'review' && (
                            <div className="border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/50">
                                {mistakes.size > 0 && (
                                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3">
                                        {[...mistakes].map(w => (
                                            <span key={w} className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-[#880000]/10 text-[#880000] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                                                {w}
                                                <button onClick={() => {
                                                    setMistakes(prev => {
                                                        const next = new Set(prev);
                                                        next.delete(w);
                                                        return next;
                                                    });
                                                }} className="hover:text-red-800 ml-0.5">
                                                    <X size={8} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowMistakeCards(true)}
                                    disabled={mistakes.size === 0}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-[#880000] text-white font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Sparkles size={14} />
                                    <span>Create Review Card</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dictionary popup (Read mode only) */}
            {mode === 'read' && dictWord && (
                <DictionaryPopup
                    word={dictWord}
                    position={dictPosition}
                    onClose={() => setDictWord(null)}
                    onSpeak={speakWord}
                />
            )}

            {/* MistakeCards modal */}
            {showMistakeCards && (
                <MistakeCards
                    onClose={() => setShowMistakeCards(false)}
                    initialWords={mistakeWordsString}
                />
            )}
        </div>
    );
};

// ─── Fisher-Yates Shuffle ─────────────────────────────────────
const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// ─── localStorage helpers ─────────────────────────────────────
const STORAGE_KEY = 'storyRouletteData';

const loadFromStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
};

const saveToStorage = (participants, assignments) => {
    try {
        // Store only serializable story identifiers, then rehydrate
        const assignmentKeys = {};
        Object.entries(assignments).forEach(([name, story]) => {
            assignmentKeys[name] = { month: story.month, day: story.day };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ participants, assignments: assignmentKeys }));
    } catch (e) { /* ignore */ }
};

const rehydrateAssignments = (assignmentKeys) => {
    const result = {};
    Object.entries(assignmentKeys).forEach(([name, { month, day }]) => {
        const story = allStories.find(s => s.month === month && s.day === day);
        if (story) result[name] = story;
    });
    return result;
};

// ─── Main StoryRoulette Component ────────────────────────────
const StoryRoulette = () => {
    const navigate = useNavigate();
    const [participants, setParticipants] = useState(() => {
        const saved = loadFromStorage();
        return saved?.participants || [];
    });
    const [inputValue, setInputValue] = useState('');
    const [assignments, setAssignments] = useState(() => {
        const saved = loadFromStorage();
        return saved?.assignments ? rehydrateAssignments(saved.assignments) : {};
    });
    const [spinningNames, setSpinningNames] = useState(new Set());
    const [selectedStory, setSelectedStory] = useState(null);
    const [settledCount, setSettledCount] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef(null);

    // Persist to localStorage whenever participants or assignments change
    useEffect(() => {
        saveToStorage(participants, assignments);
    }, [participants, assignments]);

    const handleAdd = useCallback((e) => {
        e.preventDefault();
        const name = inputValue.trim();
        if (name && !participants.includes(name)) {
            setParticipants(prev => [...prev, name]);
            setInputValue('');
            inputRef.current?.focus();
        }
    }, [inputValue, participants]);

    const handleRemove = (name) => {
        setParticipants(prev => prev.filter(p => p !== name));
        setAssignments(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleClearAll = () => {
        setParticipants([]);
        setAssignments({});
        setSettledCount(0);
        localStorage.removeItem(STORAGE_KEY);
    };

    const executeSpin = () => {
        if (participants.length === 0) return;

        // Shuffle participant order for extra randomness
        const shuffledParticipants = shuffleArray(participants);
        setParticipants(shuffledParticipants);

        // Shuffle stories and deal unique ones (no duplicates)
        const shuffledStories = shuffleArray(allStories);
        const newAssignments = {};
        shuffledParticipants.forEach((name, i) => {
            // Wrap around if more participants than stories
            newAssignments[name] = shuffledStories[i % shuffledStories.length];
        });
        setAssignments(newAssignments);
        setSettledCount(0);

        // Stagger spin start
        participants.forEach((name, i) => {
            setTimeout(() => {
                setSpinningNames(prev => new Set([...prev, name]));
            }, i * 200);
        });

        // Stagger spin stop
        participants.forEach((name, i) => {
            setTimeout(() => {
                setSpinningNames(prev => {
                    const next = new Set(prev);
                    next.delete(name);
                    return next;
                });
            }, 2400 + i * 400);
        });
    };

    const handleSpin = () => {
        if (participants.length === 0) return;
        // If results already exist, show confirmation first
        if (Object.keys(assignments).length > 0) {
            setShowConfirm(true);
        } else {
            executeSpin();
        }
    };

    const handleExport = () => {
        const lines = participants
            .filter(name => assignments[name])
            .map(name => {
                const s = assignments[name];
                return `${name} → ${s.title} (M${s.month} Day ${s.day}, ${s.country})`;
            });
        const text = `📖 Story Roulette Results\n${'─'.repeat(30)}\n${lines.join('\n')}`;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const allSettled = participants.length > 0
        && spinningNames.size === 0
        && Object.keys(assignments).length === participants.length;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-2xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={() => navigate('/')}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="w-6 h-0.5 bg-[#880000] hidden sm:block flex-shrink-0"></div>
                        <h1 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-[0.1em] sm:tracking-[0.15em] truncate">Story Roulette</h1>
                    </div>
                    {participants.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#880000] transition-colors"
                        >
                            <Trash2 size={12} />
                            <span className="hidden sm:inline">Clear All</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-10">

                {/* Add Participant */}
                <div className="bg-white shadow-xl border-l-4 border-[#880000] mb-6 animate-fade-in">
                    <div className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 sm:w-8 h-0.5 bg-[#880000]"></div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Add Participants</span>
                        </div>
                        <form onSubmit={handleAdd} className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Enter name..."
                                className="flex-1 px-4 py-3 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#880000] transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="px-4 py-3 bg-slate-900 text-white hover:bg-[#880000] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Add</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Participant Cards */}
                {participants.length > 0 && (
                    <div className="space-y-3 mb-8">
                        {participants.map((name, idx) => {
                            const isSpinning = spinningNames.has(name);
                            const story = assignments[name];

                            return (
                                <div
                                    key={name}
                                    className={`
                                        bg-white shadow-lg border-l-4 transition-all duration-300 animate-fade-in
                                        ${story && !isSpinning ? 'border-[#880000] cursor-pointer hover:shadow-xl hover:-translate-y-0.5' : 'border-slate-200'}
                                    `}
                                    style={{ animationDelay: `${idx * 80}ms` }}
                                    onClick={() => !isSpinning && story && setSelectedStory(story)}
                                >
                                    <div className="flex">
                                        {/* Thumbnail */}
                                        {story && !isSpinning && story.localImage && (
                                            <div className="w-20 sm:w-24 flex-shrink-0 relative overflow-hidden">
                                                <img
                                                    src={story.localImage}
                                                    alt={story.title}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                    onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                                            </div>
                                        )}
                                        <div className="flex-1 px-4 sm:px-6 py-4 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-7 h-7 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0">
                                                        {name.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] truncate">{name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {story && !isSpinning && (
                                                        <div className="flex items-center gap-1 text-[10px] text-[#880000] font-bold uppercase tracking-wider">
                                                            <BookOpen size={12} />
                                                            <span>Read</span>
                                                        </div>
                                                    )}
                                                    {!isSpinning && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemove(name); }}
                                                            className="text-slate-300 hover:text-[#880000] transition-colors p-1"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <SlotReel
                                                isSpinning={isSpinning}
                                                finalStory={story}
                                                onDone={() => setSettledCount(prev => prev + 1)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Action Buttons */}
                {participants.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
                        <button
                            onClick={handleSpin}
                            disabled={spinningNames.size > 0}
                            className="inline-flex items-center gap-2.5 px-8 py-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#880000] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                        >
                            <Dices size={18} className={spinningNames.size > 0 ? 'animate-spin' : ''} />
                            {spinningNames.size > 0 ? 'Spinning...' : allSettled ? 'Spin Again' : 'Spin Roulette'}
                        </button>

                        {/* Export Button */}
                        {allSettled && (
                            <button
                                onClick={handleExport}
                                className="inline-flex items-center gap-2 px-5 py-4 bg-white text-slate-700 border border-slate-200 font-bold text-xs uppercase tracking-[0.15em] hover:border-[#880000] hover:text-[#880000] active:scale-[0.97] transition-all shadow-sm"
                            >
                                {copied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
                                {copied ? 'Copied!' : 'Export'}
                            </button>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {participants.length === 0 && (
                    <div className="text-center py-16 animate-fade-in">
                        <Dices size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Add participants to begin</p>
                    </div>
                )}
            </div>

            {/* Re-spin Confirmation */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="bg-white shadow-2xl border-l-4 border-[#880000] p-6 max-w-sm w-full animate-modal-in">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.15em] mb-3">Re-spin?</h3>
                        <p className="text-sm text-slate-500 mb-6">Current story assignments will be lost. This cannot be undone.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setShowConfirm(false); executeSpin(); }}
                                className="flex-1 px-4 py-3 bg-[#880000] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-900 transition-colors"
                            >
                                Re-spin
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Story Modal */}
            {selectedStory && (
                <StoryModal
                    story={selectedStory}
                    onClose={() => setSelectedStory(null)}
                />
            )}
        </div>
    );
};

export default StoryRoulette;
