import { Download, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Badge from '../../components/common/Badge';
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
import { UNITS } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { isTeacherSubject, subjectDisplay } from '../../utils/roleUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function TeacherNotes() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: notes } = useCollection('notes');
  const { data: users } = useCollection('users');
  const [query, setQuery] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subjectId: '',
    unit: 'Unit 1',
    description: '',
  });

  const assignedSubjects = subjects.filter((subject) => isTeacherSubject(subject, user, profile));
  const subjectIds = new Set(assignedSubjects.map((subject) => subject.id));
  const visibleNotes = notes
    .filter((note) => subjectIds.has(note.subjectId))
    .filter((note) =>
      `${note.title} ${note.subjectName} ${note.description}`.toLowerCase().includes(query.toLowerCase()),
    );

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveNote = async (event) => {
    event.preventDefault();
    const subject = assignedSubjects.find((item) => item.id === form.subjectId);
    if (!subject || !form.title.trim() || !form.description.trim()) {
      notify('Subject, title, and description are required.', 'error');
      return;
    }
    try {
      setSaving(true);
      const upload = file ? await uploadFile(file, 'notes') : {};
      await addDocument('notes', {
        title: form.title.trim(),
        subjectId: subject.id,
        subjectName: subjectDisplay(subject),
        unit: form.unit,
        description: form.description.trim(),
        fileUrl: upload.fileUrl || '',
        fileName: upload.fileName || '',
        filePath: upload.filePath || '',
        uploadedBy: user.uid,
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
              title: 'New notes uploaded',
              message: `${form.title} is available in Notes.`,
              type: 'notice',
              actionUrl: '/student/notes',
            }),
          ),
      );
      setForm({ title: '', subjectId: '', unit: 'Unit 1', description: '' });
      setFile(null);
      notify('Notes uploaded and students notified.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeNote = async (note) => {
    try {
      await deleteUploadedFile(note.filePath);
      await deleteDocument('notes', note.id);
      notify('Note deleted.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Teacher Notes"
        title="Upload learning resources"
        description="Publish notes directly into the existing student Notes Library."
      />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Upload note</h3>
          <form onSubmit={saveNote} className="mt-5 grid gap-4">
            <Input label="Title" name="title" value={form.title} onChange={handleChange} placeholder="Unit 2 formulas" />
            <Select label="Subject" name="subjectId" value={form.subjectId} onChange={handleChange}>
              <option value="">Select subject</option>
              {assignedSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>
              ))}
            </Select>
            <Select label="Unit" name="unit" value={form.unit} onChange={handleChange}>
              {UNITS.map((unit) => <option key={unit}>{unit}</option>)}
            </Select>
            <Textarea label="Description" name="description" value={form.description} onChange={handleChange} placeholder="What students should revise" />
            <label>
              <span className="field-label">PDF or resource file</span>
              <input
                className="field-input mt-2 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-100"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? 'Uploading...' : 'Upload Note'}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="text-xl font-black text-white">Uploaded notes</h3>
            <Input className="sm:w-72" label="Search" icon={Search} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {visibleNotes.length ? (
            <div className="mt-5 grid gap-3">
              {visibleNotes.map((note) => (
                <div key={note.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="cyan">{note.unit}</Badge>
                        <Badge tone="violet">{note.subjectName}</Badge>
                      </div>
                      <p className="mt-3 font-black text-white">{note.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{note.description}</p>
                      <p className="mt-2 text-xs text-slate-500">Uploaded {formatDate(note.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      {note.fileUrl ? (
                        <Button as="a" href={note.fileUrl} target="_blank" rel="noreferrer" variant="secondary" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <DeleteButton iconOnly itemName={note.title} onDelete={() => removeNote(note)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No uploaded notes" message="Notes for assigned subjects will appear here." />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
