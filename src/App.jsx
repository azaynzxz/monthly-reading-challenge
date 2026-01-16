import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ReadingChallenge from './components/ReadingChallenge';
import About from './components/About';
import Donate from './components/Donate';
import NotFound from './components/NotFound';

// Wrapper to check if path matches reading challenge pattern
const ReadingChallengeWrapper = () => {
    const location = useLocation();

    // If it's the root path, redirect to landing (shouldn't happen but safety check)
    if (location.pathname === '/') {
        return <Navigate to="/" replace />;
    }

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
            {/* Match any path - ReadingChallengeWrapper will check if it's valid */}
            <Route path="/*" element={<ReadingChallengeWrapper />} />
        </Routes>
    );
}

export default App;

