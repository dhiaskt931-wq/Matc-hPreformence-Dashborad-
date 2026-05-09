import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MatchOverview from './pages/MatchOverview';
import ComingSoon from './pages/ComingSoon';

const SOON_PATHS = [
  '/xg-timeline', '/shot-analysis', '/pass-network',
  '/heatmaps', '/top-stats', '/duels',
  '/defensive', '/set-pieces', '/momentum',
];

function Layout() {
  const { pathname } = useLocation();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <Routes>
          <Route path="/" element={<MatchOverview />} />
          {SOON_PATHS.map(p => (
            <Route key={p} path={p} element={<ComingSoon path={p} />} />
          ))}
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
