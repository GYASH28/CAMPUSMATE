import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Github, Mail, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BRANCHES, DEFAULT_PROFILE, DIVISIONS, SEMESTERS } from '../../utils/constants';
import { firebaseMissingMessage } from '../../firebase/config';
import {
  devAuthError,
  getDashboardPath,
  mapFirebaseError,
  validateRollNumber,
} from '../../utils/authUtils';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  rollNumber: '',
  ...DEFAULT_PROFILE,
};

export default function Signup() {
  const navigate = useNavigate();
  const { githubLogin, signup, firebaseReady } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState(initialForm);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Enter your full name.';
    if (!form.email.trim()) return 'Enter your email address.';
    if (!inviteCode.trim() && !validateRollNumber(form.rollNumber)) {
      return 'Roll number must be exactly 6 digits.';
    }
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      notify(validation, 'error');
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(inviteCode.trim() ? 'Checking invite code...' : 'Creating your student profile...');
      const result = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'student',
        branch: form.branch,
        semester: form.semester,
        division: form.division,
        rollNumber: form.rollNumber.trim(),
        inviteCode: showInvite ? inviteCode.trim() : '',
      });
      notify('Your CampusMate account is ready.', 'success');
      setStatusMessage('Redirecting to your workspace...');
      navigate(getDashboardPath(result.profile.role), { replace: true });
    } catch (error) {
      devAuthError('Signup failed.', error);
      notify(mapFirebaseError(error), 'error');
    } finally {
      setSubmitting(false);
      setStatusMessage('');
    }
  };

  const handleGithub = async () => {
    try {
      setSubmitting(true);
      setStatusMessage('Redirecting to your workspace...');
      const result = await githubLogin();
      notify('Signed in with GitHub.', 'success');
      navigate(
        result.profile?.profileComplete === false
          ? '/complete-profile'
          : getDashboardPath(result.profile?.role),
        { replace: true },
      );
    } catch (error) {
      devAuthError('GitHub signup failed.', error);
      notify(mapFirebaseError(error), 'error');
    } finally {
      setSubmitting(false);
      setStatusMessage('');
    }
  };

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-app-radial px-4 py-10">
      <div className="aurora-layer animate-aurora" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to landing
        </Link>
        <Card>
          <div className="mb-6">
            <Badge tone="cyan" icon={UserPlus}>Get Started</Badge>
            <h1 className="mt-4 text-3xl font-black text-white">
              Create your CampusMate profile
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Student accounts can be created directly. Teacher, CR, Coordinator, and Admin roles require approval.
            </p>
          </div>

          {!firebaseReady ? (
            <div className="mb-5 rounded-3xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              {firebaseMissingMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              label="Full name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              autoComplete="name"
              required
            />
            <Input
              className="sm:col-span-2"
              label="Email"
              icon={Mail}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm password"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
            <Input
              label="Roll number"
              name="rollNumber"
              value={form.rollNumber}
              onChange={handleChange}
              placeholder="254101"
              inputMode="numeric"
              pattern="[0-9]{6}"
              hint="Student roll number must be exactly 6 digits."
              required={!inviteCode.trim()}
            />
            <Select label="Branch" name="branch" value={form.branch} onChange={handleChange}>
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </Select>
            <Select label="Semester" name="semester" value={form.semester} onChange={handleChange}>
              {SEMESTERS.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </Select>
            <Select label="Division" name="division" value={form.division} onChange={handleChange}>
              {DIVISIONS.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </Select>
            <div className="sm:col-span-2">
              {showInvite ? (
                <Input
                  label="Invite code"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                  placeholder="CM-TEA-123456"
                  hint="Only approved CR, teacher, coordinator, or admin invite codes can unlock elevated access."
                />
              ) : (
                <button
                  type="button"
                  className="text-sm font-semibold text-cyan-200 transition hover:text-white"
                  onClick={() => setShowInvite(true)}
                >
                  Have an invite code?
                </button>
              )}
            </div>
            <Button type="submit" className="sm:col-span-2" disabled={submitting}>
              <UserPlus className="h-4 w-4" />
              {submitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          {statusMessage ? (
            <p className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100">
              {statusMessage}
            </p>
          ) : null}
          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={submitting}
            onClick={handleGithub}
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </Button>
          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cyan-200 hover:text-white">
              Login
            </Link>
          </p>
        </Card>
      </motion.div>
    </main>
  );
}
