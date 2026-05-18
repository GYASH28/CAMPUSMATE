import {
  Bell,
  BookOpen,
  Brain,
  CalendarClock,
  ClipboardList,
  DatabaseZap,
  FileText,
  LibraryBig,
  Plus,
  Send,
  UploadCloud,
  UsersRound,
  Wrench,
  FileCheck2,
  BarChart3,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import SectionHeader from '../../components/common/SectionHeader';
import StatusPill from '../../components/common/StatusPill';
import MotionPage from '../../components/animations/MotionPage';
import QuickActionCard from '../../components/dashboard/QuickActionCard';
import StatCard from '../../components/dashboard/StatCard';
import ProductBanner from '../../components/dashboard/ProductBanner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { seedDemoData } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { formatDateTime, getGreeting } from '../../utils/dateUtils';
import featureIcons from '../../utils/featureIcons';
import { normalizeRole } from '../../utils/authUtils';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: timetable } = useCollection('timetable');
  const { data: notes } = useCollection('notes');
  const { data: assignments } = useCollection('assignments');
  const { data: notices } = useCollection('notices');
  const { data: exams } = useCollection('exams');
  const { data: quizQuestions } = useCollection('quizQuestions');
  const { data: quizResults } = useCollection('quizResults');
  const { data: users } = useCollection('users');
  const { data: complaints } = useCollection('complaints');
  const { data: contributions } = useCollection('contributions');
  const { data: attendanceSessions } = useCollection('attendanceSessions');
  const { data: attendanceSummary } = useCollection('attendanceSummary');

  const students = users.filter((item) => ['student', 'cr'].includes(normalizeRole(item.role)));
  const crs = users.filter((item) => normalizeRole(item.role) === 'cr');
  const teachers = users.filter((item) => normalizeRole(item.role) === 'teacher');
  const coordinators = users.filter((item) => normalizeRole(item.role) === 'coordinator');
  const activeAttendanceSessions = attendanceSessions.filter((session) => session.status === 'active');
  const finalizedAttendanceSessions = attendanceSessions.filter((session) => ['submitted', 'finalized'].includes(session.status));
  const averageAttendance = attendanceSummary.length
    ? Math.round(
        attendanceSummary.reduce((sum, item) => sum + Number(item.percentage || 0), 0) /
          attendanceSummary.length,
      )
    : 0;
  const criticalAttendanceStudents = new Set(
    attendanceSummary
      .filter((item) => Number(item.totalLectures || 0) > 0 && Number(item.percentage || 0) < 60)
      .map((item) => item.studentId),
  ).size;
  const stats = [
    { label: 'Total users', value: users.length, icon: UsersRound, tone: 'cyan' },
    { label: 'Students', value: students.length, icon: UsersRound, tone: 'emerald' },
    { label: 'CRs', value: crs.length, icon: UsersRound, tone: 'cyan' },
    { label: 'Teachers', value: teachers.length, icon: UsersRound, tone: 'violet' },
    { label: 'Coordinators', value: coordinators.length, icon: UsersRound, tone: 'violet' },
    { label: 'Total subjects', value: subjects.length, icon: LibraryBig, tone: 'cyan' },
    { label: 'Timetable entries', value: timetable.length, icon: CalendarClock, tone: 'violet' },
    { label: 'Total notes', value: notes.length, icon: FileText, tone: 'emerald' },
    { label: 'Assignments', value: assignments.length, icon: ClipboardList, tone: 'amber' },
    { label: 'Notices', value: notices.length, icon: Bell, tone: 'rose' },
    { label: 'Exams', value: exams.length, icon: BookOpen, tone: 'cyan' },
    { label: 'Quiz questions', value: quizQuestions.length, icon: Brain, tone: 'violet' },
    { label: 'Quiz attempts', value: quizResults.length, icon: DatabaseZap, tone: 'emerald' },
    { label: 'Open complaints', value: complaints.filter((item) => !['Resolved', 'Rejected'].includes(item.status)).length, icon: Wrench, tone: 'rose' },
    { label: 'Pending contributions', value: contributions.filter((item) => item.status === 'Pending approval').length, icon: FileCheck2, tone: 'amber' },
    { label: 'Attendance sessions', value: attendanceSessions.length, icon: DatabaseZap, tone: 'violet' },
    { label: 'Active attendance', value: activeAttendanceSessions.length, icon: DatabaseZap, tone: 'amber' },
    { label: 'Finalized attendance', value: finalizedAttendanceSessions.length, icon: DatabaseZap, tone: 'emerald' },
    { label: 'Average attendance', value: `${averageAttendance}%`, icon: BarChart3, tone: averageAttendance >= 75 ? 'emerald' : averageAttendance >= 60 ? 'amber' : 'rose' },
    { label: 'Critical students', value: criticalAttendanceStudents, icon: UsersRound, tone: 'rose' },
  ];

  const quickActions = [
    { title: 'Add Subject', description: 'Create course metadata.', to: '/admin/subjects', icon: Plus, image: featureIcons.notes, tone: 'violet' },
    { title: 'Add Timetable', description: 'Schedule classes fast.', to: '/admin/timetable', icon: CalendarClock, image: featureIcons.timetable, tone: 'violet' },
    { title: 'Upload Notes', description: 'Publish PDFs to students.', to: '/admin/notes', icon: UploadCloud, image: featureIcons.notes, tone: 'violet' },
    { title: 'Create Assignment', description: 'Set due dates and files.', to: '/admin/assignments', icon: ClipboardList, image: featureIcons.assignments, tone: 'violet' },
    { title: 'Post Notice', description: 'Broadcast updates.', to: '/admin/notices', icon: Send, image: featureIcons.notices, tone: 'violet' },
    { title: 'Add Exam', description: 'Set countdowns and syllabus.', to: '/admin/exams', icon: BookOpen, image: featureIcons.exams, tone: 'violet' },
    { title: 'Manage Quizzes', description: 'Add MCQs and review AI generation.', to: '/admin/quizzes', icon: Brain, image: featureIcons.quizzes, tone: 'violet' },
    { title: 'Users', description: 'Manage role and access.', to: '/admin/users', icon: UsersRound, image: featureIcons.admin, tone: 'violet' },
    { title: 'Analytics', description: 'Review system health.', to: '/admin/analytics', icon: BarChart3, image: featureIcons.progress, tone: 'violet' },
    { title: 'Complaints', description: 'Resolve campus issues.', to: '/admin/complaints', icon: Wrench, image: featureIcons.complaints, tone: 'violet' },
    { title: 'Contributions', description: 'Approve student resources.', to: '/admin/contributions', icon: FileCheck2, image: featureIcons.contributions, tone: 'violet' },
  ];

  const activity = [
    ...notes.map((item) => ({ ...item, type: 'Note', title: item.title })),
    ...assignments.map((item) => ({ ...item, type: 'Assignment', title: item.title })),
    ...notices.map((item) => ({ ...item, type: 'Notice', title: item.title })),
    ...exams.map((item) => ({ ...item, type: 'Exam', title: item.subjectName })),
    ...quizQuestions.map((item) => ({ ...item, type: 'Quiz', title: item.question })),
    ...complaints.map((item) => ({ ...item, type: 'Complaint', title: item.title })),
    ...contributions.map((item) => ({ ...item, type: 'Contribution', title: item.title })),
  ]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 6);

  const handleSeed = async () => {
    try {
      await seedDemoData(user?.uid);
      notify('Demo data added for Computer Engineering & IoT Semester 2 Division A.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Admin control center"
        title={`${getGreeting()}, ${profile?.name || 'Admin'}`}
        description="Manage CampusMate users, teachers, coordinators, CRs, official attendance, analytics, complaints, contributions, and academic workflows."
        actions={
          <Button type="button" onClick={handleSeed}>
            <DatabaseZap className="h-4 w-4" />
            Seed Demo Data
          </Button>
        }
      />

      <ProductBanner />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            hint="Live Firestore collection"
            tone={stat.tone}
            delay={index * 0.03}
          />
        ))}
      </div>

      <Card>
        <SectionHeader
          eyebrow="Quick actions"
          title="Run the campus workspace"
          description="Jump straight to the admin task you need."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <QuickActionCard key={action.to} {...action} />
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader
          eyebrow="Recent activity"
          title="Latest content changes"
          description="A quick pulse of notes, assignments, notices, exams, and quiz content."
        />
        {activity.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {activity.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="rounded-3xl border border-white/10 bg-white/[0.05] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={item.type === 'Exam' ? 'Exam' : 'General'}>
                    {item.type}
                  </StatusPill>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <p className="mt-3 font-black text-white">{item.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="No activity yet"
              message="Seed demo data or start adding records from the admin pages."
            />
          </div>
        )}
      </Card>
    </MotionPage>
  );
}
