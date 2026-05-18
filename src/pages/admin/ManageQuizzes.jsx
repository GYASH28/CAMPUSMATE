import { useState } from 'react';
import { Edit3, Plus, Search, Sparkles, X } from 'lucide-react';
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
import { callAi } from '../../firebase/aiClient';
import {
  addDocument,
  deleteDocument,
  seedDemoData,
  updateDocument,
} from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { DIFFICULTIES, QUIZ_UNITS } from '../../utils/constants';
import { parseAiMcqs } from '../../utils/quizUtils';

const emptyQuestion = {
  subjectId: '',
  unit: 'Unit 1',
  topic: '',
  question: '',
  optionsText: '',
  correctAnswer: '',
  explanation: '',
  difficulty: 'medium',
};

function subjectName(subject) {
  return subject ? `${subject.code} - ${subject.name}` : '';
}

export default function ManageQuizzes() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: questions } = useCollection('quizQuestions');
  const { data: results } = useCollection('quizResults');
  const [form, setForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState('');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiForm, setAiForm] = useState({
    subjectId: '',
    unit: 'Unit 1',
    topic: '',
    number: '5',
    difficulty: 'medium',
  });
  const [generated, setGenerated] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const reset = () => {
    setForm(emptyQuestion);
    setEditingId('');
  };

  const saveQuestion = async (event) => {
    event.preventDefault();
    const subject = subjects.find((item) => item.id === form.subjectId);
    const options = form.optionsText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!subject || !form.question.trim() || options.length < 2 || !form.correctAnswer.trim()) {
      notify('Subject, question, at least 2 options, and correct answer are required.', 'error');
      return;
    }

    const payload = {
      subjectId: subject.id,
      subjectName: subjectName(subject),
      unit: form.unit,
      topic: form.topic.trim() || form.unit,
      question: form.question.trim(),
      options,
      correctAnswer: form.correctAnswer.trim(),
      explanation: form.explanation.trim(),
      difficulty: form.difficulty,
      createdBy: user?.uid || 'admin',
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateDocument('quizQuestions', editingId, payload);
        notify('Quiz question updated.', 'success');
      } else {
        await addDocument('quizQuestions', payload);
        notify('Quiz question added.', 'success');
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
      subjectId: question.subjectId || '',
      unit: question.unit || 'Unit 1',
      topic: question.topic || '',
      question: question.question || '',
      optionsText: (question.options || []).join('\n'),
      correctAnswer: question.correctAnswer || '',
      explanation: question.explanation || '',
      difficulty: question.difficulty || 'medium',
    });
  };

  const removeQuestion = async (id) => {
    try {
      await deleteDocument('quizQuestions', id);
      notify('Quiz question deleted.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const bulkSeed = async () => {
    try {
      await seedDemoData(user?.uid);
      notify('Sample quiz questions seeded.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const generateAi = async () => {
    const subject = subjects.find((item) => item.id === aiForm.subjectId);
    if (!subject || !aiForm.topic.trim()) {
      notify('Select a subject and topic for AI generation.', 'error');
      return;
    }
    try {
      setAiLoading(true);
      const result = await callAi({
        type: 'mcq',
        subject: subjectName(subject),
        topic: aiForm.topic,
        difficulty: aiForm.difficulty,
        content: `Generate ${aiForm.number} MCQs as JSON array with question, options, correctAnswer, explanation, difficulty, topic.`,
      });
      const parsed = parseAiMcqs(result.data, subjectName(subject)).slice(0, Number(aiForm.number));
      setGenerated(
        parsed.map((item) => ({
          ...item,
          subjectId: subject.id,
          subjectName: subjectName(subject),
          unit: aiForm.unit,
        })),
      );
      notify('AI MCQs generated for review.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const saveGenerated = async (question) => {
    try {
      await addDocument('quizQuestions', {
        ...question,
        createdBy: user?.uid || 'admin',
      });
      setGenerated((current) => current.filter((item) => item !== question));
      notify('Generated question saved.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const visibleQuestions = questions.filter((question) =>
    `${question.subjectName} ${question.unit} ${question.topic} ${question.question}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <MotionPage>
      <PageHeader
        eyebrow="CampusMate quizzes"
        title="Manage Quizzes"
        description="Add, edit, delete, seed, and AI-generate MCQs for student practice and exam mode."
        actions={
          <Button type="button" variant="secondary" onClick={bulkSeed}>
            Bulk Add Sample Questions
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <h3 className="text-xl font-black text-white">{editingId ? 'Edit question' : 'Add question'}</h3>
          <form onSubmit={saveQuestion} className="mt-5 grid gap-4">
            <Select label="Subject" name="subjectId" value={form.subjectId} onChange={handleChange}>
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>
              ))}
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Unit" name="unit" value={form.unit} onChange={handleChange}>
                {QUIZ_UNITS.map((unit) => <option key={unit}>{unit}</option>)}
              </Select>
              <Select label="Difficulty" name="difficulty" value={form.difficulty} onChange={handleChange}>
                {DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </div>
            <Input label="Topic" name="topic" value={form.topic} onChange={handleChange} placeholder="Loops, Ohm's Law..." />
            <Textarea label="Question" name="question" value={form.question} onChange={handleChange} />
            <Textarea label="Options (one per line)" name="optionsText" value={form.optionsText} onChange={handleChange} />
            <Input label="Correct answer" name="correctAnswer" value={form.correctAnswer} onChange={handleChange} placeholder="Paste exact option text" />
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

        <div className="space-y-5">
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Question bank</h3>
                <p className="text-sm text-slate-400">{questions.length} questions - {results.length} attempts</p>
              </div>
              <Input className="sm:w-80" label="Search" icon={Search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions" />
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
                          <Badge tone="amber">{question.difficulty}</Badge>
                        </div>
                        <p className="mt-3 font-black text-white">{question.question}</p>
                        <p className="mt-1 text-sm text-slate-400">Answer: {question.correctAnswer}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => editQuestion(question)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <DeleteButton iconOnly itemName="quiz question" onDelete={() => removeQuestion(question.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No quiz questions yet" message="Add questions manually, seed demo data, or generate MCQs with AI." />
            )}
          </Card>

          <Card>
            <Badge tone="violet" icon={Sparkles}>Generate MCQs with AI</Badge>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Select label="Subject" value={aiForm.subjectId} onChange={(event) => setAiForm((current) => ({ ...current, subjectId: event.target.value }))}>
                <option value="">Select subject</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>)}
              </Select>
              <Select label="Unit" value={aiForm.unit} onChange={(event) => setAiForm((current) => ({ ...current, unit: event.target.value }))}>
                {QUIZ_UNITS.map((unit) => <option key={unit}>{unit}</option>)}
              </Select>
              <Input label="Topic" value={aiForm.topic} onChange={(event) => setAiForm((current) => ({ ...current, topic: event.target.value }))} placeholder="Arrays, Transformer basics..." />
              <Input label="Number" type="number" min="1" max="10" value={aiForm.number} onChange={(event) => setAiForm((current) => ({ ...current, number: event.target.value }))} />
              <Select label="Difficulty" value={aiForm.difficulty} onChange={(event) => setAiForm((current) => ({ ...current, difficulty: event.target.value }))}>
                {DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <div className="flex items-end">
                <Button type="button" className="w-full" onClick={generateAi} disabled={aiLoading}>
                  <Sparkles className="h-4 w-4" />
                  {aiLoading ? 'Generating...' : 'Generate for Review'}
                </Button>
              </div>
            </div>
            {generated.length ? (
              <div className="mt-5 grid gap-3">
                {generated.map((question, index) => (
                  <div key={`${question.question}-${index}`} className="rounded-3xl border border-violet-300/20 bg-violet-300/10 p-4">
                    <p className="font-black text-white">{question.question}</p>
                    <p className="mt-2 text-sm text-slate-300">Answer: {question.correctAnswer}</p>
                    <Button type="button" size="sm" className="mt-3" onClick={() => saveGenerated(question)}>Save This Question</Button>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </MotionPage>
  );
}
