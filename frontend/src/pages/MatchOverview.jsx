import { useState, useEffect } from 'react';
import { fetchMatch } from '../api/matchApi';
import Header from '../components/Header';
import StatBox from '../components/StatBox';
import TopPlayers from '../components/TopPlayers';
import ShotMap from '../components/ShotMap';
import MatchStats from '../components/MatchStats';
import XGFlow from '../components/XGFlow';
import GKSpotlight from '../components/GKSpotlight';

const MATCH_ID = 3869685;

const grid3 = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 12,
};

export default function MatchOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatch(MATCH_ID)
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div style={{ padding: 40, color: 'var(--fra)', textAlign: 'center' }}>
      <p style={{ fontWeight: 700, marginBottom: 8 }}>Failed to load data</p>
      <p style={{ color: 'var(--muted)', fontSize: 12 }}>{error}</p>
      <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
        Make sure the backend is running:{' '}
        <code style={{ background: 'var(--card)', padding: '2px 6px', borderRadius: 4 }}>
          python -m uvicorn main:app --reload --port 8000
        </code>
      </p>
    </div>
  );

  if (!data) return (
    <div style={{ padding: 40, color: 'var(--muted)', textAlign: 'center' }}>
      Loading match data…
    </div>
  );

  const { meta, statBoxes, topPlayers, shotMap, matchStats, xgFlow, goalkeepers } = data;
  const { team1, team2 } = meta;

  return (
    <div style={{ padding: '0 16px 32px' }}>
      <Header meta={meta} />

      <div style={{ ...grid3, marginBottom: 12 }}>
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

      <div style={{ ...grid3, marginBottom: 12, alignItems: 'start' }}>
        <TopPlayers players={topPlayers[team1] ?? []} color="var(--arg)" title={`Top Players – ${team1}`} />
        <ShotMap shots={shotMap} team1={team1} team2={team2} />
        <TopPlayers players={topPlayers[team2] ?? []} color="var(--fra)" title={`Top Players – ${team2}`} />
      </div>

      <div style={{ ...grid3, alignItems: 'start' }}>
        <MatchStats stats={matchStats} team1={team1} team2={team2} />
        <XGFlow flow={xgFlow} team1={team1} team2={team2} />
        <GKSpotlight goalkeepers={goalkeepers} team1={team1} team2={team2} />
      </div>
    </div>
  );
}
