import { Download, FileText, GraduationCap, TrendingUp, UsersRound, Wrench } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import MotionPage from '../../components/animations/MotionPage';
import StatCard from '../../components/dashboard/StatCard';
import useCollection from '../../hooks/useCollection';
import { calculatePercentage } from '../../utils/attendanceUtils';
import { daysUntil } from '../../utils/dateUtils';
import { exportCampusReport } from '../../utils/reportUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function AdminAnalytics() {
  const { data: users } = useCollection('users');
  const { data: subjects } = useCollection('subjects');
  const { data: notes } = useCollection('notes');
  const { data: assignments } = useCollection('assignments');
  const { data: exams } = useCollection('exams');
  const { data: attendanceSummary } = useCollection('attendanceSummary');
  const { data: assignmentStatus } = useCollection('assignmentStatus');
  const { data: quizQuestions } = useCollection('quizQuestions');
  const { data: quizResults } = useCollection('quizResults');
  const { data: complaints } = useCollection('complaints');

  const students = users.filter((user) => ['student', 'cr'].includes(normalizeRole(user.role)));
  const teachers = users.filter((user) => normalizeRole(user.role) === 'teacher');
  const coordinators = users.filter((user) => normalizeRole(user.role) === 'coordinator');
  const totalPresent = attendanceSummary.reduce((sum, item) => sum + Number(item.presentCount || 0) + Number(item.lateCount || 0), 0);
  const totalLectures = attendanceSummary.reduce((sum, item) => sum + Number(item.totalLectures || 0), 0);
  const averageAttendance = calculatePercentage(totalPresent, totalLectures);
  const averageQuiz = quizResults.length
    ? Math.round(quizResults.reduce((sum, result) => sum + Number(result.percentage || 0), 0) / quizResults.length)
    : 0;
  const assignmentOpportunities = Math.max(assignments.length * Math.max(students.length, 1), assignments.length);
  const assignmentCompletion = assignmentOpportunities
    ? Math.min(
        100,
        Math.round(
          (assignmentStatus.filter((item) => item.status === 'Completed').length /
            assignmentOpportunities) *
            100,
        ),
      )
    : 0;
  const openComplaints = complaints.filter((item) => !['Resolved', 'Rejected'].includes(item.status)).length;
  const upcomingExams = exams.filter((exam) => daysUntil(exam.examDate) >= 0).length;
  const subjectActivity = subjects.map((subject) => ({
    subject: subject.code,
    notes: notes.filter((note) => note.subjectId === subject.id).length,
    quizzes: quizQuestions.filter((question) => question.subjectId === subject.id).length,
  }));
  const quizTrend = quizResults.slice(-8).map((result, index) => ({
    attempt: `#${index + 1}`,
    score: result.percentage || 0,
  }));

  const exportReport = () => {
    exportCampusReport({
      title: 'Admin System Analytics Report',
      generatedBy: 'Admin',
      summary: [
        { label: 'Students', value: students.length },
        { label: 'Teachers', value: teachers.length },
        { label: 'Coordinators', value: coordinators.length },
        { label: 'Subjects', value: subjects.length },
        { label: 'Average attendance', value: `${averageAttendance}%` },
        { label: 'Average quiz score', value: `${averageQuiz}%` },
        { label: 'Open complaints', value: openComplaints },
      ],
      columns: [
        { key: 'subject', label: 'Subject' },
        { key: 'notes', label: 'Notes' },
        { key: 'quizzes', label: 'Quiz Qs' },
      ],
      rows: subjectActivity,
      fileName: 'campusmate-admin-system-report.pdf',
    });
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Admin Analytics"
        title="Campus health dashboard"
        description="System-wide metrics for users, learning content, attendance, quizzes, assignments, exams, and complaints."
        actions={
          <Button type="button" variant="secondary" onClick={exportReport}>
            <Download className="h-4 w-4" />
            Export System Report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UsersRound} label="Students" value={students.length} hint={`${teachers.length} teachers, ${coordinators.length} coordinators`} tone="cyan" />
        <StatCard icon={GraduationCap} label="Subjects" value={subjects.length} hint={`${quizQuestions.length} quiz questions`} tone="violet" />
        <StatCard icon={TrendingUp} label="Average attendance" value={`${averageAttendance}%`} hint={`${totalPresent}/${totalLectures} lectures`} tone={averageAttendance >= 75 ? 'emerald' : 'amber'} />
        <StatCard icon={Wrench} label="Open complaints" value={openComplaints} hint={`${complaints.length} total`} tone={openComplaints ? 'rose' : 'emerald'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h3 className="text-xl font-black text-white">Subject activity</h3>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="subject" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16 }} />
                <Bar dataKey="notes" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                <Bar dataKey="quizzes" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-black text-white">Quiz score trend</h3>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quizTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="attempt" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16 }} />
                <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Notes" value={notes.length} hint="Uploaded resources" tone="cyan" />
        <StatCard icon={FileText} label="Assignments" value={assignments.length} hint={`${assignmentCompletion}% completion signal`} tone="amber" />
        <StatCard icon={TrendingUp} label="Average quiz" value={`${averageQuiz}%`} hint={`${quizResults.length} attempts`} tone="violet" />
        <StatCard icon={GraduationCap} label="Upcoming exams" value={upcomingExams} hint="Scheduled exams" tone="emerald" />
      </div>
    </MotionPage>
  );
}
