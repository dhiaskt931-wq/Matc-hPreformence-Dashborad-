import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useMatch } from '../context/MatchContext';

/* ── Inline SVG icons (24x24 viewBox, stroke-based) ── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const Icons = {
  overview:   'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  xg:         ['M22 12h-4l-3 9L9 3l-3 9H2'],
  shots:      ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 8v4', 'M12 16h.01'],
  passes:     ['M17 1l4 4-4 4', 'M3 11V9a4 4 0 0 1 4-4h14', 'M7 23l-4-4 4-4', 'M21 13v2a4 4 0 0 1-4 4H3'],
  heatmaps:   ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 10m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0'],
  performers: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  duels:      ['M14.5 17.5L3 6V3h3l11.5 11.5', 'M13 19l6-6', 'M2 2l20 20'],
  defensive:  ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  setpieces:  ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'],
  momentum:   ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7z'],
  search:     ['M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z', 'M16 16l4.5 4.5'],
  logo:       ['M2 12h6', 'M22 12h-6', 'M12 2v6', 'M12 22v-6', 'M4.93 4.93l4.24 4.24', 'M14.83 14.83l4.24 4.24', 'M14.83 9.17l4.24-4.24', 'M4.93 19.07l4.24-4.24'],
  collapse:   'M15 18l-6-6 6-6',
  expand:     'M9 18l6-6-6-6',
};

const NAV = [
  {
    group: 'Match Analysis',
    items: [
      { path: '/',              icon: 'overview',   label: 'Match Overview' },
      { path: '/xg-timeline',   icon: 'xg',         label: 'xG Timeline' },
      { path: '/shot-analysis', icon: 'shots',       label: 'Shot Analysis' },
      { path: '/pass-network',  icon: 'passes',      label: 'Pass Network' },
    ],
  },
  {
    group: 'Player Analysis',
    items: [
      { path: '/heatmaps',  icon: 'heatmaps',   label: 'Player Heatmaps' },
      { path: '/top-stats', icon: 'performers', label: 'Top Performers' },
      { path: '/duels',     icon: 'duels',      label: 'Duels & Pressure' },
    ],
  },
  {
    group: 'Team Analysis',
    items: [
      { path: '/defensive',  icon: 'defensive', label: 'Defensive Actions' },
      { path: '/set-pieces', icon: 'setpieces', label: 'Set Pieces' },
      { path: '/momentum',   icon: 'momentum',  label: 'Momentum Chart' },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { selected } = useMatch();

  return (
    <aside style={{
      width: collapsed ? 54 : 224,
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0,
      overflow: 'hidden',
    }}>

      {/* Logo + collapse toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '14px 0' : '14px 12px',
        borderBottom: '1px solid var(--border)',
        gap: 8,
        minHeight: 52,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26,
              background: 'linear-gradient(135deg, var(--arg) 0%, #3a7cbf 100%)',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon d={Icons.logo} size={13} />
            </div>
            <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              Football Lab
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', padding: 4, borderRadius: 4, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >
          <Icon d={collapsed ? Icons.expand : Icons.collapse} size={15} />
        </button>
      </div>

      {/* Select game + current match */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: collapsed ? '8px 0' : '8px 8px' }}>
        <NavLink to="/games" style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 8,
          padding: collapsed ? '8px 0' : '7px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 6, textDecoration: 'none',
          background: isActive ? 'var(--arg-dim)' : 'rgba(255,255,255,0.03)',
          color: isActive ? 'var(--arg)' : 'var(--text-dim)',
          border: `1px solid ${isActive ? 'rgba(91,155,213,0.2)' : 'var(--border)'}`,
          fontWeight: 600, fontSize: 12,
          transition: 'background var(--transition), color var(--transition)',
        })}>
          <Icon d={Icons.search} size={14} />
          {!collapsed && <span>Select Game</span>}
        </NavLink>

        {!collapsed && selected && (
          <div style={{
            marginTop: 6, padding: '7px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div className="label" style={{ marginBottom: 3 }}>Now viewing</div>
            <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, lineHeight: 1.4 }}>
              <span style={{ color: 'var(--arg)' }}>{selected.home_team?.slice(0, 3).toUpperCase()}</span>
              <span style={{ color: 'var(--muted)', margin: '0 4px' }}>{selected.home_score}–{selected.away_score}</span>
              <span style={{ color: 'var(--fra)' }}>{selected.away_team?.slice(0, 3).toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
              {selected.competition_name}
            </div>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 2 }}>
            {!collapsed && (
              <div className="label" style={{ padding: '10px 12px 4px', fontSize: 9 }}>
                {group}
              </div>
            )}
            {items.map(({ path, icon, label }) => (
              <NavLink key={path} to={path} end={path === '/'} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 9,
                padding: collapsed ? '10px 0' : '8px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--text)' : 'var(--muted)',
                background: isActive ? 'rgba(91,155,213,0.08)' : 'none',
                borderLeft: isActive ? '2px solid var(--arg)' : '2px solid transparent',
                textDecoration: 'none', fontSize: 12.5,
                fontWeight: isActive ? 600 : 400,
                transition: 'background var(--transition), color var(--transition)',
                whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = 'var(--text-dim)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = ''; }}
              >
                <Icon d={Icons[icon]} size={15} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border)',
          color: 'var(--muted)',
          fontSize: 10,
          letterSpacing: '0.03em',
        }}>
          StatsBomb Open Data
        </div>
      )}
    </aside>
  );
}
