import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { fetchCompetitions, fetchMatchesList } from '../api/matchApi';

// Group competitions by name, collect seasons per group
function groupCompetitions(list) {
  const map = {};
  list.forEach(c => {
    if (!map[c.competition_name]) {
      map[c.competition_name] = {
        competition_name: c.competition_name,
        country_name: c.country_name,
        gender: c.gender,
        seasons: [],
      };
    }
    map[c.competition_name].seasons.push({
      season_id: c.season_id,
      season_name: c.season_name,
      competition_id: c.competition_id,
    });
  });
  return Object.values(map).sort((a, b) => a.competition_name.localeCompare(b.competition_name));
}

function ScoreBadge({ home, away, hs, as: as_ }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
      <span style={{ color: 'var(--arg)', fontWeight: 700 }}>{home}</span>
      <span style={{
        background: 'var(--border)', borderRadius: 4, padding: '2px 8px',
        color: 'var(--text)', fontWeight: 700, fontSize: 13,
      }}>{hs} – {as_}</span>
      <span style={{ color: 'var(--fra)', fontWeight: 700 }}>{away}</span>
    </div>
  );
}

export default function GameSelector() {
  const { selected, setSelected } = useMatch();
  const navigate = useNavigate();

  const [competitions, setCompetitions] = useState([]);
  const [compLoading, setCompLoading] = useState(true);
  const [compError, setCompError]     = useState(null);

  const [search, setSearch]             = useState('');
  const [activeComp, setActiveComp]     = useState(null);   // competition_name
  const [activeSeason, setActiveSeason] = useState(null);   // { competition_id, season_id, season_name }

  const [matches, setMatches]           = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError]     = useState(null);

  // load competition list once
  useEffect(() => {
    fetchCompetitions()
      .then(list => { setCompetitions(groupCompetitions(list)); setCompLoading(false); })
      .catch(e  => { setCompError(e.message); setCompLoading(false); });
  }, []);

  // load matches when season selected
  useEffect(() => {
    if (!activeSeason) return;
    setMatchLoading(true);
    setMatchError(null);
    setMatches([]);
    fetchMatchesList(activeSeason.competition_id, activeSeason.season_id)
      .then(list => { setMatches(list); setMatchLoading(false); })
      .catch(e   => { setMatchError(e.message); setMatchLoading(false); });
  }, [activeSeason]);

  const filtered = competitions.filter(c =>
    c.competition_name.toLowerCase().includes(search.toLowerCase()) ||
    c.country_name.toLowerCase().includes(search.toLowerCase())
  );

  function selectMatch(m, compName, seasonName) {
    setSelected({
      matchId: m.match_id,
      home_team: m.home_team,
      away_team: m.away_team,
      home_score: m.home_score,
      away_score: m.away_score,
      match_date: m.match_date,
      competition_name: compName,
      season_name: seasonName,
      stage: m.stage,
    });
    navigate('/');
  }

  return (
    <div style={{ padding: '20px 20px 32px', maxWidth: 1100 }}>
      {/* header */}
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 4 }}>Game Selector</div>
        <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>
          Browse StatsBomb open data — pick a competition, season, and match to load its full dashboard.
        </p>
      </div>

      {/* current game banner */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}>
        <div style={{ fontSize: 18 }}>⚽</div>
        <div>
          <div style={{ color: 'var(--muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            Currently viewing
          </div>
          <ScoreBadge home={selected.home_team} away={selected.away_team}
            hs={selected.home_score} as={selected.away_score} />
          <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 3 }}>
            {selected.competition_name} · {selected.season_name} · {selected.match_date}
          </div>
        </div>
        <button onClick={() => navigate('/')} style={{
          marginLeft: 'auto', padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: 'var(--arg)', color: '#0d1117', fontWeight: 700, fontSize: 12,
        }}>View Dashboard →</button>
      </div>

      {compError && (
        <div style={{ color: 'var(--fra)', fontSize: 12, marginBottom: 14 }}>
          Failed to load competitions: {compError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>
        {/* ── Left: competition list ── */}
        <div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search competitions…"
            style={{
              width: '100%', background: 'var(--card)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 6,
              padding: '8px 12px', fontSize: 12, outline: 'none', marginBottom: 10,
            }}
          />

          {compLoading ? (
            <div style={{ color: 'var(--muted)', fontSize: 12, padding: 12 }}>Loading competitions…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 560, overflowY: 'auto' }}>
              {filtered.map(comp => {
                const isActive = activeComp === comp.competition_name;
                return (
                  <div key={comp.competition_name}>
                    <button
                      onClick={() => {
                        setActiveComp(isActive ? null : comp.competition_name);
                        setActiveSeason(null);
                        setMatches([]);
                        // auto-select season if only one
                        if (!isActive && comp.seasons.length === 1) {
                          setActiveSeason(comp.seasons[0]);
                        }
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 12px',
                        borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: isActive ? 'rgba(117,170,219,0.15)' : 'var(--card)',
                        borderLeft: isActive ? '3px solid var(--arg)' : '3px solid transparent',
                        color: isActive ? 'var(--text)' : 'var(--muted)',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{ fontWeight: isActive ? 700 : 400, fontSize: 12 }}>
                        {comp.competition_name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                        {comp.country_name} · {comp.seasons.length} season{comp.seasons.length !== 1 ? 's' : ''}
                        {comp.gender !== 'male' ? ` · ${comp.gender}` : ''}
                      </div>
                    </button>

                    {/* season picker inline */}
                    {isActive && comp.seasons.length > 1 && (
                      <div style={{ paddingLeft: 12, paddingBottom: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {comp.seasons.map(s => {
                          const isSel = activeSeason?.season_id === s.season_id && activeSeason?.competition_id === s.competition_id;
                          return (
                            <button key={`${s.competition_id}-${s.season_id}`}
                              onClick={() => setActiveSeason(s)}
                              style={{
                                textAlign: 'left', padding: '5px 10px', borderRadius: 4,
                                border: 'none', cursor: 'pointer', fontSize: 11,
                                background: isSel ? 'rgba(117,170,219,0.2)' : 'transparent',
                                color: isSel ? 'var(--arg)' : 'var(--muted)',
                                fontWeight: isSel ? 700 : 400,
                              }}>
                              {s.season_name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: match cards ── */}
        <div>
          {!activeComp && (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
              ← Select a competition to browse matches
            </div>
          )}

          {activeComp && !activeSeason && (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
              Select a season above
            </div>
          )}

          {matchLoading && (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
              Loading matches…
            </div>
          )}

          {matchError && (
            <div style={{ color: 'var(--fra)', fontSize: 12 }}>Failed: {matchError}</div>
          )}

          {!matchLoading && matches.length > 0 && (
            <>
              <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 10 }}>
                {matches.length} matches · {activeSeason?.season_name} · {activeComp}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {matches.map(m => {
                  const isCurrent = selected.matchId === m.match_id;
                  return (
                    <div key={m.match_id} className="card" style={{
                      cursor: 'pointer', transition: 'border-color 0.15s',
                      borderColor: isCurrent ? 'var(--arg)' : 'var(--border)',
                      position: 'relative',
                    }}
                      onClick={() => selectMatch(m, activeComp, activeSeason.season_name)}
                    >
                      {isCurrent && (
                        <div style={{
                          position: 'absolute', top: 8, right: 8,
                          background: 'var(--arg)', color: '#0d1117',
                          fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                          textTransform: 'uppercase',
                        }}>Active</div>
                      )}

                      {/* stage */}
                      {m.stage && (
                        <div style={{ color: 'var(--muted)', fontSize: 9, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                          {m.stage}
                        </div>
                      )}

                      {/* score */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 8 }}>
                        <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 12, flex: 1 }}>{m.home_team}</span>
                        <span style={{
                          background: isCurrent ? 'var(--arg)' : 'var(--border)',
                          color: isCurrent ? '#0d1117' : 'var(--text)',
                          borderRadius: 5, padding: '3px 10px', fontWeight: 700, fontSize: 14,
                          flexShrink: 0,
                        }}>{m.home_score} – {m.away_score}</span>
                        <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 12, flex: 1, textAlign: 'right' }}>{m.away_team}</span>
                      </div>

                      {/* meta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)', fontSize: 10 }}>{m.match_date}</span>
                        {m.stadium && <span style={{ color: 'var(--muted)', fontSize: 10 }}>{m.stadium}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
