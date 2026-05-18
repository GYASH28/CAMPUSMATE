import { Link } from 'react-router-dom';
import { CalendarCheck, ClipboardList, Users } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import ProductBanner from '../../components/dashboard/ProductBanner';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { daysUntil, getTodayName } from '../../utils/dateUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function CRDashboard() {
  const { profile } = useAuth();
  const { data: users } = useCollection('users');
  const { data: timetable } = useCollection('timetable');
  const { data: assignments } = useCollection('assignments');
  const { data: notices } = useCollection('notices');
  const { data: exams } = useCollection('exams');
  const classMatch = (item) =>
    item.branch === profile?.branch &&
    String(item.semester || '') === String(profile?.semester || '') &&
    (item.division || profile?.division) === profile?.division;
  const classStudents = users.filter((user) => ['student', 'cr'].includes(normalizeRole(user.role)) && classMatch(user));
  const todayClasses = timetable.filter((item) => classMatch(item) && item.day === getTodayName());
  const pendingAssignments = assignments.filter((item) => item.branch ? classMatch(item) : true).length;
  const recentNotices = notices
    .filter((notice) => notice.targetBranch === 'All' || notice.targetBranch === profile?.branch)
    .slice(0, 3);
  const nextExam = exams
    .filter((exam) => !exam.branch || classMatch(exam))
    .sort((a, b) => daysUntil(a.examDate) - daysUntil(b.examDate))[0];

  return (
    <main className="page-shell space-y-6">
      <PageHeader
        eyebrow="Class representative"
        title={`Welcome, ${profile?.name || 'CR'}`}
        description="Track your class, take official attendance when allowed, and keep classmates aligned with timetable, tasks, notices, and exams."
        actions={
          <Button as={Link} to="/cr/attendance">
            <CalendarCheck className="h-4 w-4" />
            Take Attendance
          </Button>
        }
      />
      <ProductBanner compact />
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm font-semibold text-slate-400">Class students</p>
          <p className="mt-2 text-3xl font-black text-white">{classStudents.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-400">Today’s classes</p>
          <p className="mt-2 text-3xl font-black text-white">{todayClasses.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-400">Assignments</p>
          <p className="mt-2 text-3xl font-black text-white">{pendingAssignments}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-400">Next exam</p>
          <p className="mt-2 text-3xl font-black text-white">{nextExam ? `${daysUntil(nextExam.examDate)}d` : 'None'}</p>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h3 className="flex items-center gap-2 text-lg font-black text-white">
            <ClipboardList className="h-5 w-5 text-cyan-200" />
            Today’s timetable
          </h3>
          <div className="mt-4 space-y-3">
            {todayClasses.length ? todayClasses.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-black text-white">{item.subjectName}</p>
                <p className="mt-1 text-sm text-slate-400">{item.startTime} - {item.endTime} · {item.room || 'Room TBA'}</p>
              </div>
            )) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">No classes today.</p>
            )}
          </div>
        </Card>
        <Card>
          <h3 className="flex items-center gap-2 text-lg font-black text-white">
            <Users className="h-5 w-5 text-cyan-200" />
            Recent notices
          </h3>
          <div className="mt-4 space-y-3">
            {recentNotices.length ? recentNotices.map((notice) => (
              <div key={notice.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-black text-white">{notice.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{notice.message}</p>
              </div>
            )) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">No notices yet.</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
