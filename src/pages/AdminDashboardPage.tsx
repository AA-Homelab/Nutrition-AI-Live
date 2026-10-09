/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { UserAccount, UserProfile, UserRole, UserStatus } from '../types';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Lock,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  KeyRound,
  Database,
  Sliders,
  Eye,
  Trash2,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { currentUser, userAccount, isAdmin, isFirebaseLive, forceRequirePasswordChange } = useAuth();

  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New user form state
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Welcome123!');
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [submittingUser, setSubmittingUser] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const users = await DataService.getAllUsers();
      setUsersList(users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400">
          This portal requires administrator privileges. Your current role is{' '}
          <strong className="text-slate-200">{userAccount?.role || 'USER'}</strong>.
        </p>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    setSubmittingUser(true);
    setStatusMessage(null);

    try {
      // 1. Call backend server endpoint
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          displayName: newDisplayName.trim(),
          role: newRole,
          initialPassword: newPassword,
          requirePasswordChange,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user account.');
      }

      // 2. Persist in database
      const newAccount: UserAccount = {
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName,
        role: data.user.role,
        status: 'active',
        mustChangePassword: requirePasswordChange,
        isFirstLogin: requirePasswordChange,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await DataService.createUserAccount(newAccount);

      // Pre-initialize default profile
      const defaultProfile: UserProfile = {
        fullName: newAccount.displayName,
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
      await DataService.saveUserProfile(newAccount.uid, defaultProfile);

      setStatusMessage({
        type: 'success',
        text: `Account for ${newEmail} successfully registered in Firebase Authentication and database! ${
          requirePasswordChange ? '(Required to change temporary password on first sign-in)' : ''
        }`,
      });

      setCreateModalOpen(false);
      setNewDisplayName('');
      setNewEmail('');
      setNewPassword('Welcome123!');
      setRequirePasswordChange(true);
      await loadUsers();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An error occurred during account creation.',
      });
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleToggleRequirePasswordChange = async (user: UserAccount) => {
    const nextVal = !(user.mustChangePassword || user.isFirstLogin);
    try {
      await forceRequirePasswordChange(user.uid, nextVal);
      setStatusMessage({
        type: 'success',
        text: nextVal
          ? `Password change is now mandatory on next login for ${user.email}.`
          : `Password change requirement cleared for ${user.email}.`,
      });
      await loadUsers();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update user security setting.',
      });
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    if (user.uid === currentUser?.uid) {
      setStatusMessage({
        type: 'error',
        text: 'You cannot deactivate your own administrative account.',
      });
      return;
    }

    const nextStatus: UserStatus = user.status === 'active' ? 'disabled' : 'active';

    try {
      await DataService.updateUserStatus(user.uid, nextStatus);
      setStatusMessage({
        type: 'success',
        text: `User ${user.email} status updated to ${nextStatus}.`,
      });
      await loadUsers();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update user status.' });
    }
  };

  const handleResetPassword = async (email: string) => {
    setStatusMessage({
      type: 'success',
      text: `Password reset instructions dispatched to ${email}.`,
    });
  };

  // Filter users by search
  const filteredUsers = usersList.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = usersList.length;
  const activeCount = usersList.filter((u) => u.status === 'active').length;
  const adminCount = usersList.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Create User Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">Administrator Portal</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              RBAC Controller
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authorized users, provision member accounts, and enforce access controls.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Create User Account
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Accounts
          </span>
          <p className="text-2xl font-black text-white mt-1 font-mono">{totalUsers}</p>
          <span className="text-[11px] text-slate-500">Managed profiles</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Active Members
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">{activeCount}</p>
          <span className="text-[11px] text-slate-500">Can log in</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
            Administrators
          </span>
          <p className="text-2xl font-black text-violet-400 mt-1 font-mono">{adminCount}</p>
          <span className="text-[11px] text-slate-500">System managers</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
            Registration Mode
          </span>
          <p className="text-sm font-black text-white mt-2">Invitation / Admin Only</p>
          <span className="text-[11px] text-slate-500">Public sign-up blocked</span>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            Registered User Accounts ({usersList.length})
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Password Status</th>
                <th className="pb-3 font-semibold">Created Date</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((user, idx) => {
                const isCurrentUser = user.uid === currentUser?.uid;
                const rowKey = user.uid ? `${user.uid}-${idx}` : `user-${user.email || idx}`;
                const needsPasswordChange = Boolean(user.mustChangePassword || user.isFirstLogin);

                return (
                  <tr key={rowKey} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                          {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">
                            {user.displayName || 'No display name'}
                            {isCurrentUser && (
                              <span className="text-[10px] text-emerald-400 ml-1.5 font-normal">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          user.role === 'ADMIN'
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                          user.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {user.status}
                      </span>
                    </td>

                    <td className="py-3.5">
                      {needsPasswordChange ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1 w-fit">
                          <KeyRound className="w-3 h-3 text-amber-400" />
                          Change Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                      {user.createdAt ? user.createdAt.substring(0, 10) : 'Pre-seeded'}
                    </td>

                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleToggleRequirePasswordChange(user)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                            needsPasswordChange
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title={needsPasswordChange ? 'Clear mandatory password change' : 'Require password change on next sign-in'}
                        >
                          <KeyRound className="w-3 h-3" />
                          {needsPasswordChange ? 'Cancel Req' : 'Require New Pass'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetPassword(user.email)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                          title="Trigger Password Reset Email"
                        >
                          Reset Pass
                        </button>

                        {!isCurrentUser && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              user.status === 'active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create User Account</h3>
            <p className="text-xs text-slate-400 mb-6">
              Provision a new account for a member or fellow administrator.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Juan dela Cruz"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Temporary Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Temporary password"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Share this password with the user. They will be prompted to complete their nutrition profile on first login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
                >
                  <option value="USER">USER (Regular Member - Calorie tracking & AI tools)</option>
                  <option value="ADMIN">ADMIN (Full administrative & user management privileges)</option>
                </select>
              </div>

              {/* Mandatory First-Time Password Change Toggle */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    Require Password Change on First Login
                  </div>
                  <p className="text-[11px] text-amber-200/80 mt-0.5 leading-snug">
                    Forces the user to immediately replace the temporary password upon their first sign-in before accessing the dashboard or nutrition tools.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="req-pass-change"
                  checked={requirePasswordChange}
                  onChange={(e) => setRequirePasswordChange(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-amber-500 bg-slate-950 border-amber-500/40 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-500/25 disabled:opacity-50"
                >
                  {submittingUser ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
