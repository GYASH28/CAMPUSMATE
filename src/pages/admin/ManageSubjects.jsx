import { useState } from 'react';
import { Edit3, Plus, Search, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import DeleteButton from '../../components/common/DeleteButton';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import MotionPage from '../../components/animations/MotionPage';
import { useToast } from '../../context/ToastContext';
import { addDocument, deleteDocument, setDocumentWithId, updateDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { BRANCHES, DIVISIONS, SAMPLE_BRANCH, SAMPLE_DIVISION, SAMPLE_SEMESTER, SEMESTERS } from '../../utils/constants';
import { normalizeRole } from '../../utils/authUtils';

const emptySubject = {
  name: '',
  code: '',
  branch: SAMPLE_BRANCH,
  semester: SAMPLE_SEMESTER,
  division: SAMPLE_DIVISION,
  teacherId: '',
  teacherName: '',
};

export default function ManageSubjects() {
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: users } = useCollection('users');
  const [form, setForm] = useState(emptySubject);
  const [editingId, setEditingId] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const reset = () => {
    setForm(emptySubject);
    setEditingId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      notify('Subject name and code are required.', 'error');
      return;
    }
    const teacher = users.find((item) => item.uid === form.teacherId);

    try {
      setSaving(true);
      const payload = {
        ...form,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        teacherId: teacher?.uid || form.teacherId,
        teacherName: teacher?.name || form.teacherName.trim(),
      };
      let subjectId = editingId;
      if (editingId) {
        await updateDocument('subjects', editingId, payload);
        notify('Subject updated.', 'success');
      } else {
        const created = await addDocument('subjects', payload);
        subjectId = created.id;
        notify('Subject added.', 'success');
      }
      if (teacher?.uid && subjectId) {
        await setDocumentWithId('teacherAssignments', `${teacher.uid}_${subjectId}`, {
          assignmentId: `${teacher.uid}_${subjectId}`,
          teacherId: teacher.uid,
          teacherName: teacher.name,
          subjectId,
          subjectName: `${payload.code} - ${payload.name}`,
          branch: payload.branch,
          semester: payload.semester,
          division: payload.division,
          createdAt: new Date().toISOString(),
        });
      }
      reset();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const editSubject = (subject) => {
    setEditingId(subject.id);
    setForm({
      name: subject.name || '',
      code: subject.code || '',
      branch: subject.branch || SAMPLE_BRANCH,
      semester: subject.semester || SAMPLE_SEMESTER,
      division: subject.division || SAMPLE_DIVISION,
      teacherId: subject.teacherId || '',
      teacherName: subject.teacherName || '',
    });
  };

  const removeSubject = async (id) => {
    try {
      await deleteDocument('subjects', id);
      notify('Subject deleted.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const visibleSubjects = subjects.filter((subject) =>
    `${subject.code} ${subject.name} ${subject.branch} ${subject.teacherName}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const teachers = users.filter((user) => normalizeRole(user.role) === 'teacher');

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Subjects"
        title="Manage Subjects"
        description="Add, edit, and delete subjects used across timetable, notes, assignments, and exams."
      />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-black text-white">
            {editingId ? 'Edit subject' : 'Add subject'}
          </h3>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <Input
              label="Subject name"
              required
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Basic Electrical and Electronics Engineering"
            />
            <Input
              label="Subject code"
              required
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="BEEE"
            />
            <Select label="Branch" name="branch" value={form.branch} onChange={handleChange}>
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
            </Select>
            <Select label="Semester" name="semester" value={form.semester} onChange={handleChange}>
                {SEMESTERS.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
            </Select>
            <Select label="Division" name="division" value={form.division} onChange={handleChange}>
                {DIVISIONS.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
            </Select>
            <Select label="Assign teacher" name="teacherId" value={form.teacherId} onChange={handleChange}>
              <option value="">Manual teacher name</option>
              {teachers.map((teacher) => (
                <option key={teacher.uid} value={teacher.uid}>
                  {teacher.name} - {teacher.department || 'Teacher'}
                </option>
              ))}
            </Select>
            <Input
              label="Teacher name"
              name="teacherName"
              value={form.teacherName}
              onChange={handleChange}
              placeholder="Prof. Nisha Shah"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={saving}>
                <Plus className="h-4 w-4" />
                {saving ? 'Saving...' : editingId ? 'Update Subject' : 'Add Subject'}
              </Button>
              {editingId ? (
                <Button type="button" variant="secondary" onClick={reset}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="text-xl font-black text-white">Subject list</h3>
            <Input
              className="sm:w-72"
              label="Search"
              icon={Search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subjects"
            />
          </div>
          {visibleSubjects.length ? (
            <div className="mt-5 space-y-3">
              {visibleSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-black text-white">
                        {subject.code} - {subject.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {subject.branch} - Sem {subject.semester} - Div {subject.division || 'All'} - {subject.teacherName || 'Unassigned'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => editSubject(subject)}
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Button>
                      <DeleteButton
                        itemName={`${subject.code} - ${subject.name}`}
                        onDelete={() => removeSubject(subject.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No subjects"
              message="Add subjects or seed demo data from the admin dashboard."
            />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
