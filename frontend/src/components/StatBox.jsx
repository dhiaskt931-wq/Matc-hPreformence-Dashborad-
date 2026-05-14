export default function StatBox({ label, value }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '14px 18px' }}>
      <div className="label" style={{ marginBottom: 10 }}>{label}</div>
      <div style={{
        color: 'var(--text)',
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      }}>
        {value}
      </div>
    </div>
  );
}
