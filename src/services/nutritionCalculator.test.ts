/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  calculateBMR,
  calculateTDEE,
  calculateNutritionTargets,
  calculateDailyTotals,
  calculateRemaining,
  MIN_CALORIES_FEMALE,
  MIN_CALORIES_MALE,
} from './nutritionCalculator';
import { FoodLogEntry } from '../types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } else {
    console.error(`  ✗ FAILED: ${testName}`);
  }
}

console.log('🧪 Starting Nutrition Calculation Engine Tests...\n');

// 1. Mifflin-St Jeor BMR Tests
console.log('1. Mifflin-St Jeor BMR Calculations:');
// 70kg, 175cm, 30yo male:
// 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75 -> 1649
const bmrMale = calculateBMR(70, 175, 30, 'male');
assert(bmrMale === 1649, `Male BMR (70kg, 175cm, 30yo) should be 1649 kcal, got ${bmrMale}`);

// 60kg, 162cm, 28yo female:
// 10*60 + 6.25*162 - 5*28 - 161 = 600 + 1012.5 - 140 - 161 = 1311.5 -> 1312
const bmrFemale = calculateBMR(60, 162, 28, 'female');
assert(bmrFemale === 1312, `Female BMR (60kg, 162cm, 28yo) should be 1312 kcal, got ${bmrFemale}`);

// 2. TDEE Calculations with Activity Multipliers
console.log('\n2. TDEE Multipliers:');
const tdeeSedentary = calculateTDEE(1649, 'sedentary'); // 1649 * 1.2 = 1978.8 -> 1979
assert(tdeeSedentary === 1979, `Sedentary TDEE should be 1979, got ${tdeeSedentary}`);

const tdeeModerate = calculateTDEE(1649, 'moderate'); // 1649 * 1.55 = 2555.95 -> 2556
assert(tdeeModerate === 2556, `Moderate TDEE should be 2556, got ${tdeeModerate}`);

// 3. Goal Adjustments & Safety Floor Tests
console.log('\n3. Goal Adjustments & Safety Floors:');
const targetsMaleWeightLoss = calculateNutritionTargets({
  sex: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 70,
  activityLevel: 'moderate',
  goal: 'lose_weight_standard', // -500 kcal
});
// 2556 - 500 = 2056 kcal
assert(targetsMaleWeightLoss.dailyCalories === 2056, `Male weight loss target should be 2056, got ${targetsMaleWeightLoss.dailyCalories}`);
assert(!targetsMaleWeightLoss.isLowCalorieWarning, 'Standard deficit should not trigger low calorie warning');

// Female with very low TDEE and aggressive deficit must trigger safety floor
const lowCalorieProfile = calculateNutritionTargets({
  sex: 'female',
  age: 45,
  heightCm: 150,
  weightKg: 48,
  activityLevel: 'sedentary', // BMR ~1050, TDEE ~1260
  goal: 'lose_weight_rapid', // -750 -> would be 510 kcal!
});
assert(lowCalorieProfile.dailyCalories === MIN_CALORIES_FEMALE, `Female target must be clamped to safe minimum of ${MIN_CALORIES_FEMALE}, got ${lowCalorieProfile.dailyCalories}`);
assert(lowCalorieProfile.isLowCalorieWarning === true, 'Low calorie warning must be triggered for unsafe deficit');

// 4. Macronutrient calculations
console.log('\n4. Macronutrient Distribution:');
assert(targetsMaleWeightLoss.proteinGrams > 0, `Protein target (${targetsMaleWeightLoss.proteinGrams}g) must be positive`);
assert(targetsMaleWeightLoss.carbohydrateGrams > 0, `Carb target (${targetsMaleWeightLoss.carbohydrateGrams}g) must be positive`);
assert(targetsMaleWeightLoss.fatGrams > 0, `Fat target (${targetsMaleWeightLoss.fatGrams}g) must be positive`);
assert(targetsMaleWeightLoss.fiberGrams >= 25, `Fiber target (${targetsMaleWeightLoss.fiberGrams}g) must meet minimum 25g recommendation`);

// 5. Daily Totals and Remaining Calculations
console.log('\n5. Consumed & Remaining Calculations:');
const mockEntries: FoodLogEntry[] = [
  {
    id: '1',
    userId: 'u1',
    date: '2026-10-05',
    time: '08:00',
    mealType: 'breakfast',
    foodName: 'Tapsilog',
    servingSize: 1,
    unit: 'serving',
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
    id: '2',
    userId: 'u1',
    date: '2026-10-05',
    time: '12:30',
    mealType: 'lunch',
    foodName: 'Chicken Adobo with Rice',
    servingSize: 1,
    unit: 'serving',
    calories: 515,
    protein: 35,
    carbohydrates: 45,
    fat: 17,
    fiber: 1,
    source: 'ai_photo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const totals = calculateDailyTotals(mockEntries);
assert(totals.calories === 1135, `Total calories should be 1135, got ${totals.calories}`);
assert(totals.protein === 71, `Total protein should be 71, got ${totals.protein}`);
assert(totals.carbohydrates === 103, `Total carbs should be 103, got ${totals.carbohydrates}`);
assert(totals.fat === 43, `Total fat should be 43, got ${totals.fat}`);

const remainingResult = calculateRemaining(targetsMaleWeightLoss, mockEntries);
// Daily calories: 2056, consumed: 1135, remaining: 921
assert(remainingResult.remaining.calories === 921, `Remaining calories should be 921, got ${remainingResult.remaining.calories}`);
assert(!remainingResult.isOverBudget, 'Should not be over budget');

console.log(`\n========================================`);
console.log(`Results: ${passedTests}/${totalTests} tests passed`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
