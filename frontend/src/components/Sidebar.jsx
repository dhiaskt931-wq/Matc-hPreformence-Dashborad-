import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useMatch } from '../context/MatchContext';

const NAV = [
  {
    group: 'Match Analysis',
    items: [
      { path: '/',             icon: '⚽', label: 'Match Overview' },
      { path: '/xg-timeline',  icon: '📈', label: 'xG Timeline' },
      { path: '/shot-analysis',icon: '🎯', label: 'Shot Analysis' },
      { path: '/pass-network', icon: '🔗', label: 'Pass Network' },
    ],
  },
  {
    group: 'Player Analysis',
    items: [
      { path: '/heatmaps',  icon: '🌡️', label: 'Player Heatmaps' },
      { path: '/top-stats', icon: '🏅', label: 'Top Performers' },
      { path: '/duels',     icon: '⚔️', label: 'Duels & Pressure' },
    ],
  },
  {
    group: 'Team Analysis',
    items: [
      { path: '/defensive',  icon: '🛡️', label: 'Defensive Actions' },
      { path: '/set-pieces', icon: '📐', label: 'Set Pieces' },
      { path: '/momentum',   icon: '⚡', label: 'Momentum Chart' },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { selected } = useMatch();

  return (
    <aside style={{
      width: collapsed ? 56 : 220,
      minHeight: '100vh',
      background: 'var(--card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Logo / toggle */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '16px 0' : '16px 14px',
        borderBottom: '1px solid var(--border)', gap: 8,
      }}>
        {!collapsed && (
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
            ⚽ Football Lab
          </span>
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 16, padding: 4, borderRadius: 4, flexShrink: 0,
        }} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Select Game link + current match chip */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: collapsed ? '8px 0' : '8px 10px' }}>
        <NavLink to="/games" style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 8,
          padding: collapsed ? '7px 0' : '7px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 6, textDecoration: 'none',
          background: isActive ? 'rgba(117,170,219,0.15)' : 'var(--border)',
          color: isActive ? 'var(--arg)' : 'var(--text)',
          fontWeight: 700, fontSize: 12, transition: 'background 0.15s',
        })}>
          <span style={{ fontSize: 14 }}>🔍</span>
          {!collapsed && <span>Select Game</span>}
        </NavLink>

        {/* Current match mini-chip */}
        {!collapsed && selected && (
          <div style={{ marginTop: 6, padding: '5px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Now viewing
            </div>
            <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600, lineHeight: 1.3 }}>
              <span style={{ color: 'var(--arg)' }}>{selected.home_team?.slice(0, 3).toUpperCase()}</span>
              {' '}{selected.home_score}–{selected.away_score}{' '}
              <span style={{ color: 'var(--fra)' }}>{selected.away_team?.slice(0, 3).toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>
              {selected.competition_name} {selected.season_name}
            </div>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 6 }}>
            {!collapsed && (
              <div style={{
                color: 'var(--muted)', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '8px 14px 4px',
              }}>{group}</div>
            )}
            {items.map(({ path, icon, label }) => (
              <NavLink key={path} to={path} end={path === '/'} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 0' : '9px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--text)' : 'var(--muted)',
                background: isActive ? 'rgba(255,255,255,0.06)' : 'none',
                borderLeft: isActive ? '2px solid var(--arg)' : '2px solid transparent',
                textDecoration: 'none', fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                transition: 'background 0.15s', whiteSpace: 'nowrap',
              })}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: 10 }}>
          StatsBomb Open Data
        </div>
      )}
    </aside>
  );
}
