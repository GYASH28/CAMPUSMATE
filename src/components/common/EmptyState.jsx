import { FileSearch } from 'lucide-react';
import Card from './Card';

export default function EmptyState({
  title = 'Nothing here yet',
  message = 'Once data is added, it will appear here.',
  action,
  icon: Icon = FileSearch,
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="relative rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-200 shadow-glow">
        <div className="absolute inset-0 rounded-3xl bg-cyan-300/10 blur-xl" />
        <Icon className="relative h-8 w-8" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-slate-400">{message}</p>
      </div>
      {action}
    </Card>
  );
}
