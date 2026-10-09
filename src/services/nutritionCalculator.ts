/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActivityLevel, FoodLogEntry, NutritionGoal, NutritionTargets, Sex, UserProfile } from '../types';

/**
 * Multiplier factors for estimated Total Daily Energy Expenditure (TDEE)
 * based on physical activity level.
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,       // Desk job, little to no exercise
  light: 1.375,         // Light exercise 1-3 days/week
  moderate: 1.55,       // Moderate exercise 3-5 days/week
  very_active: 1.725,   // Hard exercise 6-7 days/week
  extra_active: 1.9,    // Physical job or training twice per day
};

/**
 * Calorie adjustments corresponding to targeted weekly rate of weight change.
 */
export const GOAL_CALORIE_ADJUSTMENTS: Record<NutritionGoal, number> = {
  lose_weight_mild: -250,      // ~0.25 kg loss/week
  lose_weight_standard: -500,  // ~0.50 kg loss/week
  lose_weight_rapid: -750,     // ~0.75 kg loss/week
  maintain_weight: 0,          // Maintain current weight
  gain_weight_lean: 250,       // ~0.25 kg gain/week
  gain_weight_bulk: 500,       // ~0.50 kg gain/week
};

// Recognized clinical minimum safe daily caloric intakes without medical supervision
export const MIN_CALORIES_FEMALE = 1200;
export const MIN_CALORIES_MALE = 1500;
export const MAX_CALORIES_CAP = 5500;

/**
 * Calculates Basal Metabolic Rate (BMR) using the validated Mifflin-St Jeor equation.
 * 
 * Formula:
 * - Men: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(years) + 5
 * - Women: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(years) - 161
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  // Gracefully sanitize values so temporary 0, empty, or negative inputs during typing never crash the UI
  const validWeight = (!weightKg || isNaN(weightKg) || weightKg <= 0) ? 65 : weightKg;
  const validHeight = (!heightCm || isNaN(heightCm) || heightCm <= 0) ? 165 : heightCm;
  const validAge = (!age || isNaN(age) || age <= 0) ? 28 : age;

  // Base equation: 10 * weight(kg) + 6.25 * height(cm) - 5 * age
  const base = 10 * validWeight + 6.25 * validHeight - 5 * validAge;

  if (sex === 'male') {
    return Math.round(base + 5);
  } else if (sex === 'female') {
    return Math.round(base - 161);
  } else {
    // For non-binary/other, use the average of male and female offset (-78)
    return Math.round(base - 78);
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE / maintenance calories).
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates complete nutrition targets, including daily calories, macronutrient splits,
 * and fiber recommendations, while enforcing clinical safety floors.
 */
export function calculateNutritionTargets(
  profile?: Partial<Pick<UserProfile, 'sex' | 'age' | 'heightCm' | 'weightKg' | 'activityLevel' | 'goal'>> | null
): NutritionTargets {
  const safeSex = (profile?.sex || 'female') as Sex;
  const safeAge = (!profile?.age || isNaN(profile.age) || profile.age <= 0) ? 28 : profile.age;
  const safeHeight = (!profile?.heightCm || isNaN(profile.heightCm) || profile.heightCm <= 0) ? 165 : profile.heightCm;
  const safeWeight = (!profile?.weightKg || isNaN(profile.weightKg) || profile.weightKg <= 0) ? 65 : profile.weightKg;
  const safeActivity = (profile?.activityLevel || 'moderate') as ActivityLevel;
  const safeGoal = (profile?.goal || 'lose_weight_standard') as NutritionGoal;

  const bmr = calculateBMR(safeWeight, safeHeight, safeAge, safeSex);
  const tdee = calculateTDEE(bmr, safeActivity);

  const goalAdjustment = GOAL_CALORIE_ADJUSTMENTS[safeGoal] || 0;
  const rawTarget = tdee + goalAdjustment;

  // Determine safety floor based on biological sex
  const minSafeFloor = safeSex === 'female' ? MIN_CALORIES_FEMALE : MIN_CALORIES_MALE;

  let dailyCalories = rawTarget;
  let isLowCalorieWarning = false;
  let warningMessage: string | undefined = undefined;

  if (rawTarget < minSafeFloor) {
    isLowCalorieWarning = true;
    warningMessage = `Your calculated target of ${rawTarget} kcal is below the standard recommended minimum of ${minSafeFloor} kcal/day for health and metabolic safety. We have set your target to ${minSafeFloor} kcal. Please consult a registered dietitian or physician for aggressive calorie restriction.`;
    dailyCalories = minSafeFloor;
  } else if (dailyCalories > MAX_CALORIES_CAP) {
    dailyCalories = MAX_CALORIES_CAP;
  }

  // Protein calculation:
  // Recommended 1.8g to 2.2g per kg of bodyweight for active individuals / dieting preservation.
  // We use 2.0g/kg as a high-satiety baseline, but clamp between 20% and 35% of total calories.
  let targetProteinGrams = Math.round(safeWeight * 2.0);
  const minProteinGrams = Math.round((dailyCalories * 0.20) / 4);
  const maxProteinGrams = Math.round((dailyCalories * 0.35) / 4);
  targetProteinGrams = Math.max(minProteinGrams, Math.min(targetProteinGrams, maxProteinGrams));

  // Fat calculation:
  // Recommended ~25-30% of total calories (9 kcal per gram of fat)
  const fatCalories = dailyCalories * 0.28;
  const targetFatGrams = Math.round(fatCalories / 9);

  // Carbohydrate calculation:
  // Remaining calories allocated to carbohydrates (4 kcal per gram)
  const remainingCaloriesForCarbs = Math.max(0, dailyCalories - (targetProteinGrams * 4) - (targetFatGrams * 9));
  const targetCarbsGrams = Math.round(remainingCaloriesForCarbs / 4);

  // Fiber calculation:
  // Recommended 14g per 1000 kcal consumed
  const fiberGrams = Math.max(25, Math.round((dailyCalories / 1000) * 14));

  // Calculate percentages
  const proteinPercent = Math.round(((targetProteinGrams * 4) / dailyCalories) * 100);
  const fatPercent = Math.round(((targetFatGrams * 9) / dailyCalories) * 100);
  const carbsPercent = Math.max(0, 100 - proteinPercent - fatPercent);

  return {
    bmr,
    tdee,
    dailyCalories,
    proteinGrams: targetProteinGrams,
    carbohydrateGrams: targetCarbsGrams,
    fatGrams: targetFatGrams,
    fiberGrams,
    proteinPercent,
    carbsPercent,
    fatPercent,
    isLowCalorieWarning,
    warningMessage,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates sum of consumed calories, protein, carbs, and fat from an array of food entries.
 */
export function calculateDailyTotals(entries: FoodLogEntry[]) {
  return entries.reduce(
    (acc, item) => {
      acc.calories += Math.round(item.calories || 0);
      acc.protein += Number((item.protein || 0).toFixed(1));
      acc.carbohydrates += Number((item.carbohydrates || 0).toFixed(1));
      acc.fat += Number((item.fat || 0).toFixed(1));
      acc.fiber += Number((item.fiber || 0).toFixed(1));
      return acc;
    },
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 }
  );
}

/**
 * Calculates remaining calories and macronutrients against daily targets.
 */
export function calculateRemaining(targets: NutritionTargets, entries: FoodLogEntry[]) {
  const consumed = calculateDailyTotals(entries);

  return {
    consumed,
    remaining: {
      calories: Math.max(0, targets.dailyCalories - consumed.calories),
      protein: Math.max(0, Number((targets.proteinGrams - consumed.protein).toFixed(1))),
      carbohydrates: Math.max(0, Number((targets.carbohydrateGrams - consumed.carbohydrates).toFixed(1))),
      fat: Math.max(0, Number((targets.fatGrams - consumed.fat).toFixed(1))),
      fiber: Math.max(0, Number((targets.fiberGrams - consumed.fiber).toFixed(1))),
    },
    percentages: {
      calories: Math.min(100, Math.round((consumed.calories / targets.dailyCalories) * 100)) || 0,
      protein: Math.min(100, Math.round((consumed.protein / targets.proteinGrams) * 100)) || 0,
      carbohydrates: Math.min(100, Math.round((consumed.carbohydrates / targets.carbohydrateGrams) * 100)) || 0,
      fat: Math.min(100, Math.round((consumed.fat / targets.fatGrams) * 100)) || 0,
    },
    isOverBudget: consumed.calories > targets.dailyCalories,
    overCalories: Math.max(0, consumed.calories - targets.dailyCalories),
  };
}
