export function normalizeRole(role) {
  const normalized = String(role || 'student').trim().toLowerCase();
  return ['student', 'cr', 'teacher', 'coordinator', 'admin'].includes(normalized)
    ? normalized
    : 'student';
}

export function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

export const RESERVED_ADMIN_EMAILS = [
  'ultimatebracegaming@gmail.com',
];

export function isReservedAdminEmail(email) {
  return RESERVED_ADMIN_EMAILS.includes(normalizeEmail(email));
}

export function enforceReservedAdminProfile(profile = {}) {
  if (!isReservedAdminEmail(profile.email)) return profile;

  return {
    ...profile,
    role: 'admin',
    status: 'active',
    isCR: false,
    profileComplete: true,
  };
}

export function getDashboardPath(role) {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return '/admin/dashboard';
  if (normalized === 'coordinator') return '/coordinator/dashboard';
  if (normalized === 'teacher') return '/teacher/dashboard';
  if (normalized === 'cr') return '/cr/dashboard';
  return '/student/dashboard';
}

export const ROLE_LABELS = {
  student: 'Student',
  cr: 'Class Representative',
  teacher: 'Teacher',
  coordinator: 'Coordinator / HOD',
  admin: 'Admin',
};

export const ROLE_LEVELS = {
  student: 1,
  cr: 2,
  teacher: 3,
  coordinator: 4,
  admin: 5,
};

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] || ROLE_LABELS.student;
}

export function canAssignRole(assignerRole, targetRole) {
  const assigner = normalizeRole(assignerRole);
  const target = normalizeRole(targetRole);

  if (assigner === 'admin') {
    return ['student', 'cr', 'teacher', 'coordinator'].includes(target);
  }

  if (assigner === 'coordinator') {
    return ['student', 'cr', 'teacher'].includes(target);
  }

  return false;
}

export function canTakeAttendance(role) {
  return ['admin', 'coordinator', 'teacher', 'cr'].includes(normalizeRole(role));
}

export function validateRollNumber(rollNumber = '') {
  return /^[0-9]{6}$/.test(String(rollNumber).trim());
}

export function isFirestoreOffline(error) {
  const code = error?.code || '';
  const message = String(error?.message || '').toLowerCase();
  return (
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    message.includes('client is offline') ||
    message.includes('offline') ||
    message.includes('unreachable')
  );
}

export function mapFirebaseError(error) {
  const code = error?.code || '';
  const message = String(error?.message || '');

  if (code === 'auth/configuration-not-found') {
    return 'Firebase Authentication is not configured.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered.';
  }
  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
    return 'No account found or the password is incorrect.';
  }
  if (code === 'auth/wrong-password') {
    return 'Incorrect password.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check internet connection.';
  }
  if (code === 'permission-denied') {
    return 'Firestore permission denied. Check Firestore rules.';
  }
  if (isFirestoreOffline(error)) {
    return 'Firestore is unreachable. Check Firestore setup and internet.';
  }
  if (code === 'campusmate/missing-profile' || message.includes('Missing profile')) {
    return 'Your CampusMate profile is missing. Rebuilding profile...';
  }
  if (message.includes('Firebase configuration is incomplete')) {
    return 'Firebase configuration is incomplete.';
  }

  return message || 'Something went wrong. Please try again.';
}

export function devAuthLog(...args) {
  if (import.meta.env.DEV) {
    console.info('[CampusMate auth]', ...args);
  }
}

export function devAuthError(...args) {
  if (import.meta.env.DEV) {
    console.error('[CampusMate auth]', ...args);
  }
}
