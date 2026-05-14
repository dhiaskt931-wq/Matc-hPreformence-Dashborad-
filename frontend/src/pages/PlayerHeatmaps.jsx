import { useMatch } from '../context/MatchContext';
import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { fetchHeatmap } from '../api/matchApi';
import PageShell from '../components/PageShell';
import GridHeatmap from '../components/GridHeatmap';


function PlayerSelect({ players, selected, onChange, color }) {
  const sorted = Object.entries(players).sort((a, b) => b[1].count - a[1].count);
  return (
    <select value={selected} onChange={e => onChange(e.target.value)} style={{
      background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)',
      borderRadius: 5, padding: '5px 8px', fontSize: 12, width: '100%', outline: 'none',
    }}>
      {sorted.map(([name, info]) => (
        <option key={name} value={name}>{name} ({info.count})</option>
      ))}
    </select>
  );
}

export default function PlayerHeatmaps() {
  const { selected } = useMatch();
  const { data, error, loading } = useFetch(fetchHeatmap, selected.matchId);
  const [sel1, setSel1] = useState(null);
  const [sel2, setSel2] = useState(null);

  return (
    <PageShell loading={loading} error={error}>
      {data && (() => {
        const { team1, team2, players } = data;
        const p1 = players[team1] ?? {};
        const p2 = players[team2] ?? {};

        const player1 = sel1 ?? Object.keys(p1)[0];
        const player2 = sel2 ?? Object.keys(p2)[0];

        const touches1 = p1[player1]?.touches ?? [];
        const touches2 = p2[player2]?.touches ?? [];

        return (
          <div style={{ padding: '20px 20px 32px' }}>
            <div className="label" style={{ marginBottom: 16 }}>Player Heatmaps — Touch Density</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { team: team1, players: p1, sel: player1, setSel: setSel1, color: '#5b9bd5', touches: touches1 },
                { team: team2, players: p2, sel: player2, setSel: setSel2, color: '#d94f5c', touches: touches2 },
              ].map(({ team, players: pMap, sel, setSel, color, touches }) => (
                <div key={team}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 3, height: 16, background: color, borderRadius: 2 }} />
                    <span style={{ color, fontWeight: 700, fontSize: 13 }}>{team}</span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <PlayerSelect players={pMap} selected={sel} onChange={setSel} color={color} />
                  </div>
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <GridHeatmap touches={touches} color={color} height={240} />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 14 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                      Total touches: <strong style={{ color }}>{touches.length}</strong>
                    </span>
                    {touches.length > 0 && (() => {
                      const avgX = (touches.reduce((s, t) => s + t.x, 0) / touches.length).toFixed(1);
                      const avgY = (touches.reduce((s, t) => s + t.y, 0) / touches.length).toFixed(1);
                      const zone = avgX < 40 ? 'Defensive' : avgX < 80 ? 'Mid' : 'Attacking';
                      return <span style={{ color: 'var(--muted)', fontSize: 11 }}>Avg pos: ({avgX}, {avgY}) — <strong style={{ color }}>{zone}</strong></span>;
                    })()}
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div className="label" style={{ marginBottom: 10 }}>All Players — Touch Count</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[{ team: team1, pMap: p1, color: '#5b9bd5' }, { team: team2, pMap: p2, color: '#d94f5c' }].map(({ team, pMap, color }) => (
                  <div key={team}>
                    <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>{team}</div>
                    {Object.entries(pMap).sort((a, b) => b[1].count - a[1].count).map(([name, info]) => {
                      const maxC = Object.values(pMap).reduce((m, v) => Math.max(m, v.count), 1);
                      return (
                        <div key={name} style={{ marginBottom: 5 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 10, color: 'var(--text)' }}>{name.split(' ').slice(-1)[0]}</span>
                            <span style={{ fontSize: 10, color }}>{info.count}</span>
                          </div>
                          <div style={{ height: 3, borderRadius: 2, background: 'var(--border)' }}>
                            <div style={{ height: '100%', width: `${(info.count / maxC) * 100}%`, background: color, borderRadius: 2 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
