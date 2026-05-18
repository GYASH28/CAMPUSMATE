import { AlertTriangle, CalendarClock, ClipboardList, TimerReset } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import SectionHeader from '../common/SectionHeader';
import { daysUntil } from '../../utils/dateUtils';

export default function TodayMode({
  today,
  classes = [],
  pendingAssignments = [],
  nextExam,
  attendanceWarning,
}) {
  const nextClass = classes[0];

  return (
    <Card className="overflow-hidden">
      <SectionHeader
        eyebrow="Today mode"
        title="Your academic command center"
        description="A focused snapshot of classes, tasks, exams, and attendance risks for today."
      />
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <CalendarClock className="h-5 w-5 text-cyan-200" />
          <p className="mt-3 text-sm text-slate-400">{today}</p>
          <p className="mt-1 text-2xl font-black text-white">{classes.length}</p>
          <p className="text-xs font-semibold text-slate-500">classes today</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <TimerReset className="h-5 w-5 text-violet-200" />
          <p className="mt-3 text-sm text-slate-400">Next class</p>
          <p className="mt-1 truncate text-lg font-black text-white">
            {nextClass?.subjectName || 'No class'}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            {nextClass ? `${nextClass.startTime} - ${nextClass.room}` : 'Clear schedule'}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <ClipboardList className="h-5 w-5 text-amber-200" />
          <p className="mt-3 text-sm text-slate-400">Pending work</p>
          <p className="mt-1 text-2xl font-black text-white">{pendingAssignments.length}</p>
          <p className="text-xs font-semibold text-slate-500">assignments open</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <AlertTriangle className="h-5 w-5 text-rose-200" />
          <p className="mt-3 text-sm text-slate-400">Upcoming exam</p>
          <p className="mt-1 text-2xl font-black text-white">
            {nextExam ? `${Math.max(daysUntil(nextExam.examDate), 0)}d` : '0d'}
          </p>
          <p className="truncate text-xs font-semibold text-slate-500">
            {nextExam?.subjectName || 'No exam scheduled'}
          </p>
        </div>
      </div>
      {attendanceWarning ? (
        <div className="mt-4 rounded-3xl border border-amber-300/25 bg-amber-400/10 p-4">
          <Badge tone="amber" icon={AlertTriangle}>Attendance watch</Badge>
          <p className="mt-3 text-sm leading-6 text-amber-50">
            Attend the next few lectures to stay above 75%.
          </p>
        </div>
      ) : null}
    </Card>
  );
}
