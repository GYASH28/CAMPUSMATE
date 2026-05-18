import { Download, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import DeleteButton from '../../components/common/DeleteButton';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addDocument, deleteDocument } from '../../firebase/firestore';
import { createNotification } from '../../firebase/notifications';
import { deleteUploadedFile, uploadFile } from '../../firebase/storage';
import useCollection from '../../hooks/useCollection';
import { addDays, formatDate } from '../../utils/dateUtils';
import { isTeacherSubject, subjectDisplay } from '../../utils/roleUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function TeacherAssignments() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: assignments } = useCollection('assignments');
  const { data: users } = useCollection('users');
  const [query, setQuery] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subjectId: '',
    description: '',
    dueDate: addDays(5),
  });

  const assignedSubjects = subjects.filter((subject) => isTeacherSubject(subject, user, profile));
  const subjectIds = new Set(assignedSubjects.map((subject) => subject.id));
  const visibleAssignments = assignments
    .filter((assignment) => subjectIds.has(assignment.subjectId))
    .filter((assignment) =>
      `${assignment.title} ${assignment.subjectName} ${assignment.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveAssignment = async (event) => {
    event.preventDefault();
    const subject = assignedSubjects.find((item) => item.id === form.subjectId);
    if (!subject || !form.title.trim() || !form.description.trim()) {
      notify('Subject, title, and description are required.', 'error');
      return;
    }
    try {
      setSaving(true);
      const upload = file ? await uploadFile(file, 'assignments') : {};
      await addDocument('assignments', {
        title: form.title.trim(),
        subjectId: subject.id,
        subjectName: subjectDisplay(subject),
        description: form.description.trim(),
        dueDate: form.dueDate,
        fileUrl: upload.fileUrl || '',
        fileName: upload.fileName || '',
        filePath: upload.filePath || '',
        createdBy: user.uid,
      });
      await Promise.all(
        users
          .filter(
            (student) =>
              ['student', 'cr'].includes(normalizeRole(student.role)) &&
              student.branch === subject.branch &&
              student.semester === subject.semester &&
              (subject.division ? student.division === subject.division : true),
          )
          .map((student) =>
            createNotification({
              userId: student.uid,
              title: 'New assignment posted',
              message: `${form.title} is due on ${formatDate(form.dueDate)}.`,
              type: 'assignment',
              actionUrl: '/student/assignments',
            }),
          ),
      );
      setForm({ title: '', subjectId: '', description: '', dueDate: addDays(5) });
      setFile(null);
      notify('Assignment created and students notified.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (assignment) => {
    try {
      await deleteUploadedFile(assignment.filePath);
      await deleteDocument('assignments', assignment.id);
      notify('Assignment deleted.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Teacher Assignments"
        title="Create and monitor assignments"
        description="Assignments created here appear in the existing student assignment tracker."
      />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Create assignment</h3>
          <form onSubmit={saveAssignment} className="mt-5 grid gap-4">
            <Input label="Title" name="title" value={form.title} onChange={handleChange} placeholder="Lab submission 3" />
            <Select label="Subject" name="subjectId" value={form.subjectId} onChange={handleChange}>
              <option value="">Select subject</option>
              {assignedSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>
              ))}
            </Select>
            <Input label="Due date" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
            <Textarea label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Submission details" />
            <label>
              <span className="field-label">Optional file</span>
              <input
                className="field-input mt-2 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-100"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? 'Creating...' : 'Create Assignment'}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="text-xl font-black text-white">Active assignments</h3>
            <Input className="sm:w-72" label="Search" icon={Search} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {visibleAssignments.length ? (
            <div className="mt-5 grid gap-3">
              {visibleAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-black text-white">{assignment.title}</p>
                      <p className="mt-1 text-sm text-violet-200">{assignment.subjectName} - Due {formatDate(assignment.dueDate)}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{assignment.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {assignment.fileUrl ? (
                        <Button as="a" href={assignment.fileUrl} target="_blank" rel="noreferrer" variant="secondary" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <DeleteButton iconOnly itemName={assignment.title} onDelete={() => removeAssignment(assignment)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No assignments yet" message="Create assignments for your assigned subjects." />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
