import { useState } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import DeleteButton from '../../components/common/DeleteButton';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addDocument, deleteDocument } from '../../firebase/firestore';
import { deleteUploadedFile, uploadFile } from '../../firebase/storage';
import useCollection from '../../hooks/useCollection';
import { UNITS } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';

const emptyNote = {
  title: '',
  subjectId: '',
  unit: 'Unit 1',
  description: '',
};

function subjectDisplay(subject) {
  return subject ? `${subject.code} - ${subject.name}` : '';
}

export default function ManageNotes() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: notes } = useCollection('notes');
  const [form, setForm] = useState(emptyNote);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const reset = () => {
    setForm(emptyNote);
    setFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const subject = subjects.find((item) => item.id === form.subjectId);
    if (!form.title.trim() || !subject || !form.description.trim()) {
      notify('Title, subject, and description are required.', 'error');
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
        uploadedBy: user?.uid || 'admin',
      });
      notify('Note saved.', 'success');
      reset();
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

  const visibleNotes = notes.filter((note) =>
    `${note.title} ${note.subjectName} ${note.unit} ${note.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Notes"
        title="Manage Notes"
        description="Upload PDF notes to Firebase Storage and save metadata in Firestore."
      />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Add note</h3>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <label>
              <span className="field-label">Title</span>
              <input
                className="field-input mt-2"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Unit 1 Essentials"
              />
            </label>
            <label>
              <span className="field-label">Subject</span>
              <select
                className="field-input mt-2"
                name="subjectId"
                value={form.subjectId}
                onChange={handleChange}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Unit</span>
              <select
                className="field-input mt-2"
                name="unit"
                value={form.unit}
                onChange={handleChange}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Description</span>
              <textarea
                className="field-input mt-2 min-h-28 resize-y"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What should students know about these notes?"
              />
            </label>
            <label>
              <span className="field-label">PDF file</span>
              <input
                className="field-input mt-2 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-100"
                type="file"
                accept="application/pdf"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? 'Uploading...' : 'Save Note'}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="text-xl font-black text-white">Uploaded notes</h3>
            <Input
              className="sm:w-72"
              label="Search"
              icon={Search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes"
            />
          </div>
          {visibleNotes.length ? (
            <div className="mt-5 grid gap-3">
              {visibleNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-black text-white">{note.title}</p>
                      <p className="mt-1 text-sm text-violet-200">
                        {note.subjectName} · {note.unit}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {note.description}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Uploaded {formatDate(note.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {note.fileUrl ? (
                        <Button
                          as="a"
                          href={note.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          variant="secondary"
                          size="sm"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <DeleteButton
                        iconOnly
                        itemName={note.title}
                        onDelete={() => removeNote(note)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No notes"
              message="Upload subject-wise notes for students."
            />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
