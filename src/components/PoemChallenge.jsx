import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PoemCard from './PoemCard';
import Dashboard from './Dashboard';
import Flashcards from './Flashcards';
import MistakeCards from './MistakeCards';
import SEO from './SEO';
import Navbar from './Navbar';
import { poemsData } from '../data/index';
import { ChevronRight, ChevronLeft, BookOpen, Globe, Square, Play, Pause, X, Type, Settings, Minus, Plus, Monitor, ExternalLink, Calendar, Download, Menu, ChevronDown, ChevronUp, Trophy, TrendingUp, Clock, MapPin, Share2, BarChart3, CreditCard, Sparkles, Heart, Check, Lock, LockOpen } from 'lucide-react';
import { getStorage, setStorage, StorageKeys } from '../utils/storage';

const MobilePoemControls = ({ closeMobileMenu, poemsData, isPoemPracticed, currentPoemId, handlePoemClick }) => {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-0.5 bg-slate-300"></div>
                <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">Select Poem</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
                {poemsData.map((p) => {
                    const isPracticed = isPoemPracticed(p.id);
                    const isLocked = p.id > 1 && !isPoemPracticed(p.id - 1);
                    return (
                        <button
                            key={p.id}
                            onClick={() => handlePoemClick(p.id, closeMobileMenu)}
                            className={`aspect-square text-xs font-bold transition-all cursor-pointer ${currentPoemId === p.id
                                ? 'bg-[#880000] text-white font-bold'
                                : isPracticed
                                    ? 'bg-green-50 text-green-600 border border-green-200'
                                    : isLocked
                                        ? 'bg-slate-50 text-slate-300'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {p.id}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const PoemChallenge = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isPageReady, setIsPageReady] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentPoemId, setCurrentPoemId] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isTeleprompterActive, setIsTeleprompterActive] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(0.15);
    const scrollSpeedRef = useRef(0.15);
    const [fontSize, setFontSize] = useState(48);
    const [countdown, setCountdown] = useState(null);
    const [isControlsExpanded, setIsControlsExpanded] = useState(false);
    const [statistics, setStatistics] = useState(null);
    const [progress, setProgress] = useState(null);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showFlashcards, setShowFlashcards] = useState(false);
    const [showMistakeCards, setShowMistakeCards] = useState(false);
    const [practicedPoems, setPracticedPoems] = useState({});
    const [triggerPracticeTooltip, setTriggerPracticeTooltip] = useState(false);
    const [isPoemSelectorOpen, setIsPoemSelectorOpen] = useState(false);
    const [isPoemSelectorClosing, setIsPoemSelectorClosing] = useState(false);
    const [isMounting, setIsMounting] = useState(false);
    const [shouldOpenQuiz, setShouldOpenQuiz] = useState(false);
    const scrollContainerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const practiceStartTimeRef = useRef(null);

    const totalPoems = poemsData.length;
    const activeData = poemsData.find(p => p.id === currentPoemId) || poemsData[0] || null;

    // Safety timeout: ensure page becomes ready after max 4 seconds
    useEffect(() => {
        if (isPageReady) return;
        const timer = setTimeout(() => setIsPageReady(true), 4000);
        return () => clearTimeout(timer);
    }, [isPageReady]);

    useEffect(() => {
        let timer;
        if (countdown !== null && countdown > 0) {
            timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        } else if (countdown === 0) {
            setCountdown(null);
            setIsScrolling(true);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    // Update ref when scrollSpeed changes
    useEffect(() => {
        scrollSpeedRef.current = scrollSpeed;
    }, [scrollSpeed]);

    useEffect(() => {
        let intervalId = null;

        if (isScrolling && isTeleprompterActive && countdown === null) {
            let accumulatedScroll = 0;

            intervalId = setInterval(() => {
                if (scrollContainerRef.current && isScrolling && isTeleprompterActive) {
                    const currentSpeed = scrollSpeedRef.current;
                    const pixelsPerFrame = currentSpeed * 2.5;

                    accumulatedScroll += pixelsPerFrame;

                    if (accumulatedScroll >= 1) {
                        const scrollAmount = Math.floor(accumulatedScroll);
                        accumulatedScroll -= scrollAmount;

                        const container = scrollContainerRef.current;
                        container.scrollTop += scrollAmount;

                        const { scrollTop, scrollHeight, clientHeight } = container;
                        if (scrollTop + clientHeight >= scrollHeight - 1) {
                            setIsScrolling(false);
                        }
                    }
                }
            }, 16);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isScrolling, isTeleprompterActive, countdown]);

    // Load statistics and progress on mount
    useEffect(() => {
        const stats = getStorage(StorageKeys.POEM_STATISTICS, {
            totalWordsRead: 0,
            totalTimePracticed: 0,
            practiceSessions: 0,
            topics: {},
            weeklyProgress: {},
            monthlyProgress: {}
        });
        setStatistics(stats);

        const prog = getStorage(StorageKeys.POEM_PROGRESS, {
            completedPoems: {},
            currentStreak: 0,
            longestStreak: 0,
            lastPracticeDate: null,
            badges: []
        });
        setProgress(prog);

        // Load practiced poems
        const practiced = getStorage(StorageKeys.POEM_PRACTICED, {});
        setPracticedPoems(practiced);

        // Handle URL params
        if (id) {
            const poemId = parseInt(id);
            if (poemId && poemId >= 1 && poemId <= totalPoems) {
                setCurrentPoemId(poemId);
            }
        }

        setIsInitialized(true);
    }, []);

    // Track teleprompter completion and update statistics
    useEffect(() => {
        if (!isTeleprompterActive && !isClosing && practiceStartTimeRef.current && activeData) {
            const practiceDuration = Math.floor((Date.now() - practiceStartTimeRef.current) / 1000);
            practiceStartTimeRef.current = null;

            const stats = getStorage(StorageKeys.POEM_STATISTICS, {
                totalWordsRead: 0,
                totalTimePracticed: 0,
                practiceSessions: 0,
                topics: {},
                weeklyProgress: {},
                monthlyProgress: {}
            });

            stats.totalTimePracticed = (stats.totalTimePracticed || 0) + practiceDuration;
            const wordCount = activeData?.text.split(' ').length || 0;
            stats.totalWordsRead = (stats.totalWordsRead || 0) + wordCount;
            stats.practiceSessions = (stats.practiceSessions || 0) + 1;

            const today = new Date();
            const weekKey = `${today.getFullYear()}-W${Math.ceil(today.getDate() / 7)}`;
            stats.weeklyProgress[weekKey] = (stats.weeklyProgress[weekKey] || 0) + practiceDuration;

            const monthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
            stats.monthlyProgress[monthKey] = (stats.monthlyProgress[monthKey] || 0) + practiceDuration;

            setStorage(StorageKeys.POEM_STATISTICS, stats);
            setStatistics(stats);

            const prog = getStorage(StorageKeys.POEM_PROGRESS, {
                completedPoems: {},
                currentStreak: 0,
                longestStreak: 0,
                lastPracticeDate: null,
                badges: []
            });

            const poemKey = `poem-${currentPoemId}`;
            const todayStr = today.toISOString().split('T')[0];

            if (!prog.completedPoems[poemKey]) {
                prog.completedPoems[poemKey] = {
                    completed: true,
                    date: todayStr,
                    practiceTime: practiceDuration
                };

                const lastDate = prog.lastPracticeDate ? new Date(prog.lastPracticeDate) : null;
                const todayDate = new Date(todayStr);

                if (!lastDate || Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) === 1) {
                    prog.currentStreak = (prog.currentStreak || 0) + 1;
                } else if (Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) > 1) {
                    prog.currentStreak = 1;
                }

                if (prog.currentStreak > prog.longestStreak) {
                    prog.longestStreak = prog.currentStreak;
                }

                prog.lastPracticeDate = todayStr;
            }

            setStorage(StorageKeys.POEM_PROGRESS, prog);
            setProgress(prog);
        }
    }, [isTeleprompterActive, isClosing, currentPoemId]);

    // Update URL when poem changes
    useEffect(() => {
        if (!isInitialized) return;

        const newPath = `/poem/${currentPoemId}`;
        if (window.location.pathname !== newPath) {
            navigate(newPath, { replace: true });
        }
    }, [currentPoemId, navigate, isInitialized]);

    const isPoemPracticed = (poemId) => {
        const poemKey = `poem-${poemId}`;
        return practicedPoems[poemKey] === true;
    };

    const handlePoemClick = (poemId, closeMobileMenu) => {
        const isLocked = poemId > 1 && !isPoemPracticed(poemId - 1);
        if (isLocked) {
            if (closeMobileMenu) {
                closeMobileMenu();
                setTimeout(() => {
                    setTriggerPracticeTooltip(true);
                    setTimeout(() => setTriggerPracticeTooltip(false), 100);
                }, 300);
            } else {
                setTriggerPracticeTooltip(true);
                setTimeout(() => setTriggerPracticeTooltip(false), 100);
            }
            return;
        }
        setCurrentPoemId(poemId);
        if (closeMobileMenu) {
            closeMobileMenu();
        }
    };

    const handleNext = () => {
        if (currentPoemId < totalPoems) {
            if (isPoemPracticed(currentPoemId)) {
                setCurrentPoemId(currentPoemId + 1);
            } else {
                setTriggerPracticeTooltip(true);
                setTimeout(() => setTriggerPracticeTooltip(false), 100);
            }
        }
    };
    const handlePrev = () => { if (currentPoemId > 1) setCurrentPoemId(currentPoemId - 1); };

    const downloadImage = async () => {
        setIsGenerating(true);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1080;
        canvas.height = 1920;

        const accentColor = '#880000';
        const contentPadding = 60;
        const contentWidth = canvas.width - contentPadding * 2;
        const footerHeight = 100;

        const wrapText = (context, text, maxWidth, fontSize, fontWeight = 'normal') => {
            context.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
            const words = text.split(' ');
            const lines = [];
            let line = '';
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = context.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    lines.push(line.trim());
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            if (line.trim()) lines.push(line.trim());
            return lines;
        };

        // Split poem into stanzas
        const stanzas = activeData.text.split(/\n\n+/).filter(s => s.trim());

        const practiceNote = `This is my practice today, reciting "${activeData.title}" by ${activeData.author}. Cannot wait to improve my English with the next poem.`;

        let textFontSize = 32;
        const minFontSize = 20;
        let imageHeight = 400;
        const minImageHeight = 250;

        const calculateContentHeight = (fontSize) => {
            const lineHeight = fontSize * 1.75;
            let totalHeight = 80;

            stanzas.forEach((stanza) => {
                const stanzaLines = stanza.split('\n');
                stanzaLines.forEach((line) => {
                    const wrappedLines = wrapText(ctx, line, contentWidth - 60, fontSize);
                    totalHeight += wrappedLines.length * lineHeight;
                });
                totalHeight += 30; // gap between stanzas
            });

            const noteLines = wrapText(ctx, practiceNote, contentWidth - 60, fontSize);
            totalHeight += noteLines.length * lineHeight + 35;

            return totalHeight;
        };

        let availableForContent = canvas.height - imageHeight - footerHeight;
        let neededHeight = calculateContentHeight(textFontSize);

        while (neededHeight > availableForContent && textFontSize > minFontSize) {
            textFontSize -= 2;
            neededHeight = calculateContentHeight(textFontSize);
        }

        while (neededHeight > availableForContent && imageHeight > minImageHeight) {
            imageHeight -= 30;
            availableForContent = canvas.height - imageHeight - footerHeight;
        }

        while (neededHeight > availableForContent && textFontSize > minFontSize) {
            textFontSize -= 1;
            neededHeight = calculateContentHeight(textFontSize);
        }

        const textLineHeight = textFontSize * 1.75;

        const drawPoster = (img = null) => {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (img) {
                const imgAspect = img.width / img.height;
                const heroAspect = canvas.width / imageHeight;
                let drawWidth, drawHeight, drawX, drawY;

                if (imgAspect > heroAspect) {
                    drawHeight = imageHeight;
                    drawWidth = imageHeight * imgAspect;
                    drawX = (canvas.width - drawWidth) / 2;
                    drawY = 0;
                } else {
                    drawWidth = canvas.width;
                    drawHeight = canvas.width / imgAspect;
                    drawX = 0;
                    drawY = (imageHeight - drawHeight) / 2;
                }

                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, canvas.width, imageHeight);
                ctx.clip();
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                ctx.restore();

                const gradient = ctx.createLinearGradient(0, 0, 0, imageHeight);
                gradient.addColorStop(0, 'rgba(0,0,0,0.3)');
                gradient.addColorStop(0.5, 'rgba(0,0,0,0.4)');
                gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, imageHeight);
            } else {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, canvas.width, imageHeight);
            }

            const topPadding = 50;
            const sidePadding = 60;

            // Poem badge
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            const badgeText = `Poem ${currentPoemId}`;
            ctx.font = 'bold 28px Arial, sans-serif';
            const badgeWidth = ctx.measureText(badgeText).width + 40;
            ctx.fillRect(sidePadding, topPadding, badgeWidth, 50);
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.fillText(badgeText, sidePadding + 20, topPadding + 35);

            // Author
            if (activeData.author) {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = 'bold 24px Arial, sans-serif';
                ctx.fillText(`✦ ${activeData.author.toUpperCase()}`, sidePadding + badgeWidth + 25, topPadding + 35);
            }

            // Title
            ctx.textAlign = 'left';
            const titleBottomPadding = 60;
            const titleMaxWidth = canvas.width - sidePadding * 2;

            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(sidePadding, imageHeight - titleBottomPadding - 130, 60, 4);

            ctx.fillStyle = '#FFFFFF';
            const titleLines = wrapText(ctx, activeData.title, titleMaxWidth, 56, 'bold');
            const titleLineHeight = 68;
            let titleY = imageHeight - titleBottomPadding - (titleLines.length - 1) * titleLineHeight;

            ctx.font = 'bold 56px Arial, sans-serif';
            titleLines.forEach((line, i) => {
                ctx.fillText(line, sidePadding, titleY + i * titleLineHeight);
            });

            // Red accent bar
            ctx.fillStyle = accentColor;
            ctx.fillRect(0, 0, 8, canvas.height);

            // Content section
            let yPos = imageHeight + 50;

            ctx.fillStyle = accentColor;
            ctx.fillRect(contentPadding, yPos, 60, 4);
            ctx.fillStyle = '#999999';
            ctx.font = 'bold 20px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('READ ALOUD', contentPadding + 80, yPos + 3);

            yPos += 55;

            // Draw each stanza
            stanzas.forEach((stanza, stanzaIndex) => {
                ctx.fillStyle = '#DDDDDD';
                ctx.font = 'bold 18px Arial, sans-serif';
                ctx.fillText(String(stanzaIndex + 1).padStart(2, '0'), contentPadding, yPos + textFontSize * 0.3);

                const stanzaLines = stanza.split('\n');
                let stanzaStartY = yPos;

                ctx.fillStyle = '#444444';
                ctx.font = `${textFontSize}px Arial, sans-serif`;

                stanzaLines.forEach((line) => {
                    const wrappedLines = wrapText(ctx, line, contentWidth - 60, textFontSize);
                    wrappedLines.forEach((wLine) => {
                        ctx.fillText(wLine, contentPadding + 55, yPos);
                        yPos += textLineHeight;
                    });
                });

                // Left border for stanza
                const stanzaHeight = yPos - stanzaStartY;
                ctx.fillStyle = '#F0F0F0';
                ctx.fillRect(contentPadding + 40, stanzaStartY - 10, 2, stanzaHeight + 10);

                yPos += 25;
            });

            // Practice note
            ctx.fillStyle = '#DDDDDD';
            ctx.font = 'bold 18px Arial, sans-serif';
            ctx.fillText('✦', contentPadding + 5, yPos + textFontSize * 0.3);

            ctx.fillStyle = '#444444';
            ctx.font = `${textFontSize}px Arial, sans-serif`;
            const noteLines = wrapText(ctx, practiceNote, contentWidth - 60, textFontSize);

            const noteHeight = noteLines.length * textLineHeight;
            ctx.fillStyle = '#F0F0F0';
            ctx.fillRect(contentPadding + 40, yPos - 10, 2, noteHeight + 10);

            ctx.fillStyle = '#444444';
            noteLines.forEach((line, i) => {
                ctx.fillText(line, contentPadding + 55, yPos + i * textLineHeight);
            });

            yPos += noteLines.length * textLineHeight + 35;

            // Footer
            const footerY = canvas.height - 140 + 40;

            ctx.fillStyle = '#E0E0E0';
            ctx.fillRect(contentPadding, canvas.height - 140, canvas.width - contentPadding * 2, 1);

            ctx.textAlign = 'right';

            const line1Y = footerY + 10;
            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.fillStyle = '#111111';
            const domainText = 'myenglish.my.id';
            ctx.fillText(domainText, canvas.width - contentPadding, line1Y);

            const domainWidth = ctx.measureText(domainText).width;
            ctx.font = 'bold 14px Arial, sans-serif';
            ctx.fillStyle = '#999999';
            ctx.fillText('PRACTICE AT  ', canvas.width - contentPadding - domainWidth, line1Y);

            const line2Y = footerY + 45;
            ctx.font = 'normal 20px Arial, sans-serif';
            ctx.fillStyle = '#777777';
            ctx.fillText('Mr. Zayn', canvas.width - contentPadding, line2Y);

            const logo = new Image();
            logo.onload = () => {
                const logoHeight = 60;
                const logoWidth = (logo.width / logo.height) * logoHeight;
                ctx.drawImage(logo, contentPadding, footerY - 10, logoWidth, logoHeight);

                const link = document.createElement('a');
                link.download = `Poem-${currentPoemId}-${activeData.title.replace(/\s+/g, '-')}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.92);
                link.click();
                setIsGenerating(false);
            };
            logo.onerror = () => {
                const link = document.createElement('a');
                link.download = `Poem-${currentPoemId}-${activeData.title.replace(/\s+/g, '-')}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.92);
                link.click();
                setIsGenerating(false);
            };
            logo.src = '/logo-horizontal.svg';
        };

        if (activeData.localImage) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => drawPoster(img);
            img.onerror = () => drawPoster(null);
            img.src = activeData.localImage;
        } else {
            drawPoster(null);
        }
    };


    const toggleTeleprompter = () => {
        if (isTeleprompterActive) {
            setIsClosing(true);
            setIsScrolling(false);
            setCountdown(null);
        } else {
            // Mark this poem as practiced
            const poemKey = `poem-${currentPoemId}`;
            const practiced = getStorage(StorageKeys.POEM_PRACTICED, {});
            if (!practiced[poemKey]) {
                practiced[poemKey] = true;
                setStorage(StorageKeys.POEM_PRACTICED, practiced);
                setPracticedPoems(practiced);
            }

            practiceStartTimeRef.current = Date.now();
            setIsTeleprompterActive(true);
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const contentElement = container.querySelector('div > h2');
                    if (contentElement) {
                        const containerHeight = container.clientHeight;
                        const titleTop = contentElement.offsetTop;
                        const titleHeight = contentElement.offsetHeight;
                        container.scrollTop = titleTop - (containerHeight / 2) + (titleHeight / 2);
                    }
                }
            }, 150);
        }
    };

    const handleAnimationEnd = () => {
        if (isClosing) {
            setIsTeleprompterActive(false);
            setIsClosing(false);
        }
    };

    const handlePlayPause = () => {
        if (isScrolling) {
            setIsScrolling(false);
        } else {
            setCountdown(3);
        }
    };

    return (
        <>
            {/* Dynamic SEO for each poem page */}
            {activeData && (
                <SEO
                    title={`${activeData.title} by ${activeData.author} | English Fluency Journey`}
                    description={`Read "${activeData.title}" by ${activeData.author}. ${activeData.text.substring(0, 150)}... Practice English reading with our poetry collection.`}
                    keywords={`English reading, poetry, ${activeData.title}, ${activeData.author}, learn English, ESL practice, poem ${currentPoemId}`}
                    ogImage={'https://myenglish.my.id/og-image.jpg'}
                    url={`https://myenglish.my.id/poem/${currentPoemId}`}
                    type="article"
                />
            )}

            {isTeleprompterActive && (
                <div
                    className={`fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col ${isClosing ? 'animate-slideDown' : 'animate-slideUp'}`}
                    onAnimationEnd={handleAnimationEnd}
                >
                    {/* Countdown Overlay */}
                    {countdown !== null && (
                        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md">
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                    backgroundSize: '40px 40px'
                                }}></div>
                            </div>

                            <div className="relative">
                                <div className="text-[14rem] md:text-[18rem] font-bold text-[#880000] leading-none tracking-tighter animate-pulse">
                                    {countdown}
                                </div>
                                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-white/20"></div>
                            </div>

                            <div className="mt-12 text-[10px] md:text-xs text-white/40 uppercase tracking-[0.3em]">
                                Starting in
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="border-b border-white/10">
                        <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#880000] flex items-center justify-center">
                                    <Monitor size={16} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white">Practice Mode</span>
                                    <span className="text-[9px] text-white/40 uppercase tracking-wider hidden md:block">Read aloud with teleprompter</span>
                                </div>
                            </div>

                            <div className="hidden md:flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 ${isScrolling ? 'bg-[#880000] animate-pulse' : 'bg-white/30'}`}></div>
                                    <span className="text-[10px] text-white/50 uppercase tracking-wider">
                                        {isScrolling ? 'Scrolling' : 'Paused'}
                                    </span>
                                </div>
                                <div className="text-[10px] text-white/30">|</div>
                                <span className="text-[10px] text-white/50 uppercase tracking-wider">
                                    {scrollSpeed.toFixed(1)}x Speed
                                </span>
                                <div className="text-[10px] text-white/30">|</div>
                                <span className="text-[10px] text-white/50 uppercase tracking-wider">
                                    {fontSize}px
                                </span>
                            </div>

                            <div className="flex items-center">
                                <button
                                    onClick={() => setIsControlsExpanded(!isControlsExpanded)}
                                    className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center transition-all ${isControlsExpanded ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                    title={isControlsExpanded ? 'Hide Controls' : 'Show Controls'}
                                >
                                    <Settings size={18} className={`transition-transform duration-300 ${isControlsExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                <button
                                    onClick={toggleTeleprompter}
                                    className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-white/40 hover:text-white hover:bg-[#880000] transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Controls Panel */}
                        <div className={`overflow-hidden transition-all duration-300 ease-out ${isControlsExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="px-4 md:px-6 pb-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/10">
                                    {/* Speed Control */}
                                    <div className="p-4 md:border-r border-white/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-0.5 bg-[#880000]"></div>
                                                <span className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Scroll Speed</span>
                                            </div>
                                            <span className="text-sm font-bold text-white bg-white/10 px-2 py-0.5">{scrollSpeed.toFixed(1)}x</span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-0 border border-white/10 mb-4">
                                            {[
                                                { value: 0.1, label: '0.1x' },
                                                { value: 0.15, label: '0.15x' },
                                                { value: 0.25, label: '0.25x' },
                                                { value: 0.5, label: '0.5x' }
                                            ].map((preset, i) => (
                                                <button
                                                    key={preset.value}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setScrollSpeed(preset.value);
                                                        scrollSpeedRef.current = preset.value;
                                                    }}
                                                    className={`py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${Math.abs(scrollSpeed - preset.value) < 0.05
                                                        ? 'bg-[#880000] text-white'
                                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                                        } ${i < 3 ? 'border-r border-white/10' : ''}`}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1"
                                                step="0.05"
                                                value={scrollSpeed}
                                                onChange={(e) => {
                                                    const newSpeed = parseFloat(e.target.value);
                                                    setScrollSpeed(newSpeed);
                                                    scrollSpeedRef.current = newSpeed;
                                                }}
                                                className="w-full h-1 bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#880000] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-[#880000] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                                            />
                                            <div className="flex justify-between mt-2 text-[9px] text-white/30 uppercase tracking-wider">
                                                <span>Slow</span>
                                                <span>Fast</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Font Size Control */}
                                    <div className="p-4 border-t md:border-t-0 border-white/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-0.5 bg-white/30"></div>
                                                <span className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Text Size</span>
                                            </div>
                                            <span className="text-sm font-bold text-white bg-white/10 px-2 py-0.5">{fontSize}px</span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-0 border border-white/10 mb-4">
                                            {[
                                                { value: 24, label: 'S' },
                                                { value: 36, label: 'M' },
                                                { value: 48, label: 'L' },
                                                { value: 72, label: 'XL' }
                                            ].map((preset, i) => (
                                                <button
                                                    key={preset.value}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setFontSize(preset.value);
                                                    }}
                                                    className={`py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${fontSize === preset.value
                                                        ? 'bg-white text-slate-900'
                                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                                        } ${i < 3 ? 'border-r border-white/10' : ''}`}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="16"
                                                max="96"
                                                step="4"
                                                value={fontSize}
                                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                                            />
                                            <div className="flex justify-between mt-2 text-[9px] text-white/30 uppercase tracking-wider">
                                                <span>Small</span>
                                                <span>Large</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reading Area - Teleprompter */}
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto relative no-scrollbar"
                        style={{ paddingBottom: '50vh', paddingTop: '50vh', scrollBehavior: 'auto' }}
                    >
                        {/* Center Guide Line */}
                        <div className="fixed left-0 right-0 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                            <div className="flex items-center justify-center gap-4 opacity-20">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/50"></div>
                                <div className="w-3 h-3 border-2 border-[#880000] transform rotate-45"></div>
                                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/50"></div>
                            </div>
                        </div>

                        {/* Content */}
                        <div
                            className="max-w-4xl mx-auto px-6 md:px-10 text-center transition-all duration-300"
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {/* Title */}
                            <div className="mb-16 md:mb-20">
                                <div className="w-12 h-0.5 bg-[#880000] mx-auto mb-6"></div>
                                <h2
                                    className="text-[#880000] uppercase tracking-[0.25em] font-bold leading-tight"
                                    style={{ fontSize: `${Math.max(fontSize * 0.5, 14)}px` }}
                                >
                                    {activeData.title}
                                </h2>
                                <div className="flex items-center justify-center gap-3 mt-4">
                                    <span
                                        className="text-white/30 uppercase tracking-[0.15em]"
                                        style={{ fontSize: `${Math.max(fontSize * 0.25, 10)}px` }}
                                    >
                                        by {activeData.author} · Poem {currentPoemId}
                                    </span>
                                </div>
                            </div>

                            {/* Main Text - Preserve poem line breaks */}
                            <div className="font-normal leading-[1.7] text-white/90 tracking-wide text-left">
                                {activeData.text.split(/\n\n+/).map((stanza, i) => (
                                    <div key={i} className={i > 0 ? 'mt-8' : ''}>
                                        {stanza.split('\n').map((line, j) => (
                                            <p key={j} className="text-center">{line}</p>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* End Marker */}
                            <div className="mt-20 md:mt-24">
                                <div className="w-8 h-0.5 bg-white/20 mx-auto"></div>
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-4">End of poem</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
                        <div className="flex flex-col items-center pb-8 md:pb-10">
                            <button
                                onClick={handlePlayPause}
                                disabled={countdown !== null}
                                className={`pointer-events-auto w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isScrolling
                                    ? 'bg-white text-slate-900 hover:bg-white/90'
                                    : 'bg-[#880000] text-white hover:bg-[#aa0000]'
                                    }`}
                            >
                                {isScrolling ? (
                                    <Pause size={28} className="md:w-8 md:h-8" fill="currentColor" />
                                ) : (
                                    <Play size={28} className="md:w-8 md:h-8 ml-1" fill="currentColor" />
                                )}
                            </button>

                            <div className="mt-4 text-[9px] text-white/40 uppercase tracking-[0.2em]">
                                {isScrolling ? 'Tap to pause' : 'Tap to start'}
                            </div>
                        </div>
                    </div>

                    {/* Side Indicators */}
                    <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="w-1 h-32 bg-gradient-to-b from-transparent via-[#880000]/50 to-transparent"></div>
                    </div>
                    <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="w-1 h-32 bg-gradient-to-b from-transparent via-[#880000]/50 to-transparent"></div>
                    </div>
                </div>
            )}

            {/* Page Loading Overlay */}
            {!isPageReady && (
                <div className="fixed inset-0 z-[9998] bg-stone-50 flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 bg-[#880000] flex items-center justify-center">
                            <span className="text-white font-bold text-lg">E</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-[#880000] animate-pulse"></div>
                            <div className="w-2 h-2 bg-[#880000]/60 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-[#880000]/30 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`h-screen w-screen bg-stone-50 text-slate-800 font-sans selection:bg-[#880000]/20 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${isPageReady ? 'opacity-100' : 'opacity-0'}`}>
                {/* Reusable Navbar - Swiss Design */}
                <Navbar
                    activeSection="poems"
                    setShowDashboard={setShowDashboard}
                    setShowFlashcards={setShowFlashcards}
                    setShowMistakeCards={setShowMistakeCards}
                >
                    <MobilePoemControls
                        poemsData={poemsData}
                        isPoemPracticed={isPoemPracticed}
                        currentPoemId={currentPoemId}
                        handlePoemClick={handlePoemClick}
                    />
                </Navbar>

                {/* Main Content Layout with Responsive Left Sidebar */}
                <div className="w-full flex-1 flex flex-col items-center pt-16 md:pt-20 pb-4 px-4 md:px-6 lg:px-8 min-h-0 overflow-hidden">
                    <div className="w-full max-w-6xl flex-1 flex gap-6 min-h-0 max-h-full">
                        
                        {/* Left Sidebar - Poem List (Desktop) - Swiss Design Layout */}
                        <aside className="hidden lg:flex flex-col w-64 bg-white border-l-4 border-[#880000] border-y border-r border-slate-200/60 flex-shrink-0 min-h-0 max-h-full">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5 bg-[#880000]"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Poem List</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{totalPoems} Collection</span>
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                {poemsData.map((p) => {
                                    const isPracticed = isPoemPracticed(p.id);
                                    const isLocked = p.id > 1 && !isPoemPracticed(p.id - 1);
                                    const isSelected = currentPoemId === p.id;

                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => handlePoemClick(p.id)}
                                            className={`w-full text-left p-4 border-b border-slate-100 transition-all flex items-center justify-between group cursor-pointer ${
                                                isSelected
                                                    ? 'bg-[#880000] text-white font-bold'
                                                    : isPracticed
                                                        ? 'bg-green-50/40 text-green-700 hover:bg-green-50'
                                                        : isLocked
                                                            ? 'bg-slate-50/50 text-slate-300'
                                                            : 'bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex flex-col min-w-0 pr-2">
                                                <span className={`text-[9px] uppercase tracking-wider font-bold ${isSelected ? 'text-white/70' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                                    Poem {p.id}
                                                </span>
                                                <span className="text-xs font-semibold truncate mt-0.5">
                                                    {p.title}
                                                </span>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {isPracticed ? (
                                                    <Check size={14} className={isSelected ? 'text-white' : 'text-green-600'} />
                                                ) : isLocked ? (
                                                    <Lock size={12} className="text-slate-300" />
                                                ) : (
                                                    <Play size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </aside>

                        {/* Main Reading Card Area */}
                        <div className="flex-1 flex flex-col min-h-0 h-full">
                            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                                <PoemCard
                                    activeData={activeData}
                                    currentPoemId={currentPoemId}
                                    totalPoems={totalPoems}
                                    isGenerating={isGenerating}
                                    onDownload={downloadImage}
                                    onToggleTeleprompter={toggleTeleprompter}
                                    onPrev={handlePrev}
                                    onNext={handleNext}
                                    isPoemPracticed={isPoemPracticed}
                                    practicedPoems={practicedPoems}
                                    statistics={statistics}
                                    progress={progress}
                                    triggerPracticeTooltip={triggerPracticeTooltip}
                                    preloadedImages={{}}
                                    shouldOpenQuiz={shouldOpenQuiz}
                                    onQuizOpened={() => setShouldOpenQuiz(false)}
                                    onOpenPoemSelector={() => {
                                        setIsMounting(true);
                                        setIsPoemSelectorOpen(true);
                                        requestAnimationFrame(() => {
                                            requestAnimationFrame(() => {
                                                setIsMounting(false);
                                            });
                                        });
                                    }}
                                    onReady={() => !isPageReady && setIsPageReady(true)}
                                />
                                {/* Attribution */}
                                <div className="mt-6 md:mt-8 pb-4">
                                    <div className="max-w-xl mx-auto px-4">
                                        <div className="border-l-2 border-slate-200 pl-4">
                                            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                                                "This is my practice today, reciting <span className="text-slate-600 font-medium">"{activeData.title}"</span> by <span className="text-slate-600 font-medium">{activeData.author}</span>. Cannot wait to improve my English with the next poem."
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 pl-4">
                                            <div className="w-4 h-0.5 bg-[#880000]"></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">By Zayn</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Modal */}
                {showDashboard && (
                    <Dashboard
                        statistics={statistics}
                        progress={progress}
                        currentMonth={1}
                        allMonthsData={{ 1: poemsData }}
                        onClose={() => setShowDashboard(false)}
                    />
                )}

                {/* Flashcards Modal */}
                {showFlashcards && (
                    <Flashcards onClose={() => setShowFlashcards(false)} />
                )}

                {/* Review Cards Modal */}
                {showMistakeCards && (
                    <MistakeCards onClose={() => setShowMistakeCards(false)} />
                )}

                {/* Poem Selector */}
                {(isPoemSelectorOpen || isPoemSelectorClosing) && (
                    <>
                        <div
                            className={`fixed inset-0 bg-black/40 z-40 ${isPoemSelectorClosing ? 'opacity-0' : 'opacity-100'}`}
                            style={{ transition: 'opacity 0.3s ease-out' }}
                            onClick={() => { setIsPoemSelectorClosing(true); setTimeout(() => { setIsPoemSelectorOpen(false); setIsPoemSelectorClosing(false); }, 300); }}
                        />

                        <div
                            className={`fixed z-50 bg-white shadow-2xl overflow-hidden border-l-4 border-[#880000] ${isPoemSelectorClosing ? 'opacity-0 -translate-y-4' : isMounting ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'
                                } left-2 right-2 sm:left-4 sm:right-4 md:left-1/2 md:right-auto md:w-[400px] md:-translate-x-1/2`}
                            style={{
                                top: '64px',
                                transition: 'opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1), transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
                            }}
                        >
                            <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-0.5 bg-[#880000]"></div>
                                    <span className="text-xs md:text-[10px] text-slate-400 uppercase tracking-[0.15em] md:tracking-[0.2em]">Select Poem</span>
                                </div>
                                <button
                                    onClick={() => { setIsPoemSelectorClosing(true); setTimeout(() => { setIsPoemSelectorOpen(false); setIsPoemSelectorClosing(false); }, 300); }}
                                    className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={18} className="md:w-4 md:h-4" />
                                </button>
                            </div>

                            <div className="p-3 sm:p-4">
                                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                                    {poemsData.map((p) => {
                                        const isPracticed = isPoemPracticed(p.id);
                                        const isLocked = p.id > 1 && !isPoemPracticed(p.id - 1);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    if (isLocked) {
                                                        setIsPoemSelectorClosing(true);
                                                        setTimeout(() => {
                                                            setIsPoemSelectorOpen(false);
                                                            setIsPoemSelectorClosing(false);
                                                            setTriggerPracticeTooltip(true);
                                                            setTimeout(() => setTriggerPracticeTooltip(false), 100);
                                                        }, 300);
                                                    } else {
                                                        handlePoemClick(p.id);
                                                        setIsPoemSelectorClosing(true);
                                                        setTimeout(() => { setIsPoemSelectorOpen(false); setIsPoemSelectorClosing(false); }, 300);
                                                    }
                                                }}
                                                className={`aspect-square text-sm font-bold transition-all cursor-pointer ${currentPoemId === p.id
                                                    ? 'bg-[#880000] text-white'
                                                    : isPracticed
                                                        ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                                                        : isLocked
                                                            ? 'bg-slate-50 text-slate-200'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                                                    }`}
                                            >
                                                {p.id}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="px-4 pb-4 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-center gap-4 md:gap-6 text-[10px] md:text-[9px] text-slate-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen size={12} className="text-[#880000]" />
                                        <span>Current</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Check size={12} className="text-green-600" />
                                        <span>Done</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Play size={12} className="text-slate-400" />
                                        <span>Open</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Lock size={12} className="text-slate-300" />
                                        <span>Locked</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

            </div>


        </>
    );
};

export default PoemChallenge;
