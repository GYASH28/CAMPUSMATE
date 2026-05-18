import { BarChart3, BookOpen, CalendarCheck, ClipboardList, UsersRound } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import SectionHeader from '../../components/common/SectionHeader';
import MotionPage from '../../components/animations/MotionPage';
import ProductBanner from '../../components/dashboard/ProductBanner';
import QuickActionCard from '../../components/dashboard/QuickActionCard';
import StatCard from '../../components/dashboard/StatCard';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { daysUntil, getGreeting, getTodayName } from '../../utils/dateUtils';
import featureIcons from '../../utils/featureIcons';
import { isTeacherSubject } from '../../utils/roleUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const { data: subjects } = useCollection('subjects');
  const { data: users } = useCollection('users');
  const { data: timetable } = useCollection('timetable');
  const { data: notes } = useCollection('notes');
  const { data: assignments } = useCollection('assignments');
  const { data: quizResults } = useCollection('quizResults');
  const { data: sessions } = useCollection('attendanceSessions');
  const { data: teacherAssignments } = useCollection('teacherAssignments');

  const assignmentSubjectIds = new Set(
    teacherAssignments
      .filter((assignment) => assignment.teacherId === user?.uid)
      .map((assignment) => assignment.subjectId),
  );
  const assignedSubjects = subjects.filter(
    (subject) => isTeacherSubject(subject, user, profile) || assignmentSubjectIds.has(subject.id),
  );
  const subjectIds = new Set(assignedSubjects.map((subject) => subject.id));
  const students = users.filter(
    (item) =>
      ['student', 'cr'].includes(normalizeRole(item.role)) &&
      assignedSubjects.some(
        (subject) =>
          subject.branch === item.branch &&
          subject.semester === item.semester &&
          (subject.division ? subject.division === item.division : true),
      ),
  );
  const todayLectures = timetable.filter(
    (entry) =>
      entry.day === getTodayName() &&
      (subjectIds.has(entry.subjectId) || entry.teacherId === user?.uid),
  );
  const activeAssignments = assignments.filter(
    (assignment) => subjectIds.has(assignment.subjectId) && daysUntil(assignment.dueDate) >= 0,
  );
  const recentNotes = notes
    .filter((note) => subjectIds.has(note.subjectId))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 3);
  const relevantResults = quizResults.filter((result) => subjectIds.has(result.subjectId));
  const averageQuiz = relevantResults.length
    ? Math.round(
        relevantResults.reduce((sum, result) => sum + Number(result.percentage || 0), 0) /
          relevantResults.length,
      )
    : 0;
  const recentAttendance = sessions.filter(
    (session) => (session.takenBy === user?.uid || session.teacherId === user?.uid) && ['submitted', 'finalized'].includes(session.status),
  ).length;

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Teacher Dashboard"
        title={`${getGreeting()}, ${profile?.name || 'Teacher'}`}
        description="Manage classes, official attendance, learning material, quizzes, and student performance from one workspace."
      />

      <ProductBanner />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={BookOpen} label="Assigned subjects" value={assignedSubjects.length} hint="Linked by admin" tone="violet" />
        <StatCard icon={UsersRound} label="Total students" value={students.length} hint="Across assigned classes" tone="cyan" />
        <StatCard icon={CalendarCheck} label="Attendance records" value={recentAttendance} hint="Official sessions saved" tone="amber" />
        <StatCard icon={ClipboardList} label="Active assignments" value={activeAssignments.length} hint="For your subjects" tone="emerald" />
        <StatCard icon={BarChart3} label="Average quiz score" value={`${averageQuiz}%`} hint={`${relevantResults.length} attempts`} tone="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <SectionHeader
            eyebrow="Today"
            title="Today's lectures"
            description="Lectures from the timetable for your assigned subjects."
          />
          {todayLectures.length ? (
            <div className="mt-5 space-y-3">
              {todayLectures.map((lecture) => (
                <div key={lecture.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-black text-white">{lecture.subjectName}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {lecture.startTime} - {lecture.endTime} · Room {lecture.room}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No lectures today" message="Assigned timetable lectures will appear here." />
          )}
        </Card>

        <Card>
          <SectionHeader
            eyebrow="Quick actions"
            title="Run your class flow"
            description="Teacher tools for classroom operations."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QuickActionCard to="/teacher/attendance" icon={CalendarCheck} image={featureIcons.attendance} title="Mark Attendance" description="Open the official attendance sheet." tone="violet" />
            <QuickActionCard to="/teacher/notes" icon={BookOpen} image={featureIcons.notes} title="Upload Notes" description="Share study resources." tone="violet" />
            <QuickActionCard to="/teacher/quizzes" icon={BarChart3} image={featureIcons.quizzes} title="Manage Quizzes" description="Review question bank." tone="cyan" />
            <QuickActionCard to="/teacher/progress" icon={UsersRound} image={featureIcons.progress} title="Student Progress" description="Track performance." tone="cyan" />
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader eyebrow="Recent notes" title="Recently uploaded material" />
        {recentNotes.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {recentNotes.map((note) => (
              <div key={note.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="font-black text-white">{note.title}</p>
                <p className="mt-1 text-sm text-slate-400">{note.subjectName}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No notes yet" message="Upload notes for your subjects to see them here." />
        )}
      </Card>
    </MotionPage>
  );
}
