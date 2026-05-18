import {
  createUserWithEmailAndPassword,
  deleteUser,
  GithubAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseMissingMessage } from './config';
import {
  createUserProfile,
  ensureUserProfile,
  getAvailableInviteCode,
  markInviteCodeUsed,
} from './firestore';
import { DEFAULT_PROFILE } from '../utils/constants';
import { devAuthError } from '../utils/authUtils';

function requireAuth() {
  if (!auth) throw new Error(firebaseMissingMessage);
  return auth;
}

export async function registerUser({
  name,
  email,
  password,
  branch,
  semester,
  division,
  rollNumber = '',
  inviteCode = '',
}) {
  const instance = requireAuth();
  const credential = await createUserWithEmailAndPassword(instance, email, password);

  try {
    const invite = inviteCode ? await getAvailableInviteCode(inviteCode) : null;
    if (invite?.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error('This invite code is assigned to a different email address.');
    }

    const secureRole = invite?.role || 'student';
    await updateProfile(credential.user, { displayName: name });
    const profile = await createUserProfile(credential.user.uid, {
      name: invite?.name || name,
      email,
      role: secureRole,
      branch: invite?.branch || branch,
      semester: invite?.semester || semester,
      division: invite?.division || division,
      rollNumber: invite?.rollNumber || rollNumber,
      department: invite?.department || DEFAULT_PROFILE.department,
      assignedSubjects: invite?.assignedSubjects || [],
      isCR: secureRole === 'cr',
      provider: 'password',
      status: invite?.status || 'active',
      profileComplete: true,
    });
    if (invite?.id) {
      await markInviteCodeUsed(invite.id, credential.user.uid);
    }

    return { user: credential.user, profile };
  } catch (error) {
    devAuthError('Firestore profile creation failed after signup.', error);
    await deleteUser(credential.user).catch((deleteError) => {
      devAuthError('Could not delete partially-created auth user.', deleteError);
    });
    throw error;
  }
}

export async function loginUser(email, password) {
  const instance = requireAuth();
  const credential = await signInWithEmailAndPassword(instance, email, password);
  const profile = await ensureUserProfile(credential.user, {
    provider: 'password',
    profileComplete: true,
  });
  return { user: credential.user, profile };
}

export async function loginWithGithub() {
  const instance = requireAuth();
  const provider = new GithubAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(instance, provider);
  const profile = await ensureUserProfile(credential.user, {
    role: 'student',
    provider: 'github',
    profileComplete: false,
    defaults: {
      name: credential.user.displayName || 'CampusMate User',
      email: credential.user.email || '',
      role: 'student',
      ...DEFAULT_PROFILE,
    },
  });

  return { user: credential.user, profile };
}

export async function logoutUser() {
  const instance = requireAuth();
  await signOut(instance);
}
