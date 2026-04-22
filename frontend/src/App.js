import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import PlayGame from './pages/PlayGame';
import TrainModel from './pages/TrainModel';
import VisualizeModel from './pages/VisualizeModel';
import SavedModels from './pages/SavedModels';
import Leaderboard from './pages/Leaderboard';
import About from './pages/About';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/play" element={<PlayGame />} />
              <Route path="/train" element={<TrainModel />} />
              <Route path="/visualize" element={<VisualizeModel />} />
              <Route path="/models" element={<SavedModels />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </ErrorBoundary>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}