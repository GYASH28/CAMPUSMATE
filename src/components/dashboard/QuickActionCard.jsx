import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function QuickActionCard({ to, icon: Icon, image, title, description, tone = 'cyan' }) {
  const toneClass = tone === 'violet' ? 'text-violet-200 border-violet-300/20' : 'text-cyan-200 border-cyan-300/20';

  return (
    <Link
      to={to}
      className="group block rounded-3xl border border-white/10 bg-white/[0.055] p-4 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.09] hover:shadow-glow"
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`rounded-2xl border bg-white/[0.05] p-3 ${toneClass}`}>
          {image ? (
            <img
              src={image}
              alt=""
              className="h-8 w-8 rounded-xl object-cover shadow-[0_0_16px_rgba(34,211,238,0.28)]"
              loading="lazy"
            />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
      </div>
      <p className="mt-4 font-black text-white">{title}</p>
      {description ? (
        <p className="mt-1 text-sm leading-5 text-slate-400">{description}</p>
      ) : null}
    </Link>
  );
}
