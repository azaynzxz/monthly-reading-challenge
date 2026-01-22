import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, BookOpen, Award, Clock, Trophy, RefreshCw, Loader2, Share2 } from 'lucide-react';
import { generateAssessment } from './AssessmentGenerator';

/**
 * OnlineAssessment Component
 * Interactive quiz modal that generates and displays vocabulary and comprehension assessments
 * based on the current story content using the AssessmentGenerator.
 */
const OnlineAssessment = ({ storyData, currentMonth, currentDay, onClose }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [assessment, setAssessment] = useState(null);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [fillBlankInput, setFillBlankInput] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const [studentName, setStudentName] = useState('');
    const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);

    // Load assessment on mount
    useEffect(() => {
        const loadAssessment = async () => {
            setIsLoading(true);
            try {
                const result = await generateAssessment(storyData, {
                    fillInBlankCount: 3,
                    vocabMCCount: 3,
                    comprehensionCount: 2
                });
                setAssessment(result);
                setStartTime(Date.now());
            } catch (error) {
                console.error('Error generating assessment:', error);
            }
            setIsLoading(false);
        };

        loadAssessment();
    }, [storyData]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // Calculate total questions and current progress
    const getTotalQuestions = () => {
        if (!assessment) return 0;
        return assessment.sections.reduce((total, section) => total + section.questions.length, 0);
    };

    const getCurrentGlobalQuestion = () => {
        if (!assessment) return 0;
        let count = 0;
        for (let i = 0; i < currentSectionIndex; i++) {
            count += assessment.sections[i].questions.length;
        }
        return count + currentQuestionIndex + 1;
    };

    const getCurrentSection = () => assessment?.sections[currentSectionIndex];
    const getCurrentQuestion = () => getCurrentSection()?.questions[currentQuestionIndex];

    // Navigation handlers
    const goToNext = () => {
        const section = getCurrentSection();
        if (currentQuestionIndex < section.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setFillBlankInput('');
        } else if (currentSectionIndex < assessment.sections.length - 1) {
            setCurrentSectionIndex(currentSectionIndex + 1);
            setCurrentQuestionIndex(0);
            setFillBlankInput('');
        } else {
            // End of assessment
            setEndTime(Date.now());
            setShowResults(true);
        }
    };

    const goToPrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setFillBlankInput('');
        } else if (currentSectionIndex > 0) {
            setCurrentSectionIndex(currentSectionIndex - 1);
            const prevSection = assessment.sections[currentSectionIndex - 1];
            setCurrentQuestionIndex(prevSection.questions.length - 1);
            setFillBlankInput('');
        }
    };

    // Answer handlers
    const handleMCAnswer = (option) => {
        const key = `${currentSectionIndex}-${currentQuestionIndex}`;
        setUserAnswers(prev => ({ ...prev, [key]: option }));
    };

    const handleFillBlankAnswer = () => {
        const key = `${currentSectionIndex}-${currentQuestionIndex}`;
        setUserAnswers(prev => ({ ...prev, [key]: fillBlankInput.toLowerCase().trim() }));
    };

    const handleOpenEndedAnswer = (text) => {
        const key = `${currentSectionIndex}-${currentQuestionIndex}`;
        setUserAnswers(prev => ({ ...prev, [key]: text }));
    };

    const isAnswered = () => {
        const key = `${currentSectionIndex}-${currentQuestionIndex}`;
        return userAnswers[key] !== undefined && userAnswers[key] !== '';
    };

    const getCurrentAnswer = () => {
        const key = `${currentSectionIndex}-${currentQuestionIndex}`;
        return userAnswers[key] || '';
    };

    // Calculate results
    const calculateResults = () => {
        if (!assessment) return { correct: 0, total: 0, percentage: 0 };

        let correct = 0;
        let total = 0;

        assessment.sections.forEach((section, sectionIdx) => {
            section.questions.forEach((question, questionIdx) => {
                const key = `${sectionIdx}-${questionIdx}`;
                const userAnswer = userAnswers[key]?.toLowerCase().trim();
                const correctAnswer = question.answer?.toLowerCase().trim();

                // For open-ended, we count as answered
                if (question.type === 'open-ended' || question.type === 'comprehension') {
                    if (userAnswer && userAnswer.length > 0) {
                        // Check if it contains the expected keywords (for comprehension)
                        if (question.type === 'comprehension' && correctAnswer !== '(personal response)' && correctAnswer !== '(answers will vary based on the story)') {
                            if (userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)) {
                                correct++;
                            }
                        }
                        total++;
                    }
                } else {
                    total++;
                    if (userAnswer === correctAnswer) {
                        correct++;
                    }
                }
            });
        });

        return {
            correct,
            total: getTotalQuestions(),
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0
        };
    };

    const formatTime = (ms) => {
        // Format time helper
        const totalSeconds = Math.abs(Math.floor(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const restartAssessment = async () => {
        setShowResults(false);
        setCurrentSectionIndex(0);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setFillBlankInput('');
        setIsLoading(true);

        try {
            const result = await generateAssessment(storyData, {
                fillInBlankCount: 3,
                vocabMCCount: 3,
                comprehensionCount: 2
            });
            setAssessment(result);
            setStartTime(Date.now());
            setEndTime(null);
        } catch (error) {
            console.error('Error generating assessment:', error);
        }
        setIsLoading(false);
    };

    // Generate and download certificate
    const generateCertificate = async () => {
        if (!studentName.trim()) return;

        setIsGeneratingCertificate(true);
        setShowNameInput(false);

        const canvas = document.createElement('canvas');
        // 9:16 aspect ratio (1080 x 1920)
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');

        // Background - Pure White
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const accentColor = '#880000';
        const black = '#000000';
        const gray = '#666666';
        const lightGray = '#E5E7EB';

        // Grid system
        const margin = 100;
        const centerX = canvas.width / 2;
        let yPos = 200;

        // --- SWISS TYPOGRAPHY HIERARCHY ---

        // 1. Small label (Swiss style)
        ctx.textAlign = 'left';
        ctx.font = '24px Helvetica, Arial, sans-serif';
        ctx.fillStyle = gray;
        ctx.fillText('ASSESSMENT COMPLETED', margin, yPos);

        // Thin line separator
        yPos += 20;
        ctx.fillStyle = lightGray;
        ctx.fillRect(margin, yPos, canvas.width - margin * 2, 1);

        // 2. Name - LARGE (Swiss hierarchy)
        yPos += 120;
        ctx.font = 'bold 140px Helvetica, Arial, sans-serif';
        ctx.fillStyle = black;
        ctx.fillText(studentName.toUpperCase(), margin, yPos);

        // 3. Subtitle
        yPos += 80;
        ctx.font = '32px Helvetica, Arial, sans-serif';
        ctx.fillStyle = gray;
        const storyTitle = assessment?.storyInfo?.title || 'Reading Practice';
        ctx.fillText(storyTitle.toUpperCase(), margin, yPos);

        // Divider line
        yPos += 60;
        ctx.fillStyle = accentColor;
        ctx.fillRect(margin, yPos, 200, 4);

        // --- STATS GRID (Swiss Grid System) ---
        yPos += 120;
        const results = calculateResults();
        const vocabCount = (assessment?.sections?.[0]?.questions?.length || 0) +
            (assessment?.sections?.[1]?.questions?.length || 0);

        const colWidth = (canvas.width - margin * 2) / 3;

        // Column 1: Vocabulary
        let col1X = margin;
        ctx.font = '16px Helvetica, Arial, sans-serif';
        ctx.fillStyle = gray;
        ctx.fillText('VOCABULARY', col1X, yPos);

        ctx.font = 'bold 120px Helvetica, Arial, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(vocabCount.toString(), col1X, yPos + 140);

        ctx.font = '20px Helvetica, Arial, sans-serif';
        ctx.fillStyle = black;
        ctx.fillText('words learned', col1X, yPos + 180);

        // Column 2: Accuracy
        let col2X = margin + colWidth;
        ctx.font = '16px Helvetica, Arial, sans-serif';
        ctx.fillStyle = gray;
        ctx.fillText('ACCURACY', col2X, yPos);

        ctx.font = 'bold 120px Helvetica, Arial, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(results.percentage + '%', col2X, yPos + 140);

        ctx.font = '20px Helvetica, Arial, sans-serif';
        ctx.fillStyle = black;
        ctx.fillText(results.correct + '/' + results.total + ' correct', col2X, yPos + 180);

        // Column 3: Questions
        let col3X = margin + colWidth * 2;
        ctx.font = '16px Helvetica, Arial, sans-serif';
        ctx.fillStyle = gray;
        ctx.fillText('COMPLETED', col3X, yPos);

        ctx.font = 'bold 120px Helvetica, Arial, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(results.total.toString(), col3X, yPos + 140);

        ctx.font = '20px Helvetica, Arial, sans-serif';
        ctx.fillStyle = black;
        ctx.fillText('questions', col3X, yPos + 180);

        // --- TOPIC SECTION ---
        yPos += 300;
        ctx.fillStyle = lightGray;
        ctx.fillRect(margin, yPos, canvas.width - margin * 2, 1);

        yPos += 60;
        ctx.font = '16px Helvetica, Arial, sans-serif';
        ctx.fillStyle = gray;
        ctx.fillText('TOPIC', margin, yPos);

        yPos += 50;
        ctx.font = 'bold 48px Helvetica, Arial, sans-serif';
        ctx.fillStyle = black;

        // Wrap title
        const maxWidth = canvas.width - margin * 2;
        const words = storyTitle.toUpperCase().split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line.trim(), margin, yPos);
                line = words[n] + ' ';
                yPos += 60;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), margin, yPos);


        // --- FOOTER (Swiss Minimal) ---
        const footerY = canvas.height - 180;

        // Top line
        ctx.fillStyle = lightGray;
        ctx.fillRect(margin, footerY, canvas.width - margin * 2, 1);

        // Left: Logo space
        // Right: Text aligned
        ctx.textAlign = 'right';
        ctx.font = 'bold 32px Helvetica, Arial, sans-serif';
        ctx.fillStyle = black;
        ctx.fillText('myenglish.my.id', canvas.width - margin, footerY + 60);

        ctx.font = '18px Helvetica, Arial, sans-serif';
        ctx.fillStyle = gray;
        ctx.fillText('Mr. Zayn', canvas.width - margin, footerY + 95);

        // Load Logo
        const logo = new Image();
        logo.src = '/logo-horizontal.svg';

        logo.onload = () => {
            const logoHeight = 60;
            const logoWidth = (logo.width / logo.height) * logoHeight;
            ctx.drawImage(logo, margin, footerY + 30, logoWidth, logoHeight);
            finishGeneration();
        };

        logo.onerror = () => {
            finishGeneration();
        };

        const finishGeneration = () => {
            const link = document.createElement('a');
            link.download = `Achievement-${studentName.replace(/\s+/g, '-')}-M${currentMonth}D${currentDay}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
            setIsGeneratingCertificate(false);
            setStudentName('');
        };
    };

    // Render question based on type
    const renderQuestion = () => {
        const question = getCurrentQuestion();
        if (!question) return null;

        const currentAnswer = getCurrentAnswer();

        switch (question.type) {
            case 'fill-blank':
                return (
                    <div className="space-y-6">
                        {/* Question - Swiss Design */}
                        <div className="border-l-4 border-[#880000] pl-4 md:pl-6">
                            <p className="text-base md:text-lg text-slate-700 leading-relaxed">
                                {question.question}
                            </p>
                        </div>

                        {/* Answer Input - Swiss Design */}
                        <div className="space-y-3">
                            <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Your Answer</label>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <input
                                    type="text"
                                    value={fillBlankInput}
                                    onChange={(e) => setFillBlankInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fillBlankInput && handleFillBlankAnswer()}
                                    placeholder="Type the missing word..."
                                    className="flex-1 px-4 py-3 border border-slate-200 focus:border-[#880000] focus:outline-none transition-all text-base md:text-lg"
                                    autoFocus
                                />
                                <button
                                    onClick={handleFillBlankAnswer}
                                    disabled={!fillBlankInput.trim()}
                                    className="px-6 py-3 bg-[#880000] text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    Submit
                                </button>
                            </div>

                            {/* Feedback */}
                            {currentAnswer && (
                                <div className={`p-4 flex items-start gap-3 border-l-4 ${currentAnswer === question.answer?.toLowerCase().trim() ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                                    {currentAnswer === question.answer?.toLowerCase().trim()
                                        ? <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                                        : <X size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    }
                                    <div className={`text-sm ${currentAnswer === question.answer?.toLowerCase().trim() ? 'text-green-700' : 'text-red-700'}`}>
                                        <div className="font-medium">Your answer: <strong>{currentAnswer}</strong></div>
                                        {currentAnswer !== question.answer?.toLowerCase().trim() && (
                                            <div className="mt-1">Correct answer: <strong>{question.answer}</strong></div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Word Bank - Swiss Design */}
                        {assessment?.wordBank && (
                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">Word Bank (Hint)</p>
                                <div className="flex flex-wrap gap-2">
                                    {assessment.wordBank.map((word, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-slate-50 text-slate-600 text-sm border border-slate-200">{word}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'vocabulary-mc':
                return (
                    <div className="space-y-6">
                        {/* Question - Swiss Design */}
                        <div className="border-l-4 border-[#880000] pl-4 md:pl-6">
                            <p className="text-base md:text-lg text-slate-700 leading-relaxed">
                                {question.question}
                            </p>
                            {question.partOfSpeech && (
                                <span className="inline-block mt-3 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border border-slate-200">
                                    {question.partOfSpeech}
                                </span>
                            )}
                        </div>

                        {/* Options - Swiss Design */}
                        <div className="grid grid-cols-1 gap-2">
                            {question.options.map((option, idx) => {
                                const isSelected = currentAnswer === option;
                                const isCorrect = option === question.answer;
                                const showFeedback = currentAnswer !== '';

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleMCAnswer(option)}
                                        disabled={currentAnswer !== ''}
                                        className={`p-4 border text-left font-medium transition-all ${showFeedback
                                            ? isCorrect
                                                ? 'border-l-4 border-green-500 bg-green-50 text-green-700'
                                                : isSelected
                                                    ? 'border-l-4 border-red-500 bg-red-50 text-red-700'
                                                    : 'border-slate-200 bg-white text-slate-400'
                                            : isSelected
                                                ? 'border-l-4 border-[#880000] bg-slate-50 text-slate-900'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className={`w-7 h-7 flex items-center justify-center text-xs font-bold uppercase ${showFeedback
                                                ? isCorrect
                                                    ? 'bg-green-100 text-green-700'
                                                    : isSelected
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-slate-100 text-slate-400'
                                                : isSelected
                                                    ? 'bg-[#880000] text-white'
                                                    : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="capitalize flex-1">{option}</span>
                                            {showFeedback && isCorrect && <Check size={18} className="text-green-600 flex-shrink-0" />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'comprehension':
            case 'open-ended':
                return (
                    <div className="space-y-6">
                        {/* Question - Swiss Design */}
                        <div className="border-l-4 border-[#880000] pl-4 md:pl-6">
                            <p className="text-base md:text-lg text-slate-700 leading-relaxed">
                                {question.question}
                            </p>
                            {question.hint && (
                                <p className="mt-3 text-sm text-slate-500">
                                    <span className="font-bold">💡 Hint:</span> {question.hint}
                                </p>
                            )}
                        </div>

                        {/* Answer Input - Swiss Design */}
                        <div className="space-y-3">
                            <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Your Answer</label>
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => handleOpenEndedAnswer(e.target.value)}
                                placeholder="Write your answer here..."
                                rows={4}
                                className="w-full px-4 py-3 border border-slate-200 focus:border-[#880000] focus:outline-none transition-all resize-none text-base"
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <>
                <div
                    className={`fixed inset-0 bg-black/50 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                    onClick={handleClose}
                />
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                    <div className="bg-white shadow-2xl max-w-md w-full p-8 md:p-12 pointer-events-auto border-l-4 border-[#880000] flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#880000] animate-spin mb-4"></div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2 uppercase tracking-tight">Generating Assessment</h3>
                        <p className="text-slate-600 text-center text-sm">Creating vocabulary and comprehension questions based on the story.</p>
                    </div>
                </div>
            </>
        );
    }

    // Name Input Modal - Check this FIRST so it can appear over results
    if (showNameInput) {
        return (
            <>
                <div
                    className="fixed inset-0 bg-black/50 z-[60] animate-backdrop-in"
                    onClick={() => setShowNameInput(false)}
                />
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none animate-modal-in">
                    <div className="bg-white shadow-2xl max-w-md w-full p-6 md:p-8 pointer-events-auto border-l-4 border-[#880000]">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-6 h-0.5 bg-[#880000]"></div>
                            <h3 className="text-sm md:text-base font-bold text-slate-800 uppercase tracking-tight">Enter Your Name</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-6">Your name will appear on your achievement card</p>
                        <input
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && studentName.trim() && generateCertificate()}
                            placeholder="Enter your name..."
                            className="w-full px-4 py-3 border border-slate-200 focus:border-[#880000] focus:outline-none transition-all text-base mb-6"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowNameInput(false)}
                                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={generateCertificate}
                                disabled={!studentName.trim()}
                                className="flex-1 px-6 py-3 bg-[#880000] text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Results Screen
    if (showResults) {
        const results = calculateResults();
        const timeTaken = endTime && startTime ? endTime - startTime : 0;

        return (
            <>
                <div
                    className={`fixed inset-0 bg-black/50 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                    onClick={handleClose}
                />
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                    <div className="bg-white shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden pointer-events-auto border-l-4 border-[#880000] flex flex-col">
                        {/* Header - Swiss Design - Compact */}
                        <div className="bg-slate-900 p-3 text-white text-center relative flex-shrink-0">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#880000]"></div>
                            <Trophy size={24} className="mx-auto mb-1 text-[#880000]" />
                            <h2 className="text-sm font-bold uppercase tracking-tight">Assessment Complete</h2>
                            <p className="text-white/60 text-[10px] uppercase tracking-wider truncate">{assessment?.storyInfo?.title}</p>
                        </div>

                        {/* Stats - Swiss Design - Compact */}
                        <div className="p-3 overflow-y-auto flex-1">
                            {/* Score and Time in single row */}
                            <div className="flex gap-2 mb-3">
                                <div className="flex-1 border-l-4 border-green-500 bg-green-50 p-2 flex items-center gap-2">
                                    <Award size={16} className="text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-xl font-bold text-green-700 leading-none">{results.percentage}%</p>
                                        <p className="text-[9px] font-bold text-green-600 uppercase tracking-wider">Score</p>
                                    </div>
                                </div>
                                <div className="flex-1 border-l-4 border-blue-500 bg-blue-50 p-2 flex items-center gap-2">
                                    <Clock size={16} className="text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-xl font-bold text-blue-700 leading-none">{formatTime(timeTaken)}</p>
                                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Time</p>
                                    </div>
                                </div>
                            </div>

                            {/* Correct Answers with Progress Bar - Merged */}
                            <div className="bg-slate-50 p-2 mb-3 border-l-4 border-slate-300">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-slate-600 font-medium text-[10px] uppercase tracking-wider">Correct</span>
                                    <span className="text-slate-800 font-bold text-xs">{results.correct}/{results.total}</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1">
                                    <div
                                        className="bg-[#880000] h-1 transition-all duration-500"
                                        style={{ width: `${results.percentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Performance Message - Compact, No Emoji */}
                            <div className={`p-2 text-center mb-3 border-l-4 ${results.percentage >= 80
                                ? 'border-green-500 bg-green-50'
                                : results.percentage >= 50
                                    ? 'border-amber-500 bg-amber-50'
                                    : 'border-red-500 bg-red-50'
                                }`}>
                                <p className={`font-semibold text-[10px] ${results.percentage >= 80
                                    ? 'text-green-700'
                                    : results.percentage >= 50
                                        ? 'text-amber-700'
                                        : 'text-red-700'
                                    }`}>
                                    {results.percentage >= 80
                                        ? 'Excellent! You understood the story very well!'
                                        : results.percentage >= 50
                                            ? 'Good job! Keep practicing to improve!'
                                            : 'Keep reading! Practice makes perfect!'}
                                </p>
                            </div>

                            {/* Answer Review - Swiss Design - Compact */}
                            <div className="mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-4 h-0.5 bg-[#880000]"></div>
                                    <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Answer Review</h3>
                                </div>
                                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                                    {assessment.sections.map((section, sectionIdx) => (
                                        section.questions.map((question, questionIdx) => {
                                            const key = `${sectionIdx}-${questionIdx}`;
                                            const userAnswer = userAnswers[key]?.toLowerCase().trim();
                                            const correctAnswer = question.answer?.toLowerCase().trim();
                                            const isCorrect = userAnswer === correctAnswer ||
                                                (question.type === 'open-ended' && userAnswer && userAnswer.length > 0) ||
                                                (question.type === 'comprehension' && userAnswer && userAnswer.length > 0);

                                            // Calculate global question number
                                            let globalNum = 1;
                                            for (let i = 0; i < sectionIdx; i++) {
                                                globalNum += assessment.sections[i].questions.length;
                                            }
                                            globalNum += questionIdx;

                                            return (
                                                <div key={key} className={`p-3 border-l-4 ${isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                                                    <div className="flex items-start gap-2 mb-2">
                                                        <span className={`text-xs font-bold px-2 py-0.5 ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            Q{globalNum}
                                                        </span>
                                                        <p className="text-xs text-slate-700 flex-1 leading-relaxed">
                                                            {question.question.length > 80 ? question.question.substring(0, 80) + '...' : question.question}
                                                        </p>
                                                    </div>
                                                    <div className="ml-8 space-y-1">
                                                        <div className="text-xs">
                                                            <span className="font-bold text-slate-500 uppercase tracking-wider">Your answer:</span>
                                                            <span className={`ml-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                                                {userAnswer || '(not answered)'}
                                                            </span>
                                                        </div>
                                                        {!isCorrect && question.type !== 'open-ended' && question.type !== 'comprehension' && (
                                                            <div className="text-xs">
                                                                <span className="font-bold text-slate-500 uppercase tracking-wider">Correct:</span>
                                                                <span className="ml-2 text-green-700">{question.answer}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons - Swiss Design */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        console.log('Share button clicked!');
                                        setShowNameInput(true);
                                    }}
                                    disabled={isGeneratingCertificate}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#880000] text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
                                    style={{ position: 'relative', zIndex: 100 }}
                                >
                                    <Share2 size={14} />
                                    {isGeneratingCertificate ? 'Generating...' : 'Share to Friends'}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={restartAssessment}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
                                    >
                                        <RefreshCw size={14} />
                                        Try Again
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }


    // Main Assessment UI
    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onClick={handleClose}
            />
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="bg-white shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col border-l-4 border-[#880000]">
                    {/* Header - Swiss Design */}
                    <div className="sticky top-0 bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#880000] flex items-center justify-center">
                                <BookOpen size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-base md:text-lg font-bold text-slate-800 uppercase tracking-tight">Reading Assessment</h2>
                                <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider">
                                    {getCurrentSection()?.title}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress Bar - Swiss Design */}
                    <div className="px-4 md:px-6 pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs md:text-sm font-bold text-slate-600 uppercase tracking-wider">
                                Question {getCurrentGlobalQuestion()} of {getTotalQuestions()}
                            </span>
                            <span className="text-xs md:text-sm font-bold text-[#880000]">
                                {Math.round((getCurrentGlobalQuestion() / getTotalQuestions()) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1">
                            <div
                                className="bg-[#880000] h-1 transition-all duration-300"
                                style={{ width: `${(getCurrentGlobalQuestion() / getTotalQuestions()) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Section Instructions - Swiss Design */}
                    <div className="px-4 md:px-6 pt-4">
                        <p className="text-xs md:text-sm text-slate-600 border-l-4 border-[#880000] pl-3 bg-slate-50 py-2 pr-3">
                            {getCurrentSection()?.instructions}
                        </p>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        {renderQuestion()}
                    </div>

                    {/* Navigation Footer - Swiss Design */}
                    <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between flex-shrink-0">
                        <button
                            onClick={goToPrev}
                            disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                            <ChevronLeft size={16} />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        <button
                            onClick={goToNext}
                            disabled={!isAnswered() && getCurrentQuestion()?.type !== 'open-ended' && getCurrentQuestion()?.type !== 'comprehension'}
                            className="flex items-center gap-2 px-6 py-2 bg-[#880000] text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {currentSectionIndex === assessment.sections.length - 1 &&
                                currentQuestionIndex === getCurrentSection().questions.length - 1
                                ? 'Finish'
                                : 'Next'}
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OnlineAssessment;
