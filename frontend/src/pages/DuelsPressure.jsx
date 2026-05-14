import { useMatch } from '../context/MatchContext';
import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { fetchPressure } from '../api/matchApi';
import PageShell from '../components/PageShell';
import GridHeatmap from '../components/GridHeatmap';


export default function DuelsPressure() {
  const { selected } = useMatch();
  const { data, error, loading } = useFetch(fetchPressure, selected.matchId);
  const [activePressTeam, setActivePressTeam] = useState(0);

  return (
    <PageShell loading={loading} error={error}>
      {data && (() => {
        const { team1, team2, pressures, duels, ppda } = data;
        const teams = [team1, team2];
        const colors = ['#5b9bd5', '#d94f5c'];
        const activeTeam = teams[activePressTeam];
        const teamPressures = pressures.filter(p => p.team === activeTeam);

        return (
          <div style={{ padding: '20px 20px 32px' }}>
            <div className="label" style={{ marginBottom: 16 }}>Duels & Pressure</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* pressure heatmap */}
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {teams.map((t, i) => (
                    <button key={t} onClick={() => setActivePressTeam(i)} style={{
                      padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11,
                      background: activePressTeam === i ? colors[i] : 'var(--card)',
                      color: activePressTeam === i ? '#0a0d12' : 'var(--muted)', fontWeight: 600,
                    }}>{t} Pressure</button>
                  ))}
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <GridHeatmap touches={teamPressures} color={colors[activePressTeam]} height={260} />
                </div>
                <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 11 }}>
                  {teamPressures.length} pressure events · darker = more concentrated pressing
                </div>
              </div>

              {/* duel stats + PPDA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* duel comparison */}
                <div className="card">
                  <div className="label" style={{ marginBottom: 12 }}>Duels</div>
                  {teams.map((team, i) => {
                    const d = duels[team] ?? {};
                    const c = colors[i];
                    return (
                      <div key={team} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: c, fontWeight: 700, fontSize: 12 }}>{team}</span>
                          <span style={{ color: 'var(--muted)', fontSize: 11 }}>{d.total ?? 0} total</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                          <div style={{ flex: 1, background: 'var(--border)', borderRadius: 5, padding: '6px 10px', textAlign: 'center' }}>
                            <div style={{ color: c, fontWeight: 700, fontSize: 18 }}>{d.won ?? 0}</div>
                            <div style={{ color: 'var(--muted)', fontSize: 9 }}>WON</div>
                          </div>
                          <div style={{ flex: 1, background: 'var(--border)', borderRadius: 5, padding: '6px 10px', textAlign: 'center' }}>
                            <div style={{ color: 'var(--muted)', fontWeight: 700, fontSize: 18 }}>{d.lost ?? 0}</div>
                            <div style={{ color: 'var(--muted)', fontSize: 9 }}>LOST</div>
                          </div>
                          <div style={{ flex: 1, background: 'var(--border)', borderRadius: 5, padding: '6px 10px', textAlign: 'center' }}>
                            <div style={{ color: c, fontWeight: 700, fontSize: 18 }}>{d.winPct ?? 0}%</div>
                            <div style={{ color: 'var(--muted)', fontSize: 9 }}>WIN%</div>
                          </div>
                        </div>
                        {/* duel win bar */}
                        <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${d.winPct ?? 0}%`, background: c, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PPDA */}
                <div className="card">
                  <div className="label" style={{ marginBottom: 10 }}>PPDA</div>
                  <div style={{ color: 'var(--muted)', fontSize: 10, marginBottom: 10, lineHeight: 1.5 }}>
                    Passes Per Defensive Action — lower = more intense pressing
                  </div>
                  {teams.map((team, i) => (
                    <div key={team} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: colors[i], fontWeight: 600, fontSize: 12 }}>{team}</span>
                        <span style={{ color: colors[i], fontWeight: 700, fontSize: 18 }}>
                          {ppda?.[team] ?? '—'}
                        </span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                        <div style={{
                          height: '100%', borderRadius: 2, background: colors[i],
                          width: `${Math.min(100, 100 - ((ppda?.[team] ?? 10) / 20) * 100)}%`,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* pressure count */}
                <div className="card">
                  <div className="label" style={{ marginBottom: 10 }}>Pressure Events</div>
                  {teams.map((team, i) => {
                    const cnt = pressures.filter(p => p.team === team).length;
                    const max = pressures.length;
                    return (
                      <div key={team} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ color: colors[i], fontSize: 12 }}>{team}</span>
                          <span style={{ color: colors[i], fontWeight: 700 }}>{cnt}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                          <div style={{ height: '100%', width: `${(cnt / max) * 100}%`, background: colors[i], borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
