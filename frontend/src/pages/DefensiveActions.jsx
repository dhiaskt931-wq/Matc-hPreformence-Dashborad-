import { useMatch } from '../context/MatchContext';
import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { fetchDefensive } from '../api/matchApi';
import PageShell, { EventDataRequired } from '../components/PageShell';
import PitchBase from '../components/PitchBase';

const VW = 480, VH = 320, PW = 120, PH = 80;

const ACTION_CONFIG = {
  pressure:      { color: '#f0c040', label: 'Pressure',      r: 0.8 },
  interception:  { color: '#5b9bd5', label: 'Interception',  r: 1.2 },
  clearance:     { color: '#5a6478', label: 'Clearance',     r: 1.1 },
  block:         { color: '#d94f5c', label: 'Block',         r: 1.3 },
  tackle:        { color: '#4ade80', label: 'Tackle',        r: 1.2 },
};

export default function DefensiveActions() {
  const { selected, features } = useMatch();
  const { data, error, loading } = useFetch(fetchDefensive, selected.matchId);
  const [activeTypes, setActiveTypes] = useState(new Set(['interception', 'clearance', 'block', 'tackle']));
  const [activeTeam, setActiveTeam] = useState('all');

  const toggle = (type) => {
    const next = new Set(activeTypes);
    next.has(type) ? next.delete(type) : next.add(type);
    setActiveTypes(next);
  };

  // Guard AFTER all hooks
  if (features?.features?.['defensive'] === 'unavailable') {
    return <EventDataRequired source={features.source} />;
  }

  return (
    <PageShell loading={loading} error={error}>
      {data && (() => {
        const { team1, team2, actions, counts } = data;
        const teams = [team1, team2];
        const colors = ['#5b9bd5', '#d94f5c'];

        const visible = actions.filter(a =>
          activeTypes.has(a.type) &&
          (activeTeam === 'all' || a.team === activeTeam)
        );

        return (
          <div style={{ padding: '20px 20px 32px' }}>
            <div className="label" style={{ marginBottom: 14 }}>Defensive Actions</div>

            {/* filters */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)', fontSize: 10, marginRight: 4 }}>TEAM</span>
              {['all', ...teams].map((t, i) => (
                <button key={t} onClick={() => setActiveTeam(t)} style={{
                  padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11,
                  background: activeTeam === t ? (t === team1 ? '#5b9bd5' : t === team2 ? '#d94f5c' : 'var(--text)') : 'var(--card)',
                  color: activeTeam === t ? '#0a0d12' : 'var(--muted)', fontWeight: 600,
                }}>{t === 'all' ? 'Both' : t}</button>
              ))}
              <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
              <span style={{ color: 'var(--muted)', fontSize: 10, marginRight: 4 }}>ACTION</span>
              {Object.entries(ACTION_CONFIG).map(([type, cfg]) => (
                <button key={type} onClick={() => toggle(type)} style={{
                  padding: '4px 10px', borderRadius: 5, border: `1px solid ${cfg.color}`, cursor: 'pointer', fontSize: 11,
                  background: activeTypes.has(type) ? cfg.color : 'transparent',
                  color: activeTypes.has(type) ? '#0a0d12' : cfg.color, fontWeight: 600,
                }}>{cfg.label}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <svg viewBox={`0 0 ${VW} ${VH}`}
                  style={{ width: '100%', background: '#0a0d12', display: 'block' }}
                  preserveAspectRatio="xMidYMid meet">
                  <g transform={`scale(${VW / PW},${VH / PH})`}>
                    <PitchBase />
                    {visible.map((a, i) => {
                      const cfg = ACTION_CONFIG[a.type] ?? { color: '#5a6478', r: 0.9 };
                      return (
                        <circle key={i}
                          cx={a.x} cy={a.y} r={cfg.r}
                          fill={cfg.color} opacity={0.75} />
                      );
                    })}
                  </g>
                </svg>
              </div>

              {/* counts per team */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {teams.map((team, ti) => {
                  const c = colors[ti];
                  const tc = counts[team] ?? {};
                  return (
                    <div key={team} className="card">
                      <div style={{ color: c, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{team}</div>
                      {Object.entries(ACTION_CONFIG).map(([type, cfg]) => (
                        <div key={type} style={{ marginBottom: 7 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 11, color: activeTypes.has(type) ? cfg.color : 'var(--muted)' }}>{cfg.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: activeTypes.has(type) ? cfg.color : 'var(--muted)' }}>
                              {tc[type] ?? 0}
                            </span>
                          </div>
                          <div style={{ height: 3, borderRadius: 2, background: 'var(--border)' }}>
                            <div style={{
                              height: '100%', borderRadius: 2,
                              background: activeTypes.has(type) ? cfg.color : 'var(--border)',
                              width: `${Math.min(100, ((tc[type] ?? 0) / 200) * 100)}%`,
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 11 }}>
              Showing {visible.length} events
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
