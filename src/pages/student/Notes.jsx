import { useMemo, useState } from 'react';
import { Bot, Download, FileText, Search, Sparkles } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { callAi } from '../../firebase/aiClient';
import { addDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { UNITS } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { isStudentSubject } from '../../utils/roleUtils';
import { matchesText } from '../../utils/statusUtils';

export default function Notes() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: notes } = useCollection('notes');
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [unitFilter, setUnitFilter] = useState('All');
  const [summaryNote, setSummaryNote] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [summaryResult, setSummaryResult] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const studentSubjects = useMemo(
    () => subjects.filter((subject) => isStudentSubject(subject, profile)),
    [subjects, profile],
  );
  const subjectIds = new Set(studentSubjects.map((subject) => subject.id));
  const relevantNotes = notes
    .filter((note) => subjectIds.has(note.subjectId))
    .filter((note) => subjectFilter === 'All' || note.subjectId === subjectFilter)
    .filter((note) => unitFilter === 'All' || note.unit === unitFilter)
    .filter((note) => matchesText(note, query, ['title', 'subjectName', 'description', 'unit']))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const openSummary = (note) => {
    setSummaryNote(note);
    setSummaryText(note.description || '');
    setSummaryResult('');
  };

  const generateSummary = async () => {
    if (!summaryNote || !summaryText.trim()) {
      notify('Paste notes text or add a description before summarizing.', 'error');
      return;
    }

    try {
      setSummaryLoading(true);
      const result = await callAi({
        type: 'summarize-notes',
        subject: summaryNote.subjectName,
        topic: summaryNote.title,
        difficulty: 'medium',
        content: summaryText,
      });
      setSummaryResult(result.data);
      await addDocument('noteSummaries', {
        noteId: summaryNote.id,
        userId: user.uid,
        summary: result.data,
      });
      notify(result.demo ? 'Demo AI summary saved.' : 'AI summary saved.', 'success');
    } catch (error) {
      notify(error.message || 'AI is temporarily unavailable. Please try again.', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Notes library"
        title="Study resource hub"
        description="Search subject-wise notes, filter by unit, download PDFs, and summarize notes with CampusMate AI."
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_0.6fr_0.45fr]">
          <Input
            label="Search notes"
            icon={Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, subject, or description"
          />
          <Select
            label="Subject"
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          >
            <option value="All">All subjects</option>
            {studentSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </Select>
          <Select
            label="Unit"
            value={unitFilter}
            onChange={(event) => setUnitFilter(event.target.value)}
          >
            <option value="All">All units</option>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {relevantNotes.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {relevantNotes.map((note, index) => (
            <Card key={note.id} delay={index * 0.03} className="flex flex-col">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="cyan">{note.unit}</Badge>
                  <Badge tone="violet">PDF</Badge>
                </div>
                <h3 className="mt-4 text-xl font-black text-white">{note.title}</h3>
                <p className="mt-2 text-sm font-semibold text-violet-200">
                  {note.subjectName}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {note.description}
                </p>
              </div>
              <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4">
                <p className="text-xs text-slate-500">
                  Uploaded {formatDate(note.createdAt)}
                </p>
                {note.fileUrl ? (
                  <Button
                    as="a"
                    href={note.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="secondary"
                    className="w-full"
                  >
                    <Download className="h-4 w-4" />
                    Download {note.fileName || 'file'}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => openSummary(note)}
                >
                  <Sparkles className="h-4 w-4" />
                  Summarize with AI
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No notes uploaded yet"
          message="Once notes are added by admin, they will appear here with filters and downloads."
        />
      )}

      <Modal
        open={Boolean(summaryNote)}
        title={summaryNote ? `Summarize: ${summaryNote.title}` : 'Summarize notes'}
        onClose={() => setSummaryNote(null)}
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4">
            <Badge tone="cyan" icon={Bot}>PDF Notes Summarizer</Badge>
            <p className="mt-3 text-sm leading-6 text-cyan-50/90">
              CampusMate supports manual text paste for summaries. Paste PDF text,
              unit notes, or key paragraphs and CampusMate AI will create exam-focused revision notes.
            </p>
          </div>
          <Textarea
            label="Notes text"
            value={summaryText}
            onChange={(event) => setSummaryText(event.target.value)}
            placeholder="Paste notes text here..."
            className="min-h-40"
          />
          <Button type="button" onClick={generateSummary} disabled={summaryLoading} className="w-full">
            <Sparkles className="h-4 w-4" />
            {summaryLoading ? 'Summarizing...' : 'Generate Summary'}
          </Button>
          {summaryResult ? (
            <pre className="scrollbar-soft max-h-80 overflow-y-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-7 text-slate-200">
              {summaryResult}
            </pre>
          ) : null}
        </div>
      </Modal>
    </MotionPage>
  );
}
