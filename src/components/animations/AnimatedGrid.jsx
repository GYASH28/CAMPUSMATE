export default function AnimatedGrid({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_78%)] ${className}`}
    >
      <div className="h-full w-full bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:46px_46px]" />
    </div>
  );
}
