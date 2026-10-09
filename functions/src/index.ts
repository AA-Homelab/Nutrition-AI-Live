/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

/**
 * Callable Function: adminCreateUser
 * Only authenticated administrators can invoke this function to provision new accounts.
 */
export const adminCreateUser = functions.https.onCall(async (data, context) => {
  // 1. Verify caller authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in as an administrator to create new accounts.'
    );
  }

  // 2. Verify caller role from Firestore or token
  const callerUid = context.auth.uid;
  const callerDoc = await db.collection('users').doc(callerUid).get();
  const callerRole = callerDoc.data()?.role;

  if (callerRole !== 'ADMIN') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators have permission to create user accounts.'
    );
  }

  const { email, password, displayName, role = 'USER' } = data;

  if (!email || !password || !displayName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email, password, and displayName are all required fields.'
    );
  }

  try {
    // 3. Create user record in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    const targetRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    // 4. Store user document in Cloud Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({
      uid: userRecord.uid,
      email,
      displayName,
      role: targetRole,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If role is ADMIN, also add entry to admins collection
    if (targetRole === 'ADMIN') {
      await db.collection('admins').doc(userRecord.uid).set({
        email,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: targetRole,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create user');
  }
});

/**
 * Callable Function: adminToggleUserStatus
 * Enables or disables a user account in Firebase Auth and Firestore.
 */
export const adminToggleUserStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (callerDoc.data()?.role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Administrator role required.');
  }

  const { targetUid, disabled } = data;
  if (!targetUid || typeof disabled !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid and disabled are required.');
  }

  // Prevent disabling self
  if (targetUid === callerUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot disable your own administrator account.');
  }

  try {
    await auth.updateUser(targetUid, { disabled });
    await db.collection('users').doc(targetUid).update({
      status: disabled ? 'disabled' : 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, targetUid, status: disabled ? 'disabled' : 'active' };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update user status.');
  }
});
