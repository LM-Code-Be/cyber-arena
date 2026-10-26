import React from 'react';
import { Navigate, Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import { GameProvider } from './contexts/GameContext';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <GameProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </GameProvider>
    </Router>
  );
}

export default App;
