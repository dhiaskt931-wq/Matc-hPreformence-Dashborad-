export default function Header({ meta }) {
  if (!meta) return null;
  const { team1, team2, score1, score2, venue, date, competition } = meta;
  const t1 = team1?.slice(0, 3).toUpperCase();
  const t2 = team2?.slice(0, 3).toUpperCase();

  return (
    <div style={{ position: 'relative', marginBottom: 20, borderRadius: 16, overflow: 'hidden' }}>
      {/* ambient team color bleed */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(96,165,250,0.07) 0%, transparent 50%, rgba(248,113,113,0.07) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        border: '1px solid var(--border)',
        borderRadius: 16,
      }} />

      <div style={{
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        background: 'rgba(255,255,255,0.03)',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>

        {/* Team 1 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--arg)',
            background: 'var(--arg-dim)',
            border: '1px solid rgba(96,165,250,0.2)',
            padding: '3px 10px', borderRadius: 99,
          }}>
            {t1}
          </div>
          <div style={{
            fontSize: 22, fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            {team1}
          </div>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--muted)',
            marginBottom: 2,
          }}>
            {competition}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '8px 24px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-hi)',
            borderRadius: 14,
          }}>
            <span style={{
              fontSize: 48, fontWeight: 800, color: 'var(--arg)',
              letterSpacing: '-0.03em', lineHeight: 1,
              textShadow: '0 0 32px rgba(96,165,250,0.4)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {score1}
            </span>
            <span style={{
              fontSize: 20, fontWeight: 300, color: 'var(--muted)',
              margin: '0 8px', alignSelf: 'center',
            }}>–</span>
            <span style={{
              fontSize: 48, fontWeight: 800, color: 'var(--fra)',
              letterSpacing: '-0.03em', lineHeight: 1,
              textShadow: '0 0 32px rgba(248,113,113,0.4)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {score2}
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--muted)', fontSize: 11, marginTop: 2,
          }}>
            <span>{venue}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{date}</span>
          </div>
        </div>

        {/* Team 2 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--fra)',
            background: 'var(--fra-dim)',
            border: '1px solid rgba(248,113,113,0.2)',
            padding: '3px 10px', borderRadius: 99,
          }}>
            {t2}
          </div>
          <div style={{
            fontSize: 22, fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.02em', lineHeight: 1.1, textAlign: 'right',
          }}>
            {team2}
          </div>
        </div>
      </div>
    </div>
  );
}
