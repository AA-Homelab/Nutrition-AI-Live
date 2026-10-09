/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  LayoutDashboard,
  UtensilsCrossed,
  Camera,
  Sparkles,
  ChefHat,
  TrendingDown,
  History,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Database,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  highlight?: boolean;
  badge?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, userAccount, userProfile, isAdmin, isFirebaseLive, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const userNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'food-log', label: 'Food Log', icon: UtensilsCrossed },
    { id: 'analyze-photo', label: 'Analyze Photo', icon: Camera, highlight: true },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'meal-recommendations', label: 'Meal Ideas', icon: ChefHat },
    { id: 'weight', label: 'Weight', icon: TrendingDown },
    { id: 'history', label: 'History', icon: History },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'admin-dashboard', label: 'Admin Portal', icon: ShieldCheck, badge: 'ADMIN' },
  ];

  const navItems = isAdmin ? [...userNavItems, ...adminNavItems] : userNavItems;

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabClick('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Flame className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                  NutriTrack
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Smart Calorie & Macro Engine</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : item.highlight
                      ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                      : item.badge
                      ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-violet-600 px-1 py-0.2 rounded text-white ml-0.5">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action / User Profile */}
          <div className="flex items-center gap-3">
            {/* Backend connection indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border border-slate-800 bg-slate-950/60">
              <Database className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400">Backend:</span>
              {isFirebaseLive ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Cloud Firestore
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 font-semibold" title="Using local reactive store until Firebase keys are placed in .env">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Local Store (Ready)
                </span>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors border border-slate-800 bg-slate-900"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                  {userProfile?.fullName?.charAt(0) || userAccount?.displayName?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block pr-1">
                  <p className="text-xs font-medium text-slate-200 truncate max-w-[100px]">
                    {userProfile?.fullName || userAccount?.displayName || 'User'}
                  </p>
                  <span className={`text-[10px] font-semibold uppercase ${isAdmin ? 'text-violet-400' : 'text-emerald-400'}`}>
                    {userAccount?.role || 'USER'}
                  </span>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-50 divide-y divide-slate-800">
                  <div className="px-4 py-2.5">
                    <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{currentUser?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isAdmin ? 'bg-violet-500/20 text-violet-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {userAccount?.role}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        {userAccount?.status || 'active'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleTabClick('profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Nutrition Profile & Targets
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          handleTabClick('admin-dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-violet-300 hover:bg-slate-800"
                      >
                        <ShieldCheck className="w-4 h-4 text-violet-400" />
                        Admin User Management
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-600 px-1.5 py-0.5 rounded text-white ml-auto">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
