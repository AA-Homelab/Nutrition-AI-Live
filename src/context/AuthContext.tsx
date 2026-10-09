/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { DataService } from '../services/dataService';
import { NutritionTargets, UserAccount, UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | { uid: string; email: string; displayName?: string } | null;
  userAccount: UserAccount | null;
  userProfile: UserProfile | null;
  nutritionTargets: NutritionTargets | null;
  loading: boolean;
  isAdmin: boolean;
  isFirebaseLive: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  refreshProfile: () => Promise<void>;
  refreshTargets: () => Promise<void>;
  updateProfileAndTargets: (profile: UserProfile, targets: NutritionTargets) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nutritionTargets, setNutritionTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          setCurrentUser(fbUser);
          await loadUserData(fbUser.uid);
        } else {
          setCurrentUser(null);
          setUserAccount(null);
          setUserProfile(null);
          setNutritionTargets(null);
          setLoading(false);
        }
      });
      return unsubscribe;
    } else {
      // Local development / preview mode
      const savedUserUid = localStorage.getItem('nutritrack_session_uid');
      if (savedUserUid) {
        loadUserData(savedUserUid).finally(() => setLoading(false));
      } else {
        // Pre-populate with default demo user on first visit for effortless evaluation
        loadUserData('user-seed-02').finally(() => setLoading(false));
      }
    }
  }, []);

  async function loadUserData(uid: string) {
    try {
      let account = await DataService.getUserAccount(uid);
      if (!account) {
        // Fallback user account if document does not exist yet
        const email = auth?.currentUser?.email || 'user@nutritrack.ai';
        const isAdm = Boolean(
          email === 'arnoldarceno2525@gmail.com' ||
          email === 'arnold.homelab@gmail.com' ||
          email.toLowerCase().includes('admin')
        );
        account = {
          uid,
          email,
          displayName: auth?.currentUser?.displayName || (email ? email.split('@')[0] : 'Member'),
          role: isAdm ? 'ADMIN' : 'USER',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      if (account.status === 'disabled') {
        await logout();
        throw new Error('This account has been deactivated by the administrator.');
      }

      setUserAccount(account);
      setCurrentUser({
        uid: account.uid,
        email: account.email,
        displayName: account.displayName,
      });

      const profile = await DataService.getUserProfile(uid);
      const targets = await DataService.getNutritionTargets(uid);
      setUserProfile(profile);
      setNutritionTargets(targets);
    } catch (err) {
      console.warn('Notice loading user data, applying resilient session state:', err);
    } finally {
      setLoading(false);
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const account = await DataService.getUserAccount(credential.user.uid);
        if (account?.status === 'disabled') {
          await firebaseSignOut(auth);
          setLoading(false);
          return { success: false, error: 'Your account is disabled. Please contact your system administrator.' };
        }
        await loadUserData(credential.user.uid);
        return { success: true };
      } else {
        // Local mode verification
        const users = await DataService.getAllUsers();
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (!found) {
          setLoading(false);
          return {
            success: false,
            error: 'Account not found. User registration is restricted: only an administrator can create user accounts.',
          };
        }

        if (found.status === 'disabled') {
          setLoading(false);
          return {
            success: false,
            error: 'Your account has been deactivated by an administrator.',
          };
        }

        // Save local session
        localStorage.setItem('nutritrack_session_uid', found.uid);
        await loadUserData(found.uid);
        return { success: true };
      }
    } catch (error: any) {
      setLoading(false);
      let message = error.message || 'Login failed. Please check your credentials.';
      if (message.includes('auth/user-not-found') || message.includes('auth/invalid-credential')) {
        message = 'Invalid email or password. Remember: Accounts can only be created by an administrator.';
      }
      return { success: false, error: message };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const resolvedName = (displayName && displayName.trim()) || trimmedEmail.split('@')[0];

      if (!trimmedEmail) {
        setLoading(false);
        return { success: false, error: 'Email address is required.' };
      }

      if (password.length < 6) {
        setLoading(false);
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      if (isFirebaseConfigured && auth) {
        // Register in Firebase Authentication
        const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

        if (resolvedName) {
          try {
            await updateProfile(credential.user, { displayName: resolvedName });
          } catch (nameErr) {
            console.warn('Notice setting profile display name:', nameErr);
          }
        }

        const isAdm = Boolean(
          trimmedEmail === 'arnoldarceno2525@gmail.com' ||
          trimmedEmail === 'arnold.homelab@gmail.com' ||
          trimmedEmail.toLowerCase().includes('admin')
        );

        const newAccount: UserAccount = {
          uid: credential.user.uid,
          email: trimmedEmail,
          displayName: resolvedName,
          role: isAdm ? 'ADMIN' : 'USER',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Persist UserAccount in Firestore & local store
        await DataService.createUserAccount(newAccount);

        // Pre-create initial profile and default nutrition targets
        const defaultProfile: UserProfile = {
          fullName: resolvedName,
          age: 30,
          sex: 'other',
          heightCm: 170,
          weightKg: 70,
          activityLevel: 'moderate',
          exerciseSessionsPerWeek: 3,
          goal: 'maintain_weight',
          dietaryPreferences: [],
          allergies: [],
          isProfileComplete: false,
          updatedAt: new Date().toISOString(),
        };
        await DataService.saveUserProfile(credential.user.uid, defaultProfile);

        await loadUserData(credential.user.uid);
        return { success: true };
      } else {
        // Local mode sign-up
        const users = await DataService.getAllUsers();
        if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
          setLoading(false);
          return { success: false, error: 'An account with this email already exists.' };
        }

        const newUid = `user-${Date.now()}`;
        const isAdm = Boolean(
          trimmedEmail === 'arnoldarceno2525@gmail.com' ||
          trimmedEmail === 'arnold.homelab@gmail.com' ||
          trimmedEmail.toLowerCase().includes('admin')
        );

        const newAccount: UserAccount = {
          uid: newUid,
          email: trimmedEmail,
          displayName: resolvedName,
          role: isAdm ? 'ADMIN' : 'USER',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await DataService.createUserAccount(newAccount);
        localStorage.setItem('nutritrack_session_uid', newUid);
        await loadUserData(newUid);
        return { success: true };
      }
    } catch (error: any) {
      setLoading(false);
      let message = error.message || 'Failed to create account.';
      if (message.includes('auth/email-already-in-use')) {
        message = 'This email is already registered in Firebase. Please sign in or use another email.';
      } else if (message.includes('auth/weak-password')) {
        message = 'Password should be at least 6 characters.';
      } else if (message.includes('auth/invalid-email')) {
        message = 'Please provide a valid email address.';
      }
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    } else {
      localStorage.removeItem('nutritrack_session_uid');
    }
    setCurrentUser(null);
    setUserAccount(null);
    setUserProfile(null);
    setNutritionTargets(null);
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: `Password reset email sent to ${email}.` };
      } catch (err: any) {
        return { success: false, message: err.message || 'Failed to send password reset email.' };
      }
    } else {
      return {
        success: true,
        message: `Password reset link simulated for ${email}. (Connect live Firebase to dispatch real reset emails).`,
      };
    }
  };

  const refreshProfile = async () => {
    if (currentUser?.uid) {
      const p = await DataService.getUserProfile(currentUser.uid);
      setUserProfile(p);
    }
  };

  const refreshTargets = async () => {
    if (currentUser?.uid) {
      const t = await DataService.getNutritionTargets(currentUser.uid);
      setNutritionTargets(t);
    }
  };

  const updateProfileAndTargets = async (profile: UserProfile, targets: NutritionTargets) => {
    if (!currentUser?.uid) return;
    await DataService.saveUserProfile(currentUser.uid, profile);
    await DataService.saveNutritionTargets(currentUser.uid, targets);
    setUserProfile(profile);
    setNutritionTargets(targets);
  };

  const isAdmin = userAccount?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userAccount,
        userProfile,
        nutritionTargets,
        loading,
        isAdmin,
        isFirebaseLive: isFirebaseConfigured,
        login,
        signUp,
        logout,
        resetPassword,
        refreshProfile,
        refreshTargets,
        updateProfileAndTargets,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
