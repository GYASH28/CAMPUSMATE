import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import DeleteButton from '../../components/common/DeleteButton';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import MotionPage from '../../components/animations/MotionPage';
import { useToast } from '../../context/ToastContext';
import { addDocument, deleteDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { addDays, daysUntil, formatDate } from '../../utils/dateUtils';

const emptyExam = {
  subjectId: '',
  examType: 'Mid Semester Test',
  examDate: addDays(5),
  syllabus: '',
};

function subjectDisplay(subject) {
  return subject ? `${subject.code} - ${subject.name}` : '';
}

export default function ManageExams() {
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: exams } = useCollection('exams');
  const [form, setForm] = useState(emptyExam);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const subject = subjects.find((item) => item.id === form.subjectId);
    if (!subject || !form.examType.trim() || !form.examDate || !form.syllabus.trim()) {
      notify('Subject, exam type, date, and syllabus are required.', 'error');
      return;
    }

    try {
      setSaving(true);
      await addDocument('exams', {
        subjectId: subject.id,
        subjectName: subjectDisplay(subject),
        examType: form.examType.trim(),
        examDate: form.examDate,
        syllabus: form.syllabus.trim(),
      });
      notify('Exam added.', 'success');
      setForm({ ...emptyExam, examDate: addDays(5) });
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeExam = async (id) => {
    try {
      await deleteDocument('exams', id);
      notify('Exam deleted.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const visibleExams = exams
    .filter((exam) =>
      `${exam.subjectName} ${exam.examType} ${exam.syllabus}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => daysUntil(a.examDate) - daysUntil(b.examDate));

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Exams"
        title="Manage Exams"
        description="Add exam schedules with subject, type, date, syllabus, and countdown support."
      />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Add exam</h3>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
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
              <span className="field-label">Exam type</span>
              <input
                className="field-input mt-2"
                name="examType"
                value={form.examType}
                onChange={handleChange}
                placeholder="Mid Semester Test"
              />
            </label>
            <label>
              <span className="field-label">Exam date</span>
              <input
                className="field-input mt-2"
                type="date"
                name="examDate"
                value={form.examDate}
                onChange={handleChange}
              />
            </label>
            <label>
              <span className="field-label">Syllabus</span>
              <textarea
                className="field-input mt-2 min-h-28 resize-y"
                name="syllabus"
                value={form.syllabus}
                onChange={handleChange}
                placeholder="Units and topics"
              />
            </label>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? 'Saving...' : 'Add Exam'}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="text-xl font-black text-white">Exam schedule</h3>
            <Input
              className="sm:w-72"
              label="Search"
              icon={Search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search exams"
            />
          </div>
          {visibleExams.length ? (
            <div className="mt-5 grid gap-3">
              {visibleExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-black text-white">{exam.subjectName}</p>
                      <p className="mt-1 text-sm text-violet-200">
                        {exam.examType} · {formatDate(exam.examDate)} ·{' '}
                        {Math.max(daysUntil(exam.examDate), 0)} days
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {exam.syllabus}
                      </p>
                    </div>
                    <DeleteButton
                      iconOnly
                      itemName={`${exam.subjectName} exam`}
                      onDelete={() => removeExam(exam.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No exams" message="Add upcoming exams for students." />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
