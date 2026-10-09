/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { FoodLogEntry } from '../types';
import { calculateDailyTotals } from '../services/nutritionCalculator';
import {
  Calendar,
  Flame,
  TrendingUp,
  BarChart3,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { currentUser, nutritionTargets } = useAuth();
  const [filterRange, setFilterRange] = useState<'today' | '7days' | '30days' | 'custom'>('7days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [allLogs, setAllLogs] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const targetCalories = nutritionTargets?.dailyCalories || 2000;

  useEffect(() => {
    if (!currentUser?.uid) return;
    DataService.getAllFoodLogs(currentUser.uid).then((logs) => {
      setAllLogs(logs);
      setLoading(false);
    });
  }, [currentUser?.uid]);

  // Compute date range
  const now = new Date();
  let startDateStr = '';
  let endDateStr = now.toISOString().split('T')[0];

  if (filterRange === 'today') {
    startDateStr = endDateStr;
  } else if (filterRange === '7days') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    startDateStr = d.toISOString().split('T')[0];
  } else if (filterRange === '30days') {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    startDateStr = d.toISOString().split('T')[0];
  } else {
    startDateStr = customStart || endDateStr;
    endDateStr = customEnd || endDateStr;
  }

  // Filter logs within window
  const filteredLogs = allLogs.filter((log) => log.date >= startDateStr && log.date <= endDateStr);

  // Group by date
  const dateMap: { [date: string]: FoodLogEntry[] } = {};
  filteredLogs.forEach((log) => {
    if (!dateMap[log.date]) dateMap[log.date] = [];
    dateMap[log.date].push(log);
  });

  // Generate continuous list of dates for the range (up to 30 days)
  const daysList: { date: string; calories: number; protein: number; carbs: number; fat: number }[] = [];
  const sDate = new Date(startDateStr);
  const eDate = new Date(endDateStr);
  
  // Guard max 60 days
  const maxIterations = 60;
  let iter = 0;
  const cur = new Date(sDate);

  while (cur <= eDate && iter < maxIterations) {
    const dStr = cur.toISOString().split('T')[0];
    const dayEntries = dateMap[dStr] || [];
    const totals = calculateDailyTotals(dayEntries);
    daysList.push({
      date: dStr,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbohydrates,
      fat: totals.fat,
    });
    cur.setDate(cur.getDate() + 1);
    iter++;
  }

  // Summary Metrics
  const activeDays = daysList.filter((d) => d.calories > 0);
  const totalCalsConsumed = activeDays.reduce((sum, d) => sum + d.calories, 0);
  const avgCalories = activeDays.length ? Math.round(totalCalsConsumed / activeDays.length) : 0;
  const avgProtein = activeDays.length
    ? Math.round(activeDays.reduce((sum, d) => sum + d.protein, 0) / activeDays.length)
    : 0;
  const adherenceDays = activeDays.filter(
    (d) => Math.abs(d.calories - targetCalories) <= targetCalories * 0.15
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Nutrition History & Trends</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate your long-term calorie adherence and macronutrient consistency.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(['today', '7days', '30days', 'custom'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterRange === r
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {r === '7days' ? 'Last 7 Days' : r === '30days' ? 'Last 30 Days' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filterRange === 'custom' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3 text-xs">
          <span>From:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white"
          />
          <span>To:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white"
          />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Daily Target
          </span>
          <p className="text-2xl font-black text-white mt-1 font-mono">
            {targetCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
          </p>
          <span className="text-[11px] text-slate-500">Mifflin-St Jeor engine</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Avg Daily Intake
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {avgCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
          </p>
          <span className="text-[11px] text-slate-500">Over active logged days</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
            Avg Protein
          </span>
          <p className="text-2xl font-black text-blue-400 mt-1 font-mono">
            {avgProtein} <span className="text-xs font-normal text-slate-400">g / day</span>
          </p>
          <span className="text-[11px] text-slate-500">Target: {nutritionTargets?.proteinGrams || 140}g</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Target Adherence
          </span>
          <p className="text-2xl font-black text-white mt-1 font-mono">
            {activeDays.length ? Math.round((adherenceDays / activeDays.length) * 100) : 0}%
          </p>
          <span className="text-[11px] text-slate-500">{adherenceDays} of {activeDays.length} days on budget</span>
        </div>
      </div>

      {/* Daily Calories Bar Chart vs Target Line */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Calorie Intake vs. Daily Target
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Target Line: <strong className="text-emerald-400">{targetCalories} kcal</strong>
          </span>
        </div>

        <div className="pt-6 pb-2">
          <div className="h-56 flex items-end gap-2 sm:gap-4 justify-between border-b border-slate-800 relative px-2">
            {/* Horizontal Target Line */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500/50 pointer-events-none z-10"
              style={{
                bottom: `${Math.min(95, Math.max(10, (targetCalories / 3000) * 100))}%`,
              }}
            >
              <span className="absolute right-2 -top-4 text-[10px] font-mono font-bold text-emerald-400 bg-slate-900 px-1 rounded">
                Target {targetCalories}
              </span>
            </div>

            {/* Bars */}
            {daysList.map((day) => {
              const heightPct = Math.min(100, Math.round((day.calories / 3000) * 100));
              const isOver = day.calories > targetCalories * 1.1;

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-950 border border-slate-700 text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap shadow-xl font-mono pointer-events-none">
                    <p className="font-bold">{day.date}</p>
                    <p className={isOver ? 'text-rose-400' : 'text-emerald-400'}>
                      {day.calories} kcal
                    </p>
                    <p className="text-slate-400">
                      P: {day.protein}g | C: {day.carbs}g | F: {day.fat}g
                    </p>
                  </div>

                  <div
                    className={`w-full max-w-[36px] rounded-t-lg transition-all duration-500 ${
                      day.calories === 0
                        ? 'bg-slate-800/40 h-2'
                        : isOver
                        ? 'bg-rose-500/80 group-hover:bg-rose-400'
                        : 'bg-emerald-500/80 group-hover:bg-emerald-400'
                    }`}
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  />

                  <span className="text-[9px] text-slate-500 font-mono mt-2 truncate max-w-[36px]">
                    {day.date.substring(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Records Detailed Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-6 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Daily Breakdown
          </h2>
        </div>

        <div className="divide-y divide-slate-800/80">
          {[...daysList].reverse().map((day) => (
            <div
              key={day.date}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-white font-mono">{day.date}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Protein: <strong className="text-blue-400">{day.protein}g</strong> • Carbs:{' '}
                  <strong className="text-amber-400">{day.carbs}g</strong> • Fat:{' '}
                  <strong className="text-rose-400">{day.fat}g</strong>
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`text-sm font-black font-mono ${
                    day.calories > targetCalories ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {day.calories} kcal
                </span>
                <p className="text-[10px] text-slate-500">
                  {day.calories > targetCalories
                    ? `+${day.calories - targetCalories} over`
                    : `${targetCalories - day.calories} remaining`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
