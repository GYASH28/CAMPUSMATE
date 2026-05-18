import { useMemo, useState } from 'react';
import { Bot, Clipboard, Copy, Save, Sparkles } from 'lucide-react';
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
import { addDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { AI_MODES, DIFFICULTIES } from '../../utils/constants';
import { formatDateTime } from '../../utils/dateUtils';
import { isStudentSubject } from '../../utils/roleUtils';

export default function AiAssistant() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: history } = useCollection('aiHistory');
  const [mode, setMode] = useState('explain-topic');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [content, setContent] = useState('');
  const [examDate, setExamDate] = useState('');
  const [response, setResponse] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const studentSubjects = useMemo(
    () => subjects.filter((item) => isStudentSubject(item, profile)),
    [subjects, profile],
  );
  const myHistory = history
    .filter((item) => item.userId === user?.uid)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 8);
  const selectedSubject =
    subject ||
    studentSubjects[0]?.code ||
    studentSubjects[0]?.subjectName ||
    profile?.branch ||
    'General';

  const runAi = async () => {
    if (!topic.trim() && !content.trim() && mode !== 'study-plan') {
      notify('Enter a topic or notes content first.', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        type: mode,
        subject: selectedSubject,
        topic,
        difficulty,
        content,
        examDate,
      };
      const result = await callAi(payload);
      setPrompt(JSON.stringify(payload));
      setResponse(result.data);
      notify(result.demo ? 'Demo AI response generated. Add GEMINI_API_KEY for live AI.' : 'AI response ready.', 'success');
    } catch (error) {
      notify(error.message || 'AI is temporarily unavailable. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveResponse = async () => {
    if (!response) return;
    try {
      await addDocument('aiHistory', {
        userId: user.uid,
        type: mode,
        subject: selectedSubject,
        topic,
        prompt,
        response,
      });
      notify('AI response saved to history.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const copyResponse = async () => {
    await navigator.clipboard.writeText(response);
    notify('Copied AI response.', 'success');
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="CampusMate AI Learning"
        title="AI Study Assistant"
        description="Ask questions, understand topics, generate viva questions, and prepare smarter."
      />

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-glow">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Assistant controls</h3>
              <p className="text-sm text-slate-400">Pick a mode and give the AI context.</p>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {AI_MODES.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={mode === item.value ? 'primary' : 'dark'}
                onClick={() => setMode(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-4">
            <Select label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option value="">Auto / General</option>
              {studentSubjects.map((item) => (
                <option key={item.id} value={`${item.code} - ${item.name}`}>
                  {item.code} - {item.name}
                </option>
              ))}
            </Select>
            <Input
              label="Topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Ohm's Law, Loops in C, HTML Forms..."
            />
            <Select label="Difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              {DIFFICULTIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            {mode === 'study-plan' ? (
              <Input
                label="Exam date"
                type="date"
                value={examDate}
                onChange={(event) => setExamDate(event.target.value)}
              />
            ) : null}
            {mode === 'summarize-notes' || mode === 'study-plan' ? (
              <Textarea
                label={mode === 'summarize-notes' ? 'Paste notes text' : 'Weak topics / current status'}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste notes or describe weak units..."
              />
            ) : null}
            <Button type="button" onClick={runAi} disabled={loading}>
              <Sparkles className="h-4 w-4" />
              {loading ? 'AI is thinking...' : 'Generate Response'}
            </Button>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="min-h-[28rem]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge tone="cyan" icon={Sparkles}>AI response</Badge>
                <h3 className="mt-3 text-2xl font-black text-white">Smart answer</h3>
              </div>
              {response ? (
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={copyResponse}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button type="button" size="sm" onClick={saveResponse}>
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              ) : null}
            </div>
            {loading ? (
              <div className="grid min-h-72 place-items-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-center">
                <div>
                  <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 shadow-glow" />
                  <p className="mt-4 font-bold text-cyan-100">CampusMate AI is thinking...</p>
                </div>
              </div>
            ) : response ? (
              <pre className="scrollbar-soft max-h-[34rem] whitespace-pre-wrap overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/55 p-5 text-sm leading-7 text-slate-200">
                {response}
              </pre>
            ) : (
              <EmptyState
                icon={Bot}
                title="Ask CampusMate AI anything"
                message="Generate explanations, viva questions, MCQs, study plans, or notes summaries."
              />
            )}
          </Card>

          <Card>
            <h3 className="text-xl font-black text-white">Previous AI history</h3>
            {myHistory.length ? (
              <div className="mt-4 space-y-3">
                {myHistory.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="violet">{item.type}</Badge>
                      <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                    </div>
                    <p className="mt-2 font-bold text-white">{item.subject}</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-400">{item.response}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clipboard}
                title="No AI history yet"
                message="Saved AI responses will appear here for quick revision."
              />
            )}
          </Card>
        </div>
      </div>
    </MotionPage>
  );
}
