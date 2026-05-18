import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, CheckCheck, Menu, Search, Sparkles } from 'lucide-react';
import { formatCurrentDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { markManyNotificationsRead, markNotificationRead } from '../../firebase/notifications';
import { useToast } from '../../context/ToastContext';
import { getRoleLabel, normalizeRole } from '../../utils/authUtils';

export default function Topbar({ onMenuClick, title, accent = 'cyan' }) {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { data: notifications } = useCollection('notifications');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const accentClass =
    accent === 'violet' ? 'text-violet-200 bg-violet-300/10' : 'text-cyan-200 bg-cyan-300/10';
  const myNotifications = notifications
    .filter((item) => item.userId === user?.uid)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 6);
  const unread = myNotifications.filter((item) => !item.read);
  const searchItems = useMemo(() => {
    const common = [{ label: 'Notifications', to: '/notifications', keywords: 'alerts unread bell' }];
    const student = [
      { label: 'Dashboard', to: '/student/dashboard', keywords: 'overview home' },
      { label: 'Timetable', to: '/student/timetable', keywords: 'schedule classes weekly' },
      { label: 'Attendance', to: '/student/attendance', keywords: 'official present absent summary' },
      { label: 'Notes', to: '/student/notes', keywords: 'pdf library resources' },
      { label: 'Assignments', to: '/student/assignments', keywords: 'tasks due submissions' },
      { label: 'Notices', to: '/student/notices', keywords: 'announcements updates' },
      { label: 'Exams', to: '/student/exams', keywords: 'countdown syllabus' },
      { label: 'AI Assistant', to: '/student/ai', keywords: 'gemini explain viva mcq summarize' },
      { label: 'Quizzes', to: '/student/quizzes', keywords: 'practice exam weak topics' },
      { label: 'Study Planner', to: '/student/study-planner', keywords: 'plan revision hours' },
      { label: 'Progress', to: '/student/progress', keywords: 'analytics scores marks' },
      { label: 'Reminders', to: '/student/reminders', keywords: 'deadlines tasks' },
      { label: 'Complaints', to: '/student/complaints', keywords: 'maintenance issue' },
      { label: 'Contributions', to: '/student/contributions', keywords: 'upload resource approval' },
      { label: 'Internal Marks', to: '/student/internal-marks', keywords: 'unit test practical' },
      { label: 'Profile', to: '/student/profile', keywords: 'account class' },
    ];
    const teacher = [
      { label: 'Teacher Dashboard', to: '/teacher/dashboard', keywords: 'overview classes' },
      { label: 'My Subjects', to: '/teacher/subjects', keywords: 'assigned courses' },
      { label: 'Mark Attendance', to: '/teacher/attendance', keywords: 'official sheet present absent' },
      { label: 'Assignments', to: '/teacher/assignments', keywords: 'create tasks' },
      { label: 'Notes', to: '/teacher/notes', keywords: 'upload resources' },
      { label: 'Quizzes', to: '/teacher/quizzes', keywords: 'questions mcq' },
      { label: 'Student Progress', to: '/teacher/progress', keywords: 'marks scores analytics' },
      { label: 'Notices', to: '/teacher/notices', keywords: 'updates announcements' },
      { label: 'Profile', to: '/teacher/profile', keywords: 'account department' },
    ];
    const admin = [
      { label: 'Admin Dashboard', to: '/admin/dashboard', keywords: 'overview seed demo' },
      { label: 'Manage Subjects', to: '/admin/subjects', keywords: 'courses teachers' },
      { label: 'Manage Timetable', to: '/admin/timetable', keywords: 'schedule classes' },
      { label: 'Manage Notes', to: '/admin/notes', keywords: 'upload pdf' },
      { label: 'Manage Assignments', to: '/admin/assignments', keywords: 'tasks due' },
      { label: 'Manage Notices', to: '/admin/notices', keywords: 'announcements' },
      { label: 'Manage Exams', to: '/admin/exams', keywords: 'schedule syllabus' },
      { label: 'Manage Quizzes', to: '/admin/quizzes', keywords: 'mcq ai question bank' },
      { label: 'Users', to: '/admin/users', keywords: 'students teachers roles status' },
      { label: 'Teachers', to: '/admin/teachers', keywords: 'assign subjects' },
      { label: 'Analytics', to: '/admin/analytics', keywords: 'reports charts' },
      { label: 'Complaints', to: '/admin/complaints', keywords: 'maintenance status' },
      { label: 'Contributions', to: '/admin/contributions', keywords: 'approval resources' },
      { label: 'Internal Marks', to: '/admin/internal-marks', keywords: 'student marks' },
      { label: 'Attendance', to: '/admin/attendance', keywords: 'official sheet present absent reports' },
    ];
    const coordinator = [
      { label: 'Coordinator Dashboard', to: '/coordinator/dashboard', keywords: 'overview department classes' },
      { label: 'Teachers', to: '/coordinator/teachers', keywords: 'faculty subjects assignments' },
      { label: 'Students', to: '/coordinator/students', keywords: 'class representatives roll numbers' },
      { label: 'Attendance', to: '/coordinator/attendance', keywords: 'official sheet present absent low attendance' },
      { label: 'Timetable', to: '/coordinator/timetable', keywords: 'schedule classes weekly' },
      { label: 'Notices', to: '/coordinator/notices', keywords: 'announcements updates' },
      { label: 'Reports', to: '/coordinator/reports', keywords: 'exports summaries' },
      { label: 'Profile', to: '/coordinator/profile', keywords: 'account department' },
    ];
    const cr = [
      { label: 'CR Dashboard', to: '/cr/dashboard', keywords: 'overview class' },
      { label: 'Class Students', to: '/cr/class-students', keywords: 'roll numbers classmates' },
      { label: 'Attendance', to: '/cr/attendance', keywords: 'official sheet present absent' },
      { label: 'Timetable', to: '/cr/timetable', keywords: 'schedule classes weekly' },
      { label: 'Notes', to: '/cr/notes', keywords: 'pdf library resources' },
      { label: 'Assignments', to: '/cr/assignments', keywords: 'tasks due submissions' },
      { label: 'Notices', to: '/cr/notices', keywords: 'announcements updates' },
      { label: 'Exams', to: '/cr/exams', keywords: 'countdown syllabus' },
      { label: 'Profile', to: '/cr/profile', keywords: 'account class' },
    ];
    const role = normalizeRole(profile?.role);
    const roleItems =
      role === 'admin'
        ? admin
        : role === 'coordinator'
          ? coordinator
          : role === 'teacher'
            ? teacher
            : role === 'cr'
              ? cr
              : student;
    return [...roleItems, ...common];
  }, [profile?.role]);
  const searchResults = searchItems
    .filter((item) =>
      `${item.label} ${item.keywords}`.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .slice(0, 6);

  const markAll = async () => {
    try {
      await markManyNotificationsRead(unread);
      notify('Notifications marked as read.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const openNotification = async (notification) => {
    try {
      await markNotificationRead(notification);
      setOpen(false);
    } catch {
      // Navigation should not fail just because read-state update failed.
    }
  };

  const openSearchResult = (item) => {
    setSearch('');
    setSearchOpen(false);
    navigate(item.to);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-2xl p-2 text-slate-200 transition hover:bg-white/10 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <p className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.2em] ${accentClass}`}>
              CampusMate
            </p>
            <h1 className="mt-2 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
              {title}
            </h1>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center px-6 lg:flex">
          <label className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="field-input h-11 pl-11"
              placeholder="Search CampusMate pages..."
              aria-label="Search CampusMate pages"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && searchResults[0]) {
                  event.preventDefault();
                  openSearchResult(searchResults[0]);
                }
              }}
            />
            {searchOpen && search.trim() ? (
              <div className="absolute left-0 right-0 top-14 z-50 rounded-3xl border border-white/10 bg-slate-950/95 p-2 shadow-panel backdrop-blur-2xl">
                {searchResults.length ? (
                  searchResults.map((item) => (
                    <button
                      key={item.to}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openSearchResult(item)}
                      className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))
                ) : (
                  <p className="rounded-2xl px-4 py-3 text-sm text-slate-400">
                    No matching page found.
                  </p>
                )}
              </div>
            ) : null}
          </label>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-300 xl:flex">
            <CalendarDays className="h-4 w-4 text-cyan-200" />
            {formatCurrentDate()}
          </div>
          <div className="relative">
            <button
              type="button"
              className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
              aria-label="Notifications"
              onClick={() => setOpen((current) => !current)}
            >
              <Bell className="h-4 w-4" />
              {unread.length ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                  {unread.length}
                </span>
              ) : null}
            </button>
            {open ? (
              <div className="absolute right-0 top-14 z-50 w-80 rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-panel backdrop-blur-2xl">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-black text-white">Notifications</p>
                  <button
                    type="button"
                    onClick={markAll}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-cyan-100 hover:bg-white/10"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Read all
                  </button>
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-soft">
                  {myNotifications.length ? (
                    myNotifications.map((notification) => (
                      <Link
                        key={notification.id}
                        to={notification.actionUrl || '/notifications'}
                        onClick={() => openNotification(notification)}
                        className={`block rounded-2xl border p-3 transition hover:border-cyan-300/30 hover:bg-white/[0.08] ${
                          notification.read
                            ? 'border-white/10 bg-white/[0.04]'
                            : 'border-cyan-300/20 bg-cyan-300/10'
                        }`}
                      >
                        <p className="text-sm font-black text-white">{notification.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                          {notification.message}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
                      No notifications yet.
                    </p>
                  )}
                </div>
                <Link
                  to="/notifications"
                  onClick={() => setOpen(false)}
                  className="mt-3 block rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-sm font-bold text-cyan-100 transition hover:bg-white/[0.09]"
                >
                  Open notification center
                </Link>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500 text-sm font-black text-white">
              {profile?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="hidden text-right sm:block">
              <p className="max-w-32 truncate text-sm font-bold text-white">
                {profile?.name || 'CampusMate User'}
              </p>
              <p className="flex items-center justify-end gap-1 text-xs capitalize text-slate-400">
                <Sparkles className="h-3 w-3 text-cyan-200" />
                {getRoleLabel(profile?.role)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
