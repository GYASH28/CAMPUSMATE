import { Navigate, useNavigate } from 'react-router-dom';
import { Save, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import Select from '../../components/common/Select';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createUserProfile, updateUserProfile } from '../../firebase/firestore';
import { BRANCHES, DEPARTMENTS, DIVISIONS, SEMESTERS } from '../../utils/constants';
import {
  devAuthError,
  getDashboardPath,
  mapFirebaseError,
  normalizeRole,
  validateRollNumber,
} from '../../utils/authUtils';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { currentUser, userProfile, loading, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    branch: 'Computer Engineering & IoT',
    semester: '2',
    division: 'A',
    rollNumber: '',
    department: 'Computer Engineering',
  });

  useEffect(() => {
    if (!currentUser) return;
    setForm({
      name: userProfile?.name || currentUser.displayName || 'CampusMate User',
      branch: userProfile?.branch || 'Computer Engineering & IoT',
      semester: userProfile?.semester || '2',
      division: userProfile?.division || 'A',
      rollNumber: userProfile?.rollNumber || '',
      department: userProfile?.department || 'Computer Engineering',
    });
  }, [currentUser, userProfile]);

  if (loading) return <Loader label="Loading your profile..." />;
  if (!currentUser) return <Navigate to="/login" replace />;

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      notify('Creating your CampusMate profile...', 'success');
      const lockedRole = normalizeRole(userProfile?.role || 'student');
      if (['student', 'cr'].includes(lockedRole) && !validateRollNumber(form.rollNumber)) {
        notify('Roll number must be exactly 6 digits.', 'error');
        return;
      }
      const payload = {
        name: form.name.trim() || currentUser.displayName || 'CampusMate User',
        email: currentUser.email || userProfile?.email || '',
        role: lockedRole,
        branch: form.branch,
        semester: form.semester,
        division: form.division,
        rollNumber: form.rollNumber.trim(),
        department: form.department,
        provider: userProfile?.provider || currentUser.providerData?.[0]?.providerId || 'password',
        status: userProfile?.status || 'active',
        assignedSubjects: userProfile?.assignedSubjects || [],
        profileComplete: true,
      };

      if (userProfile?.uid || userProfile?.id) {
        await updateUserProfile(currentUser.uid, payload);
      } else {
        await createUserProfile(currentUser.uid, payload);
      }

      const refreshed = await refreshProfile();
      notify('Redirecting to your workspace...', 'success');
      navigate(getDashboardPath(refreshed?.role || payload.role), { replace: true });
    } catch (error) {
      devAuthError('Complete profile failed.', error);
      notify(mapFirebaseError(error), 'error');
    } finally {
      setSaving(false);
    }
  };
  const lockedRole = normalizeRole(userProfile?.role || 'student');

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-app-radial px-4 py-10">
      <div className="aurora-layer animate-aurora" />
      <Card className="relative z-10 w-full max-w-2xl">
        <div className="mb-6">
          <Badge tone="cyan" icon={UserRound}>Complete Profile</Badge>
          <h1 className="mt-4 text-3xl font-black text-white">
            Finish your CampusMate profile
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Your Firebase account exists. Student profiles can be completed directly.
            Teacher, CR, Coordinator, and Admin roles require an approved invite or admin-created profile.
          </p>
        </div>

        <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Input label="Role" value={lockedRole} disabled />
          {['student', 'cr'].includes(lockedRole) ? (
            <Input
              label="Roll number"
              name="rollNumber"
              value={form.rollNumber}
              onChange={handleChange}
              placeholder="254101"
              inputMode="numeric"
              pattern="[0-9]{6}"
              hint="Roll number must be exactly 6 digits."
              required
            />
          ) : null}
          {['teacher', 'coordinator', 'admin'].includes(lockedRole) ? (
            <Select label="Department" name="department" value={form.department} onChange={handleChange}>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </Select>
          ) : null}
          <Select label="Branch" name="branch" value={form.branch} onChange={handleChange}>
            {BRANCHES.map((branch) => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </Select>
          <Select label="Semester" name="semester" value={form.semester} onChange={handleChange}>
            {SEMESTERS.map((semester) => (
              <option key={semester} value={semester}>{semester}</option>
            ))}
          </Select>
          <Select label="Division" name="division" value={form.division} onChange={handleChange}>
            {DIVISIONS.map((division) => (
              <option key={division} value={division}>{division}</option>
            ))}
          </Select>
          <Button type="submit" className="sm:col-span-2" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving profile...' : 'Save and Continue'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
