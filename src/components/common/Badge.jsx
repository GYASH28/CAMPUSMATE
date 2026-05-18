const toneMap = {
  cyan: 'badge-cyan',
  violet: 'badge-violet',
  emerald: 'badge-emerald',
  amber: 'badge-amber',
  rose: 'badge-rose',
  slate: 'border-white/10 bg-white/10 text-slate-200',
};

export default function Badge({
  children,
  tone = 'cyan',
  icon: Icon,
  className = '',
}) {
  return (
    <span className={`badge ${toneMap[tone] || toneMap.cyan} ${className}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}
