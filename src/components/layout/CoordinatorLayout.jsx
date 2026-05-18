import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import featureIcons from '../../utils/featureIcons';

const navItems = [
  { label: 'Dashboard', to: '/coordinator/dashboard', image: featureIcons.dashboard },
  { label: 'Teachers', to: '/coordinator/teachers', image: featureIcons.admin },
  { label: 'Students', to: '/coordinator/students', image: featureIcons.progress },
  { label: 'Attendance', to: '/coordinator/attendance', image: featureIcons.attendance },
  { label: 'Timetable', to: '/coordinator/timetable', image: featureIcons.timetable },
  { label: 'Notices', to: '/coordinator/notices', image: featureIcons.notices },
  { label: 'Reports', to: '/coordinator/reports', image: featureIcons.progress },
  { label: 'Profile', to: '/coordinator/profile', icon: UserRound },
];
navItems.role = 'coordinator';
navItems.accent = 'violet';

const titles = {
  '/coordinator/dashboard': 'Coordinator Dashboard',
  '/coordinator/teachers': 'Teachers',
  '/coordinator/students': 'Students',
  '/coordinator/attendance': 'Attendance Sheet',
  '/coordinator/timetable': 'Timetable',
  '/coordinator/notices': 'Notices',
  '/coordinator/reports': 'Reports',
  '/coordinator/profile': 'Profile',
};

export default function CoordinatorLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-canvas">
      <div className="aurora-layer animate-aurora" />
      <Sidebar items={navItems} open={open} onClose={() => setOpen(false)} />
      <div className="md:pl-72">
        <Topbar
          title={titles[location.pathname] || 'CampusMate Coordinator'}
          onMenuClick={() => setOpen(true)}
          accent="violet"
        />
        <Outlet />
      </div>
    </div>
  );
}
