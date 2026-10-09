/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import { FOOD_DATABASE, searchFoods } from '../data/foodDatabase';
import { DatabaseFoodItem, FoodLogEntry, MealType } from '../types';
import { calculateDailyTotals } from '../services/nutritionCalculator';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface FoodLogPageProps {
  initialMealType?: MealType;
  editingEntry?: FoodLogEntry | null;
  onClearEditing?: () => void;
}

export const FoodLogPage: React.FC<FoodLogPageProps> = ({
  initialMealType = 'breakfast',
  editingEntry = null,
  onClearEditing,
}) => {
  const { currentUser } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Form Fields
  const [editingId, setEditingId] = useState<string | null>(null);
  const [foodName, setFoodName] = useState('');
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [servingSize, setServingSize] = useState<number>(1);
  const [unit, setUnit] = useState('serving');
  const [calories, setCalories] = useState<number>(300);
  const [protein, setProtein] = useState<number>(20);
  const [carbohydrates, setCarbohydrates] = useState<number>(30);
  const [fat, setFat] = useState<number>(10);
  const [fiber, setFiber] = useState<number>(2);
  const [time, setTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<'manual' | 'database' | 'ai_photo'>('manual');

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = DataService.subscribeFoodLogs(currentUser.uid, selectedDate, (list) => {
      setEntries(list);
    });
    return () => unsub();
  }, [currentUser?.uid, selectedDate]);

  useEffect(() => {
    if (editingEntry) {
      setEditingId(editingEntry.id);
      setFoodName(editingEntry.foodName);
      setMealType(editingEntry.mealType);
      setServingSize(editingEntry.servingSize);
      setUnit(editingEntry.unit);
      setCalories(editingEntry.calories);
      setProtein(editingEntry.protein);
      setCarbohydrates(editingEntry.carbohydrates);
      setFat(editingEntry.fat);
      setFiber(editingEntry.fiber || 0);
      setTime(editingEntry.time);
      setNotes(editingEntry.notes || '');
      setSource(editingEntry.source as any);
      setModalOpen(true);
    }
  }, [editingEntry]);

  const handleSelectFromDatabase = (item: DatabaseFoodItem) => {
    setFoodName(item.name);
    setServingSize(1);
    setUnit(item.servingDescription);
    setCalories(item.calories);
    setProtein(item.protein);
    setCarbohydrates(item.carbohydrates);
    setFat(item.fat);
    setFiber(item.fiber);
    setSource('database');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid || !foodName.trim()) return;

    const entryToSave: FoodLogEntry = {
      id: editingId || `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.uid,
      date: selectedDate,
      time: time || '12:00',
      mealType,
      foodName: foodName.trim(),
      servingSize: Number(servingSize) || 1,
      unit: unit || 'serving',
      calories: Math.round(Number(calories) || 0),
      protein: Number((Number(protein) || 0).toFixed(1)),
      carbohydrates: Number((Number(carbohydrates) || 0).toFixed(1)),
      fat: Number((Number(fat) || 0).toFixed(1)),
      fiber: Number((Number(fiber) || 0).toFixed(1)),
      notes: notes.trim(),
      source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingId) {
      await DataService.updateFoodLog(entryToSave);
    } else {
      await DataService.addFoodLog(entryToSave);
    }

    closeModal();
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFoodName('');
    setNotes('');
    if (onClearEditing) onClearEditing();
  };

  const handleDelete = async (id: string) => {
    if (!currentUser?.uid) return;
    await DataService.deleteFoodLog(currentUser.uid, id);
  };

  const dailyTotals = calculateDailyTotals(entries);
  const databaseSearchResults = searchFoods(searchQuery, selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Daily Food Log</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log foods manually or choose from the built-in Asian & Filipino database
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setFoodName('');
              setMealType('breakfast');
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Food Entry
          </button>
        </div>
      </div>

      {/* Daily Summary Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Calories</span>
          <p className="text-xl font-black text-emerald-400 mt-0.5">{dailyTotals.calories} kcal</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-400">Total Protein</span>
          <p className="text-xl font-black text-white mt-0.5">{dailyTotals.protein} g</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-amber-400">Total Carbs</span>
          <p className="text-xl font-black text-white mt-0.5">{dailyTotals.carbohydrates} g</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-rose-400">Total Fat</span>
          <p className="text-xl font-black text-white mt-0.5">{dailyTotals.fat} g</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-teal-400">Total Fiber</span>
          <p className="text-xl font-black text-white mt-0.5">{dailyTotals.fiber} g</p>
        </div>
      </div>

      {/* Food Entries Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Logged Items ({entries.length})
          </h2>
          <span className="text-xs text-slate-400">{selectedDate}</span>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <BookOpen className="w-10 h-10 mx-auto text-slate-700 mb-3" />
            <p className="font-semibold text-slate-400">No food logged for this date</p>
            <p className="text-xs mt-1">Click "Add Food Entry" above to log your meals.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {entries.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:px-6 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.foodName}</span>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.mealType}
                    </span>
                    {item.source === 'ai_photo' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        AI Visual
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {item.servingSize} {item.unit} • Time: {item.time || '12:00'}
                    {item.notes && <span className="italic ml-2 text-slate-500">"{item.notes}"</span>}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <p className="text-sm font-black font-mono text-emerald-400">{item.calories} kcal</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      P: {item.protein}g | C: {item.carbohydrates}g | F: {item.fat}g
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setFoodName(item.foodName);
                        setMealType(item.mealType);
                        setServingSize(item.servingSize);
                        setUnit(item.unit);
                        setCalories(item.calories);
                        setProtein(item.protein);
                        setCarbohydrates(item.carbohydrates);
                        setFat(item.fat);
                        setFiber(item.fiber || 0);
                        setTime(item.time);
                        setNotes(item.notes || '');
                        setSource(item.source as any);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Food Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingId ? 'Edit Food Entry' : 'Log Food Entry'}
                </h3>
                <p className="text-xs text-slate-400">
                  Search the Filipino & Asian catalogue or type custom values
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Asian & Filipino Database Search Picker */}
            {!editingId && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Quick Search Food Catalogue
                  </span>
                  <div className="flex gap-1 text-[10px]">
                    {['All', 'Filipino', 'Asian', 'Grains', 'Proteins'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-0.5 rounded-md font-semibold ${selectedCategory === cat ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Chicken Adobo, Sinigang, Tapsilog, Rice, Sisig..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {searchQuery.trim() && (
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/80 border border-slate-800 rounded-xl">
                    {databaseSearchResults.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectFromDatabase(item)}
                        className="p-2.5 hover:bg-slate-800/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {item.servingDescription} • P: {item.protein}g | C: {item.carbohydrates}g | F: {item.fat}g
                          </p>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          {item.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Entry Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Food Name *</label>
                  <input
                    type="text"
                    required
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="e.g. Pork Sinigang with Kangkong"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Meal Type</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Serving Amount</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={servingSize}
                    onChange={(e) => setServingSize(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="serving, cup, grams"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Calories (kcal) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              {/* Macros Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-blue-400 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-400 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={carbohydrates}
                    onChange={(e) => setCarbohydrates(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-400 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={fat}
                    onChange={(e) => setFat(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-teal-400 mb-1">Fiber (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={fiber}
                    onChange={(e) => setFiber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Time Logged</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Optional Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Cooked with extra garlic, half cup rice"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                >
                  {editingId ? 'Save Changes' : 'Add to Food Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
