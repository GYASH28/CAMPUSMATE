import { CalendarClock, Target } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import StatusPill from '../../components/common/StatusPill';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { daysUntil, formatDate } from '../../utils/dateUtils';
import { isStudentSubject } from '../../utils/roleUtils';

export default function Exams() {
  const { profile } = useAuth();
  const { data: subjects } = useCollection('subjects');
  const { data: exams } = useCollection('exams');

  const subjectIds = new Set(
    subjects
      .filter((subject) => isStudentSubject(subject, profile))
      .map((subject) => subject.id),
  );
  const relevantExams = exams
    .filter((exam) => subjectIds.has(exam.subjectId))
    .sort((a, b) => daysUntil(a.examDate) - daysUntil(b.examDate));

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Exam countdown"
        title="Upcoming exam schedule"
        description="Sorted by nearest date with syllabus and direct study-planner support."
      />

      {relevantExams.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {relevantExams.map((exam, index) => {
            const remaining = daysUntil(exam.examDate);
            return (
              <Card key={exam.id} delay={index * 0.03}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge tone="violet">{exam.examType}</Badge>
                    <h3 className="mt-4 text-xl font-black text-white">{exam.subjectName}</h3>
                  </div>
                  <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-3 text-violet-100">
                    <CalendarClock className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.05] p-5 text-center">
                  <p className="text-5xl font-black text-white">
                    {remaining >= 0 ? remaining : 0}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    {remaining >= 0 ? 'days left' : 'exam completed'}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusPill tone={remaining <= 3 ? 'Important' : 'Exam'}>
                    {remaining <= 3 ? 'Important' : 'Exam'}
                  </StatusPill>
                  <p className="text-sm text-slate-400">{formatDate(exam.examDate)}</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">
                  <span className="font-semibold text-slate-200">Syllabus:</span>{' '}
                  {exam.syllabus}
                </p>
                <div className="mt-4 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-cyan-100">
                    <Target className="h-4 w-4" />
                    Study planner is live
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={CalendarClock}
          title="No exams scheduled"
          message="Exam schedule added by admin for your subjects will appear here."
        />
      )}
    </MotionPage>
  );
}
