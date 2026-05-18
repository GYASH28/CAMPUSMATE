const tones = {
  Safe: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200',
  Warning: 'border-amber-300/30 bg-amber-400/10 text-amber-200',
  Critical: 'border-rose-300/30 bg-rose-400/10 text-rose-200',
  Pending: 'border-amber-300/30 bg-amber-400/10 text-amber-200',
  Completed: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200',
  Overdue: 'border-rose-300/30 bg-rose-400/10 text-rose-200',
  Important: 'border-rose-300/30 bg-rose-400/10 text-rose-200',
  Exam: 'border-violet-300/30 bg-violet-400/10 text-violet-200',
  Event: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200',
  Holiday: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200',
  General: 'border-slate-300/20 bg-white/10 text-slate-200',
};

export default function StatusPill({ children, tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
        tones[tone || children] || tones.General
      }`}
    >
      {children}
    </span>
  );
}
