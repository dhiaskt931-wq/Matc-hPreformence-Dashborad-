import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MatchProvider } from './context/MatchContext';
import Sidebar from './components/Sidebar';
import MatchOverview    from './pages/MatchOverview';
import XGTimeline       from './pages/XGTimeline';
import ShotAnalysis     from './pages/ShotAnalysis';
import PassNetwork      from './pages/PassNetwork';
import PlayerHeatmaps   from './pages/PlayerHeatmaps';
import TopPerformers    from './pages/TopPerformers';
import DuelsPressure    from './pages/DuelsPressure';
import DefensiveActions from './pages/DefensiveActions';
import SetPieces        from './pages/SetPieces';
import MomentumChart    from './pages/MomentumChart';
import GameSelector     from './pages/GameSelector';

function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <Routes>
          <Route path="/"              element={<MatchOverview />} />
          <Route path="/games"         element={<GameSelector />} />
          <Route path="/xg-timeline"   element={<XGTimeline />} />
          <Route path="/shot-analysis" element={<ShotAnalysis />} />
          <Route path="/pass-network"  element={<PassNetwork />} />
          <Route path="/heatmaps"      element={<PlayerHeatmaps />} />
          <Route path="/top-stats"     element={<TopPerformers />} />
          <Route path="/duels"         element={<DuelsPressure />} />
          <Route path="/defensive"     element={<DefensiveActions />} />
          <Route path="/set-pieces"    element={<SetPieces />} />
          <Route path="/momentum"      element={<MomentumChart />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MatchProvider>
        <Layout />
      </MatchProvider>
    </BrowserRouter>
  );
}
