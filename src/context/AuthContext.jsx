import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseReady } from '../firebase/config';
import { loginUser, loginWithGithub, logoutUser, registerUser } from '../firebase/auth';
import { ensureUserProfile, getUserProfile, updateUserProfile } from '../firebase/firestore';
import { devAuthError, devAuthLog, mapFirebaseError } from '../utils/authUtils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!auth) {
      setAuthError('Firebase configuration is incomplete.');
      setLoading(false);
      return () => {};
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setAuthError('');
      setUser(currentUser);
      devAuthLog('Auth state changed:', currentUser?.uid || 'signed out');

      try {
        if (currentUser) {
          const provider = currentUser.providerData?.[0]?.providerId?.includes('github')
            ? 'github'
            : 'password';
          const storedProfile = await ensureUserProfile(currentUser, {
            provider,
            profileComplete: provider !== 'github',
          });
          devAuthLog('Profile fetch success:', currentUser.uid, storedProfile?.role);
          setProfile(storedProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        devAuthError('Profile fetch failed.', error);
        setAuthError(mapFirebaseError(error));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signup = useCallback(async (payload) => {
    const result = await registerUser(payload);
    setUser(result.user);
    setProfile(result.profile);
    return result;
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await loginUser(email, password);
    setUser(result.user);
    setProfile(result.profile);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  }, []);

  const githubLogin = useCallback(async () => {
    const result = await loginWithGithub();
    setUser(result.user);
    setProfile(result.profile);
    return result;
  }, []);

  const updateProfileInfo = useCallback(
    async (updates) => {
      if (!user) return;
      await updateUserProfile(user.uid, updates);
      setProfile((current) => ({ ...current, ...updates }));
    },
    [user],
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    const storedProfile = await getUserProfile(user.uid);
    setProfile(storedProfile);
    return storedProfile;
  }, [user]);

  const value = useMemo(
    () => ({
      currentUser: user,
      userProfile: profile,
      user,
      profile,
      loading,
      authError,
      firebaseReady,
      signup,
      login,
      logout,
      githubLogin,
      updateProfileInfo,
      refreshProfile,
    }),
    [user, profile, loading, authError, signup, login, logout, githubLogin, updateProfileInfo, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
