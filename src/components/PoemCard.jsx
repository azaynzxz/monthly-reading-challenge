import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe, Download, Monitor, ChevronLeft, ChevronRight, Volume2, Square, ChevronDown, Mic, Copy, Check, BookOpen, X, Share2, Printer, FileText, PenLine, ClipboardCheck, ImageIcon, Minus, Plus, Type, Loader2 } from 'lucide-react';
import { isDifficultWord, getWordDifficulty } from '../utils/vocabulary';
import { getStorage, setStorage, StorageKeys } from '../utils/storage';
import WordPoster from './WordPoster';
import StoryPrintView from './StoryPrintView';
import OnlineAssessment from './OnlineAssessment';
import generateVocabPDF from './VocabPrintGenerator';

const PoemCard = ({
    activeData,
    currentPoemId,
    totalPoems,
    isGenerating,
    onDownload,
    onToggleTeleprompter,
    onPrev,
    onNext,
    statistics,
    progress,
    isPoemPracticed,
    practicedPoems,
    triggerPracticeTooltip,
    onOpenPoemSelector,
    preloadedImages = {},
    shouldOpenQuiz = false,
    onQuizOpened,
    onReady
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [focusedChunk, setFocusedChunk] = useState(null);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [copied, setCopied] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedWord, setSelectedWord] = useState(null);
    const [wordDefinition, setWordDefinition] = useState(null);
    const [savedWords, setSavedWords] = useState([]);
    const [isDefinitionClosing, setIsDefinitionClosing] = useState(false);
    const [showPracticeTooltip, setShowPracticeTooltip] = useState(false);
    const [isPracticeTooltipClosing, setIsPracticeTooltipClosing] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isDownloadingPoster, setIsDownloadingPoster] = useState(false);
    const [isShareModalClosing, setIsShareModalClosing] = useState(false);
    const [isPosterReady, setIsPosterReady] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [isPrintModalClosing, setIsPrintModalClosing] = useState(false);
    const [isPrintGenerating, setIsPrintGenerating] = useState(false);
    const [showAssessment, setShowAssessment] = useState(false);
    const [showVocabPrintModal, setShowVocabPrintModal] = useState(false);
    const [isVocabPrintModalClosing, setIsVocabPrintModalClosing] = useState(false);
    const [isVocabPrintGenerating, setIsVocabPrintGenerating] = useState(false);
    const [vocabPrintProgress, setVocabPrintProgress] = useState({ current: 0, total: 0 });
    const [vocabFillMeanings, setVocabFillMeanings] = useState(false);
    const [wikiImage, setWikiImage] = useState(null);
    const [isLoadingImage, setIsLoadingImage] = useState(true);
    const [showImageModal, setShowImageModal] = useState(false);
    const [isImageModalClosing, setIsImageModalClosing] = useState(false);
    const [isContentReady, setIsContentReady] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionDirection, setTransitionDirection] = useState('none');
    const [hasAnimated, setHasAnimated] = useState(false);
    const [readingFontSize, setReadingFontSize] = useState(() => {
        const settings = getStorage(StorageKeys.SETTINGS, {});
        return settings.readingFontSize || 'normal';
    });
    const prevIdRef = useRef(currentPoemId);
    const practiceButtonRef = useRef(null);
    const posterCanvasRef = useRef(null);
    const printContentRef = useRef(null);
    const imageCache = useRef({});

    // Watch for tooltip trigger from parent
    useEffect(() => {
        if (triggerPracticeTooltip) {
            setIsPracticeTooltipClosing(false);
            setShowPracticeTooltip(true);
            const timer = setTimeout(() => {
                setIsPracticeTooltipClosing(true);
                setTimeout(() => {
                    setShowPracticeTooltip(false);
                    setIsPracticeTooltipClosing(false);
                }, 300);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [triggerPracticeTooltip]);

    // Handle page transitions when poem changes
    useEffect(() => {
        if (prevIdRef.current !== currentPoemId) {
            const direction = currentPoemId > prevIdRef.current ? 'left' : 'right';
            setTransitionDirection(direction);
            setIsTransitioning(true);

            const timer = setTimeout(() => {
                setIsTransitioning(false);
                setTransitionDirection('none');
                setHasAnimated(true);
            }, 400);

            prevIdRef.current = currentPoemId;
            return () => clearTimeout(timer);
        }
    }, [currentPoemId]);

    // Mark as animated after initial fade-in completes
    useEffect(() => {
        if (isContentReady && !hasAnimated) {
            const timer = setTimeout(() => setHasAnimated(true), 600);
            return () => clearTimeout(timer);
        }
    }, [isContentReady, hasAnimated]);

    // Save font size preference
    useEffect(() => {
        const settings = getStorage(StorageKeys.SETTINGS, {});
        setStorage(StorageKeys.SETTINGS, { ...settings, readingFontSize });
    }, [readingFontSize]);

    // Font size classes mapping
    const fontSizeClasses = {
        small: 'text-base md:text-lg leading-[1.75] md:leading-[1.85]',
        normal: 'text-lg md:text-xl leading-[1.85] md:leading-[1.95]',
        large: 'text-xl md:text-2xl leading-[1.9] md:leading-[2]',
        xlarge: 'text-2xl md:text-3xl leading-[1.95] md:leading-[2.05]'
    };

    const cycleFontSize = (direction) => {
        const sizes = ['small', 'normal', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(readingFontSize);
        if (direction === 'up' && currentIndex < sizes.length - 1) {
            setReadingFontSize(sizes[currentIndex + 1]);
        } else if (direction === 'down' && currentIndex > 0) {
            setReadingFontSize(sizes[currentIndex - 1]);
        }
    };
    const utteranceRef = useRef(null);
    const selectedVoiceNameRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const wordPositionRef = useRef(null);
    const highlightTimerRef = useRef(null);
    const isSpeakingRef = useRef(false);

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
                    if (selectedVoice) {
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

        const delayedLoad = setTimeout(() => {
            loadVoices();
        }, 100);

        const handleVoicesChanged = () => {
            loadVoices();
        };

        window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

        const handleUserInteraction = () => {
            loadVoices();
        };

        document.addEventListener('click', handleUserInteraction, { once: true, passive: true });
        document.addEventListener('touchstart', handleUserInteraction, { once: true, passive: true });

        return () => {
            clearTimeout(delayedLoad);
            window.speechSynthesis.onvoiceschanged = null;
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
        };
    }, [selectedVoice]);

    // Load saved words from storage
    useEffect(() => {
        const saved = getStorage(StorageKeys.VOCABULARY, []);
        setSavedWords(saved);
    }, []);

    // Stop speech when data changes or component unmounts
    useEffect(() => {
        const stopSpeech = () => {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setHighlightIndex(-1);
            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = null;
            }
        };

        stopSpeech();

        return () => stopSpeech();
    }, [activeData]);

    // Load image - use local image if provided
    useEffect(() => {
        let isMounted = true;

        const fetchImage = async () => {
            setIsContentReady(false);
            setIsLoadingImage(true);

            if (!activeData?.title) {
                setWikiImage(null);
                setIsLoadingImage(false);
                setIsContentReady(true);
                onReady?.();
                return;
            }

            const localCacheKey = `poem-${activeData.id}-${activeData.title}`;

            // Check local cache first
            if (imageCache.current[localCacheKey]) {
                if (isMounted) {
                    setWikiImage(imageCache.current[localCacheKey]);
                    setIsLoadingImage(false);
                    setTimeout(() => {
                        if (isMounted) {
                            setIsContentReady(true);
                            onReady?.();
                        }
                    }, 50);
                }
                return;
            }

            // Use local image if available
            if (activeData.localImage) {
                const imageData = {
                    url: activeData.localImage,
                    title: activeData.imageTitle || activeData.title,
                    description: activeData.imageDescription || '',
                    searchTerm: activeData.title,
                    isLocal: true
                };

                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        if (isMounted) {
                            imageCache.current[localCacheKey] = imageData;
                            setWikiImage(imageData);
                            setIsLoadingImage(false);
                            setTimeout(() => {
                                if (isMounted) {
                                    setIsContentReady(true);
                                    onReady?.();
                                }
                            }, 50);
                        }
                        resolve();
                    };
                    img.onerror = () => {
                        if (isMounted) {
                            setWikiImage(null);
                            setIsLoadingImage(false);
                            setIsContentReady(true);
                            onReady?.();
                        }
                        resolve();
                    };
                    img.src = activeData.localImage;
                });
                return;
            }

            // No local image available
            if (isMounted) {
                setWikiImage(null);
                setIsLoadingImage(false);
                setIsContentReady(true);
                onReady?.();
            }
        };

        fetchImage();

        return () => { isMounted = false; };
    }, [activeData?.title, activeData?.id, activeData?.localImage]);

    // Auto-open quiz if shouldOpenQuiz is true
    useEffect(() => {
        if (shouldOpenQuiz && isContentReady && !showAssessment) {
            setShowAssessment(true);
            if (onQuizOpened) {
                onQuizOpened();
            }
        }
    }, [shouldOpenQuiz, isContentReady, showAssessment, onQuizOpened]);

    // Fetch word definition using Free Dictionary API
    const fetchWordDefinition = async (word) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:()\\"'-]/g, '');

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data[0]) {
                    return {
                        word: cleanWord,
                        phonetic: data[0].phonetic || '',
                        meanings: data[0].meanings || [],
                        source: 'dictionary'
                    };
                }
            }
        } catch (error) {
            console.log('Dictionary API error:', error.message);
        }

        return {
            word: cleanWord,
            phonetic: '',
            meanings: [{
                partOfSpeech: 'noun',
                definitions: [{
                    definition: `Definition not found for "${cleanWord}". Click to save to your vocabulary.`
                }]
            }],
            source: 'fallback'
        };
    };

    const handleWordClick = async (word, event) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:()"'-]/g, '');
        if (cleanWord.length < 3) return;
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that',
            'these', 'those', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'its', 'our', 'their', 'who', 'whom', 'whose', 'which', 'what', 'where',
            'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
            'such', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also', 'now',
            'here', 'there', 'then', 'if', 'as', 'into', 'from', 'up', 'down', 'out', 'off', 'over', 'any', 'am', 'by', 'about'];
        if (commonWords.includes(cleanWord)) return;

        if (selectedWord === cleanWord && wordDefinition) {
            setIsDefinitionClosing(true);
            setTimeout(() => {
                setSelectedWord(null);
                setWordDefinition(null);
                setIsDefinitionClosing(false);
            }, 300);
            return;
        }

        if (event) {
            const rect = event.currentTarget?.getBoundingClientRect();
            const clientX = event.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2);
            const clientY = event.clientY || (rect ? rect.bottom : window.innerHeight / 2);

            if (rect) {
                wordPositionRef.current = {
                    top: rect.bottom + 8,
                    left: rect.left + (rect.width / 2),
                    align: 'center'
                };
            } else {
                wordPositionRef.current = {
                    top: clientY + 10,
                    left: clientX,
                    align: 'left'
                };
            }
        } else {
            wordPositionRef.current = {
                top: window.innerHeight / 2,
                left: window.innerWidth / 2,
                align: 'center'
            };
        }

        if (selectedWord && selectedWord !== cleanWord) {
            setIsDefinitionClosing(true);
            setTimeout(() => {
                setSelectedWord(cleanWord);
                setIsDefinitionClosing(false);
                fetchWordDefinition(word).then(def => {
                    setWordDefinition(def);
                });
            }, 300);
        } else {
            setIsDefinitionClosing(false);
            setSelectedWord(cleanWord);
            const definition = await fetchWordDefinition(word);
            setWordDefinition(definition);
        }
    };

    const saveWordToDictionary = (word) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:()"'-]/g, '');
        if (savedWords.find(w => w.word === cleanWord)) return;

        const newWord = {
            word: cleanWord,
            definition: wordDefinition,
            addedDate: new Date().toISOString(),
            difficulty: getWordDifficulty(cleanWord)
        };

        const updated = [...savedWords, newWord];
        setSavedWords(updated);
        setStorage(StorageKeys.VOCABULARY, updated);
        setSelectedWord(null);
        setWordDefinition(null);
    };

    const removeWordFromDictionary = (word) => {
        const updated = savedWords.filter(w => w.word !== word);
        setSavedWords(updated);
        setStorage(StorageKeys.VOCABULARY, updated);
    };

    const refreshVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
        setVoices(availableVoices);

        if (selectedVoiceNameRef.current) {
            const foundVoice = availableVoices.find(v => v.name === selectedVoiceNameRef.current);
            if (foundVoice) {
                setSelectedVoice(foundVoice);
            } else if (availableVoices.length > 0) {
                const preferred = availableVoices.find(v => v.name.includes('Google US English')) ||
                    availableVoices.find(v => v.name.includes('Zira')) ||
                    availableVoices.find(v => v.name.includes('David')) ||
                    availableVoices[0];
                setSelectedVoice(preferred);
                selectedVoiceNameRef.current = preferred?.name || null;
            }
        } else if (availableVoices.length > 0) {
            const preferred = availableVoices.find(v => v.name.includes('Google US English')) ||
                availableVoices.find(v => v.name.includes('Zira')) ||
                availableVoices.find(v => v.name.includes('David')) ||
                availableVoices[0];
            setSelectedVoice(preferred);
            selectedVoiceNameRef.current = preferred?.name || null;
        }
    };

    // Text reveal animation
    const [textKey, setTextKey] = useState(0);

    useEffect(() => {
        setDisplayedText(activeData.text);
        setIsTyping(true);
        setTextKey(prev => prev + 1);

        const timer = setTimeout(() => {
            setIsTyping(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [activeData]);

    const handleSpeak = () => {
        if (isSpeaking || isSpeakingRef.current) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setHighlightIndex(-1);
            setFocusedChunk(null);
            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = null;
            }
            if (selectedVoiceNameRef.current && !selectedVoice) {
                const foundVoice = voices.find(v => v.name === selectedVoiceNameRef.current);
                if (foundVoice) {
                    setSelectedVoice(foundVoice);
                }
            }
            return;
        }

        const text = activeData.text;
        const utterance = new SpeechSynthesisUtterance(text);

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = 0.9;
        utterance.pitch = 1;

        // Split poem into stanzas (separated by double newlines)
        const stanzas = text.split(/\n\n+/).filter(s => s.trim());
        const chunks = stanzas;

        const msPerWord = 320;
        const chunkDurations = chunks.map(chunk => {
            const wordCount = chunk.split(/\s+/).length;
            return wordCount * msPerWord;
        });

        const highlightChunk = (index) => {
            if (!isSpeakingRef.current || index >= chunks.length) {
                return;
            }

            setHighlightIndex(index);
            setFocusedChunk(index);

            if (index < chunks.length - 1) {
                highlightTimerRef.current = setTimeout(() => {
                    highlightChunk(index + 1);
                }, chunkDurations[index]);
            }
        };

        utterance.onstart = () => {
            setIsSpeaking(true);
            isSpeakingRef.current = true;
            highlightChunk(0);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setHighlightIndex(-1);

            setTimeout(() => {
                if (!isSpeakingRef.current) {
                    setFocusedChunk(null);
                }
            }, 800);

            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = null;
            }
        };

        utterance.onerror = (event) => {
            if (event.error !== 'interrupted') {
                console.log('Speech error:', event.error);
            }
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setHighlightIndex(-1);
            setFocusedChunk(null);
            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = null;
            }
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const handleCopy = () => {
        const shareLink = `https://myenglish.my.id/poem/${currentPoemId}`;

        // Poems: use stanzas as chunks
        const stanzas = activeData.text.split(/\n\n+/).filter(s => s.trim());
        const formattedText = stanzas.join('\n\n');

        const textToCopy =
            `${activeData.title}
by ${activeData.author}

${formattedText}

This is my practice today, reciting "${activeData.title}" by ${activeData.author}. Cannot wait to improve my English with the next poem.

_By Zayn_

Practice your English with daily poems:
${shareLink}`;
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
        document.body.removeChild(textArea);
    };

    const handlePrint = () => {
        setIsPrintModalClosing(false);
        setShowPrintModal(true);
    };

    const handleVocabPrint = () => {
        setIsVocabPrintModalClosing(false);
        setVocabPrintProgress({ current: 0, total: 0 });
        setShowVocabPrintModal(true);
    };

    const executeVocabPrint = async () => {
        setIsVocabPrintGenerating(true);
        try {
            await generateVocabPDF({
                storyData: activeData,
                currentMonth: 1,
                currentDay: currentPoemId,
                fillMeanings: vocabFillMeanings,
                onProgress: (current, total) => {
                    setVocabPrintProgress({ current, total });
                },
                onComplete: () => {
                    setIsVocabPrintModalClosing(true);
                    setTimeout(() => {
                        setShowVocabPrintModal(false);
                        setIsVocabPrintModalClosing(false);
                        setIsVocabPrintGenerating(false);
                        setVocabPrintProgress({ current: 0, total: 0 });
                    }, 300);
                }
            });
        } catch (error) {
            console.error('Error generating vocab PDF:', error);
            setIsVocabPrintGenerating(false);
        }
    };

    const executePrint = async () => {
        setIsPrintGenerating(true);

        try {
            const storyPrintView = StoryPrintView({
                storyData: activeData,
                currentMonth: 1,
                currentDay: currentPoemId,
                wikiImage: wikiImage,
                onPrintComplete: () => {
                    setIsPrintModalClosing(true);
                    setTimeout(() => {
                        setShowPrintModal(false);
                        setIsPrintModalClosing(false);
                        setIsPrintGenerating(false);
                    }, 300);
                }
            });

            await storyPrintView.executePrint();
        } catch (error) {
            console.error('Error generating print:', error);
            setIsPrintGenerating(false);
        }
    };

    // Show loading skeleton while content loads
    if (!isContentReady) {
        return (
            <div className="bg-white shadow-xl overflow-hidden border-l-4 border-[#880000] animate-skeleton-in">
                <div className="min-h-[180px] md:min-h-[220px] lg:min-h-[260px] bg-slate-100 relative overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-200/80 via-transparent to-transparent" />
                </div>
                <div className="poem-card-skeleton-body p-6 md:p-8 lg:p-10 space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-0.5 bg-slate-200"></div>
                        <div className="h-3 w-24 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse" style={{ animationDelay: '75ms' }}></div>
                        <div className="h-4 bg-slate-200 rounded w-4/6 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    // Determine animation class based on transition state
    const getTransitionClass = () => {
        if (isTransitioning) {
            return transitionDirection === 'left'
                ? 'animate-page-enter-left'
                : 'animate-page-enter-right';
        }
        if (!hasAnimated) {
            return 'animate-fade-in';
        }
        return '';
    };

    return (
        <div
            key={isTransitioning ? `poem-${currentPoemId}` : 'stable'}
            id="poem-card-container"
            className={`poem-card-container bg-white shadow-xl overflow-hidden border-l-4 border-[#880000] ${getTransitionClass()}`}
        >
            {/* Hero Header with Image Background - Swiss Design */}
            <div
                className={`relative overflow-hidden ${wikiImage ? 'min-h-[180px] md:min-h-[220px] lg:min-h-[260px]' : ''}`}
            >
                {/* Background Image */}
                {wikiImage && (
                    <div
                        className="absolute inset-0 overflow-hidden cursor-pointer"
                        onClick={() => setShowImageModal(true)}
                    >
                        <img
                            src={wikiImage.url}
                            alt={wikiImage.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                setWikiImage(null);
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                    </div>
                )}

                {/* Content Overlay - TOP: Metadata and Action Buttons */}
                <div className={`relative z-10 p-4 md:p-6 ${wikiImage ? 'pointer-events-none' : 'bg-slate-50 border-b border-slate-100'} ${wikiImage ? 'absolute top-0 left-0 right-0' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative">
                        {/* Left: Poem Selector */}
                        <div className={`flex items-center gap-3 pointer-events-auto ${wikiImage ? 'text-white' : 'text-slate-900'}`}>
                            {/* Poem Selector */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenPoemSelector?.(); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] transition-all cursor-pointer z-20 ${wikiImage ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white' : 'bg-slate-900 text-white hover:bg-[#880000]'}`}
                            >
                                <span>Poem {currentPoemId}</span>
                                <ChevronDown size={10} className="md:w-3 md:h-3" />
                            </button>
                        </div>

                        {/* Right: Action Buttons - Swiss Minimal */}
                        <div className="flex items-center gap-1 pointer-events-auto">
                            {/* Vocab Print */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleVocabPrint(); }}
                                className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 transition-colors duration-200 ${wikiImage ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'}`}
                                title="Vocabulary PDF"
                            >
                                <FileText size={14} className="md:w-4 md:h-4" />
                            </button>
                            {/* Print */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrint(); }}
                                className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 transition-colors duration-200 ${wikiImage ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'}`}
                                title="Print"
                            >
                                <Printer size={14} className="md:w-4 md:h-4" />
                            </button>
                            {/* Download */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                                disabled={isGenerating}
                                className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 transition-colors duration-200 disabled:opacity-50 ${wikiImage ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'}`}
                                title="Save"
                            >
                                <Download size={14} className="md:w-4 md:h-4" />
                            </button>
                            {/* Copy */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                                className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 transition-colors duration-200 ${copied ? 'bg-green-500 text-white' : wikiImage ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'}`}
                                title={copied ? 'Copied!' : 'Copy'}
                            >
                                {copied ? <Check size={14} className="md:w-4 md:h-4" /> : <Copy size={14} className="md:w-4 md:h-4" />}
                            </button>
                            {/* Share */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsShareModalClosing(false); setIsPosterReady(false); posterCanvasRef.current = null; setShowShareModal(true); }}
                                className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 transition-colors duration-200 ${wikiImage ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'}`}
                                title="Share"
                            >
                                <Share2 size={14} className="md:w-4 md:h-4" />
                            </button>
                            {/* Quiz */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowAssessment(true); }}
                                className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 transition-colors duration-200 ${wikiImage ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'}`}
                                title="Quiz"
                            >
                                <ClipboardCheck size={14} className="md:w-4 md:h-4" />
                            </button>

                            {/* Practice Button - Swiss CTA */}
                            <div className="relative ml-1 z-10">
                                <button
                                    ref={practiceButtonRef}
                                    onClick={(e) => { e.stopPropagation(); onToggleTeleprompter(); }}
                                    onMouseEnter={() => { setIsPracticeTooltipClosing(false); setShowPracticeTooltip(true); }}
                                    onMouseLeave={() => { setIsPracticeTooltipClosing(true); setTimeout(() => { setShowPracticeTooltip(false); setIsPracticeTooltipClosing(false); }, 300); }}
                                    onTouchStart={() => { setIsPracticeTooltipClosing(false); setShowPracticeTooltip(true); setTimeout(() => { setIsPracticeTooltipClosing(true); setTimeout(() => { setShowPracticeTooltip(false); setIsPracticeTooltipClosing(false); }, 300); }, 3000); }}
                                    className="flex items-center gap-1.5 bg-[#880000] hover:bg-slate-900 text-white px-3 md:px-4 py-2 md:py-2.5 font-bold text-[10px] md:text-xs uppercase tracking-[0.1em] transition-all"
                                >
                                    <Mic size={12} className="md:w-3.5 md:h-3.5" />
                                    <span>Practice</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM: Title and Listen - Swiss Typography */}
                <div className={`relative z-10 ${wikiImage ? 'absolute bottom-0 left-0 right-0 pointer-events-none' : ''} px-4 pt-16 pb-4 md:px-6 md:pt-20 md:pb-6 ${wikiImage ? '' : 'pt-4 pb-4'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        {/* Title - Swiss Typography */}
                        <div className="flex-1">
                            {/* Accent Line */}
                            <div className={`w-8 h-0.5 mb-3 ${wikiImage ? 'bg-white/40' : 'bg-[#880000]'}`}></div>
                            <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold leading-[1.1] tracking-tight ${wikiImage ? 'text-white' : 'text-slate-900'}`}>
                                {activeData.title}
                            </h2>
                            {/* Author Attribution */}
                            {activeData.author && (
                                <span className={`text-sm md:text-base flex items-center gap-1 mt-2 ${wikiImage ? 'text-white/60' : 'text-slate-500'}`}>
                                    by {activeData.author}
                                </span>
                            )}
                            {/* Image Attribution */}
                            {wikiImage && (
                                <span className="text-white/40 text-[9px] md:text-[10px] flex items-center gap-1 mt-2 uppercase tracking-[0.15em]">
                                    <ImageIcon size={9} />
                                    {wikiImage.title} · Wikipedia
                                </span>
                            )}
                        </div>

                        {/* Listen UI - Swiss Minimal */}
                        <div className={`flex items-center gap-0 pointer-events-auto ${wikiImage ? 'bg-white/10 backdrop-blur-sm' : 'bg-slate-100'}`}>
                            {/* Voice Selector */}
                            {voices.length > 0 && (
                                <div className="relative">
                                    <select
                                        value={selectedVoice?.name || ''}
                                        onChange={(e) => {
                                            const voice = voices.find(v => v.name === e.target.value);
                                            setSelectedVoice(voice);
                                            selectedVoiceNameRef.current = voice?.name || null;
                                        }}
                                        onFocus={refreshVoices}
                                        onMouseDown={refreshVoices}
                                        className="appearance-none bg-transparent pl-3 pr-7 py-2 md:py-2.5 font-medium text-[10px] md:text-xs cursor-pointer focus:outline-none w-full transition-colors absolute inset-0 z-10 opacity-[0.01]"
                                    >
                                        {voices.map(v => (
                                            <option key={v.name} value={v.name}>
                                                {v.name.replace(/Microsoft |Google |English |United States/g, '').replace(/\s*\(\s*\)/g, '').replace(/\s*-\s*$/, '').trim()}
                                            </option>
                                        ))}
                                    </select>
                                    <div className={`pointer-events-none pl-3 pr-7 py-2 md:py-2.5 text-[10px] md:text-xs font-medium truncate max-w-[100px] md:max-w-[120px] ${wikiImage ? 'text-white' : 'text-slate-600'}`}>
                                        {(selectedVoice?.name || selectedVoiceNameRef.current) ? (selectedVoice?.name || selectedVoiceNameRef.current).replace(/Microsoft |Google |English |United States/g, '').replace(/\s*\(\s*\)/g, '').replace(/\s*-\s*$/, '').trim() : 'Zira'}
                                    </div>
                                    <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none z-20 ${wikiImage ? 'text-white/50' : 'text-slate-400'}`}>
                                        <ChevronDown size={10} />
                                    </div>
                                </div>
                            )}

                            {/* Listen Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
                                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 font-bold text-[10px] md:text-xs uppercase tracking-[0.1em] transition-all ${isSpeaking
                                    ? 'bg-[#880000] text-white'
                                    : wikiImage
                                        ? 'text-white hover:bg-white/10'
                                        : 'text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                {isSpeaking ? <Square size={10} className="md:w-3 md:h-3" fill="currentColor" /> : <Volume2 size={10} className="md:w-3 md:h-3" />}
                                <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reading Content - Swiss Design */}
            <div className="poem-card-body p-6 md:p-8 lg:p-10">
                <div className="mb-6">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 bg-[#880000]"></div>
                            <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Read Aloud</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Font Size Control */}
                            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                                <button
                                    onClick={() => cycleFontSize('down')}
                                    disabled={readingFontSize === 'small'}
                                    className={`p-1.5 rounded transition-all ${readingFontSize === 'small' ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-[#880000] hover:bg-white'}`}
                                    title="Decrease font size"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <div className="flex items-center gap-1 px-2">
                                    <Type className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-[40px] text-center">
                                        {readingFontSize === 'small' ? 'S' : readingFontSize === 'normal' ? 'M' : readingFontSize === 'large' ? 'L' : 'XL'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => cycleFontSize('up')}
                                    disabled={readingFontSize === 'xlarge'}
                                    className={`p-1.5 rounded transition-all ${readingFontSize === 'xlarge' ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-[#880000] hover:bg-white'}`}
                                    title="Increase font size"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            {focusedChunk !== null && (
                                <button
                                    onClick={() => setFocusedChunk(null)}
                                    className="text-[10px] md:text-xs text-slate-400 hover:text-[#880000] font-medium uppercase tracking-wider transition-colors"
                                >
                                    Show All
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Poem Stanzas - Preserve line breaks */}
                    <div key={textKey} className="space-y-6 max-w-xl md:max-w-2xl mx-auto">
                        {(() => {
                            // Split poem into stanzas by double newlines
                            const stanzas = displayedText.split(/\n\n+/).filter(s => s.trim());

                            let globalWordIndex = 0;

                            return stanzas.map((stanza, stanzaIndex) => {
                                const stanzaWords = stanza.replace(/\n/g, ' ').split(' ').filter(w => w);
                                const startWordIndex = globalWordIndex;
                                globalWordIndex += stanzaWords.length;

                                const isFocused = focusedChunk === null || focusedChunk === stanzaIndex;
                                const isActive = focusedChunk === stanzaIndex;
                                const isBeingRead = highlightIndex === stanzaIndex && isSpeaking;

                                // Split stanza into lines for proper poem rendering
                                const lines = stanza.split('\n');

                                return (
                                    <div
                                        key={stanzaIndex}
                                        onClick={() => !isSpeaking && setFocusedChunk(focusedChunk === stanzaIndex ? null : stanzaIndex)}
                                        className={`relative cursor-pointer transition-all duration-300 animate-wipe-reveal ${isFocused ? 'opacity-100' : 'opacity-20 hover:opacity-40'
                                            }`}
                                        style={{ animationDelay: `${stanzaIndex * 150}ms` }}
                                    >
                                        {/* Stanza Number - Swiss Style */}
                                        <div className={`absolute -left-2 md:-left-4 top-0 text-[10px] font-bold transition-colors ${isActive || isBeingRead ? 'text-[#880000]' : 'text-slate-200'}`}>
                                            {String(stanzaIndex + 1).padStart(2, '0')}
                                        </div>

                                        {/* Text Content - Render each line of the stanza */}
                                        <div className={`${fontSizeClasses[readingFontSize]} font-normal pl-4 md:pl-6 transition-all duration-300 ${isBeingRead
                                            ? 'border-l-4 border-[#880000] bg-[#880000]/5 py-4 -my-2 text-slate-900'
                                            : isActive
                                                ? 'border-l-2 border-[#880000] bg-slate-50/50 py-4 -my-2 text-slate-700'
                                                : 'border-l border-transparent hover:border-slate-200 text-slate-700'
                                            }`}>
                                            {lines.map((line, lineIndex) => {
                                                const lineWords = line.split(' ').filter(w => w);
                                                return (
                                                    <React.Fragment key={lineIndex}>
                                                        {lineWords.map((word, wordIndexInLine) => {
                                                            const cleanWord = word.toLowerCase().replace(/[.,!?;:()"'-]/g, '');
                                                            const isDifficult = isDifficultWord(cleanWord);
                                                            const isSaved = savedWords.find(w => w.word === cleanWord);
                                                            const isSelected = selectedWord === cleanWord;

                                                            return (
                                                                <React.Fragment key={`${lineIndex}-${wordIndexInLine}`}>
                                                                    <span
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleWordClick(word, e);
                                                                        }}
                                                                        className={`transition-all duration-150 cursor-pointer ${isSelected
                                                                            ? 'bg-slate-900 text-white px-1'
                                                                            : isSaved
                                                                                ? 'text-green-700 underline decoration-green-300 decoration-2 underline-offset-2'
                                                                                : isDifficult
                                                                                    ? 'text-[#880000] hover:bg-[#880000]/10'
                                                                                    : 'hover:bg-slate-100'
                                                                            }`}
                                                                        title={isSaved ? 'Saved to vocabulary' : isDifficult ? 'Difficult word' : 'Click for definition'}
                                                                    >
                                                                        {word}
                                                                    </span>
                                                                    {' '}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                        {lineIndex < lines.length - 1 && <br />}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {/* Word Definition Tooltip - Swiss Design */}
                    {selectedWord && wordDefinition && (
                        <div
                            className={`fixed z-50 bg-white shadow-2xl border-l-4 border-[#880000] p-5 max-w-sm ${isDefinitionClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
                            style={{
                                top: wordPositionRef.current ? `${wordPositionRef.current.top}px` : '50%',
                                left: wordPositionRef.current
                                    ? wordPositionRef.current.align === 'center'
                                        ? `${Math.max(16, Math.min(wordPositionRef.current.left - 175, window.innerWidth - 350))}px`
                                        : `${Math.max(16, Math.min(wordPositionRef.current.left, window.innerWidth - 350))}px`
                                    : '50%',
                                transform: wordPositionRef.current
                                    ? wordPositionRef.current.align === 'center'
                                        ? 'translateX(-50%)'
                                        : 'none'
                                    : 'translate(-50%, -50%)'
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-xl text-slate-900 capitalize tracking-tight">{wordDefinition.word}</h3>
                                        <button
                                            onClick={() => {
                                                const textToSpeak = wordDefinition.word;
                                                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                                                if (selectedVoice) { utterance.voice = selectedVoice; }
                                                utterance.rate = 0.9;
                                                utterance.pitch = 1;
                                                window.speechSynthesis.speak(utterance);
                                            }}
                                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-[#880000] hover:bg-slate-100 transition-colors"
                                            title="Listen"
                                        >
                                            <Volume2 size={16} />
                                        </button>
                                    </div>
                                    {wordDefinition.phonetic && (
                                        <p className="text-sm text-slate-400 font-mono">{wordDefinition.phonetic}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setIsDefinitionClosing(true);
                                        setTimeout(() => { setSelectedWord(null); setWordDefinition(null); setIsDefinitionClosing(false); }, 300);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Definitions */}
                            {wordDefinition.meanings && wordDefinition.meanings.length > 0 && (
                                <div className="mb-4 space-y-3">
                                    {wordDefinition.meanings.slice(0, 2).map((meaning, idx) => (
                                        <div key={idx} className="pl-3 border-l-2 border-slate-100">
                                            <span className="text-[10px] font-bold text-[#880000] uppercase tracking-[0.1em]">{meaning.partOfSpeech}</span>
                                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                                {meaning.definitions[0]?.definition}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="pt-3 border-t border-slate-100">
                                {savedWords.find(w => w.word === selectedWord) ? (
                                    <button
                                        onClick={() => removeWordFromDictionary(selectedWord)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-600 transition-colors w-full justify-center"
                                    >
                                        <X size={12} />
                                        Remove
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => saveWordToDictionary(selectedWord)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-[#880000] transition-colors w-full justify-center"
                                    >
                                        <BookOpen size={12} />
                                        Save to Dictionary
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Footer Navigation - Swiss Minimal */}
            <div className="border-t border-slate-200 flex items-stretch">
                {/* Previous */}
                <button
                    onClick={onPrev}
                    disabled={currentPoemId === 1}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 font-medium text-xs uppercase tracking-wider px-4 md:px-6 py-4 transition-all duration-150"
                >
                    <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                    <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Center Info */}
                <div className="flex-1 flex items-center justify-center border-l border-r border-slate-200">
                    <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-[0.15em]">
                        Review pronunciation before continuing
                    </span>
                </div>

                {/* Next */}
                <button
                    onClick={onNext}
                    disabled={currentPoemId >= totalPoems || (isPoemPracticed && !isPoemPracticed(currentPoemId))}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 disabled:cursor-not-allowed font-medium text-xs uppercase tracking-wider px-4 md:px-6 py-4 transition-all duration-150"
                    title={isPoemPracticed && !isPoemPracticed(currentPoemId) ? 'Practice this poem first' : ''}
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </button>
            </div>

            {/* Share Modal - Swiss Design */}
            {
                showShareModal && (
                    <>
                        <div
                            className={`fixed inset-0 bg-black/60 z-50 ${isShareModalClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                            onClick={() => {
                                setIsShareModalClosing(true);
                                setTimeout(() => {
                                    setShowShareModal(false);
                                    setIsShareModalClosing(false);
                                    setIsPosterReady(false);
                                    posterCanvasRef.current = null;
                                }, 300);
                            }}
                        />

                        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                            <div className={`bg-white shadow-2xl max-w-md w-full mx-4 pointer-events-auto border-l-4 border-[#880000] ${isShareModalClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-0.5 bg-[#880000]"></div>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Share Progress</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsShareModalClosing(true);
                                            setTimeout(() => {
                                                setShowShareModal(false);
                                                setIsShareModalClosing(false);
                                                setIsPosterReady(false);
                                                posterCanvasRef.current = null;
                                            }, 300);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <Share2 size={24} className="text-slate-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">
                                                Share Your Progress
                                            </h2>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Download your learning poster and share with others.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-0 border border-slate-200 mb-6">
                                        <div className="p-3 text-center border-r border-slate-200">
                                            <div className="text-lg font-bold text-slate-900">#{currentPoemId}</div>
                                            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Poem</div>
                                        </div>
                                        <div className="p-3 text-center border-r border-slate-200">
                                            <div className="text-lg font-bold text-slate-900 truncate text-sm">{activeData.author?.split(' ').pop()}</div>
                                            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Author</div>
                                        </div>
                                        <div className="p-3 text-center">
                                            <div className="text-lg font-bold text-[#880000]">JPG</div>
                                            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Format</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <button
                                            onClick={async () => {
                                                if (!posterCanvasRef.current || !isPosterReady) return;
                                                setIsDownloadingPoster(true);
                                                try {
                                                    const link = document.createElement('a');
                                                    link.download = `poem-${currentPoemId}-${activeData.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
                                                    link.href = posterCanvasRef.current.toDataURL('image/jpeg', 0.95);
                                                    link.click();
                                                    setIsShareModalClosing(true);
                                                    setTimeout(() => {
                                                        setShowShareModal(false);
                                                        setIsShareModalClosing(false);
                                                        setIsDownloadingPoster(false);
                                                        setIsPosterReady(false);
                                                    }, 300);
                                                } catch (error) {
                                                    console.error('Error sharing:', error);
                                                    setIsDownloadingPoster(false);
                                                }
                                            }}
                                            disabled={isDownloadingPoster || !isPosterReady || !posterCanvasRef.current}
                                            className="w-full bg-slate-900 hover:bg-[#880000] text-white py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em]"
                                        >
                                            {!isPosterReady ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Generating</span>
                                                </>
                                            ) : isDownloadingPoster ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Downloading</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={14} />
                                                    <span>Download Poster</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsShareModalClosing(true);
                                                setTimeout(() => {
                                                    setShowShareModal(false);
                                                    setIsShareModalClosing(false);
                                                    setIsPosterReady(false);
                                                    posterCanvasRef.current = null;
                                                }, 300);
                                            }}
                                            className="w-full text-slate-400 hover:text-slate-600 py-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hidden WordPoster for canvas generation */}
                        <div className="fixed -top-[9999px] left-0 pointer-events-none">
                            <WordPoster
                                width={1080}
                                height={1350}
                                title={activeData.title}
                                subtitle={`by ${activeData.author}`}
                                meta={`Poem ${currentPoemId}`}
                                text={activeData.text}
                                localImage={activeData.localImage}
                                statistics={statistics}
                                progress={progress}
                                month={1}
                                day={currentPoemId}
                                onPosterReady={(canvas) => {
                                    posterCanvasRef.current = canvas;
                                    setIsPosterReady(true);
                                }}
                            />
                        </div>
                    </>
                )
            }

            {/* Print Modal - Swiss Design */}
            {
                showPrintModal && (
                    <>
                        <div
                            className={`fixed inset-0 bg-black/60 z-50 ${isPrintModalClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                            onClick={() => {
                                setIsPrintModalClosing(true);
                                setTimeout(() => {
                                    setShowPrintModal(false);
                                    setIsPrintModalClosing(false);
                                }, 300);
                            }}
                        />

                        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                            <div className={`bg-white shadow-2xl max-w-md w-full mx-4 pointer-events-auto border-l-4 border-[#880000] ${isPrintModalClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-0.5 bg-[#880000]"></div>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Print & Practice</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsPrintModalClosing(true);
                                            setTimeout(() => {
                                                setShowPrintModal(false);
                                                setIsPrintModalClosing(false);
                                            }, 300);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <Printer size={24} className="text-slate-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">
                                                Print Poem & Quiz
                                            </h2>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Offline practice with reading and assessment.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-0 border border-slate-200 mb-6">
                                        <div className="p-4 border-r border-slate-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-4 h-0.5 bg-[#880000]"></div>
                                                <span className="text-[9px] text-[#880000] font-bold uppercase tracking-wider">Page 1</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{activeData.author}</div>
                                            <div className="text-xs font-bold text-slate-900 mb-2 line-clamp-1">{activeData.title}</div>
                                            <div className="text-[9px] text-slate-400 flex items-center gap-1">
                                                <BookOpen size={10} /> Poem + Vocab
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-4 h-0.5 bg-slate-300"></div>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Page 2</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Assessment</div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
                                                    <div className="w-1 h-1 bg-[#880000]"></div>
                                                    Fill in blank
                                                </div>
                                                <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
                                                    <div className="w-1 h-1 bg-[#880000]"></div>
                                                    Meanings
                                                </div>
                                                <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
                                                    <div className="w-1 h-1 bg-[#880000]"></div>
                                                    Comprehension
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-4 mb-6 text-[10px] text-slate-400 uppercase tracking-wider">
                                        <span>A4 Format</span>
                                        <span>·</span>
                                        <span>2 Pages</span>
                                        <span>·</span>
                                        <span>Print Ready</span>
                                    </div>

                                    <div className="space-y-2">
                                        <button
                                            onClick={executePrint}
                                            disabled={isPrintGenerating}
                                            className="w-full bg-slate-900 hover:bg-[#880000] text-white py-4 transition-all disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em]"
                                        >
                                            {isPrintGenerating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Generating Quiz</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Printer size={14} />
                                                    <span>Print Now</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsPrintModalClosing(true);
                                                setTimeout(() => {
                                                    setShowPrintModal(false);
                                                    setIsPrintModalClosing(false);
                                                }, 300);
                                            }}
                                            className="w-full text-slate-400 hover:text-slate-600 py-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )
            }

            {/* Vocab Print Modal - Swiss Design */}
            {
                showVocabPrintModal && (
                    <>
                        <div
                            className={`fixed inset-0 bg-black/60 z-50 ${isVocabPrintModalClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                            onClick={() => {
                                if (!isVocabPrintGenerating) {
                                    setIsVocabPrintModalClosing(true);
                                    setTimeout(() => {
                                        setShowVocabPrintModal(false);
                                        setIsVocabPrintModalClosing(false);
                                    }, 300);
                                }
                            }}
                        />

                        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                            <div className={`bg-white shadow-2xl max-w-md w-full mx-4 pointer-events-auto border-l-4 border-[#880000] ${isVocabPrintModalClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-0.5 bg-[#880000]"></div>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Vocabulary PDF</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!isVocabPrintGenerating) {
                                                setIsVocabPrintModalClosing(true);
                                                setTimeout(() => {
                                                    setShowVocabPrintModal(false);
                                                    setIsVocabPrintModalClosing(false);
                                                }, 300);
                                            }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <FileText size={24} className="text-slate-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">
                                                Vocabulary Practice Sheet
                                            </h2>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Download a PDF vocabulary table with Indonesian-friendly pronunciation.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-0 border border-slate-200 mb-6">
                                        <div className="p-3 text-center border-r border-slate-200">
                                            <div className="text-lg font-bold text-slate-900">#{currentPoemId}</div>
                                            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Poem</div>
                                        </div>
                                        <div className="p-3 text-center border-r border-slate-200">
                                            <div className="text-lg font-bold text-slate-900 truncate text-sm">{activeData.author?.split(' ').pop()}</div>
                                            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Author</div>
                                        </div>
                                        <div className="p-3 text-center">
                                            <div className="text-lg font-bold text-[#880000]">PDF</div>
                                            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Format</div>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 mb-6">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-0.5 bg-[#880000]"></div>
                                                <span className="text-[9px] text-[#880000] font-bold uppercase tracking-wider">Table Preview</span>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <div className="grid grid-cols-4 gap-0 text-[9px]">
                                                <div className="p-1.5 font-bold text-white bg-[#880000]">No</div>
                                                <div className="p-1.5 font-bold text-white bg-[#880000]">Words</div>
                                                <div className="p-1.5 font-bold text-white bg-[#880000]">Pronunciation</div>
                                                <div className="p-1.5 font-bold text-white bg-[#880000]">Meaning</div>
                                            </div>
                                            <div className="grid grid-cols-4 gap-0 text-[9px] bg-slate-50">
                                                <div className="p-1.5 text-[#880000] font-bold border-b border-slate-200">1</div>
                                                <div className="p-1.5 font-bold border-b border-slate-200">example</div>
                                                <div className="p-1.5 italic text-slate-500 border-b border-slate-200">eg-ZAM-pel</div>
                                                <div className="p-1.5 text-slate-400 border-b border-slate-200">{vocabFillMeanings ? 'contoh' : '___________'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 mb-6">
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 mb-0.5">Include Meanings</div>
                                            <div className="text-[10px] text-slate-400">
                                                {vocabFillMeanings ? 'Meanings will be filled in from dictionary' : 'Leave blank for exercise — student will fill in'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setVocabFillMeanings(!vocabFillMeanings)}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${vocabFillMeanings ? 'bg-[#880000]' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${vocabFillMeanings ? 'translate-x-[22px]' : 'translate-x-0.5'}`}></div>
                                        </button>
                                    </div>

                                    {isVocabPrintGenerating && vocabPrintProgress.total > 0 && (
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fetching Definitions</span>
                                                <span className="text-[10px] font-bold text-[#880000]">{vocabPrintProgress.current}/{vocabPrintProgress.total}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
                                                <div
                                                    className="h-full bg-[#880000] transition-all duration-300"
                                                    style={{ width: `${(vocabPrintProgress.current / vocabPrintProgress.total) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <button
                                            onClick={executeVocabPrint}
                                            disabled={isVocabPrintGenerating}
                                            className="w-full bg-slate-900 hover:bg-[#880000] text-white py-4 transition-all disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em]"
                                        >
                                            {isVocabPrintGenerating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Generating PDF</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={14} />
                                                    <span>Download PDF</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (!isVocabPrintGenerating) {
                                                    setIsVocabPrintModalClosing(true);
                                                    setTimeout(() => {
                                                        setShowVocabPrintModal(false);
                                                        setIsVocabPrintModalClosing(false);
                                                    }, 300);
                                                }
                                            }}
                                            disabled={isVocabPrintGenerating}
                                            className="w-full text-slate-400 hover:text-slate-600 py-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )
            }

            {/* Floating Practice Tooltip - Swiss Design */}
            {showPracticeTooltip && practiceButtonRef.current && (
                <div
                    className={`fixed z-[9999] bg-white shadow-2xl border-l-4 border-[#880000] p-5 max-w-[260px] md:max-w-[300px] ${isPracticeTooltipClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
                    style={{
                        top: (() => {
                            const rect = practiceButtonRef.current.getBoundingClientRect();
                            return `${rect.bottom + 12}px`;
                        })(),
                        left: (() => {
                            const rect = practiceButtonRef.current.getBoundingClientRect();
                            const tooltipWidth = 260;
                            const leftPos = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                            return `${Math.max(16, Math.min(leftPos, window.innerWidth - tooltipWidth - 16))}px`;
                        })()
                    }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-0.5 bg-[#880000]"></div>
                                <span className="text-[9px] text-slate-400 uppercase tracking-[0.2em]">Required</span>
                            </div>
                            <h3 className="font-bold text-base text-slate-900 mb-2 leading-tight">Practice First</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Complete this poem's practice to unlock the next one.
                            </p>
                        </div>
                        <button
                            onClick={() => { setIsPracticeTooltipClosing(true); setTimeout(() => { setShowPracticeTooltip(false); setIsPracticeTooltipClosing(false); }, 300); }}
                            className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors flex-shrink-0"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Online Assessment Modal */}
            {
                showAssessment && (
                    <OnlineAssessment
                        storyData={activeData}
                        currentMonth={1}
                        currentDay={currentPoemId}
                        onClose={() => setShowAssessment(false)}
                    />
                )
            }

            {/* Image Modal - Swiss Design */}
            {
                showImageModal && wikiImage && (
                    <>
                        <div
                            className={`fixed inset-0 bg-black/80 z-50 ${isImageModalClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                            onClick={() => {
                                setIsImageModalClosing(true);
                                setTimeout(() => { setShowImageModal(false); setIsImageModalClosing(false); }, 300);
                            }}
                        />

                        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none ${isImageModalClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                            <div className="relative max-w-4xl w-full pointer-events-auto">
                                <button
                                    onClick={() => { setIsImageModalClosing(true); setTimeout(() => { setShowImageModal(false); setIsImageModalClosing(false); }, 300); }}
                                    className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
                                >
                                    <X size={24} />
                                </button>

                                <div className="bg-white overflow-hidden shadow-2xl">
                                    <div className="relative bg-slate-100 h-[45vh] md:h-[55vh]">
                                        <img src={wikiImage.url} alt={wikiImage.title} className="w-full h-full object-cover" />
                                    </div>

                                    <div className="p-6 md:p-8">
                                        <div className="flex items-start gap-6">
                                            <div className="w-1 h-16 bg-[#880000] flex-shrink-0 hidden md:block"></div>

                                            <div className="flex-1">
                                                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 leading-tight tracking-tight">
                                                    {wikiImage.title}
                                                </h2>

                                                {wikiImage.description && (
                                                    <p className="text-sm md:text-base text-slate-500 leading-relaxed mb-4 line-clamp-3">
                                                        {wikiImage.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                                    <ImageIcon size={12} className="text-slate-400" />
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">
                                                        Wikipedia
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )
            }
        </div >
    );
};

export default PoemCard;
