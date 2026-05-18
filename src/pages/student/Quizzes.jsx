import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, CheckCircle2, Clock3, Trophy, XCircle } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import ProgressRing from '../../components/dashboard/ProgressRing';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { calculateQuizResult } from '../../utils/quizUtils';
import { formatDateTime } from '../../utils/dateUtils';
import { isStudentSubject } from '../../utils/roleUtils';

export default function Quizzes() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: questions } = useCollection('quizQuestions');
  const { data: results } = useCollection('quizResults');
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(600);

  const studentSubjects = useMemo(
    () => subjects.filter((subject) => isStudentSubject(subject, profile)),
    [subjects, profile],
  );
  const myResults = results
    .filter((item) => item.userId === user?.uid)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5);

  const startQuiz = (subject, mode) => {
    const pool = questions.filter((question) => question.subjectId === subject.id).slice(0, mode === 'exam' ? 10 : 8);
    if (!pool.length) {
      notify('No quiz questions found. Ask admin to add or seed demo quiz questions.', 'error');
      return;
    }
    setSession({ subject, mode, questions: pool });
    setAnswers({});
    setCurrent(0);
    setResult(null);
    setTimeRemaining(mode === 'exam' ? 600 : 0);
  };

  const selectAnswer = (question, option) => {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: option }));
  };

  const submitQuiz = useCallback(async () => {
    if (!session) return;
    const computed = calculateQuizResult(session.questions, answers);
    const payload = {
      userId: user.uid,
      subjectId: session.subject.id,
      subjectName: `${session.subject.code} - ${session.subject.name}`,
      mode: session.mode,
      score: computed.score,
      totalQuestions: computed.totalQuestions,
      percentage: computed.percentage,
      correctAnswers: computed.correctAnswers,
      wrongAnswers: computed.wrongAnswers,
      weakTopics: computed.weakTopics,
      wrongDetails: computed.wrongDetails,
    };
    try {
      await addDocument('quizResults', payload);
      setResult(payload);
      notify('Quiz result saved.', 'success');
    } catch (error) {
      notify(error.message, 'error');
      setResult(payload);
    }
  }, [answers, notify, session, user]);

  useEffect(() => {
    if (!session || session.mode !== 'exam' || result) return undefined;
    if (timeRemaining <= 0) {
      submitQuiz();
      return undefined;
    }

    const timer = window.setTimeout(
      () => setTimeRemaining((currentValue) => Math.max(currentValue - 1, 0)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [result, session, submitQuiz, timeRemaining]);

  const timerLabel = `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`;

  if (result) {
    return (
      <MotionPage>
        <PageHeader
          eyebrow="Quiz result"
          title={`${result.subjectName} - ${result.mode}`}
          description="Review score, weak topics, and improvement tips."
        />
        <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
          <Card className="grid place-items-center text-center">
            <ProgressRing value={result.percentage} tone={result.percentage >= 75 ? 'emerald' : result.percentage >= 50 ? 'amber' : 'rose'} size={160} label="Score" />
            <h3 className="mt-5 text-3xl font-black text-white">
              {result.score}/{result.totalQuestions}
            </h3>
            <p className="text-sm text-slate-400">Correct answers: {result.correctAnswers}</p>
            <p className="text-sm text-slate-400">Wrong answers: {result.wrongAnswers}</p>
          </Card>
          <Card>
            <Badge tone="violet" icon={Trophy}>Result celebration</Badge>
            <h3 className="mt-4 text-2xl font-black text-white">Improvement plan</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Revise weak topics, retry practice mode, and ask CampusMate AI to explain mistakes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {result.weakTopics.length ? (
                result.weakTopics.map((topic) => <Badge key={topic} tone="rose">{topic}</Badge>)
              ) : (
                <Badge tone="emerald">No weak topics detected</Badge>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" onClick={() => startQuiz(session.subject, session.mode)}>Retry Quiz</Button>
              <Button as={Link} to="/student/ai" variant="secondary">
                <Bot className="h-4 w-4" />
                Ask AI to explain mistakes
              </Button>
            </div>
          </Card>
        </div>
      </MotionPage>
    );
  }

  if (session) {
    const question = session.questions[current];
    const selected = answers[question.id];
    const isPractice = session.mode === 'practice';
    const answered = Boolean(selected);

    return (
      <MotionPage>
        <PageHeader
          eyebrow={session.mode === 'exam' ? 'Exam Mode' : 'Practice Mode'}
          title={session.subject.name}
          description={session.mode === 'exam' ? 'Timer mode: answers are revealed only after submission.' : 'Practice mode: instant feedback and explanations.'}
          actions={
            session.mode === 'exam' ? (
              <Badge tone={timeRemaining <= 60 ? 'rose' : 'amber'} icon={Clock3}>{timerLabel}</Badge>
            ) : null
          }
        />
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <Badge tone="cyan">Question {current + 1}/{session.questions.length}</Badge>
            <Badge tone="violet">{question.difficulty}</Badge>
          </div>
          <h2 className="text-2xl font-black leading-snug text-white">{question.question}</h2>
          <div className="mt-6 grid gap-3">
            {(question.options || []).map((option) => {
              const correct = option === question.correctAnswer;
              const active = selected === option;
              const feedback =
                isPractice && answered
                  ? correct
                    ? 'border-emerald-300/40 bg-emerald-400/15'
                    : active
                      ? 'border-rose-300/40 bg-rose-400/15'
                      : ''
                  : active
                    ? 'border-cyan-300/40 bg-cyan-400/15'
                    : '';
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectAnswer(question, option)}
                  className={`rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-left font-semibold text-slate-100 transition hover:border-cyan-300/30 hover:bg-white/[0.09] ${feedback}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {isPractice && answered ? (
            <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2">
                {selected === question.correctAnswer ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-300" />
                )}
                <p className="font-bold text-white">
                  Correct answer: {question.correctAnswer}
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{question.explanation}</p>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button type="button" variant="secondary" onClick={() => setSession(null)}>Exit</Button>
            {current < session.questions.length - 1 ? (
              <Button type="button" disabled={!answered} onClick={() => setCurrent((value) => value + 1)}>Next Question</Button>
            ) : (
              <Button type="button" disabled={!answered} onClick={submitQuiz}>Submit Quiz</Button>
            )}
          </div>
        </Card>
      </MotionPage>
    );
  }

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Quiz Practice"
        title="Practice mode and Exam mode"
        description="Choose a subject, practice with instant feedback, or take an exam-style attempt."
      />

      {studentSubjects.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {studentSubjects.map((subject) => {
            const count = questions.filter((question) => question.subjectId === subject.id).length;
            return (
              <Card key={subject.id}>
                <Badge tone="cyan">{subject.code}</Badge>
                <h3 className="mt-4 text-xl font-black text-white">{subject.name}</h3>
                <p className="mt-2 text-sm text-slate-400">{count} questions available</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button type="button" variant="secondary" onClick={() => startQuiz(subject, 'practice')}>Practice</Button>
                  <Button type="button" onClick={() => startQuiz(subject, 'exam')}>Exam Mode</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No subjects yet" message="Subjects and quiz questions from admin will appear here." />
      )}

      <Card>
        <h3 className="text-xl font-black text-white">Quiz history</h3>
        {myResults.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {myResults.map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <Badge tone={item.percentage >= 75 ? 'emerald' : 'amber'}>{item.percentage}%</Badge>
                <p className="mt-3 font-black text-white">{item.subjectName}</p>
                <p className="mt-1 text-sm text-slate-400">{item.mode} - {item.score}/{item.totalQuestions}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No quiz attempts yet" message="Start a practice or exam quiz to build your history." />
        )}
      </Card>
    </MotionPage>
  );
}
