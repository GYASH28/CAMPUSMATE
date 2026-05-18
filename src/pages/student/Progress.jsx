import { Link } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, Brain, CheckCircle2, ClipboardList, Download, Trophy } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import MotionPage from '../../components/animations/MotionPage';
import StatCard from '../../components/dashboard/StatCard';
import ProgressRing from '../../components/dashboard/ProgressRing';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { calculatePercentage } from '../../utils/attendanceUtils';
import { exportCampusReport } from '../../utils/reportUtils';
import { isStudentSubject } from '../../utils/roleUtils';

export default function Progress() {
  const { user, profile } = useAuth();
  const { data: quizResults } = useCollection('quizResults');
  const { data: attendance } = useCollection('attendance');
  const { data: assignments } = useCollection('assignments');
  const { data: assignmentStatus } = useCollection('assignmentStatus');
  const { data: subjects } = useCollection('subjects');
  const { data: studyPlans } = useCollection('studyPlans');

  const myResults = quizResults.filter((item) => item.userId === user?.uid);
  const averageQuiz = myResults.length
    ? Math.round(myResults.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / myResults.length)
    : 0;
  const grouped = myResults.reduce((acc, item) => {
    acc[item.subjectName] = acc[item.subjectName] || [];
    acc[item.subjectName].push(item.percentage || 0);
    return acc;
  }, {});
  const subjectScores = Object.entries(grouped).map(([subject, scores]) => ({
    subject,
    average: Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length),
  }));
  const bestSubject = [...subjectScores].sort((a, b) => b.average - a.average)[0];
  const weakestSubject = [...subjectScores].sort((a, b) => a.average - b.average)[0];
  const weakTopics = Array.from(
    new Set(myResults.flatMap((item) => item.weakTopics || [])),
  ).slice(0, 8);

  const myAttendance = attendance.filter((item) => item.userId === user?.uid);
  const totalPresent = myAttendance.reduce((sum, item) => sum + Number(item.present || 0), 0);
  const totalLectures = myAttendance.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const attendanceAverage = calculatePercentage(totalPresent, totalLectures);
  const subjectIds = new Set(
    subjects
      .filter((item) => isStudentSubject(item, profile))
      .map((item) => item.id),
  );
  const relevantAssignments = assignments.filter((item) => subjectIds.has(item.subjectId));
  const completedAssignments = assignmentStatus.filter(
    (item) => item.userId === user?.uid && item.status === 'Completed',
  );
  const assignmentRate = relevantAssignments.length
    ? Math.round((completedAssignments.length / relevantAssignments.length) * 100)
    : 0;
  const myPlans = studyPlans.filter((item) => item.userId === user?.uid);
  const planProgress = myPlans.length
    ? Math.round(
        myPlans.reduce((sum, item) => sum + Math.min((item.completedDays?.length || 0) * 20, 100), 0) /
          myPlans.length,
      )
    : 0;

  const exportReport = () => {
    exportCampusReport({
      title: 'Student Learning Progress Report',
      generatedBy: profile?.name,
      summary: [
        { label: 'Average quiz score', value: `${averageQuiz}%` },
        { label: 'Attendance health', value: `${attendanceAverage}%` },
        { label: 'Assignment completion', value: `${assignmentRate}%` },
        { label: 'Study planner completion', value: `${planProgress}%` },
      ],
      columns: [
        { key: 'subject', label: 'Subject' },
        { key: 'average', label: 'Quiz Avg' },
      ],
      rows: subjectScores,
      fileName: 'campusmate-student-progress.pdf',
    });
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Student Progress"
        title="Learning analytics"
        description="Track quiz performance, attendance health, assignments, study plans, and weak topics."
        actions={
          <Button type="button" variant="secondary" onClick={exportReport}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Trophy} label="Average quiz score" value={`${averageQuiz}%`} hint={`${myResults.length} attempts`} tone="violet" />
        <StatCard icon={Brain} label="Best subject" value={bestSubject?.average ? `${bestSubject.average}%` : 'N/A'} hint={bestSubject?.subject || 'No attempts'} tone="emerald" />
        <StatCard icon={AlertTriangle} label="Weakest subject" value={weakestSubject?.average ? `${weakestSubject.average}%` : 'N/A'} hint={weakestSubject?.subject || 'No attempts'} tone="rose" />
        <StatCard icon={BadgeCheck} label="Attendance health" value={`${attendanceAverage}%`} hint={`${totalPresent}/${totalLectures} lectures`} tone={attendanceAverage >= 75 ? 'emerald' : 'amber'} />
        <StatCard icon={ClipboardList} label="Assignments" value={`${assignmentRate}%`} hint="completion rate" tone="cyan" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="grid place-items-center text-center">
          <ProgressRing value={planProgress} tone="cyan" size={160} label="Plans" />
          <h3 className="mt-5 text-2xl font-black text-white">Study plan completion</h3>
          <p className="mt-2 text-sm text-slate-400">{myPlans.length} saved plans tracked</p>
        </Card>
        <Card>
          <Badge tone="rose" icon={AlertTriangle}>Weak topic detection</Badge>
          <h3 className="mt-4 text-2xl font-black text-white">Topics to revise</h3>
          {weakTopics.length ? (
            <>
              <div className="mt-5 flex flex-wrap gap-2">
                {weakTopics.map((topic) => <Badge key={topic} tone="rose">{topic}</Badge>)}
              </div>
              <Button as={Link} to="/student/ai" className="mt-6">
                <Brain className="h-4 w-4" />
                Ask AI to explain weak topics
              </Button>
            </>
          ) : (
            <div className="mt-5">
              <EmptyState icon={CheckCircle2} title="No weak topics detected yet" message="Complete quizzes to let CampusMate detect areas for revision." />
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-xl font-black text-white">Subject-wise quiz scores</h3>
        {subjectScores.length ? (
          <div className="mt-5 space-y-4">
            {subjectScores.map((item) => (
              <div key={item.subject}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-300">{item.subject}</span>
                  <span className="font-bold text-cyan-100">{item.average}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-300" style={{ width: `${item.average}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No quiz data yet" message="Quiz attempts will power this progress dashboard." />
        )}
      </Card>
    </MotionPage>
  );
}
