/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import {
  FoodLogEntry,
  NutritionTargets,
  UserAccount,
  UserProfile,
  WeightLogEntry,
  AiChatMessage,
} from '../types';

// =============================================================================
// DEFAULT SEED DATA FOR LOCAL DEV / INSTANT PREVIEW
// =============================================================================
const DEFAULT_LOCAL_USERS: UserAccount[] = [
  {
    uid: 'admin-seed-01',
    email: 'admin@nutritrack.ai',
    displayName: 'System Admin',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    uid: 'user-seed-02',
    email: 'user@nutritrack.ai',
    displayName: 'Maria Santos',
    role: 'USER',
    status: 'active',
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
];

const DEFAULT_USER_PROFILE: UserProfile = {
  fullName: 'Maria Santos',
  age: 28,
  sex: 'female',
  heightCm: 162,
  weightKg: 62,
  targetWeightKg: 57,
  activityLevel: 'moderate',
  exerciseSessionsPerWeek: 4,
  goal: 'lose_weight_standard',
  dietaryPreferences: ['Filipino/Asian', 'Balanced Whole Foods'],
  allergies: [],
  preferredCuisine: 'Filipino & Pan-Asian',
  isProfileComplete: true,
  updatedAt: new Date().toISOString(),
};

const DEFAULT_NUTRITION_TARGETS: NutritionTargets = {
  bmr: 1332,
  tdee: 2065,
  dailyCalories: 1565,
  proteinGrams: 124,
  carbohydrateGrams: 168,
  fatGrams: 49,
  fiberGrams: 25,
  proteinPercent: 32,
  carbsPercent: 43,
  fatPercent: 25,
  isLowCalorieWarning: false,
  updatedAt: new Date().toISOString(),
};

function getLocalStore<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(`nutritrack_${key}`);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`nutritrack_${key}`, JSON.stringify(value));
    window.dispatchEvent(new Event(`nutritrack_event_${key}`));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// =============================================================================
// DATA SERVICE IMPLEMENTATION
// =============================================================================
export const DataService = {
  /**
   * 1. USERS & ACCOUNTS (Admin)
   */
  async getAllUsers(): Promise<UserAccount[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const users = snap.docs.map((d) => {
          const data = d.data() as Partial<UserAccount>;
          return {
            ...data,
            uid: data.uid || d.id,
          } as UserAccount;
        });
        if (users.length > 0) {
          setLocalStore('users', users);
          return users;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'users', auth);
      }
    }
    return getLocalStore<UserAccount[]>('users', DEFAULT_LOCAL_USERS);
  },

  async getUserAccount(userId: string): Promise<UserAccount | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) {
          const acc = snap.data() as UserAccount;
          const localUsers = getLocalStore<UserAccount[]>('users', DEFAULT_LOCAL_USERS);
          if (!localUsers.some((u) => u.uid === acc.uid)) {
            setLocalStore('users', [...localUsers, acc]);
          }
          return acc;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${userId}`, auth);
      }
    }

    const localUsers = getLocalStore<UserAccount[]>('users', DEFAULT_LOCAL_USERS);
    const existing = localUsers.find((u) => u.uid === userId);
    if (existing) return existing;

    // If user is authenticated in Firebase Auth, synthesize an active account
    if (auth?.currentUser && auth.currentUser.uid === userId) {
      const email = auth.currentUser.email || '';
      const isSystemAdmin = Boolean(
        email === 'arnoldarceno2525@gmail.com' ||
        email === 'arnold.homelab@gmail.com' ||
        email.toLowerCase().includes('admin')
      );
      const synthesized: UserAccount = {
        uid: userId,
        email: email || 'user@nutritrack.ai',
        displayName: auth.currentUser.displayName || (email ? email.split('@')[0] : 'Member'),
        role: isSystemAdmin ? 'ADMIN' : 'USER',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setLocalStore('users', [...localUsers, synthesized]);

      // Attempt background save to Firestore if available
      if (isFirebaseConfigured && db) {
        setDoc(doc(db, 'users', userId), synthesized).catch(() => {});
        if (isSystemAdmin) {
          setDoc(doc(db, 'admins', userId), {
            email,
            assignedAt: new Date().toISOString(),
          }).catch(() => {});
        }
      }

      return synthesized;
    }

    return null;
  },

  async createUserAccount(account: UserAccount): Promise<void> {
    const users = getLocalStore<UserAccount[]>('users', DEFAULT_LOCAL_USERS);
    const filtered = users.filter((u) => u.uid !== account.uid);
    filtered.push(account);
    setLocalStore('users', filtered);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', account.uid), account);
        if (account.role === 'ADMIN') {
          await setDoc(doc(db, 'admins', account.uid), {
            email: account.email,
            assignedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${account.uid}`, auth);
      }
    }
  },

  async updateUserAccount(userId: string, partial: Partial<UserAccount>): Promise<void> {
    const users = getLocalStore<UserAccount[]>('users', DEFAULT_LOCAL_USERS);
    const updated = users.map((u) =>
      u.uid === userId ? { ...u, ...partial, updatedAt: new Date().toISOString() } : u
    );
    setLocalStore('users', updated);

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          ...partial,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`, auth);
      }
    }
  },

  async updateUserStatus(userId: string, status: 'active' | 'disabled'): Promise<void> {
    return this.updateUserAccount(userId, { status });
  },

  /**
   * 2. USER PROFILE & NUTRITION TARGETS
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'users', userId, 'profile', 'main'));
        if (snap.exists()) {
          const profile = snap.data() as UserProfile;
          setLocalStore(`profile_${userId}`, profile);
          return profile;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${userId}/profile/main`, auth);
      }
    }

    const cached = getLocalStore<UserProfile | null>(`profile_${userId}`, null);
    if (cached) return cached;

    const displayName = (auth?.currentUser?.uid === userId && auth.currentUser.displayName)
      ? auth.currentUser.displayName
      : (auth?.currentUser?.email ? auth.currentUser.email.split('@')[0] : 'Member');

    return {
      ...DEFAULT_USER_PROFILE,
      fullName: displayName,
      isProfileComplete: false,
    };
  },

  async saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
    setLocalStore(`profile_${userId}`, profile);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', userId, 'profile', 'main'), profile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}/profile/main`, auth);
      }
    }
  },

  async getNutritionTargets(userId: string): Promise<NutritionTargets | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'users', userId, 'nutrition', 'targets'));
        if (snap.exists()) {
          const targets = snap.data() as NutritionTargets;
          setLocalStore(`targets_${userId}`, targets);
          return targets;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${userId}/nutrition/targets`, auth);
      }
    }

    const cached = getLocalStore<NutritionTargets | null>(`targets_${userId}`, null);
    if (cached) return cached;
    return DEFAULT_NUTRITION_TARGETS;
  },

  async saveNutritionTargets(userId: string, targets: NutritionTargets): Promise<void> {
    setLocalStore(`targets_${userId}`, targets);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', userId, 'nutrition', 'targets'), targets);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}/nutrition/targets`, auth);
      }
    }
  },

  /**
   * 3. FOOD LOGS
   */
  subscribeFoodLogs(
    userId: string,
    date: string,
    callback: (entries: FoodLogEntry[]) => void
  ): () => void {
    if (isFirebaseConfigured && db) {
      const q = query(
        collection(db, 'users', userId, 'foodLogs'),
        where('date', '==', date)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((d) => d.data() as FoodLogEntry);
          callback(items);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, `users/${userId}/foodLogs`, auth);
        }
      );
      return unsubscribe;
    }

    // Local Storage subscription
    const read = () => {
      const all = getLocalStore<FoodLogEntry[]>(`foodlogs_${userId}`, [
        {
          id: 'seed-log-1',
          userId,
          date,
          time: '08:15',
          mealType: 'breakfast',
          foodName: 'Tapsilog (Beef Tapa, Garlic Rice, Fried Egg)',
          servingSize: 1,
          unit: 'plate',
          calories: 620,
          protein: 36,
          carbohydrates: 58,
          fat: 26,
          fiber: 2,
          source: 'database',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'seed-log-2',
          userId,
          date,
          time: '12:30',
          mealType: 'lunch',
          foodName: 'Chicken Adobo with Steamed Rice',
          servingSize: 1,
          unit: 'serving',
          calories: 525,
          protein: 36,
          carbohydrates: 51,
          fat: 18,
          fiber: 1,
          source: 'ai_photo',
          aiConfidence: 0.92,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]);
      const filtered = all.filter((l) => l.date === date);
      callback(filtered);
    };

    read();
    const eventName = `nutritrack_event_foodlogs_${userId}`;
    window.addEventListener(eventName, read);
    return () => window.removeEventListener(eventName, read);
  },

  async getAllFoodLogs(userId: string): Promise<FoodLogEntry[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'users', userId, 'foodLogs'));
        return snap.docs.map((d) => d.data() as FoodLogEntry);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `users/${userId}/foodLogs`, auth);
      }
    }
    return getLocalStore<FoodLogEntry[]>(`foodlogs_${userId}`, []);
  },

  async addFoodLog(entry: FoodLogEntry): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', entry.userId, 'foodLogs', entry.id), entry);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${entry.userId}/foodLogs/${entry.id}`, auth);
      }
    } else {
      const all = getLocalStore<FoodLogEntry[]>(`foodlogs_${entry.userId}`, []);
      all.push(entry);
      setLocalStore(`foodlogs_${entry.userId}`, all);
    }
  },

  async updateFoodLog(entry: FoodLogEntry): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', entry.userId, 'foodLogs', entry.id), entry);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${entry.userId}/foodLogs/${entry.id}`, auth);
      }
    } else {
      const all = getLocalStore<FoodLogEntry[]>(`foodlogs_${entry.userId}`, []);
      const updated = all.map((item) => (item.id === entry.id ? entry : item));
      setLocalStore(`foodlogs_${entry.userId}`, updated);
    }
  },

  async deleteFoodLog(userId: string, foodLogId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'foodLogs', foodLogId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}/foodLogs/${foodLogId}`, auth);
      }
    } else {
      const all = getLocalStore<FoodLogEntry[]>(`foodlogs_${userId}`, []);
      const filtered = all.filter((item) => item.id !== foodLogId);
      setLocalStore(`foodlogs_${userId}`, filtered);
    }
  },

  /**
   * 4. WEIGHT TRACKING
   */
  async getWeightLogs(userId: string): Promise<WeightLogEntry[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(
          query(collection(db, 'users', userId, 'weightLogs'), orderBy('date', 'asc'))
        );
        return snap.docs.map((d) => d.data() as WeightLogEntry);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `users/${userId}/weightLogs`, auth);
      }
    }

    const today = new Date();
    const mockWeightLogs: WeightLogEntry[] = [
      { id: 'w1', userId, date: new Date(today.getTime() - 21 * 86400000).toISOString().split('T')[0], weightKg: 64.5, notes: 'Starting weigh-in', createdAt: new Date().toISOString() },
      { id: 'w2', userId, date: new Date(today.getTime() - 14 * 86400000).toISOString().split('T')[0], weightKg: 63.8, notes: 'End of week 1', createdAt: new Date().toISOString() },
      { id: 'w3', userId, date: new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0], weightKg: 62.9, notes: 'Feeling energized', createdAt: new Date().toISOString() },
      { id: 'w4', userId, date: today.toISOString().split('T')[0], weightKg: 62.0, notes: 'Morning weigh-in', createdAt: new Date().toISOString() },
    ];
    return getLocalStore<WeightLogEntry[]>(`weight_${userId}`, mockWeightLogs);
  },

  async addWeightLog(entry: WeightLogEntry): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', entry.userId, 'weightLogs', entry.id), entry);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${entry.userId}/weightLogs/${entry.id}`, auth);
      }
    } else {
      const all = getLocalStore<WeightLogEntry[]>(`weight_${entry.userId}`, []);
      const existingIdx = all.findIndex((w) => w.date === entry.date);
      if (existingIdx >= 0) {
        all[existingIdx] = entry;
      } else {
        all.push(entry);
      }
      all.sort((a, b) => a.date.localeCompare(b.date));
      setLocalStore(`weight_${entry.userId}`, all);
    }
  },

  async deleteWeightLog(userId: string, logId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'weightLogs', logId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}/weightLogs/${logId}`, auth);
      }
    } else {
      const all = getLocalStore<WeightLogEntry[]>(`weight_${userId}`, []);
      const filtered = all.filter((w) => w.id !== logId);
      setLocalStore(`weight_${userId}`, filtered);
    }
  },

  /**
   * 5. AI CHAT HISTORY
   */
  async getChatHistory(userId: string): Promise<AiChatMessage[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'users', userId, 'aiChats', 'history'));
        if (snap.exists()) {
          return (snap.data()?.messages as AiChatMessage[]) || [];
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${userId}/aiChats/history`, auth);
      }
    }
    const raw = localStorage.getItem(`nutritrack_chats_${userId}`);
    if (raw !== null) {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'msg-seed-1',
        role: 'assistant',
        content: `Mabuhay! I am your NutriTrack AI Nutrition Assistant. I'm here to help you optimize your meals, hit your macros, and answer questions like "What can I eat with 600 calories left?" or "Suggest a high-protein Filipino dinner." How can I help you today?`,
        timestamp: new Date().toISOString(),
      },
    ];
  },

  async saveChatHistory(userId: string, messages: AiChatMessage[]): Promise<void> {
    setLocalStore(`chats_${userId}`, messages);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', userId, 'aiChats', 'history'), {
          messages,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}/aiChats/history`, auth);
      }
    }
  },
};
