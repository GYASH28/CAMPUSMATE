import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { markManyNotificationsRead, markNotificationRead } from '../../firebase/notifications';
import useCollection from '../../hooks/useCollection';
import { formatDateTime } from '../../utils/dateUtils';
import { getDashboardPath, getRoleLabel } from '../../utils/authUtils';

export default function Notifications() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: notifications } = useCollection('notifications');
  const myNotifications = notifications
    .filter((item) => item.userId === user?.uid)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const unread = myNotifications.filter((item) => !item.read);

  const markAll = async () => {
    try {
      await markManyNotificationsRead(unread);
      notify('Notifications marked as read.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <div className="app-canvas">
      <div className="aurora-layer animate-aurora" />
      <MotionPage>
        <PageHeader
          eyebrow="Notifications"
          title="CampusMate notification center"
          description="In-app notifications for assignments, exams, notices, attendance, quizzes, study plans, complaints, and system activity."
          actions={
            <Button type="button" variant="secondary" onClick={markAll}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          }
        />

        <Card>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge tone="cyan">{getRoleLabel(profile?.role)}</Badge>
            <Badge tone={unread.length ? 'rose' : 'emerald'}>{unread.length} unread</Badge>
          </div>
          {myNotifications.length ? (
            <div className="grid gap-3">
              {myNotifications.map((item) => (
                <Link
                  key={item.id}
                  to={item.actionUrl || getDashboardPath(profile?.role)}
                  onClick={() => markNotificationRead(item)}
                  className={`rounded-3xl border p-4 transition hover:border-cyan-300/30 hover:bg-white/[0.08] ${
                    item.read ? 'border-white/10 bg-white/[0.05]' : 'border-cyan-300/20 bg-cyan-300/10'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={item.read ? 'violet' : 'cyan'}>{item.type}</Badge>
                    <span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-3 font-black text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{item.message}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={Bell} title="No notifications yet" message="CampusMate activity and alerts will appear here." />
          )}
        </Card>
      </MotionPage>
    </div>
  );
}
