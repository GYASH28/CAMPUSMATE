import { Download, Plus } from 'lucide-react';
import { useState } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addDocument, updateDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { exportCampusReport } from '../../utils/reportUtils';
import { subjectDisplay } from '../../utils/roleUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function ManageInternalMarks() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data: users } = useCollection('users');
  const { data: subjects } = useCollection('subjects');
  const { data: marks } = useCollection('internalMarks');
  const [form, setForm] = useState({
    studentId: '',
    subjectId: '',
    unitTestMarks: '20',
    assignmentMarks: '10',
    practicalMarks: '10',
    attendanceMarks: '5',
    maxMarks: '50',
  });

  const students = users.filter((item) => ['student', 'cr'].includes(normalizeRole(item.role)));

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveMarks = async (event) => {
    event.preventDefault();
    const student = students.find((item) => item.uid === form.studentId);
    const subject = subjects.find((item) => item.id === form.subjectId);
    if (!student || !subject) {
      notify('Select a student and subject.', 'error');
      return;
    }
    const totalMarks =
      Number(form.unitTestMarks || 0) +
      Number(form.assignmentMarks || 0) +
      Number(form.practicalMarks || 0) +
      Number(form.attendanceMarks || 0);
    const existing = marks.find((mark) => mark.studentId === student.uid && mark.subjectId === subject.id);
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
      updatedBy: user?.uid || 'admin',
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
      title: 'Internal Marks Report',
      generatedBy: 'Admin',
      summary: [
        { label: 'Students', value: students.length },
        { label: 'Records', value: marks.length },
      ],
      columns: [
        { key: 'studentName', label: 'Student' },
        { key: 'subjectName', label: 'Subject' },
        { key: 'totalMarks', label: 'Marks' },
        { key: 'maxMarks', label: 'Max' },
      ],
      rows: marks,
      fileName: 'campusmate-internal-marks.pdf',
    });
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Internal Marks"
        title="Admin marks overview"
        description="View and update internal marks across students and subjects."
        actions={
          <Button type="button" variant="secondary" onClick={exportReport}>
            <Download className="h-4 w-4" />
            Export Marks
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <h3 className="text-xl font-black text-white">Add or update marks</h3>
          <form onSubmit={saveMarks} className="mt-5 grid gap-4">
            <Select label="Student" name="studentId" value={form.studentId} onChange={handleChange}>
              <option value="">Select student</option>
              {students.map((student) => <option key={student.uid} value={student.uid}>{student.name}</option>)}
            </Select>
            <Select label="Subject" name="subjectId" value={form.subjectId} onChange={handleChange}>
              <option value="">Select subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>)}
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
          {marks.length ? (
            <div className="mt-5 grid gap-3">
              {marks.map((mark) => (
                <div key={mark.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="cyan">{mark.subjectName}</Badge>
                    <Badge tone="violet">{mark.totalMarks}/{mark.maxMarks}</Badge>
                  </div>
                  <p className="mt-3 font-black text-white">{mark.studentName}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No marks yet" message="Internal marks from admin or teachers will appear here." />
          )}
        </Card>
      </div>
    </MotionPage>
  );
}
