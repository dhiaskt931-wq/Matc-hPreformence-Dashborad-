import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MatchProvider } from './context/MatchContext';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';

const MatchOverview    = lazy(() => import('./pages/MatchOverview'));
const XGTimeline       = lazy(() => import('./pages/XGTimeline'));
const ShotAnalysis     = lazy(() => import('./pages/ShotAnalysis'));
const PassNetwork      = lazy(() => import('./pages/PassNetwork'));
const PlayerHeatmaps   = lazy(() => import('./pages/PlayerHeatmaps'));
const TopPerformers    = lazy(() => import('./pages/TopPerformers'));
const DuelsPressure    = lazy(() => import('./pages/DuelsPressure'));
const DefensiveActions = lazy(() => import('./pages/DefensiveActions'));
const SetPieces        = lazy(() => import('./pages/SetPieces'));
const MomentumChart    = lazy(() => import('./pages/MomentumChart'));
const GameSelector     = lazy(() => import('./pages/GameSelector'));

function PageFallback() {
  return (
    <div style={{ padding: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="20" cy="20" r="17" stroke="rgba(96,165,250,0.12)" strokeWidth="3" />
        <path d="M20 3a17 17 0 0 1 17 17" stroke="var(--arg)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function RouteWithBoundary({ element }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        {element}
      </Suspense>
    </ErrorBoundary>
  );
}

function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <ScrollToTop />
      <main id="main-content" style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <Routes>
          <Route path="/"              element={<RouteWithBoundary element={<MatchOverview />} />} />
          <Route path="/games"         element={<RouteWithBoundary element={<GameSelector />} />} />
          <Route path="/xg-timeline"   element={<RouteWithBoundary element={<XGTimeline />} />} />
          <Route path="/shot-analysis" element={<RouteWithBoundary element={<ShotAnalysis />} />} />
          <Route path="/pass-network"  element={<RouteWithBoundary element={<PassNetwork />} />} />
          <Route path="/heatmaps"      element={<RouteWithBoundary element={<PlayerHeatmaps />} />} />
          <Route path="/top-stats"     element={<RouteWithBoundary element={<TopPerformers />} />} />
          <Route path="/duels"         element={<RouteWithBoundary element={<DuelsPressure />} />} />
          <Route path="/defensive"     element={<RouteWithBoundary element={<DefensiveActions />} />} />
          <Route path="/set-pieces"    element={<RouteWithBoundary element={<SetPieces />} />} />
          <Route path="/momentum"      element={<RouteWithBoundary element={<MomentumChart />} />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <a
        href="#main-content"
        style={{ position: 'absolute', left: '-9999px' }}
        onFocus={e => { e.target.style.left = '0'; }}
        onBlur={e => { e.target.style.left = '-9999px'; }}
      >
        Skip to main content
      </a>
      <MatchProvider>
        <Layout />
      </MatchProvider>
    </BrowserRouter>
  );
}
