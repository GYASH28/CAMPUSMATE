import {
  BadgeCheck,
  BellRing,
  BookOpen,
  Bot,
  Brain,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  FileText,
  TrendingUp,
  UploadCloud,
  Wrench,
  Award,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import SectionHeader from '../../components/common/SectionHeader';
import StatusPill from '../../components/common/StatusPill';
import MotionPage from '../../components/animations/MotionPage';
import StatCard from '../../components/dashboard/StatCard';
import ProductBanner from '../../components/dashboard/ProductBanner';
import TodayMode from '../../components/dashboard/TodayMode';
import QuickActionCard from '../../components/dashboard/QuickActionCard';
import ProgressRing from '../../components/dashboard/ProgressRing';
import ExamCountdownCard from '../../components/dashboard/ExamCountdownCard';
import InstallPrompt from '../../components/common/InstallPrompt';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import {
  calculateAttendancePercentage,
  getAttendanceStatus,
} from '../../utils/attendanceUtils';
import { daysUntil, getGreeting, getTodayName, isOverdue } from '../../utils/dateUtils';
import featureIcons from '../../utils/featureIcons';
import { isStudentSubject } from '../../utils/roleUtils';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const { data: subjects } = useCollection('subjects');
  const { data: timetable } = useCollection('timetable');
  const { data: attendanceSummary } = useCollection('attendanceSummary');
  const { data: assignments } = useCollection('assignments');
  const { data: statuses } = useCollection('assignmentStatus');
  const { data: notices } = useCollection('notices');
  const { data: exams } = useCollection('exams');
  const { data: quizResults } = useCollection('quizResults');
  const { data: reminders } = useCollection('reminders');
  const { data: studyPlans } = useCollection('studyPlans');
  const { data: complaints } = useCollection('complaints');
  const { data: contributions } = useCollection('contributions');
  const { data: internalMarks } = useCollection('internalMarks');
  const { data: attendanceRecords } = useCollection('attendanceRecords');

  const studentSubjects = subjects.filter((subject) => isStudentSubject(subject, profile));
  const subjectIds = new Set(studentSubjects.map((subject) => subject.id));
  const today = getTodayName();

  const todayTimetable = timetable
    .filter(
      (entry) =>
        entry.day === today &&
        entry.branch === profile?.branch &&
        entry.semester === profile?.semester &&
        entry.division === profile?.division,
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const myAttendanceSummary = attendanceSummary.filter(
    (entry) => entry.studentId === user?.uid && subjectIds.has(entry.subjectId),
  );
  const totalPresent = myAttendanceSummary.reduce((sum, entry) => sum + Number(entry.presentCount || 0), 0);
  const totalLate = myAttendanceSummary.reduce((sum, entry) => sum + Number(entry.lateCount || 0), 0);
  const totalLectures = myAttendanceSummary.reduce((sum, entry) => sum + Number(entry.totalLectures || 0), 0);
  const overallAttendance = calculateAttendancePercentage(totalPresent, totalLate, totalLectures);
  const attendanceTone =
    overallAttendance >= 75 ? 'emerald' : overallAttendance >= 60 ? 'amber' : 'rose';
  const attendanceWarning = myAttendanceSummary.some(
    (entry) => Number(entry.totalLectures || 0) > 0 && Number(entry.percentage || 0) < 75,
  );

  const completedIds = new Set(
    statuses
      .filter((status) => status.userId === user?.uid && status.status === 'Completed')
      .map((status) => status.assignmentId),
  );
  const relevantAssignments = assignments.filter((assignment) =>
    subjectIds.has(assignment.subjectId),
  );
  const pendingAssignments = relevantAssignments.filter(
    (assignment) => !completedIds.has(assignment.id),
  );
  const overdueAssignments = pendingAssignments.filter((item) => isOverdue(item.dueDate));
  const relevantExams = exams
    .filter((exam) => subjectIds.has(exam.subjectId))
    .sort((a, b) => daysUntil(a.examDate) - daysUntil(b.examDate));
  const nextExam = relevantExams[0];
  const recentNotices = notices
    .filter(
      (notice) =>
        (notice.targetBranch === 'All' || notice.targetBranch === profile?.branch) &&
        (notice.targetSemester === 'All' || notice.targetSemester === profile?.semester),
    )
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 3);
  const myQuizResults = quizResults.filter((result) => result.userId === user?.uid);
  const quizAverage = myQuizResults.length
    ? Math.round(
        myQuizResults.reduce((sum, result) => sum + Number(result.percentage || 0), 0) /
          myQuizResults.length,
      )
    : 0;
  const weakTopics = [
    ...new Set(myQuizResults.flatMap((result) => result.weakTopics || [])),
  ].slice(0, 4);
  const myPlans = studyPlans.filter((plan) => plan.userId === user?.uid);
  const planProgress = myPlans.length
    ? Math.round(
        myPlans.reduce(
          (sum, plan) => sum + Math.min((plan.completedDays?.length || 0) * 20, 100),
          0,
        ) / myPlans.length,
      )
    : 0;
  const remindersToday =
    reminders.filter(
      (reminder) =>
        reminder.userId === user?.uid &&
        reminder.status !== 'Completed' &&
        daysUntil(reminder.dueDate) <= 0,
    ).length +
    pendingAssignments.filter((assignment) => daysUntil(assignment.dueDate) <= 1).length +
    relevantExams.filter((exam) => daysUntil(exam.examDate) <= 7).length +
    (attendanceWarning ? 1 : 0);
  const myComplaints = complaints.filter((complaint) => complaint.studentId === user?.uid);
  const openComplaints = myComplaints.filter((complaint) => !['Resolved', 'Rejected'].includes(complaint.status)).length;
  const myContributions = contributions.filter((contribution) => contribution.userId === user?.uid);
  const pendingContributions = myContributions.filter((contribution) => contribution.status === 'Pending approval').length;
  const myMarks = internalMarks.filter((mark) => mark.studentId === user?.uid);
  const officialAttendanceRecords = attendanceRecords.filter((record) => record.studentId === user?.uid).length;

  const quickActions = [
    {
      title: 'Open Timetable',
      description: 'Scan today and weekly classes.',
      to: '/student/timetable',
      icon: CalendarClock,
      image: featureIcons.timetable,
    },
    {
      title: 'View Notes',
      description: 'Find subject-wise study files.',
      to: '/student/notes',
      icon: FileText,
      image: featureIcons.notes,
    },
    {
      title: 'Track Attendance',
      description: 'View official records.',
      to: '/student/attendance',
      icon: BadgeCheck,
      image: featureIcons.attendance,
    },
    {
      title: 'Check Assignments',
      description: 'Complete pending tasks.',
      to: '/student/assignments',
      icon: ClipboardList,
      image: featureIcons.assignments,
    },
    {
      title: 'See Exams',
      description: 'Review countdown and syllabus.',
      to: '/student/exams',
      icon: BookOpen,
      image: featureIcons.exams,
    },
    {
      title: 'Ask AI',
      description: 'Explain topics and generate viva prep.',
      to: '/student/ai',
      icon: Bot,
      image: featureIcons.aiAssistant,
      tone: 'violet',
    },
    {
      title: 'Practice Quizzes',
      description: 'Try practice or exam mode.',
      to: '/student/quizzes',
      icon: Brain,
      image: featureIcons.quizzes,
      tone: 'violet',
    },
    {
      title: 'Study Planner',
      description: 'Generate a plan before exams.',
      to: '/student/study-planner',
      icon: CalendarCheck,
      image: featureIcons.studyPlanner,
      tone: 'violet',
    },
    {
      title: 'Progress',
      description: 'Review scores and weak topics.',
      to: '/student/progress',
      icon: TrendingUp,
      image: featureIcons.progress,
      tone: 'violet',
    },
    {
      title: 'Reminders',
      description: 'Stay ahead of deadlines.',
      to: '/student/reminders',
      icon: BellRing,
      image: featureIcons.reminders,
      tone: 'violet',
    },
    {
      title: 'Complaints',
      description: 'Track campus issues.',
      to: '/student/complaints',
      icon: Wrench,
      image: featureIcons.complaints,
      tone: 'cyan',
    },
    {
      title: 'Contribute Notes',
      description: 'Submit resources for approval.',
      to: '/student/contributions',
      icon: UploadCloud,
      image: featureIcons.contributions,
      tone: 'cyan',
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Student Dashboard"
        title={`${getGreeting()}, ${profile?.name || 'Student'} 👋`}
        description="Here is your academic, smart learning, and campus workflow overview for today."
      />

      <ProductBanner />

      <TodayMode
        today={today}
        classes={todayTimetable}
        pendingAssignments={pendingAssignments}
        nextExam={nextExam}
        attendanceWarning={attendanceWarning}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Attendance average"
          value={`${overallAttendance}%`}
          hint={`${totalPresent + totalLate}/${totalLectures} official lectures`}
          tone={attendanceTone}
        />
        <StatCard
          icon={ClipboardList}
          label="Pending assignments"
          value={pendingAssignments.length}
          hint={`${overdueAssignments.length} overdue`}
          tone="amber"
          delay={0.04}
        />
        <StatCard
          icon={BookOpen}
          label="Upcoming exams"
          value={relevantExams.length}
          hint={nextExam ? `${Math.max(daysUntil(nextExam.examDate), 0)} days to next` : 'No exams scheduled'}
          tone="violet"
          delay={0.08}
        />
        <StatCard
          icon={BellRing}
          label="Smart reminders"
          value={remindersToday}
          hint="Due today or needs attention"
          tone="cyan"
          delay={0.12}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card tone="cyan">
          <Badge tone="cyan" icon={Bot}>AI Study Assistant</Badge>
          <h3 className="mt-4 text-2xl font-black text-white">
            Explain, summarize, and revise faster.
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Ask CampusMate to explain weak topics, make MCQs, prepare viva answers,
            or turn notes into focused revision.
          </p>
          <div className="mt-5">
            <QuickActionCard
              to="/student/ai"
              icon={Bot}
              image={featureIcons.aiAssistant}
              title="Open AI Assistant"
              description="Start a smart study session."
              tone="violet"
            />
          </div>
        </Card>

        <Card>
          <Badge tone={quizAverage >= 70 ? 'emerald' : quizAverage ? 'amber' : 'violet'} icon={Brain}>
            Quiz performance
          </Badge>
          <p className="mt-4 text-4xl font-black text-white">
            {myQuizResults.length ? `${quizAverage}%` : 'Ready'}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {myQuizResults.length
              ? `${myQuizResults.length} quiz attempt${myQuizResults.length === 1 ? '' : 's'} tracked`
              : 'Practice mode and exam mode are ready when you are.'}
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
              style={{ width: `${myQuizResults.length ? quizAverage : 12}%` }}
            />
          </div>
        </Card>

        <Card>
          <Badge tone={weakTopics.length ? 'rose' : 'emerald'} icon={TrendingUp}>
            Weak topic detection
          </Badge>
          {weakTopics.length ? (
            <>
              <p className="mt-4 text-lg font-black text-white">
                You need to revise:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {weakTopics.map((topic) => (
                  <Badge key={topic} tone="rose">{topic}</Badge>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Complete quizzes to let CampusMate detect weak topics automatically.
            </p>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <QuickActionCard
              to="/student/quizzes"
              icon={Brain}
              image={featureIcons.quizzes}
              title="Practice Now"
              description="Build progress from quiz attempts."
              tone="violet"
            />
            <QuickActionCard
              to="/student/progress"
              icon={TrendingUp}
              image={featureIcons.progress}
              title="View Progress"
              description={`${planProgress}% planner completion`}
              tone="cyan"
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Official records" value={officialAttendanceRecords} hint="Saved attendance entries" tone="cyan" />
        <StatCard icon={Wrench} label="Open complaints" value={openComplaints} hint={`${myComplaints.length} submitted`} tone={openComplaints ? 'amber' : 'emerald'} />
        <StatCard icon={UploadCloud} label="Contributions" value={pendingContributions} hint={`${myContributions.length} total`} tone="violet" />
        <StatCard icon={Award} label="Internal marks" value={myMarks.length} hint="Teacher records" tone="emerald" />
      </div>

      <InstallPrompt compact />

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="flex flex-col items-center justify-center gap-5 text-center">
          <ProgressRing
            value={overallAttendance}
            tone={attendanceTone}
            label="Average"
            size={132}
          />
          <div>
            <Badge tone={attendanceTone}>
              {getAttendanceStatus(overallAttendance).label}
            </Badge>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Animated attendance overview across finalized teacher-controlled lectures.
            </p>
          </div>
          {myAttendanceSummary.length ? (
            <div className="w-full space-y-3">
              {myAttendanceSummary.slice(0, 4).map((entry) => {
                const percentage = Number(entry.percentage || 0);
                const status = getAttendanceStatus(percentage);
                return (
                  <div key={entry.id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-slate-300">{entry.subjectName}</span>
                      <span className={status.color}>{percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${status.bar}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </Card>

        <ExamCountdownCard exam={nextExam} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionHeader
            eyebrow="Today's classes"
            title={today}
            description="Your schedule based on branch, semester, and division."
          />
          {todayTimetable.length ? (
            <div className="mt-5 space-y-3">
              {todayTimetable.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-white">{entry.subjectName}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {entry.teacherName} - Room {entry.room}
                      </p>
                    </div>
                    <Badge tone="cyan">
                      {entry.startTime} - {entry.endTime}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your dashboard is ready"
              message="Add subjects and timetable from the admin panel to start seeing academic updates."
            />
          )}
        </Card>

        <Card>
          <SectionHeader
            eyebrow="Recent notices"
            title="Latest updates"
            description="Important messages for your branch and semester."
          />
          <div className="mt-5 space-y-3">
            {recentNotices.length ? (
              recentNotices.map((notice) => (
                <div
                  key={notice.id}
                  className={`rounded-3xl border p-4 ${
                    notice.category === 'Important'
                      ? 'border-rose-300/30 bg-rose-400/10 shadow-violet'
                      : 'border-white/10 bg-white/[0.05]'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill>{notice.category}</StatusPill>
                    <p className="font-black text-white">{notice.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {notice.message}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No notices yet"
                message="Important notices for your branch will appear here."
              />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          eyebrow="Quick actions"
          title="Jump into your workflow"
          description="Core academics, smart learning, and campus workflows are available from here."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action) => (
            <QuickActionCard key={action.to} {...action} />
          ))}
        </div>
      </Card>
    </MotionPage>
  );
}
