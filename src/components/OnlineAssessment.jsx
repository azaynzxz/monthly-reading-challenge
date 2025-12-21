import React, { useState, useEffect } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Award, BookOpen, RefreshCw, Trophy, Clock, Loader2 } from 'lucide-react';
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
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

    // Render question based on type
    const renderQuestion = () => {
        const question = getCurrentQuestion();
        if (!question) return null;

        const currentAnswer = getCurrentAnswer();

        switch (question.type) {
            case 'fill-blank':
                return (
                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <p className="text-lg text-slate-700 leading-relaxed font-medium">
                                {question.question}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wide">Your Answer</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={fillBlankInput}
                                    onChange={(e) => setFillBlankInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fillBlankInput && handleFillBlankAnswer()}
                                    placeholder="Type the missing word..."
                                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#880000] focus:ring-2 focus:ring-[#880000]/20 outline-none transition-all text-lg"
                                    autoFocus
                                />
                                <button
                                    onClick={handleFillBlankAnswer}
                                    disabled={!fillBlankInput.trim()}
                                    className="px-6 py-3 bg-[#880000] text-white rounded-xl font-semibold hover:bg-[#770000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Submit
                                </button>
                            </div>
                            {currentAnswer && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 ${currentAnswer === question.answer?.toLowerCase().trim() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    {currentAnswer === question.answer?.toLowerCase().trim()
                                        ? <Check size={20} className="text-green-600" />
                                        : <X size={20} className="text-red-600" />
                                    }
                                    <span className={currentAnswer === question.answer?.toLowerCase().trim() ? 'text-green-700' : 'text-red-700'}>
                                        Your answer: <strong>{currentAnswer}</strong>
                                        {currentAnswer !== question.answer?.toLowerCase().trim() && (
                                            <span className="ml-2">| Correct answer: <strong>{question.answer}</strong></span>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                        {assessment?.wordBank && (
                            <div className="pt-4 border-t border-slate-200">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Word Bank (Hint)</p>
                                <div className="flex flex-wrap gap-2">
                                    {assessment.wordBank.map((word, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">{word}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'vocabulary-mc':
                return (
                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <p className="text-lg text-slate-700 leading-relaxed">
                                {question.question}
                            </p>
                            {question.partOfSpeech && (
                                <span className="inline-block mt-3 px-3 py-1 bg-[#880000]/10 text-[#880000] rounded-full text-sm font-medium">
                                    {question.partOfSpeech}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {question.options.map((option, idx) => {
                                const isSelected = currentAnswer === option;
                                const isCorrect = option === question.answer;
                                const showFeedback = currentAnswer !== '';

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleMCAnswer(option)}
                                        disabled={currentAnswer !== ''}
                                        className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${showFeedback
                                            ? isCorrect
                                                ? 'border-green-400 bg-green-50 text-green-700'
                                                : isSelected
                                                    ? 'border-red-400 bg-red-50 text-red-700'
                                                    : 'border-slate-200 bg-white text-slate-600'
                                            : isSelected
                                                ? 'border-[#880000] bg-[#880000]/5 text-[#880000]'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${showFeedback
                                                ? isCorrect
                                                    ? 'bg-green-200 text-green-700'
                                                    : isSelected
                                                        ? 'bg-red-200 text-red-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                : isSelected
                                                    ? 'bg-[#880000] text-white'
                                                    : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="capitalize">{option}</span>
                                            {showFeedback && isCorrect && <Check size={20} className="ml-auto text-green-600" />}
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
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <p className="text-lg text-slate-700 leading-relaxed">
                                {question.question}
                            </p>
                            {question.hint && (
                                <p className="mt-3 text-sm text-slate-500 italic">
                                    💡 Hint: {question.hint}
                                </p>
                            )}
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wide">Your Answer</label>
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => handleOpenEndedAnswer(e.target.value)}
                                placeholder="Write your answer here..."
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#880000] focus:ring-2 focus:ring-[#880000]/20 outline-none transition-all resize-none"
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
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-12 pointer-events-auto flex flex-col items-center justify-center">
                        <Loader2 size={48} className="text-[#880000] animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Generating Assessment...</h3>
                        <p className="text-slate-600 text-center">We're creating vocabulary and comprehension questions based on the story.</p>
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
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden pointer-events-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#880000] to-[#aa0000] p-8 text-white text-center">
                            <Trophy size={64} className="mx-auto mb-4" />
                            <h2 className="text-3xl font-bold mb-2">Assessment Complete!</h2>
                            <p className="text-white/80">Story: {assessment?.storyInfo?.title}</p>
                        </div>

                        {/* Stats */}
                        <div className="p-8">
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                                    <Award size={32} className="mx-auto text-green-600 mb-2" />
                                    <p className="text-4xl font-bold text-green-700">{results.percentage}%</p>
                                    <p className="text-sm text-green-600 font-medium">Score</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                                    <Clock size={32} className="mx-auto text-blue-600 mb-2" />
                                    <p className="text-4xl font-bold text-blue-700">{formatTime(timeTaken)}</p>
                                    <p className="text-sm text-blue-600 font-medium">Time Taken</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-600 font-medium">Correct Answers</span>
                                    <span className="text-slate-800 font-bold">{results.correct} / {results.total}</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-3">
                                    <div
                                        className="bg-[#880000] h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${results.percentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Performance Message */}
                            <div className={`p-4 rounded-xl text-center mb-6 ${results.percentage >= 80
                                ? 'bg-green-50 border border-green-200'
                                : results.percentage >= 50
                                    ? 'bg-amber-50 border border-amber-200'
                                    : 'bg-red-50 border border-red-200'
                                }`}>
                                <p className={`font-semibold ${results.percentage >= 80
                                    ? 'text-green-700'
                                    : results.percentage >= 50
                                        ? 'text-amber-700'
                                        : 'text-red-700'
                                    }`}>
                                    {results.percentage >= 80
                                        ? '🎉 Excellent! You understood the story very well!'
                                        : results.percentage >= 50
                                            ? '👍 Good job! Keep practicing to improve!'
                                            : '📚 Keep reading! Practice makes perfect!'}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={restartAssessment}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    <RefreshCw size={18} />
                                    Try Again
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-6 py-3 bg-[#880000] text-white rounded-xl font-semibold hover:bg-[#770000] transition-colors"
                                >
                                    Done
                                </button>
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
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#880000]/10 rounded-full flex items-center justify-center">
                                <BookOpen size={20} className="text-[#880000]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Reading Assessment</h2>
                                <p className="text-xs text-slate-500">
                                    {getCurrentSection()?.title}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-6 pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">
                                Question {getCurrentGlobalQuestion()} of {getTotalQuestions()}
                            </span>
                            <span className="text-sm font-semibold text-[#880000]">
                                {Math.round((getCurrentGlobalQuestion() / getTotalQuestions()) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-[#880000] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(getCurrentGlobalQuestion() / getTotalQuestions()) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Section Instructions */}
                    <div className="px-6 pt-4">
                        <p className="text-sm text-slate-600 italic border-l-4 border-[#880000] pl-3 bg-slate-50 py-2 pr-3 rounded-r-lg">
                            {getCurrentSection()?.instructions}
                        </p>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {renderQuestion()}
                    </div>

                    {/* Navigation Footer */}
                    <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                        <button
                            onClick={goToPrev}
                            disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                            Previous
                        </button>

                        <button
                            onClick={goToNext}
                            disabled={!isAnswered() && getCurrentQuestion()?.type !== 'open-ended' && getCurrentQuestion()?.type !== 'comprehension'}
                            className="flex items-center gap-2 px-6 py-2 bg-[#880000] text-white rounded-lg font-semibold hover:bg-[#770000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {currentSectionIndex === assessment.sections.length - 1 &&
                                currentQuestionIndex === getCurrentSection().questions.length - 1
                                ? 'Finish'
                                : 'Next'}
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OnlineAssessment;
