import React, { useState, useEffect } from 'react';
import { X, RotateCw, ChevronLeft, ChevronRight, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { getStorage, StorageKeys } from '../utils/storage';

const Flashcards = ({ onClose }) => {
    const [savedWords, setSavedWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showDefinition, setShowDefinition] = useState(false);
    const [studyMode, setStudyMode] = useState('all'); // 'all', 'hard', 'medium', 'easy'
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    useEffect(() => {
        const words = getStorage(StorageKeys.VOCABULARY, []);
        setSavedWords(words);
    }, []);

    const filteredWords = savedWords.filter(word => {
        if (studyMode === 'all') return true;
        return word.difficulty === studyMode;
    });

    const currentWord = filteredWords[currentIndex];

    const handleNext = () => {
        setShowDefinition(false);
        setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
    };

    const handlePrev = () => {
        setShowDefinition(false);
        setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    };

    const removeWord = (word) => {
        const updated = savedWords.filter(w => w.word !== word);
        setSavedWords(updated);
        const storage = getStorage(StorageKeys.VOCABULARY, []);
        const updatedStorage = storage.filter(w => w.word !== word);
        localStorage.setItem(StorageKeys.VOCABULARY, JSON.stringify(updatedStorage));
        
        if (currentIndex >= filteredWords.length - 1) {
            setCurrentIndex(0);
        }
    };

    if (filteredWords.length === 0) {
        return (
            <>
                {/* Backdrop */}
                <div 
                    className={`fixed inset-0 bg-black/60 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                    onClick={handleClose}
                />
                {/* Empty State - Swiss */}
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                    <div className="bg-white shadow-2xl max-w-md w-full p-8 pointer-events-auto border-l-4 border-[#880000]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-0.5 bg-[#880000]"></div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-[0.15em]">Flashcards</h2>
                            </div>
                            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="text-slate-300" size={32} />
                            </div>
                            <p className="text-slate-600 mb-2">No words saved yet</p>
                            <p className="text-sm text-slate-400">Click on difficult words while reading to add them.</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/60 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onClick={handleClose}
            />
            {/* Modal - Swiss Design */}
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="bg-white shadow-2xl max-w-2xl w-full pointer-events-auto border-l-4 border-[#880000]">
                    {/* Header - Swiss */}
                    <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-0.5 bg-[#880000]"></div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-[0.15em]">Flashcards</h2>
                            </div>
                            <select
                                value={studyMode}
                                onChange={(e) => { setStudyMode(e.target.value); setCurrentIndex(0); setShowDefinition(false); }}
                                className="px-3 py-1.5 border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-transparent focus:outline-none focus:border-slate-400"
                            >
                                <option value="all">All</option>
                                <option value="hard">Hard</option>
                                <option value="medium">Medium</option>
                                <option value="easy">Easy</option>
                            </select>
                        </div>
                        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 md:p-8">
                        {/* Progress */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Card {currentIndex + 1} of {filteredWords.length}</div>
                            <div className="flex gap-1">
                                {filteredWords.slice(0, Math.min(10, filteredWords.length)).map((_, i) => (
                                    <div key={i} className={`w-2 h-2 ${i === currentIndex ? 'bg-[#880000]' : 'bg-slate-200'}`}></div>
                                ))}
                                {filteredWords.length > 10 && <span className="text-[10px] text-slate-400 ml-1">+{filteredWords.length - 10}</span>}
                            </div>
                        </div>

                        {/* Flashcard - Swiss */}
                        <div
                            className="bg-slate-900 p-8 md:p-12 min-h-[280px] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-800"
                            onClick={() => setShowDefinition(!showDefinition)}
                        >
                            {!showDefinition ? (
                                <div className="text-center">
                                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 capitalize tracking-tight">{currentWord.word}</h3>
                                    <p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Tap to reveal</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-8 h-0.5 bg-[#880000] mx-auto mb-6"></div>
                                    <p className="text-white/90 text-base md:text-lg leading-relaxed mb-4">
                                        {currentWord.definition?.meanings?.[0]?.definitions?.[0]?.definition || 'Definition not available'}
                                    </p>
                                    {currentWord.definition?.phonetic && (
                                        <p className="text-white/50 text-sm font-mono">{currentWord.definition.phonetic}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Controls - Swiss Grid */}
                        <div className="grid grid-cols-4 gap-0 mt-6 border border-slate-200">
                            <button onClick={handlePrev} className="flex items-center justify-center gap-2 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors border-r border-slate-200">
                                <ChevronLeft size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Prev</span>
                            </button>
                            <button
                                onClick={() => { setShowDefinition(false); setCurrentIndex(Math.floor(Math.random() * filteredWords.length)); }}
                                className="flex items-center justify-center py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors border-r border-slate-200"
                                title="Shuffle"
                            >
                                <RotateCw size={16} />
                            </button>
                            <button onClick={() => removeWord(currentWord.word)} className="flex items-center justify-center gap-2 py-3 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors border-r border-slate-200">
                                <XCircle size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Remove</span>
                            </button>
                            <button onClick={handleNext} className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white hover:bg-[#880000] transition-colors">
                                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Next</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Flashcards;

