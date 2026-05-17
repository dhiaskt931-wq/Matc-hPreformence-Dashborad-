import { memo, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { abbrev } from '../utils/teamAbbrev';
import './Sidebar.css';

/* ── Icons ─────────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const IC = {
  overview:   'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  xg:         ['M22 12h-4l-3 9L9 3l-3 9H2'],
  shots:      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  passes:     ['M5 12h14', 'M12 5l7 7-7 7'],
  heatmaps:   ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  performers: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  duels:      ['M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3'],
  defensive:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  setpieces:  ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'],
  momentum:   ['M3 12h18', 'M3 6l9 6-9 6'],
  games:      ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'],
  chevLeft:   'M15 18l-6-6 6-6',
  chevRight:  'M9 18l6-6-6-6',
  bolt:       'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  menu:       ['M3 12h18', 'M3 6h18', 'M3 18h18'],
};

const NAV = [
  {
    group: 'Match',
    items: [
      { path: '/',              icon: 'overview',   label: 'Overview',       feature: 'match-overview' },
      { path: '/xg-timeline',   icon: 'xg',         label: 'xG Timeline',    feature: 'match-overview' },
      { path: '/shot-analysis', icon: 'shots',      label: 'Shot Analysis',  feature: 'shot-analysis' },
      { path: '/pass-network',  icon: 'passes',     label: 'Pass Network',   feature: 'pass-network' },
    ],
  },
  {
    group: 'Players',
    items: [
      { path: '/heatmaps',  icon: 'heatmaps',   label: 'Heatmaps',         feature: 'heatmap' },
      { path: '/top-stats', icon: 'performers', label: 'Top Performers',   feature: 'player-stats' },
      { path: '/duels',     icon: 'duels',      label: 'Duels & Pressure', feature: 'pressure' },
    ],
  },
  {
    group: 'Team',
    items: [
      { path: '/defensive',  icon: 'defensive', label: 'Defensive',  feature: 'defensive' },
      { path: '/set-pieces', icon: 'setpieces', label: 'Set Pieces', feature: 'set-pieces' },
      { path: '/momentum',   icon: 'momentum',  label: 'Momentum',   feature: 'momentum' },
    ],
  },
];

/* ── Lock icon ──────────────────────────────────────────────────────────── */
function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, marginLeft: 'auto', opacity: 0.5 }}>
      <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ── Nav item ──────────────────────────────────────────────────────────── */
const NavItem = memo(function NavItem({ path, icon, label, collapsed, featureStatus }) {
  const isUnavailable = featureStatus === 'unavailable';
  const isPartial     = featureStatus === 'partial';

  const sizeClass = collapsed ? 'nav-item--collapsed' : 'nav-item--expanded';

  return (
    <NavLink
      to={path}
      end={path === '/'}
      className={({ isActive }) =>
        ['nav-item', sizeClass,
          isUnavailable ? 'nav-item--unavailable' : '',
          isActive && !isUnavailable ? 'nav-item--active' : '',
        ].filter(Boolean).join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span className={`nav-item__icon${isActive && !isUnavailable ? ' nav-item__icon--active' : ''}`}>
            <Icon d={IC[icon]} size={15} />
          </span>
          {!collapsed && label}
          {isActive && !collapsed && !isUnavailable && (
            <span className={`nav-item__dot ${isPartial ? 'nav-item__dot--partial' : 'nav-item__dot--full'}`} />
          )}
          {!collapsed && isUnavailable && <LockIcon />}
        </>
      )}
    </NavLink>
  );
});

/* ── Sidebar ───────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const { selected, features } = useMatch();
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleCollapseToggle = () => setCollapsed(prev => !prev);

  const sourceLabel = features?.source
    ? features.source === 'statsbomb'
      ? 'StatsBomb Open Data'
      : features.source === 'understat'
      ? 'Understat'
      : features.source
    : 'StatsBomb Open Data';

  const sidebarStyle = isMobile
    ? {
        position: 'fixed', zIndex: 100, height: '100vh', top: 0, left: 0,
        width: collapsed ? 0 : 228, overflow: 'hidden',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        background: 'linear-gradient(180deg, rgba(10,14,30,0.97) 0%, rgba(6,9,20,0.99) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
      }
    : {
        width: collapsed ? 60 : 228,
        minHeight: '100vh', height: '100vh',
        position: 'sticky', top: 0, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        background: 'linear-gradient(180deg, rgba(10,14,30,0.97) 0%, rgba(6,9,20,0.99) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99,
          }}
        />
      )}

      <aside style={sidebarStyle}>

        {/* ── Logo bar ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '16px 0' : '16px 14px 16px 16px',
          minHeight: 60,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : 'auto',
            overflow: 'hidden',
            transition: 'opacity 0.18s ease, width 0.22s ease',
            whiteSpace: 'nowrap',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 60%, #1d4ed8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(96,165,250,0.3), 0 4px 14px rgba(59,130,246,0.35)',
            }}>
              <Icon d={IC.bolt} size={14} style={{ stroke: 'white', strokeWidth: 2 }} />
            </div>
            <div>
              <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Football Lab
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>
                Analytics
              </div>
            </div>
          </div>

          <button
            className="sidebar-collapse-btn"
            onClick={handleCollapseToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <Icon d={collapsed ? IC.chevRight : IC.chevLeft} size={13} />
          </button>
        </div>

        {/* ── Select game CTA ───────────────────────────────────────────── */}
        <div style={{ padding: collapsed ? '10px 6px' : '10px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <NavLink to="/games" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center',
            gap: 8,
            padding: collapsed ? '9px 0' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 9,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: '-0.01em',
            cursor: 'pointer',
            transition: 'all 160ms ease',
            background: isActive
              ? 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(59,130,246,0.10))'
              : 'linear-gradient(135deg, rgba(96,165,250,0.10), rgba(59,130,246,0.06))',
            color: isActive ? 'var(--arg)' : '#93c5fd',
            border: `1px solid ${isActive ? 'rgba(96,165,250,0.30)' : 'rgba(96,165,250,0.15)'}`,
            boxShadow: isActive ? '0 0 16px rgba(96,165,250,0.12)' : 'none',
          })}>
            <Icon d={IC.games} size={14} />
            {!collapsed && <span>Select Game</span>}
            {!collapsed && <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>↗</span>}
          </NavLink>

          {!collapsed && selected && (
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: 8, width: '100%',
                padding: '8px 12px', borderRadius: 9,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 160ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
                Live View
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--team1)', letterSpacing: '0.04em' }}>
                  {abbrev(selected.home_team)}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text)',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 5, padding: '1px 7px',
                  letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums',
                }}>
                  {selected.home_score} – {selected.away_score}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--team2)', letterSpacing: '0.04em' }}>
                  {abbrev(selected.away_team)}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, letterSpacing: '-0.01em' }}>
                {selected.competition_name}
              </div>
            </button>
          )}
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 6, paddingBottom: 6 }}>
          {NAV.map(({ group, items }, gi) => (
            <div key={group} style={{ marginBottom: gi < NAV.length - 1 ? 4 : 0 }}>
              {!collapsed && (
                <div style={{
                  padding: '12px 18px 4px',
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.22)',
                  userSelect: 'none',
                }}>
                  {group}
                </div>
              )}
              {collapsed && gi > 0 && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 12px' }} />
              )}
              {items.map(({ path, icon, label, feature }) => {
                const featureStatus = features?.features?.[feature];
                return (
                  <NavItem
                    key={path}
                    path={path}
                    icon={icon}
                    label={label}
                    collapsed={collapsed}
                    featureStatus={featureStatus}
                  />
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: collapsed ? '12px 0' : '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 8,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: '#34d399',
            boxShadow: '0 0 6px rgba(52,211,153,0.7)',
          }} />
          {!collapsed && (
            <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              {sourceLabel}
            </span>
          )}
        </div>
      </aside>

      {/* Mobile floating hamburger */}
      {isMobile && collapsed && (
        <button
          onClick={handleCollapseToggle}
          aria-label="Expand sidebar"
          style={{
            position: 'fixed', bottom: 20, left: 16, zIndex: 101,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(96,165,250,0.15)',
            border: '1px solid rgba(96,165,250,0.30)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--arg)',
            boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
          }}
        >
          <Icon d={IC.menu} size={18} />
        </button>
      )}
    </>
  );
}
