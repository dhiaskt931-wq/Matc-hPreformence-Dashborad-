export default function Skeleton({ height = 20, width = '100%', delay = 0, style }) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width,
        animationDelay: delay ? `${delay}ms` : undefined,
        borderRadius: 8,
        ...style,
      }}
    />
  );
}
