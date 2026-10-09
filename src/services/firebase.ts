/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  auth?: Auth | null,
  shouldThrow = false
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
  };
  console.warn('Firestore Error Info:', JSON.stringify(errInfo, null, 2));
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Read configuration from environment variables
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;
const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey !== 'AIzaSyYourFirebaseApiKeyHere' &&
  projectId &&
  projectId !== 'your-app-id'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };

    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);

    const isCustomDb = Boolean(
      databaseId &&
      databaseId !== '(default)' &&
      !databaseId.startsWith('G-') &&
      !databaseId.startsWith('AIza')
    );

    try {
      db = isCustomDb
        ? initializeFirestore(app, {
            experimentalForceLongPolling: true,
            ignoreUndefinedProperties: true,
          }, databaseId)
        : initializeFirestore(app, {
            experimentalForceLongPolling: true,
            ignoreUndefinedProperties: true,
          });
    } catch {
      db = isCustomDb
        ? getFirestore(app, databaseId)
        : getFirestore(app);
    }

    storage = getStorage(app);
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

export { app, auth, db, storage };
