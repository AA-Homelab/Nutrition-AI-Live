/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateNutritionTargets } from '../services/nutritionCalculator';
import { ActivityLevel, NutritionGoal, Sex, UserProfile } from '../types';
import {
  User,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Scale,
  Dumbbell,
  Heart,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, userAccount, userProfile, nutritionTargets, updateProfileAndTargets, changePassword } = useAuth();

  const [fullName, setFullName] = useState(userProfile?.fullName || userAccount?.displayName || '');
  const [sex, setSex] = useState<Sex>(userProfile?.sex || 'female');
  const [age, setAge] = useState<number>(userProfile?.age || 28);
  const [heightCm, setHeightCm] = useState<number>(userProfile?.heightCm || 165);
  const [weightKg, setWeightKg] = useState<number>(userProfile?.weightKg || 65);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(userProfile?.targetWeightKg || 60);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(userProfile?.activityLevel || 'moderate');
  const [exerciseSessionsPerWeek, setExerciseSessionsPerWeek] = useState<number>(userProfile?.exerciseSessionsPerWeek || 4);
  const [goal, setGoal] = useState<NutritionGoal>(userProfile?.goal || 'lose_weight_standard');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(
    userProfile?.dietaryPreferences || ['Filipino/Asian Foods', 'Balanced Whole Foods']
  );
  const [allergies, setAllergies] = useState<string[]>(userProfile?.allergies || []);
  const [allergyInput, setAllergyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security / Password update state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatus(null);

    if (!newPass || newPass.length < 6) {
      setPassStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPass !== confirmPass) {
      setPassStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setPassSubmitting(true);
    try {
      const res = await changePassword(newPass, currentPass || undefined);
      if (res.success) {
        setPassStatus({ type: 'success', message: 'Password updated successfully!' });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassStatus({ type: 'error', message: res.error || 'Failed to update password.' });
      }
    } catch (err: any) {
      setPassStatus({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setPassSubmitting(false);
    }
  };

  // Synchronize when userProfile updates
  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName);
      setSex(userProfile.sex);
      setAge(userProfile.age);
      setHeightCm(userProfile.heightCm);
      setWeightKg(userProfile.weightKg);
      setTargetWeightKg(userProfile.targetWeightKg || userProfile.weightKg);
      setActivityLevel(userProfile.activityLevel);
      setExerciseSessionsPerWeek(userProfile.exerciseSessionsPerWeek);
      setGoal(userProfile.goal);
      setDietaryPreferences(userProfile.dietaryPreferences || []);
      setAllergies(userProfile.allergies || []);
    }
  }, [userProfile]);

  // Live recalculated target preview
  const liveTargets = calculateNutritionTargets({
    sex,
    age,
    heightCm,
    weightKg,
    activityLevel,
    goal,
  });

  const toggleDiet = (pref: string) => {
    if (dietaryPreferences.includes(pref)) {
      setDietaryPreferences(dietaryPreferences.filter((p) => p !== pref));
    } else {
      setDietaryPreferences([...dietaryPreferences, pref]);
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (name: string) => {
    setAllergies(allergies.filter((a) => a !== name));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const updatedProfile: UserProfile = {
        fullName: fullName || userAccount?.displayName || 'User',
        sex,
        age,
        heightCm,
        weightKg,
        targetWeightKg,
        activityLevel,
        exerciseSessionsPerWeek,
        goal,
        dietaryPreferences,
        allergies,
        preferredCuisine: 'Filipino & Asian',
        isProfileComplete: true,
        updatedAt: new Date().toISOString(),
      };

      await updateProfileAndTargets(updatedProfile, liveTargets);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white">Profile & Nutrition Engine</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your biological measurements and fine-tune your calorie and macronutrient targets.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Nutrition profile and calculated targets updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-6">
          {/* Personal Information */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Personal Stats
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Biological Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as Sex)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other / Non-binary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min={14}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min={100}
                    max={250}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={35}
                    max={300}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={35}
                    max={300}
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Activity & Goals */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              Activity & Nutrition Goal
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Activity Multiplier</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="sedentary">Sedentary (Desk job, 1.2x)</option>
                  <option value="light">Lightly Active (Workouts 1-3 days/wk, 1.375x)</option>
                  <option value="moderate">Moderately Active (Workouts 3-5 days/wk, 1.55x)</option>
                  <option value="very_active">Very Active (Workouts 6-7 days/wk, 1.725x)</option>
                  <option value="extra_active">Extra Active / Athlete (2x training/day, 1.9x)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as NutritionGoal)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="lose_weight_mild">Gradual Fat Loss (-250 kcal/day)</option>
                  <option value="lose_weight_standard">Standard Fat Loss (-500 kcal/day)</option>
                  <option value="lose_weight_rapid">Aggressive Fat Loss (-750 kcal/day)</option>
                  <option value="maintain_weight">Maintain Weight (0 kcal adjustment)</option>
                  <option value="gain_weight_lean">Lean Muscle Gain (+250 kcal/day)</option>
                  <option value="gain_weight_bulk">Mass Bulk (+500 kcal/day)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preferences and Allergies */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-400" />
              Dietary Preferences
            </h2>

            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  'Filipino/Asian Foods',
                  'High Protein',
                  'Balanced Whole Foods',
                  'Low Carb',
                  'Pescatarian',
                  'Vegetarian',
                  'Halal',
                  'Gluten-Free',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleDiet(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      dietaryPreferences.includes(item)
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Allergies</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    placeholder="e.g. Peanuts, Shellfish..."
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={addAllergy}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((all) => (
                    <span
                      key={all}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs"
                    >
                      {all}
                      <button
                        type="button"
                        onClick={() => removeAllergy(all)}
                        className="hover:text-rose-100 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Updating Engine...' : 'Save & Update Nutrition Targets'}
          </button>
        </div>

        {/* Right Column: Live Target Calculations Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-24 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              Calculated Nutrition Profile
            </h2>

            {liveTargets.isLowCalorieWarning && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{liveTargets.warningMessage}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Basal Metabolic Rate</span>
                  <p className="text-xs text-slate-500 mt-0.5">Energy at rest</p>
                </div>
                <span className="text-base font-black font-mono text-white">{liveTargets.bmr} kcal</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">TDEE (Maintenance)</span>
                  <p className="text-xs text-slate-500 mt-0.5">Total energy expenditure</p>
                </div>
                <span className="text-base font-black font-mono text-white">{liveTargets.tdee} kcal</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-emerald-400 font-bold uppercase">Daily Target</span>
                  <p className="text-xs text-emerald-300 mt-0.5 capitalize">{goal.replace(/_/g, ' ')}</p>
                </div>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {liveTargets.dailyCalories} kcal
                </span>
              </div>
            </div>

            {/* Suggested Macro Distribution */}
            <div className="pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 mb-3">Daily Macronutrient Targets</h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-blue-500/20">
                  <span className="text-blue-400 font-bold">Protein</span>
                  <span className="text-white font-bold">{liveTargets.proteinGrams} g ({liveTargets.proteinPercent}%)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-amber-500/20">
                  <span className="text-amber-400 font-bold">Carbohydrates</span>
                  <span className="text-white font-bold">{liveTargets.carbohydrateGrams} g ({liveTargets.carbsPercent}%)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-rose-500/20">
                  <span className="text-rose-400 font-bold">Healthy Fats</span>
                  <span className="text-white font-bold">{liveTargets.fatGrams} g ({liveTargets.fatPercent}%)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 font-semibold">Recommended Fiber</span>
                  <span className="text-white font-bold">{liveTargets.fiberGrams} g</span>
                </div>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Personal health metrics are protected by role-isolated Firestore rules.</span>
            </div>
          </div>
        </div>
      </form>

      {/* Password & Account Security Section */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Account Password & Security</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your account password or change your credentials at any time.
              </p>
            </div>
          </div>
        </div>

        {passStatus && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
              passStatus.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}
          >
            {passStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{passStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-3.5 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-3.5 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Re-type new password"
                className="w-full pl-3.5 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="sm:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={passSubmitting || !newPass}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {passSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
