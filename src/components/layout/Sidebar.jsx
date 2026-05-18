import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, LogOut, ShieldCheck, UserRound, X } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../common/Badge';
import { getRoleLabel, normalizeRole } from '../../utils/authUtils';

function SidebarContent({ items, onClose, role = 'student', accent = 'cyan' }) {
  const { logout, profile } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const accentClass =
    accent === 'violet'
      ? 'from-violet-400 via-fuchsia-500 to-cyan-400'
      : 'from-cyan-300 via-blue-500 to-violet-500';
  const normalizedRole = normalizeRole(role);

  const handleLogout = async () => {
    await logout();
    notify('You have been logged out.', 'success');
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col bg-slate-950/60">
      <div className="flex items-center justify-between gap-3 px-5 py-5">
        <NavLink to="/" className="group flex items-center gap-3" onClick={onClose}>
          <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${accentClass} text-lg font-black text-white shadow-glow`}>
            C
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-white">
              CampusMate
            </p>
            <p className="text-xs font-semibold text-cyan-200">
              Smart Companion
            </p>
          </div>
        </NavLink>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 md:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="mx-4 mb-4 rounded-3xl border border-white/10 bg-white/[0.06] p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-sm font-black text-white">
            {profile?.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {profile?.name || 'CampusMate User'}
            </p>
            <Badge tone={normalizedRole === 'admin' || normalizedRole === 'coordinator' ? 'violet' : 'cyan'} className="mt-1">
              {normalizedRole === 'admin' || normalizedRole === 'coordinator' ? (
                <ShieldCheck className="h-3 w-3" />
              ) : (
                <UserRound className="h-3 w-3" />
              )}
              {getRoleLabel(normalizedRole)}
            </Badge>
          </div>
        </div>
      </div>

      <nav className="scrollbar-soft flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex min-h-11 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? `bg-gradient-to-r ${accentClass} text-white shadow-glow`
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="h-6 w-6 shrink-0 rounded-xl border border-white/10 object-cover shadow-[0_0_14px_rgba(34,211,238,0.22)]"
                loading="lazy"
              />
            ) : (
              <item.icon className="h-5 w-5 shrink-0" />
            )}
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-70" />
          </NavLink>
        ))}
      </nav>

      <div className="space-y-4 p-4">
        <div className="rounded-3xl border border-violet-300/20 bg-violet-400/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
            CampusMate
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Your complete academic workspace for classes, attendance, learning, and campus workflows.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function Sidebar({ items, open, onClose }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-slate-950/82 backdrop-blur-2xl md:block">
        <SidebarContent items={items} role={items.role} accent={items.accent} />
      </aside>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="h-full w-[86vw] max-w-80 border-r border-white/10 bg-slate-950/95"
            >
              <SidebarContent
                items={items}
                onClose={onClose}
                role={items.role}
                accent={items.accent}
              />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
