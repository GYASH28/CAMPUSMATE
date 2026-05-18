import { CheckCircle2, Download, FileCheck2, XCircle } from 'lucide-react';
import { useState } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addDocument, updateDocument } from '../../firebase/firestore';
import { createNotification } from '../../firebase/notifications';
import useCollection from '../../hooks/useCollection';
import { CONTRIBUTION_STATUSES } from '../../utils/constants';
import { formatDateTime } from '../../utils/dateUtils';
import { statusTone } from '../../utils/roleUtils';

export default function ReviewContributions() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data: contributions } = useCollection('contributions');
  const [status, setStatus] = useState('Pending approval');
  const [reason, setReason] = useState('');

  const visibleContributions = contributions
    .filter((item) => status === 'All' || item.status === status)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const approve = async (contribution) => {
    try {
      await addDocument('notes', {
        title: contribution.title,
        subjectId: contribution.subjectId,
        subjectName: contribution.subjectName,
        unit: contribution.unit,
        description: `${contribution.description}\n\nStudent contribution by ${contribution.studentName}.`,
        fileUrl: contribution.fileUrl,
        fileName: contribution.fileName,
        filePath: contribution.filePath,
        uploadedBy: contribution.userId,
      });
      await updateDocument('contributions', contribution.id, {
        status: 'Approved',
        reviewedBy: user?.uid,
        reviewedAt: new Date().toISOString(),
        rejectionReason: '',
      });
      await createNotification({
        userId: contribution.userId,
        title: 'Contribution approved',
        message: `${contribution.title} is now published in Notes Library.`,
        type: 'system',
        actionUrl: '/student/contributions',
      });
      notify('Contribution approved and published.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const reject = async (contribution) => {
    if (!reason.trim()) {
      notify('Enter a rejection reason first.', 'error');
      return;
    }
    try {
      await updateDocument('contributions', contribution.id, {
        status: 'Rejected',
        rejectionReason: reason.trim(),
        reviewedBy: user?.uid,
        reviewedAt: new Date().toISOString(),
      });
      await createNotification({
        userId: contribution.userId,
        title: 'Contribution rejected',
        message: reason.trim(),
        type: 'system',
        actionUrl: '/student/contributions',
      });
      setReason('');
      notify('Contribution rejected.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Review Contributions"
        title="Approve student resources"
        description="Student uploads stay pending until admin approval. Approved resources publish into Notes Library."
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-[0.4fr_1fr]">
          <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All</option>
            {CONTRIBUTION_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Input label="Reject reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason used when rejecting a contribution" />
        </div>
      </Card>

      {visibleContributions.length ? (
        <div className="grid gap-4">
          {visibleContributions.map((contribution) => (
            <Card key={contribution.id}>
              <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(contribution.status)}>{contribution.status}</Badge>
                    <Badge tone="cyan">{contribution.type}</Badge>
                    <Badge tone="violet">{contribution.unit}</Badge>
                  </div>
                  <h3 className="mt-3 text-xl font-black text-white">{contribution.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {contribution.studentName} - {contribution.subjectName} - {formatDateTime(contribution.createdAt)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{contribution.description}</p>
                  {contribution.rejectionReason ? (
                    <p className="mt-3 rounded-3xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100">
                      {contribution.rejectionReason}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {contribution.fileUrl ? (
                    <Button as="a" href={contribution.fileUrl} target="_blank" rel="noreferrer" variant="secondary" size="sm">
                      <Download className="h-4 w-4" />
                      Preview
                    </Button>
                  ) : null}
                  <Button type="button" size="sm" onClick={() => approve(contribution)} disabled={contribution.status === 'Approved'}>
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => reject(contribution)} disabled={contribution.status === 'Rejected'}>
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={FileCheck2} title="No contributions pending" message="Student notes and resources awaiting approval will appear here." />
      )}
    </MotionPage>
  );
}
