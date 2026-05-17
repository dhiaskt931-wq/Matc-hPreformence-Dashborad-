import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useDebounce } from '../hooks/useDebounce';
import {
  fetchCompetitions, fetchMatchesList,
  fetchLiveLeagues, fetchLiveRecent, fetchLiveScoreboard,
} from '../api/matchApi';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const g = item[key] || 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});
}

function groupStatsBomb(list) {
  const map = {};
  list.forEach(c => {
    const k = c.competition_name;
    if (!map[k]) map[k] = { ...c, seasons: [] };
    map[k].seasons.push({ season_id: c.season_id, season_name: c.season_name, competition_id: c.competition_id });
  });
  return Object.values(map).sort((a, b) => a.competition_name.localeCompare(b.competition_name));
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

/* ── Shared UI atoms ─────────────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{ padding: '10px 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
      {children}
    </div>
  );
}

function PillBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
      background: active ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
      color: active ? 'var(--arg)' : 'var(--text-dim)',
      fontWeight: active ? 700 : 500, fontSize: 11,
      border: active ? '1px solid rgba(96,165,250,0.3)' : '1px solid var(--border)',
      transition: 'all 160ms ease', whiteSpace: 'nowrap', fontFamily: 'inherit',
    }}>
      {children}
    </button>
  );
}

function LiveDot() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <style>{`@keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 6px rgba(248,113,113,0.8)', animation: 'livepulse 1.4s ease infinite' }} />
      <span style={{ color: '#f87171', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>LIVE</span>
    </span>
  );
}

function DataBadge({ source }) {
  return source === 'espn' ? (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 4, background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }}>ESPN</span>
  ) : (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 4, background: 'rgba(96,165,250,0.12)', color: 'var(--arg)', border: '1px solid rgba(96,165,250,0.22)' }}>FULL DATA</span>
  );
}

function PanelCard({ children, style }) {
  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

function PanelHeader({ children }) {
  return <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>{children}</div>;
}

function PanelBody({ children }) {
  return <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px 10px' }}>{children}</div>;
}

function EmptyMsg({ children }) {
  return <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>{children}</div>;
}

/* ── StatsBomb tab ───────────────────────────────────────────────────────── */
function StatsBombTab({ onSelect }) {
  const [comps, setComps]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchInput, setSearchInput]   = useState('');
  const [activeComp, setActiveComp]     = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('sb_activeComp') || 'null'); } catch { return null; }
  });
  const [activeSeason, setActiveSeason] = useState(null);
  const [matches, setMatches]           = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 250);

  useEffect(() => {
    fetchCompetitions()
      .then(list => { setComps(groupStatsBomb(list)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeSeason) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatchLoading(true);
    setMatches([]);
    fetchMatchesList(activeSeason.competition_id, activeSeason.season_id)
      .then(list => { setMatches(list); setMatchLoading(false); })
      .catch(() => setMatchLoading(false));
  }, [activeSeason]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return comps;
    const q = debouncedSearch.toLowerCase();
    return comps.filter(c => c.competition_name.toLowerCase().includes(q) || c.country_name?.toLowerCase().includes(q));
  }, [comps, debouncedSearch]);

  const groups = useMemo(() => groupBy(filtered, 'country_name'), [filtered]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '210px 190px 1fr', gap: 10, height: 580 }}>

      {/* Competition */}
      <PanelCard>
        <PanelHeader>
          <div style={{ position: 'relative' }}>
            <input
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search competitions…"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                borderRadius: 7, padding: '7px 10px', color: 'var(--text)', fontSize: 12,
                outline: 'none', fontFamily: 'inherit',
                paddingRight: searchInput.length > 0 ? 28 : 10,
              }}
            />
            {searchInput.length > 0 && (
              <button
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', fontSize: 14, lineHeight: 1, padding: 2,
                }}
              >×</button>
            )}
          </div>
        </PanelHeader>
        <PanelBody>
          {loading
            ? [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 28, marginTop: 6 }} />)
            : Object.entries(groups).map(([country, items]) => (
                <div key={country}>
                  <SectionLabel>{country}</SectionLabel>
                  {items.map(c => {
                    const isActive = activeComp?.competition_name === c.competition_name;
                    return (
                      <button key={c.competition_name} onClick={() => { const next = c; setActiveComp(next); sessionStorage.setItem('sb_activeComp', JSON.stringify(next)); setActiveSeason(null); setMatches([]); }} style={{
                        width: '100%', textAlign: 'left', padding: '7px 9px', borderRadius: 7, border: 'none',
                        cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 160ms ease',
                        background: isActive ? 'rgba(96,165,250,0.12)' : 'transparent',
                        color: isActive ? 'var(--arg)' : 'var(--text-dim)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontFamily: 'inherit',
                      }}>
                        <span>{c.competition_name}</span>
                        <span style={{ fontSize: 10, color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4 }}>
                          {c.seasons.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
          }
        </PanelBody>
      </PanelCard>

      {/* Season */}
      <PanelCard>
        <PanelHeader>
          <div className="label">Season</div>
          {activeComp && <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, marginTop: 2, letterSpacing: '-0.01em' }}>{activeComp.competition_name}</div>}
        </PanelHeader>
        <PanelBody>
          {!activeComp
            ? <EmptyMsg>← Select competition</EmptyMsg>
            : activeComp.seasons
                .sort((a,b) => b.season_name.localeCompare(a.season_name))
                .map(s => {
                  const isActive = activeSeason?.season_id === s.season_id;
                  return (
                    <button key={s.season_id} onClick={() => setActiveSeason(s)} style={{
                      width: '100%', textAlign: 'left', padding: '8px 9px', marginBottom: 3,
                      borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12,
                      fontWeight: isActive ? 700 : 500, transition: 'all 160ms ease',
                      background: isActive ? 'rgba(96,165,250,0.12)' : 'transparent',
                      color: isActive ? 'var(--arg)' : 'var(--text-dim)', fontFamily: 'inherit',
                    }}>
                      {s.season_name}
                    </button>
                  );
                })
          }
        </PanelBody>
      </PanelCard>

      {/* Matches */}
      <PanelCard>
        <PanelHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="label">Matches</div>
              {matches.length > 0 && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{matches.length} with full event data</div>}
            </div>
            <DataBadge source="statsbomb" />
          </div>
        </PanelHeader>
        <PanelBody>
          {matchLoading
            ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 54, marginBottom: 6, borderRadius: 8 }} />)
            : !activeSeason
            ? <EmptyMsg>← Select a season</EmptyMsg>
            : matches.length === 0
            ? <EmptyMsg>No matches found</EmptyMsg>
            : matches.map(m => (
                <button key={m.match_id} onClick={() => onSelect({ ...m, matchId: m.match_id, source: 'statsbomb', competition_name: activeComp.competition_name })}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 5, borderRadius: 8,
                    cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                    transition: 'all 160ms ease', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.06)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.22)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    <span style={{ color: 'var(--arg)' }}>{m.home_team}</span>
                    <span style={{ color: 'var(--muted)', margin: '0 6px', fontVariantNumeric: 'tabular-nums' }}>{m.home_score} – {m.away_score}</span>
                    <span style={{ color: 'var(--fra)' }}>{m.away_team}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', gap: 8 }}>
                    <span>{fmtDate(m.match_date)}</span>
                    {m.stage && <><span>·</span><span>{m.stage}</span></>}
                  </div>
                </button>
              ))
          }
        </PanelBody>
      </PanelCard>
    </div>
  );
}

/* ── ESPN match row / section (outside ESPNTab to avoid re-creation on render) */
function ESPNMatchRow({ m, onSelect }) {
  return (
    <button
      onClick={() => onSelect({ ...m, matchId: m.match_id, source: 'espn', competition_name: m.league_name })}
      style={{
        width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 5,
        borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)', transition: 'all 160ms ease', fontFamily: 'inherit',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.05)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.22)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
          {m.home_team}
          <span style={{ color: 'var(--muted)', margin: '0 8px', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
            {(m.is_final || m.is_live) ? `${m.home_score} – ${m.away_score}` : 'vs'}
          </span>
          {m.away_team}
        </span>
        {m.is_live && <LiveDot />}
        {m.is_final && !m.is_live && <span style={{ fontSize: 10, color: 'var(--muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>FT</span>}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', gap: 6 }}>
        {m.is_live
          ? <span style={{ color: '#f87171' }}>{m.clock}{m.period ? ` · ${m.period}'` : ''}</span>
          : <span>{fmtDate(m.match_date)}</span>
        }
        {m.venue && <><span>·</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{m.venue}</span></>}
      </div>
    </button>
  );
}

function ESPNMatchSection({ title, items, accent, onSelect }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        {title} <span style={{ fontWeight: 500, color: 'var(--muted)' }}>· {items.length}</span>
      </div>
      {items.map(m => <ESPNMatchRow key={m.match_id} m={m} onSelect={onSelect} />)}
    </div>
  );
}

/* ── ESPN live tab ───────────────────────────────────────────────────────── */
function ESPNTab({ onSelect }) {
  const [leagues, setLeagues]           = useState([]);
  const [activeLeague, setActiveLeague] = useState(null);
  const [matches, setMatches]           = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [dateMode, setDateMode]         = useState('recent');
  const [customDate, setCustomDate]     = useState('');

  useEffect(() => { fetchLiveLeagues().then(setLeagues).catch(() => {}); }, []);

  useEffect(() => {
    if (!activeLeague) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatchLoading(true);
    setMatches([]);
    const load =
      dateMode === 'today'  ? fetchLiveScoreboard(activeLeague.id, todayYMD()) :
      dateMode === 'custom' && customDate ? fetchLiveScoreboard(activeLeague.id, customDate.replace(/-/g,'')) :
      fetchLiveRecent(activeLeague.id);
    load.then(list => { setMatches(list); setMatchLoading(false); }).catch(() => setMatchLoading(false));
  }, [activeLeague, dateMode, customDate]);

  const grouped     = useMemo(() => groupBy(leagues, 'group'), [leagues]);
  const liveMatches = matches.filter(m => m.is_live);
  const doneMatches = matches.filter(m => m.is_final && !m.is_live);
  const soonMatches = matches.filter(m => !m.is_final && !m.is_live);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 10, height: 580 }}>

      {/* League list */}
      <PanelCard>
        <PanelHeader><div className="label">League</div></PanelHeader>
        <PanelBody>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <SectionLabel>{group}</SectionLabel>
              {items.map(lg => {
                const isActive = activeLeague?.id === lg.id;
                return (
                  <button key={lg.id} onClick={() => setActiveLeague(lg)} style={{
                    width: '100%', textAlign: 'left', padding: '7px 9px', borderRadius: 7,
                    border: 'none', cursor: 'pointer', fontSize: 12, transition: 'all 160ms ease',
                    background: isActive ? 'rgba(52,211,153,0.10)' : 'transparent',
                    color: isActive ? '#34d399' : 'var(--text-dim)',
                    fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 1,
                  }}>
                    <span style={{ fontWeight: isActive ? 700 : 500 }}>{lg.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{lg.country}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </PanelBody>
      </PanelCard>

      {/* Match list */}
      <PanelCard>
        <PanelHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: activeLeague ? 10 : 0 }}>
            <div>
              <div className="label">Matches</div>
              {activeLeague && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{activeLeague.name}</div>}
            </div>
            <DataBadge source="espn" />
          </div>
          {activeLeague && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <PillBtn active={dateMode === 'today'}  onClick={() => setDateMode('today')}>Today</PillBtn>
              <PillBtn active={dateMode === 'recent'} onClick={() => setDateMode('recent')}>Last 7 days</PillBtn>
              <PillBtn active={dateMode === 'custom'} onClick={() => setDateMode('custom')}>Pick date</PillBtn>
              {dateMode === 'custom' && (
                <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 9px', color: 'var(--text)', fontSize: 11, outline: 'none', fontFamily: 'inherit' }}
                />
              )}
            </div>
          )}
        </PanelHeader>
        <PanelBody>
          {!activeLeague
            ? <EmptyMsg>← Select a league to browse matches</EmptyMsg>
            : matchLoading
            ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 56, marginBottom: 6, borderRadius: 8 }} />)
            : matches.length === 0
            ? <EmptyMsg>No matches found for this period</EmptyMsg>
            : (
              <>
                <ESPNMatchSection title="Live now"  items={liveMatches} accent="#f87171"           onSelect={onSelect} />
                <ESPNMatchSection title="Final"     items={doneMatches} accent="var(--text-dim)"   onSelect={onSelect} />
                <ESPNMatchSection title="Upcoming"  items={soonMatches} accent="var(--arg)"        onSelect={onSelect} />
              </>
            )
          }
        </PanelBody>
      </PanelCard>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function GameSelector() {
  const { selected, setSelected } = useMatch();
  const navigate = useNavigate();
  const [tab, setTab] = useState('statsbomb');

  function handleSelect(data) {
    setSelected(data);
    navigate('/');
  }

  return (
    <div style={{ padding: '24px 24px 48px', maxWidth: 1160, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 4 }}>
          Select a Match
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          <strong style={{ color: 'var(--arg)' }}>3,463 StatsBomb matches</strong> with full event-level data (xG, passes, heatmaps) — or browse <strong style={{ color: '#34d399' }}>live & recent</strong> scores from 20+ leagues via ESPN.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {/* StatsBomb tab */}
        <button onClick={() => setTab('statsbomb')} style={{
          padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
          background: tab === 'statsbomb' ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
          color: tab === 'statsbomb' ? 'var(--arg)' : 'var(--text-dim)',
          fontWeight: tab === 'statsbomb' ? 700 : 500,
          border: tab === 'statsbomb' ? '1px solid rgba(96,165,250,0.3)' : '1px solid var(--border)',
          transition: 'all 160ms ease', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/>
          </svg>
          StatsBomb Open Data
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(96,165,250,0.15)', color: 'var(--arg)' }}>3,463</span>
        </button>

        {/* ESPN tab */}
        <button onClick={() => setTab('espn')} style={{
          padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
          background: tab === 'espn' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
          color: tab === 'espn' ? '#34d399' : 'var(--text-dim)',
          fontWeight: tab === 'espn' ? 700 : 500,
          border: tab === 'espn' ? '1px solid rgba(52,211,153,0.25)' : '1px solid var(--border)',
          transition: 'all 160ms ease', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Live & Recent
          <LiveDot />
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>20+ leagues</span>
        </button>
      </div>

      {/* ESPN note */}
      {tab === 'espn' && (
        <div style={{
          marginBottom: 12, padding: '9px 14px', borderRadius: 9,
          background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)',
          fontSize: 12, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ESPN matches include live scores and match stats (possession, shots, passes, tackles). Deep analysis pages (xG, pass networks, heatmaps) require StatsBomb data.
        </div>
      )}

      {/* Tab content */}
      {tab === 'statsbomb' ? <StatsBombTab onSelect={handleSelect} /> : <ESPNTab onSelect={handleSelect} />}

      {/* Current selection */}
      {selected && (
        <div style={{
          marginTop: 16, padding: '11px 16px', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px rgba(52,211,153,0.6)', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 12, color: 'var(--text-dim)' }}>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{selected.home_team} {selected.home_score}–{selected.away_score} {selected.away_team}</span>
            <span style={{ margin: '0 8px', color: 'var(--muted)' }}>·</span>
            <span>{selected.competition_name}</span>
            {selected.source === 'espn' && <span style={{ marginLeft: 8 }}><DataBadge source="espn" /></span>}
          </div>
          <button onClick={() => navigate('/')} style={{
            padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 12,
            background: 'rgba(96,165,250,0.15)', color: 'var(--arg)',
            border: '1px solid rgba(96,165,250,0.25)', fontFamily: 'inherit',
          }}>
            View Dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
