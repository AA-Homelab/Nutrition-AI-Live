/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { AiClientService } from '../services/aiClientService';
import { calculateRemaining } from '../services/nutritionCalculator';
import { FoodLogEntry, MealRecommendation, MealType } from '../types';
import {
  ChefHat,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  MessageSquare,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Utensils,
  Plus,
} from 'lucide-react';

interface MealRecommendationsPageProps {
  onAskAi: (question: string) => void;
  onMealLogged: () => void;
}

export const MealRecommendationsPage: React.FC<MealRecommendationsPageProps> = ({
  onAskAi,
  onMealLogged,
}) => {
  const { currentUser, userProfile, nutritionTargets } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [todayLogs, setTodayLogs] = useState<FoodLogEntry[]>([]);
  const [recommendations, setRecommendations] = useState<MealRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [loggedSuccessId, setLoggedSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = DataService.subscribeFoodLogs(currentUser.uid, todayStr, (logs) => {
      setTodayLogs(logs);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const defaultTargets = nutritionTargets || {
    dailyCalories: 2000,
    proteinGrams: 140,
    carbohydrateGrams: 220,
    fatGrams: 65,
    fiberGrams: 28,
    bmr: 1600,
    tdee: 2200,
    proteinPercent: 28,
    carbsPercent: 44,
    fatPercent: 28,
    updatedAt: '',
  };

  const { consumed, remaining } = calculateRemaining(defaultTargets, todayLogs);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const data = await AiClientService.recommendMeals({
        remaining,
        goal: userProfile?.goal,
        preferences: userProfile?.dietaryPreferences,
        allergies: userProfile?.allergies,
        mealType: selectedMealType,
      });

      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.warn('Notice loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedMealType]);

  const handleLogMeal = async (meal: MealRecommendation) => {
    if (!currentUser?.uid) return;
    setLoggingId(meal.id);

    try {
      const logEntry: FoodLogEntry = {
        id: `rec-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.uid,
        date: todayStr,
        time: new Date().toTimeString().substring(0, 5),
        mealType: meal.mealType,
        foodName: meal.title,
        servingSize: 1,
        unit: meal.servingSize || 'serving',
        calories: meal.calories,
        protein: meal.protein,
        carbohydrates: meal.carbohydrates,
        fat: meal.fat,
        fiber: meal.fiber || 0,
        notes: `AI Recommendation: ${meal.reason}`,
        source: 'ai_recommendation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await DataService.addFoodLog(logEntry);
      setLoggedSuccessId(meal.id);
      setTimeout(() => {
        setLoggedSuccessId(null);
        onMealLogged();
      }, 1200);
    } catch (err) {
      console.error('Failed to log meal:', err);
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Meal Type Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">Smart Meal Recommendations</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Macro-Optimized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalized recipes tailored to fit within your remaining {remaining.calories} kcal budget.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedMealType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                selectedMealType === type
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}

          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Target Status Banner */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400">Remaining Budget</span>
            <p className="text-lg font-black text-white font-mono">
              {remaining.calories} kcal{' '}
              <span className="text-xs font-normal text-slate-400">
                (P: {remaining.protein}g | C: {remaining.carbohydrates}g | F: {remaining.fat}g)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userProfile?.dietaryPreferences?.map((pref, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
            >
              {pref}
            </span>
          ))}
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 mx-auto text-amber-400 animate-spin mb-3" />
          <p className="text-sm font-bold text-white">Generating tailored recipes with Gemini AI...</p>
          <p className="text-xs text-slate-400 mt-1">Balancing proteins, calories, and Asian flavors</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((meal) => {
            const isExpanded = expandedRecipeId === meal.id;
            const isLogging = loggingId === meal.id;
            const isLogged = loggedSuccessId === meal.id;

            return (
              <div
                key={meal.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
              >
                <div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {meal.tags?.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{meal.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{meal.reason}</p>

                  {/* Macro Badges */}
                  <div className="grid grid-cols-4 gap-2 mt-4 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-center font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400">Calories</span>
                      <p className="text-xs font-black text-emerald-400 mt-0.5">{meal.calories}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-400">Protein</span>
                      <p className="text-xs font-black text-white mt-0.5">{meal.protein}g</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400">Carbs</span>
                      <p className="text-xs font-black text-white mt-0.5">{meal.carbohydrates}g</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400">Fat</span>
                      <p className="text-xs font-black text-white mt-0.5">{meal.fat}g</p>
                    </div>
                  </div>

                  {/* Serving size */}
                  <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-slate-500" />
                    Portion: <strong className="text-slate-200">{meal.servingSize}</strong>
                  </p>

                  {/* Expandable Recipe Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-3 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-300 mb-1">Key Ingredients:</h4>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                          {meal.ingredients?.map((ing, i) => (
                            <li key={i}>{ing}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-300 mb-1">Preparation:</h4>
                        <p className="text-slate-400 leading-relaxed">{meal.instructions}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedRecipeId(isExpanded ? null : meal.id)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {isExpanded ? 'Hide Recipe' : 'View Recipe'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onAskAi(
                          `Can you give me the exact step-by-step recipe, macro breakdown, and cooking tips for "${meal.title}"?`
                        )
                      }
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Ask AI
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isLogging || isLogged}
                    onClick={() => handleLogMeal(meal)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    {isLogged ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Logged to Today!
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        {isLogging ? 'Logging...' : 'Log This Meal'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
