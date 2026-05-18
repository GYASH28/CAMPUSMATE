import { useEffect, useState } from 'react';
import { Save, Sparkles } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import MotionPage from '../../components/animations/MotionPage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BRANCHES, DEPARTMENTS, DIVISIONS, SEMESTERS } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { getRoleLabel } from '../../utils/authUtils';

export default function TeacherProfile() {
  const { profile, updateProfileInfo } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({
    name: profile?.name || '',
    department: profile?.department || DEPARTMENTS[0],
    branch: profile?.branch || BRANCHES[0],
    semester: profile?.semester || SEMESTERS[0],
    division: profile?.division || DIVISIONS[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: profile?.name || '',
      department: profile?.department || DEPARTMENTS[0],
      branch: profile?.branch || BRANCHES[0],
      semester: profile?.semester || SEMESTERS[0],
      division: profile?.division || DIVISIONS[0],
    });
  }, [profile]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      notify('Name cannot be empty.', 'error');
      return;
    }
    try {
      setSaving(true);
      await updateProfileInfo({ ...form, name: form.name.trim() });
      notify('Teacher profile updated.', 'success');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MotionPage>
      <PageHeader
        eyebrow="Teacher Profile"
        title="Your CampusMate teacher identity"
        description="Keep department and class context updated for assigned subjects and notifications."
      />

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="grid place-items-center text-center">
            <div className="grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-violet-300 via-fuchsia-500 to-cyan-400 text-5xl font-black shadow-violet">
              {profile?.name?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <h3 className="mt-5 text-2xl font-black text-white">{profile?.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{profile?.email}</p>
            <div className="mt-4">
              <Badge tone="violet" icon={Sparkles}>CampusMate teacher</Badge>
            </div>
          </div>
          <dl className="mt-8 space-y-3 text-sm">
            {[
              ['Role', getRoleLabel(profile?.role)],
              ['Department', profile?.department],
              ['Branch', profile?.branch],
              ['Semester', profile?.semester],
              ['Division', profile?.division],
              ['Account created', formatDate(profile?.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <dt className="text-slate-400">{label}</dt>
                <dd className="text-right font-semibold capitalize text-white">{value || 'Not set'}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Input className="sm:col-span-2" label="Name" name="name" value={form.name} onChange={handleChange} required />
            <Input label="Email" value={profile?.email || ''} disabled />
            <Input label="Role" value={getRoleLabel(profile?.role)} disabled />
            <Select label="Department" name="department" value={form.department} onChange={handleChange}>
              {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
            </Select>
            <Select label="Branch" name="branch" value={form.branch} onChange={handleChange}>
              {BRANCHES.map((branch) => <option key={branch}>{branch}</option>)}
            </Select>
            <Select label="Semester" name="semester" value={form.semester} onChange={handleChange}>
              {SEMESTERS.map((semester) => <option key={semester}>{semester}</option>)}
            </Select>
            <Select label="Division" name="division" value={form.division} onChange={handleChange}>
              {DIVISIONS.map((division) => <option key={division}>{division}</option>)}
            </Select>
            <Button type="submit" disabled={saving} className="sm:col-span-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </Card>
      </div>
    </MotionPage>
  );
}
