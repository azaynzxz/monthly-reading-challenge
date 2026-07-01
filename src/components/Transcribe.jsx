import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mic,
    MicOff,
    Settings,
    X,
    Trash2,
    Copy,
    Download,
    Check,
    Globe,
    Clock,
    RefreshCw
} from 'lucide-react';

// Web Speech API interfaces
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;

// Preset Languages
const LANGUAGES = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'id-ID', label: 'Indonesian' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'ko-KR', label: 'Korean' },
    { code: 'zh-CN', label: 'Chinese (Mandarin)' }
];

// Offline beep generator using Web Audio API
const playBeep = (frequency, duration, type = 'sine') => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = type;
        osc.frequency.value = frequency;

        // Soft volume envelope to prevent pops
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.warn("AudioContext beep failed:", e);
    }
};

const Transcribe = () => {
    const navigate = useNavigate();

    // UI & Settings States
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('transcribe-font-size');
        return saved ? parseInt(saved, 10) : 36;
    });
    const [selectedLanguage, setSelectedLanguage] = useState(() => {
        return localStorage.getItem('transcribe-lang') || 'en-US';
    });
    const [timerDuration, setTimerDuration] = useState(() => {
        const saved = localStorage.getItem('transcribe-timer');
        return saved ? parseInt(saved, 10) : 3; // 0 (Off), 3s, 5s
    });
    const [autoScroll, setAutoScroll] = useState(true);
    const [isControlsExpanded, setIsControlsExpanded] = useState(false);

    // Transcription States
    const [isListening, setIsListening] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [finalizedTranscripts, setFinalizedTranscripts] = useState([]);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [aboveCenterIndices, setAboveCenterIndices] = useState(new Set());

    // Refs for speech recognition sync
    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false);
    const shouldBeListeningRef = useRef(false);
    const lastSpeechTimeRef = useRef(Date.now());

    // Audio Visualizer Refs
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const visualizerStreamRef = useRef(null);
    const visualizerAnimRef = useRef(null);

    // Scroll & Layout Refs
    const scrollContainerRef = useRef(null);

    // Save settings to LocalStorage
    useEffect(() => {
        localStorage.setItem('transcribe-font-size', fontSize);
    }, [fontSize]);

    useEffect(() => {
        localStorage.setItem('transcribe-lang', selectedLanguage);
        // If recognition is active, stop it, change language, and restart
        if (recognitionRef.current) {
            recognitionRef.current.lang = selectedLanguage;
            if (isListeningRef.current) {
                stopSpeechRecognition();
                setTimeout(() => {
                    startSpeechRecognition();
                }, 300);
            }
        }
    }, [selectedLanguage]);

    useEffect(() => {
        localStorage.setItem('transcribe-timer', timerDuration);
    }, [timerDuration]);

    // Keep isListeningRef in sync
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    // Auto-scroll when transcript changes
    useEffect(() => {
        if (!autoScroll || !scrollContainerRef.current) return;
        const container = scrollContainerRef.current;

        if (finalizedTranscripts.length === 0 && !interimTranscript) {
            container.scrollTop = 0;
            return;
        }

        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    }, [finalizedTranscripts, interimTranscript, autoScroll]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (!isSpeechSupported) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage;

        recognition.onstart = () => {
            isListeningRef.current = true;
            setIsListening(true);
            lastSpeechTimeRef.current = Date.now();
            startVisualizer();
        };

        recognition.onresult = (event) => {
            let interim = '';
            let finals = [];

            lastSpeechTimeRef.current = Date.now();

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                if (result.isFinal) {
                    finals.push(result[0].transcript);
                } else {
                    interim += result[0].transcript;
                }
            }

            if (finals.length > 0) {
                setFinalizedTranscripts((prev) => [...prev, ...finals]);
                setInterimTranscript('');
            } else {
                setInterimTranscript(interim);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                alert("Microphone permission was denied. Please allow microphone access to use live transcription.");
                stopSpeechRecognition();
            }
        };

        recognition.onend = () => {
            isListeningRef.current = false;
            // Auto restart if shouldBeListening is true (browser timed out)
            if (shouldBeListeningRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Failed to restart speech recognition:", e);
                }
            } else {
                setIsListening(false);
                stopVisualizer();
            }
        };

        recognitionRef.current = recognition;

        return () => {
            shouldBeListeningRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
            stopVisualizer();
        };
    }, []);

    // Spacebar keyboard shortcut controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if active element is a select or input to allow normal typing
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'SELECT' || activeEl.tagName === 'INPUT' || activeEl.tagName === 'BUTTON')) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault(); // Stop page scrolling

                if (countdown !== null) {
                    // Cancel countdown
                    setCountdown(null);
                    playBeep(400, 0.15); // Low cancellation pitch
                } else if (isListening) {
                    stopSpeechRecognition();
                    playBeep(400, 0.1);
                } else {
                    startRecordingSequence();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isListening, countdown, timerDuration]);

    // Detect pauses to push scroll up
    useEffect(() => {
        if (!isListening) return;

        const interval = setInterval(() => {
            const elapsed = Date.now() - lastSpeechTimeRef.current;
            // If elapsed > 2500ms and we have transcripts, and the last item is not a spacer, add a spacer.
            if (elapsed > 2500 && finalizedTranscripts.length > 0) {
                setFinalizedTranscripts((prev) => {
                    if (prev.length > 0 && prev[prev.length - 1] !== '') {
                        return [...prev, ''];
                    }
                    return prev;
                });
            }
        }, 500);

        return () => clearInterval(interval);
    }, [isListening, finalizedTranscripts]);

    // Check vertical positions of paragraphs to auto-grey out text above center line
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const checkPositions = () => {
            const containerRect = container.getBoundingClientRect();
            // The center line is at 50% height of the container
            const centerPoint = containerRect.top + containerRect.height / 2;

            const paragraphs = container.querySelectorAll('.transcribe-paragraph');
            const newAboveCenter = new Set();

            paragraphs.forEach((p) => {
                const indexAttr = p.getAttribute('data-index');
                if (indexAttr === null) return;
                const index = parseInt(indexAttr, 10);
                const rect = p.getBoundingClientRect();

                // If the center of the paragraph is above the center point
                const pCenter = rect.top + rect.height / 2;
                if (pCenter < centerPoint) {
                    newAboveCenter.add(index);
                }
            });

            setAboveCenterIndices((prev) => {
                // Prevent state updates if the set contents are unchanged
                if (prev.size === newAboveCenter.size && [...prev].every(x => newAboveCenter.has(x))) {
                    return prev;
                }
                return newAboveCenter;
            });
        };

        container.addEventListener('scroll', checkPositions);

        // Initial position check with layout delays
        checkPositions();
        const frameId = requestAnimationFrame(checkPositions);
        const timer = setTimeout(checkPositions, 60);
        const timer2 = setTimeout(checkPositions, 300);

        return () => {
            container.removeEventListener('scroll', checkPositions);
            cancelAnimationFrame(frameId);
            clearTimeout(timer);
            clearTimeout(timer2);
        };
    }, [finalizedTranscripts, interimTranscript, isListening]);

    // Handle Countdown ticks
    useEffect(() => {
        if (countdown === null) return;

        if (countdown > 0) {
            const timer = setTimeout(() => {
                const nextVal = countdown - 1;
                setCountdown(nextVal);
                if (nextVal > 0) {
                    playBeep(600, 0.08); // Regular tick beep
                } else {
                    playBeep(880, 0.2); // Start talking beep
                    setCountdown(null);
                    startSpeechRecognition();
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Start/Stop Actions
    const startRecordingSequence = () => {
        if (!isSpeechSupported) {
            alert("Speech recognition is not supported on this browser. Please use Chrome, Edge, or Safari.");
            return;
        }

        if (timerDuration === 0) {
            playBeep(880, 0.2); // Start beep
            startSpeechRecognition();
        } else {
            setCountdown(timerDuration);
            playBeep(600, 0.08); // First tick beep
        }
    };

    const startSpeechRecognition = () => {
        if (!recognitionRef.current) return;
        shouldBeListeningRef.current = true;
        if (!isListeningRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Speech recognition start failed:", e);
            }
        }
    };

    const stopSpeechRecognition = () => {
        shouldBeListeningRef.current = false;
        if (recognitionRef.current && isListeningRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error("Speech recognition stop failed:", e);
            }
        }
    };

    const handlePlayPause = () => {
        if (countdown !== null) {
            setCountdown(null);
            playBeep(400, 0.15);
        } else if (isListening) {
            stopSpeechRecognition();
            playBeep(400, 0.1);
        } else {
            startRecordingSequence();
        }
    };

    // Helper Actions
    const cycleTimer = () => {
        const nextDurations = { 0: 3, 3: 5, 5: 0 };
        const next = nextDurations[timerDuration];
        setTimerDuration(next);
        playBeep(600, 0.05);
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear the transcript?")) {
            setFinalizedTranscripts([]);
            setInterimTranscript('');
            lastSpeechTimeRef.current = Date.now();
        }
    };

    const handleCopy = () => {
        // Filter out empty spacers
        const text = finalizedTranscripts.filter(t => t !== '').join(' ');
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleExport = () => {
        // Filter out empty spacers
        const text = finalizedTranscripts.filter(t => t !== '').join('\n');
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Web Audio Visualizer
    const startVisualizer = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            visualizerStreamRef.current = stream;

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            audioContextRef.current = ctx;

            const anal = ctx.createAnalyser();
            anal.fftSize = 64; // Small fftSize gives clean level bars
            analyserRef.current = anal;

            const src = ctx.createMediaStreamSource(stream);
            src.connect(anal);

            const bufferLength = anal.frequencyBinCount;
            const dataArr = new Uint8Array(bufferLength);

            const canvas = canvasRef.current;
            if (!canvas) return;
            const canvasCtx = canvas.getContext('2d');

            let animationId;
            const draw = () => {
                if (!isListeningRef.current) return;
                animationId = requestAnimationFrame(draw);

                anal.getByteFrequencyData(dataArr);

                // Get average volume amplitude
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArr[i];
                }
                const average = sum / bufferLength;
                const amplitude = (average / 255) * canvas.height * 0.9;

                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

                const width = canvas.width;
                const height = canvas.height;
                const mid = height / 2;
                const time = Date.now() * 0.006;

                // Glowing overlapping Siri-style voice waves
                const waves = [
                    { speed: 1.0, freq: 0.02, phase: 0, color: 'rgba(136, 0, 0, 0.25)', width: 1 },
                    { speed: 0.8, freq: 0.015, phase: Math.PI / 3, color: 'rgba(239, 68, 68, 0.4)', width: 1 },
                    { speed: 1.2, freq: 0.025, phase: (2 * Math.PI) / 3, color: 'rgba(251, 191, 36, 0.3)', width: 1 }, // Warm accent wave
                    { speed: 1.5, freq: 0.03, phase: Math.PI, color: '#880000', width: 2, glow: true } // Primary wave
                ];

                waves.forEach((w) => {
                    canvasCtx.beginPath();
                    canvasCtx.strokeStyle = w.color;
                    canvasCtx.lineWidth = w.width;

                    if (w.glow) {
                        canvasCtx.shadowBlur = 12;
                        canvasCtx.shadowColor = 'rgba(239, 68, 68, 0.8)';
                    } else {
                        canvasCtx.shadowBlur = 0;
                    }

                    for (let x = 0; x < width; x++) {
                        // Smooth envelope to taper wave heights at canvas borders
                        const envelope = Math.sin((x / width) * Math.PI);
                        const y = mid + Math.sin(x * w.freq + time * w.speed + w.phase) * (amplitude + 2) * envelope;

                        if (x === 0) {
                            canvasCtx.moveTo(x, y);
                        } else {
                            canvasCtx.lineTo(x, y);
                        }
                    }
                    canvasCtx.stroke();
                });

                canvasCtx.shadowBlur = 0; // Reset shadow
            };
            draw();
            visualizerAnimRef.current = animationId;
        } catch (e) {
            console.warn("Media devices visualizer not started:", e);
        }
    };

    const stopVisualizer = () => {
        if (visualizerAnimRef.current) {
            cancelAnimationFrame(visualizerAnimRef.current);
        }
        if (visualizerStreamRef.current) {
            visualizerStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col animate-slideUp">
            <style>{`
                @keyframes expandSpacer {
                    from { height: 0; }
                    to { height: 20vh; }
                }
                @keyframes fadeInWord {
                    from {
                        opacity: 0;
                        transform: translateY(6px) scale(0.98);
                        filter: blur(2px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                        filter: blur(0);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-expand-spacer {
                    animation: expandSpacer 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-in-word {
                    animation: fadeInWord 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-in {
                    animation: fadeIn 0.25s ease-out forwards;
                }
            `}</style>
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
                        Ready to speak in
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="border-b border-white/10">
                <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#880000] flex items-center justify-center">
                            <Mic size={16} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white">Speech Transcriber</span>
                            <span className="text-[9px] text-white/40 uppercase tracking-wider hidden md:block">Real-time Browser Native Transcription</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 ${isListening ? 'bg-[#880000] animate-pulse' : 'bg-white/30'}`}></div>
                            <span className="text-[10px] text-white/50 uppercase tracking-wider">
                                {isListening ? 'Listening' : 'Ready'}
                            </span>
                        </div>
                        <div className="text-[10px] text-white/30">|</div>
                        <span className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                            <Globe size={11} /> {LANGUAGES.find(l => l.code === selectedLanguage)?.label || selectedLanguage}
                        </span>
                        <div className="text-[10px] text-white/30">|</div>
                        <span className="text-[10px] text-white/50 uppercase tracking-wider">
                            {fontSize}px Size
                        </span>
                    </div>

                    <div className="flex items-center">
                        <button
                            onClick={() => setIsControlsExpanded(!isControlsExpanded)}
                            className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center transition-all ${isControlsExpanded ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            title={isControlsExpanded ? 'Hide Settings' : 'Show Settings'}
                        >
                            <Settings size={18} className={`transition-transform duration-300 ${isControlsExpanded ? 'rotate-90' : ''}`} />
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-white/40 hover:text-white hover:bg-[#880000] transition-all"
                            title="Exit"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Controls Settings Panel */}
                <div className={`overflow-hidden transition-all duration-300 ease-out ${isControlsExpanded ? 'max-h-[350px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 md:px-6 pb-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/10">
                            {/* Left Settings: Language & Timer */}
                            <div className="p-4 md:border-r border-white/10 flex flex-col gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-4 h-0.5 bg-[#880000]"></div>
                                        <span className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Voice Input Language</span>
                                    </div>
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 text-white text-xs py-2 px-3 focus:outline-none focus:border-[#880000] cursor-pointer"
                                    >
                                        {LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-0.5 bg-white/30"></div>
                                            <span className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Pre-talk Countdown</span>
                                        </div>
                                        <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5">
                                            {timerDuration === 0 ? 'Instant' : `${timerDuration}s`}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-0 border border-white/10">
                                        {[
                                            { value: 0, label: 'Instant' },
                                            { value: 3, label: '3s Timer' },
                                            { value: 5, label: '5s Timer' }
                                        ].map((preset, i) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => setTimerDuration(preset.value)}
                                                className={`py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${timerDuration === preset.value
                                                    ? 'bg-[#880000] text-white'
                                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                                    } ${i < 2 ? 'border-r border-white/10' : ''}`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Settings: Font Size & Auto Scroll */}
                            <div className="p-4 border-t md:border-t-0 border-white/10 flex flex-col gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-0.5 bg-white/30"></div>
                                            <span className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Text Size</span>
                                        </div>
                                        <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5">{fontSize}px</span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-0 border border-white/10 mb-3">
                                        {[
                                            { value: 24, label: 'S' },
                                            { value: 36, label: 'M' },
                                            { value: 48, label: 'L' },
                                            { value: 72, label: 'XL' }
                                        ].map((preset, i) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => setFontSize(preset.value)}
                                                className={`py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${fontSize === preset.value
                                                    ? 'bg-white text-slate-950'
                                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                                    } ${i < 3 ? 'border-r border-white/10' : ''}`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    <input
                                        type="range"
                                        min="16"
                                        max="96"
                                        step="4"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                                        className="w-full h-1 bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">Auto-scroll to Bottom</span>
                                    <button
                                        onClick={() => setAutoScroll(!autoScroll)}
                                        className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-all border ${autoScroll
                                            ? 'bg-[#880000] border-[#880000] text-white'
                                            : 'border-white/20 text-white/40 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {autoScroll ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reading/Transcription Area Container */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                {/* Top Fading Mask Overlay */}
                <div className="absolute top-0 left-0 right-0 h-[25vh] bg-gradient-to-b from-slate-950 via-slate-950/70 to-transparent pointer-events-none z-20" />

                {/* Reading/Transcription Scroll Area */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto no-scrollbar relative"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {/* Center Guide Line */}
                    <div className="fixed left-0 right-0 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                        <div className="flex items-center justify-center gap-4 opacity-20">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/50"></div>
                            <div className="w-3 h-3 border-2 border-[#880000] transform rotate-45"></div>
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/50"></div>
                        </div>
                    </div>

                    {/* Centered Scroll Wrapper */}
                    <div className={`min-h-full flex flex-col pt-[15vh] pb-[15vh] ${(finalizedTranscripts.length > 0 || interimTranscript) ? 'justify-end' : 'justify-center'
                        }`}>
                        {/* Content */}
                        <div
                            className="max-w-4xl mx-auto px-6 md:px-10 text-center transition-all duration-300"
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {finalizedTranscripts.length === 0 && !interimTranscript ? (
                                <div className="text-white/20 font-normal leading-relaxed text-center px-4 max-w-2xl mx-auto">
                                    <p style={{ fontSize: `${Math.max(fontSize * 0.45, 14)}px` }} className="mb-4 uppercase tracking-wider font-semibold">
                                        Microphones ready.
                                    </p>
                                    <p style={{ fontSize: `${Math.max(fontSize * 0.4, 12)}px` }} className="leading-relaxed">
                                        {isSpeechSupported
                                            ? "Press Space or tap the record button to trigger the countdown. Start speaking and your transcription will scroll in real-time."
                                            : "Speech recognition is not supported on this browser. Please open in Google Chrome or Microsoft Edge."}
                                    </p>
                                </div>
                            ) : (
                                <div className="font-normal leading-[1.6] text-white/90 tracking-tighter text-center flex flex-col gap-6">
                                    {finalizedTranscripts.map((text, i) => {
                                        if (text === '') {
                                            return <div key={i} className="animate-expand-spacer" />;
                                        }

                                        const isOld = aboveCenterIndices.has(i);

                                        return (
                                            <p
                                                key={i}
                                                data-index={i}
                                                className={`transcribe-paragraph break-words transition-all duration-[1000ms] ease-in-out font-bold ${isOld
                                                    ? 'text-slate-500 blur-[2px] opacity-40'
                                                    : 'text-white blur-none opacity-100'
                                                    }`}
                                            >
                                                {text}
                                            </p>
                                        );
                                    })}
                                    {interimTranscript && (
                                        <p className="text-white font-bold break-words">
                                            {interimTranscript.split(' ').filter(Boolean).map((word, wordIndex) => (
                                                <span
                                                    key={wordIndex}
                                                    className="inline-block mr-[0.22em] animate-fade-in-word opacity-0"
                                                    style={{ animationDelay: '0s' }}
                                                >
                                                    {word}
                                                </span>
                                            ))}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Controls panel */}
            <div className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md py-6 z-50 flex flex-col items-center gap-4 relative">
                {/* Audio Visualizer */}
                {isListening && (
                    <div className="absolute top-0 transform -translate-y-full w-full flex justify-center pointer-events-none pb-2">
                        <canvas
                            ref={canvasRef}
                            width="380"
                            height="60"
                            className="bg-transparent"
                        />
                    </div>
                )}

                {/* Toolbar actions */}
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Timer Duration Cycle Button */}
                    <button
                        onClick={cycleTimer}
                        className={`relative w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border transition-all ${timerDuration > 0
                            ? 'bg-amber-600/10 border-amber-600/30 text-amber-500 hover:bg-amber-600/20 hover:border-amber-600/50'
                            : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20'
                            }`}
                        title={`Pre-talk Timer (Current: ${timerDuration === 0 ? 'Off' : `${timerDuration}s`})`}
                    >
                        <Clock size={16} />
                        {timerDuration > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                                {timerDuration}
                            </span>
                        )}
                    </button>

                    {/* Clear Button */}
                    <button
                        onClick={handleClear}
                        disabled={finalizedTranscripts.length === 0 && !interimTranscript}
                        className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all disabled:opacity-20 disabled:pointer-events-none"
                        title="Clear Transcript"
                    >
                        <Trash2 size={16} />
                    </button>

                    {/* Main Record Action Button */}
                    <div className="relative flex flex-col items-center">
                        <button
                            onClick={handlePlayPause}
                            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${countdown !== null
                                ? 'bg-amber-600 text-white hover:bg-amber-700 animate-pulse'
                                : isListening
                                    ? 'bg-[#880000] text-white hover:bg-red-800 scale-105'
                                    : 'bg-white text-slate-950 hover:bg-white/90'
                                }`}
                            title={isListening ? "Stop Transcribing (Space)" : "Start Transcribing (Space)"}
                        >
                            {countdown !== null ? (
                                <span className="font-bold text-lg">{countdown}</span>
                            ) : isListening ? (
                                <MicOff size={28} className="md:w-8 md:h-8" />
                            ) : (
                                <Mic size={28} className="md:w-8 md:h-8" />
                            )}
                        </button>
                    </div>

                    {/* Clipboard Copy Button */}
                    <button
                        onClick={handleCopy}
                        disabled={finalizedTranscripts.length === 0}
                        className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border transition-all ${isCopied
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20'
                            } disabled:opacity-20 disabled:pointer-events-none`}
                        title="Copy to Clipboard"
                    >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>

                    {/* Download TXT Button */}
                    <button
                        onClick={handleExport}
                        disabled={finalizedTranscripts.length === 0}
                        className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all disabled:opacity-20 disabled:pointer-events-none"
                        title="Download as TXT"
                    >
                        <Download size={16} />
                    </button>
                </div>

                <div className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-medium">
                    {countdown !== null
                        ? 'Counting down... Tap to cancel'
                        : isListening
                            ? 'Transcribing. Press Space to pause'
                            : 'Press Space to start recording'}
                </div>
            </div>

            {/* Side visual guidelines (red fades) */}
            <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none">
                <div className="w-1 h-32 bg-gradient-to-b from-transparent via-[#880000]/50 to-transparent"></div>
            </div>
            <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none">
                <div className="w-1 h-32 bg-gradient-to-b from-transparent via-[#880000]/50 to-transparent"></div>
            </div>
        </div>
    );
};

export default Transcribe;
