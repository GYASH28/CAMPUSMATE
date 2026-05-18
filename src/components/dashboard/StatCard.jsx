import Card from '../common/Card';

const toneMap = {
  cyan: 'text-cyan-200 border-cyan-300/20 bg-cyan-300/10',
  violet: 'text-violet-200 border-violet-300/20 bg-violet-300/10',
  emerald: 'text-emerald-200 border-emerald-300/20 bg-emerald-300/10',
  amber: 'text-amber-200 border-amber-300/20 bg-amber-300/10',
  rose: 'text-rose-200 border-rose-300/20 bg-rose-300/10',
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'cyan',
  delay = 0,
}) {
  return (
    <Card interactive delay={delay} className="min-h-36 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-accent-line" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">
            {value}
          </p>
          {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
        </div>
        <div className={`rounded-2xl border p-3 ${toneMap[tone] || toneMap.cyan}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
