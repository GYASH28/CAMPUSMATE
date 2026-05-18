import { FileUp, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addDocument } from '../../firebase/firestore';
import { createNotification } from '../../firebase/notifications';
import { uploadFile } from '../../firebase/storage';
import useCollection from '../../hooks/useCollection';
import { CONTRIBUTION_TYPES, UNITS } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { isStudentSubject, statusTone, subjectDisplay } from '../../utils/roleUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function Contributions() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: users } = useCollection('users');
  const { data: contributions } = useCollection('contributions');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subjectId: '',
    unit: 'Unit 1',
    description: '',
    type: 'Notes',
  });

  const studentSubjects = useMemo(
    () => subjects.filter((subject) => isStudentSubject(subject, profile)),
    [subjects, profile],
  );
  const myContributions = contributions
    .filter((contribution) => contribution.userId === user?.uid)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitContribution = async (event) => {
    event.preventDefault();
    const subject = studentSubjects.find((item) => item.id === form.subjectId);
    if (!subject || !form.title.trim() || !form.description.trim() || !file) {
      notify('Subject, title, description, and file are required.', 'error');
      return;
    }
    try {
      setSaving(true);
      const upload = await uploadFile(file, 'contributions');
      await addDocument('contributions', {
        userId: user.uid,
        studentName: profile?.name || 'Student',
        title: form.title.trim(),
        subjectId: subject.id,
        subjectName: subjectDisplay(subject),
        unit: form.unit,
        description: form.description.trim(),
        type: form.type,
        fileUrl: upload.fileUrl,
        fileName: upload.fileName,
        filePath: upload.filePath,
        status: 'Pending approval',
        rejectionReason: '',
        reviewedBy: '',
        reviewedAt: '',
      });
      await Promise.all(
        users
          .filter((item) => ['admin', 'coordinator'].includes(normalizeRole(item.role)))
          .map((admin) =>
            createNotification({
              userId: admin.uid,
              title: 'New contribution pending approval',
              message: `${profile?.name || 'A student'} submitted ${form.title}.`,
              type: 'system',
              actionUrl: '/admin/contributions',
            }),
          ),
      );
      setForm({ title: '', subjectId: '', unit: 'Unit 1', description: '', type: 'Notes' });
      setFile(null);
      notify('Contribution submitted for admin approval.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Student Contributions"
        title="Share notes for approval"
        description="Upload resources for admin review. Approved contributions are published to the Notes Library."
      />

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Submit resource</h3>
          <form onSubmit={submitContribution} className="mt-5 grid gap-4">
            <Input label="Title" name="title" value={form.title} onChange={handleChange} placeholder="PIC viva questions" />
            <Select label="Subject" name="subjectId" value={form.subjectId} onChange={handleChange}>
              <option value="">Select subject</option>
              {studentSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>)}
            </Select>
            <Select label="Unit" name="unit" value={form.unit} onChange={handleChange}>
              {UNITS.map((unit) => <option key={unit}>{unit}</option>)}
            </Select>
            <Select label="Type" name="type" value={form.type} onChange={handleChange}>
              {CONTRIBUTION_TYPES.map((type) => <option key={type}>{type}</option>)}
            </Select>
            <Textarea label="Description" name="description" value={form.description} onChange={handleChange} />
            <label>
              <span className="field-label">Resource file</span>
              <input
                className="field-input mt-2 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-100"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-xl font-black text-white">Contribution status</h3>
          {myContributions.length ? (
            <div className="mt-5 grid gap-3">
              {myContributions.map((contribution) => (
                <div key={contribution.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(contribution.status)}>{contribution.status}</Badge>
                    <Badge tone="cyan">{contribution.type}</Badge>
                  </div>
                  <p className="mt-3 font-black text-white">{contribution.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{contribution.subjectName} - {formatDate(contribution.createdAt)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{contribution.description}</p>
                  {contribution.rejectionReason ? (
                    <p className="mt-3 rounded-3xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100">
                      Rejection reason: {contribution.rejectionReason}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileUp} title="No contributions yet" message="Submitted resources and review decisions will appear here." />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
