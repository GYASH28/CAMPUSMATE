import { Bell } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import StatusPill from '../../components/common/StatusPill';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { formatDate } from '../../utils/dateUtils';

export default function TeacherNotices() {
  const { profile } = useAuth();
  const { data: notices } = useCollection('notices');
  const visibleNotices = notices
    .filter(
      (notice) =>
        (notice.targetBranch === 'All' || notice.targetBranch === profile?.branch) &&
        (notice.targetSemester === 'All' || notice.targetSemester === profile?.semester),
    )
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Teacher Notices"
        title="College updates"
        description="Important announcements for your branch, semester, and department."
      />

      {visibleNotices.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {visibleNotices.map((notice) => (
            <Card key={notice.id} className={notice.category === 'Important' ? 'border-rose-300/25 bg-rose-400/10' : ''}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={notice.category}>{notice.category}</StatusPill>
                <Badge tone="cyan">{formatDate(notice.createdAt)}</Badge>
              </div>
              <h3 className="mt-4 text-xl font-black text-white">{notice.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{notice.message}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Bell} title="No notices yet" message="Targeted notices from admin will appear here." />
      )}
    </MotionPage>
  );
}
