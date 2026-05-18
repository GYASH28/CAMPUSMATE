import { serverTimestamp } from 'firebase/firestore';
import { UserCheck } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { setDocumentWithId, updateUserProfile } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { normalizeRole } from '../../utils/authUtils';

export default function CoordinatorStudents() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const { data: users } = useCollection('users');
  const students = users
    .filter((user) => ['student', 'cr'].includes(normalizeRole(user.role)))
    .filter((user) =>
      user.branch === profile?.branch &&
      String(user.semester || '') === String(profile?.semester || '') &&
      user.division === profile?.division,
    )
    .sort((a, b) => String(a.rollNumber || '999999').localeCompare(String(b.rollNumber || '999999')));
  const activeCr = students.find((student) => normalizeRole(student.role) === 'cr' && student.status !== 'disabled');

  const assignCr = async (student) => {
    if (activeCr && activeCr.uid !== student.uid) {
      const replace = window.confirm('This class already has a CR. Replace current CR?');
      if (!replace) return;
      await updateUserProfile(activeCr.uid || activeCr.id, { role: 'student', isCR: false });
    }

    await updateUserProfile(student.uid || student.id, {
      role: 'cr',
      isCR: true,
      branch: student.branch,
      semester: student.semester,
      division: student.division,
      assignedBy: profile?.uid || profile?.id,
      assignedAt: serverTimestamp(),
    });
    await setDocumentWithId('classRepresentatives', `${student.branch}_${student.semester}_${student.division}`, {
      crId: student.uid || student.id,
      crName: student.name,
      branch: student.branch,
      semester: student.semester,
      division: student.division,
      assignedBy: profile?.uid || profile?.id,
      assignedAt: serverTimestamp(),
      status: 'active',
    });
    notify(`${student.name} is now the class representative.`, 'success');
  };

  return (
    <main className="page-shell space-y-6">
      <PageHeader
        eyebrow="Class management"
        title="Students"
        description="View your assigned class, roll numbers, and assign one active class representative."
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
                  <th className="px-3 py-3">Action</th>
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
                      <td className="px-3 py-4">
                        <Button type="button" size="sm" variant={isCr ? 'secondary' : 'primary'} onClick={() => assignCr(student)}>
                          <UserCheck className="h-4 w-4" />
                          {isCr ? 'Current CR' : 'Assign as CR'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState title="No students found" message="Students matching your branch, semester, and division will appear here." />
      )}
    </main>
  );
}
