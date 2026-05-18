import { LibraryBig, UsersRound } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { isTeacherSubject } from '../../utils/roleUtils';
import { normalizeRole } from '../../utils/authUtils';

export default function TeacherSubjects() {
  const { user, profile } = useAuth();
  const { data: subjects } = useCollection('subjects');
  const { data: users } = useCollection('users');
  const assignedSubjects = subjects.filter((subject) => isTeacherSubject(subject, user, profile));

  const studentCount = (subject) =>
    users.filter(
      (item) =>
        ['student', 'cr'].includes(normalizeRole(item.role)) &&
        item.branch === subject.branch &&
        item.semester === subject.semester &&
        (subject.division ? item.division === subject.division : true),
    ).length;

  return (
    <MotionPage>
      <PageHeader
        eyebrow="My Subjects"
        title="Assigned teaching load"
        description="Subjects assigned by admin with branch, semester, division, and student counts."
      />

      {assignedSubjects.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {assignedSubjects.map((subject, index) => (
            <Card key={subject.id} delay={index * 0.03}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone="violet">{subject.code}</Badge>
                  <h3 className="mt-4 text-xl font-black text-white">{subject.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {subject.branch} - Semester {subject.semester} - Division {subject.division || 'All'}
                  </p>
                </div>
                <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-3 text-violet-100">
                  <LibraryBig className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <div className="flex items-center gap-3">
                  <UsersRound className="h-5 w-5 text-cyan-200" />
                  <p className="font-black text-white">{studentCount(subject)} students</p>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Teacher: {subject.teacherName || profile?.name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={LibraryBig}
          title="No subjects assigned yet"
          message="Ask admin to assign subjects from Manage Subjects or Manage Teachers."
        />
      )}
    </MotionPage>
  );
}
