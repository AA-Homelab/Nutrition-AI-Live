/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Flame,
  Check,
  X,
} from 'lucide-react';

export const ForceChangePasswordPage: React.FC = () => {
  const { currentUser, userAccount, changePassword, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength calculations
  const hasMinLength = newPassword.length >= 6;
  const hasLetters = /[a-zA-Z]/.test(newPassword);
  const hasNumbers = /[0-9]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = !currentPassword || newPassword !== currentPassword;

  const strengthScore = [hasMinLength, hasLetters, hasNumbers, hasSpecial].filter(Boolean).length;
  const getStrengthLabel = () => {
    if (newPassword.length === 0) return { label: 'Empty', color: 'bg-slate-700', text: 'text-slate-500' };
    if (strengthScore <= 1) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (strengthScore === 2 || strengthScore === 3) return { label: 'Good', color: 'bg-amber-500', text: 'text-amber-400' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };
  const strengthInfo = getStrengthLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match. Please verify your entries.');
      return;
    }

    if (currentPassword && newPassword === currentPassword) {
      setErrorMessage('Your new password must be different from your temporary password.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await changePassword(newPassword, currentPassword || undefined);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update password. Please check your credentials.');
        setSubmitting(false);
        return;
      }

      setSuccessMessage('Password changed successfully! Setting up your workspace...');
      // The state update in AuthContext triggers App.tsx to transition automatically
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while updating your password.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand & Badge Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 shadow-xl shadow-amber-500/20 mb-3">
            <KeyRound className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-wide uppercase mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            First-Time Login Security Required
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Create Your Personal Password
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Welcome to NutriTrack AI! Since this is your first time logging in, you must replace your initial temporary password with a secure personal password.
          </p>
        </div>

        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              {userAccount?.displayName?.charAt(0) || userAccount?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                {userAccount?.displayName || 'Member Account'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {currentUser?.email || userAccount?.email}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {userAccount?.role || 'USER'}
          </span>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current / Temporary Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Temporary Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 font-mono placeholder:font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                The initial password provided by your administrator (e.g. Welcome123!)
              </p>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Secure Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono placeholder:font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-medium">Password Strength:</span>
                    <span className={`font-bold uppercase ${strengthInfo.text}`}>
                      {strengthInfo.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full flex-1 rounded-full transition-all ${
                        strengthScore >= 1 ? strengthInfo.color : 'bg-slate-800'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all ${
                        strengthScore >= 2 ? strengthInfo.color : 'bg-slate-800'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all ${
                        strengthScore >= 3 ? strengthInfo.color : 'bg-slate-800'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all ${
                        strengthScore >= 4 ? strengthInfo.color : 'bg-slate-800'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your new password"
                  className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border rounded-xl text-white text-xs focus:outline-none font-mono placeholder:font-sans ${
                    confirmPassword && !passwordsMatch
                      ? 'border-rose-500 focus:border-rose-500'
                      : confirmPassword && passwordsMatch
                      ? 'border-emerald-500 focus:border-emerald-500'
                      : 'border-slate-700 focus:border-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] mt-1">
                  {passwordsMatch ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <X className="w-3 h-3" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Password requirements list */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0 ml-0.5 mr-1" />
                )}
                <span className={hasMinLength ? 'text-slate-200 font-medium' : ''}>
                  At least 6 characters
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasLetters && hasNumbers ? (
                  <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0 ml-0.5 mr-1" />
                )}
                <span className={hasLetters && hasNumbers ? 'text-slate-200 font-medium' : ''}>
                  Contains both letters and numbers
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isDifferentFromCurrent && currentPassword.length > 0 && newPassword.length > 0 ? (
                  <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0 ml-0.5 mr-1" />
                )}
                <span
                  className={
                    isDifferentFromCurrent && currentPassword.length > 0 && newPassword.length > 0
                      ? 'text-slate-200 font-medium'
                      : ''
                  }
                >
                  Different from temporary password
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !hasMinLength || !passwordsMatch}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Saving New Password...
                </>
              ) : (
                <>
                  Set New Password & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sign Out link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out of this session
          </button>
        </div>
      </div>
    </div>
  );
};
