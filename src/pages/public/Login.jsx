import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Github, LogIn, Mail, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { firebaseMissingMessage } from '../../firebase/config';
import { devAuthError, getDashboardPath, mapFirebaseError } from '../../utils/authUtils';

export default function Login() {
  const navigate = useNavigate();
  const { githubLogin, login, firebaseReady } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      notify('Enter your email and password.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage('Loading your dashboard...');
      const result = await login(form.email, form.password);
      if (result.profile?.repaired) {
        notify('Your Firebase account exists, but your CampusMate profile was missing. Rebuilding your profile...', 'success');
      }
      notify('Welcome back to CampusMate.', 'success');
      navigate(getDashboardPath(result.profile?.role), { replace: true });
    } catch (error) {
      devAuthError('Login failed.', error);
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
      const result = await githubLogin('student');
      notify('Signed in with GitHub.', 'success');
      navigate(
        result.profile?.profileComplete === false
          ? '/complete-profile'
          : getDashboardPath(result.profile?.role),
        { replace: true },
      );
    } catch (error) {
      devAuthError('GitHub login failed.', error);
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
        className="relative z-10 w-full max-w-md"
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
            <Badge tone="cyan" icon={Shield}>CampusMate Login</Badge>
            <h1 className="mt-4 text-3xl font-black text-white">
              Enter your dashboard
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Students, teachers, and admins are routed automatically based on their role.
            </p>
          </div>

          {!firebaseReady ? (
            <div className="mb-5 rounded-3xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              {firebaseMissingMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              icon={Mail}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="student@campusmate.app"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              <LogIn className="h-4 w-4" />
              {submitting ? 'Signing in...' : 'Login'}
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
            New here?{' '}
            <Link to="/signup" className="font-semibold text-cyan-200 hover:text-white">
              Create an account
            </Link>
          </p>
        </Card>
      </motion.div>
    </main>
  );
}
