import React, { useState, useEffect, useRef } from 'react';
import { Globe, Download, Monitor, ChevronLeft, ChevronRight, Volume2, Square, ChevronDown, Mic, Copy, Check, BookOpen, X, Share2, Printer, FileText, PenLine, ClipboardCheck, ImageIcon } from 'lucide-react';
import { isDifficultWord, getWordDifficulty } from '../utils/vocabulary';
import { getStorage, setStorage, StorageKeys } from '../utils/storage';
import { shareToSocial, generateShareImage, generateShareLink } from '../utils/socialShare';
import WordPoster from './WordPoster';
import StoryPrintView from './StoryPrintView';
import OnlineAssessment from './OnlineAssessment';

const ReadingCard = ({
    activeData,
    currentMonth,
    currentDay,
    isGenerating,
    onDownload,
    onToggleTeleprompter,
    onPrev,
    onNext,
    statistics,
    progress,
    isDayPracticed,
    practicedDays,
    triggerPracticeTooltip
}) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
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
    const [wikiImage, setWikiImage] = useState(null);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [isImageModalClosing, setIsImageModalClosing] = useState(false);
    const practiceButtonRef = useRef(null);
    const posterCanvasRef = useRef(null);
    const printContentRef = useRef(null);
    const imageCache = useRef({}); // Cache for Wikipedia images

    // Watch for tooltip trigger from parent
    useEffect(() => {
        if (triggerPracticeTooltip) {
            setIsPracticeTooltipClosing(false);
            setShowPracticeTooltip(true);
            // Auto-hide after 4 seconds
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
    const utteranceRef = useRef(null);
    const selectedVoiceNameRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const wordPositionRef = useRef(null);
    const highlightTimerRef = useRef(null);
    const isSpeakingRef = useRef(false);
    const boundaryEventFiredRef = useRef(false);

    // Load available voices
    // Note: Chrome has fewer TTS voices than Edge because:
    // - Edge uses Windows SAPI5 voices directly (access to all Windows TTS voices)
    // - Chrome uses its own TTS engine (more limited, typically 2-4 English voices)
    // - Chrome may require user interaction to load voices (lazy loading)
    // To get more voices in Chrome: Install additional Windows voices via Settings > Time & Language > Speech
    useEffect(() => {
        const loadVoices = () => {
            // Get all English voices
            const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
            setVoices(availableVoices);

            if (availableVoices.length > 0) {
                // If we have a selected voice name, try to find it again
                if (selectedVoiceNameRef.current) {
                    const foundVoice = availableVoices.find(v => v.name === selectedVoiceNameRef.current);
                    if (foundVoice) {
                        setSelectedVoice(foundVoice);
                        return;
                    }
                    // If voice not found but we have a name, keep the current selectedVoice if it exists
                    if (selectedVoice) {
                        return;
                    }
                }
                // Only set default if we don't have a selected voice name yet
                if (!selectedVoiceNameRef.current) {
                    // Prefer voices in this order: Google US English, Microsoft Zira, Microsoft David, or first available
                    const preferred = availableVoices.find(v => v.name.includes('Google US English')) ||
                        availableVoices.find(v => v.name.includes('Zira')) ||
                        availableVoices.find(v => v.name.includes('David')) ||
                        availableVoices[0];
                    setSelectedVoice(preferred);
                    selectedVoiceNameRef.current = preferred?.name || null;
                }
            }
        };

        // Initial load - Chrome may return empty array initially
        loadVoices();

        // Chrome sometimes needs multiple attempts or user interaction to load voices
        // Try loading again after a short delay
        const delayedLoad = setTimeout(() => {
            loadVoices();
        }, 100);

        const handleVoicesChanged = () => {
            // Reload voices when the voices list changes (this is the main event for Chrome)
            loadVoices();
        };

        window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

        // Also try loading voices after a user interaction (helps with Chrome's lazy loading)
        const handleUserInteraction = () => {
            loadVoices();
        };

        // Listen for user interactions to trigger voice loading in Chrome
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
            boundaryEventFiredRef.current = false;
        };

        stopSpeech();

        return () => stopSpeech();
    }, [activeData]);

    // Fetch Wikipedia image based on wikiSearch field, title, or country
    useEffect(() => {
        const fetchWikiImage = async () => {
            if (!activeData?.title) {
                setWikiImage(null);
                return;
            }

            // Create cache key based on day and month
            const cacheKey = `${activeData.day}-${activeData.wikiSearch || activeData.title}`;

            // Check cache first
            if (imageCache.current[cacheKey]) {
                setWikiImage(imageCache.current[cacheKey]);
                return;
            }

            setIsLoadingImage(true);

            // Priority: wikiSearch field (manually set) > title > country
            const searchTerms = [
                activeData.wikiSearch,  // e.g., "Taj Mahal" - manually specified
                activeData.title,
                activeData.country !== "TBD" ? activeData.country : null
            ].filter(Boolean);

            for (const term of searchTerms) {
                try {
                    const response = await fetch(
                        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        const imageUrl = data.originalimage?.source || data.thumbnail?.source;

                        // Skip if no image or if it's an SVG (usually flags/icons)
                        if (imageUrl && !imageUrl.includes('.svg') && !imageUrl.toLowerCase().includes('flag')) {
                            const imageData = {
                                url: imageUrl,
                                title: activeData.wikiSearch || data.title, // Use wikiSearch as title
                                description: data.extract,
                                searchTerm: activeData.wikiSearch || term
                            };

                            // Store in cache
                            imageCache.current[cacheKey] = imageData;

                            setWikiImage(imageData);
                            setIsLoadingImage(false);
                            return;
                        }
                    }
                } catch (error) {
                    console.log('Wikipedia API error for', term);
                }
            }

            setWikiImage(null);
            setIsLoadingImage(false);
        };

        fetchWikiImage();
    }, [activeData?.wikiSearch, activeData?.title, activeData?.country, activeData?.day]);

    // Fetch word definition using Free Dictionary API
    const fetchWordDefinition = async (word) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:()\"'-]/g, '');

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

        // Fallback definition
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
        if (cleanWord.length < 3) return; // Skip very short words
        // Skip common words that don't have dictionary definitions
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that',
            'these', 'those', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'its', 'our', 'their', 'who', 'whom', 'whose', 'which', 'what', 'where',
            'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
            'such', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also', 'now',
            'here', 'there', 'then', 'if', 'as', 'into', 'from', 'up', 'down', 'out', 'off', 'over', 'any', 'am', 'by', 'about'];
        if (commonWords.includes(cleanWord)) return;

        // If clicking the same word, close it
        if (selectedWord === cleanWord && wordDefinition) {
            setIsDefinitionClosing(true);
            setTimeout(() => {
                setSelectedWord(null);
                setWordDefinition(null);
                setIsDefinitionClosing(false);
            }, 300);
            return;
        }

        // Position the tooltip below the clicked word or at cursor
        if (event) {
            const rect = event.currentTarget?.getBoundingClientRect();
            const clientX = event.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2);
            const clientY = event.clientY || (rect ? rect.bottom : window.innerHeight / 2);

            if (rect) {
                // Position below the word, centered horizontally
                wordPositionRef.current = {
                    top: rect.bottom + 8,
                    left: rect.left + (rect.width / 2),
                    align: 'center'
                };
            } else {
                // Fallback to cursor position
                wordPositionRef.current = {
                    top: clientY + 10,
                    left: clientX,
                    align: 'left'
                };
            }
        } else {
            // Fallback position
            wordPositionRef.current = {
                top: window.innerHeight / 2,
                left: window.innerWidth / 2,
                align: 'center'
            };
        }

        // If another word is selected, close it first
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
        if (savedWords.find(w => w.word === cleanWord)) return; // Already saved

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

    // Function to refresh voices (helps Chrome load voices after user interaction)
    const refreshVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
        setVoices(availableVoices);

        // If we have a selected voice, try to restore it
        if (selectedVoiceNameRef.current) {
            const foundVoice = availableVoices.find(v => v.name === selectedVoiceNameRef.current);
            if (foundVoice) {
                setSelectedVoice(foundVoice);
            } else if (availableVoices.length > 0) {
                // If selected voice not found, pick a default
                const preferred = availableVoices.find(v => v.name.includes('Google US English')) ||
                    availableVoices.find(v => v.name.includes('Zira')) ||
                    availableVoices.find(v => v.name.includes('David')) ||
                    availableVoices[0];
                setSelectedVoice(preferred);
                selectedVoiceNameRef.current = preferred?.name || null;
            }
        } else if (availableVoices.length > 0) {
            // No voice selected yet, pick a default
            const preferred = availableVoices.find(v => v.name.includes('Google US English')) ||
                availableVoices.find(v => v.name.includes('Zira')) ||
                availableVoices.find(v => v.name.includes('David')) ||
                availableVoices[0];
            setSelectedVoice(preferred);
            selectedVoiceNameRef.current = preferred?.name || null;
        }
    };

    // Typing animation when data changes
    useEffect(() => {
        // Clear any existing typing animation
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        const fullText = activeData.text;
        const words = fullText.split(' ');
        setDisplayedText('');
        setIsTyping(true);

        let currentWordIndex = 0;
        const maxAnimationTime = 1500; // 1.5 seconds maximum
        const wordCount = words.length;
        const baseDelay = Math.max(15, Math.floor(maxAnimationTime / wordCount));

        // Quint easing function (easeInOutQuint) - smooth acceleration and deceleration
        const easeInOutQuint = (t) => {
            return t < 0.5
                ? 16 * t * t * t * t * t
                : 1 - Math.pow(-2 * t + 2, 5) / 2;
        };

        const typeWord = () => {
            if (currentWordIndex < wordCount) {
                const wordsToShow = words.slice(0, currentWordIndex + 1);
                setDisplayedText(wordsToShow.join(' '));
                currentWordIndex++;

                // Calculate progress (0 to 1)
                const progress = currentWordIndex / wordCount;
                // Apply quint easing for smooth acceleration/deceleration
                const easedProgress = easeInOutQuint(progress);
                // Adjust delay based on easing - slower at start/end, faster in middle
                const delay = Math.floor(baseDelay * (1.5 - easedProgress * 0.5));

                typingTimeoutRef.current = setTimeout(typeWord, delay);
            } else {
                setIsTyping(false);
            }
        };

        // Start typing after a small delay
        typingTimeoutRef.current = setTimeout(typeWord, 50);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [activeData]);

    const handleSpeak = () => {
        if (isSpeaking || isSpeakingRef.current) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setHighlightIndex(-1);
            // Clear any timers
            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = null;
            }
            boundaryEventFiredRef.current = false;
            // Ensure selected voice is preserved after stopping
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

        // Calculate word boundaries and timing
        const words = text.split(' ');
        let currentOffset = 0;
        const wordOffsets = words.map(word => {
            const start = currentOffset;
            const end = currentOffset + word.length;
            currentOffset += word.length + 1; // +1 for space
            return { start, end };
        });

        // Estimate duration per word (in milliseconds)
        // Average reading speed: ~150 words per minute = 400ms per word
        // Adjusted for rate 0.9: 400 / 0.9 ≈ 444ms per word
        const baseWordDuration = 444;

        // Calculate cumulative timings for each word
        const wordTimings = words.map((word, index) => {
            // Longer words take more time, shorter words take less
            const wordLength = word.length;
            const duration = Math.max(200, baseWordDuration * (0.7 + (wordLength / 10) * 0.3));
            return {
                index,
                startTime: words.slice(0, index).reduce((sum, w) => {
                    const wLen = w.length;
                    return sum + Math.max(200, baseWordDuration * (0.7 + (wLen / 10) * 0.3));
                }, 0),
                duration
            };
        });

        let currentWordIndex = -1;

        // Try boundary-based highlighting (works in Edge)
        utterance.onboundary = (event) => {
            if (event.name === 'word' && isSpeakingRef.current) {
                boundaryEventFiredRef.current = true;
                // Clear timer-based highlighting since boundary events are working
                if (highlightTimerRef.current) {
                    clearTimeout(highlightTimerRef.current);
                    highlightTimerRef.current = null;
                }
                const charIndex = event.charIndex;
                const index = wordOffsets.findIndex(w => charIndex >= w.start && charIndex <= w.end);
                if (index !== -1) {
                    setHighlightIndex(index);
                    currentWordIndex = index;
                }
            }
        };

        utterance.onstart = () => {
            setIsSpeaking(true);
            isSpeakingRef.current = true;
            setHighlightIndex(-1);
            currentWordIndex = -1;
            boundaryEventFiredRef.current = false;

            // Fallback: Timer-based highlighting for Chrome
            // Start timer-based highlighting, but boundary events will take over if available
            let wordIndex = 0;
            const highlightNextWord = () => {
                // If boundary events are working, don't use timer-based highlighting
                if (boundaryEventFiredRef.current) {
                    return;
                }
                // Check if still speaking using speechSynthesis API
                if (wordIndex < words.length && (window.speechSynthesis.speaking || isSpeakingRef.current)) {
                    setHighlightIndex(wordIndex);
                    currentWordIndex = wordIndex;
                    const timing = wordTimings[wordIndex];
                    const nextDelay = wordIndex === 0 ? Math.max(100, timing.startTime) : timing.duration;
                    highlightTimerRef.current = setTimeout(() => {
                        wordIndex++;
                        if (wordIndex < words.length) {
                            highlightNextWord();
                        } else {
                            // Reset highlight when done
                            if (!window.speechSynthesis.speaking) {
                                setHighlightIndex(-1);
                            }
                        }
                    }, nextDelay);
                } else {
                    setHighlightIndex(-1);
                }
            };
            // Start highlighting after a small initial delay
            highlightTimerRef.current = setTimeout(() => {
                if (isSpeakingRef.current && !boundaryEventFiredRef.current) {
                    highlightNextWord();
                }
            }, 100);
        };


        utterance.onend = () => {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setHighlightIndex(-1);
            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = null;
            }
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setHighlightIndex(-1);
            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = null;
            }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const handleCopy = () => {
        const shareLink = generateShareLink(currentMonth, currentDay);
        const textToCopy =
            `Read and Record
Practice day ${activeData.day}, a story from ${activeData.country}

${activeData.title}

${activeData.text}

This is my practice today about ${activeData.title} from ${activeData.country}, cannot wait to improve my English with the next reading challenge.

_By Zayn_

Challenge yourself with daily reading challenge:
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

    // Handle Print - Opens print dialog with Swiss design layout
    const handlePrint = () => {
        setIsPrintModalClosing(false);
        setShowPrintModal(true);
    };

    // Execute print using the StoryPrintView component (async for API calls)
    const executePrint = async () => {
        setIsPrintGenerating(true);

        try {
            const storyPrintView = StoryPrintView({
                storyData: activeData,
                currentMonth: currentMonth,
                currentDay: currentDay,
                wikiImage: wikiImage,
                onPrintComplete: () => {
                    // Close the modal after print is triggered
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

    return (
        <div className="bg-white rounded-2xl shadow-xl border-t-4 border-[#880000] overflow-hidden">
            {/* Hero Header with Image Background */}
            <div
                className={`relative overflow-hidden ${wikiImage || isLoadingImage ? 'min-h-[200px] md:min-h-[240px] lg:min-h-[280px]' : ''}`}
            >
                {/* Background Image */}
                {(wikiImage || isLoadingImage) && (
                    <div
                        className={`absolute inset-0 ${wikiImage ? 'cursor-pointer' : ''}`}
                        onClick={() => wikiImage && setShowImageModal(true)}
                    >
                        {isLoadingImage ? (
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
                        ) : wikiImage ? (
                            <>
                                <img
                                    src={wikiImage.url}
                                    alt={wikiImage.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        setWikiImage(null);
                                    }}
                                />
                                {/* Dark gradient overlay for content readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
                            </>
                        ) : null}
                    </div>
                )}

                {/* Content Overlay - Split into TOP and BOTTOM */}
                {/* TOP: Metadata and Buttons */}
                <div className={`relative z-10 p-4 md:p-6 lg:p-8 ${wikiImage ? 'pointer-events-none' : 'bg-[#880000]/5 border-b border-slate-100'} ${wikiImage ? 'absolute top-0 left-0 right-0' : ''}`}>
                    {/* Row 1: Metadata and Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3 mb-3 md:mb-4 relative">
                        {/* Metadata */}
                        <div className={`flex items-center justify-between sm:justify-start gap-2 font-bold text-xs md:text-sm uppercase tracking-wide w-full sm:w-auto ${wikiImage ? 'text-white' : 'text-[#880000]'}`}>
                            <span className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-xs md:text-sm ${wikiImage ? 'bg-white/20 backdrop-blur-sm' : 'bg-[#880000]/10'}`}>Month {currentMonth} - Day {activeData.day}</span>
                            {activeData.country !== "TBD" && (
                                <span className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm"><Globe size={12} className="md:w-3.5 md:h-3.5" /> {activeData.country}</span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto pointer-events-auto">
                            {/* Print Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrint(); }}
                                className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg font-semibold transition-colors flex-1 sm:flex-initial ${wikiImage ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm' : 'bg-[#880000]/5 hover:bg-[#880000]/10 text-[#880000] border border-[#880000]/20'}`}
                                title="Print Story"
                            >
                                <Printer size={12} className="md:w-4 md:h-4" />
                            </button>
                            {/* Save Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                                disabled={isGenerating}
                                className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex-1 sm:flex-initial ${wikiImage ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm' : 'bg-[#880000]/5 hover:bg-[#880000]/10 text-[#880000] border border-[#880000]/20'}`}
                                title={isGenerating ? 'Saving...' : 'Save Image'}
                            >
                                <Download size={12} className="md:w-4 md:h-4" />
                            </button>
                            {/* Copy Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                                className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg font-semibold transition-colors flex-1 sm:flex-initial ${copied ? 'bg-green-500/80 text-white' : wikiImage ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm' : 'bg-[#880000]/5 hover:bg-[#880000]/10 text-[#880000] border border-[#880000]/20'}`}
                                title={copied ? 'Copied!' : 'Copy for Sharing'}
                            >
                                {copied ? <Check size={12} className="md:w-4 md:h-4" /> : <Copy size={12} className="md:w-4 md:h-4" />}
                            </button>
                            {/* Share Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsShareModalClosing(false);
                                    setIsPosterReady(false);
                                    posterCanvasRef.current = null;
                                    setShowShareModal(true);
                                }}
                                className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg font-semibold transition-colors flex-1 sm:flex-initial ${wikiImage ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm' : 'bg-[#880000]/5 hover:bg-[#880000]/10 text-[#880000] border border-[#880000]/20'}`}
                                title="Share your progress"
                            >
                                <Share2 size={12} className="md:w-4 md:h-4" />
                            </button>
                            {/* Assessment Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowAssessment(true); }}
                                className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg font-semibold transition-colors flex-1 sm:flex-initial ${wikiImage ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm' : 'bg-[#880000]/5 hover:bg-[#880000]/10 text-[#880000] border border-[#880000]/20'}`}
                                title="Take Reading Assessment"
                            >
                                <ClipboardCheck size={12} className="md:w-4 md:h-4" />
                            </button>
                            {/* Practice Button */}
                            <div className="relative flex-1 sm:flex-initial z-10">
                                <button
                                    ref={practiceButtonRef}
                                    onClick={(e) => { e.stopPropagation(); onToggleTeleprompter(); }}
                                    onMouseEnter={() => {
                                        setIsPracticeTooltipClosing(false);
                                        setShowPracticeTooltip(true);
                                    }}
                                    onMouseLeave={() => {
                                        setIsPracticeTooltipClosing(true);
                                        setTimeout(() => {
                                            setShowPracticeTooltip(false);
                                            setIsPracticeTooltipClosing(false);
                                        }, 300);
                                    }}
                                    onTouchStart={() => {
                                        setIsPracticeTooltipClosing(false);
                                        setShowPracticeTooltip(true);
                                        setTimeout(() => {
                                            setIsPracticeTooltipClosing(true);
                                            setTimeout(() => {
                                                setShowPracticeTooltip(false);
                                                setIsPracticeTooltipClosing(false);
                                            }, 300);
                                        }, 3000);
                                    }}
                                    className="relative flex items-center justify-center gap-1 md:gap-1.5 bg-[#880000] hover:bg-[#770000] text-white px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-red-900/20 text-[10px] md:text-xs lg:text-sm whitespace-nowrap w-full overflow-visible shine-effect"
                                >
                                    <Mic size={12} className="md:w-4 md:h-4" />
                                    <span>Practice</span>
                                </button>
                            </div>
                        </div>


                    </div>
                </div>

                {/* BOTTOM: Title (left) and Listen (right) */}
                <div className={`relative z-10 ${wikiImage ? 'absolute bottom-0 left-0 right-0 pointer-events-none' : ''} px-4 pt-20 pb-2 md:px-6 md:pt-20 md:pb-4 lg:px-8 lg:pt-20 lg:pb-6 ${wikiImage ? '' : 'pb-4'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        {/* Title - Bottom Left */}
                        <div>
                            <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold leading-tight ${wikiImage ? 'text-white drop-shadow-lg' : 'text-slate-800'}`}>{activeData.title}</h2>
                            {/* Wikipedia Image Attribution */}
                            {wikiImage && (
                                <span className="text-white/50 text-[10px] flex items-center gap-1 mt-1">
                                    <ImageIcon size={10} />
                                    {wikiImage.title} • Wikipedia
                                </span>
                            )}
                        </div>

                        {/* Listen UI - Bottom Right */}
                        <div className={`flex items-center gap-1 md:gap-1.5 p-1 md:p-1.5 rounded-lg shadow-sm sm:min-w-[180px] pointer-events-auto ${wikiImage ? 'bg-white/20 backdrop-blur-sm border border-white/20' : 'bg-white border border-slate-200'}`}>
                            {/* Voice Selector */}
                            {voices.length > 0 && (
                                <div className="relative flex-[3]">
                                    <select
                                        value={selectedVoice?.name || ''}
                                        onChange={(e) => {
                                            const voice = voices.find(v => v.name === e.target.value);
                                            setSelectedVoice(voice);
                                            selectedVoiceNameRef.current = voice?.name || null;
                                        }}
                                        onFocus={refreshVoices}
                                        onMouseDown={refreshVoices}
                                        className="appearance-none bg-white pl-1.5 md:pl-2.5 pr-5 md:pr-7 py-1 md:py-1.5 rounded-md font-medium text-[10px] md:text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#880000]/20 w-full transition-colors text-slate-700 hover:text-[#880000] absolute inset-0 z-10"
                                        style={{ opacity: 0.01 }}
                                    >
                                        {voices.map(v => (
                                            <option key={v.name} value={v.name} className="bg-white text-slate-700">
                                                {v.name.replace(/Microsoft |Google |English |United States/g, '').replace(/\s*\(\s*\)/g, '').replace(/\s*-\s*$/, '').trim()}
                                            </option>
                                        ))}
                                    </select>
                                    <div className={`pointer-events-none pl-1.5 md:pl-2.5 pr-5 md:pr-7 py-1 md:py-1.5 text-[10px] md:text-xs font-medium truncate overflow-hidden text-ellipsis whitespace-nowrap ${wikiImage ? 'text-white' : 'text-slate-700'}`}>
                                        {(selectedVoice?.name || selectedVoiceNameRef.current) ? (selectedVoice?.name || selectedVoiceNameRef.current).replace(/Microsoft |Google |English |United States/g, '').replace(/\s*\(\s*\)/g, '').replace(/\s*-\s*$/, '').trim() : 'Zira'}
                                    </div>
                                    <div className={`absolute right-1 md:right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none z-20 ${wikiImage ? 'text-white/60' : 'text-slate-400'}`}>
                                        <ChevronDown size={10} className="md:w-3 md:h-3" />
                                    </div>
                                </div>
                            )}

                            {/* Listen Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
                                className={`flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-md font-semibold text-[10px] md:text-xs transition-all whitespace-nowrap flex-1 ${isSpeaking ? 'bg-red-500/80 text-white animate-pulse' : wikiImage ? 'text-white hover:bg-white/20' : 'text-slate-700 hover:text-[#880000] hover:bg-slate-50'}`}
                            >
                                {isSpeaking ? <Square size={12} className="md:w-3.5 md:h-3.5" fill="currentColor" /> : <Volume2 size={12} className="md:w-3.5 md:h-3.5" />}
                                <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reading Content */}
            <div className="p-6 md:p-10">
                <div className="mb-4">
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Read Aloud</span>
                    <p className="text-lg md:text-2xl leading-relaxed text-slate-700 font-medium">
                        {displayedText.split(' ').map((word, index) => {
                            const isHighlighted = index === highlightIndex && !isTyping;
                            const cleanWord = word.toLowerCase().replace(/[.,!?;:()"'-]/g, '');
                            const isDifficult = isDifficultWord(cleanWord);
                            const isSaved = savedWords.find(w => w.word === cleanWord);
                            const isSelected = selectedWord === cleanWord;

                            return (
                                <React.Fragment key={index}>
                                    <span
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleWordClick(word, e);
                                        }}
                                        className={`transition-all duration-200 rounded px-1 cursor-pointer ${isHighlighted ? 'bg-yellow-300 text-slate-900 shadow-sm' :
                                            isSelected ? 'bg-blue-200 text-blue-900 shadow-sm' :
                                                isSaved ? 'bg-green-100 text-green-800' :
                                                    isDifficult ? 'text-[#4a1a1a] hover:text-[#5a2a2a]' :
                                                        'hover:bg-slate-100'
                                            }`}
                                        title={isSaved ? 'Saved to vocabulary - Click to view' : isDifficult ? 'Difficult word - Click for definition' : 'Click for definition'}
                                    >
                                        {word}
                                    </span>
                                    {' '}
                                </React.Fragment>
                            );
                        })}
                    </p>

                    {/* Word Definition Tooltip */}
                    {selectedWord && wordDefinition && (
                        <div
                            className={`fixed z-50 bg-white rounded-lg shadow-2xl border border-slate-200 p-4 max-w-sm ${isDefinitionClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
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
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg text-slate-800 capitalize">{wordDefinition.word}</h3>
                                        <button
                                            onClick={() => {
                                                const textToSpeak = wordDefinition.word;
                                                const utterance = new SpeechSynthesisUtterance(textToSpeak);

                                                if (selectedVoice) {
                                                    utterance.voice = selectedVoice;
                                                }

                                                utterance.rate = 0.9;
                                                utterance.pitch = 1;

                                                window.speechSynthesis.speak(utterance);
                                            }}
                                            className="p-1.5 text-slate-600 hover:text-[#880000] hover:bg-slate-50 rounded-lg transition-colors"
                                            title="Listen to pronunciation"
                                        >
                                            <Volume2 size={16} />
                                        </button>
                                    </div>
                                    {wordDefinition.phonetic && (
                                        <p className="text-sm text-slate-500 italic">{wordDefinition.phonetic}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setIsDefinitionClosing(true);
                                        setTimeout(() => {
                                            setSelectedWord(null);
                                            setWordDefinition(null);
                                            setIsDefinitionClosing(false);
                                        }, 300);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 ml-2"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {wordDefinition.meanings && wordDefinition.meanings.length > 0 && (
                                <div className="mb-3">
                                    {wordDefinition.meanings.slice(0, 2).map((meaning, idx) => (
                                        <div key={idx} className="mb-2">
                                            <span className="text-xs font-semibold text-[#880000] italic">{meaning.partOfSpeech}</span>
                                            <p className="text-sm text-slate-700 mt-1">
                                                {meaning.definitions[0]?.definition}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                {savedWords.find(w => w.word === selectedWord) ? (
                                    <button
                                        onClick={() => removeWordFromDictionary(selectedWord)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                                    >
                                        <X size={14} />
                                        Remove from Dictionary
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => saveWordToDictionary(selectedWord)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-[#880000] text-white rounded-lg text-xs font-semibold hover:bg-[#770000] transition-colors"
                                    >
                                        <BookOpen size={14} />
                                        Save to Dictionary
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Footer Navigation */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                <button
                    onClick={onPrev}
                    disabled={currentDay === 1}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#880000] disabled:opacity-30 disabled:hover:text-slate-500 font-semibold px-4 py-2"
                >
                    <ChevronLeft size={20} /> Previous
                </button>

                <div className="hidden md:block text-xs text-slate-400 font-medium text-center">
                    Review your pronunciation before moving on
                </div>

                <button
                    onClick={onNext}
                    disabled={currentDay === 30 || (isDayPracticed && !isDayPracticed(currentMonth, currentDay))}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#880000] disabled:opacity-30 disabled:hover:text-slate-500 disabled:cursor-not-allowed font-semibold px-4 py-2"
                    title={isDayPracticed && !isDayPracticed(currentMonth, currentDay) ? 'Practice this day first' : ''}
                >
                    Next <ChevronRight size={20} />
                </button>
            </div>

            {/* Share Modal with WordPoster */}
            {
                showShareModal && (
                    <>
                        {/* Backdrop */}
                        <div
                            className={`fixed inset-0 bg-black z-50 ${isShareModalClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
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

                        {/* Modal - perfectly centered within viewport */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 pointer-events-auto ${isShareModalClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                                <div className="p-6">
                                    {/* Close Button */}
                                    <div className="flex justify-end mb-2">
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
                                            className="text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    {/* Modal Content */}
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-[#880000]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Share2 size={32} className="text-[#880000]" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                                            Share Your Progress?
                                        </h2>
                                        <p className="text-slate-600">
                                            Do you want to share your learning progress with others?
                                        </p>
                                    </div>

                                    {/* Download Button */}
                                    <button
                                        onClick={async () => {
                                            if (!posterCanvasRef.current || !isPosterReady) return;

                                            setIsDownloadingPoster(true);

                                            try {
                                                // Download the poster
                                                const link = document.createElement('a');
                                                link.download = `reading-progress-m${currentMonth}-d${currentDay}.jpg`;
                                                link.href = posterCanvasRef.current.toDataURL('image/jpeg', 0.95);
                                                link.click();

                                                // Wait a moment for download to start
                                                await new Promise(resolve => setTimeout(resolve, 500));

                                                // Trigger Web Share API
                                                await shareToSocial(currentMonth, currentDay, statistics, progress, activeData);

                                                // Close modal
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
                                        className="w-full bg-[#880000] hover:bg-[#770000] text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {!isPosterReady ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Generating Poster...</span>
                                            </>
                                        ) : isDownloadingPoster ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Downloading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download size={20} />
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
                                        className="w-full mt-3 text-slate-600 hover:text-slate-800 font-semibold py-2 px-6 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Hidden WordPoster for canvas generation */}
                        <div className="fixed -top-[9999px] left-0 pointer-events-none">
                            <WordPoster
                                width={1080}
                                height={1350}
                                title={activeData.title}
                                subtitle={activeData.country}
                                meta={`Month ${currentMonth} · Day ${currentDay}`}
                                text={activeData.text}
                                statistics={statistics}
                                progress={progress}
                                month={currentMonth}
                                day={currentDay}
                                onPosterReady={(canvas) => {
                                    posterCanvasRef.current = canvas;
                                    setIsPosterReady(true);
                                }}
                            />
                        </div>
                    </>
                )
            }

            {/* Print Modal */}
            {
                showPrintModal && (
                    <>
                        {/* Backdrop */}
                        <div
                            className={`fixed inset-0 bg-black z-50 ${isPrintModalClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                            onClick={() => {
                                setIsPrintModalClosing(true);
                                setTimeout(() => {
                                    setShowPrintModal(false);
                                    setIsPrintModalClosing(false);
                                }, 300);
                            }}
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 pointer-events-auto ${isPrintModalClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                                <div className="p-6">
                                    {/* Close Button */}
                                    <div className="flex justify-end mb-2">
                                        <button
                                            onClick={() => {
                                                setIsPrintModalClosing(true);
                                                setTimeout(() => {
                                                    setShowPrintModal(false);
                                                    setIsPrintModalClosing(false);
                                                }, 300);
                                            }}
                                            className="text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    {/* Modal Content */}
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-[#880000]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Printer size={32} className="text-[#880000]" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                                            Print Story & Quiz
                                        </h2>
                                        <p className="text-slate-600">
                                            Print the story with vocabulary quiz for offline practice. Includes reading instructions and comprehension assessment.
                                        </p>
                                    </div>

                                    {/* Print Preview - 2 Pages */}
                                    <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
                                            What's Included (2 Pages)
                                        </div>
                                        <div className="flex gap-3">
                                            {/* Page 1 Preview */}
                                            <div className="flex-1 bg-white rounded p-3 shadow-sm border border-slate-100">
                                                <div className="text-[9px] text-[#880000] font-bold mb-1">PAGE 1</div>
                                                <div className="text-[10px] text-slate-400 font-semibold mb-1">
                                                    {activeData.country}
                                                </div>
                                                <div className="text-xs font-bold text-slate-800 mb-1 line-clamp-1">
                                                    {activeData.title}
                                                </div>
                                                <div className="text-[9px] text-slate-500 flex items-center gap-1">
                                                    <BookOpen size={10} /> Story + Vocabulary
                                                </div>
                                            </div>
                                            {/* Page 2 Preview */}
                                            <div className="flex-1 bg-white rounded p-3 shadow-sm border border-slate-100">
                                                <div className="text-[9px] text-[#880000] font-bold mb-1">PAGE 2</div>
                                                <div className="text-[10px] text-slate-400 font-semibold mb-1">
                                                    Assessment Quiz
                                                </div>
                                                <div className="text-[9px] text-slate-500 space-y-0.5">
                                                    <div className="flex items-center gap-1"><PenLine size={10} /> Fill in the blank</div>
                                                    <div className="flex items-center gap-1"><FileText size={10} /> Word meanings</div>
                                                    <div className="flex items-center gap-1"><BookOpen size={10} /> Comprehension</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Print Button */}
                                    <button
                                        onClick={executePrint}
                                        disabled={isPrintGenerating}
                                        className="w-full bg-[#880000] hover:bg-[#770000] text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                                    >
                                        {isPrintGenerating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Generating Quiz...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Printer size={20} />
                                                <span>Print Story & Quiz (A4)</span>
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
                                        className="w-full mt-3 text-slate-600 hover:text-slate-800 font-semibold py-2 px-6 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )
            }

            {/* Floating Practice Tooltip Menu */}
            {showPracticeTooltip && practiceButtonRef.current && (
                <div
                    className={`fixed z-[9999] bg-white rounded-lg shadow-2xl border border-slate-200 p-4 max-w-[280px] md:max-w-[320px] ${isPracticeTooltipClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
                    style={{
                        top: (() => {
                            const rect = practiceButtonRef.current.getBoundingClientRect();
                            return `${rect.bottom + 12}px`;
                        })(),
                        left: (() => {
                            const rect = practiceButtonRef.current.getBoundingClientRect();
                            const tooltipWidth = 280;
                            const leftPos = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                            return `${Math.max(16, Math.min(leftPos, window.innerWidth - tooltipWidth - 16))}px`;
                        })()
                    }}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3 className="font-bold text-base md:text-lg text-slate-800 mb-2">Practice Required</h3>
                            <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-3">
                                Practice first then you can see the next day reading challenge
                            </p>
                            <p className="text-sm md:text-base font-semibold text-[#880000]">
                                Press the button to practice
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsPracticeTooltipClosing(true);
                                setTimeout(() => {
                                    setShowPracticeTooltip(false);
                                    setIsPracticeTooltipClosing(false);
                                }, 300);
                            }}
                            className="text-slate-400 hover:text-slate-600 ml-2 flex-shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div
                        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full"
                        style={{
                            left: (() => {
                                if (!practiceButtonRef.current) return '50%';
                                const rect = practiceButtonRef.current.getBoundingClientRect();
                                const tooltipRect = { width: 280 };
                                const tooltipLeft = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                                const adjustedLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipRect.width - 16));
                                const buttonCenter = rect.left + (rect.width / 2);
                                const relativePos = buttonCenter - adjustedLeft;
                                return `${relativePos}px`;
                            })()
                        }}
                    >
                        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-transparent border-b-slate-200 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
                        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-transparent border-b-white absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-[-1px]"></div>
                    </div>
                </div>
            )}

            {/* Online Assessment Modal */}
            {
                showAssessment && (
                    <OnlineAssessment
                        storyData={activeData}
                        currentMonth={currentMonth}
                        currentDay={currentDay}
                        onClose={() => setShowAssessment(false)}
                    />
                )
            }

            {/* Wikipedia Image Modal - Swiss Design */}
            {
                showImageModal && wikiImage && (
                    <>
                        {/* Backdrop */}
                        <div
                            className={`fixed inset-0 bg-black/60 z-50 ${isImageModalClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                            onClick={() => {
                                setIsImageModalClosing(true);
                                setTimeout(() => {
                                    setShowImageModal(false);
                                    setIsImageModalClosing(false);
                                }, 300);
                            }}
                        />

                        {/* Modal Container */}
                        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none ${isImageModalClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                            <div className="relative max-w-4xl w-full pointer-events-auto">
                                {/* Content Card */}
                                <div className="bg-white rounded-none md:rounded-2xl overflow-hidden shadow-2xl">
                                    {/* Image */}
                                    <div className="relative bg-slate-100 border-b-4 border-[#880000] h-[50vh] md:h-[60vh]">
                                        <img
                                            src={wikiImage.url}
                                            alt={wikiImage.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Text Content - Swiss Grid Layout */}
                                    <div className="p-6 md:p-8 lg:p-12">
                                        <div className="max-w-2xl">
                                            {/* Title */}
                                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                                                {wikiImage.title}
                                            </h2>

                                            {/* Description */}
                                            {wikiImage.description && (
                                                <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-6">
                                                    {wikiImage.description}
                                                </p>
                                            )}

                                            {/* Attribution - Swiss Style */}
                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                                                <div className="flex items-center justify-center w-8 h-8 bg-[#880000]/10 rounded">
                                                    <ImageIcon size={14} className="text-[#880000]" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-500">
                                                    Image from Wikipedia
                                                </span>
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

export default ReadingCard;
