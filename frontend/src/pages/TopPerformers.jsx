import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { fetchPlayerStats } from '../api/matchApi';
import PageShell from '../components/PageShell';

const MATCH_ID = 3869685;

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

export default function TopPerformers() {
  const { data, error, loading } = useFetch(fetchPlayerStats, MATCH_ID);
  const [sortKey, setSortKey] = useState('xg');
  const [teamFilter, setTeamFilter] = useState('all');

  return (
    <PageShell loading={loading} error={error}>
      {data && (() => {
        const { team1, team2, players } = data;

        const filtered = players
          .filter(p => teamFilter === 'all' || p.team === teamFilter)
          .filter(p => Object.values({ goals: p.goals, xg: p.xg, shots: p.shots, passes: p.passes, pressures: p.pressures }).some(v => v > 0))
          .sort((a, b) => b[sortKey] - a[sortKey]);

        return (
          <div style={{ padding: '20px 20px 32px' }}>
            {/* controls */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <div className="label">Top Performers</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {['all', team1, team2].map(t => (
                  <button key={t} onClick={() => setTeamFilter(t)} style={{
                    padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11,
                    background: teamFilter === t ? (t === team1 ? '#75AADB' : t === team2 ? '#EF3340' : 'var(--text)') : 'var(--card)',
                    color: teamFilter === t ? '#0d1117' : 'var(--muted)', fontWeight: 600,
                  }}>{t === 'all' ? 'All' : t}</button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--muted)', fontWeight: 700, fontSize: 10 }}>Player</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', color: 'var(--muted)', fontWeight: 700, fontSize: 10 }}>Team</th>
                    {COLS.map(c => (
                      <th key={c.key} onClick={() => setSortKey(c.key)} style={{
                        padding: '10px 10px', textAlign: 'right', cursor: 'pointer',
                        color: sortKey === c.key ? 'var(--arg)' : 'var(--muted)',
                        fontWeight: 700, fontSize: 10, userSelect: 'none',
                      }}>{c.label} {sortKey === c.key ? '▼' : ''}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const c = p.team === team1 ? '#75AADB' : '#EF3340';
                    return (
                      <tr key={p.player} style={{
                        borderBottom: '1px solid var(--border)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      }}>
                        <td style={{ padding: '8px 14px', color: 'var(--text)', fontWeight: i < 3 ? 700 : 400 }}>
                          {i < 3 && <span style={{ fontSize: 9, marginRight: 4, color: ['var(--gold)', 'var(--silver)', 'var(--bronze)'][i] }}>●</span>}
                          {p.player}
                        </td>
                        <td style={{ padding: '8px 10px', color: c, fontSize: 10, fontWeight: 700 }}>
                          {p.team.slice(0, 3).toUpperCase()}
                        </td>
                        {COLS.map(col => (
                          <td key={col.key} style={{
                            padding: '8px 10px', textAlign: 'right',
                            color: sortKey === col.key ? c : 'var(--text)',
                            fontWeight: sortKey === col.key ? 700 : 400,
                          }}>
                            {col.key === 'xg' ? p[col.key].toFixed(2) : p[col.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
