import { CalendarClock } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { daysUntil, formatDate } from '../../utils/dateUtils';

export default function ExamCountdownCard({ exam }) {
  const remaining = exam ? Math.max(daysUntil(exam.examDate), 0) : 0;

  return (
    <Card tone="violet" className="overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
            Upcoming exam
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            {exam?.subjectName || 'No exam scheduled'}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {exam?.examType || 'Exam details will appear here'}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-3 text-violet-100">
          <CalendarClock className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
        <div>
          <p className="text-5xl font-black tracking-tight text-white">{remaining}</p>
          <p className="text-sm font-semibold text-slate-400">days left</p>
        </div>
        <div className="text-right">
          <Badge tone={remaining <= 3 ? 'rose' : 'violet'}>Study planner live</Badge>
          <p className="mt-2 text-xs text-slate-500">{formatDate(exam?.examDate)}</p>
        </div>
      </div>
      {exam?.syllabus ? (
        <p className="mt-4 text-sm leading-6 text-slate-400">
          <span className="font-semibold text-slate-200">Syllabus:</span> {exam.syllabus}
        </p>
      ) : null}
    </Card>
  );
}
