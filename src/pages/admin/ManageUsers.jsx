import { serverTimestamp } from 'firebase/firestore';
import { Copy, KeyRound, Save, Search, ShieldCheck, UserCheck, UserPlus, UsersRound } from 'lucide-react';
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
import { addDocument, setDocumentWithId, updateDocument } from '../../firebase/firestore';
import useCollection from '../../hooks/useCollection';
import { BRANCHES, DEPARTMENTS, DIVISIONS, ROLES, SAMPLE_BRANCH, SAMPLE_DIVISION, SAMPLE_SEMESTER, SEMESTERS } from '../../utils/constants';
import { canAssignRole, getRoleLabel, normalizeRole, validateRollNumber } from '../../utils/authUtils';
import { statusTone } from '../../utils/roleUtils';

const initialInvite = {
  name: '',
  email: '',
  role: 'teacher',
  rollNumber: '',
  department: 'Computer Engineering',
  branch: SAMPLE_BRANCH,
  semester: SAMPLE_SEMESTER,
  division: SAMPLE_DIVISION,
};

function generateInviteCode(role) {
  const bytes = new Uint8Array(3);
  window.crypto.getRandomValues(bytes);
  const value = bytes.reduce((sum, byte) => (sum << 8) + byte, 0) % 1000000;
  const prefixMap = { admin: 'ADM', coordinator: 'HOD', teacher: 'TEA', cr: 'CR' };
  return `CM-${prefixMap[role] || 'USR'}-${String(value).padStart(6, '0')}`;
}

export default function ManageUsers() {
  const { user: currentUser, profile } = useAuth();
  const { notify } = useToast();
  const { data: users } = useCollection('users');
  const { data: inviteCodes } = useCollection('inviteCodes');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [inviteForm, setInviteForm] = useState(initialInvite);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [createdCode, setCreatedCode] = useState('');

  const visibleUsers = users
    .filter((user) => roleFilter === 'All' || user.role === roleFilter)
    .filter((user) =>
      `${user.name} ${user.email} ${user.role} ${user.branch}`.toLowerCase().includes(query.toLowerCase()),
    );

  const updateUser = async (user, updates) => {
    try {
      const payload = updates.role
        ? { ...updates, role: normalizeRole(updates.role), isCR: normalizeRole(updates.role) === 'cr' }
        : updates;
      await updateDocument('users', user.id || user.uid, payload);
      notify('User updated.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const handleInviteChange = (event) => {
    setInviteForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const createInvite = async (event) => {
    event.preventDefault();
    const email = inviteForm.email.trim().toLowerCase();
    const name = inviteForm.name.trim();
    const role = normalizeRole(inviteForm.role);
    if (!name || !email) {
      notify('Name and email are required.', 'error');
      return;
    }
    if (!canAssignRole(profile?.role || 'admin', role)) {
      notify('You do not have permission to assign this role.', 'error');
      return;
    }
    if (role === 'cr' && !validateRollNumber(inviteForm.rollNumber)) {
      notify('Roll number must be exactly 6 digits.', 'error');
      return;
    }

    try {
      setCreatingInvite(true);
      let code = generateInviteCode(role);
      while (inviteCodes.some((invite) => invite.code === code)) {
        code = generateInviteCode(role);
      }
      await addDocument('inviteCodes', {
        code,
        role,
        used: false,
        usedBy: '',
        createdBy: currentUser?.uid || 'admin',
        usedAt: '',
        name,
        email,
        department: inviteForm.department,
        branch: inviteForm.branch,
        semester: inviteForm.semester,
        division: inviteForm.division,
        rollNumber: inviteForm.rollNumber,
        assignedSubjects: [],
        status: 'active',
      });
      setCreatedCode(code);
      setInviteForm(initialInvite);
      notify(`${role} invite code created.`, 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyInvite = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      notify('Invite code copied.', 'success');
    } catch {
      notify('Could not copy invite code.', 'error');
    }
  };

  const elevatedInvites = inviteCodes
    .filter((invite) => ['cr', 'teacher', 'coordinator', 'admin'].includes(normalizeRole(invite.role)))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const assignAsCr = async (item) => {
    if (!validateRollNumber(item.rollNumber)) {
      notify('Roll number must be exactly 6 digits before assigning CR.', 'error');
      return;
    }
    const currentCr = users.find(
      (candidate) =>
        normalizeRole(candidate.role) === 'cr' &&
        candidate.branch === item.branch &&
        String(candidate.semester || '') === String(item.semester || '') &&
        candidate.division === item.division &&
        (candidate.uid || candidate.id) !== (item.uid || item.id),
    );
    if (currentCr) {
      const replace = window.confirm('This class already has a CR. Replace current CR?');
      if (!replace) return;
      await updateDocument('users', currentCr.uid || currentCr.id, { role: 'student', isCR: false });
    }
    await updateDocument('users', item.uid || item.id, {
      role: 'cr',
      isCR: true,
      assignedBy: currentUser?.uid || 'admin',
      assignedAt: serverTimestamp(),
    });
    await setDocumentWithId('classRepresentatives', `${item.branch}_${item.semester}_${item.division}`, {
      crId: item.uid || item.id,
      crName: item.name,
      branch: item.branch,
      semester: item.semester,
      division: item.division,
      assignedBy: currentUser?.uid || 'admin',
      assignedAt: serverTimestamp(),
      status: 'active',
    });
    notify(`${item.name} is now the class representative.`, 'success');
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="User Management"
        title="Manage students, CRs, teachers, coordinators, and admins"
        description="Public signup is student-only. Elevated roles are controlled here with role updates and one-time invite codes."
      />

      <Card>
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Create secure role invite</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Public signup creates students only. Use a one-time invite code when an approved CR, teacher, coordinator, or admin needs elevated access.
            </p>
          </div>
        </div>
        <form onSubmit={createInvite} className="grid gap-4 md:grid-cols-3">
          <Input label="Name" name="name" value={inviteForm.name} onChange={handleInviteChange} placeholder="Prof. Nisha Shah" required />
          <Input label="Email" type="email" name="email" value={inviteForm.email} onChange={handleInviteChange} placeholder="teacher@college.edu" required />
          <Select label="Invite role" name="role" value={inviteForm.role} onChange={handleInviteChange}>
            <option value="cr">cr</option>
            <option value="teacher">teacher</option>
            <option value="coordinator">coordinator</option>
            <option value="admin">admin</option>
          </Select>
          <Input label="Roll number" name="rollNumber" value={inviteForm.rollNumber} onChange={handleInviteChange} placeholder="254101" inputMode="numeric" pattern="[0-9]{6}" hint="Required for CR invites." />
          <Select label="Department" name="department" value={inviteForm.department} onChange={handleInviteChange}>
            {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
          </Select>
          <Select label="Branch" name="branch" value={inviteForm.branch} onChange={handleInviteChange}>
            {BRANCHES.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
          </Select>
          <Select label="Semester" name="semester" value={inviteForm.semester} onChange={handleInviteChange}>
            {SEMESTERS.map((semester) => <option key={semester} value={semester}>{semester}</option>)}
          </Select>
          <Select label="Division" name="division" value={inviteForm.division} onChange={handleInviteChange}>
            {DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}
          </Select>
          <div className="flex items-end md:col-span-2">
            <Button type="submit" disabled={creatingInvite} className="w-full">
              <UserPlus className="h-4 w-4" />
              {creatingInvite ? 'Creating invite...' : 'Create Invite Code'}
            </Button>
          </div>
        </form>
        {createdCode ? (
          <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-emerald-300/25 bg-emerald-400/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100">Invite code ready</p>
              <p className="mt-1 text-2xl font-black text-white">{createdCode}</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => copyInvite(createdCode)}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        ) : null}
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_0.3fr]">
          <Input label="Search users" icon={Search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, role..." />
          <Select label="Role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="All">All roles</option>
            {ROLES.map((role) => <option key={role} value={role}>{getRoleLabel(role)}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-black text-white">Recent invite codes</h3>
        {elevatedInvites.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {elevatedInvites.slice(0, 8).map((invite) => (
              <div key={invite.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={['admin', 'coordinator'].includes(invite.role) ? 'violet' : 'cyan'}>{getRoleLabel(invite.role)}</Badge>
                  <Badge tone={invite.used ? 'emerald' : 'amber'}>{invite.used ? 'used' : 'available'}</Badge>
                </div>
                <p className="mt-3 font-black text-white">{invite.name || invite.email}</p>
                <p className="mt-1 text-sm text-slate-400">{invite.email}</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <code className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm font-bold text-cyan-100">
                    {invite.code}
                  </code>
                  {!invite.used ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => copyInvite(invite.code)}>
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={KeyRound} title="No invite codes yet" message="Create an invite when an approved CR, teacher, coordinator, or admin needs access." />
        )}
      </Card>

      {visibleUsers.length ? (
        <div className="grid gap-4">
          {visibleUsers.map((item) => (
            <Card key={item.id || item.uid}>
              <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr] xl:items-center">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={['admin', 'coordinator'].includes(item.role) ? 'violet' : item.role === 'teacher' ? 'cyan' : 'emerald'}>{getRoleLabel(item.role)}</Badge>
                    <Badge tone={statusTone(item.status || 'active')}>{item.status || 'active'}</Badge>
                  </div>
                  <h3 className="mt-3 text-xl font-black text-white">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{item.email}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Select label="Role" value={item.role || 'student'} onChange={(event) => updateUser(item, { role: event.target.value })}>
                    {ROLES.map((role) => <option key={role} value={role}>{getRoleLabel(role)}</option>)}
                  </Select>
                  <Select label="Status" value={item.status || 'active'} onChange={(event) => updateUser(item, { status: event.target.value })}>
                    <option value="active">active</option>
                    <option value="disabled">disabled</option>
                  </Select>
                  <Select label="Branch" value={item.branch || BRANCHES[0]} onChange={(event) => updateUser(item, { branch: event.target.value })}>
                    {BRANCHES.map((branch) => <option key={branch}>{branch}</option>)}
                  </Select>
                  <Select label="Semester" value={item.semester || SEMESTERS[0]} onChange={(event) => updateUser(item, { semester: event.target.value })}>
                    {SEMESTERS.map((semester) => <option key={semester}>{semester}</option>)}
                  </Select>
                  <Select label="Division" value={item.division || DIVISIONS[0]} onChange={(event) => updateUser(item, { division: event.target.value })}>
                    {DIVISIONS.map((division) => <option key={division}>{division}</option>)}
                  </Select>
                  <Input label="Roll number" value={item.rollNumber || ''} onChange={(event) => updateUser(item, { rollNumber: event.target.value })} placeholder="254101" inputMode="numeric" />
                  {['student', 'cr'].includes(normalizeRole(item.role)) ? (
                    <Button type="button" variant="secondary" onClick={() => assignAsCr(item)}>
                      <UserCheck className="h-4 w-4" />
                      Assign as CR
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" disabled>
                      <Save className="h-4 w-4" />
                      Auto saved
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={UsersRound} title="No users found" message="Signups and GitHub logins will create user profiles here." />
      )}

      <Card>
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-cyan-200" />
          <p className="text-sm leading-6 text-slate-400">
            Disabled users are blocked by frontend route guards. For production, enforce the same status check in Firestore rules and backend admin tooling.
          </p>
        </div>
      </Card>
    </MotionPage>
  );
}
