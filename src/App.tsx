/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { OnboardingWizard } from './components/OnboardingWizard';
import { LoginPage } from './pages/LoginPage';
import { ForceChangePasswordPage } from './pages/ForceChangePasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { FoodLogPage } from './pages/FoodLogPage';
import { AnalyzePhotoPage } from './pages/AnalyzePhotoPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { MealRecommendationsPage } from './pages/MealRecommendationsPage';
import { WeightPage } from './pages/WeightPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { FoodLogEntry, MealType } from './types';
import { Flame, RefreshCw } from 'lucide-react';

function AppContent() {
  const { currentUser, userProfile, userAccount, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
  const [quickAddMealType, setQuickAddMealType] = useState<MealType>('breakfast');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/25 animate-pulse">
          <Flame className="w-7 h-7 text-slate-950 stroke-[2.5]" />
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono">
          Loading NutriTrack AI...
        </p>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  // First time login / Temporary password -> Must change password first!
  if (userAccount?.mustChangePassword || userAccount?.isFirstLogin) {
    return <ForceChangePasswordPage />;
  }

  // First time login -> Show 6-step Onboarding Wizard if profile is not completed
  if (userAccount?.role === 'USER' && (!userProfile || !userProfile.isProfileComplete)) {
    return <OnboardingWizard />;
  }

  // Navigation handlers
  const handleOpenQuickAdd = (mealType: MealType = 'breakfast') => {
    setQuickAddMealType(mealType);
    setEditingEntry(null);
    setCurrentTab('food-log');
  };

  const handleEditEntry = (entry: FoodLogEntry) => {
    setEditingEntry(entry);
    setCurrentTab('food-log');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <DashboardPage
            onNavigate={setCurrentTab}
            onOpenQuickAdd={handleOpenQuickAdd}
            onEditEntry={handleEditEntry}
          />
        )}

        {currentTab === 'food-log' && (
          <FoodLogPage
            initialMealType={quickAddMealType}
            editingEntry={editingEntry}
            onClearEditing={() => setEditingEntry(null)}
          />
        )}

        {currentTab === 'analyze-photo' && (
          <AnalyzePhotoPage onFoodLogged={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'ai-assistant' && <AiAssistantPage />}

        {currentTab === 'meal-recommendations' && (
          <MealRecommendationsPage
            onAskAi={(question) => {
              setCurrentTab('ai-assistant');
            }}
            onMealLogged={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'weight' && <WeightPage />}

        {currentTab === 'history' && <HistoryPage />}

        {currentTab === 'profile' && <ProfilePage />}

        {currentTab === 'admin-dashboard' && <AdminDashboardPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
