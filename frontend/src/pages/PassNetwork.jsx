import { useMatch } from '../context/MatchContext';
import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { fetchPassNetwork } from '../api/matchApi';
import PageShell, { EventDataRequired } from '../components/PageShell';
import PitchBase from '../components/PitchBase';

const VW = 480, VH = 320, PW = 120, PH = 80;
const sx = VW / PW, sy = VH / PH;

function Network({ nodes, edges, color }) {
  const maxEdge = Math.max(1, ...edges.map(e => e.count));
  const maxTouch = Math.max(1, ...nodes.map(n => n.touches));
  const nodeMap = Object.fromEntries(nodes.map(n => [n.player, n]));

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', background: '#0a0d12', borderRadius: 4 }}
         preserveAspectRatio="xMidYMid meet">
      <g transform={`scale(${sx},${sy})`}>
        <PitchBase />
        {/* edges */}
        {edges.map((e, i) => {
          const from = nodeMap[e.from];
          const to = nodeMap[e.to];
          if (!from || !to) return null;
          const w = 0.3 + (e.count / maxEdge) * 2.2;
          const alpha = 0.15 + (e.count / maxEdge) * 0.7;
          return (
            <line key={i}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={color} strokeWidth={w} opacity={alpha} />
          );
        })}
        {/* nodes */}
        {nodes.map(n => {
          const r = 1.8 + (n.touches / maxTouch) * 3.2;
          return (
            <g key={n.player}>
              <circle cx={n.x} cy={n.y} r={r} fill={color} opacity={0.9} />
              <text x={n.x} y={n.y - r - 0.8} textAnchor="middle"
                fontSize="2.2" fill="#e6edf3" opacity={0.85}>
                {n.player.split(' ').pop()}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default function PassNetwork() {
  const { selected, features } = useMatch();
  const { data, error, loading } = useFetch(fetchPassNetwork, selected.matchId);
  const [activeTeam, setActiveTeam] = useState(0);

  // Guard AFTER all hooks
  if (features?.features?.['pass-network'] === 'unavailable') {
    return <EventDataRequired source={features.source} />;
  }

  return (
    <PageShell loading={loading} error={error}>
      {data && (() => {
        const { team1, team2, networks } = data;
        const teams = [team1, team2];
        const colors = ['#5b9bd5', '#d94f5c'];
        const team = teams[activeTeam];
        const net = networks[team] ?? { nodes: [], edges: [] };

        // top passing pairs table
        const topPairs = [...(net.edges ?? [])]
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        return (
          <div style={{ padding: '20px 20px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div className="label">Pass Network</div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                {teams.map((t, i) => (
                  <button key={t} onClick={() => setActiveTeam(i)} style={{
                    padding: '5px 14px', borderRadius: 5, border: 'none', cursor: 'pointer',
                    background: activeTeam === i ? colors[i] : 'var(--card)',
                    color: activeTeam === i ? '#0a0d12' : 'var(--muted)',
                    fontWeight: 700, fontSize: 12,
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <Network nodes={net.nodes} edges={net.edges} color={colors[activeTeam]} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* top players by touch */}
                <div className="card">
                  <div className="label" style={{ marginBottom: 10 }}>Top Players by Touches</div>
                  {[...(net.nodes ?? [])].sort((a, b) => b.touches - a.touches).slice(0, 6).map((n) => {
                    const pct = (n.touches / Math.max(1, ...net.nodes.map(x => x.touches))) * 100;
                    return (
                      <div key={n.player} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 11, color: 'var(--text)' }}>{n.player.split(' ').slice(-1)[0]}</span>
                          <span style={{ fontSize: 11, color: colors[activeTeam] }}>{n.touches}</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: 'var(--border)' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: colors[activeTeam], borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* top passing pairs */}
                <div className="card">
                  <div className="label" style={{ marginBottom: 10 }}>Top Passing Combos</div>
                  {topPairs.map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.from.split(' ').slice(-1)[0]} → {e.to.split(' ').slice(-1)[0]}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: colors[activeTeam],
                        background: 'var(--border)', borderRadius: 4, padding: '1px 6px', marginLeft: 6,
                      }}>{e.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
