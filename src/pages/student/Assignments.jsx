import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Download, Search } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import StatusPill from '../../components/common/StatusPill';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { setDocumentWithId } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { formatDate } from '../../utils/dateUtils';
import { isStudentSubject } from '../../utils/roleUtils';
import { getDueLabel, getDueStatus, matchesText } from '../../utils/statusUtils';

export default function Assignments() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: assignments } = useCollection('assignments');
  const { data: statuses } = useCollection('assignmentStatus');
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const studentSubjects = useMemo(
    () => subjects.filter((subject) => isStudentSubject(subject, profile)),
    [subjects, profile],
  );
  const subjectIds = new Set(studentSubjects.map((subject) => subject.id));

  const isCompleted = (assignment) =>
    statuses.some(
      (status) =>
        status.assignmentId === assignment.id &&
        status.userId === user?.uid &&
        status.status === 'Completed',
    );

  const relevantAssignments = assignments
    .filter((assignment) => subjectIds.has(assignment.subjectId))
    .filter((assignment) => subjectFilter === 'All' || assignment.subjectId === subjectFilter)
    .filter((assignment) => matchesText(assignment, query, ['title', 'subjectName', 'description']))
    .map((assignment) => ({
      ...assignment,
      computedStatus: getDueStatus(assignment.dueDate, isCompleted(assignment)),
    }))
    .filter((assignment) => statusFilter === 'All' || assignment.computedStatus === statusFilter)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const markCompleted = async (assignment) => {
    try {
      await setDocumentWithId(
        'assignmentStatus',
        `${assignment.id}_${user.uid}`,
        {
          assignmentId: assignment.id,
          userId: user.uid,
          status: 'Completed',
        },
      );
      notify('Assignment marked as completed.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Assignments"
        title="Track every submission"
        description="Search assignments, filter by subject or status, and keep due dates under control."
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_0.6fr_0.45fr]">
          <Input
            label="Search assignments"
            icon={Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, subject, or description"
          />
          <Select label="Subject" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
            <option value="All">All subjects</option>
            {studentSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </Select>
          <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </Select>
        </div>
      </Card>

      {relevantAssignments.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {relevantAssignments.map((assignment, index) => (
            <Card key={assignment.id} delay={index * 0.03} className="flex flex-col">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill>{assignment.computedStatus}</StatusPill>
                  <Badge tone={assignment.computedStatus === 'Overdue' ? 'rose' : 'amber'}>
                    {getDueLabel(assignment.dueDate)}
                  </Badge>
                </div>
                <h3 className="mt-4 text-xl font-black text-white">{assignment.title}</h3>
                <p className="mt-2 text-sm font-semibold text-violet-200">
                  {assignment.subjectName}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {assignment.description}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Due date: {formatDate(assignment.dueDate)}
                </p>
              </div>
              <div className="mt-5 grid gap-3 border-t border-white/10 pt-4">
                {assignment.fileUrl ? (
                  <Button as="a" href={assignment.fileUrl} target="_blank" rel="noreferrer" variant="secondary">
                    <Download className="h-4 w-4" />
                    Download file
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant={assignment.computedStatus === 'Completed' ? 'success' : 'primary'}
                  disabled={assignment.computedStatus === 'Completed'}
                  onClick={() => markCompleted(assignment)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {assignment.computedStatus === 'Completed' ? 'Completed' : 'Mark Completed'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No assignments match your filters"
          message="Assignments posted by admin for your subjects will appear here."
        />
      )}
    </MotionPage>
  );
}
