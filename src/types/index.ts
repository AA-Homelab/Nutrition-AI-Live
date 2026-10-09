/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'USER';

export type UserStatus = 'active' | 'disabled';

export type Sex = 'male' | 'female' | 'other';

export type ActivityLevel =
  | 'sedentary'      // Little or no exercise (desk job)
  | 'light'          // Light exercise 1-3 days/week
  | 'moderate'       // Moderate exercise 3-5 days/week
  | 'very_active'    // Hard exercise 6-7 days/week
  | 'extra_active';  // Very hard exercise, physical job or 2x training

export type NutritionGoal =
  | 'lose_weight_mild'     // ~0.25 kg/week (-250 kcal)
  | 'lose_weight_standard' // ~0.50 kg/week (-500 kcal)
  | 'lose_weight_rapid'    // ~0.75 kg/week (-750 kcal)
  | 'maintain_weight'      // Maintenance (0 kcal)
  | 'gain_weight_lean'     // ~0.25 kg/week (+250 kcal)
  | 'gain_weight_bulk';    // ~0.50 kg/week (+500 kcal)

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserProfile {
  fullName: string;
  dateOfBirth?: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  activityLevel: ActivityLevel;
  exerciseSessionsPerWeek: number;
  goal: NutritionGoal;
  dietaryPreferences: string[]; // e.g. ["Filipino/Asian", "High Protein", "Halal"]
  allergies: string[];         // e.g. ["Peanuts", "Shellfish", "Dairy"]
  preferredCuisine?: string;
  isProfileComplete: boolean;
  updatedAt: string;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
  fiberGrams: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  isLowCalorieWarning?: boolean;
  warningMessage?: string;
  updatedAt: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLogEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mealType: MealType;
  foodName: string;
  servingSize: number;
  unit: string; // e.g. 'g', 'cup', 'serving', 'piece'
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  notes?: string;
  source: 'manual' | 'ai_photo' | 'database' | 'ai_recommendation';
  aiConfidence?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetectedFoodItem {
  id: string;
  name: string;
  estimatedServingGrams: number;
  unit: string;
  calories: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  confidence: number; // 0 to 1
  selected: boolean;
}

export interface AiFoodAnalysisResult {
  foods: DetectedFoodItem[];
  total: {
    calories: number;
    proteinGrams: number;
    carbohydratesGrams: number;
    fatGrams: number;
  };
  notes: string;
  disclaimer: string;
  rawImagePreview?: string;
}

export interface WeightLogEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  notes?: string;
  createdAt: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedAction?: {
    type: 'log_meal' | 'explore_recipe';
    payload: any;
  };
}

export interface MealRecommendation {
  id: string;
  title: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  servingSize: string;
  ingredients: string[];
  instructions: string;
  tags: string[];
  reason: string;
}

export interface DatabaseFoodItem {
  id: string;
  name: string;
  category: 'Filipino' | 'Asian' | 'Breakfast' | 'Proteins' | 'Grains' | 'Produce' | 'Snacks';
  servingDescription: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
}
