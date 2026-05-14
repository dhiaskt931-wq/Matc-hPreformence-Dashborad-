import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { fetchCompetitions, fetchMatchesList } from '../api/matchApi';

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

function ScoreRow({ home, away, hs, as: as_ }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 12 }}>{home}</span>
      <span style={{
        background: 'var(--border)', borderRadius: 5, padding: '2px 10px',
        color: 'var(--text)', fontWeight: 700, fontSize: 13,
        letterSpacing: 2,
      }}>{hs} – {as_}</span>
      <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 12 }}>{away}</span>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      padding: '48px 0', textAlign: 'center',
      color: 'var(--muted)', fontSize: 13,
      border: '1px dashed var(--border)', borderRadius: 10,
    }}>
      {message}
    </div>
  );
}

export default function GameSelector() {
  const { selected, setSelected } = useMatch();
  const navigate = useNavigate();

  const [competitions, setCompetitions] = useState([]);
  const [compLoading, setCompLoading]   = useState(true);
  const [compError, setCompError]       = useState(null);

  const [search, setSearch]               = useState('');
  const [activeComp, setActiveComp]       = useState(null);
  const [activeSeason, setActiveSeason]   = useState(null);

  const [matches, setMatches]             = useState([]);
  const [matchLoading, setMatchLoading]   = useState(false);
  const [matchError, setMatchError]       = useState(null);

  useEffect(() => {
    fetchCompetitions()
      .then(list => { setCompetitions(groupCompetitions(list)); setCompLoading(false); })
      .catch(e  => { setCompError(e.message); setCompLoading(false); });
  }, []);

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
    <div style={{ padding: '24px 24px 40px', maxWidth: 1100 }}>

      {/* Page heading */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Game Selector
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>
          Browse StatsBomb open data — pick a competition, season, and match to load its full dashboard.
        </p>
      </div>

      {/* Current game banner */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--arg-dim)', border: '1px solid rgba(91,155,213,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--arg)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div className="label" style={{ marginBottom: 4 }}>Currently viewing</div>
          <ScoreRow
            home={selected.home_team} away={selected.away_team}
            hs={selected.home_score} as={selected.away_score}
          />
          <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 3 }}>
            {selected.competition_name} · {selected.season_name} · {selected.match_date}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/')}
        >
          View Dashboard
        </button>
      </div>

      {compError && (
        <div style={{ color: 'var(--fra)', fontSize: 12, marginBottom: 14, padding: '8px 12px', background: 'var(--fra-dim)', borderRadius: 6 }}>
          Failed to load competitions: {compError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '268px 1fr', gap: 14 }}>

        {/* Left: competition list */}
        <div>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search competitions…"
              style={{
                width: '100%',
                background: 'var(--card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: '8px 12px 8px 32px',
                fontSize: 12,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color var(--transition)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(91,155,213,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {compLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 44 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 560, overflowY: 'auto' }}>
              {filtered.map(comp => {
                const isActive = activeComp === comp.competition_name;
                return (
                  <div key={comp.competition_name}>
                    <button
                      onClick={() => {
                        setActiveComp(isActive ? null : comp.competition_name);
                        setActiveSeason(null);
                        setMatches([]);
                        if (!isActive && comp.seasons.length === 1) setActiveSeason(comp.seasons[0]);
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 11px',
                        borderRadius: 7, border: '1px solid transparent',
                        cursor: 'pointer',
                        background: isActive ? 'var(--arg-dim)' : 'var(--card)',
                        borderColor: isActive ? 'rgba(91,155,213,0.2)' : 'var(--border)',
                        borderLeft: isActive ? '3px solid var(--arg)' : '3px solid transparent',
                        color: isActive ? 'var(--text)' : 'var(--text-dim)',
                        transition: 'background var(--transition), color var(--transition)',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{ fontWeight: isActive ? 600 : 400, fontSize: 12 }}>
                        {comp.competition_name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                        {comp.country_name} · {comp.seasons.length} season{comp.seasons.length !== 1 ? 's' : ''}
                        {comp.gender !== 'male' ? ` · ${comp.gender}` : ''}
                      </div>
                    </button>

                    {isActive && comp.seasons.length > 1 && (
                      <div style={{ paddingLeft: 12, paddingBottom: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {comp.seasons.map(s => {
                          const isSel = activeSeason?.season_id === s.season_id && activeSeason?.competition_id === s.competition_id;
                          return (
                            <button key={`${s.competition_id}-${s.season_id}`}
                              onClick={() => setActiveSeason(s)}
                              style={{
                                textAlign: 'left', padding: '5px 10px', borderRadius: 5,
                                border: 'none', cursor: 'pointer', fontSize: 11,
                                background: isSel ? 'rgba(91,155,213,0.15)' : 'transparent',
                                color: isSel ? 'var(--arg)' : 'var(--muted)',
                                fontWeight: isSel ? 600 : 400,
                                fontFamily: 'inherit',
                                transition: 'background var(--transition), color var(--transition)',
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

        {/* Right: match cards */}
        <div>
          {!activeComp && <EmptyState message="Select a competition to browse matches" />}

          {activeComp && !activeSeason && !matchLoading && matches.length === 0 && (
            <EmptyState message="Select a season above" />
          )}

          {matchLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 80 }} />
              ))}
            </div>
          )}

          {matchError && (
            <div style={{ color: 'var(--fra)', fontSize: 12, padding: '8px 12px', background: 'var(--fra-dim)', borderRadius: 6 }}>
              Failed to load matches: {matchError}
            </div>
          )}

          {!matchLoading && matches.length > 0 && (
            <>
              <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 10 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-dim)' }}>{matches.length}</span> matches
                &ensp;·&ensp;{activeSeason?.season_name}&ensp;·&ensp;{activeComp}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))', gap: 10 }}>
                {matches.map(m => {
                  const isCurrent = selected.matchId === m.match_id;
                  return (
                    <div
                      key={m.match_id}
                      className="card card-hover"
                      onClick={() => selectMatch(m, activeComp, activeSeason.season_name)}
                      style={{
                        borderColor: isCurrent ? 'rgba(91,155,213,0.5)' : 'var(--border)',
                        background: isCurrent ? 'rgba(91,155,213,0.05)' : 'var(--card)',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                    >
                      {isCurrent && (
                        <div className="badge" style={{
                          position: 'absolute', top: 10, right: 10,
                          background: 'var(--arg)', color: '#0a0d12',
                        }}>Active</div>
                      )}

                      {m.stage && (
                        <div className="label" style={{ marginBottom: 8 }}>{m.stage}</div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
                        <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.home_team}
                        </span>
                        <span style={{
                          background: isCurrent ? 'var(--arg)' : 'var(--border)',
                          color: isCurrent ? '#0a0d12' : 'var(--text)',
                          borderRadius: 5, padding: '3px 10px', fontWeight: 700, fontSize: 13,
                          flexShrink: 0, letterSpacing: 2,
                        }}>{m.home_score} – {m.away_score}</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 12, flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.away_team}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)', fontSize: 10 }}>{m.match_date}</span>
                        {m.stadium && <span style={{ color: 'var(--muted)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{m.stadium}</span>}
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
