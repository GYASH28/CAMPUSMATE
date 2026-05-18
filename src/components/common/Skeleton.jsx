export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-shimmer rounded-2xl bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.05)_100%)] bg-[length:700px_100%] ${className}`}
    />
  );
}
