import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import featureIcons from '../../utils/featureIcons';

const navItems = [
  { label: 'Dashboard', to: '/cr/dashboard', image: featureIcons.dashboard },
  { label: 'Class Students', to: '/cr/class-students', image: featureIcons.progress },
  { label: 'Attendance', to: '/cr/attendance', image: featureIcons.attendance },
  { label: 'Timetable', to: '/cr/timetable', image: featureIcons.timetable },
  { label: 'Notes', to: '/cr/notes', image: featureIcons.notes },
  { label: 'Assignments', to: '/cr/assignments', image: featureIcons.assignments },
  { label: 'Notices', to: '/cr/notices', image: featureIcons.notices },
  { label: 'Exams', to: '/cr/exams', image: featureIcons.exams },
  { label: 'Profile', to: '/cr/profile', icon: UserRound },
];
navItems.role = 'cr';
navItems.accent = 'cyan';

const titles = {
  '/cr/dashboard': 'Class Representative Dashboard',
  '/cr/class-students': 'Class Students',
  '/cr/attendance': 'Attendance Sheet',
  '/cr/timetable': 'Timetable',
  '/cr/notes': 'Notes',
  '/cr/assignments': 'Assignments',
  '/cr/notices': 'Notices',
  '/cr/exams': 'Exams',
  '/cr/profile': 'Profile',
};

export default function CRLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-canvas">
      <div className="aurora-layer animate-aurora" />
      <Sidebar items={navItems} open={open} onClose={() => setOpen(false)} />
      <div className="md:pl-72">
        <Topbar
          title={titles[location.pathname] || 'CampusMate CR'}
          onMenuClick={() => setOpen(true)}
          accent="cyan"
        />
        <Outlet />
      </div>
    </div>
  );
}
