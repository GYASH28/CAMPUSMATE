import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import useCollection from '../../hooks/useCollection';
import { normalizeRole } from '../../utils/authUtils';

export default function CRClassStudents() {
  const { profile } = useAuth();
  const { data: users } = useCollection('users');
  const students = users
    .filter((user) => ['student', 'cr'].includes(normalizeRole(user.role)))
    .filter(
      (user) =>
        user.branch === profile?.branch &&
        String(user.semester || '') === String(profile?.semester || '') &&
        user.division === profile?.division,
    )
    .sort((a, b) => String(a.rollNumber || '999999').localeCompare(String(b.rollNumber || '999999')));

  return (
    <main className="page-shell space-y-6">
      <PageHeader
        eyebrow="Class list"
        title="Class Students"
        description="Students in your assigned branch, semester, and division sorted by roll number."
      />
      {students.length ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Roll No.</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {students.map((student) => {
                  const isCr = normalizeRole(student.role) === 'cr';
                  return (
                    <tr key={student.id} className="text-slate-300">
                      <td className="px-3 py-4 font-black text-white">{student.rollNumber || '------'}</td>
                      <td className="px-3 py-4 font-semibold text-white">{student.name}</td>
                      <td className="px-3 py-4">{student.email || 'No email'}</td>
                      <td className="px-3 py-4">
                        <Badge tone={isCr ? 'cyan' : 'slate'}>{isCr ? 'Class Representative' : 'Student'}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState title="No classmates found" message="Classmates will appear once user profiles have matching branch, semester, division, and roll number." />
      )}
    </main>
  );
}
