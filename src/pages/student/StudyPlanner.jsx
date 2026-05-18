import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Sparkles } from 'lucide-react';
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
import { callAi } from '../../firebase/aiClient';
import { addDocument, updateDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { addDays, formatDate } from '../../utils/dateUtils';
import { isStudentSubject } from '../../utils/roleUtils';

export default function StudyPlanner() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: plans } = useCollection('studyPlans');
  const [subjectId, setSubjectId] = useState('');
  const [examDate, setExamDate] = useState(addDays(7));
  const [hoursPerDay, setHoursPerDay] = useState('2');
  const [preparationLevel, setPreparationLevel] = useState('Medium');
  const [weakTopics, setWeakTopics] = useState('');
  const [generated, setGenerated] = useState('');
  const [loading, setLoading] = useState(false);

  const studentSubjects = useMemo(
    () => subjects.filter((item) => isStudentSubject(item, profile)),
    [subjects, profile],
  );
  const selected = studentSubjects.find((item) => item.id === subjectId) || studentSubjects[0];
  const myPlans = plans
    .filter((item) => item.userId === user?.uid)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const generatePlan = async () => {
    if (!selected) {
      notify('Select a subject first.', 'error');
      return;
    }
    try {
      setLoading(true);
      const result = await callAi({
        type: 'study-plan',
        subject: `${selected.code} - ${selected.name}`,
        topic: 'Study planner',
        examDate,
        content: `Hours per day: ${hoursPerDay}. Preparation level: ${preparationLevel}. Weak topics: ${weakTopics}`,
      });
      setGenerated(result.data);
      notify(result.demo ? 'Demo study plan generated.' : 'Study plan generated.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!generated || !selected) return;
    try {
      await addDocument('studyPlans', {
        userId: user.uid,
        subjectId: selected.id,
        subjectName: `${selected.code} - ${selected.name}`,
        examDate,
        hoursPerDay,
        preparationLevel,
        weakTopics,
        plan: generated,
        completedDays: [],
      });
      notify('Study plan saved.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const toggleComplete = async (plan, day) => {
    const current = plan.completedDays || [];
    const next = current.includes(day) ? current.filter((item) => item !== day) : [...current, day];
    try {
      await updateDocument('studyPlans', plan.id, { completedDays: next });
      notify('Study plan progress updated.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Smart Study Planner"
        title="Plan smarter before exams"
        description="Generate AI day-wise study plans from exam date, weak topics, hours, and preparation level."
      />

      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <div className="grid gap-4">
            <Select label="Subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
              <option value="">Choose subject</option>
              {studentSubjects.map((item) => (
                <option key={item.id} value={item.id}>{item.code} - {item.name}</option>
              ))}
            </Select>
            <Input label="Exam date" type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} />
            <Input label="Available study hours per day" type="number" min="1" value={hoursPerDay} onChange={(event) => setHoursPerDay(event.target.value)} />
            <Select label="Current preparation level" value={preparationLevel} onChange={(event) => setPreparationLevel(event.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>Good</option>
            </Select>
            <Textarea label="Weak units/topics" value={weakTopics} onChange={(event) => setWeakTopics(event.target.value)} placeholder="Loops, Ohm's Law, HTML Forms..." />
            <Button type="button" onClick={generatePlan} disabled={loading}>
              <Sparkles className="h-4 w-4" />
              {loading ? 'Generating...' : 'Generate Study Plan'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="cyan" icon={CalendarClock}>Generated plan</Badge>
              <h3 className="mt-3 text-2xl font-black text-white">AI planner output</h3>
            </div>
            {generated ? <Button type="button" onClick={savePlan}>Save Plan</Button> : null}
          </div>
          {generated ? (
            <pre className="mt-5 max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-slate-950/55 p-5 text-sm leading-7 text-slate-200">
              {generated}
            </pre>
          ) : (
            <div className="mt-5">
              <EmptyState title="No plan generated yet" message="Fill the form and let CampusMate create a day-wise plan." />
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-xl font-black text-white">Saved plans</h3>
        {myPlans.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {myPlans.map((plan) => {
              const completed = plan.completedDays?.length || 0;
              const percent = Math.min(completed * 20, 100);
              return (
                <div key={plan.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="violet">{plan.subjectName}</Badge>
                    <p className="text-xs text-slate-500">Exam {formatDate(plan.examDate)}</p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-300" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{percent}% completed</p>
                  <pre className="mt-4 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-400">{plan.plan}</pre>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((day) => (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={plan.completedDays?.includes(day) ? 'success' : 'dark'}
                        onClick={() => toggleComplete(plan, day)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Day {day}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No saved study plans" message="Generated and saved plans will appear here." />
        )}
      </Card>
    </MotionPage>
  );
}
