import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import featureIcons from '../../utils/featureIcons';

const navItems = [
  { label: 'Teacher Dashboard', to: '/teacher/dashboard', image: featureIcons.dashboard },
  { label: 'My Subjects', to: '/teacher/subjects', image: featureIcons.notes },
  { label: 'Mark Attendance', to: '/teacher/attendance', image: featureIcons.attendance },
  { label: 'Assignments', to: '/teacher/assignments', image: featureIcons.assignments },
  { label: 'Notes', to: '/teacher/notes', image: featureIcons.notes },
  { label: 'Quizzes', to: '/teacher/quizzes', image: featureIcons.quizzes },
  { label: 'Student Progress', to: '/teacher/progress', image: featureIcons.progress },
  { label: 'Notices', to: '/teacher/notices', image: featureIcons.notices },
  { label: 'Profile', to: '/teacher/profile', icon: UserRound },
];
navItems.role = 'teacher';
navItems.accent = 'violet';

const titles = {
  '/teacher/dashboard': 'Teacher Dashboard',
  '/teacher/subjects': 'My Subjects',
  '/teacher/attendance': 'Attendance Sheet',
  '/teacher/assignments': 'Teacher Assignments',
  '/teacher/notes': 'Teacher Notes',
  '/teacher/quizzes': 'Teacher Quizzes',
  '/teacher/progress': 'Student Progress',
  '/teacher/notices': 'Teacher Notices',
  '/teacher/profile': 'Teacher Profile',
};

export default function TeacherLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-canvas">
      <div className="aurora-layer animate-aurora" />
      <Sidebar items={navItems} open={open} onClose={() => setOpen(false)} />
      <div className="md:pl-72">
        <Topbar
          title={titles[location.pathname] || 'CampusMate Teacher'}
          onMenuClick={() => setOpen(true)}
          accent="violet"
        />
        <Outlet />
      </div>
    </div>
  );
}
