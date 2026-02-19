import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ReadingChallenge from './components/ReadingChallenge';
import About from './components/About';
import Donate from './components/Donate';
import NotFound from './components/NotFound';
import ReviewPage from './components/ReviewPage';
import StoryRoulette from './components/StoryRoulette';

// Wrapper to check if path matches reading challenge pattern
const ReadingChallengeWrapper = () => {
    const location = useLocation();

    // If it's the root path, redirect to landing (shouldn't happen but safety check)
    if (location.pathname === '/') {
        return <Navigate to="/" replace />;
    }

    // Check for quiz URL pattern: /quiz-m{month}-day{day}
    const quizMatch = location.pathname.match(/^\/quiz-m(\d+)-day(\d+)$/);
    if (quizMatch) {
        const month = quizMatch[1];
        const day = quizMatch[2];
        // Redirect to reading page with quiz parameter
        return <Navigate to={`/m${month}-day${day}?openQuiz=true`} replace />;
    }

    // Check for reading challenge pattern: /m{month}-day{day}
    const pathMatch = location.pathname.match(/^\/m(\d+)-day(\d+)$/);

    // If path doesn't match reading challenge pattern, redirect to 404
    if (!pathMatch) {
        return <NotFound />;
    }

    return <ReadingChallenge />;
};

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/roulette" element={<StoryRoulette />} />
            {/* Match any path - ReadingChallengeWrapper will check if it's valid */}
            <Route path="/*" element={<ReadingChallengeWrapper />} />
        </Routes>
    );
}

export default App;

