import { Link } from 'react-router-dom';
import { CalendarCheck, Megaphone, UserCheck, Users } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import ProductBanner from '../../components/dashboard/ProductBanner';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { getTodayName } from '../../utils/dateUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function CoordinatorDashboard() {
  const { profile } = useAuth();
  const { data: users } = useCollection('users');
  const { data: timetable } = useCollection('timetable');
  const { data: summaries } = useCollection('attendanceSummary');
  const { data: notices } = useCollection('notices');
  const classMatch = (item) =>
    (!profile?.branch || item.branch === profile.branch) &&
    (!profile?.semester || String(item.semester || '') === String(profile.semester || '')) &&
    (!profile?.division || item.division === profile.division);
  const scopedUsers = users.filter(classMatch);
  const students = scopedUsers.filter((user) => ['student', 'cr'].includes(normalizeRole(user.role)));
  const teachers = users.filter((user) => normalizeRole(user.role) === 'teacher' && (!profile?.branch || user.branch === profile.branch));
  const crs = scopedUsers.filter((user) => normalizeRole(user.role) === 'cr');
  const todayClasses = timetable.filter((item) => classMatch(item) && item.day === getTodayName());
  const lowAttendance = summaries.filter((item) => classMatch(item) && Number(item.percentage || 0) < 75);
  const recentNotices = notices
    .filter((notice) => notice.targetBranch === 'All' || notice.targetBranch === profile?.branch)
    .slice(0, 3);

  return (
    <main className="page-shell space-y-6">
      <PageHeader
        eyebrow="Coordinator workspace"
        title={`Welcome, ${profile?.name || 'Coordinator'}`}
        description="Monitor class health, teachers, CR assignment, attendance, timetable, notices, and reports from one place."
        actions={
          <>
            <Button as={Link} to="/coordinator/attendance">
              <CalendarCheck className="h-4 w-4" />
              Mark Attendance
            </Button>
            <Button as={Link} to="/coordinator/students" variant="secondary">
              <UserCheck className="h-4 w-4" />
              Assign CR
            </Button>
          </>
        }
      />
      <ProductBanner compact />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Students', students.length, Users],
          ['Teachers', teachers.length, UserCheck],
          ['CRs', crs.length, UserCheck],
          ['Low attendance', lowAttendance.length, CalendarCheck],
        ].map(([label, value, Icon]) => (
          <Card key={label}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
              </div>
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h3 className="text-lg font-black text-white">Today’s classes</h3>
          <div className="mt-4 space-y-3">
            {todayClasses.length ? todayClasses.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-black text-white">{item.subjectName}</p>
                <p className="mt-1 text-sm text-slate-400">{item.startTime} - {item.endTime} · Room {item.room || 'TBA'}</p>
              </div>
            )) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">No classes scheduled for today.</p>
            )}
          </div>
        </Card>
        <Card>
          <h3 className="flex items-center gap-2 text-lg font-black text-white">
            <Megaphone className="h-5 w-5 text-cyan-200" />
            Recent notices
          </h3>
          <div className="mt-4 space-y-3">
            {recentNotices.length ? recentNotices.map((notice) => (
              <div key={notice.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-black text-white">{notice.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{notice.message}</p>
              </div>
            )) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">No notices posted yet.</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
