import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Download, Loader2, AlertCircle, Volume2, Sparkles, Edit3, Check, Copy, ChevronDown } from 'lucide-react';

const MistakeCards = ({ onClose }) => {
    const [inputText, setInputText] = useState('');
    const [words, setWords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isPosterGenerated, setIsPosterGenerated] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editPhonetic, setEditPhonetic] = useState('');
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const canvasRef = useRef(null);
    const selectedVoiceNameRef = useRef(null);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
            setVoices(availableVoices);

            if (availableVoices.length > 0) {
                if (selectedVoiceNameRef.current) {
                    const foundVoice = availableVoices.find(v => v.name === selectedVoiceNameRef.current);
                    if (foundVoice) {
                        setSelectedVoice(foundVoice);
                        return;
                    }
                }
                if (!selectedVoiceNameRef.current) {
                    const preferred = availableVoices.find(v => v.name.includes('Google US English')) ||
                        availableVoices.find(v => v.name.includes('Zira')) ||
                        availableVoices.find(v => v.name.includes('David')) ||
                        availableVoices[0];
                    setSelectedVoice(preferred);
                    selectedVoiceNameRef.current = preferred?.name || null;
                }
            }
        };

        loadVoices();
        setTimeout(loadVoices, 100);
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // Refresh voices
    const refreshVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
        setVoices(availableVoices);
    };

    // Fetch pronunciation from Dictionary API
    const fetchPronunciation = async (word) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:()"'-]/g, '').trim();
        if (!cleanWord) return null;

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data[0]) {
                    return {
                        word: cleanWord,
                        phonetic: data[0].phonetic || data[0].phonetics?.find(p => p.text)?.text || '',
                        partOfSpeech: data[0].meanings?.[0]?.partOfSpeech || '',
                        definition: data[0].meanings?.[0]?.definitions?.[0]?.definition || ''
                    };
                }
            }
        } catch (error) {
            console.log('Dictionary API error for:', cleanWord);
        }

        return {
            word: cleanWord,
            phonetic: '',
            partOfSpeech: '',
            definition: ''
        };
    };

    // Parse input and fetch pronunciations
    const handleGenerate = async () => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        setIsPosterGenerated(false);

        // Split by comma or newline
        const rawWords = inputText
            .split(/[,\n]+/)
            .map(w => w.trim())
            .filter(w => w.length > 0);

        // Remove duplicates
        const uniqueWords = [...new Set(rawWords.map(w => w.toLowerCase()))];

        // Fetch pronunciations for all words
        const wordDataPromises = uniqueWords.map(word => fetchPronunciation(word));
        const wordData = await Promise.all(wordDataPromises);

        setWords(wordData.filter(w => w !== null));
        setIsLoading(false);
        setIsPosterGenerated(true);
    };

    // Update phonetic for a word
    const updatePhonetic = (index, newPhonetic) => {
        const newWords = [...words];
        newWords[index] = { ...newWords[index], phonetic: newPhonetic };
        setWords(newWords);
    };

    // Start editing phonetic
    const startEditing = (index) => {
        setEditingIndex(index);
        setEditPhonetic(words[index].phonetic || '');
    };

    // Save edited phonetic
    const savePhonetic = () => {
        if (editingIndex !== null) {
            updatePhonetic(editingIndex, editPhonetic);
            setEditingIndex(null);
            setEditPhonetic('');
        }
    };

    // Helper function to draw rounded rectangle (cross-browser compatible)
    const drawRoundedRect = (ctx, x, y, w, h, radius) => {
        const r = Array.isArray(radius) ? radius : [radius, radius, radius, radius];
        ctx.beginPath();
        ctx.moveTo(x + r[0], y);
        ctx.lineTo(x + w - r[1], y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r[1]);
        ctx.lineTo(x + w, y + h - r[2]);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
        ctx.lineTo(x + r[3], y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r[3]);
        ctx.lineTo(x, y + r[0]);
        ctx.quadraticCurveTo(x, y, x + r[0], y);
        ctx.closePath();
    };

    // Generate Swiss Design Poster on Canvas
    const drawPoster = useCallback(() => {
        if (words.length === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Poster dimensions (3:4 ratio)
        const width = 1080;
        const height = 1440;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(0, 0, width, height);

        // Brand colors
        const accentColor = '#880000';
        const textColor = '#1a1a1a';
        const mutedColor = '#666666';
        const cardBg = '#FFFFFF';

        // Grid settings
        const margin = 60;
        const innerWidth = width - margin * 2;

        // Header Section
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 0, width, 180);

        // Title
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText('REVIEW CARDS', margin, 100);

        // Subtitle
        ctx.font = '24px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(`${words.length} Words to Review`, margin, 140);

        // Date
        ctx.textAlign = 'right';
        ctx.font = '20px Arial, sans-serif';
        const today = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        ctx.fillText(today, width - margin, 110);

        // Cards Section
        const startY = 220;
        const columns = words.length <= 6 ? 2 : 3;
        const cardGap = 14;
        const cardWidth = (innerWidth - cardGap * (columns - 1)) / columns;
        const lineHeight = 16;
        const defFontSize = 13;
        const baseCardHeight = 115; // Height without definition (word + phonetic + part of speech + padding)

        // Helper function to calculate definition lines
        const getDefinitionLines = (definition, maxWidth) => {
            if (!definition) return [];
            ctx.font = `${defFontSize}px Arial, sans-serif`;
            const defWords = definition.split(' ');
            const lines = [];
            let currentLine = '';

            for (const word of defWords) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                if (ctx.measureText(testLine).width <= maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) {
                        lines.push(currentLine);
                    }
                    currentLine = word;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
            return lines;
        };

        // First pass: calculate required height for each card
        const maxDefWidth = cardWidth - 36;
        const cardHeights = words.map(wordData => {
            const defLines = getDefinitionLines(wordData.definition, maxDefWidth);
            return baseCardHeight + (defLines.length * lineHeight) + 15; // 15px bottom padding
        });

        // Group cards by row and find max height per row
        const rowCount = Math.ceil(words.length / columns);
        const rowHeights = [];
        for (let row = 0; row < rowCount; row++) {
            let maxRowHeight = 0;
            for (let col = 0; col < columns; col++) {
                const idx = row * columns + col;
                if (idx < cardHeights.length) {
                    maxRowHeight = Math.max(maxRowHeight, cardHeights[idx]);
                }
            }
            rowHeights.push(maxRowHeight);
        }

        // Calculate cumulative Y positions for each row
        const rowYPositions = [startY];
        for (let row = 1; row < rowCount; row++) {
            rowYPositions.push(rowYPositions[row - 1] + rowHeights[row - 1] + cardGap);
        }

        // Draw cards
        words.forEach((wordData, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = margin + col * (cardWidth + cardGap);
            const y = rowYPositions[row];
            const cardHeight = rowHeights[row];

            // Check if card would overflow
            if (y + cardHeight > height - 100) return;

            // Card shadow
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            drawRoundedRect(ctx, x + 4, y + 4, cardWidth, cardHeight, 12);
            ctx.fill();

            // Card background
            ctx.fillStyle = cardBg;
            drawRoundedRect(ctx, x, y, cardWidth, cardHeight, 12);
            ctx.fill();

            // Card left accent bar
            ctx.fillStyle = accentColor;
            ctx.fillRect(x, y + 12, 6, cardHeight - 24);

            // Word
            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.fillStyle = textColor;
            ctx.textAlign = 'left';

            // Truncate word if too long
            let displayWord = wordData.word.charAt(0).toUpperCase() + wordData.word.slice(1);
            const maxWordWidth = cardWidth - 40;
            while (ctx.measureText(displayWord).width > maxWordWidth && displayWord.length > 3) {
                displayWord = displayWord.slice(0, -1);
            }
            if (displayWord !== wordData.word.charAt(0).toUpperCase() + wordData.word.slice(1)) displayWord += '…';

            ctx.fillText(displayWord, x + 20, y + 45);

            // Phonetic
            if (wordData.phonetic) {
                ctx.font = 'italic 18px Arial, sans-serif';
                ctx.fillStyle = accentColor;
                ctx.fillText(wordData.phonetic, x + 20, y + 75);
            }

            // Part of speech
            if (wordData.partOfSpeech) {
                ctx.font = '14px Arial, sans-serif';
                ctx.fillStyle = mutedColor;
                ctx.fillText(wordData.partOfSpeech, x + 20, y + 100);
            }

            // Definition (full text, no truncation)
            if (wordData.definition) {
                ctx.font = `${defFontSize}px Arial, sans-serif`;
                ctx.fillStyle = mutedColor;

                const lines = getDefinitionLines(wordData.definition, maxDefWidth);

                // Draw each line
                lines.forEach((line, lineIndex) => {
                    ctx.fillText(line, x + 18, y + 118 + (lineIndex * lineHeight));
                });
            }
        });

        // Footer
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, height - 80, width, 80);

        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText('ENGLISH DAILY', margin, height - 35);

        ctx.font = '16px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.textAlign = 'right';
        ctx.fillText('By Mr. Zayn', width - margin, height - 35);
    }, [words]);

    // Draw poster when words change
    useEffect(() => {
        if (isPosterGenerated && words.length > 0) {
            // Small delay to ensure state is updated
            requestAnimationFrame(() => {
                drawPoster();
            });
        }
    }, [isPosterGenerated, words, drawPoster]);

    // Download poster (same approach as WordPoster.jsx)
    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsDownloading(true);

        // Create download link
        const link = document.createElement('a');
        link.download = `review-cards-${new Date().toISOString().slice(0, 10)}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsDownloading(false);
    };

    // Copy shareable text
    const handleCopyText = () => {
        if (words.length === 0) return;

        const separator = '-------------------------------';
        const wordLines = words.map(w => {
            const phonetic = w.phonetic ? ` → ${w.phonetic}` : '';
            return `${w.word}${phonetic}`;
        }).join('\n');

        const textToCopy = `Read carefully:\n${separator}\n${wordLines}\n${separator}`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Speak word
    const speakWord = (word) => {
        const utterance = new SpeechSynthesisUtterance(word);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
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
                <div className="bg-white shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto border-l-4 border-[#880000]">
                    {/* Header - Swiss */}
                    <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 bg-[#880000]"></div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-[0.15em]">Review Cards</h2>
                        </div>
                        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                        {/* Input Section - Swiss */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-4 h-0.5 bg-slate-300"></div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">Input Words</span>
                            </div>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="importance, harshest, climates, thrive, centuries, magnificent, forest, sacred, countless, silhouettes, scene"
                                className="w-full h-32 p-4 border border-slate-200 focus:border-slate-400 focus:outline-none transition-all resize-none text-slate-700 text-sm bg-slate-50"
                            />
                            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider">Separate words by commas or new lines</p>
                        </div>

                        {/* Generate Button - Swiss */}
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !inputText.trim()}
                            className="w-full bg-slate-900 hover:bg-[#880000] text-white font-bold py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6 text-[11px] uppercase tracking-[0.2em]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Generating</span>
                                </>
                            ) : (
                                <span>Generate Cards</span>
                            )}
                        </button>

                        {/* Results Section - Swiss */}
                        {isPosterGenerated && words.length > 0 && (
                            <div className="space-y-6">
                                {/* Word Cards Grid */}
                                <div>
                                    {/* Header Row - Swiss */}
                                    <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="text-3xl font-bold text-slate-900 leading-none">{words.length}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">Words<br/>Found</div>
                                        </div>
                                        {/* Voice Selector - Swiss */}
                                        {voices.length > 0 && (
                                            <div className="flex items-center border border-slate-200">
                                                <div className="px-2 py-1.5 border-r border-slate-200 flex items-center">
                                                    <Volume2 size={12} className="text-slate-400" />
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        value={selectedVoice?.name || ''}
                                                        onChange={(e) => {
                                                            const voice = voices.find(v => v.name === e.target.value);
                                                            setSelectedVoice(voice);
                                                            selectedVoiceNameRef.current = voice?.name || null;
                                                        }}
                                                        onFocus={refreshVoices}
                                                        className="appearance-none bg-transparent border-none pl-2 pr-6 py-1.5 text-[10px] font-medium text-slate-600 focus:outline-none cursor-pointer uppercase tracking-wider"
                                                    >
                                                        {voices.map(v => (
                                                            <option key={v.name} value={v.name}>
                                                                {v.name.replace(/Microsoft |Google |English |United States/g, '').replace(/\s*\(\s*\)/g, '').replace(/\s*-\s*$/, '').trim()}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Word Cards Grid - Swiss */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                        {words.map((wordData, index) => (
                                            <div key={index} className="bg-white border border-slate-200 p-4 border-l-4 border-l-[#880000] hover:bg-slate-50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-900 capitalize truncate text-sm tracking-tight">
                                                            {wordData.word}
                                                        </h4>

                                                        {/* Editable Phonetic - Swiss */}
                                                        {editingIndex === index ? (
                                                            <div className="flex items-center gap-1 mt-2">
                                                                <input
                                                                    type="text"
                                                                    value={editPhonetic}
                                                                    onChange={(e) => setEditPhonetic(e.target.value)}
                                                                    placeholder="/ˈfəʊnɛtɪk/"
                                                                    className="flex-1 text-xs px-2 py-1 border border-[#880000] focus:outline-none text-[#880000] font-mono"
                                                                    autoFocus
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') savePhonetic();
                                                                        if (e.key === 'Escape') { setEditingIndex(null); setEditPhonetic(''); }
                                                                    }}
                                                                />
                                                                <button onClick={savePhonetic} className="p-1 text-green-600 hover:bg-green-50 transition-colors">
                                                                    <Check size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <p className={`text-xs font-mono ${wordData.phonetic ? 'text-[#880000]' : 'text-slate-300'}`}>
                                                                    {wordData.phonetic || '—'}
                                                                </p>
                                                                <button
                                                                    onClick={() => startEditing(index)}
                                                                    className="p-0.5 text-slate-300 hover:text-[#880000] transition-colors"
                                                                    title="Edit pronunciation"
                                                                >
                                                                    <Edit3 size={10} />
                                                                </button>
                                                            </div>
                                                        )}

                                                        {wordData.partOfSpeech && (
                                                            <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">{wordData.partOfSpeech}</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => speakWord(wordData.word)}
                                                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#880000] hover:bg-slate-100 transition-colors flex-shrink-0"
                                                    >
                                                        <Volume2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons - Swiss Grid */}
                                <div className="grid grid-cols-2 gap-0 border border-slate-200">
                                    {/* Download Button */}
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        className="py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 border-r border-slate-700"
                                    >
                                        {isDownloading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Download size={16} />
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{isDownloading ? 'Saving' : 'Download'}</span>
                                    </button>

                                    {/* Copy Text Button */}
                                    <button
                                        onClick={handleCopyText}
                                        className={`py-4 px-6 transition-all flex items-center justify-center gap-2 ${
                                            copied ? 'bg-green-600 text-white' : 'bg-[#880000] hover:bg-[#770000] text-white'
                                        }`}
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{copied ? 'Copied' : 'Copy Text'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Hidden Canvas */}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default MistakeCards;
