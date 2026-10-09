/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateNutritionTargets } from '../services/nutritionCalculator';
import { ActivityLevel, NutritionGoal, Sex, UserProfile } from '../types';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Scale,
  Flame,
  Dumbbell,
  Heart,
  Utensils,
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { currentUser, userAccount, updateProfileAndTargets } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(userAccount?.displayName || '');
  const [age, setAge] = useState<number>(28);
  const [sex, setSex] = useState<Sex>('female');
  const [heightCm, setHeightCm] = useState<number>(165);
  const [weightKg, setWeightKg] = useState<number>(65);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(60);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [exerciseSessionsPerWeek, setExerciseSessionsPerWeek] = useState<number>(4);
  const [goal, setGoal] = useState<NutritionGoal>('lose_weight_standard');
  const [selectedDiets, setSelectedDiets] = useState<string[]>(['Filipino/Asian Foods', 'Balanced Whole Foods']);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  // Live calculated targets for review step
  const calculatedTargets = calculateNutritionTargets({
    sex,
    age,
    heightCm,
    weightKg,
    activityLevel,
    goal,
  });

  const toggleDiet = (item: string) => {
    if (selectedDiets.includes(item)) {
      setSelectedDiets(selectedDiets.filter((d) => d !== item));
    } else {
      setSelectedDiets([...selectedDiets, item]);
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !selectedAllergies.includes(allergyInput.trim())) {
      setSelectedAllergies([...selectedAllergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (name: string) => {
    setSelectedAllergies(selectedAllergies.filter((a) => a !== name));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const profile: UserProfile = {
        fullName: fullName || userAccount?.displayName || 'User',
        age,
        sex,
        heightCm,
        weightKg,
        targetWeightKg,
        activityLevel,
        exerciseSessionsPerWeek,
        goal,
        dietaryPreferences: selectedDiets,
        allergies: selectedAllergies,
        preferredCuisine: 'Filipino & Asian',
        isProfileComplete: true,
        updatedAt: new Date().toISOString(),
      };

      await updateProfileAndTargets(profile, calculatedTargets);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Progress */}
        <div className="bg-slate-900/60 p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                {step}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Setup Your Nutrition Profile</h2>
                <p className="text-xs text-slate-400">Step {step} of 6</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
              {Math.round((step / 6) * 100)}% Complete
            </span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 sm:p-8">
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Let's start with the basics</h3>
                <p className="text-sm text-slate-400">
                  We use your biological sex, age, and measurements to accurately calculate your Basal Metabolic Rate using the Mifflin-St Jeor formula.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Biological Sex</label>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value as Sex)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other / Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Age (Years)</label>
                    <input
                      type="number"
                      min={14}
                      max={100}
                      value={age}
                      onChange={(e) => setAge(Math.max(14, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Height & Weight */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Body Measurements</h3>
                <p className="text-sm text-slate-400">
                  Precision is key for accurate energy expenditure and lean mass estimation.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Height</label>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{heightCm} cm ({Math.floor(heightCm / 30.48)}' {Math.round((heightCm % 30.48) / 2.54)}")</span>
                  </div>
                  <input
                    type="range"
                    min={120}
                    max={230}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>120 cm</span>
                    <span>175 cm</span>
                    <span>230 cm</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={35}
                      max={250}
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Weight (kg, optional)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={35}
                      max={250}
                      value={targetWeightKg}
                      onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Exercise & Activity */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Activity & Lifestyle</h3>
                <p className="text-sm text-slate-400">
                  Select your typical weekly movement to calculate your Total Daily Energy Expenditure (TDEE).
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little or no structured exercise', mult: '1.2x' },
                  { id: 'light', label: 'Lightly Active', desc: 'Light workouts / sports 1–3 days per week', mult: '1.375x' },
                  { id: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3–5 days per week', mult: '1.55x' },
                  { id: 'very_active', label: 'Very Active', desc: 'Hard exercise / sports 6–7 days per week', mult: '1.725x' },
                  { id: 'extra_active', label: 'Extra Active / Athlete', desc: 'Physical occupation or two rigorous training sessions/day', mult: '1.9x' },
                ].map((act) => (
                  <label
                    key={act.id}
                    onClick={() => setActivityLevel(act.id as ActivityLevel)}
                    className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activityLevel === act.id
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${activityLevel === act.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                        {activityLevel === act.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{act.label}</p>
                        <p className="text-xs text-slate-400">{act.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">{act.mult}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Goals & Rate of Change */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Your Primary Goal</h3>
                <p className="text-sm text-slate-400">
                  How would you like to pace your nutrition target?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'lose_weight_mild', title: 'Gradual Fat Loss', desc: 'Mild deficit (-250 kcal/day) ~0.25 kg/wk' },
                  { id: 'lose_weight_standard', title: 'Standard Fat Loss', desc: 'Optimal balance (-500 kcal/day) ~0.5 kg/wk' },
                  { id: 'lose_weight_rapid', title: 'Accelerated Fat Loss', desc: 'Aggressive (-750 kcal/day) ~0.75 kg/wk' },
                  { id: 'maintain_weight', title: 'Maintain Weight', desc: 'Metabolic equilibrium (0 kcal adjustment)' },
                  { id: 'gain_weight_lean', title: 'Lean Muscle Gain', desc: 'Clean surplus (+250 kcal/day) ~0.25 kg/wk' },
                  { id: 'gain_weight_bulk', title: 'Mass / Strength Gain', desc: 'Substantial surplus (+500 kcal/day)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id as NutritionGoal)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      goal === item.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Preferences & Allergies */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Dietary Preferences & Allergies</h3>
                <p className="text-sm text-slate-400">
                  Our AI engine will customize your meal recommendations and photo identification based on these preferences.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Preferred Cuisines & Diet Types</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Filipino/Asian Foods',
                    'High Protein',
                    'Balanced Whole Foods',
                    'Low Carb',
                    'Pescatarian',
                    'Vegetarian',
                    'Halal',
                    'Gluten-Free',
                  ].map((diet) => {
                    const isSelected = selectedDiets.includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => toggleDiet(diet)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {diet}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Allergies or Intolerances</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Peanuts, Shellfish, Dairy..."
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAllergy();
                      }
                    }}
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
                  {selectedAllergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="hover:text-rose-100 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedAllergies.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No allergies specified</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review Calculated Targets */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Your Personalized Nutrition Plan</h3>
                <p className="text-sm text-slate-400">
                  Calculated automatically using the clinical Mifflin-St Jeor formula and your selected goal.
                </p>
              </div>

              {calculatedTargets.isLowCalorieWarning && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300 leading-relaxed">
                    {calculatedTargets.warningMessage}
                  </p>
                </div>
              )}

              {/* Maintenance vs Target Banner */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Estimated Maintenance (TDEE)</span>
                  <p className="text-2xl font-black text-slate-200 mt-1">
                    {calculatedTargets.tdee.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-400">kcal/day</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">BMR: {calculatedTargets.bmr} kcal</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-xs text-emerald-400 font-semibold">Recommended Daily Target</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {calculatedTargets.dailyCalories.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-emerald-300">kcal/day</span>
                  </p>
                  <p className="text-[11px] text-emerald-400/80 mt-1 capitalize">
                    {goal.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Macro breakdown cards */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Suggested Macronutrient Split
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/20 text-center">
                    <span className="text-[11px] font-semibold text-blue-400">Protein</span>
                    <p className="text-lg font-black text-white mt-0.5">{calculatedTargets.proteinGrams}g</p>
                    <span className="text-[10px] text-slate-400">{calculatedTargets.proteinPercent}% of calories</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 text-center">
                    <span className="text-[11px] font-semibold text-amber-400">Carbohydrates</span>
                    <p className="text-lg font-black text-white mt-0.5">{calculatedTargets.carbohydrateGrams}g</p>
                    <span className="text-[10px] text-slate-400">{calculatedTargets.carbsPercent}% of calories</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/20 text-center">
                    <span className="text-[11px] font-semibold text-rose-400">Healthy Fats</span>
                    <p className="text-lg font-black text-white mt-0.5">{calculatedTargets.fatGrams}g</p>
                    <span className="text-[10px] text-slate-400">{calculatedTargets.fatPercent}% of calories</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Recommended Daily Fiber:</span>
                  <span className="font-semibold text-slate-200">{calculatedTargets.fiberGrams}g / day</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-6 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving Profile...' : 'Save & Enter Dashboard'}
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
