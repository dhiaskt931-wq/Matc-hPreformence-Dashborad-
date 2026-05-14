import { useMatch } from '../context/MatchContext';
import { useState, useEffect } from 'react';
import { fetchMatch } from '../api/matchApi';
import Header from '../components/Header';
import StatBox from '../components/StatBox';
import TopPlayers from '../components/TopPlayers';
import ShotMap from '../components/ShotMap';
import MatchStats from '../components/MatchStats';
import XGFlow from '../components/XGFlow';
import GKSpotlight from '../components/GKSpotlight';

export default function MatchOverview() {
  const { selected } = useMatch();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatch(selected.matchId)
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'var(--fra-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="var(--fra)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>Failed to load match data</p>
      <p style={{ color: 'var(--muted)', fontSize: 12 }}>{error}</p>
      <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
        Make sure the backend is running:{' '}
        <code style={{ background: 'var(--card)', padding: '2px 7px', borderRadius: 4, fontSize: 11 }}>
          python -m uvicorn main:app --reload --port 8000
        </code>
      </p>
    </div>
  );

  if (!data) return (
    <div style={{ padding: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--arg)"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: 'spin 0.9s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span style={{ color: 'var(--muted)', fontSize: 12 }}>Loading match data…</span>
    </div>
  );

  const { meta, statBoxes, topPlayers, shotMap, matchStats, xgFlow, goalkeepers } = data;
  const { team1, team2 } = meta;

  return (
    <div style={{ padding: '0 20px 40px' }}>
      <Header meta={meta} />

      {/* Top stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <StatBox
          label="Expected Goals (xG)"
          value={`${team1.slice(0,3).toUpperCase()}  ${statBoxes.xg[team1]?.toFixed(2)}  –  ${statBoxes.xg[team2]?.toFixed(2)}  ${team2.slice(0,3).toUpperCase()}`}
        />
        <StatBox
          label="Possession"
          value={`${team1.slice(0,3).toUpperCase()}  ${statBoxes.possession[team1]?.toFixed(1)}%  –  ${statBoxes.possession[team2]?.toFixed(1)}%  ${team2.slice(0,3).toUpperCase()}`}
        />
        <StatBox
          label="Shots on Target"
          value={`${team1.slice(0,3).toUpperCase()}  ${statBoxes.shotsOnTarget[team1]}  –  ${statBoxes.shotsOnTarget[team2]}  ${team2.slice(0,3).toUpperCase()}`}
        />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10, alignItems: 'start' }}>
        <TopPlayers players={topPlayers[team1] ?? []} color="var(--arg)" title={`Top Players – ${team1}`} />
        <ShotMap shots={shotMap} team1={team1} team2={team2} />
        <TopPlayers players={topPlayers[team2] ?? []} color="var(--fra)" title={`Top Players – ${team2}`} />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'start' }}>
        <MatchStats stats={matchStats} team1={team1} team2={team2} />
        <XGFlow flow={xgFlow} team1={team1} team2={team2} />
        <GKSpotlight goalkeepers={goalkeepers} team1={team1} team2={team2} />
      </div>
    </div>
  );
}
