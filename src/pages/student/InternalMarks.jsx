import { Award, BookOpenCheck } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import MotionPage from '../../components/animations/MotionPage';
import ProgressRing from '../../components/dashboard/ProgressRing';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';

function performance(percent) {
  if (percent >= 80) return { label: 'Excellent', tone: 'emerald' };
  if (percent >= 60) return { label: 'Good', tone: 'cyan' };
  return { label: 'Needs Improvement', tone: 'amber' };
}

export default function InternalMarks() {
  const { user } = useAuth();
  const { data: marks } = useCollection('internalMarks');
  const myMarks = marks.filter((mark) => mark.studentId === user?.uid);

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Internal Marks"
        title="Subject-wise internal performance"
        description="View unit test, assignment, practical, attendance, and total internal marks added by teachers."
      />

      {myMarks.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {myMarks.map((mark) => {
            const percent = Math.round((Number(mark.totalMarks || 0) / Number(mark.maxMarks || 1)) * 100);
            const status = performance(percent);
            return (
              <Card key={mark.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <h3 className="mt-4 text-xl font-black text-white">{mark.subjectName}</h3>
                  </div>
                  <Award className="h-6 w-6 text-cyan-200" />
                </div>
                <div className="mt-5 grid place-items-center">
                  <ProgressRing value={percent} tone={status.tone} size={132} label="Internal" />
                  <p className="mt-4 text-2xl font-black text-white">{mark.totalMarks}/{mark.maxMarks}</p>
                </div>
                <div className="mt-5 grid gap-2 text-sm">
                  {[
                    ['Unit test', mark.unitTestMarks],
                    ['Assignment', mark.assignmentMarks],
                    ['Practical', mark.practicalMarks],
                    ['Attendance', mark.attendanceMarks],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-bold text-white">{value || 0}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={BookOpenCheck} title="No internal marks yet" message="Marks added by teachers will appear here subject-wise." />
      )}
    </MotionPage>
  );
}
