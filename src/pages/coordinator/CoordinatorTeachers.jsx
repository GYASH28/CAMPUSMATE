import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { normalizeRole } from '../../utils/authUtils';

export default function CoordinatorTeachers() {
  const { profile } = useAuth();
  const { data: users } = useCollection('users');
  const { data: subjects } = useCollection('subjects');
  const teachers = users
    .filter((user) => normalizeRole(user.role) === 'teacher')
    .filter((user) => !profile?.branch || user.branch === profile.branch || user.department === profile.department)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  return (
    <main className="page-shell space-y-6">
      <PageHeader
        eyebrow="Faculty overview"
        title="Teachers"
        description="View teachers under your assigned branch or department and their subject responsibilities."
      />
      {teachers.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {teachers.map((teacher) => {
            const assigned = subjects.filter((subject) => subject.teacherId === (teacher.uid || teacher.id));
            return (
              <Card key={teacher.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{teacher.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{teacher.email}</p>
                    <p className="mt-2 text-sm text-slate-400">{teacher.department || 'Department not set'}</p>
                  </div>
                  <Badge tone="violet">Teacher</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {assigned.length ? assigned.map((subject) => (
                    <Badge key={subject.id} tone="cyan">{subject.code || subject.subjectCode || subject.name}</Badge>
                  )) : (
                    <Badge tone="slate">No subjects assigned</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No teachers found" message="Teachers created by admin or coordinator will appear here." />
      )}
    </main>
  );
}
