import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const NAV = [
  {
    group: 'Match Analysis',
    items: [
      { path: '/',             icon: '⚽', label: 'Match Overview' },
      { path: '/xg-timeline',  icon: '📈', label: 'xG Timeline',      badge: 'soon' },
      { path: '/shot-analysis',icon: '🎯', label: 'Shot Analysis',     badge: 'soon' },
      { path: '/pass-network', icon: '🔗', label: 'Pass Network',      badge: 'soon' },
    ],
  },
  {
    group: 'Player Analysis',
    items: [
      { path: '/heatmaps',     icon: '🌡️', label: 'Player Heatmaps',  badge: 'soon' },
      { path: '/top-stats',    icon: '🏅', label: 'Top Performers',    badge: 'soon' },
      { path: '/duels',        icon: '⚔️', label: 'Duels & Pressure',  badge: 'soon' },
    ],
  },
  {
    group: 'Team Analysis',
    items: [
      { path: '/defensive',    icon: '🛡️', label: 'Defensive Actions', badge: 'soon' },
      { path: '/set-pieces',   icon: '📐', label: 'Set Pieces',         badge: 'soon' },
      { path: '/momentum',     icon: '⚡', label: 'Momentum Chart',     badge: 'soon' },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

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
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '16px 0' : '16px 14px',
        borderBottom: '1px solid var(--border)',
        gap: 8,
      }}>
        {!collapsed && (
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
            ⚽ Football Lab
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 16, padding: 4, borderRadius: 4,
            flexShrink: 0,
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '›' : '‹'}
        </button>
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
              }}>
                {group}
              </div>
            )}
            {items.map(({ path, icon, label, badge }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px 0' : '9px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? 'var(--text)' : 'var(--muted)',
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'none',
                  borderLeft: isActive ? '2px solid var(--arg)' : '2px solid transparent',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background 0.15s',
                  whiteSpace: 'nowrap',
                })}
              >
                <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, padding: '2px 5px',
                        borderRadius: 4, background: 'var(--border)',
                        color: 'var(--muted)', textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '12px 14px', borderTop: '1px solid var(--border)',
          color: 'var(--muted)', fontSize: 10,
        }}>
          StatsBomb Open Data
        </div>
      )}
    </aside>
  );
}
