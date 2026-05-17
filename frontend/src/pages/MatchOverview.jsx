import { useMatch } from '../context/MatchContext';
import { useState, useEffect } from 'react';
import { fetchMatch, fetchLiveMatch } from '../api/matchApi';
import Header from '../components/Header';
import StatBox from '../components/StatBox';
import TopPlayers from '../components/TopPlayers';
import ShotMap from '../components/ShotMap';
import MatchStats from '../components/MatchStats';
import XGFlow from '../components/XGFlow';
import GKSpotlight from '../components/GKSpotlight';
import Skeleton from '../components/Skeleton';

/* ── Shared loading skeleton ─────────────────────────────────────────────── */
function LoadingOverview() {
  return (
    <div style={{ padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header: two 44px team circles + score box */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 16 }} className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Skeleton height={44} width={44} style={{ borderRadius: '50%' }} delay={0} />
          <Skeleton height={18} width={80} delay={60} />
        </div>
        <Skeleton height={52} width={140} delay={120} style={{ borderRadius: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Skeleton height={18} width={80} delay={60} />
          <Skeleton height={44} width={44} style={{ borderRadius: '50%' }} delay={0} />
        </div>
      </div>
      {/* StatBox row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[0, 1, 2].map(i => <Skeleton key={i} height={88} delay={i * 60} />)}
      </div>
      {/* Middle row: TopPlayers | ShotMap | TopPlayers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr 1fr', gap: 10 }}>
        <Skeleton height={240} delay={0} />
        <Skeleton height={240} delay={60} />
        <Skeleton height={240} delay={120} />
      </div>
      {/* Bottom row: MatchStats | XGFlow | GKSpotlight */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 10 }}>
        <Skeleton height={200} delay={0} />
        <Skeleton height={200} delay={60} />
        <Skeleton height={200} delay={120} />
      </div>
    </div>
  );
}

/* ── ESPN match overview ─────────────────────────────────────────────────── */
const ESPN_STAT_ROWS = [
  { key: 'possession',      label: 'Possession',    unit: '%' },
  { key: 'shots',           label: 'Shots' },
  { key: 'shots_on_target', label: 'Shots on Target' },
  { key: 'passes',          label: 'Passes' },
  { key: 'accurate_passes', label: 'Accurate Passes' },
  { key: 'corners',         label: 'Corners' },
  { key: 'fouls',           label: 'Fouls' },
  { key: 'yellow_cards',    label: 'Yellow Cards' },
  { key: 'red_cards',       label: 'Red Cards' },
  { key: 'offsides',        label: 'Offsides' },
  { key: 'saves',           label: 'Saves' },
  { key: 'tackles',         label: 'Tackles' },
  { key: 'interceptions',   label: 'Interceptions' },
  { key: 'clearances',      label: 'Clearances' },
];

function LiveBadge({ is_live, clock }) {
  if (!is_live) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 10 }}>
      <style>{`@keyframes livep{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 7px rgba(248,113,113,.9)', animation: 'livep 1.4s ease infinite' }} />
      <span style={{ color: '#f87171', fontWeight: 800, fontSize: 12, letterSpacing: '.06em' }}>LIVE {clock}</span>
    </span>
  );
}

function ESPNStatRow({ label, v1, v2, unit = '' }) {
  if (v1 == null && v2 == null) return null;
  const n1 = parseFloat(v1) || 0;
  const n2 = parseFloat(v2) || 0;
  const total = n1 + n2 || 1;
  const pct1 = (n1 / total) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
        <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{n1}{unit}</span>
        <span style={{ color: 'var(--muted)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{n2}{unit}</span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${pct1}%`, height: '100%', background: 'var(--arg)', borderRadius: '99px 0 0 99px', transition: 'width .5s ease' }} />
        <div style={{ flex: 1, height: '100%', background: 'var(--fra)', borderRadius: '0 99px 99px 0' }} />
      </div>
    </div>
  );
}

function ESPNOverview({ data }) {
  const { meta, stats, scorers } = data;
  const { team1, team2 } = meta;
  const s1 = stats.team1 || {};
  const s2 = stats.team2 || {};

  const headerMeta = {
    team1, team2,
    score1: meta.score1,
    score2: meta.score2,
    venue: meta.venue,
    date: meta.date,
    competition: meta.competition,
  };

  const hasStats = Object.keys(s1).length > 0 || Object.keys(s2).length > 0;
  const visibleRows = ESPN_STAT_ROWS.filter(r => s1[r.key] != null || s2[r.key] != null);

  return (
    <div style={{ padding: '0 20px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{ position: 'relative' }}>
        <Header meta={headerMeta} />
        {meta.is_live && (
          <div style={{ position: 'absolute', top: 16, right: 20 }}>
            <LiveBadge is_live={meta.is_live} clock={meta.clock} />
          </div>
        )}
      </div>

      {/* Top stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <StatBox label="Possession"     team1={team1} team2={team2} val1={s1.possession ?? '—'} val2={s2.possession ?? '—'} unit="%" />
        <StatBox label="Shots"          team1={team1} team2={team2} val1={s1.shots ?? '—'} val2={s2.shots ?? '—'} />
        <StatBox label="Shots on Target" team1={team1} team2={team2} val1={s1.shots_on_target ?? '—'} val2={s2.shots_on_target ?? '—'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'start' }}>

        {/* Full stats panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--arg)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em' }}>{team1?.slice(0,3).toUpperCase()}</span>
            <span className="label">Match Stats</span>
            <span style={{ color: 'var(--fra)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em' }}>{team2?.slice(0,3).toUpperCase()}</span>
          </div>
          {!hasStats ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              Stats available after kick-off
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {visibleRows.map(r => (
                <ESPNStatRow key={r.key} label={r.label} v1={s1[r.key]} v2={s2[r.key]} unit={r.unit || ''} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Goal scorers */}
          <div className="card">
            <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span className="label">Goal Scorers</span>
            </div>
            {scorers.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 12, padding: '8px 0' }}>No goals recorded yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scorers.map((g, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: g.team === team1 ? 'var(--arg-dim)' : 'var(--fra-dim)',
                      border: `1px solid ${g.team === team1 ? 'rgba(96,165,250,0.25)' : 'rgba(248,113,113,0.25)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      color: g.team === team1 ? 'var(--arg)' : 'var(--fra)',
                    }}>
                      {g.minute || '⚽'}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{g.player}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                        {g.team} {g.type !== 'Goal' ? `· ${g.type}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ESPN data notice */}
          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.16)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              ESPN Live Data
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              This match uses ESPN data. Deep analysis pages (xG, pass networks, heatmaps, player stats) require <strong style={{ color: 'var(--arg)' }}>StatsBomb event data</strong> — available for 3,463 historical matches in the game selector.
            </p>
          </div>

          {/* Passes & passing accuracy */}
          {(s1.passes != null || s2.passes != null) && (
            <div className="card">
              <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <span className="label">Passing</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ESPNStatRow label="Passes"           v1={s1.passes}          v2={s2.passes} />
                <ESPNStatRow label="Accurate Passes"  v1={s1.accurate_passes} v2={s2.accurate_passes} />
                <ESPNStatRow label="Crosses"          v1={s1.crosses}         v2={s2.crosses} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── StatsBomb match overview ────────────────────────────────────────────── */
function StatsBombOverview({ selected }) {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    setError(null);
    fetchMatch(selected.matchId)
      .then(setData)
      .catch(e => setError(e.message));
  }, [selected?.matchId]);

  if (error) return (
    <div style={{ padding: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--fra-dim)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--fra)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>Failed to load match data</p>
      <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>{error}</p>
      <code style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 8, fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
        uvicorn main:app --reload --port 8000
      </code>
    </div>
  );

  if (!data) return <LoadingOverview />;

  const { meta, statBoxes, topPlayers, shotMap, matchStats, xgFlow, goalkeepers } = data;
  const { team1, team2 } = meta;

  return (
    <div style={{ padding: '0 20px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Header meta={meta} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <StatBox label="Expected Goals (xG)" team1={team1} team2={team2} val1={statBoxes.xg[team1] != null ? Number(statBoxes.xg[team1]).toFixed(2) : '—'} val2={statBoxes.xg[team2] != null ? Number(statBoxes.xg[team2]).toFixed(2) : '—'} />
        <StatBox
          label="Possession"
          team1={team1} team2={team2}
          val1={statBoxes.possession[team1] != null ? statBoxes.possession[team1].toFixed(1) : '—'}
          val2={statBoxes.possession[team2] != null ? statBoxes.possession[team2].toFixed(1) : '—'}
          unit="%"
        />
        <StatBox label="Shots on Target"     team1={team1} team2={team2} val1={statBoxes.shotsOnTarget[team1]} val2={statBoxes.shotsOnTarget[team2]} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr 1fr', gap: 10, alignItems: 'start' }}>
        <TopPlayers players={topPlayers[team1] ?? []} color="var(--arg)" title="Top Players" teamName={team1} />
        <ShotMap shots={shotMap} team1={team1} team2={team2} />
        <TopPlayers players={topPlayers[team2] ?? []} color="var(--fra)" title="Top Players" teamName={team2} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 10, alignItems: 'start' }}>
        <MatchStats stats={matchStats} team1={team1} team2={team2} />
        <XGFlow flow={xgFlow} team1={team1} team2={team2} />
        <GKSpotlight goalkeepers={goalkeepers} team1={team1} team2={team2} />
      </div>
      {meta.source && meta.source !== 'statsbomb' && (
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.14)',
          fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--gold)' }}>{meta.source} data</strong> — Some analysis features are limited.
          Full pass networks, heatmaps, pressure maps, and momentum require StatsBomb event data.
        </div>
      )}
    </div>
  );
}

/* ── ESPN fetch wrapper ──────────────────────────────────────────────────── */
function ESPNMatchLoader({ selected }) {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    setError(null);
    fetchLiveMatch(selected.league_id, selected.matchId)
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message));
  }, [selected?.matchId]);

  if (error) return (
    <div style={{ padding: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--fra-dim)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--fra)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>Failed to load match</p>
      <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>{error}</p>
    </div>
  );

  if (!data) return <LoadingOverview />;
  return <ESPNOverview data={data} />;
}

/* ── Root router ─────────────────────────────────────────────────────────── */
export default function MatchOverview() {
  const { selected } = useMatch();

  if (selected?.source === 'espn') {
    return <ESPNMatchLoader key={selected.matchId} selected={selected} />;
  }

  return <StatsBombOverview key={selected?.matchId} selected={selected} />;
}
