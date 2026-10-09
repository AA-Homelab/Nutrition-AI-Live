/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { WeightLogEntry } from '../types';
import {
  Scale,
  Plus,
  Trash2,
  Calendar,
  TrendingDown,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const WeightPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState(todayStr);
  const [weightKg, setWeightKg] = useState<number>(userProfile?.weightKg || 65);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    loadWeight();
  }, [currentUser?.uid]);

  const loadWeight = async () => {
    if (!currentUser?.uid) return;
    const logs = await DataService.getWeightLogs(currentUser.uid);
    setWeightLogs(logs);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid || !weightKg) return;

    setSaving(true);
    try {
      const entry: WeightLogEntry = {
        id: `weight-${Date.now()}`,
        userId: currentUser.uid,
        date,
        weightKg: Number(Number(weightKg).toFixed(1)),
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await DataService.addWeightLog(entry);
      await loadWeight();
      setModalOpen(false);
      setNotes('');
    } catch (err) {
      console.error('Error saving weight:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser?.uid) return;
    await DataService.deleteWeightLog(currentUser.uid, id);
    await loadWeight();
  };

  // Compute stats
  const sortedLogs = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
  const startingWeight = sortedLogs[0]?.weightKg || userProfile?.weightKg || 65;
  const currentWeight = sortedLogs[sortedLogs.length - 1]?.weightKg || startingWeight;
  const targetWeight = userProfile?.targetWeightKg || startingWeight;
  const weightChange = Number((currentWeight - startingWeight).toFixed(1));
  const toTarget = Number((currentWeight - targetWeight).toFixed(1));

  // Compute SVG chart points
  const minWeight = Math.min(...sortedLogs.map((l) => l.weightKg), targetWeight) - 1;
  const maxWeight = Math.max(...sortedLogs.map((l) => l.weightKg), startingWeight) + 1;
  const range = maxWeight - minWeight || 1;

  const chartHeight = 160;
  const chartWidth = 600;

  const points = sortedLogs.map((log, index) => {
    const x = sortedLogs.length > 1 ? (index / (sortedLogs.length - 1)) * (chartWidth - 60) + 30 : 300;
    const y = chartHeight - ((log.weightKg - minWeight) / range) * (chartHeight - 40) - 20;
    return { x, y, ...log };
  });

  const pathD =
    points.length > 1
      ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
      : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Log Weight Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Weight Tracker</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor your body composition and weight milestones over time.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log New Weigh-In
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Current Weight
          </span>
          <p className="text-2xl font-black text-white mt-1 font-mono">
            {currentWeight} <span className="text-xs font-normal text-slate-400">kg</span>
          </p>
          <span className="text-[11px] text-slate-500">Latest entry</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Starting Weight
          </span>
          <p className="text-2xl font-black text-slate-300 mt-1 font-mono">
            {startingWeight} <span className="text-xs font-normal text-slate-400">kg</span>
          </p>
          <span className="text-[11px] text-slate-500">First recorded</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Target Weight
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {targetWeight} <span className="text-xs font-normal text-slate-400">kg</span>
          </p>
          <span className="text-[11px] text-slate-500">
            {toTarget > 0 ? `${toTarget} kg to go` : 'Goal reached! 🎉'}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Change
          </span>
          <div className="flex items-center gap-1.5 mt-1 font-mono">
            {weightChange < 0 ? (
              <TrendingDown className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingUp className="w-5 h-5 text-amber-400" />
            )}
            <p className={`text-2xl font-black ${weightChange < 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
              {weightChange > 0 ? `+${weightChange}` : weightChange} kg
            </p>
          </div>
          <span className="text-[11px] text-slate-500">Since starting</span>
        </div>
      </div>

      {/* SVG Trend Line Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Progress Over Time
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Target Line: <strong className="text-emerald-400">{targetWeight} kg</strong>
          </span>
        </div>

        {points.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 sm:h-56"
            >
              <defs>
                <linearGradient id="weightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Target baseline dash line */}
              <line
                x1="20"
                y1={chartHeight - ((targetWeight - minWeight) / range) * (chartHeight - 40) - 20}
                x2={chartWidth - 20}
                y2={chartHeight - ((targetWeight - minWeight) / range) * (chartHeight - 40) - 20}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                opacity="0.4"
              />

              {/* Progress Line */}
              {points.length > 1 && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    className="fill-emerald-400 stroke-slate-950 stroke-2"
                  />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-300 font-mono font-bold"
                  >
                    {p.weightKg}kg
                  </text>
                  <text
                    x={p.x}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-500 font-mono"
                  >
                    {p.date.substring(5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            Log your first weigh-in above to visualize your trend.
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-6 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Weigh-In Records ({weightLogs.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-800/80">
          {[...sortedLogs].reverse().map((entry) => (
            <div
              key={entry.id}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">{entry.date}</span>
                  {entry.notes && (
                    <span className="text-xs text-slate-400 italic">"{entry.notes}"</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-black font-mono text-emerald-400">
                  {entry.weightKg} kg
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Weigh-In Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Log Weigh-In</h3>
            <p className="text-xs text-slate-400 mb-6">
              Track your weight consistently, ideally at the same time in the morning.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Post-workout, after morning hydration"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
                >
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
