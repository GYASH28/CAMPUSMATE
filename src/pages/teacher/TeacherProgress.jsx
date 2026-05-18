import { Download, Plus, TrendingUp, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import MotionPage from '../../components/animations/MotionPage';
import StatCard from '../../components/dashboard/StatCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addDocument, updateDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { exportCampusReport } from '../../utils/reportUtils';
import { isTeacherSubject, subjectDisplay } from '../../utils/roleUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function TeacherProgress() {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const { data: subjects } = useCollection('subjects');
  const { data: users } = useCollection('users');
  const { data: quizResults } = useCollection('quizResults');
  const { data: internalMarks } = useCollection('internalMarks');
  const [form, setForm] = useState({
    studentId: '',
    subjectId: '',
    unitTestMarks: '20',
    assignmentMarks: '10',
    practicalMarks: '10',
    attendanceMarks: '5',
    maxMarks: '50',
  });

  const assignedSubjects = subjects.filter((subject) => isTeacherSubject(subject, user, profile));
  const subjectIds = new Set(assignedSubjects.map((subject) => subject.id));
  const students = users.filter(
    (student) =>
      ['student', 'cr'].includes(normalizeRole(student.role)) &&
      assignedSubjects.some(
        (subject) =>
          subject.branch === student.branch &&
          subject.semester === student.semester &&
          (subject.division ? subject.division === student.division : true),
      ),
  );
  const relevantResults = quizResults.filter((result) => subjectIds.has(result.subjectId));
  const averageQuiz = relevantResults.length
    ? Math.round(relevantResults.reduce((sum, result) => sum + Number(result.percentage || 0), 0) / relevantResults.length)
    : 0;
  const weakTopics = [...new Set(relevantResults.flatMap((result) => result.weakTopics || []))].slice(0, 6);
  const chartData = assignedSubjects.map((subject) => {
    const subjectResults = relevantResults.filter((result) => result.subjectId === subject.id);
    return {
      subject: subject.code,
      score: subjectResults.length
        ? Math.round(subjectResults.reduce((sum, result) => sum + Number(result.percentage || 0), 0) / subjectResults.length)
        : 0,
    };
  });
  const marksRows = internalMarks.filter((mark) => subjectIds.has(mark.subjectId));

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveMarks = async (event) => {
    event.preventDefault();
    const student = students.find((item) => item.uid === form.studentId);
    const subject = assignedSubjects.find((item) => item.id === form.subjectId);
    if (!student || !subject) {
      notify('Select a student and subject.', 'error');
      return;
    }
    const totalMarks =
      Number(form.unitTestMarks || 0) +
      Number(form.assignmentMarks || 0) +
      Number(form.practicalMarks || 0) +
      Number(form.attendanceMarks || 0);
    const existing = internalMarks.find(
      (mark) => mark.studentId === student.uid && mark.subjectId === subject.id,
    );
    const payload = {
      studentId: student.uid,
      studentName: student.name,
      subjectId: subject.id,
      subjectName: subjectDisplay(subject),
      unitTestMarks: Number(form.unitTestMarks || 0),
      assignmentMarks: Number(form.assignmentMarks || 0),
      practicalMarks: Number(form.practicalMarks || 0),
      attendanceMarks: Number(form.attendanceMarks || 0),
      totalMarks,
      maxMarks: Number(form.maxMarks || 50),
      updatedBy: user.uid,
    };
    try {
      if (existing) {
        await updateDocument('internalMarks', existing.id, payload);
      } else {
        await addDocument('internalMarks', payload);
      }
      notify('Internal marks saved.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const exportReport = () => {
    exportCampusReport({
      title: 'Teacher Student Progress Report',
      generatedBy: profile?.name,
      summary: [
        { label: 'Assigned subjects', value: assignedSubjects.length },
        { label: 'Students', value: students.length },
        { label: 'Average quiz score', value: `${averageQuiz}%` },
      ],
      columns: [
        { key: 'studentName', label: 'Student' },
        { key: 'subjectName', label: 'Subject' },
        { key: 'totalMarks', label: 'Marks' },
        { key: 'maxMarks', label: 'Max' },
      ],
      rows: marksRows,
      fileName: 'campusmate-teacher-progress.pdf',
    });
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Student Progress"
        title="Performance analytics and internal marks"
        description="Track quiz distribution, weak topics, and update internal marks for assigned classes."
        actions={
          <Button type="button" variant="secondary" onClick={exportReport}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={UsersRound} label="Students" value={students.length} hint="Assigned classes" tone="cyan" />
        <StatCard icon={TrendingUp} label="Average quiz" value={`${averageQuiz}%`} hint={`${relevantResults.length} attempts`} tone="violet" />
        <StatCard icon={Plus} label="Internal marks" value={marksRows.length} hint="Records saved" tone="emerald" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Subject-wise quiz score</h3>
          {chartData.some((item) => item.score) ? (
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                  <XAxis dataKey="subject" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16 }} />
                  <Bar dataKey="score" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No quiz analytics yet" message="Student quiz attempts will appear here." />
          )}
        </Card>

        <Card>
          <Badge tone="rose">Weak topics</Badge>
          <div className="mt-4 flex flex-wrap gap-2">
            {weakTopics.length ? weakTopics.map((topic) => <Badge key={topic} tone="rose">{topic}</Badge>) : <Badge tone="emerald">No weak topics yet</Badge>}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Add or update internal marks</h3>
          <form onSubmit={saveMarks} className="mt-5 grid gap-4">
            <Select label="Student" name="studentId" value={form.studentId} onChange={handleChange}>
              <option value="">Select student</option>
              {students.map((student) => <option key={student.uid} value={student.uid}>{student.name} - {student.division}</option>)}
            </Select>
            <Select label="Subject" name="subjectId" value={form.subjectId} onChange={handleChange}>
              <option value="">Select subject</option>
              {assignedSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>)}
            </Select>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Unit test" type="number" name="unitTestMarks" value={form.unitTestMarks} onChange={handleChange} />
              <Input label="Assignment" type="number" name="assignmentMarks" value={form.assignmentMarks} onChange={handleChange} />
              <Input label="Practical" type="number" name="practicalMarks" value={form.practicalMarks} onChange={handleChange} />
              <Input label="Attendance" type="number" name="attendanceMarks" value={form.attendanceMarks} onChange={handleChange} />
              <Input label="Max marks" type="number" name="maxMarks" value={form.maxMarks} onChange={handleChange} />
            </div>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Save Marks
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-xl font-black text-white">Marks records</h3>
          {marksRows.length ? (
            <div className="mt-5 grid gap-3">
              {marksRows.map((mark) => {
                const percent = Math.round((Number(mark.totalMarks || 0) / Number(mark.maxMarks || 1)) * 100);
                return (
                  <div key={mark.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                    <p className="font-black text-white">{mark.studentName}</p>
                    <p className="mt-1 text-sm text-slate-400">{mark.subjectName}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(percent, 100)}%` }} />
                    </div>
                    <p className="mt-2 text-sm font-bold text-cyan-100">{mark.totalMarks}/{mark.maxMarks}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No marks yet" message="Saved internal marks will appear here." />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
