/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { calculateRemaining } from '../services/nutritionCalculator';
import { FoodLogEntry, MealType } from '../types';
import {
  Flame,
  Plus,
  Camera,
  Sparkles,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenQuickAdd: (mealType?: MealType) => void;
  onEditEntry: (entry: FoodLogEntry) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenQuickAdd,
  onEditEntry,
}) => {
  const { currentUser, userProfile, nutritionTargets } = useAuth();

  // Selected Date (default: today YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to food entries for the selected date
  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);
    const unsubscribe = DataService.subscribeFoodLogs(currentUser.uid, selectedDate, (entries) => {
      setFoodLogs(entries);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser?.uid, selectedDate]);

  // Compute remaining values
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

  const { consumed, remaining, percentages, isOverBudget, overCalories } = calculateRemaining(
    defaultTargets,
    foodLogs
  );

  // Date controls
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleDelete = async (entryId: string) => {
    if (!currentUser?.uid) return;
    await DataService.deleteFoodLog(currentUser.uid, entryId);
  };

  // Group food logs by meal type
  const mealSections: { type: MealType; label: string; timeHint: string }[] = [
    { type: 'breakfast', label: 'Breakfast', timeHint: 'Morning' },
    { type: 'lunch', label: 'Lunch', timeHint: 'Afternoon' },
    { type: 'dinner', label: 'Dinner', timeHint: 'Evening' },
    { type: 'snack', label: 'Snacks & Extras', timeHint: 'Anytime' },
  ];

  const getMealEntries = (type: MealType) => foodLogs.filter((entry) => entry.mealType === type);

  const getMealCalories = (type: MealType) =>
    getMealEntries(type).reduce((sum, item) => sum + item.calories, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header: Greeting & Date Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Mabuhay, {userProfile?.fullName || 'Nutritionist'} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Targeting{' '}
            <span className="text-emerald-400 font-semibold">{defaultTargets.dailyCalories} kcal</span>{' '}
            daily • Goal: <span className="capitalize">{userProfile?.goal.replace(/_/g, ' ')}</span>
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-sm self-start sm:self-auto">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-2 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 ml-1"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Hero Calorie Card + Circular Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calorie Budget Hero */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Circular Ring Gauge */}
            <div className="relative flex items-center justify-center flex-shrink-0">
              <svg className="w-44 h-44 transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="74"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="74"
                  stroke="currentColor"
                  strokeWidth="12"
                  className={`${isOverBudget ? 'text-rose-500' : 'text-emerald-500'} transition-all duration-700 ease-out`}
                  fill="transparent"
                  strokeDasharray={465}
                  strokeDashoffset={465 - (465 * Math.min(100, percentages.calories)) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <Flame className={`w-6 h-6 mb-0.5 ${isOverBudget ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
                <span className="text-3xl font-black text-white tracking-tight">
                  {isOverBudget ? overCalories : remaining.calories}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isOverBudget ? 'kcal Over' : 'kcal Left'}
                </span>
              </div>
            </div>

            {/* Target & Consumed Summary Stats */}
            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Daily Target
                  </span>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">
                    {defaultTargets.dailyCalories.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500">kcal goal</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Consumed
                  </span>
                  <p className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">
                    {consumed.calories.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500">{percentages.calories}% of goal</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Remaining
                  </span>
                  <p className={`text-lg sm:text-xl font-black mt-0.5 ${isOverBudget ? 'text-rose-400' : 'text-white'}`}>
                    {remaining.calories.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500">kcal budget</span>
                </div>
              </div>

              {/* Progress bar status */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Daily Calorie Consumption</span>
                  <span className={isOverBudget ? 'text-rose-400' : 'text-emerald-400'}>
                    {percentages.calories}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                    style={{ width: `${Math.min(100, percentages.calories)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Macronutrient Distribution Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Macronutrient Status</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </h3>

            <div className="space-y-4">
              {/* Protein */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-blue-400">Protein</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {consumed.protein} / {defaultTargets.proteinGrams} g
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentages.protein}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{remaining.protein}g remaining</span>
                  <span>{percentages.protein}%</span>
                </div>
              </div>

              {/* Carbohydrates */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-amber-400">Carbohydrates</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {consumed.carbohydrates} / {defaultTargets.carbohydrateGrams} g
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentages.carbohydrates}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{remaining.carbohydrates}g remaining</span>
                  <span>{percentages.carbohydrates}%</span>
                </div>
              </div>

              {/* Fat */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-rose-400">Fat</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {consumed.fat} / {defaultTargets.fatGrams} g
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentages.fat}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{remaining.fat}g remaining</span>
                  <span>{percentages.fat}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Fiber Intake:</span>
            <span className="font-bold text-slate-200 font-mono">
              {consumed.fiber} / {defaultTargets.fiberGrams} g
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onOpenQuickAdd('breakfast')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          Log Food
        </button>

        <button
          onClick={() => onNavigate('analyze-photo')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-105 transition-all"
        >
          <Camera className="w-4 h-4 stroke-[2.5]" />
          Analyze Food Photo
        </button>

        <button
          onClick={() => onNavigate('ai-assistant')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold text-xs transition-all"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Ask AI Assistant
        </button>

        <button
          onClick={() => onNavigate('meal-recommendations')}
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-all"
        >
          <ChefHat className="w-4 h-4 text-amber-400" />
          Meal Ideas
        </button>
      </div>

      {/* Meal Breakdown Sections */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-white tracking-tight">Today's Meals</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mealSections.map((sec) => {
            const entries = getMealEntries(sec.type);
            const totalMealCals = getMealCalories(sec.type);

            return (
              <div
                key={sec.type}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between"
              >
                {/* Meal Header */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {sec.label}
                        <span className="text-[11px] font-normal text-slate-500">({sec.timeHint})</span>
                      </h3>
                      <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                        {totalMealCals} kcal
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenQuickAdd(sec.type)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 transition-colors"
                      title={`Add food to ${sec.label}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Meal Entries List */}
                  <div className="space-y-2.5">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="group p-3 rounded-2xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition-all flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-200 truncate">{entry.foodName}</p>
                            {entry.source === 'ai_photo' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                                AI Photo
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {entry.servingSize} {entry.unit} •{' '}
                            <span className="text-blue-400 font-medium">P: {entry.protein}g</span> •{' '}
                            <span className="text-amber-400 font-medium">C: {entry.carbohydrates}g</span> •{' '}
                            <span className="text-rose-400 font-medium">F: {entry.fat}g</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-mono font-extrabold text-white">
                            {entry.calories} kcal
                          </span>
                          <button
                            onClick={() => onEditEntry(entry)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-opacity"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-opacity"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {entries.length === 0 && (
                      <div className="py-6 text-center text-slate-500 text-xs italic">
                        No food logged for {sec.label.toLowerCase()} yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 text-right">
                  <button
                    onClick={() => onOpenQuickAdd(sec.type)}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 font-semibold transition-colors"
                  >
                    + Add to {sec.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
