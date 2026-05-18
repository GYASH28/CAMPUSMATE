import { Link2, Search, UsersRound } from 'lucide-react';
import { useState } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import MotionPage from '../../components/animations/MotionPage';
import { useToast } from '../../context/ToastContext';
import { updateDocument } from '../../firebase/firestore';
import { createNotification } from '../../firebase/notifications';
import useCollection from '../../hooks/useCollection';
import { normalizeRole } from '../../utils/authUtils';

export default function ManageTeachers() {
  const { notify } = useToast();
  const { data: users } = useCollection('users');
  const { data: subjects } = useCollection('subjects');
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [query, setQuery] = useState('');

  const teachers = users.filter((user) => normalizeRole(user.role) === 'teacher');
  const visibleTeachers = teachers.filter((teacher) =>
    `${teacher.name} ${teacher.email} ${teacher.department}`.toLowerCase().includes(query.toLowerCase()),
  );

  const assignSubject = async () => {
    const teacher = teachers.find((item) => item.uid === teacherId);
    const subject = subjects.find((item) => item.id === subjectId);
    if (!teacher || !subject) {
      notify('Select a teacher and a subject.', 'error');
      return;
    }
    try {
      const nextAssigned = Array.from(new Set([...(teacher.assignedSubjects || []), subject.id]));
      await updateDocument('subjects', subject.id, {
        teacherId: teacher.uid,
        teacherName: teacher.name,
        division: subject.division || teacher.division || 'A',
      });
      await updateDocument('users', teacher.id || teacher.uid, { assignedSubjects: nextAssigned });
      await createNotification({
        userId: teacher.uid,
        title: 'Subject assigned',
        message: `${subject.code} - ${subject.name} has been assigned to you.`,
        type: 'system',
        actionUrl: '/teacher/subjects',
      });
      notify('Subject assigned to teacher.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Teacher Management"
        title="Assign teachers to subjects"
        description="Manage teacher profiles and link subjects to teachers for classroom workflows."
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Select label="Teacher" value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
            <option value="">Select teacher</option>
            {teachers.map((teacher) => <option key={teacher.uid} value={teacher.uid}>{teacher.name} - {teacher.department || 'Department'}</option>)}
          </Select>
          <Select label="Subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            <option value="">Select subject</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>)}
          </Select>
          <Button type="button" onClick={assignSubject}>
            <Link2 className="h-4 w-4" />
            Assign
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="text-xl font-black text-white">Teachers</h3>
          <Input className="sm:w-72" label="Search" icon={Search} value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        {visibleTeachers.length ? (
          <div className="mt-5 grid gap-3">
            {visibleTeachers.map((teacher) => {
              const assigned = subjects.filter((subject) => subject.teacherId === teacher.uid || (teacher.assignedSubjects || []).includes(subject.id));
              return (
                <div key={teacher.uid} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <Badge tone="violet">{teacher.department || 'Teacher'}</Badge>
                      <p className="mt-3 font-black text-white">{teacher.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{teacher.email}</p>
                    </div>
                    <div className="flex max-w-xl flex-wrap gap-2">
                      {assigned.length ? assigned.map((subject) => <Badge key={subject.id} tone="cyan">{subject.code}</Badge>) : <Badge tone="amber">No subjects</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={UsersRound} title="No teachers found" message="Teacher signups will appear here for assignment." />
        )}
      </Card>
    </MotionPage>
  );
}
