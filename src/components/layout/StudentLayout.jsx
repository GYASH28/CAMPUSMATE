import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import featureIcons from '../../utils/featureIcons';

const navItems = [
  { label: 'Dashboard', to: '/student/dashboard', image: featureIcons.dashboard },
  { label: 'Timetable', to: '/student/timetable', image: featureIcons.timetable },
  { label: 'Attendance', to: '/student/attendance', image: featureIcons.attendance },
  { label: 'Notes', to: '/student/notes', image: featureIcons.notes },
  { label: 'Assignments', to: '/student/assignments', image: featureIcons.assignments },
  { label: 'Notices', to: '/student/notices', image: featureIcons.notices },
  { label: 'Exams', to: '/student/exams', image: featureIcons.exams },
  { label: 'AI Assistant', to: '/student/ai', image: featureIcons.aiAssistant },
  { label: 'Quizzes', to: '/student/quizzes', image: featureIcons.quizzes },
  { label: 'Study Planner', to: '/student/study-planner', image: featureIcons.studyPlanner },
  { label: 'Progress', to: '/student/progress', image: featureIcons.progress },
  { label: 'Reminders', to: '/student/reminders', image: featureIcons.reminders },
  { label: 'Complaints', to: '/student/complaints', image: featureIcons.complaints },
  { label: 'Contributions', to: '/student/contributions', image: featureIcons.contributions },
  { label: 'Internal Marks', to: '/student/internal-marks', image: featureIcons.internalMarks },
  { label: 'Profile', to: '/student/profile', icon: UserRound },
];
navItems.role = 'student';
navItems.accent = 'cyan';

const titles = {
  '/student/dashboard': 'Student Dashboard',
  '/student/timetable': 'Weekly Timetable',
  '/student/attendance': 'Attendance Tracker',
  '/student/notes': 'Subject Notes',
  '/student/assignments': 'Assignments',
  '/student/notices': 'College Notices',
  '/student/exams': 'Exam Countdown',
  '/student/ai': 'AI Study Assistant',
  '/student/quizzes': 'Quizzes',
  '/student/study-planner': 'Study Planner',
  '/student/progress': 'Progress Dashboard',
  '/student/reminders': 'Smart Reminders',
  '/student/complaints': 'Complaints',
  '/student/contributions': 'Contributions',
  '/student/internal-marks': 'Internal Marks',
  '/student/profile': 'Profile',
};

export default function StudentLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-canvas">
      <div className="aurora-layer animate-aurora" />
      <Sidebar items={navItems} open={open} onClose={() => setOpen(false)} />
      <div className="md:pl-72">
        <Topbar
          title={titles[location.pathname] || 'CampusMate'}
          onMenuClick={() => setOpen(true)}
          accent="cyan"
        />
        <Outlet />
      </div>
    </div>
  );
}
