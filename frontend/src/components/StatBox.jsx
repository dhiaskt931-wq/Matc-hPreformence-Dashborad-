export default function StatBox({ label, value }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '12px 16px' }}>
      <div className="label" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>{value}</div>
    </div>
  );
}
