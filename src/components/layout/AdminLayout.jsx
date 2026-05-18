import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import featureIcons from '../../utils/featureIcons';

const navItems = [
  { label: 'Admin Dashboard', to: '/admin/dashboard', image: featureIcons.admin },
  { label: 'Manage Subjects', to: '/admin/subjects', image: featureIcons.notes },
  { label: 'Manage Timetable', to: '/admin/timetable', image: featureIcons.timetable },
  { label: 'Manage Notes', to: '/admin/notes', image: featureIcons.notes },
  { label: 'Manage Assignments', to: '/admin/assignments', image: featureIcons.assignments },
  { label: 'Manage Notices', to: '/admin/notices', image: featureIcons.notices },
  { label: 'Manage Exams', to: '/admin/exams', image: featureIcons.exams },
  { label: 'Manage Quizzes', to: '/admin/quizzes', image: featureIcons.quizzes },
  { label: 'Users', to: '/admin/users', image: featureIcons.admin },
  { label: 'Teachers', to: '/admin/teachers', image: featureIcons.admin },
  { label: 'Attendance', to: '/admin/attendance', image: featureIcons.attendance },
  { label: 'Analytics', to: '/admin/analytics', image: featureIcons.progress },
  { label: 'Complaints', to: '/admin/complaints', image: featureIcons.complaints },
  { label: 'Contributions', to: '/admin/contributions', image: featureIcons.contributions },
  { label: 'Internal Marks', to: '/admin/internal-marks', image: featureIcons.internalMarks },
];
navItems.role = 'admin';
navItems.accent = 'violet';

const titles = {
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/subjects': 'Manage Subjects',
  '/admin/timetable': 'Manage Timetable',
  '/admin/notes': 'Manage Notes',
  '/admin/assignments': 'Manage Assignments',
  '/admin/notices': 'Manage Notices',
  '/admin/exams': 'Manage Exams',
  '/admin/quizzes': 'Manage Quizzes',
  '/admin/users': 'User Management',
  '/admin/teachers': 'Teacher Management',
  '/admin/attendance': 'Attendance Management',
  '/admin/analytics': 'Analytics',
  '/admin/complaints': 'Manage Complaints',
  '/admin/contributions': 'Review Contributions',
  '/admin/internal-marks': 'Internal Marks',
};

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-canvas">
      <div className="aurora-layer animate-aurora" />
      <Sidebar items={navItems} open={open} onClose={() => setOpen(false)} />
      <div className="md:pl-72">
        <Topbar
          title={titles[location.pathname] || 'CampusMate Admin'}
          onMenuClick={() => setOpen(true)}
          accent="violet"
        />
        <Outlet />
      </div>
    </div>
  );
}
