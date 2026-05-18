import { useMemo, useState } from 'react';
import { BellRing, CheckCircle2, Plus } from 'lucide-react';
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
import { addDocument, updateDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { REMINDER_TYPES } from '../../utils/constants';
import { calculatePercentage } from '../../utils/attendanceUtils';
import { daysUntil, formatDate, toDateInputValue } from '../../utils/dateUtils';

export default function Reminders() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: assignments } = useCollection('assignments');
  const { data: exams } = useCollection('exams');
  const { data: attendance } = useCollection('attendance');
  const { data: subjects } = useCollection('subjects');
  const { data: reminders } = useCollection('reminders');
  const { data: studyPlans } = useCollection('studyPlans');
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'Custom reminder',
    dueDate: toDateInputValue(),
  });

  const subjectIds = useMemo(
    () =>
      new Set(
        subjects
          .filter(
            (item) =>
              item.branch === profile?.branch &&
              String(item.semester || '') === String(profile?.semester || '') &&
              (!item.division || item.division === profile?.division),
          )
          .map((item) => item.id),
      ),
    [subjects, profile?.branch, profile?.semester, profile?.division],
  );

  const autoReminders = useMemo(() => {
    const assignmentItems = assignments
      .filter((item) => subjectIds.has(item.subjectId) && daysUntil(item.dueDate) <= 3 && daysUntil(item.dueDate) >= 0)
      .map((item) => ({
        id: `assignment-${item.id}`,
        title: `Assignment due: ${item.title}`,
        description: item.subjectName,
        type: 'Assignment due',
        dueDate: item.dueDate,
        status: 'Auto',
      }));
    const examItems = exams
      .filter((item) => subjectIds.has(item.subjectId) && daysUntil(item.examDate) <= 7 && daysUntil(item.examDate) >= 0)
      .map((item) => ({
        id: `exam-${item.id}`,
        title: `Exam coming: ${item.subjectName}`,
        description: item.examType,
        type: 'Exam coming',
        dueDate: item.examDate,
        status: 'Auto',
      }));
    const attendanceItems = attendance
      .filter((item) => item.userId === user?.uid && calculatePercentage(item.present, item.total) < 75)
      .map((item) => ({
        id: `attendance-${item.id}`,
        title: `Attendance warning: ${item.subjectName}`,
        description: 'Attend the next few lectures to stay above 75%.',
        type: 'Attendance warning',
        dueDate: toDateInputValue(),
        status: 'Auto',
      }));
    const studyPlanItems = studyPlans
      .filter((item) => item.userId === user?.uid && (item.completedDays?.length || 0) < 5)
      .map((item) => ({
        id: `study-plan-${item.id}`,
        title: `Study plan task: ${item.subjectName}`,
        description: 'Continue your saved study plan before the exam.',
        type: 'Study plan task',
        dueDate: item.examDate || toDateInputValue(),
        status: 'Auto',
      }));
    return [...assignmentItems, ...examItems, ...attendanceItems, ...studyPlanItems];
  }, [assignments, exams, attendance, studyPlans, user?.uid, subjectIds]);

  const customReminders = reminders.filter((item) => item.userId === user?.uid);
  const allReminders = [...autoReminders, ...customReminders].sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));

  const createReminder = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      notify('Reminder title is required.', 'error');
      return;
    }
    try {
      await addDocument('reminders', {
        userId: user.uid,
        ...form,
        status: 'Pending',
      });
      setForm({ title: '', description: '', type: 'Custom reminder', dueDate: toDateInputValue() });
      notify('Reminder created.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const completeReminder = async (reminder) => {
    if (String(reminder.id).startsWith('assignment-') || reminder.status === 'Auto') return;
    try {
      await updateDocument('reminders', reminder.id, { status: 'Completed' });
      notify('Reminder completed.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Smart Reminders"
        title="Stay ahead of academic deadlines"
        description="In-app reminders from assignments, exams, attendance warnings, study plans, and custom tasks."
      />

      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Create custom reminder</h3>
          <form onSubmit={createReminder} className="mt-5 grid gap-4">
            <Input label="Title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Revise BEEE formulas" />
            <Textarea label="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            <Select label="Type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
              {REMINDER_TYPES.map((type) => <option key={type}>{type}</option>)}
            </Select>
            <Input label="Due date" type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Add Reminder
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-xl font-black text-white">Reminder board</h3>
          {allReminders.length ? (
            <div className="mt-5 grid gap-3">
              {allReminders.map((reminder) => {
                const remaining = daysUntil(reminder.dueDate);
                return (
                  <div key={reminder.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={reminder.status === 'Completed' ? 'emerald' : remaining <= 1 ? 'amber' : 'cyan'}>
                            {reminder.type}
                          </Badge>
                          <p className="text-xs text-slate-500">{formatDate(reminder.dueDate)}</p>
                        </div>
                        <p className="mt-3 font-black text-white">{reminder.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{reminder.description}</p>
                      </div>
                      {reminder.status !== 'Auto' ? (
                        <Button type="button" size="sm" variant={reminder.status === 'Completed' ? 'success' : 'secondary'} onClick={() => completeReminder(reminder)}>
                          <CheckCircle2 className="h-4 w-4" />
                          {reminder.status === 'Completed' ? 'Done' : 'Complete'}
                        </Button>
                      ) : (
                        <Badge tone="violet">Auto</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={BellRing} title="No reminders yet" message="Auto reminders and custom reminders will appear here." />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
