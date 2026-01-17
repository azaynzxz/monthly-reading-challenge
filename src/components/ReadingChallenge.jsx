import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReadingCard from './ReadingCard';
import Dashboard from './Dashboard';
import Flashcards from './Flashcards';
import MistakeCards from './MistakeCards';
import SEO from './SEO';
import month1Data from '../data/month1.json';
import month2Data from '../data/month2.json';
import month3Data from '../data/month3.json';
import { ChevronRight, ChevronLeft, BookOpen, Globe, Square, Play, Pause, X, Type, Settings, Minus, Plus, Monitor, ExternalLink, Calendar, Download, Menu, ChevronDown, ChevronUp, Trophy, TrendingUp, Clock, MapPin, Share2, BarChart3, RotateCw, Sparkles, Heart } from 'lucide-react';
import { getStorage, setStorage, StorageKeys } from '../utils/storage';

const ReadingChallenge = () => {
    const navigate = useNavigate();
    const [isPageReady, setIsPageReady] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(1);
    const [currentDay, setCurrentDay] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false);
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
    const [practicedDays, setPracticedDays] = useState({});
    const [triggerPracticeTooltip, setTriggerPracticeTooltip] = useState(false);
    const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
    const [isMonthSelectorClosing, setIsMonthSelectorClosing] = useState(false);
    const [isMounting, setIsMounting] = useState(false);
    const scrollContainerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const practiceStartTimeRef = useRef(null);
    const imagePreloadCache = useRef({});
    const preloadingRef = useRef(false);

    // Preload local images for all days in current month (background task)
    // NO Wikipedia API - all data comes from local JSON files
    useEffect(() => {
        const preloadImages = async () => {
            if (preloadingRef.current) return;
            preloadingRef.current = true;

            const monthData = allMonthsData[currentMonth];
            if (!monthData) return;

            // Preload in batches
            const batchSize = 5;

            for (let i = 0; i < monthData.length; i += batchSize) {
                const batch = monthData.slice(i, i + batchSize);

                await Promise.allSettled(
                    batch.map(async (dayData) => {
                        const cacheKey = `${currentMonth}-${dayData.day}`;

                        // Skip if already cached or no local image
                        if (imagePreloadCache.current[cacheKey] || !dayData.localImage) return;

                        // Preload local image only
                        await new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => {
                                imagePreloadCache.current[cacheKey] = {
                                    url: dayData.localImage,
                                    title: dayData.imageTitle || dayData.wikiSearch || dayData.title,
                                    description: dayData.imageDescription || '',
                                    searchTerm: dayData.wikiSearch || dayData.title,
                                    isLocal: true
                                };
                                resolve();
                            };
                            img.onerror = resolve;
                            img.src = dayData.localImage;
                        });
                    })
                );

                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            preloadingRef.current = false;
        };

        // Start preloading after a short delay to not block initial render
        const timer = setTimeout(preloadImages, 500);
        return () => clearTimeout(timer);
    }, [currentMonth]);

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
            // Use interval-based scrolling for reliable speed control
            // Accumulate sub-pixel amounts to handle very slow speeds
            let accumulatedScroll = 0;

            intervalId = setInterval(() => {
                if (scrollContainerRef.current && isScrolling && isTeleprompterActive) {
                    const currentSpeed = scrollSpeedRef.current;

                    // Speed mapping (pixels per second):
                    // 0.1 = ~15px/sec (ultra slow - for careful reading)
                    // 0.15 = ~22px/sec (very slow - default)
                    // 0.25 = ~38px/sec (slow)
                    // 0.5 = ~75px/sec (moderate)
                    // 1.0 = ~150px/sec (fast)
                    // Multiply by 2.5 to get reasonable speeds, then by interval (16ms/1000)
                    const pixelsPerFrame = currentSpeed * 2.5;

                    // Accumulate fractional pixels
                    accumulatedScroll += pixelsPerFrame;

                    // Only scroll when we have at least 1 pixel
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
            }, 16); // ~60fps
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isScrolling, isTeleprompterActive, countdown]);

    const allMonthsData = { 1: month1Data, 2: month2Data, 3: month3Data };
    const activeData = allMonthsData[currentMonth]?.find(d => d.day === currentDay) || null;

    // Load statistics and progress on mount
    useEffect(() => {
        const stats = getStorage(StorageKeys.STATISTICS, {
            totalWordsRead: 0,
            totalTimePracticed: 0,
            practiceSessions: 0,
            countries: {},
            topics: {},
            weeklyProgress: {},
            monthlyProgress: {}
        });
        setStatistics(stats);

        const prog = getStorage(StorageKeys.PROGRESS, {
            completedDays: {},
            currentStreak: 0,
            longestStreak: 0,
            lastPracticeDate: null,
            badges: [],
            monthProgress: {}
        });
        setProgress(prog);

        // Load practiced days (days where Practice button was clicked)
        const practiced = getStorage(StorageKeys.PRACTICED_DAYS, {});
        setPracticedDays(practiced);

        // Handle URL pathname (format: /m1-day1)
        const pathname = window.location.pathname;
        const pathMatch = pathname.match(/^\/m(\d+)-day(\d+)$/);

        if (pathMatch) {
            const monthParam = parseInt(pathMatch[1]);
            const dayParam = parseInt(pathMatch[2]);
            if (monthParam && monthParam >= 1 && monthParam <= 3) setCurrentMonth(monthParam);
            if (dayParam && dayParam >= 1 && dayParam <= 30) setCurrentDay(dayParam);
        } else {
            // Fallback: Check for old query parameter format for backward compatibility
            const urlParams = new URLSearchParams(window.location.search);
            const monthParam = urlParams.get('month');
            const dayParam = urlParams.get('day');
            if (monthParam) setCurrentMonth(parseInt(monthParam));
            if (dayParam) setCurrentDay(parseInt(dayParam));
        }

        // Mark as initialized after reading from URL
        setIsInitialized(true);
    }, []);


    // Track teleprompter completion and update statistics
    useEffect(() => {
        if (!isTeleprompterActive && !isClosing && practiceStartTimeRef.current && activeData && allMonthsData[currentMonth]) {
            const practiceDuration = Math.floor((Date.now() - practiceStartTimeRef.current) / 1000);
            practiceStartTimeRef.current = null;

            const stats = getStorage(StorageKeys.STATISTICS, {
                totalWordsRead: 0,
                totalTimePracticed: 0,
                practiceSessions: 0,
                countries: {},
                topics: {},
                weeklyProgress: {},
                monthlyProgress: {}
            });

            stats.totalTimePracticed = (stats.totalTimePracticed || 0) + practiceDuration;
            const wordCount = activeData?.text.split(' ').length || 0;
            stats.totalWordsRead = (stats.totalWordsRead || 0) + wordCount;
            stats.practiceSessions = (stats.practiceSessions || 0) + 1;

            const country = activeData?.country || 'Unknown';
            stats.countries[country] = (stats.countries[country] || 0) + 1;

            const today = new Date();
            const weekKey = `${today.getFullYear()}-W${Math.ceil(today.getDate() / 7)}`;
            stats.weeklyProgress[weekKey] = (stats.weeklyProgress[weekKey] || 0) + practiceDuration;

            const monthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
            stats.monthlyProgress[monthKey] = (stats.monthlyProgress[monthKey] || 0) + practiceDuration;

            setStorage(StorageKeys.STATISTICS, stats);
            setStatistics(stats);

            const prog = getStorage(StorageKeys.PROGRESS, {
                completedDays: {},
                currentStreak: 0,
                longestStreak: 0,
                lastPracticeDate: null,
                badges: [],
                monthProgress: {}
            });

            const dayKey = `${currentMonth}-${currentDay}`;
            const todayStr = today.toISOString().split('T')[0];

            if (!prog.completedDays[dayKey]) {
                prog.completedDays[dayKey] = {
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

                if (prog.currentStreak === 7 && !prog.badges.includes('7-day-streak')) {
                    prog.badges.push('7-day-streak');
                }
                if (prog.currentStreak === 30 && !prog.badges.includes('30-day-streak')) {
                    prog.badges.push('30-day-streak');
                }

                prog.lastPracticeDate = todayStr;
            }

            const monthProgressKey = `month-${currentMonth}`;
            if (!prog.monthProgress[monthProgressKey]) {
                prog.monthProgress[monthProgressKey] = { completed: [] };
            }
            if (!prog.monthProgress[monthProgressKey].completed.includes(currentDay)) {
                prog.monthProgress[monthProgressKey].completed.push(currentDay);
            }

            setStorage(StorageKeys.PROGRESS, prog);
            setProgress(prog);
        }
    }, [isTeleprompterActive, isClosing, currentMonth, currentDay]);

    // Update URL when month or day changes (format: /m1-day1)
    // Only run after initialization to avoid overwriting the URL on first load
    useEffect(() => {
        if (!isInitialized) return; // Don't update URL until we've read from it first

        const newPath = `/m${currentMonth}-day${currentDay}`;
        if (window.location.pathname !== newPath) {
            navigate(newPath, { replace: true });
        }
    }, [currentMonth, currentDay, navigate, isInitialized]);

    const isDayPracticed = (month, day) => {
        const dayKey = `${month}-${day}`;
        return practicedDays[dayKey] === true;
    };

    const handleDayClick = (day) => {
        const isLocked = day > 1 && !isDayPracticed(currentMonth, day - 1);
        if (isLocked) {
            // On mobile, close the menu and show tooltip
            if (isMobileMenuOpen) {
                setIsMobileMenuClosing(true);
                setTimeout(() => {
                    setIsMobileMenuOpen(false);
                    setIsMobileMenuClosing(false);
                    // Trigger tooltip after menu closes
                    setTimeout(() => {
                        setTriggerPracticeTooltip(true);
                        setTimeout(() => setTriggerPracticeTooltip(false), 100);
                    }, 300);
                }, 300);
            } else {
                // On desktop, just trigger tooltip
                setTriggerPracticeTooltip(true);
                setTimeout(() => setTriggerPracticeTooltip(false), 100);
            }
            return;
        }
        setCurrentDay(day);
    };

    const handleNext = () => {
        // Check if current day is practiced before allowing next
        if (currentDay < 30 && isDayPracticed(currentMonth, currentDay)) {
            setCurrentDay(currentDay + 1);
        }
    };
    const handlePrev = () => { if (currentDay > 1) setCurrentDay(currentDay - 1); };
    const changeMonth = (month) => {
        setCurrentMonth(month);
        setCurrentDay(1);
        setCountdown(null);
        setIsScrolling(false);
    };

    const downloadImage = async () => {
        setIsGenerating(true);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1080;
        canvas.height = 1920; // 9:16 aspect ratio

        const accentColor = '#880000';
        const contentPadding = 60;
        const contentWidth = canvas.width - contentPadding * 2;
        const footerHeight = 100; // Fixed footer space

        // Helper function to wrap text
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

        // Prepare story chunks
        const sentences = activeData.text.match(/[^.!?]+[.!?]+/g) || [activeData.text];
        const chunks = [];
        for (let i = 0; i < sentences.length; i += 2) {
            chunks.push(sentences.slice(i, i + 2).join(' ').trim());
        }

        // Practice note text
        const practiceNote = `This is my practice today about ${activeData.title} from ${activeData.country}, cannot wait to improve my English with the next reading challenge.`;

        // Calculate content height needed for a given font size
        const calculateContentHeight = (fontSize) => {
            const lineHeight = fontSize * 1.75;
            let totalHeight = 80; // Header space (READ ALOUD)

            // Story chunks
            chunks.forEach((chunk) => {
                const lines = wrapText(ctx, chunk, contentWidth - 60, fontSize);
                totalHeight += lines.length * lineHeight + 40;
            });

            // Practice note (exact same style as story chunks)
            const noteLines = wrapText(ctx, practiceNote, contentWidth - 60, fontSize);
            totalHeight += noteLines.length * lineHeight + 35;

            return totalHeight;
        };

        // Find optimal image height and font size
        let imageHeight = 595; // Start with default
        const minImageHeight = 350; // Minimum image height
        let textFontSize = 32;
        const minFontSize = 20;

        // Calculate available space for content
        let availableForContent = canvas.height - imageHeight - footerHeight;
        let neededHeight = calculateContentHeight(textFontSize);

        // First try reducing font size
        while (neededHeight > availableForContent && textFontSize > minFontSize) {
            textFontSize -= 2;
            neededHeight = calculateContentHeight(textFontSize);
        }

        // If still doesn't fit, reduce image height
        while (neededHeight > availableForContent && imageHeight > minImageHeight) {
            imageHeight -= 30;
            availableForContent = canvas.height - imageHeight - footerHeight;
        }

        // Final font size adjustment if needed
        while (neededHeight > availableForContent && textFontSize > minFontSize) {
            textFontSize -= 1;
            neededHeight = calculateContentHeight(textFontSize);
        }

        const textLineHeight = textFontSize * 1.75;

        // Draw poster content (with or without image)
        const drawPoster = (img = null) => {
            // Fill background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // === HERO IMAGE SECTION ===
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

                // Dark gradient overlay
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

            // === TOP METADATA (over image) ===
            const topPadding = 50;
            const sidePadding = 60;

            // Day/Month badge
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            const badgeText = `M${currentMonth} · D${currentDay}`;
            ctx.font = 'bold 28px Arial, sans-serif';
            const badgeWidth = ctx.measureText(badgeText).width + 40;
            ctx.fillRect(sidePadding, topPadding, badgeWidth, 50);
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.fillText(badgeText, sidePadding + 20, topPadding + 35);

            // Country
            if (activeData.country !== "TBD") {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = 'bold 24px Arial, sans-serif';
                ctx.fillText(`◉ ${activeData.country.toUpperCase()}`, sidePadding + badgeWidth + 25, topPadding + 35);
            }

            // === HUGE DAY NUMBER ===
            const dayNum = String(currentDay).padStart(2, '0');
            ctx.font = 'bold 280px Arial, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fillText(dayNum, canvas.width - sidePadding, Math.min(topPadding + 230, imageHeight - 50));

            // === TITLE ===
            ctx.textAlign = 'left';
            const titleBottomPadding = 60;
            const titleMaxWidth = canvas.width - sidePadding * 2;

            // Accent line
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(sidePadding, imageHeight - titleBottomPadding - 130, 60, 4);

            // Title text
            ctx.fillStyle = '#FFFFFF';
            const titleLines = wrapText(ctx, activeData.title, titleMaxWidth, 56, 'bold');
            const titleLineHeight = 68;
            let titleY = imageHeight - titleBottomPadding - (titleLines.length - 1) * titleLineHeight;

            ctx.font = 'bold 56px Arial, sans-serif';
            titleLines.forEach((line, i) => {
                ctx.fillText(line, sidePadding, titleY + i * titleLineHeight);
            });

            // Wikipedia attribution
            if (activeData.localImage || activeData.wikiSearch) {
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.font = 'bold 18px Arial, sans-serif';
                ctx.fillText(`📷 ${activeData.wikiSearch || activeData.title} · Wikipedia`, sidePadding, imageHeight - 20);
            }

            // === RED ACCENT BAR ===
            ctx.fillStyle = accentColor;
            ctx.fillRect(0, 0, 8, canvas.height);

            // === CONTENT SECTION ===
            let yPos = imageHeight + 50;

            // "READ ALOUD" header
            ctx.fillStyle = accentColor;
            ctx.fillRect(contentPadding, yPos, 60, 4);
            ctx.fillStyle = '#999999';
            ctx.font = 'bold 20px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('READ ALOUD', contentPadding + 80, yPos + 3);

            yPos += 55;

            // Draw each chunk
            chunks.forEach((chunk, chunkIndex) => {
                // Chunk number
                ctx.fillStyle = '#DDDDDD';
                ctx.font = 'bold 18px Arial, sans-serif';
                ctx.fillText(String(chunkIndex + 1).padStart(2, '0'), contentPadding, yPos + textFontSize * 0.3);

                // Chunk text
                ctx.fillStyle = '#444444';
                ctx.font = `${textFontSize}px Arial, sans-serif`;
                const lines = wrapText(ctx, chunk, contentWidth - 60, textFontSize);

                // Left border
                const chunkHeight = lines.length * textLineHeight;
                ctx.fillStyle = '#F0F0F0';
                ctx.fillRect(contentPadding + 40, yPos - 10, 2, chunkHeight + 10);

                ctx.fillStyle = '#444444';
                lines.forEach((line, lineIndex) => {
                    ctx.fillText(line, contentPadding + 55, yPos + lineIndex * textLineHeight);
                });

                yPos += lines.length * textLineHeight + 35;
            });

            // === PRACTICE NOTE (exact same style as paragraph chunks) ===
            // Chunk number indicator
            ctx.fillStyle = '#DDDDDD';
            ctx.font = 'bold 18px Arial, sans-serif';
            ctx.fillText('✦', contentPadding + 5, yPos + textFontSize * 0.3);

            // Note text
            ctx.fillStyle = '#444444';
            ctx.font = `${textFontSize}px Arial, sans-serif`;
            const noteLines = wrapText(ctx, practiceNote, contentWidth - 60, textFontSize);

            // Left border
            const noteHeight = noteLines.length * textLineHeight;
            ctx.fillStyle = '#F0F0F0';
            ctx.fillRect(contentPadding + 40, yPos - 10, 2, noteHeight + 10);

            ctx.fillStyle = '#444444';
            noteLines.forEach((line, i) => {
                ctx.fillText(line, contentPadding + 55, yPos + i * textLineHeight);
            });

            yPos += noteLines.length * textLineHeight + 35;

            // === FOOTER - Swiss Design ===
            const footerHeight = 140;
            const footerY = canvas.height - footerHeight + 40;

            // Horizontal divider line above footer
            ctx.fillStyle = '#E0E0E0';
            ctx.fillRect(contentPadding, canvas.height - footerHeight, canvas.width - contentPadding * 2, 1);

            // Right side - Two-line layout
            ctx.textAlign = 'right';

            // Line 1: "PRACTICE AT" + "myenglish.my.id"
            const line1Y = footerY + 10;

            // Domain (bold, larger, dark)
            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.fillStyle = '#111111';
            const domainText = 'myenglish.my.id';
            ctx.fillText(domainText, canvas.width - contentPadding, line1Y);

            // "PRACTICE AT" label (small, uppercase, muted)
            const domainWidth = ctx.measureText(domainText).width;
            ctx.font = 'bold 14px Arial, sans-serif';
            ctx.fillStyle = '#999999';
            ctx.fillText('PRACTICE AT  ', canvas.width - contentPadding - domainWidth, line1Y);

            // Line 2: "Mr. Zayn" (medium, muted)
            const line2Y = footerY + 45;
            ctx.font = 'normal 20px Arial, sans-serif';
            ctx.fillStyle = '#777777';
            ctx.fillText('Mr. Zayn', canvas.width - contentPadding, line2Y);

            // Load logo and then download
            const logo = new Image();
            logo.onload = () => {
                // Draw logo (height 60px, maintain aspect ratio) - Swiss prominence
                const logoHeight = 60;
                const logoWidth = (logo.width / logo.height) * logoHeight;
                ctx.drawImage(logo, contentPadding, footerY - 10, logoWidth, logoHeight);

                // Download the image after logo is drawn
                const link = document.createElement('a');
                link.download = `Reading-Challenge-M${currentMonth}-D${currentDay}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.92);
                link.click();
                setIsGenerating(false);
            };
            logo.onerror = () => {
                // Fallback: download without logo if it fails to load
                const link = document.createElement('a');
                link.download = `Reading-Challenge-M${currentMonth}-D${currentDay}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.92);
                link.click();
                setIsGenerating(false);
            };
            logo.src = '/logo-horizontal.svg';
        };

        // Try to load the local image
        if (activeData.localImage) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => drawPoster(img);
            img.onerror = () => drawPoster(null); // Fallback without image
            img.src = activeData.localImage;
        } else {
            // No local image, draw without
            drawPoster(null);
        }
    };


    const toggleTeleprompter = () => {
        if (isTeleprompterActive) {
            setIsClosing(true);
            setIsScrolling(false);
            setCountdown(null);
        } else {
            // Mark this day as practiced when Practice button is clicked
            const dayKey = `${currentMonth}-${currentDay}`;
            const practiced = getStorage(StorageKeys.PRACTICED_DAYS, {});
            if (!practiced[dayKey]) {
                practiced[dayKey] = true;
                setStorage(StorageKeys.PRACTICED_DAYS, practiced);
                setPracticedDays(practiced);
            }

            practiceStartTimeRef.current = Date.now();
            setIsTeleprompterActive(true);
            // Center the title when teleprompter opens
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const contentElement = container.querySelector('div > h2');
                    if (contentElement) {
                        const containerHeight = container.clientHeight;
                        const titleTop = contentElement.offsetTop;
                        const titleHeight = contentElement.offsetHeight;
                        // Center the title in the viewport
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
            {/* Dynamic SEO for each story page */}
            {activeData && (
                <SEO
                    title={`${activeData.title} - Day ${currentDay} | English Fluency Journey`}
                    description={`Read "${activeData.title}" from ${activeData.country}. ${activeData.text.substring(0, 150)}... Practice English reading with our free 90-day challenge.`}
                    keywords={`English reading, ${activeData.country}, ${activeData.title}, learn English, ESL practice, day ${currentDay}, month ${currentMonth}`}
                    ogImage={activeData.localImage ? `https://myenglish.my.id${activeData.localImage}` : 'https://myenglish.my.id/og-image.jpg'}
                    url={`https://myenglish.my.id/m${currentMonth}-day${currentDay}`}
                    type="article"
                />
            )}

            {isTeleprompterActive && (
                <div
                    className={`fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col ${isClosing ? 'animate-slideDown' : 'animate-slideUp'}`}
                    onAnimationEnd={handleAnimationEnd}
                >
                    {/* Countdown Overlay - Swiss Typography */}
                    {countdown !== null && (
                        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md">
                            {/* Swiss Grid Pattern Background */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                    backgroundSize: '40px 40px'
                                }}></div>
                            </div>

                            {/* Countdown Number */}
                            <div className="relative">
                                <div className="text-[14rem] md:text-[18rem] font-bold text-[#880000] leading-none tracking-tighter animate-pulse">
                                    {countdown}
                                </div>
                                {/* Accent Bar */}
                                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-white/20"></div>
                            </div>

                            {/* Label */}
                            <div className="mt-12 text-[10px] md:text-xs text-white/40 uppercase tracking-[0.3em]">
                                Starting in
                            </div>
                        </div>
                    )}

                    {/* Header - Swiss Minimal */}
                    <div className="border-b border-white/10">
                        <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
                            {/* Left: Brand */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#880000] flex items-center justify-center">
                                    <Monitor size={16} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white">Practice Mode</span>
                                    <span className="text-[9px] text-white/40 uppercase tracking-wider hidden md:block">Read aloud with teleprompter</span>
                                </div>
                            </div>

                            {/* Center: Status */}
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

                            {/* Right: Controls */}
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

                        {/* Controls Panel - Swiss Grid */}
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

                                        {/* Speed Presets - Swiss Grid */}
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

                                        {/* Slider */}
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

                                        {/* Size Presets - Swiss Grid */}
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

                                        {/* Slider */}
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

                    {/* Reading Area - Swiss Typography */}
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
                            {/* Title - Swiss Style */}
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
                                        Month {currentMonth} · Day {currentDay}
                                    </span>
                                </div>
                            </div>

                            {/* Main Text - Swiss Typography */}
                            <p className="font-normal leading-[1.7] text-white/90 tracking-wide">
                                {activeData.text}
                            </p>

                            {/* End Marker */}
                            <div className="mt-20 md:mt-24">
                                <div className="w-8 h-0.5 bg-white/20 mx-auto"></div>
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-4">End of text</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls - Swiss Minimal */}
                    <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
                        <div className="flex flex-col items-center pb-8 md:pb-10">
                            {/* Play/Pause Button - Swiss Square */}
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

                            {/* Status Label */}
                            <div className="mt-4 text-[9px] text-white/40 uppercase tracking-[0.2em]">
                                {isScrolling ? 'Tap to pause' : 'Tap to start'}
                            </div>
                        </div>
                    </div>

                    {/* Side Indicators - Swiss Accent */}
                    <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="w-1 h-32 bg-gradient-to-b from-transparent via-[#880000]/50 to-transparent"></div>
                    </div>
                    <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="w-1 h-32 bg-gradient-to-b from-transparent via-[#880000]/50 to-transparent"></div>
                    </div>
                </div>
            )}
            {/* Page Loading Overlay - Prevents flash */}
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
                {/* Navbar - Swiss Design */}
                <nav className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 flex-shrink-0 z-20 fixed top-0">
                    <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
                        <div className="flex items-center justify-between h-14 md:h-16">
                            {/* Logo */}
                            <button
                                onClick={() => navigate('/')}
                                className="cursor-pointer group"
                            >
                                <img src="/logo-horizontal.svg" alt="English Fluency Journey" className="h-8 md:h-10" />
                            </button>

                            {/* Desktop Actions */}
                            <div className="hidden sm:flex items-center">
                                {[
                                    { icon: BarChart3, label: 'Stats', onClick: () => setShowDashboard(true) },
                                    { icon: RotateCw, label: 'Cards', onClick: () => setShowFlashcards(true) },
                                    { icon: Sparkles, label: 'Review', onClick: () => setShowMistakeCards(true) }
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={item.onClick}
                                        className="flex items-center gap-1.5 px-3 md:px-4 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors text-[10px] md:text-xs font-medium uppercase tracking-wider"
                                    >
                                        <item.icon size={14} className="md:w-4 md:h-4" />
                                        <span className="hidden md:inline">{item.label}</span>
                                    </button>
                                ))}
                                <Link
                                    to="/donate"
                                    className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-[#880000] text-white hover:bg-[#660000] transition-colors text-[10px] md:text-xs font-medium uppercase tracking-wider ml-2"
                                >
                                    <Heart size={14} className="md:w-4 md:h-4" />
                                    <span className="hidden md:inline">Donate</span>
                                </Link>
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => {
                                    if (isMobileMenuOpen) {
                                        setIsMobileMenuClosing(true);
                                        setTimeout(() => { setIsMobileMenuOpen(false); setIsMobileMenuClosing(false); }, 300);
                                    } else {
                                        setIsMobileMenuOpen(true);
                                    }
                                }}
                                className="sm:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5"
                                aria-label="Toggle menu"
                            >
                                <span className={`block w-5 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                                <span className={`block w-5 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`block w-5 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Mobile Menu - Swiss Design */}
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className={`fixed inset-0 bg-black/60 z-30 ${isMobileMenuClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                            onClick={() => { setIsMobileMenuClosing(true); setTimeout(() => { setIsMobileMenuOpen(false); setIsMobileMenuClosing(false); }, 300); }}
                        />

                        {/* Mobile Bottom Sheet - Swiss */}
                        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-40 max-h-[80vh] overflow-y-auto ${isMobileMenuClosing ? 'animate-bottom-sheet-out' : 'animate-bottom-sheet-in'}`}>
                            {/* Handle + Close */}
                            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-0.5 bg-[#880000]"></div>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Navigation</span>
                                </div>
                                <button
                                    onClick={() => { setIsMobileMenuClosing(true); setTimeout(() => { setIsMobileMenuOpen(false); setIsMobileMenuClosing(false); }, 300); }}
                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-4 space-y-6">
                                {/* Month Tabs - Swiss */}
                                <div>
                                    <div className="flex border-b border-slate-200">
                                        {[1, 2, 3].map(month => (
                                            <button
                                                key={month}
                                                onClick={() => changeMonth(month)}
                                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${currentMonth === month
                                                    ? 'text-[#880000] border-b-2 border-[#880000]'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                Month {month}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Actions - Swiss Grid */}
                                <div className="grid grid-cols-3 gap-0 border border-slate-200">
                                    {[
                                        { icon: BarChart3, label: 'Stats', onClick: () => setShowDashboard(true) },
                                        { icon: RotateCw, label: 'Cards', onClick: () => setShowFlashcards(true) },
                                        { icon: Sparkles, label: 'Review', onClick: () => setShowMistakeCards(true) }
                                    ].map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { item.onClick(); setIsMobileMenuClosing(true); setTimeout(() => { setIsMobileMenuOpen(false); setIsMobileMenuClosing(false); }, 300); }}
                                            className={`flex flex-col items-center justify-center py-4 text-slate-600 hover:bg-slate-50 hover:text-[#880000] transition-all ${i < 2 ? 'border-r border-slate-200' : ''}`}
                                        >
                                            <item.icon size={18} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider mt-1.5">{item.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Donate Button */}
                                <Link
                                    to="/donate"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#880000] text-white hover:bg-[#660000] transition-colors text-xs font-bold uppercase tracking-wider"
                                >
                                    <Heart size={16} />
                                    Support This Project
                                </Link>

                                {/* Day Grid - Swiss */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-4 h-0.5 bg-slate-300"></div>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em]">Select Day</span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1.5">
                                        {allMonthsData[currentMonth].map((d) => {
                                            const isPracticed = isDayPracticed(currentMonth, d.day);
                                            const isLocked = d.day > 1 && !isDayPracticed(currentMonth, d.day - 1);
                                            return (
                                                <button
                                                    key={d.day}
                                                    onClick={() => handleDayClick(d.day)}
                                                    className={`aspect-square text-xs font-bold transition-all ${currentDay === d.day
                                                        ? 'bg-[#880000] text-white'
                                                        : isPracticed
                                                            ? 'bg-green-50 text-green-600 border border-green-200'
                                                            : isLocked
                                                                ? 'bg-slate-50 text-slate-300'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {d.day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Main Content */}
                <div className="w-full flex-1 flex flex-col items-center justify-center pt-16 md:pt-20 pb-4 px-4 md:px-6 lg:px-8 min-h-0 overflow-hidden">
                    <div className="w-full max-w-5xl flex-1 min-h-0 max-h-full">
                        {/* Main Reading Card */}
                        <div className="flex flex-col min-h-0 h-full">
                            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                                <ReadingCard
                                    activeData={activeData}
                                    currentMonth={currentMonth}
                                    currentDay={currentDay}
                                    isGenerating={isGenerating}
                                    onDownload={downloadImage}
                                    onToggleTeleprompter={toggleTeleprompter}
                                    onPrev={handlePrev}
                                    onNext={handleNext}
                                    isDayPracticed={isDayPracticed}
                                    practicedDays={practicedDays}
                                    statistics={statistics}
                                    progress={progress}
                                    triggerPracticeTooltip={triggerPracticeTooltip}
                                    preloadedImages={imagePreloadCache.current}
                                    onOpenMonthSelector={() => {
                                        setIsMounting(true);
                                        setIsMonthSelectorOpen(true);
                                        requestAnimationFrame(() => {
                                            requestAnimationFrame(() => {
                                                setIsMounting(false);
                                            });
                                        });
                                    }}
                                    onReady={() => !isPageReady && setIsPageReady(true)}
                                />
                                {/* Attribution - Swiss Design */}
                                <div className="mt-6 md:mt-8 pb-4">
                                    <div className="max-w-xl mx-auto px-4">
                                        <div className="border-l-2 border-slate-200 pl-4">
                                            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                                                "This is my practice today about <span className="text-slate-600 font-medium">{activeData.title}</span> from {activeData.country}, cannot wait to improve my English with the next reading challenge."
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
                        currentMonth={currentMonth}
                        allMonthsData={allMonthsData}
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

                {/* Month/Day Selector - Swiss Design */}
                {(isMonthSelectorOpen || isMonthSelectorClosing) && (
                    <>
                        {/* Backdrop */}
                        <div
                            className={`fixed inset-0 bg-black/40 z-40 ${isMonthSelectorClosing ? 'opacity-0' : 'opacity-100'}`}
                            style={{ transition: 'opacity 0.3s ease-out' }}
                            onClick={() => { setIsMonthSelectorClosing(true); setTimeout(() => { setIsMonthSelectorOpen(false); setIsMonthSelectorClosing(false); }, 300); }}
                        />

                        {/* Dropdown Panel - Swiss */}
                        <div
                            className={`fixed z-50 bg-white shadow-2xl overflow-hidden border-l-4 border-[#880000] ${isMonthSelectorClosing ? 'opacity-0 -translate-y-4' : isMounting ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'
                                } left-2 right-2 sm:left-4 sm:right-4 md:left-1/2 md:right-auto md:w-[400px] md:-translate-x-1/2`}
                            style={{
                                top: '64px',
                                transition: 'opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1), transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
                            }}
                        >
                            {/* Header */}
                            <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-0.5 bg-[#880000]"></div>
                                    <span className="text-xs md:text-[10px] text-slate-400 uppercase tracking-[0.15em] md:tracking-[0.2em]">Select Day</span>
                                </div>
                                <button
                                    onClick={() => { setIsMonthSelectorClosing(true); setTimeout(() => { setIsMonthSelectorOpen(false); setIsMonthSelectorClosing(false); }, 300); }}
                                    className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={18} className="md:w-4 md:h-4" />
                                </button>
                            </div>

                            {/* Month Tabs - Swiss Style */}
                            <div className="flex border-b border-slate-100">
                                {[1, 2, 3].map(month => (
                                    <button
                                        key={month}
                                        onClick={() => changeMonth(month)}
                                        className={`flex-1 py-4 md:py-3 text-xs md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.15em] transition-all ${currentMonth === month
                                            ? 'text-[#880000] bg-slate-50 border-b-2 border-[#880000]'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        Month {month}
                                    </button>
                                ))}
                            </div>

                            {/* Days Grid - Swiss - Larger on mobile */}
                            <div className="p-3 sm:p-4">
                                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                                    {allMonthsData[currentMonth].map((d) => {
                                        const isPracticed = isDayPracticed(currentMonth, d.day);
                                        const isLocked = d.day > 1 && !isDayPracticed(currentMonth, d.day - 1);
                                        return (
                                            <button
                                                key={d.day}
                                                onClick={() => {
                                                    handleDayClick(d.day);
                                                    setIsMonthSelectorClosing(true);
                                                    setTimeout(() => { setIsMonthSelectorOpen(false); setIsMonthSelectorClosing(false); }, 300);
                                                }}
                                                className={`aspect-square text-sm font-bold transition-all ${currentDay === d.day
                                                    ? 'bg-[#880000] text-white'
                                                    : isPracticed
                                                        ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                                                        : isLocked
                                                            ? 'bg-slate-50 text-slate-200 cursor-not-allowed'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                                                    }`}
                                                disabled={isLocked}
                                            >
                                                {d.day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Legend - Swiss Minimal */}
                            <div className="px-4 pb-4 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-center gap-4 md:gap-6 text-[10px] md:text-[9px] text-slate-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 md:w-2 md:h-2 bg-[#880000]"></div>
                                        <span>Current</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 md:w-2 md:h-2 bg-green-100 border border-green-300"></div>
                                        <span>Done</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 md:w-2 md:h-2 bg-slate-100 border border-slate-200"></div>
                                        <span>Open</span>
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

export default ReadingChallenge;

