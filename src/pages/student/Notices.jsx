import { useState } from 'react';
import { Bell } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import StatusPill from '../../components/common/StatusPill';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { NOTICE_CATEGORIES } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';

export default function Notices() {
  const { profile } = useAuth();
  const { data: notices } = useCollection('notices');
  const [category, setCategory] = useState('All');

  const relevantNotices = notices
    .filter(
      (notice) =>
        (notice.targetBranch === 'All' || notice.targetBranch === profile?.branch) &&
        (notice.targetSemester === 'All' || notice.targetSemester === profile?.semester),
    )
    .filter((notice) => category === 'All' || notice.category === category)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Notices"
        title="College updates"
        description="Scan announcements by category and keep important notices visible."
      />

      <Card>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', ...NOTICE_CATEGORIES].map((item) => (
            <Button
              key={item}
              type="button"
              variant={category === item ? 'primary' : 'dark'}
              size="sm"
              className="shrink-0"
              onClick={() => setCategory(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </Card>

      {relevantNotices.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {relevantNotices.map((notice, index) => (
            <Card
              key={notice.id}
              delay={index * 0.03}
              className={
                notice.category === 'Important'
                  ? 'border-rose-300/25 bg-rose-400/[0.08] shadow-violet'
                  : ''
              }
            >
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill>{notice.category}</StatusPill>
                <p className="text-xs text-slate-500">{formatDate(notice.createdAt)}</p>
              </div>
              <h3 className="mt-4 text-xl font-black text-white">{notice.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{notice.message}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone="cyan">{notice.targetBranch}</Badge>
                <Badge tone="violet">Semester {notice.targetSemester}</Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notices in this category"
          message="New notices for your branch and semester will appear here."
        />
      )}
    </MotionPage>
  );
}
