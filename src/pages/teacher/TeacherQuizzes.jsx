import { Edit3, Plus, Search, X } from 'lucide-react';
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
import { addDocument, deleteDocument, updateDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { DIFFICULTIES, QUIZ_UNITS } from '../../utils/constants';
import { isTeacherSubject, subjectDisplay } from '../../utils/roleUtils';

const emptyForm = {
  subjectId: '',
  unit: 'Unit 1',
  topic: '',
  question: '',
  optionsText: '',
  correctAnswer: '',
  explanation: '',
  difficulty: 'medium',
};

export default function TeacherQuizzes() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: questions } = useCollection('quizQuestions');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const assignedSubjects = subjects.filter((subject) => isTeacherSubject(subject, user, profile));
  const subjectIds = new Set(assignedSubjects.map((subject) => subject.id));
  const visibleQuestions = questions
    .filter((question) => subjectIds.has(question.subjectId))
    .filter((question) =>
      `${question.subjectName} ${question.topic} ${question.question}`.toLowerCase().includes(query.toLowerCase()),
    );

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const reset = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const saveQuestion = async (event) => {
    event.preventDefault();
    const subject = assignedSubjects.find((item) => item.id === form.subjectId);
    const options = form.optionsText.split('\n').map((item) => item.trim()).filter(Boolean);
    if (!subject || !form.question.trim() || options.length < 2 || !form.correctAnswer.trim()) {
      notify('Subject, question, at least two options, and correct answer are required.', 'error');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        subjectId: subject.id,
        subjectName: subjectDisplay(subject),
        unit: form.unit,
        topic: form.topic.trim() || form.unit,
        question: form.question.trim(),
        options,
        correctAnswer: form.correctAnswer.trim(),
        explanation: form.explanation.trim(),
        difficulty: form.difficulty,
        createdBy: user.uid,
      };
      if (editingId) {
        await updateDocument('quizQuestions', editingId, payload);
        notify('Question updated.', 'success');
      } else {
        await addDocument('quizQuestions', payload);
        notify('Question added.', 'success');
      }
      reset();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const editQuestion = (question) => {
    setEditingId(question.id);
    setForm({
      subjectId: question.subjectId,
      unit: question.unit || 'Unit 1',
      topic: question.topic || '',
      question: question.question || '',
      optionsText: (question.options || []).join('\n'),
      correctAnswer: question.correctAnswer || '',
      explanation: question.explanation || '',
      difficulty: question.difficulty || 'medium',
    });
  };

  const removeQuestion = async (question) => {
    try {
      await deleteDocument('quizQuestions', question.id);
      notify('Question deleted.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Teacher Quizzes"
        title="Build practice and exam questions"
        description="Questions added here feed the student Practice Mode and Exam Mode."
      />

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <h3 className="text-xl font-black text-white">{editingId ? 'Edit question' : 'Add question'}</h3>
          <form onSubmit={saveQuestion} className="mt-5 grid gap-4">
            <Select label="Subject" name="subjectId" value={form.subjectId} onChange={handleChange}>
              <option value="">Select subject</option>
              {assignedSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>)}
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Unit" name="unit" value={form.unit} onChange={handleChange}>
                {QUIZ_UNITS.map((unit) => <option key={unit}>{unit}</option>)}
              </Select>
              <Select label="Difficulty" name="difficulty" value={form.difficulty} onChange={handleChange}>
                {DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </div>
            <Input label="Topic" name="topic" value={form.topic} onChange={handleChange} />
            <Textarea label="Question" name="question" value={form.question} onChange={handleChange} />
            <Textarea label="Options (one per line)" name="optionsText" value={form.optionsText} onChange={handleChange} />
            <Input label="Correct answer" name="correctAnswer" value={form.correctAnswer} onChange={handleChange} />
            <Textarea label="Explanation" name="explanation" value={form.explanation} onChange={handleChange} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={saving} className="flex-1">
                <Plus className="h-4 w-4" />
                {saving ? 'Saving...' : editingId ? 'Update Question' : 'Add Question'}
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
            <h3 className="text-xl font-black text-white">Question bank</h3>
            <Input className="sm:w-72" label="Search" icon={Search} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {visibleQuestions.length ? (
            <div className="mt-5 grid gap-3">
              {visibleQuestions.map((question) => (
                <div key={question.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="cyan">{question.subjectName}</Badge>
                        <Badge tone="violet">{question.unit}</Badge>
                      </div>
                      <p className="mt-3 font-black text-white">{question.question}</p>
                      <p className="mt-1 text-sm text-slate-400">Answer: {question.correctAnswer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => editQuestion(question)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <DeleteButton iconOnly itemName="quiz question" onDelete={() => removeQuestion(question)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No questions yet" message="Add quiz questions for assigned subjects." />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
