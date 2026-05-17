import { useMatch } from '../context/MatchContext';
import { useState, useMemo } from 'react';
import useFetch from '../hooks/useFetch';
import { fetchPlayerStats } from '../api/matchApi';
import PageShell from '../components/PageShell';

const COLS = [
  { key: 'goals',     label: 'G' },
  { key: 'assists',   label: 'A' },
  { key: 'xg',        label: 'xG' },
  { key: 'shots',     label: 'Shots' },
  { key: 'passes',    label: 'Passes' },
  { key: 'keyPasses', label: 'Key P' },
  { key: 'pressures', label: 'Press' },
  { key: 'dribbles',  label: 'Drb' },
];

const RANK_COLORS = ['var(--gold)', 'var(--silver)', 'var(--bronze)'];

export default function TopPerformers() {
  const { selected } = useMatch();
  const { data, error, loading } = useFetch(fetchPlayerStats, selected.matchId);
  const [sortKey, setSortKey] = useState('xg');
  const [teamFilter, setTeamFilter] = useState('all');

  const team1 = data?.team1;
  const team2 = data?.team2;
  const players = data?.players ?? [];

  const filtered = useMemo(() => players
    .filter(p => teamFilter === 'all' || p.team === teamFilter)
    .filter(p => p.goals > 0 || p.xg > 0 || p.shots > 0 || p.passes > 0 || p.pressures > 0)
    .sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0)),
  [players, teamFilter, sortKey]);

  return (
    <PageShell loading={loading} error={error}>
      {data && (
          <div style={{ padding: '24px 24px 40px' }}>

            {/* Header row */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Top Performers
              </h2>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {['all', team1, team2].map(t => {
                  const isActive = teamFilter === t;
                  const bg = isActive
                    ? (t === team1 ? 'var(--arg)' : t === team2 ? 'var(--fra)' : 'var(--text)')
                    : 'var(--card)';
                  return (
                    <button
                      key={t}
                      onClick={() => setTeamFilter(t)}
                      style={{
                        padding: '5px 12px', borderRadius: 6,
                        border: `1px solid ${isActive ? 'transparent' : 'var(--border)'}`,
                        cursor: 'pointer', fontSize: 11,
                        background: bg,
                        color: isActive ? '#0a0d12' : 'var(--muted)',
                        fontWeight: 600, fontFamily: 'inherit',
                        transition: 'background var(--transition), color var(--transition)',
                      }}
                    >{t === 'all' ? 'All Players' : t}</button>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                      <span className="label">Player</span>
                    </th>
                    <th style={{ padding: '10px 10px', textAlign: 'left' }}>
                      <span className="label">Team</span>
                    </th>
                    {COLS.map(c => (
                      <th
                        key={c.key}
                        onClick={() => setSortKey(c.key)}
                        style={{
                          padding: '10px 10px', textAlign: 'right', cursor: 'pointer',
                          userSelect: 'none', transition: 'color var(--transition)',
                        }}
                      >
                        <span className="label" style={{ color: sortKey === c.key ? 'var(--arg)' : 'var(--muted)' }}>
                          {c.label}
                          {sortKey === c.key && (
                            <span style={{ marginLeft: 3, fontSize: 8 }}>▼</span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const teamColor = p.team === team1 ? 'var(--arg)' : 'var(--fra)';
                    return (
                      <tr
                        key={p.player}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                          transition: 'background var(--transition)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                      >
                        <td style={{ padding: '8px 16px', color: 'var(--text)', fontWeight: i < 3 ? 600 : 400 }}>
                          {i < 3 && (
                            <span style={{
                              display: 'inline-block', width: 6, height: 6,
                              borderRadius: '50%', background: RANK_COLORS[i],
                              marginRight: 8, verticalAlign: 'middle',
                            }} />
                          )}
                          {p.player}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 6px', borderRadius: 4,
                            background: p.team === team1 ? 'var(--arg-dim)' : 'var(--fra-dim)',
                            color: teamColor, fontSize: 10, fontWeight: 700,
                          }}>
                            {p.team.slice(0, 3).toUpperCase()}
                          </span>
                        </td>
                        {COLS.map(col => (
                          <td key={col.key} style={{
                            padding: '8px 10px', textAlign: 'right',
                            color: sortKey === col.key ? teamColor : 'var(--text)',
                            fontWeight: sortKey === col.key ? 700 : 400,
                          }}>
                            {col.key === 'xg' ? Number(p[col.key] ?? 0).toFixed(2) : p[col.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
      )}
    </PageShell>
  );
}
